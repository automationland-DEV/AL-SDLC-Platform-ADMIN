"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { Search, Replace, X, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";

interface FindReplacePanelProps {
  editor: Editor | null;
  onClose: () => void;
}

type SearchStorage = {
  searchAndReplace?: {
    results?: { from: number; to: number }[];
  };
};

export default function FindReplacePanel({ editor, onClose }: FindReplacePanelProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchCase, setMatchCase] = useState(false);
  const [matchDiacritics, setMatchDiacritics] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const navigateToMatch = useCallback((targetIdx: number, cachedResults?: { from: number; to: number }[]) => {
    if (!editor || editor.isDestroyed) return;
    try {
      const storage = editor.storage as unknown as SearchStorage;
      const results = cachedResults || storage.searchAndReplace?.results || [];
      if (results.length === 0) return;

      const validIdx = ((targetIdx % results.length) + results.length) % results.length;
      setCurrentIndex(validIdx);

      // Tell extension to highlight the active match
      editor.commands.setCurrentIndex(validIdx);

      // Set text selection to the match
      const match = results[validIdx];
      if (match) {
        editor.commands.setTextSelection({ from: match.from, to: match.to });
      }

      // Smoothly scroll the matching element into view
      requestAnimationFrame(() => {
        const dom = editor.view.dom;
        const targetEl = dom.querySelector(`[data-search-index="${validIdx}"]`) as HTMLElement | null;
        if (targetEl && typeof targetEl.scrollIntoView === "function") {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (match) {
          // Fallback scroll using coordinates
          const coords = editor.view.coordsAtPos(match.from);
          const scrollParent = dom.closest(".overflow-y-auto") as HTMLElement | null;
          if (scrollParent && coords) {
            const parentRect = scrollParent.getBoundingClientRect();
            const offset = coords.top - parentRect.top - parentRect.height / 2;
            scrollParent.scrollBy({ top: offset, behavior: "smooth" });
          }
        }
      });
    } catch {
      // fallback
    }
  }, [editor]);

  // Sync search, replace, and flags with TipTap extension
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    try {
      editor.commands.setSearchTerm(searchTerm);
      editor.commands.setReplaceTerm(replaceTerm);
      editor.commands.setCaseSensitive(matchCase);
      editor.commands.setMatchDiacritics(matchDiacritics);

      // Force a re-render of decorations
      editor.view.dispatch(editor.view.state.tr);

      // Get number of results from storage
      const storage = editor.storage as unknown as SearchStorage;
      const results = storage.searchAndReplace?.results || [];
      setMatchCount(results.length);

      if (results.length > 0 && searchTerm.trim()) {
        setCurrentIndex(0);
        setTimeout(() => {
          navigateToMatch(0, results);
        }, 30);
      } else {
        setCurrentIndex(-1);
      }
    } catch {
      // ignore
    }
  }, [searchTerm, replaceTerm, matchCase, matchDiacritics, editor, navigateToMatch]);

  // Clean search on unmount
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        try {
          editor.commands.setSearchTerm("");
          editor.view.dispatch(editor.view.state.tr);
        } catch {
          // ignore
        }
      }
    };
  }, [editor]);

  // Handle Escape key to close panel and return focus to editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        editor?.commands.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose, editor]);

  const handleNext = () => {
    if (matchCount > 0) {
      navigateToMatch(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (matchCount > 0) {
      navigateToMatch(currentIndex - 1);
    }
  };

  const handleReplace = () => {
    if (!editor || matchCount === 0) return;
    try {
      editor.commands.replace();
      setTimeout(() => {
        const storage = editor.storage as unknown as SearchStorage;
        const results = storage.searchAndReplace?.results || [];
        setMatchCount(results.length);
        if (results.length > 0) {
          const nextIdx = Math.min(currentIndex, results.length - 1);
          navigateToMatch(nextIdx, results);
        } else {
          setCurrentIndex(-1);
        }
      }, 50);
    } catch {
      // ignore
    }
  };

  const handleReplaceAll = () => {
    if (!editor || matchCount === 0) return;
    try {
      editor.commands.replaceAll();
      setTimeout(() => {
        setMatchCount(0);
        setCurrentIndex(-1);
      }, 50);
    } catch {
      // ignore
    }
  };

  return (
    <div className="absolute top-20 right-8 z-50 bg-white dark:bg-[#202020] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 w-[370px] flex flex-col gap-3 transition-all print:hidden animate-in fade-in-50 zoom-in-95 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          {t("findReplace.title")}
        </span>
        <button
          type="button"
          onClick={() => {
            onClose();
            editor?.commands.focus();
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          title={t("findReplace.close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Find Input */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t("findReplace.findLabel")}
          </label>
        </div>
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/40 focus-within:border-blue-500 transition-all bg-gray-50 dark:bg-[#181818]">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey) {
                  handlePrev();
                } else {
                  handleNext();
                }
              }
            }}
            placeholder={t("findReplace.findPlaceholder")}
            className="w-full text-xs border-none outline-none bg-transparent p-0 focus:ring-0 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
          />

          {/* Match Counter & Prev/Next buttons */}
          {searchTerm && (
            <div className="flex items-center gap-1 shrink-0 ml-1.5 text-gray-400">
              <span className="text-[10px] font-mono whitespace-nowrap px-1.5 py-0.5 bg-gray-200/60 dark:bg-white/10 rounded text-gray-600 dark:text-gray-300">
                {matchCount > 0 ? `${currentIndex + 1}/${matchCount}` : "0/0"}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                disabled={matchCount === 0}
                className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded text-gray-600 dark:text-gray-300 disabled:opacity-30 cursor-pointer transition-colors"
                title={t("findReplace.prevMatch")}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={matchCount === 0}
                className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded text-gray-600 dark:text-gray-300 disabled:opacity-30 cursor-pointer transition-colors"
                title={t("findReplace.nextMatch")}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replace Input */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {t("findReplace.replaceLabel")}
        </label>
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/40 focus-within:border-blue-500 transition-all bg-gray-50 dark:bg-[#181818]">
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleReplace();
              }
            }}
            placeholder={t("findReplace.replacePlaceholder")}
            className="w-full text-xs border-none outline-none bg-transparent p-0 focus:ring-0 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Options: Match Case & Match Diacritics */}
      <div className="flex items-center gap-4 text-[11px] text-gray-600 dark:text-gray-300 pt-0.5">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
          <input
            type="checkbox"
            checked={matchCase}
            onChange={(e) => setMatchCase(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
          />
          <span>{t("findReplace.matchCase")}</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
          <input
            type="checkbox"
            checked={matchDiacritics}
            onChange={(e) => setMatchDiacritics(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
          />
          <span>{t("findReplace.exactAccents")}</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end mt-1 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={handleReplace}
          disabled={matchCount === 0}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Replace className="w-3.5 h-3.5 text-gray-500" />
          <span>{t("findReplace.btnReplace")}</span>
        </button>
        <button
          type="button"
          onClick={handleReplaceAll}
          disabled={matchCount === 0}
          className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
        >
          {t("findReplace.btnReplaceAll")}
        </button>
      </div>
    </div>
  );
}
