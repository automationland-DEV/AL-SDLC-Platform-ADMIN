import { Editor } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
import { TextSelection } from "@tiptap/pm/state";

export interface TableInfo {
  tableEl: HTMLTableElement;
  tablePos: number;
  startX: number;
  dividers: number[];
  widths: number[];
  numCols: number;
}

export function getActiveTableInfo(
  editor: Editor | null | undefined,
  containerElement: HTMLElement | null | undefined
): TableInfo | null {
  if (!editor || !containerElement) {
    return null;
  }

  const { state, view } = editor;

  // 1. Try finding table position from selection
  let tablePos = -1;
  let depth = state.selection.$from.depth;
  while (depth > 0) {
    if (state.selection.$from.node(depth).type.name === "table") {
      tablePos = state.selection.$from.before(depth);
      break;
    }
    depth--;
  }

  // 2. Find DOM table element
  let domNode: Node | null;
  try {
    domNode = view.domAtPos(state.selection.from).node;
  } catch {
    domNode = null;
  }

  const el = domNode instanceof Element ? domNode : domNode?.parentElement;
  const tableEl = (el?.closest("table") ||
    view.dom.querySelector("table:has(.selectedCell)") ||
    (tablePos > -1 ? (view.nodeDOM(tablePos) as HTMLElement)?.querySelector("table") || (view.nodeDOM(tablePos) as HTMLElement) : null)
  ) as HTMLTableElement | null;

  if (!tableEl) {
    return null;
  }

  // If tablePos wasn't found from selection, find it from tableEl DOM
  if (tablePos === -1) {
    try {
      const pos = view.posAtDOM(tableEl, 0);
      const $pos = state.doc.resolve(pos);
      let d = $pos.depth;
      while (d > 0) {
        if ($pos.node(d).type.name === "table") {
          tablePos = $pos.before(d);
          break;
        }
        d--;
      }
    } catch {
      // fallback
    }
  }

  // If still not found, search the doc for the table
  if (tablePos === -1) {
    state.doc.descendants((node, pos) => {
      if (node.type.name === "table" && tablePos === -1) {
        tablePos = pos;
        return false;
      }
    });
  }

  if (tablePos === -1) return null;

  const firstRow = tableEl.querySelector("tr");
  if (!firstRow) {
    return null;
  }

  const cells = Array.from(firstRow.children) as HTMLElement[];
  if (cells.length === 0) {
    return null;
  }

  const containerRect = containerElement.getBoundingClientRect();
  const startX = cells[0].getBoundingClientRect().left - containerRect.left;
  const dividers: number[] = [];
  const widths: number[] = [];

  for (let i = 0; i < cells.length; i++) {
    const cRect = cells[i].getBoundingClientRect();
    const dividerX = cRect.right - containerRect.left;
    dividers.push(dividerX);
    widths.push(Math.round(cRect.width));
  }

  // Auto-initialize tables without colwidth so they span full content width (605px)
  const tableNode = state.doc.nodeAt(tablePos);
  if (tableNode && tableNode.firstChild) {
    const firstRowNode = tableNode.firstChild;
    let hasAnyColwidth = false;
    for (let i = 0; i < firstRowNode.childCount; i++) {
      if (firstRowNode.child(i).attrs.colwidth) {
        hasAnyColwidth = true;
        break;
      }
    }

    if (!hasAnyColwidth && cells.length > 0) {
      const contentWidth = 605;
      const base = Math.max(30, Math.floor(contentWidth / cells.length));
      const remainder = Math.max(0, contentWidth - base * cells.length);
      const autoWidths = new Array(cells.length).fill(base);
      autoWidths[cells.length - 1] += remainder;

      setTimeout(() => {
        updateAllTableColumnWidths(editor, tablePos, autoWidths);
      }, 0);
    }
  }

  return {
    tableEl,
    tablePos,
    startX,
    dividers,
    widths,
    numCols: cells.length,
  };
}

export function updateAllTableColumnWidths(
  editor: Editor,
  tablePos: number,
  newWidths: number[]
) {
  const { state, view } = editor;
  if (tablePos < 0) return;

  const tableNode = state.doc.nodeAt(tablePos);
  if (!tableNode || tableNode.type.name !== "table") return;

  const tableStart = tablePos + 1; // position of first child inside table
  const map = TableMap.get(tableNode);
  const tr = state.tr;

  for (let col = 0; col < map.width; col++) {
    const targetWidth = newWidths[col];
    if (targetWidth == null) continue;

    for (let row = 0; row < map.height; row++) {
      const mapIndex = row * map.width + col;
      if (row && map.map[mapIndex] === map.map[mapIndex - map.width]) continue;
      const cellOffset = map.map[mapIndex];
      const cellNode = tableNode.nodeAt(cellOffset);
      if (!cellNode) continue;

      const attrs = cellNode.attrs;
      const colspan = attrs.colspan || 1;
      const indexInColspan = colspan === 1 ? 0 : col - map.colCount(cellOffset);

      const colwidth = attrs.colwidth ? [...attrs.colwidth] : new Array(colspan).fill(0);
      colwidth[indexInColspan] = Math.round(targetWidth);

      tr.setNodeMarkup(tableStart + cellOffset, null, {
        ...attrs,
        colwidth,
      });
    }
  }

  if (tr.docChanged) {
    view.dispatch(tr);
  }
}

export function insertTableWithColWidths(
  editor: Editor,
  rows: number,
  cols: number,
  withHeaderRow: boolean = true,
  contentWidth: number = 605
) {
  const base = Math.max(30, Math.floor(contentWidth / cols));
  const remainder = Math.max(0, contentWidth - base * cols);
  const colWidths = new Array(cols).fill(base);
  if (cols > 0) {
    colWidths[cols - 1] += remainder;
  }

  const { state, view } = editor;
  const schema = state.schema;
  const types = {
    table: schema.nodes.table,
    row: schema.nodes.tableRow,
    cell: schema.nodes.tableCell,
    header_cell: schema.nodes.tableHeader,
  };

  if (types.table && types.row && types.cell) {
    const tableRows = [];
    for (let r = 0; r < rows; r++) {
      const isHeader = withHeaderRow && r === 0 && !!types.header_cell;
      const cellType = isHeader ? types.header_cell : types.cell;
      const cells = [];
      for (let c = 0; c < cols; c++) {
        const cell = cellType.createAndFill({ colwidth: [colWidths[c]] });
        if (cell) cells.push(cell);
      }
      tableRows.push(types.row.createChecked(null, cells));
    }
    const tableNode = types.table.createChecked(null, tableRows);

    const tr = state.tr;
    const offset = tr.selection.from + 1;
    tr.replaceSelectionWith(tableNode)
      .scrollIntoView()
      .setSelection(TextSelection.near(tr.doc.resolve(offset)));
    view.dispatch(tr);
    return;
  }

  // Fallback
  editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
}
