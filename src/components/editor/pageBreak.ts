import { Node, mergeAttributes } from "@tiptap/core";
import {
  PAGE_HEIGHT,
  PAGE_GAP,
  DEFAULT_MARGIN_TOP,
  DEFAULT_CONTENT_MARGIN_TOP,
} from "./pageConfig";
import { useEditorStore } from "../../stores/useEditorStore";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        class: "doc-page-break-node",
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain, state, editor }) => {
          const { selection } = state;
          const isParentEmpty = selection.$from.parent.content.size === 0;
          const isAtEndOfParent =
            selection.$from.parentOffset === selection.$from.parent.content.size;

          let res: boolean;
          if (isParentEmpty) {
            res = chain()
              .insertContent([
                { type: "paragraph" },
                { type: this.name },
                { type: "paragraph" },
              ])
              .run();
          } else if (isAtEndOfParent) {
            res = chain()
              .insertContent([
                { type: this.name },
                { type: "paragraph" },
              ])
              .run();
          } else {
            res = chain()
              .splitBlock()
              .insertContent({ type: this.name })
              .run();
          }

          requestAnimationFrame(() => {
            editor.commands.focus();
            const scrollContainer = editor.view.dom.closest(".overflow-y-auto") as HTMLElement | null;
            if (scrollContainer) {
              try {
                const coords = editor.view.coordsAtPos(editor.state.selection.from);
                if (coords) {
                  const containerRect = scrollContainer.getBoundingClientRect();
                  const targetScrollTop = scrollContainer.scrollTop + (coords.top - containerRect.top) - 120;
                  scrollContainer.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: "smooth",
                  });
                  return;
                }
              } catch {
                // fallback
              }
              editor.commands.scrollIntoView();
            }
          });

          return res;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setPageBreak(),
      "Ctrl-Enter": () => this.editor.commands.setPageBreak(),
    };
  },

  addNodeView() {
    return ({ editor }) => {
      let isInitial = true;
      const dom = document.createElement("div");
      dom.className = "doc-page-break-node";
      dom.setAttribute("data-type", "page-break");
      dom.setAttribute("contenteditable", "false");

      const indicator = document.createElement("div");
      indicator.className = "doc-page-break-indicator";
      indicator.title = "Ngắt trang (Nhấn Backspace hoặc Delete để xóa)";
      indicator.innerHTML = `<span>Ngắt trang</span>`;
      dom.appendChild(indicator);

      const updateHeight = () => {
        const editorDom = editor.view.dom;
        if (!editorDom || !dom.isConnected) return;

        const editorRect = editorDom.getBoundingClientRect();
        const nodeRect = dom.getBoundingClientRect();
        const offsetY = nodeRect.top - editorRect.top;

        const TOP_MARGIN = DEFAULT_MARGIN_TOP + DEFAULT_CONTENT_MARGIN_TOP; // 38 + 57 = 95
        const PAGE_CYCLE = PAGE_HEIGHT + PAGE_GAP; // 1123 + 24 = 1147

        const pageIndex = Math.max(0, Math.floor(offsetY / PAGE_CYCLE));
        const nextPageContentTop = (pageIndex + 1) * PAGE_CYCLE + TOP_MARGIN;
        const requiredHeight = Math.max(30, Math.round(nextPageContentTop - offsetY));

        if (dom.style.height !== `${requiredHeight}px`) {
          dom.style.height = `${requiredHeight}px`;
        }

        const requiredPages = pageIndex + 2;
        const currentCount = useEditorStore.getState().pageCount;
        if (currentCount < requiredPages) {
          useEditorStore.getState().setPageCount(requiredPages);
        }

        if (isInitial) {
          isInitial = false;
          requestAnimationFrame(() => {
            editor.commands.focus();
            const scrollContainer = editorDom.closest(".overflow-y-auto") as HTMLElement | null;
            if (scrollContainer) {
              const { from } = editor.state.selection;
              try {
                const coords = editor.view.coordsAtPos(from);
                if (coords) {
                  const containerRect = scrollContainer.getBoundingClientRect();
                  const targetScrollTop = scrollContainer.scrollTop + (coords.top - containerRect.top) - 120;
                  scrollContainer.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: "smooth",
                  });
                  return;
                }
              } catch {
                // fallback
              }
              editor.commands.scrollIntoView();
            }
          });
        }
      };

      requestAnimationFrame(updateHeight);
      window.addEventListener("resize", updateHeight);

      return {
        dom,
        update: () => {
          requestAnimationFrame(updateHeight);
          return true;
        },
        destroy: () => {
          window.removeEventListener("resize", updateHeight);
        },
      };
    };
  },
});

export default PageBreak;
