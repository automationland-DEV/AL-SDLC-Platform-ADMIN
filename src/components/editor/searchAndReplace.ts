// Defines SearchAndReplace extension for the document editor,
// enabling Vietnamese accent-insensitive search, replace, and active match navigation.
/* eslint-disable no-useless-escape */
import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchAndReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setReplaceTerm: (term: string) => ReturnType;
      setCurrentIndex: (index: number) => ReturnType;
      setCaseSensitive: (caseSensitive: boolean) => ReturnType;
      setMatchDiacritics: (matchDiacritics: boolean) => ReturnType;
      replace: () => ReturnType;
      replaceAll: () => ReturnType;
    };
  }
}

export interface SearchAndReplaceOptions {
  searchResultClass: string;
  searchResultActiveClass: string;
  caseSensitive: boolean;
  matchDiacritics: boolean;
}

// Build regex with Vietnamese tone/diacritic support
export function buildSearchRegex(
  term: string,
  caseSensitive = false,
  matchDiacritics = false
): RegExp | null {
  if (!term || !term.trim()) return null;

  if (matchDiacritics) {
    const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    return new RegExp(escaped, caseSensitive ? "g" : "gi");
  }

  // Accent-insensitive matching for Vietnamese
  const VIETNAMESE_PATTERNS: Record<string, string> = {
    a: "[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ][\\u0300-\\u036f]*",
    d: "[dđDĐ]",
    e: "[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ][\\u0300-\\u036f]*",
    i: "[iìíỉĩịIÌÍỈĨỊ][\\u0300-\\u036f]*",
    o: "[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ][\\u0300-\\u036f]*",
    u: "[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ][\\u0300-\\u036f]*",
    y: "[yỳýỷỹỵYỲÝỶỸỴ][\\u0300-\\u036f]*",
  };

  let pattern = "";
  for (let i = 0; i < term.length; i++) {
    const ch = term[i];
    if (/\s/.test(ch)) {
      pattern += "\\s+";
      continue;
    }

    // Strip tone marks to get base vowel
    const base = ch
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase();

    if (VIETNAMESE_PATTERNS[base]) {
      pattern += VIETNAMESE_PATTERNS[base];
    } else if (/[-\/\\^$*+?.()|[\]{}]/.test(ch)) {
      pattern += `\\${ch}`;
    } else {
      pattern += ch;
    }
  }

  try {
    return new RegExp(pattern, caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}

export const SearchAndReplace = Extension.create<SearchAndReplaceOptions>({
  name: "searchAndReplace",

  addOptions() {
    return {
      searchResultClass: "search-result bg-yellow-200 text-black dark:bg-yellow-800/80 dark:text-white px-0.5 rounded-xs transition-colors",
      searchResultActiveClass: "search-result search-result-active bg-amber-400 text-black dark:bg-amber-400 dark:text-black font-semibold ring-2 ring-orange-500 rounded-xs shadow-xs transition-colors",
      caseSensitive: false,
      matchDiacritics: false,
    };
  },

  addStorage() {
    return {
      searchTerm: "",
      replaceTerm: "",
      currentIndex: 0,
      caseSensitive: false,
      matchDiacritics: false,
      results: [] as { from: number; to: number }[],
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ view }) => {
          this.storage.searchTerm = term;
          this.storage.currentIndex = 0;
          view.dispatch(view.state.tr.setMeta("searchAndReplace", true));
          return true;
        },
      setReplaceTerm:
        (term: string) =>
        () => {
          this.storage.replaceTerm = term;
          return true;
        },
      setCurrentIndex:
        (index: number) =>
        ({ view }) => {
          this.storage.currentIndex = index;
          view.dispatch(view.state.tr.setMeta("searchAndReplace", true));
          return true;
        },
      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ view }) => {
          this.storage.caseSensitive = caseSensitive;
          view.dispatch(view.state.tr.setMeta("searchAndReplace", true));
          return true;
        },
      setMatchDiacritics:
        (matchDiacritics: boolean) =>
        ({ view }) => {
          this.storage.matchDiacritics = matchDiacritics;
          view.dispatch(view.state.tr.setMeta("searchAndReplace", true));
          return true;
        },
      replace:
        () =>
        ({ state, dispatch }) => {
          const { replaceTerm, results, currentIndex } = this.storage;
          if (results.length === 0) return false;

          const targetIdx = Math.min(Math.max(0, currentIndex || 0), results.length - 1);
          const current = results[targetIdx];
          if (current && dispatch) {
            const tr = state.tr.insertText(replaceTerm || "", current.from, current.to);
            dispatch(tr);
            return true;
          }
          return false;
        },
      replaceAll:
        () =>
        ({ state, dispatch }) => {
          const { replaceTerm, results } = this.storage;
          if (results.length === 0) return false;

          if (dispatch) {
            let tr = state.tr;
            // Sort in reverse order to avoid shifting positions
            const sortedResults = [...results].sort((a, b) => b.from - a.from);
            sortedResults.forEach((match) => {
              tr = tr.insertText(replaceTerm || "", match.from, match.to);
            });
            dispatch(tr);
            return true;
          }
          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey("searchAndReplace"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr) {
            const searchTerm = storage.searchTerm;
            if (!searchTerm || !searchTerm.trim()) {
              storage.results = [];
              storage.currentIndex = 0;
              return DecorationSet.empty;
            }

            const { doc } = tr;
            const decorations: Decoration[] = [];
            const results: { from: number; to: number }[] = [];
            const regex = buildSearchRegex(
              searchTerm,
              storage.caseSensitive ?? options.caseSensitive,
              storage.matchDiacritics ?? options.matchDiacritics
            );

            if (!regex) {
              storage.results = [];
              return DecorationSet.empty;
            }

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                let match;
                regex.lastIndex = 0;
                while ((match = regex.exec(node.text)) !== null) {
                  const from = pos + match.index;
                  const to = from + match[0].length;
                  results.push({ from, to });
                  if (!regex.global) break;
                }
              }
            });

            storage.results = results;
            const activeIdx = Math.min(
              Math.max(0, storage.currentIndex || 0),
              Math.max(0, results.length - 1)
            );

            results.forEach((match, idx) => {
              const isActive = idx === activeIdx;
              decorations.push(
                Decoration.inline(
                  match.from,
                  match.to,
                  {
                    class: isActive
                      ? options.searchResultActiveClass
                      : options.searchResultClass,
                    "data-search-index": `${idx}`,
                  }
                )
              );
            });

            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
