"use client";

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Editor } from "@tiptap/react";
import { asBlob } from "html-docx-js-typescript";
import toast from "react-hot-toast";
import { downloadContent, sanitizeFilename } from "../../utils/fileDownloader";
import { useTranslation } from "../../i18n/useTranslation";
import {
  ArrowLeft,
  Cloud,
  CloudCheck,
  FileText,
  Printer,
  FileCode,
  FileDown,
  Undo2,
  Redo2,
  Table as TableIcon,
  Link as LinkIcon,
  Minus,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  RemoveFormatting,
  Ruler as RulerIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Type,
  Search,
  Maximize,
  List as ListIcon,
  ListOrdered,
  ListTodo,
  IndentIncrease,
  IndentDecrease,
  Heading1,
  Heading2,
  Heading3,
  Upload,
  PanelLeft,
} from "lucide-react";
import TableGridPicker from "./TableGridPicker";
import { insertTableWithColWidths } from "./tableUtils";

interface DocMenuBarProps {
  title: string;
  onTitleChange?: (newTitle: string) => void;
  isSaving?: boolean;
  editor: Editor | null;
  showRuler?: boolean;
  onToggleRuler?: () => void;
  showNavPanel?: boolean;
  onToggleNavPanel?: () => void;
  backHref?: string;
  onOpenTablePicker?: () => void;
  onOpenLinkPopover?: () => void;
  onOpenFindReplace?: () => void;
  rightActions?: React.ReactNode;
}

