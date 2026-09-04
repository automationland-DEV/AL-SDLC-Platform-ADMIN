import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const PAGE_HEIGHT = 1123;
const MARGIN_TOP = 38;
const MARGIN_LEFT = 113;
const MARGIN_RIGHT = 76;
const CONTENT_MARGIN_TOP = 57;
const CONTENT_MARGIN_BOTTOM = 57;
const PAGE_GAP = 24;
const PRINTABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - 38 - CONTENT_MARGIN_TOP - CONTENT_MARGIN_BOTTOM;

function buildPageSeparator(pageIndex: number): HTMLElement {
  const sep = document.createElement("div");
  sep.className = "ag-page-separator";
  sep.dataset.page = String(pageIndex);
  sep.style.cssText = `width:calc(100% + ${MARGIN_LEFT}px + ${MARGIN_RIGHT}px);margin-left:-${MARGIN_LEFT}px;margin-right:-${MARGIN_RIGHT}px;height:${PAGE_GAP}px;background:#F1F3F4;border-top:1px solid #D1D5DB;border-bottom:1px solid #D1D5DB;position:relative;display:block;pointer-events:none;box-sizing:border-box;`;
  return sep;
}

const paginationKey = new PluginKey("agPagination");

export const AGPaginationExtension = Extension.create({
  name: "agPagination",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: paginationKey,
        state: {
          init: () => ({ pageCount: 1 }),
          apply: (tr, value) => {
            const meta = tr.getMeta(paginationKey);
            if (meta && typeof meta.pageCount === "number") {
              return { pageCount: meta.pageCount };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state) as { pageCount: number };
            if (!pluginState) return DecorationSet.empty;
            const { pageCount } = pluginState;
            const decorations: Decoration[] = [];
            for (let i = 1; i < pageCount; i++) {
              const sep = buildPageSeparator(i);
              decorations.push(
                Decoration.widget(0, () => sep, { side: 0, key: `page-sep-${i}` })
              );
            }
            return DecorationSet.create(state.doc, decorations);
          },
        },
        view(editorView) {
          let rafId: number | null = null;
          let lastPageCount = 1;

          const recalculate = () => {
            const dom = editorView.dom;
            if (!dom || !dom.isConnected) return;
            const editorRect = dom.getBoundingClientRect();
            if (editorRect.height === 0) return;

            const children = Array.from(dom.children).filter(
              (el) => !el.classList.contains("ag-page-separator")
            );

            dom.style.setProperty("min-height", `${PAGE_HEIGHT}px`, "important");

            if (children.length === 0) {
              if (lastPageCount !== 1) {
                lastPageCount = 1;
                const tr = editorView.state.tr.setMeta(paginationKey, { pageCount: 1 });
                editorView.dispatch(tr);
              }
              return;
            }

            const lastChild = children[children.length - 1];
            const lastChildRect = lastChild.getBoundingClientRect();
            const contentBottom = lastChildRect.bottom - editorRect.top;

            const firstPagePrintableEnd = MARGIN_TOP + CONTENT_MARGIN_TOP + PRINTABLE_HEIGHT;
            let newPageCount = 1;
            if (contentBottom > firstPagePrintableEnd) {
              const overflow = contentBottom - firstPagePrintableEnd;
              newPageCount = 1 + Math.ceil(overflow / PRINTABLE_HEIGHT);
            }
            newPageCount = Math.max(1, newPageCount);

            const totalHeight = newPageCount * PAGE_HEIGHT + (newPageCount - 1) * PAGE_GAP;
            dom.style.setProperty("min-height", `${totalHeight}px`, "important");

            if (newPageCount !== lastPageCount) {
              lastPageCount = newPageCount;
              const tr = editorView.state.tr.setMeta(paginationKey, { pageCount: newPageCount });
              editorView.dispatch(tr);
            }
          };

          const scheduleRecalc = () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(recalculate);
          };

          scheduleRecalc();

          const observer = new MutationObserver(scheduleRecalc);
          observer.observe(editorView.dom, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["style", "class"],
          });
          window.addEventListener("resize", scheduleRecalc);

          return {
            update() { scheduleRecalc(); },
            destroy() {
              if (rafId !== null) cancelAnimationFrame(rafId);
              observer.disconnect();
              window.removeEventListener("resize", scheduleRecalc);
            },
          };
        },
      }),
    ];
  },
});
