"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import Underline from "@tiptap/extension-underline";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { PaginationPlus } from "tiptap-pagination-plus";

import { CustomImage } from "./imageExtension";
import GoogleDocsToolbar from "./GoogleDocsToolbar";
import PageCanvas from "./PageCanvas";
import { TableHandle } from "./TableHandle";
import Ruler, { DEFAULT_LEFT_MARGIN, DEFAULT_RIGHT_MARGIN } from "./Ruler";
import DocMenuBar from "./DocMenuBar";
import FindReplacePanel from "./FindReplacePanel";
import DocumentOutlinePanel from "./DocumentOutlinePanel";
import { FontSize } from "./fontSize";
import { LineHeight } from "./lineHeight";
import { Indent } from "./indent";
import { UnderlineWhitespace } from "./underlineWhitespace";
import { SearchAndReplace } from "./searchAndReplace";
import { UndoCaptureBoundary } from "./undoCaptureBoundary";
import { ListMarkerSync } from "./listMarkerSync";
import { FullPagePaginationSync } from "./fullPagePaginationSync";
import { PageBreak } from "./pageBreak";
import { useEditorStore } from "../../stores/useEditorStore";
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_GAP,
  DEFAULT_MARGIN_TOP,
  DEFAULT_MARGIN_BOTTOM,
  DEFAULT_CONTENT_MARGIN_TOP,
  DEFAULT_CONTENT_MARGIN_BOTTOM,
} from "./pageConfig";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  isSaving?: boolean;
  showMenuBar?: boolean;
  showRuler?: boolean;
  showNavPanel?: boolean;
  leftMargin?: number;
  rightMargin?: number;
  onLeftMarginChange?: (margin: number) => void;
  onRightMarginChange?: (margin: number) => void;
  backHref?: string;
  rightActions?: React.ReactNode;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung tài liệu...",
  title = "Tài liệu không có tiêu đề",
  onTitleChange,
  isSaving = false,
  showMenuBar = true,
  showRuler: initialShowRuler = true,
  showNavPanel: initialShowNavPanel = true,
  leftMargin: propLeftMargin,
  rightMargin: propRightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  backHref = "/documents",
  rightActions,
  className = "flex flex-col h-full bg-[#F9FBFD] dark:bg-[#1E1E1E] relative border border-[var(--border-color)] rounded-xl overflow-hidden shadow-xs",
}: RichTextEditorProps) {
  const [internalLeftMargin, setInternalLeftMargin] = useState(
    propLeftMargin ?? DEFAULT_LEFT_MARGIN
  );
  const [internalRightMargin, setInternalRightMargin] = useState(
    propRightMargin ?? DEFAULT_RIGHT_MARGIN
  );
  const [isRulerVisible, setIsRulerVisible] = useState(initialShowRuler);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isNavPanelVisible, setIsNavPanelVisible] = useState(initialShowNavPanel);

  const activeLeftMargin = propLeftMargin ?? internalLeftMargin;
  const activeRightMargin = propRightMargin ?? internalRightMargin;

  const { setEditor } = useEditorStore();

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor: ed }) {
      setEditor(ed);
    },
    onDestroy() {
      setEditor(null);
    },
    onSelectionUpdate({ editor: ed }) {
      setEditor(ed);
    },
    onTransaction({ editor: ed }) {
      setEditor(ed);
    },
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
        handleWidth: 7,
        cellMinWidth: 25,
        lastColumnResizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      CustomImage,
      Placeholder.configure({ placeholder }),
      FontSize,
      LineHeight,
      Indent,
      UnderlineWhitespace,
      SearchAndReplace,
      UndoCaptureBoundary,
      PaginationPlus.configure({
        pageHeight: PAGE_HEIGHT,
        pageWidth: PAGE_WIDTH,
        pageGap: PAGE_GAP,
        pageGapBorderSize: 1,
        pageGapBorderColor: "#D1D5DB",
        pageBreakBackground: "#F1F3F4",
        marginTop: DEFAULT_MARGIN_TOP,
        marginBottom: DEFAULT_MARGIN_BOTTOM,
        marginLeft: activeLeftMargin,
        marginRight: activeRightMargin,
        contentMarginTop: DEFAULT_CONTENT_MARGIN_TOP,
        contentMarginBottom: DEFAULT_CONTENT_MARGIN_BOTTOM,
        footerRight: "",
        footerLeft: "",
        headerRight: "",
        headerLeft: "",
      }),
      PageBreak,
      FullPagePaginationSync,
      ListMarkerSync,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      setEditor(ed);
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none",
      },
    },
  });

  // Sync Ruler left margin changes -> PaginationPlus
  const handleLeftMarginChange = (margin: number) => {
    setInternalLeftMargin(margin);
    onLeftMarginChange?.(margin);
    try {
      (editor?.chain().focus() as unknown as {
        updateMargins?: (margins: { top: number; bottom: number; left: number; right: number }) => { run: () => boolean };
      })
        ?.updateMargins?.({
          top: DEFAULT_MARGIN_TOP,
          bottom: DEFAULT_MARGIN_BOTTOM,
          left: margin,
          right: activeRightMargin,
        })
        ?.run();
    } catch {
      // ignore if command not available
    }
  };

  // Sync Ruler right margin changes -> PaginationPlus
  const handleRightMarginChange = (margin: number) => {
    setInternalRightMargin(margin);
    onRightMarginChange?.(margin);
    try {
      (editor?.chain().focus() as unknown as {
        updateMargins?: (margins: { top: number; bottom: number; left: number; right: number }) => { run: () => boolean };
      })
        ?.updateMargins?.({
          top: DEFAULT_MARGIN_TOP,
          bottom: DEFAULT_MARGIN_BOTTOM,
          left: activeLeftMargin,
          right: margin,
        })
        ?.run();
    } catch {
      // ignore if command not available
    }
  };

  // Sync content from parent (e.g. after load from DB/Yjs)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const currentHtml = editor.getHTML();
    if (
      value !== undefined &&
      value !== currentHtml &&
      !(value === "" && editor.isEmpty)
    ) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Global shortcut for Find & Replace (Ctrl+F, Cmd+F, Ctrl+H, Cmd+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (isCtrlOrCmd && (key === "f" || key === "h")) {
        e.preventDefault();
        e.stopPropagation();
        setIsFindReplaceOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  return (
    <div className={`${className || ""} print:h-auto print:overflow-visible print:block print:bg-white`}>
      {/* Top Document Menu Bar */}
      {showMenuBar && (
        <DocMenuBar
          title={title}
          onTitleChange={onTitleChange}
          isSaving={isSaving}
          editor={editor}
          showRuler={isRulerVisible}
          onToggleRuler={() => setIsRulerVisible((v) => !v)}
          showNavPanel={isNavPanelVisible}
          onToggleNavPanel={() => setIsNavPanelVisible((v) => !v)}
          backHref={backHref}
          rightActions={rightActions}
          onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        />
      )}

      {/* Formatting Toolbar */}
      <div className="px-4 py-1.5 bg-[#FAFBFD] dark:bg-[#1E1E1E] shrink-0 z-20 print:hidden">
        <GoogleDocsToolbar editor={editor} />
      </div>

      {/* Floating Find & Replace Panel */}
      {isFindReplaceOpen && (
        <FindReplacePanel
          editor={editor}
          onClose={() => setIsFindReplaceOpen(false)}
        />
      )}

      {/* Scrollable Page Canvas with Document Outline Panel */}
      <div className="flex-1 flex overflow-hidden w-full relative print:overflow-visible print:h-auto print:block">
        {isNavPanelVisible && (
          <DocumentOutlinePanel
            editor={editor}
            onClose={() => setIsNavPanelVisible(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative print:overflow-visible print:h-auto print:block">
          {/* Ruler */}
          {isRulerVisible && (
            <div className="pt-2 bg-[#F9FBFD] dark:bg-[#1C1C1E] flex justify-center shrink-0 z-10 print:hidden border-b border-gray-200/40 dark:border-gray-800/40">
              <Ruler
                editor={editor}
                leftMargin={activeLeftMargin}
                rightMargin={activeRightMargin}
                onLeftMarginChange={handleLeftMarginChange}
                onRightMarginChange={handleRightMarginChange}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto w-full relative print:overflow-visible print:h-auto print:block">
            <PageCanvas leftMargin={activeLeftMargin} rightMargin={activeRightMargin}>
              <EditorContent editor={editor} />
              <TableHandle editor={editor} />
            </PageCanvas>
          </div>
        </div>
      </div>
    </div>
  );
}
