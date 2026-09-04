import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Download,
  FileText,
  ArrowLeft,
  Printer,
  FileCode,
  FileDown,
  Edit,
  Eye,
  Info,
  ChevronDown,
  PanelLeft,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import LinkExtension from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { CustomImage } from '../../../components/editor/imageExtension';
import { asBlob } from 'html-docx-js-typescript';

import { Button, Badge, PageHeader } from '../../../components/ui';
import { useTranslation } from '../../../i18n/useTranslation';
import { downloadContent, sanitizeFilename } from '../../../utils/fileDownloader';
import {
  useDocumentsQuery,
  useDocumentDetailQuery,
  useWorkspacesQuery,
} from '../../../hooks/queries';
import { documentService } from '../../../services';
import type { Document, Workspace } from '../../../types';

import DocumentOutlinePanel from '../../../components/editor/DocumentOutlinePanel';
import PageCanvas from '../../../components/editor/PageCanvas';
import { FontSize } from '../../../components/editor/fontSize';
import { LineHeight } from '../../../components/editor/lineHeight';
import { Indent } from '../../../components/editor/indent';
import { UnderlineWhitespace } from '../../../components/editor/underlineWhitespace';
import { PaginationPlus } from 'tiptap-pagination-plus';
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_GAP,
  DEFAULT_MARGIN_TOP,
  DEFAULT_MARGIN_BOTTOM,
  DEFAULT_CONTENT_MARGIN_TOP,
  DEFAULT_CONTENT_MARGIN_BOTTOM,
} from '../../../components/editor/pageConfig';
import { DEFAULT_LEFT_MARGIN, DEFAULT_RIGHT_MARGIN } from '../../../components/editor/Ruler';
import { ListMarkerSync } from '../../../components/editor/listMarkerSync';
import { FullPagePaginationSync } from '../../../components/editor/fullPagePaginationSync';
import { PageBreak } from '../../../components/editor/pageBreak';
import { useEditorStore } from '../../../stores/useEditorStore';

