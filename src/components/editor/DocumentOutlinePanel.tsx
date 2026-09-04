import { useState, useMemo, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  ListTree,
  PanelLeftClose,
  Search,
  BookOpen,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";

interface OutlineHeading {
  id: string;
  text: string;
  level: number;
  pos: number;
}

interface DocumentOutlinePanelProps {
  editor: Editor | null;
  onClose: () => void;
  className?: string;
}

export default function DocumentOutlinePanel({
  editor,
  onClose,
  className = "w-64 sm:w-72 shrink-0 border-r border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#202020] flex flex-col h-full z-10 transition-all duration-200 shadow-xs print:hidden",
}: DocumentOutlinePanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Extract headings from editor with stable IDs
  const headings = useMemo(() => {
    if (!editor || editor.isDestroyed) return [];
    const list: OutlineHeading[] = [];
    const occurrences = new Map<string, number>();

    try {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const text = node.textContent.trim();
          if (text) {
            const level = node.attrs.level || 1;
            const key = `h-${level}-${text}`;
            const count = occurrences.get(key) || 0;
            occurrences.set(key, count + 1);

            list.push({
              id: `${key}-${count}`,
              text,
              level,
              pos,
            });
          }
        }
      });
    } catch {
      // ignore
    }
    return list;
  }, [editor]);

  // Determine which headings have children (sub-headings)
  const parentHeadings = useMemo(() => {
    return headings.filter(
      (_, idx) => idx + 1 < headings.length && headings[idx + 1].level > headings[idx].level
    );
  }, [headings]);

  const allCollapsed =
    parentHeadings.length > 0 &&
    parentHeadings.every((h) => collapsedIds.has(h.id));

  const toggleCollapseAll = () => {
    if (allCollapsed) {
      setCollapsedIds(new Set());
    } else {
      setCollapsedIds(new Set(parentHeadings.map((h) => h.id)));
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Check if a heading is hidden because an ancestor heading is collapsed
  const isHeadingHidden = useCallback((index: number): boolean => {
    if (search.trim()) return false;
    let currentLevel = headings[index].level;
    for (let j = index - 1; j >= 0; j--) {
      const prev = headings[j];
      if (prev.level < currentLevel) {
        if (collapsedIds.has(prev.id)) {
          return true;
        }
        currentLevel = prev.level;
        if (currentLevel <= 1) break;
      }
    }
    return false;
  }, [headings, collapsedIds, search]);

  // Visible items when not filtering by search
  const visibleHeadings = useMemo(() => {
    return headings
      .map((heading, index) => {
        const hasChild =
          index + 1 < headings.length &&
          headings[index + 1].level > heading.level;
        const isCollapsed = collapsedIds.has(heading.id);
        const isHidden = isHeadingHidden(index);
        return {
          heading,
          index,
          hasChild,
          isCollapsed,
          isHidden,
        };
      })
      .filter((item) => !item.isHidden);
  }, [headings, collapsedIds, isHeadingHidden]);

  // Search filtered items
  const filteredHeadings = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return headings
      .map((heading, index) => ({
        heading,
        index,
        hasChild:
          index + 1 < headings.length &&
          headings[index + 1].level > heading.level,
        isCollapsed: collapsedIds.has(heading.id),
      }))
      .filter((item) => item.heading.text.toLowerCase().includes(q));
  }, [headings, search, collapsedIds]);

  const itemsToDisplay = search.trim() ? filteredHeadings : visibleHeadings;

  const handleHeadingClick = (heading: OutlineHeading) => {
    if (!editor) return;
    try {
      const domNode = editor.view.nodeDOM(heading.pos) as HTMLElement | null;
      if (domNode && typeof domNode.scrollIntoView === "function") {
        domNode.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    } catch {
      // fallback
    }

    const editorEl = editor.view.dom;
    const headingElements = editorEl.querySelectorAll(`h${heading.level}`);
    for (let i = 0; i < headingElements.length; i++) {
      const el = headingElements[i] as HTMLElement;
      if (el.textContent?.trim() === heading.text) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  };

  const getIndentPadding = (level: number) => {
    return `${Math.max(0, level - 1) * 14 + 4}px`;
  };

  return (
    <aside className={className}>
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-[#EAEAEA] dark:border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ListTree className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider truncate">
            {t("outline.title")}
          </span>
          {headings.length > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-semibold rounded-full shrink-0">
              {headings.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {parentHeadings.length > 0 && !search.trim() && (
            <button
              type="button"
              onClick={toggleCollapseAll}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={allCollapsed ? t("outline.expandAll") : t("outline.collapseAll")}
            >
              {allCollapsed ? (
                <ChevronsUpDown className="w-4 h-4" />
              ) : (
                <ChevronsDownUp className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={t("outline.closePanel")}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter / Search if more than 4 headings */}
      {headings.length > 4 && (
        <div className="p-2 border-b border-[#EAEAEA] dark:border-white/[0.08] shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("outline.searchPlaceholder")}
              className="w-full pl-8 pr-6 py-1 text-xs bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {headings.length === 0 ? (
          <div className="p-6 text-center text-gray-400 dark:text-gray-500 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto opacity-40 stroke-1" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {t("outline.empty")}
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t("outline.emptyDesc")}
            </p>
          </div>
        ) : search.trim() && filteredHeadings.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            {t("outline.noMatch")}
          </div>
        ) : (
          itemsToDisplay.map(({ heading, hasChild, isCollapsed }) => (
            <div
              key={heading.id}
              style={{ paddingLeft: getIndentPadding(heading.level) }}
              onClick={() => handleHeadingClick(heading)}
              className="w-full flex items-start gap-1 rounded-md hover:bg-blue-50/80 dark:hover:bg-blue-950/40 group transition-colors pr-2 py-1 cursor-pointer"
            >
              {/* Triangle toggle button for collapsible headings */}
              {hasChild ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse(heading.id);
                  }}
                  className="p-1 -ml-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded transition-all shrink-0 mt-0.5 cursor-pointer"
                  title={
                    isCollapsed
                      ? t("outline.expandSubheadings")
                      : t("outline.collapseSubheadings")
                  }
                >
                  <svg
                    viewBox="0 0 16 16"
                    className={`w-2.5 h-2.5 fill-current transition-transform duration-150 ${
                      isCollapsed
                        ? "-rotate-90 text-gray-400 dark:text-gray-500"
                        : "rotate-0 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <path d="M4 6l4 4 4-4z" />
                  </svg>
                </button>
              ) : (
                <span className="w-4.5 shrink-0" />
              )}

              {/* Level indicator badge */}
              <span className="shrink-0 mt-0.5 text-[9px] font-mono font-bold text-gray-400 group-hover:text-blue-500 px-1 py-0.2 bg-gray-100 dark:bg-white/10 rounded">
                H{heading.level}
              </span>

              {/* Heading title */}
              <span
                className={`truncate flex-1 leading-snug select-none ${
                  heading.level === 1
                    ? "text-xs font-semibold text-gray-900 dark:text-white"
                    : heading.level === 2
                    ? "text-xs font-medium text-gray-800 dark:text-gray-200"
                    : "text-xs text-gray-600 dark:text-gray-400"
                }`}
                title={heading.text}
              >
                {heading.text}
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
