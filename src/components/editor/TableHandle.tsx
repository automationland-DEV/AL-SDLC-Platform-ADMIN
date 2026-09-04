import { useEffect, useState, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { useTranslation } from "../../i18n/useTranslation";

function getTablePosFromDOM(editor: Editor, tableEl: HTMLElement): number {
  let foundPos = -1;
  try {
    const pos = editor.view.posAtDOM(tableEl, 0);
    const $pos = editor.state.doc.resolve(pos);
    let d = $pos.depth;
    while (d > 0) {
      if ($pos.node(d).type.name === "table") {
        foundPos = $pos.before(d);
        break;
      }
      d--;
    }
  } catch {
    // ignore
  }

  if (foundPos === -1) {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "table" && foundPos === -1) {
        const dom = editor.view.nodeDOM(pos);
        if (dom === tableEl || (dom instanceof HTMLElement && dom.contains(tableEl))) {
          foundPos = pos;
          return false; 
        }
      }
    });
  }
  return foundPos;
}

export function TableHandle({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation();
  const [posStyles, setPosStyles] = useState<{ top: number; left: number } | null>(null);
  const [tablePos, setTablePos] = useState<number | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editor || !editor.isEditable) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tableEl = target.closest("table");
      const isHoveringHandle = target.closest(".table-handle-button");

      if ((tableEl && editor.view.dom.contains(tableEl)) || isHoveringHandle) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        if (tableEl && !isHoveringHandle) {
          const container = editor.view.dom.closest(".page-canvas-sheet") as HTMLElement || editor.view.dom;
          const tableRect = tableEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          const top = tableRect.top - containerRect.top;
          const left = tableRect.left - containerRect.left;

          setPosStyles({
            top: top - 12,
            left: left - 28, 
          });

          const pos = getTablePosFromDOM(editor, tableEl);
          if (pos > -1) {
            setTablePos(pos);
          }
        }
      } else {
        if (!hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            setPosStyles(null);
            setTablePos(null);
          }, 150);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [editor]);

  if (!posStyles || tablePos === null) return null;

  const handleSelectTable = () => {
    if (!editor) return;
    try {
      editor.commands.setNodeSelection(tablePos);
    } catch (e) {
      console.error("Could not select table", e);
    }
  };

  return (
    <div
      className="table-handle-button absolute z-50 flex items-center justify-center w-[24px] h-[24px] bg-white border border-gray-300 rounded shadow-md cursor-pointer hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all hover:shadow-lg"
      style={{ top: posStyles.top, left: posStyles.left }}
      onMouseDown={(e) => {
        e.preventDefault(); 
        e.stopPropagation();
        handleSelectTable();
      }}
      title={t('tableHandle.selectTable')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 6c0-1.1-.9-2-2-2S6 4.9 6 6s.9 2 2 2 2-.9 2-2zm0 6c0-1.1-.9-2-2-2S6 10.9 6 12s.9 2 2 2 2-.9 2-2zm0 6c0-1.1-.9-2-2-2S6 16.9 6 18s.9 2 2 2 2-.9 2-2zm8-12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm0 6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm0 6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z"/>
      </svg>
    </div>
  );
}