export default function DocDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();

  const returnPath = (location.state as { from?: string } | undefined)?.from || '/documents';

  const { data: workspacesRaw } = useWorkspacesQuery();
  const workspaces: Workspace[] = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = (workspacesRaw as unknown) as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

  const { data: documentsData, isLoading: isDocsLoading } = useDocumentsQuery();
  const documents: Document[] = useMemo(() => {
    if (!documentsData) return [];
    if (Array.isArray(documentsData)) return documentsData as Document[];
    if (typeof documentsData === 'object') {
      const obj = documentsData as unknown as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Document[];
      if (Array.isArray(obj.documents)) return obj.documents as Document[];
    }
    return [];
  }, [documentsData]);

  const { data: docDetail } = useDocumentDetailQuery(id);
  const baseDoc = docDetail || documents.find(d => d._id === id);

  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [showNavPanel, setShowNavPanel] = useState(true);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close download menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize document data
  useEffect(() => {
    if (baseDoc) {
      setDocTitle(baseDoc.name);
      if (baseDoc.documentType === 'online') {
        if (!baseDoc.content) {
          setIsLoadingContent(true);
          documentService.getContent(baseDoc._id)
            .then(content => {
              setDocContent(content || '');
            })
            .catch(err => {
              console.error(err);
              toast.error(t('doc.loadError'));
            })
            .finally(() => setIsLoadingContent(false));
        } else {
          setDocContent(baseDoc.content);
        }
      }
    }
  }, [baseDoc, language, t]);

  const { setEditor } = useEditorStore();

  // Initialize TipTap Editor in Read-Only (view) mode
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    onCreate({ editor: ed }) {
      setEditor(ed);
    },
    onDestroy() {
      setEditor(null);
    },
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      LinkExtension.configure({ openOnClick: true }),
      CustomImage,
      FontSize,
      LineHeight,
      Indent,
      UnderlineWhitespace,
      PaginationPlus.configure({
        pageHeight: PAGE_HEIGHT,
        pageWidth: PAGE_WIDTH,
        pageGap: PAGE_GAP,
        pageGapBorderSize: 1,
        pageGapBorderColor: '#D1D5DB',
        pageBreakBackground: '#F1F3F4',
        marginTop: DEFAULT_MARGIN_TOP,
        marginBottom: DEFAULT_MARGIN_BOTTOM,
        marginLeft: DEFAULT_LEFT_MARGIN,
        marginRight: DEFAULT_RIGHT_MARGIN,
        contentMarginTop: DEFAULT_CONTENT_MARGIN_TOP,
        contentMarginBottom: DEFAULT_CONTENT_MARGIN_BOTTOM,
        footerRight: '',
        footerLeft: '',
        headerRight: '',
        headerLeft: '',
      }),
      PageBreak,
      FullPagePaginationSync,
      ListMarkerSync,
    ],
    content: docContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[1123px] select-text',
      },
    },
  });

  // Sync content from state to editor on load
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const currentHtml = editor.getHTML();
    if (docContent !== undefined && docContent !== currentHtml && !(docContent === '' && editor.isEmpty)) {
      editor.commands.setContent(docContent, { emitUpdate: false });
    }
  }, [docContent, editor]);

  const handleDownload = async () => {
    if (!baseDoc) return;
    try {
      toast.loading(t('documents.downloadLoading'), { id: 'download' });
      const targetFilename = baseDoc.originalName || baseDoc.name || 'document';
      const { data: blobData, filename } = await documentService.download(
        baseDoc._id,
        baseDoc.documentType === 'online',
        targetFilename,
      );
      await downloadContent(blobData, filename || targetFilename);
      toast.success(t('docDetail.downloadSuccess'), { id: 'download' });
    } catch (error) {
      console.error(error);
      toast.error(t('docDetail.downloadError'), { id: 'download' });
    }
  };

  const exportFile = async (content: string | Blob, filename: string, mimeType: string) => {
    try {
      setIsDownloadMenuOpen(false);
      await downloadContent(content, filename, mimeType);
      toast.success(t('docDetail.exportSuccess', { filename }));
    } catch (err) {
      console.error('Export error:', err);
      toast.error(t('docDetail.exportError'));
    }
  };

  const exportHTML = () => {
    if (!editor) return;
    const docName = sanitizeFilename(docTitle || 'document');
    const html = `<!DOCTYPE html>
<html lang="${language}">
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
    exportFile(html, `${docName}.html`, 'text/html');
  };

  const exportText = () => {
    if (!editor) return;
    const docName = sanitizeFilename(docTitle || 'document');
    exportFile(editor.getText(), `${docName}.txt`, 'text/plain');
  };

  const exportJSON = () => {
    if (!editor) return;
    const docName = sanitizeFilename(docTitle || 'document');
    exportFile(JSON.stringify(editor.getJSON(), null, 2), `${docName}.json`, 'application/json');
  };

  const exportDOCX = async () => {
    if (!editor) return;
    const docName = sanitizeFilename(docTitle || 'document');
    const rawHtml = editor.getHTML();
    const cleanHtml = rawHtml
      .replace(/<div[^>]*class="[^"]*doc-page-break-indicator[^"]*"[^>]*>.*?<\/div>/gis, '')
      .replace(/<div[^>]*class="[^"]*rm-pagination-gap[^"]*"[^>]*>.*?<\/div>/gis, '');

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
      await exportFile(
        blob as Blob,
        `${docName}.docx`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      return;
    } catch (err) {
      console.warn('asBlob DOCX conversion failed, falling back to Word XML HTML:', err);
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
      const blob = new Blob(['\ufeff', wordXmlHtml], {
        type: 'application/msword;charset=utf-8',
      });
      await exportFile(blob, `${docName}.doc`, 'application/msword');
    } catch (fallbackErr) {
      console.error('Word export fallback failed', fallbackErr);
      toast.error(t('docDetail.exportWordError'));
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getWorkspaceNames = () => {
    if (!baseDoc?.workspaceIds || baseDoc.workspaceIds.length === 0) return '-';
    const names = baseDoc.workspaceIds.map(wId => {
      const w = workspaces.find(ws => ws._id === wId);
      return w ? w.name : wId;
    });
    return names.join(', ');
  };

  if (isDocsLoading && !baseDoc) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-60px)] -m-4 sm:-m-6 bg-[#F9FBFD] dark:bg-[#1E1E1E] select-none">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-medium text-xs text-gray-500 animate-pulse">
          {t('docDetail.loadingDoc')}
        </p>
      </div>
    );
  }

  if (!baseDoc) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <FileText className="w-12 h-12 mx-auto text-[var(--text-muted)] stroke-1 mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          {t('docDetail.notFound')}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/documents')}>
          {t('docDetail.backToList')}
        </Button>
      </div>
    );
  }

  // If Upload document type: Show file preview and metadata
  if (baseDoc.documentType === 'upload') {
    const creatorName = baseDoc.uploadedBy && typeof baseDoc.uploadedBy === 'object' ? (baseDoc.uploadedBy as { fullName?: string }).fullName : t('docDetail.system');
    return (
      <div className="mx-auto max-w-3xl flex flex-col gap-5">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.documents'), href: '/documents' },
            { label: baseDoc.name },
          ]}
          title={baseDoc.name}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate(returnPath)}>
                <ArrowLeft className="w-4 h-4" />
                {t('docDetail.back')}
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="w-4 h-4" />
                {t('docDetail.download')}
              </Button>
            </div>
          }
        />

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('docDetail.docName')}</p>
              <p className="font-semibold text-[var(--text-primary)]">{baseDoc.name}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('docDetail.docType')}</p>
              <Badge variant="success" mono>UPLOAD_FILE</Badge>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('docDetail.fileName')}</p>
              <p className="font-mono text-xs text-[var(--text-primary)]">{baseDoc.originalName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('docDetail.fileSize')}</p>
              <p className="font-mono text-xs text-[var(--text-primary)]">{formatFileSize(baseDoc.size)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('docDetail.uploadedBy')}</p>
              <p className="font-medium text-xs text-[var(--text-primary)]">{creatorName}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('docDetail.createdAt')}</p>
              <p className="font-mono text-xs text-[var(--text-primary)]">
                {baseDoc.createdAt ? new Date(baseDoc.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ONLINE DOCUMENT: VIEW MODE (READ-ONLY)
  // ==========================================
  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -m-4 sm:-m-6 bg-[#F9FBFD] dark:bg-[#1E1E1E] overflow-hidden select-none print:h-auto print:m-0 print:p-0 print:bg-white print:overflow-visible print:block">
      {/* 1. TOP NAVBAR FOR VIEW MODE */}
      <div className="bg-white dark:bg-[#202020] border-b border-[#EAEAEA] dark:border-white/[0.08] px-4 py-2.5 flex items-center justify-between shrink-0 z-30 print:hidden shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back Button */}
          <button
            onClick={() => navigate(returnPath)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={t('docDetail.backToDocList')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Toggle Navigation Panel Button */}
          <button
            onClick={() => setShowNavPanel(!showNavPanel)}
            className={`p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer ${
              showNavPanel ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''
            }`}
            title={showNavPanel ? t('docDetail.hideOutline') : t('docDetail.openOutline')}
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Document icon */}
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>

          {/* Document Title & Status */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-lg">
                {baseDoc.name}
              </h1>
              <Badge variant="info" className="flex items-center gap-1 text-[11px] px-2 py-0.5 font-medium shrink-0">
                <Eye className="w-3 h-3" />
                {t('docDetail.viewMode')}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span>Workspace: <span className="font-medium text-gray-700 dark:text-gray-200">{getWorkspaceNames()}</span></span>
              <span>•</span>
              <span>{t('docDetail.updated')}: {baseDoc.updatedAt ? new Date(baseDoc.updatedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}</span>
            </div>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMetadataModal(true)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={t('docDetail.docInfo')}
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={t('docDetail.printDoc')}
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download Dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('docDetail.export')}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {isDownloadMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 min-w-[260px] whitespace-nowrap bg-white dark:bg-[#252525] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                <button
                  onClick={exportDOCX}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{t('docDetail.exportWord')}</span>
                </button>
                <button
                  onClick={exportHTML}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{t('docDetail.exportHtml')}</span>
                </button>
                <button
                  onClick={exportText}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('docDetail.exportTxt')}</span>
                </button>
                <button
                  onClick={exportJSON}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>{t('docDetail.exportJson')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Edit Button to navigate to Edit Page */}
          <Button
            size="sm"
            onClick={() => navigate(`/documents/${id}/edit`, { state: { from: returnPath } })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 px-3.5 py-1.5 text-xs shadow-xs ml-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            {t('docDetail.edit')}
          </Button>
        </div>
      </div>

      {/* 2. BODY CONTENT: NAVIGATION PANEL + CANVAS */}
      <div className="flex-1 flex overflow-hidden w-full relative print:overflow-visible print:h-auto print:block">
        {/* Navigation / Outline Sidebar */}
        {showNavPanel && (
          <DocumentOutlinePanel
            editor={editor}
            onClose={() => setShowNavPanel(false)}
          />
        )}

        {/* Floating reopen button if panel is closed */}
        {!showNavPanel && (
          <button
            onClick={() => setShowNavPanel(true)}
            className="absolute left-3 top-3 z-20 p-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 shadow-md rounded-xl text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5 text-xs font-medium print:hidden cursor-pointer"
            title={t('docDetail.openOutline')}
          >
            <PanelLeft className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">{t('docDetail.outline')}</span>
          </button>
        )}

        {/* Scrollable Canvas Viewport */}
        <div className="flex-1 overflow-y-auto w-full relative flex flex-col print:overflow-visible print:h-auto print:block">
          {isLoadingContent ? (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-gray-500 py-16">
              <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-medium text-xs animate-pulse">
                {t('docDetail.loadingContent')}
              </p>
            </div>
          ) : (
            <PageCanvas
              leftMargin={DEFAULT_LEFT_MARGIN}
              rightMargin={DEFAULT_RIGHT_MARGIN}
            >
              <EditorContent editor={editor} />
            </PageCanvas>
          )}
        </div>
      </div>

      {/* Info Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#252525] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in-50 zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              {t('docDetail.docInfo')}
            </h3>
            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">{t('docDetail.title')}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{baseDoc.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">{t('docDetail.docType')}:</span>
                <span className="font-medium text-blue-600">{t('docDetail.onlineDoc')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Workspace:</span>
                <span className="font-medium">{getWorkspaceNames()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">{t('docDetail.createdAt')}:</span>
                <span className="font-medium">
                  {baseDoc.createdAt ? new Date(baseDoc.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">{t('docDetail.lastUpdated')}:</span>
                <span className="font-medium">
                  {baseDoc.updatedAt ? new Date(baseDoc.updatedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setShowMetadataModal(false)}>
                {t('docDetail.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