export default function DocMenuBar({
  title,
  onTitleChange,
  isSaving = false,
  editor,
  showRuler = true,
  onToggleRuler,
  showNavPanel = false,
  onToggleNavPanel,
  backHref = "/documents",
  onOpenTablePicker,
  onOpenLinkPopover,
  onOpenFindReplace,
  rightActions,
}: DocMenuBarProps) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [tablePickerAnchor, setTablePickerAnchor] = useState<HTMLElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (currentTitle.trim() && currentTitle !== title && onTitleChange) {
      onTitleChange(currentTitle.trim());
    }
  };

  const downloadFile = async (content: string | Blob, filename: string, mimeType: string) => {
    try {
      setActiveMenu(null);
      await downloadContent(content, filename, mimeType);
      toast.success(t('docDetail.exportSuccess', { filename }));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t('docDetail.exportError'));
    }
  };

  const exportHTML = () => {
    if (!editor) return;
    const docName = sanitizeFilename(currentTitle || "document");
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 40px;
      color: #333333;
      line-height: 1.6;
    }
    table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 3px solid #3b82f6; margin-left: 0; padding-left: 1rem; color: #4b5563; }
    pre { background-color: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  ${editor.getHTML()}
</body>
</html>`;
    downloadFile(html, `${docName}.html`, "text/html");
  };

  const exportText = () => {
    if (!editor) return;
    const docName = sanitizeFilename(currentTitle || "document");
    downloadFile(editor.getText(), `${docName}.txt`, "text/plain");
  };

  const exportJSON = () => {
    if (!editor) return;
    const docName = sanitizeFilename(currentTitle || "document");
    downloadFile(JSON.stringify(editor.getJSON(), null, 2), `${docName}.json`, "application/json");
  };

  const exportDOCX = async () => {
    if (!editor) return;
    const docName = sanitizeFilename(currentTitle || "document");
    const rawHtml = editor.getHTML();
    const cleanHtml = rawHtml
      .replace(/<div[^>]*class="[^"]*doc-page-break-indicator[^"]*"[^>]*>.*?<\/div>/gis, "")
      .replace(/<div[^>]*class="[^"]*rm-pagination-gap[^"]*"[^>]*>.*?<\/div>/gis, "");

    try {
      const wrappedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docName}</title>
</head>
<body>
  ${cleanHtml}
</body>
</html>`;
      const blob = await asBlob(wrappedHtml);
      await downloadFile(
        blob as Blob,
        `${docName}.docx`,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      return;
    } catch (err) {
      console.warn("asBlob DOCX conversion failed, falling back to Word XML HTML:", err);
    }

    try {
      const wordXmlHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${docName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 20mm; }
    table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
    th, td { border: 1px solid #999999; padding: 6pt 8pt; vertical-align: top; }
    th { background-color: #f2f2f2; font-weight: bold; }
    img { max-width: 100%; height: auto; }
    h1 { font-size: 18pt; font-weight: bold; margin: 12pt 0 6pt; }
    h2 { font-size: 14pt; font-weight: bold; margin: 10pt 0 4pt; }
    h3 { font-size: 12pt; font-weight: bold; margin: 8pt 0 2pt; }
    p { margin: 0 0 6pt 0; }
  </style>
</head>
<body>
  ${cleanHtml}
</body>
</html>`;
      const blob = new Blob(["\ufeff", wordXmlHtml], {
        type: "application/msword;charset=utf-8",
      });
      await downloadFile(blob, `${docName}.doc`, "application/msword");
    } catch (fallbackErr) {
      console.error("Word export fallback failed", fallbackErr);
      toast.error(language === "vi" ? "Lỗi khi xuất Word" : "Error exporting Word");
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#202020] border-b border-[#EAEAEA] dark:border-white/[0.08] px-4 py-2 flex flex-col gap-1 select-none print:hidden">
      {/* Top row: Back button, Document title, Save status, and Right actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(backHref)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          title={t("doc.backToList")}
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <FileText className="w-4 h-4" />
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setCurrentTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              className="px-2 py-0.5 text-base font-medium rounded border border-blue-500 focus:outline-none bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white w-auto min-w-[200px] max-w-md shadow-xs"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="px-2 py-0.5 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded cursor-pointer truncate max-w-md transition-colors"
              title={t("doc.clickToRename")}
            >
              {currentTitle || t("doc.untitled")}
            </span>
          )}

          {/* Cloud save status */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-2">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 animate-pulse">
                <Cloud className="w-3.5 h-3.5 animate-spin" />
                {t("doc.saving")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title={t("doc.saved")}>
                <CloudCheck className="w-3.5 h-3.5" />
                {t("doc.saved")}
              </span>
            )}
          </div>
        </div>

        {rightActions && <div className="flex items-center gap-2 shrink-0">{rightActions}</div>}
      </div>

      {/* Second row: Menu Bar (Tệp, Chỉnh sửa, Chèn, Định dạng, Xem) */}
      <div ref={menuContainerRef} className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
        {/* Tệp (File) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
            className={`px-2.5 py-1 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors ${
              activeMenu === "file" ? "bg-gray-100 dark:bg-white/10" : ""
            }`}
          >
            {t("doc.file")}
          </button>
          {activeMenu === "file" && (
            <div className="absolute left-0 top-full mt-1 min-w-[280px] whitespace-nowrap bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <Link
                to="/documents/new"
                onClick={() => setActiveMenu(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{t("doc.newDoc")}</span>
              </Link>
              <button
                onClick={() => {
                  window.print();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <Printer className="w-4 h-4 text-gray-500 shrink-0" />
                <span>{t("doc.print")}</span>
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={exportHTML}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <FileCode className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{t("doc.downloadHtml")}</span>
              </button>
              <button
                onClick={exportText}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <FileDown className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t("doc.downloadTxt")}</span>
              </button>
              <button
                onClick={exportJSON}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <FileCode className="w-4 h-4 text-purple-500 shrink-0" />
                <span>{t("doc.downloadJson")}</span>
              </button>
              <button
                onClick={exportDOCX}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t("doc.downloadDocx")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Chỉnh sửa (Edit) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
            className={`px-2.5 py-1 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors ${
              activeMenu === "edit" ? "bg-gray-100 dark:bg-white/10" : ""
            }`}
          >
            {t("doc.edit")}
          </button>
          {activeMenu === "edit" && (
            <div className="absolute left-0 top-full mt-1 min-w-[260px] whitespace-nowrap bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <button
                onClick={() => {
                  editor?.chain().focus().undo().run();
                  setActiveMenu(null);
                }}
                disabled={!editor?.can().undo()}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 disabled:opacity-40 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Undo2 className="w-4 h-4 shrink-0" /> {t("doc.undo")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+Z</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().redo().run();
                  setActiveMenu(null);
                }}
                disabled={!editor?.can().redo()}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 disabled:opacity-40 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Redo2 className="w-4 h-4 shrink-0" /> {t("doc.redo")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+Y</span>
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => {
                  editor?.chain().focus().selectAll().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Type className="w-4 h-4 shrink-0" /> {t("doc.selectAll")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+A</span>
              </button>
              <button
                onClick={() => {
                  if (onOpenFindReplace) onOpenFindReplace();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 shrink-0" /> {t("doc.findReplace")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+F</span>
              </button>
            </div>
          )}
        </div>

        {/* Chèn (Insert) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "insert" ? null : "insert")}
            className={`px-2.5 py-1 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors ${
              activeMenu === "insert" ? "bg-gray-100 dark:bg-white/10" : ""
            }`}
          >
            {t("doc.insert")}
          </button>
          {activeMenu === "insert" && (
            <div className="absolute left-0 top-full mt-1 min-w-[270px] whitespace-nowrap bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <button
                onClick={(e) => {
                  if (onOpenTablePicker) {
                    onOpenTablePicker();
                    setActiveMenu(null);
                  } else {
                    setTablePickerAnchor(e.currentTarget);
                    setIsTablePickerOpen(true);
                    setActiveMenu(null);
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <TableIcon className="w-4 h-4 shrink-0" />
                <span>{t("doc.table")}</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  if (onOpenLinkPopover) onOpenLinkPopover();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <LinkIcon className="w-4 h-4 shrink-0" />
                <span>{t("doc.link")}</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        if (result) editor?.chain().focus().setImage({ src: result }).run();
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>{t("doc.uploadImage")}</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  const url = window.prompt(language === "vi" ? "Nhập URL hình ảnh:" : "Enter image URL:");
                  if (url) {
                    editor?.chain().focus().setImage({ src: url }).run();
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>{t("doc.imageFromUrl")}</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().setHorizontalRule().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <Minus className="w-4 h-4 shrink-0" />
                <span>{t("doc.horizontalRule")}</span>
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => {
                  (editor?.chain().focus() as unknown as { setPageBreak?: () => { run: () => boolean } })?.setPageBreak?.().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{t("doc.pageBreak")}</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+Enter</span>
              </button>
            </div>
          )}
        </div>

        {/* Định dạng (Format) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "format" ? null : "format")}
            className={`px-2.5 py-1 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors ${
              activeMenu === "format" ? "bg-gray-100 dark:bg-white/10" : ""
            }`}
          >
            {t("doc.format")}
          </button>
          {activeMenu === "format" && (
            <div className="absolute left-0 top-full mt-1 min-w-[280px] whitespace-nowrap bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <button
                onClick={() => {
                  editor?.chain().focus().toggleBold().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Bold className="w-4 h-4 shrink-0" /> {t("doc.bold")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+B</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().toggleItalic().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Italic className="w-4 h-4 shrink-0" /> {t("doc.italic")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+I</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().toggleUnderline().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <UnderlineIcon className="w-4 h-4 shrink-0" /> {t("doc.underline")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono ml-4">Ctrl+U</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().toggleStrike().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Strikethrough className="w-4 h-4 shrink-0" /> {t("doc.strikethrough")}
                </span>
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => {
                  editor?.chain().focus().setTextAlign('left').run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <AlignLeft className="w-4 h-4 shrink-0" /> {t("doc.alignLeft")}
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().setTextAlign('center').run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <AlignCenter className="w-4 h-4 shrink-0" /> {t("doc.alignCenter")}
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().setTextAlign('right').run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <AlignRight className="w-4 h-4 shrink-0" /> {t("doc.alignRight")}
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().setTextAlign('justify').run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <AlignJustify className="w-4 h-4 shrink-0" /> {t("doc.alignJustify")}
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => { editor?.chain().focus().toggleHeading({ level: 1 }).run(); setActiveMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <Heading1 className="w-4 h-4 shrink-0" /> {t("doc.heading1")}
              </button>
              <button
                onClick={() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setActiveMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <Heading2 className="w-4 h-4 shrink-0" /> {t("doc.heading2")}
              </button>
              <button
                onClick={() => { editor?.chain().focus().toggleHeading({ level: 3 }).run(); setActiveMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <Heading3 className="w-4 h-4 shrink-0" /> {t("doc.heading3")}
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => { editor?.chain().focus().toggleBulletList().run(); setActiveMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <ListIcon className="w-4 h-4 shrink-0" /> {t("doc.bulletList")}
              </button>
              <button
                onClick={() => { editor?.chain().focus().toggleOrderedList().run(); setActiveMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <ListOrdered className="w-4 h-4 shrink-0" /> {t("doc.orderedList")}
              </button>
              <button
                onClick={() => { editor?.chain().focus().toggleTaskList().run(); setActiveMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <ListTodo className="w-4 h-4 shrink-0" /> {t("doc.taskList")}
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => {
                  (editor?.commands as unknown as { indent?: () => boolean })?.indent?.();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <IndentIncrease className="w-4 h-4 shrink-0" /> {t("doc.indent")}
              </button>
              <button
                onClick={() => {
                  (editor?.commands as unknown as { outdent?: () => boolean })?.outdent?.();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <IndentDecrease className="w-4 h-4 shrink-0" /> {t("doc.outdent")}
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => {
                  editor?.chain().focus().clearNodes().unsetAllMarks().run();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <RemoveFormatting className="w-4 h-4 shrink-0" />
                <span>{t("doc.clearFormatting")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Xem (View) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
            className={`px-2.5 py-1 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors ${
              activeMenu === "view" ? "bg-gray-100 dark:bg-white/10" : ""
            }`}
          >
            {t("doc.view")}
          </button>
          {activeMenu === "view" && (
            <div className="absolute left-0 top-full mt-1 min-w-[270px] whitespace-nowrap bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <button
                onClick={() => {
                  if (onToggleRuler) onToggleRuler();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <RulerIcon className="w-4 h-4 shrink-0" />
                  <span>{t("doc.showRuler")}</span>
                </span>
                <span className="text-blue-600 font-bold ml-4">{showRuler ? "✓" : ""}</span>
              </button>
              <button
                onClick={() => {
                  if (onToggleNavPanel) onToggleNavPanel();
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <PanelLeft className="w-4 h-4 shrink-0" />
                  <span>{t("doc.showOutline")}</span>
                </span>
                <span className="text-blue-600 font-bold ml-4">{showNavPanel ? "✓" : ""}</span>
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.log(err));
                  } else {
                    document.exitFullscreen();
                  }
                  setActiveMenu(null);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Maximize className="w-4 h-4 shrink-0" />
                  <span>{t("doc.fullscreen")}</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isTablePickerOpen && (
        <TableGridPicker
          anchorEl={tablePickerAnchor}
          onClose={() => {
            setIsTablePickerOpen(false);
            setTablePickerAnchor(null);
          }}
          onSelect={(rows, cols) => {
            if (editor) {
              insertTableWithColWidths(editor, rows, cols, true);
            }
            setIsTablePickerOpen(false);
            setTablePickerAnchor(null);
          }}
        />
      )}
    </div>
  );
}
