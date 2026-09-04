import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const ListMarkerSync = Extension.create({
  name: "listMarkerSync",

  addGlobalAttributes() {
    return [
      {
        types: ["listItem"],
        attributes: {
          markerStyle: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-marker-style"),
            renderHTML: (attributes) => {
              const styles: string[] = [];
              if (attributes.fontSize) styles.push(`font-size: ${attributes.fontSize}`);
              if (attributes.fontFamily) styles.push(`font-family: ${attributes.fontFamily}`);
              if (attributes.color) styles.push(`color: ${attributes.color}`);

              if (styles.length === 0) return {};
              return {
                style: styles.join("; "),
                "data-marker-style": styles.join("; "),
              };
            },
          },
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
          },
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily || null,
          },
          color: {
            default: null,
            parseHTML: (element) => element.style.color || null,
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("listMarkerSync"),
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          let tr = newState.tr;
          let hasChanges = false;

          newState.doc.descendants((node, pos) => {
            if (node.type.name === "listItem") {
              let firstFontSize: string | null = null;
              let firstFontFamily: string | null = null;
              let firstColor: string | null = null;

              // Find marks on the first text node of this listItem
              node.descendants((child) => {
                if (child.isText) {
                  child.marks.forEach((mark) => {
                    if (mark.type.name === "textStyle") {
                      if (!firstFontSize && mark.attrs.fontSize) {
                        firstFontSize = mark.attrs.fontSize;
                      }
                      if (!firstFontFamily && mark.attrs.fontFamily) {
                        firstFontFamily = mark.attrs.fontFamily;
                      }
                      if (!firstColor && mark.attrs.color) {
                        firstColor = mark.attrs.color;
                      }
                    }
                  });
                  return false; // Stop after first text child
                }
              });

              // Also check direct paragraph style if any
              if (!firstFontSize || !firstFontFamily || !firstColor) {
                const firstChild = node.firstChild;
                if (firstChild && firstChild.attrs) {
                  if (!firstFontSize && firstChild.attrs.fontSize) {
                    firstFontSize = firstChild.attrs.fontSize;
                  }
                  if (!firstFontFamily && firstChild.attrs.fontFamily) {
                    firstFontFamily = firstChild.attrs.fontFamily;
                  }
                }
              }

              const curFontSize = node.attrs.fontSize || null;
              const curFontFamily = node.attrs.fontFamily || null;
              const curColor = node.attrs.color || null;

              if (
                curFontSize !== firstFontSize ||
                curFontFamily !== firstFontFamily ||
                curColor !== firstColor
              ) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  fontSize: firstFontSize,
                  fontFamily: firstFontFamily,
                  color: firstColor,
                });
                hasChanges = true;
              }
            }
          });

          return hasChanges ? tr : null;
        },
      }),
    ];
  },
});
