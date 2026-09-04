import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { PAGE_HEIGHT, PAGE_GAP } from "./pageConfig";
import { useEditorStore } from "../../stores/useEditorStore";

export const FullPagePaginationSync = Extension.create({
  name: "fullPagePaginationSync",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("fullPagePaginationSync"),
        view(editorView) {
          const syncHeight = () => {
            const dom = editorView.dom;
            if (!dom || editorView.isDestroyed) return;
            const PAGE_CYCLE = PAGE_HEIGHT + PAGE_GAP;
            const editorRect = dom.getBoundingClientRect();

            // 1. Automatic pagination from tiptap-pagination-plus
            const paginationEl = dom.querySelector("[data-rm-pagination]");
            const pageBreaks = dom.querySelectorAll(".rm-page-break");
            let count = Math.max(
              1,
              paginationEl ? paginationEl.children.length : pageBreaks.length
            );

            // 2. Manual page breaks (.doc-page-break-node or [data-type="page-break"])
            const manualBreaks = dom.querySelectorAll(
              ".doc-page-break-node, [data-type='page-break']"
            );
            manualBreaks.forEach((b) => {
              const bRect = b.getBoundingClientRect();
              const offsetY = bRect.top - editorRect.top;
              const pageIndex = Math.max(0, Math.floor(offsetY / PAGE_CYCLE));
              count = Math.max(count, pageIndex + 2);
            });

            // 3. Any content extending past current page bounds
            const allChildren = dom.children;
            if (allChildren.length > 0) {
              const lastEl = allChildren[allChildren.length - 1];
              const lastBottom = lastEl.getBoundingClientRect().bottom - editorRect.top;
              if (lastBottom > 0) {
                const pagesByHeight = Math.max(1, Math.ceil(lastBottom / PAGE_CYCLE));
                count = Math.max(count, pagesByHeight);
              }
            }

            // Sync with global store so PageCanvas renders the exact number of discrete sheets
            const currentStoreCount = useEditorStore.getState().pageCount;
            if (currentStoreCount !== count) {
              useEditorStore.getState().setPageCount(count);
            }

            const totalHeight =
              count * PAGE_HEIGHT + (count - 1) * PAGE_GAP;
            const heightStr = `${totalHeight}px`;
            if (dom.style.getPropertyValue("min-height") !== heightStr) {
              dom.style.setProperty("min-height", heightStr, "important");
            }
            if (dom.style.height) dom.style.removeProperty("height");
            if (dom.style.maxHeight) dom.style.removeProperty("max-height");
          };

          requestAnimationFrame(syncHeight);

          const observer = new MutationObserver(() => {
            syncHeight();
          });

          observer.observe(editorView.dom, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class"],
          });

          window.addEventListener("resize", syncHeight);

          return {
            update() {
              requestAnimationFrame(syncHeight);
            },
            destroy() {
              observer.disconnect();
              window.removeEventListener("resize", syncHeight);
            },
          };
        },
      }),
    ];
  },
});
