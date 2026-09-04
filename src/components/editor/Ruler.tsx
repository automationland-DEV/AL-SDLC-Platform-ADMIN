import { useRef, useState, useEffect, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { getActiveTableInfo, updateAllTableColumnWidths, type TableInfo } from "./tableUtils";

const cmMarkers = Array.from({ length: 22 }, (_, i) => i);
const mmMarkers = Array.from({ length: 210 }, (_, i) => i);
const PAGE_WIDTH = 794;
const MINIMUM_SPACE = 100;
const MIN_COL_WIDTH = 25;
export const DEFAULT_LEFT_MARGIN = 113; // 3.0 cm
export const DEFAULT_RIGHT_MARGIN = 76; // 2.0 cm
export const DEFAULT_MARGIN = DEFAULT_LEFT_MARGIN;

interface RulerProps {
  leftMargin: number;
  rightMargin: number;
  onLeftMarginChange: (margin: number) => void;
  onRightMarginChange: (margin: number) => void;
  editor?: Editor | null;
}

interface DraggingColumnState {
  index: number;
  startX: number;
  initialWidths: number[];
  initialDividers: number[];
  currentDividerX: number;
  currentWidth: number;
  tablePos: number;
}

export default function Ruler({
  leftMargin,
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  editor,
}: RulerProps) {
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [draggingColumn, setDraggingColumn] = useState<DraggingColumnState | null>(null);
  const [rulerRect, setRulerRect] = useState<{ left: number; bottom: number } | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const draggingTableElRef = useRef<HTMLTableElement | null>(null);

  const refreshTableInfo = useCallback(() => {
    if (!editor || !rulerRef.current) {
      setTableInfo(null);
      return;
    }
    const container = rulerRef.current.querySelector("#ruler-container") as HTMLElement | null;
    if (!container) {
      setTableInfo(null);
      return;
    }
    const info = getActiveTableInfo(editor, container);
    setTableInfo(info);
  }, [editor]);

  // Sync table info on editor events, selection changes, and window resize/scroll
  useEffect(() => {
    refreshTableInfo();
    if (!editor) return;

    const handleUpdate = () => {
      // Use requestAnimationFrame so DOM has updated layout
      requestAnimationFrame(refreshTableInfo);
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    // Observe DOM mutations to catch live table column resizing from TipTap
    let observer: MutationObserver | null = null;
    if (editor.view.dom) {
      observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (const m of mutations) {
          if (
            m.type === "attributes" &&
            (m.attributeName === "width" || m.attributeName === "style") &&
            (m.target.nodeName === "COL" || m.target.nodeName === "TABLE" || m.target.nodeName === "TD" || m.target.nodeName === "TH")
          ) {
            shouldUpdate = true;
            break;
          }
        }
        if (shouldUpdate) {
          requestAnimationFrame(refreshTableInfo);
        }
      });
      observer.observe(editor.view.dom, {
        attributes: true,
        subtree: true,
        attributeFilter: ["width", "style"],
      });
    }

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
      observer?.disconnect();
    };
  }, [editor, refreshTableInfo]);

  // Margin dragging mouse move & mouse up
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingColumn && rulerRef.current) {
      const container = rulerRef.current.querySelector("#ruler-container") as HTMLElement | null;
      if (!container) return;
      const deltaX = e.clientX - draggingColumn.startX;
      const { index, initialWidths, initialDividers } = draggingColumn;
      const numCols = initialWidths.length;
      const maxTableRight = PAGE_WIDTH - rightMargin;
      const initialDivX = initialDividers[index];
      const maxLeftDelta = Math.max(0, initialWidths[index] - MIN_COL_WIDTH);

      let clampedDelta: number;
      const newWidths = [...initialWidths];

      if (index < numCols - 1) {
        const nextColSpare = Math.max(0, initialWidths[index + 1] - MIN_COL_WIDTH);
        if (deltaX <= nextColSpare) {
          clampedDelta = Math.max(-maxLeftDelta, deltaX);
          newWidths[index] = Math.round(initialWidths[index] + clampedDelta);
          newWidths[index + 1] = Math.round(initialWidths[index + 1] - clampedDelta);
        } else {
          // If next column cannot shrink further, push subsequent columns / table rightward!
          const maxPush = Math.max(0, maxTableRight - initialDividers[numCols - 1]);
          const extraPush = Math.min(maxPush, deltaX - nextColSpare);
          clampedDelta = nextColSpare + extraPush;
          newWidths[index] = Math.round(initialWidths[index] + clampedDelta);
          newWidths[index + 1] = MIN_COL_WIDTH;
        }
      } else {
        // Last column divider (resizing right boundary of entire table)
        const maxRightDelta = Math.max(0, maxTableRight - initialDivX);
        clampedDelta = Math.max(-maxLeftDelta, Math.min(maxRightDelta, deltaX));
        newWidths[index] = Math.round(initialWidths[index] + clampedDelta);
      }

      setDraggingColumn((prev) =>
        prev
          ? {
              ...prev,
              currentDividerX: initialDivX + clampedDelta,
              currentWidth: newWidths[index],
            }
          : null
      );

      // Instantly update DOM table cell widths for 60fps buttery smooth visual feedback
      const targetTableEl = draggingTableElRef.current;
      if (targetTableEl) {
        const colEls = targetTableEl.querySelectorAll("colgroup col");
        if (colEls.length > 0) {
          newWidths.forEach((w, i) => {
            if (colEls[i]) {
              (colEls[i] as HTMLElement).style.width = `${w}px`;
              (colEls[i] as HTMLElement).setAttribute("width", `${w}`);
            }
          });
          targetTableEl.style.width = `${newWidths.reduce((a, b) => a + b, 0)}px`;
        }
      }
      return;
    }

    const container = rulerRef.current?.querySelector("#ruler-container");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const rawPosition = Math.max(0, Math.min(PAGE_WIDTH, relativeX));

    if (isDraggingLeft) {
      const maxLeftPosition = PAGE_WIDTH - rightMargin - MINIMUM_SPACE;
      const newLeftPosition = Math.min(rawPosition, maxLeftPosition);
      onLeftMarginChange(Math.round(newLeftPosition));
    } else if (isDraggingRight) {
      const maxRightPosition = PAGE_WIDTH - (leftMargin + MINIMUM_SPACE);
      const newRightPosition = PAGE_WIDTH - rawPosition;
      const constrainedRightPosition = Math.min(newRightPosition, maxRightPosition);
      onRightMarginChange(Math.round(constrainedRightPosition));
    }
  }, [draggingColumn, rightMargin, isDraggingLeft, isDraggingRight, leftMargin, onLeftMarginChange, onRightMarginChange]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (draggingColumn && editor) {
      const deltaX = e.clientX - draggingColumn.startX;
      const { index, initialWidths, initialDividers, tablePos } = draggingColumn;
      const numCols = initialWidths.length;
      const maxTableRight = PAGE_WIDTH - rightMargin;
      const initialDivX = initialDividers[index];
      const maxLeftDelta = Math.max(0, initialWidths[index] - MIN_COL_WIDTH);

      let clampedDelta: number;
      const finalWidths = [...initialWidths];

      if (index < numCols - 1) {
        const nextColSpare = Math.max(0, initialWidths[index + 1] - MIN_COL_WIDTH);
        if (deltaX <= nextColSpare) {
          clampedDelta = Math.max(-maxLeftDelta, deltaX);
          finalWidths[index] = Math.round(initialWidths[index] + clampedDelta);
          finalWidths[index + 1] = Math.round(initialWidths[index + 1] - clampedDelta);
        } else {
          const maxPush = Math.max(0, maxTableRight - initialDividers[numCols - 1]);
          const extraPush = Math.min(maxPush, deltaX - nextColSpare);
          clampedDelta = nextColSpare + extraPush;
          finalWidths[index] = Math.round(initialWidths[index] + clampedDelta);
          finalWidths[index + 1] = MIN_COL_WIDTH;
        }
      } else {
        const maxRightDelta = Math.max(0, maxTableRight - initialDivX);
        clampedDelta = Math.max(-maxLeftDelta, Math.min(maxRightDelta, deltaX));
        finalWidths[index] = Math.round(initialWidths[index] + clampedDelta);
      }

      updateAllTableColumnWidths(editor, tablePos, finalWidths);
      draggingTableElRef.current = null;
      setRulerRect(null);
      setDraggingColumn(null);
      requestAnimationFrame(refreshTableInfo);
      return;
    }

    draggingTableElRef.current = null;
    setRulerRect(null);
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, [draggingColumn, editor, rightMargin, refreshTableInfo]);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight || draggingColumn) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDraggingLeft, isDraggingRight, draggingColumn, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={rulerRef}
      className="w-[794px] mx-auto h-6 border-b border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-[#252525]/80 backdrop-blur-xs flex items-end relative select-none print:hidden shadow-xs shrink-0"
    >
      <div id="ruler-container" className="w-full h-full relative">
        {/* Page Margin Markers */}
        <Marker
          position={leftMargin}
          isLeft={true}
          isDragging={isDraggingLeft}
          onMouseDown={() => setIsDraggingLeft(true)}
          onDoubleClick={() => onLeftMarginChange(DEFAULT_LEFT_MARGIN)}
        />
        <Marker
          position={rightMargin}
          isLeft={false}
          isDragging={isDraggingRight}
          onMouseDown={() => setIsDraggingRight(true)}
          onDoubleClick={() => onRightMarginChange(DEFAULT_RIGHT_MARGIN)}
        />

        {/* Table Column Dividers on Ruler when Table is active */}
        {tableInfo &&
          tableInfo.dividers.map((dividerX, idx) => {
            const isDraggingThis = draggingColumn?.index === idx;
            const currentX = isDraggingThis ? draggingColumn.currentDividerX : dividerX;
            const width = isDraggingThis
              ? draggingColumn.currentWidth
              : tableInfo.widths[idx] || 0;

            return (
              <ColumnDividerMarker
                key={`table-col-${idx}`}
                position={currentX}
                isDragging={isDraggingThis}
                colIndex={idx}
                width={width}
                isLast={idx === tableInfo.dividers.length - 1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const container = rulerRef.current?.querySelector("#ruler-container");
                  const rect = container?.getBoundingClientRect();
                  if (rect) {
                    setRulerRect({ left: rect.left, bottom: rect.bottom });
                  }
                  draggingTableElRef.current = tableInfo.tableEl;
                  setDraggingColumn({
                    index: idx,
                    startX: e.clientX,
                    initialWidths: [...tableInfo.widths],
                    initialDividers: [...tableInfo.dividers],
                    currentDividerX: dividerX,
                    currentWidth: tableInfo.widths[idx] || 0,
                    tablePos: tableInfo.tablePos,
                  });
                }}
              />
            );
          })}

        {/* Ruler ticks and cm numbers */}
        <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none overflow-hidden">
          <div className="relative h-full w-[794px]">
            {/* CM Numbers and Major Ticks */}
            {cmMarkers.map((cm) => {
              const position = (cm * PAGE_WIDTH) / 21;
              return (
                <div
                  key={`cm-${cm}`}
                  className="absolute bottom-0"
                  style={{ left: `${position}px` }}
                >
                  <div className="absolute bottom-0 w-[1px] h-2.5 bg-neutral-500 dark:bg-neutral-400" />
                  {cm > 0 && cm < 21 && (
                    <span className="absolute bottom-2.5 text-[9px] font-medium text-neutral-500 dark:text-neutral-400 transform -translate-x-1/2">
                      {cm}
                    </span>
                  )}
                </div>
              );
            })}
            {/* Minor Ticks */}
            {mmMarkers.map((mm) => {
              if (mm % 10 === 0) return null;
              const position = (mm * PAGE_WIDTH) / 210;
              const isHalf = mm % 5 === 0;
              return (
                <div
                  key={`mm-${mm}`}
                  className="absolute bottom-0"
                  style={{ left: `${position}px` }}
                >
                  <div
                    className={`absolute bottom-0 w-[1px] ${
                      isHalf
                        ? "h-1.5 bg-neutral-400 dark:bg-neutral-500"
                        : "h-1 bg-neutral-300 dark:bg-neutral-600"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guide line down entire screen during Table Column dragging */}
      {draggingColumn && rulerRect && (
        <div
          className="fixed pointer-events-none z-50 flex flex-col"
          style={{
            top: `${rulerRect.bottom}px`,
            bottom: 0,
            left: `${rulerRect.left + draggingColumn.currentDividerX}px`,
            width: "1px",
            borderLeft: "1px dashed #2563EB",
          }}
        />
      )}
    </div>
  );
}

interface MarkerProps {
  position: number;
  isLeft: boolean;
  isDragging: boolean;
  onMouseDown: () => void;
  onDoubleClick: () => void;
}

function Marker({
  position,
  isLeft,
  isDragging,
  onMouseDown,
  onDoubleClick,
}: MarkerProps) {
  return (
    <div
      className="absolute top-0 w-4 h-full cursor-ew-resize z-20 group -ml-2 select-none"
      style={{ [isLeft ? "left" : "right"]: `${position}px` }}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDoubleClick();
      }}
      title={`${isLeft ? "Lề trái" : "Lề phải"}: ${position}px (Click đúp để reset)`}
    >
      {/* Downward triangle marker */}
      <svg
        className="w-3.5 h-3.5 mx-auto fill-blue-600 dark:fill-blue-400 transition-transform group-hover:scale-110 drop-shadow-xs"
        viewBox="0 0 24 24"
      >
        <path d="M12 21L3 7h18l-9 14z" />
      </svg>

      {/* Guide line down entire screen during dragging */}
      {isDragging && (
        <div
          className="fixed top-0 bottom-0 pointer-events-none z-50"
          style={{
            left: isLeft
              ? `calc(${position}px + var(--canvas-offset-x, 0px))`
              : undefined,
            right: !isLeft
              ? `calc(${position}px + var(--canvas-offset-right, 0px))`
              : undefined,
            width: "1px",
            height: "100vh",
            backgroundColor: "#2563EB",
            boxShadow: "0 0 4px rgba(37,99,235,0.6)",
          }}
        />
      )}
    </div>
  );
}

interface ColumnDividerMarkerProps {
  position: number;
  isDragging: boolean;
  colIndex: number;
  width: number;
  isLast: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

function ColumnDividerMarker({
  position,
  isDragging,
  colIndex,
  width,
  isLast,
  onMouseDown,
}: ColumnDividerMarkerProps) {
  return (
    <div
      className="absolute top-0 h-full w-4 -ml-2 cursor-col-resize z-30 group flex flex-col items-center justify-end select-none"
      style={{ left: `${position}px` }}
      onMouseDown={onMouseDown}
      title={`${isLast ? "Biên phải bảng" : `Cột ${colIndex + 1}`}: ${width}px (Kéo để chỉnh độ rộng)`}
    >
      <div className="pb-[2px]">
        <div 
          className={`w-[12px] h-[12px] bg-white border border-gray-400 dark:border-gray-500 dark:bg-[#333] flex items-center justify-center transition-transform ${
            isDragging ? "border-blue-500 scale-110 drop-shadow-md" : "hover:border-blue-500 hover:scale-110 drop-shadow-xs"
          }`}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`${isDragging ? "text-blue-500" : "text-gray-400 dark:text-gray-400 group-hover:text-blue-500"}`}>
            <path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" />
          </svg>
        </div>
      </div>
    </div>
  );
}
