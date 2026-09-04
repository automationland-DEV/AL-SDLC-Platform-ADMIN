import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit, Trash2, Eye, Download, Upload, FileText, FileCode } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
import toast from 'react-hot-toast';
import { Button, Badge, Table, TableRow, TableCell, SearchableSelect, ConfirmModal } from '../../../components/ui';
import { documentService } from '../../../services';
import type { Document } from '../../../types';
import { downloadContent } from '../../../utils/fileDownloader';

import {
  useDocumentsQuery,
  useDeleteDocumentMutation,
  useWorkspaceOptionsQuery,
} from '../../../hooks/queries';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [wsFilter, setWsFilter] = useState('all');

  const { data: documentsData, isLoading } = useDocumentsQuery({
    page,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    workspaceId: wsFilter !== 'all' ? wsFilter : undefined,
  });
  const { data: workspacesOptions } = useWorkspaceOptionsQuery();
  const workspaces = workspacesOptions || [];

  const deleteDocumentMutation = useDeleteDocumentMutation();

  const documents = documentsData?.data ?? [];
  const absoluteTotal = documentsData?.total ?? 0;
  const totalPages = documentsData?.totalPages ?? 1;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('documents.deleteTitle'),
      message: t('documents.deleteMessage'),
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDocumentMutation.mutateAsync(id);
          toast.success(t('documents.deleteSuccess'));
        } catch (error) {
          console.error(error);
          toast.error(t('documents.deleteError'));
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDownload = async (doc: Document) => {
    try {
      toast.loading(t('documents.downloadLoading'), { id: 'download' });
      const targetFilename = doc.originalName || doc.name || 'document';
      const { data: blobData, filename } = await documentService.download(
        doc._id,
        doc.documentType === 'online',
        targetFilename,
      );
      await downloadContent(blobData, filename || targetFilename);
      toast.success(t('documents.downloadSuccess'), { id: 'download' });
    } catch (error) {
      console.error(error);
      toast.error(t('documents.downloadError'), { id: 'download' });
    }
  };

  const handleFilterChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  const handleWorkspaceFilterChange = (wsId: string) => {
    setWsFilter(wsId);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setWsFilter('all');
    setPage(1);
  };

  const openViewModal = (doc: Document) => navigate(`/documents/${doc._id}`, { state: { from: '/documents' } });
  const openOnlineModal = () => navigate('/documents/new', { state: { from: '/documents' } });
  const openUploadModal = () => navigate('/documents/upload', { state: { from: '/documents' } });
  const openEditModal = (doc: Document) => navigate(`/documents/${doc._id}/edit`, { state: { from: '/documents' } });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeBadge = (type?: string) => {
    const isOnline = type === 'online';
    return (
      <Badge variant={isOnline ? 'info' : 'success'} mono>
        {isOnline ? 'ONLINE_DOC' : 'UPLOAD_FILE'}
      </Badge>
    );
  };

  const getWorkspaceName = (wsId: string) => {
    const ws = workspaces.find((w) => w._id === wsId);
    return ws ? ws.name : 'WS';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('documents.title')}</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono-code mt-0.5">{t('documents.subtitle', { count: absoluteTotal })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" onClick={openOnlineModal}>
            <FileText className="w-4 h-4" />
            {t('documents.createOnline')}
          </Button>
          <Button size="sm" onClick={openUploadModal}>
            <Upload className="w-4 h-4" />
            {t('documents.uploadFile')}
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="shrink-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t('documents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono-code transition-all"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <SearchableSelect
              value={wsFilter}
              onChange={handleWorkspaceFilterChange}
              options={[
                { value: 'all', label: t('documents.allWorkspaces') },
                ...workspaces.map((w) => ({ value: w._id, label: w.name })),
              ]}
              placeholder={t('documents.allWorkspaces')}
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', labelKey: 'documents.tabAll' as const },
              { id: 'online', labelKey: 'documents.tabOnline' as const },
              { id: 'uploaded', labelKey: 'documents.tabUploaded' as const },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-180 cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {(searchTerm !== '' || typeFilter !== 'all' || wsFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto cursor-pointer"
            >
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Main Documents Table / Cards */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-xs">
        {isLoading && documents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-y-auto">
              <Table 
                fixedLayout
                headers={[
                  { label: 'DOC_ID', className: 'w-[10%]' },
                  { label: t('table.name'), className: 'w-[28%]' },
                  { label: t('table.type'), align: 'center', className: 'w-[14%]' },
                  { label: t('table.size'), align: 'center', className: 'w-[12%]' },
                  { label: 'Workspaces', align: 'center', className: 'w-[14%]' },
                  { label: t('table.createdAt'), align: 'center', className: 'w-[14%]' },
                  { label: t('table.actions'), align: 'center', className: 'w-[8%]' }
                ]}
              >
                {documents.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell className="font-mono-code text-xs text-[var(--text-muted)]">
                      #{doc._id?.slice(-6)}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                          doc.documentType === 'online'
                            ? 'bg-sky-500/10 border-sky-500/30 text-sky-500'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        }`}>
                          {doc.documentType === 'online' ? <FileCode size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="truncate min-w-0" title={doc.name}>
                          <p className="font-bold text-xs text-[var(--text-primary)] truncate">{doc.name}</p>
                          {doc.originalName && doc.originalName !== doc.name && (
                            <p className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">{doc.originalName}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{getTypeBadge(doc.documentType)}</TableCell>
                    <TableCell className="font-mono-code text-xs text-[var(--text-muted)] text-center">
                      {formatFileSize(doc.size)}
                    </TableCell>
                    <TableCell className="max-w-0 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {doc.workspaceIds?.slice(0, 2).map((wsId) => (
                          <span key={wsId} className="px-2.5 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-md font-mono-code text-xs truncate max-w-[120px]" title={getWorkspaceName(wsId)}>
                            {getWorkspaceName(wsId)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono-code text-xs text-[var(--text-muted)] text-center">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openViewModal(doc)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-sky-500 transition-colors cursor-pointer"
                          title={t('documents.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {doc.documentType === 'online' && (
                          <button
                            onClick={() => openEditModal(doc)}
                            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-amber-500 transition-colors cursor-pointer"
                            title={t('documents.edit')}
                          >
                            <Edit size={15} />
                          </button>
                        )}
                        {doc.documentType === 'upload' && (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-emerald-500 transition-colors cursor-pointer"
                            title={t('documents.download')}
                          >
                            <Download size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                          title={t('documents.delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>

            {/* Mobile Responsive Cards Grid (<768px) */}
            <div className="block md:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--border-color)]">
              {documents.map((doc) => (
                <div key={doc._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        doc.documentType === 'online'
                          ? 'bg-sky-500/10 border-sky-500/30 text-sky-500'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      }`}>
                        {doc.documentType === 'online' ? <FileCode size={16} /> : <FileText size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{doc.name}</p>
                        <p className="text-[11px] font-mono-code text-[var(--text-muted)]">Size: {formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    {getTypeBadge(doc.documentType)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-color)]">
                    <span className="font-mono-code text-[11px] text-[var(--text-muted)]">#{doc._id?.slice(-6)}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(doc)} title={t('documents.view')}><Eye size={14} /></Button>
                      {doc.documentType === 'online' && (
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(doc)} title={t('documents.edit')}><Edit size={14} /></Button>
                      )}
                      {doc.documentType === 'upload' && (
                        <Button variant="secondary" size="sm" onClick={() => handleDownload(doc)} title={t('documents.download')}><Download size={14} /></Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => handleDelete(doc._id)} title={t('documents.delete')}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {documents.length === 0 && !isLoading && (
              <div className="text-center py-16 text-[var(--text-muted)] space-y-2">
                <FileText className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-xs font-medium">
                  {t('documents.empty')}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-[var(--border-color)] gap-3 bg-[var(--bg-tertiary)]/30">
                <p className="text-xs font-mono-code text-[var(--text-muted)]">
                  {t('documents.page')} {page} / {totalPages} ({t('documents.total')} {absoluteTotal} {t('documents.records')})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    {t('documents.prevPage')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t('documents.nextPage')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Delete Modal (kept as modal — instant action) */}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
