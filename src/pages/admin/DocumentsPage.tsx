/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Search, Edit, Trash2, Eye, Download, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Table, TableRow, TableCell, SearchableSelect, ConfirmModal } from '../../components/ui';
import { useDocumentsStore, useWorkspacesStore } from '../../stores';
import { documentService } from '../../services';
import type { Document } from '../../types';

import { DocOnlineModal } from './components/documents/DocOnlineModal';
import { DocUploadModal } from './components/documents/DocUploadModal';
import { DocEditModal } from './components/documents/DocEditModal';
import { DocViewModal } from './components/documents/DocViewModal';

export default function DocumentsPage() {
  const {
    documents, absoluteTotal, page, totalPages, isLoading,
    fetchDocuments, setFilter, setWorkspaceFilter, deleteDocument
  } = useDocumentsStore();

  const { workspaces, fetchWorkspaces } = useWorkspacesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [wsFilter, setWsFilter] = useState('all');

  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedDocToView, setSelectedDocToView] = useState<Document | null>(null);

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

  useEffect(() => {
    fetchDocuments(1);
    fetchWorkspaces();
  }, [fetchDocuments, fetchWorkspaces]);

  const handleFilterChange = (type: string) => {
    setTypeFilter(type);
    setFilter(type);
    fetchDocuments(1, type, wsFilter);
  };

  const handleWorkspaceFilterChange = (wsId: string) => {
    setWsFilter(wsId);
    setWorkspaceFilter(wsId);
    fetchDocuments(1, typeFilter, wsId);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setFilter('all');
    setWsFilter('all');
    setWorkspaceFilter('all');
    fetchDocuments(1, 'all', 'all');
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa tài liệu này?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDocument(id);
          toast.success('Xóa tài liệu thành công');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          toast.error(error.response?.data?.message || error.message || 'Xóa tài liệu thất bại');
        }
      }
    });
  };

  const handleCreateOnline = async (docName: string, docContent: string, workspaceId: string) => {
    try {
      const wIds = workspaceId ? [workspaceId] : [];
      await documentService.createOnline(docName, docContent, wIds);
      setShowOnlineModal(false);
      fetchDocuments(1);
      toast.success('Tạo tài liệu online thành công');
    } catch (error: any) {
      console.error('Failed to create online document:', error);
      throw error;
    }
  };

  const handleCloseOnlineModal = (isDirty: boolean) => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận đóng',
        message: 'Bạn có thay đổi chưa lưu. Đóng mà không lưu?',
        type: 'warning',
        onConfirm: () => {
          setShowOnlineModal(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
    setShowOnlineModal(false);
  };

  const handleCloseEditModal = (isDirty: boolean) => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận đóng',
        message: 'Bạn có thay đổi chưa lưu. Đóng mà không lưu?',
        type: 'warning',
        onConfirm: () => {
          setShowEditModal(false);
          setSelectedDoc(null);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
    setShowEditModal(false);
    setSelectedDoc(null);
  };

  const handleUploadFile = async (file: File, docName: string, workspaceId: string) => {
    try {
      const wIds = workspaceId ? [workspaceId] : [];
      await documentService.upload(file, docName, wIds);
      setShowUploadModal(false);
      fetchDocuments(1);
      toast.success('Upload tài liệu thành công');
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  };

  const handleSaveEdit = async (docName: string, docContent: string, workspaceId: string) => {
    if (!selectedDoc) return;
    try {
      const wIds = workspaceId ? [workspaceId] : [];
      const nameChanged = selectedDoc.name !== docName;
      const workspaceChanged = JSON.stringify(selectedDoc.workspaceIds || []) !== JSON.stringify(wIds);

      if (nameChanged || workspaceChanged) {
        await documentService.update(selectedDoc._id, {
          name: docName,
          workspaceIds: wIds,
        });
      }
      
      if (selectedDoc.documentType === 'online' && docContent !== undefined) {
        await documentService.updateContent(selectedDoc._id, docContent);
      }

      setShowEditModal(false);
      setSelectedDoc(null);
      fetchDocuments(page);
      toast.success('Cập nhật tài liệu thành công');
    } catch (error: any) {
      console.error('Failed to update document:', error);
      toast.error('Cập nhật thất bại. Bạn chỉ có thể sửa tài liệu do chính mình tạo.');
      throw error;
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      toast.loading('Đang tải xuống...', { id: 'download-doc' });
      const isOnline = doc.documentType === 'online';
      const { data, filename } = await documentService.download(doc._id, isOnline);
      
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      
      const fallbackName = doc.documentType === 'online'
        ? `${doc.name}.docx`
        : (doc.originalName || `${doc.name}${doc.extension || ''}`);
        
      link.setAttribute('download', filename || fallbackName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Tải xuống thành công', { id: 'download-doc' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Lỗi khi tải tài liệu', { id: 'download-doc' });
    }
  };

  const openViewModal = (doc: Document) => {
    setSelectedDocToView(doc);
    setShowViewModal(true);
  };

  const openOnlineModal = () => {
    setShowOnlineModal(true);
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
  };

  const openEditModal = (doc: Document) => {
    setSelectedDoc(doc);
    setShowEditModal(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeIcon = (type?: string) => {
    return type === 'online' ? <FileText className="w-4 h-4" /> : <Upload className="w-4 h-4" />;
  };

  const getTypeBadge = (type?: string) => {
    const variant = type === 'online' ? 'info' : 'default';
    const label = type === 'online' ? 'Online' : 'Upload';
    return <Badge variant={variant}><span className="flex items-center gap-1">{getTypeIcon(type)} {label}</span></Badge>;
  };

  const getWorkspaceName = (wsId: string) => {
    const ws = workspaces.find((w) => w._id === wsId);
    return ws ? ws.name : 'WS';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Documents</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tổng cộng {absoluteTotal} documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={openOnlineModal}>
            <FileText className="w-4 h-4 mr-2" />
            Tạo Online
          </Button>
          <Button onClick={openUploadModal}>
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-4 py-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Workspace Filter Dropdown */}
          <div className="flex-1 min-w-[250px]">
            <SearchableSelect
              value={wsFilter}
              onChange={handleWorkspaceFilterChange}
              options={[
                { value: 'all', label: 'Tất cả workspace' },
                ...workspaces.map((ws) => ({ value: ws._id, label: ws.name }))
              ]}
              placeholder="Tất cả workspace"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${typeFilter === 'all'
                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700/50 dark:text-primary-300 shadow-sm'
                : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleFilterChange('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${typeFilter === 'upload'
                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700/50 dark:text-primary-300 shadow-sm'
                : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                }`}
            >
              Upload
            </button>
            <button
              onClick={() => handleFilterChange('online')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${typeFilter === 'online'
                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700/50 dark:text-primary-300 shadow-sm'
                : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                }`}
            >
              Online
            </button>
          </div>

          {/* Reset Button */}
          {(searchTerm !== '' || typeFilter !== 'all' || wsFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:text-red-400 dark:hover:border-red-800/50 transition-colors ml-auto"
            >
              Làm mới
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] flex flex-col flex-1 min-h-0 overflow-hidden relative">
        {isLoading && documents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0">
              <Table 
                fixedLayout
                headers={[
                  { label: 'ID', className: 'w-[8%]' },
                  { label: 'Tên', className: 'w-[25%]' },
                  { label: 'Loại', align: 'center', className: 'w-[10%]' },
                  { label: 'Kích thước', align: 'center', className: 'w-[10%]' },
                  { label: 'Workspace', align: 'center', className: 'w-[15%]' },
                  { label: 'Người tạo', align: 'center', className: 'w-[15%]' },
                  { label: 'Ngày tạo', align: 'center', className: 'w-[10%]' },
                  { label: 'Thao tác', align: 'center', className: 'w-[7%]' }
                ]}
              >
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>#{doc._id?.slice(-6)}</TableCell>
                  <TableCell className="max-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center ${doc.documentType === 'online' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {getTypeIcon(doc.documentType)}
                      </div>
                      <div className="flex-1 min-w-0 truncate" title={doc.name}>
                        <p className="font-medium truncate">{doc.name}</p>
                        {doc.originalName && doc.originalName !== doc.name && (
                          <p className="text-xs text-[var(--text-secondary)] truncate" title={doc.originalName}>{doc.originalName}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{getTypeBadge(doc.documentType)}</TableCell>
                  <TableCell className="text-center">{formatFileSize(doc.size)}</TableCell>
                  <TableCell className="max-w-0">
                    <div className="flex items-center justify-center gap-1 flex-wrap truncate">
                      {doc.workspaceIds?.slice(0, 2).map((wsId) => (
                        <span key={wsId} className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded text-xs truncate max-w-[80px]" title={getWorkspaceName(wsId)}>
                          {getWorkspaceName(wsId)}
                        </span>
                      ))}
                      {(doc.workspaceIds?.length || 0) > 2 && (
                        <span className="text-xs text-[var(--text-secondary)]">+{(doc.workspaceIds?.length || 0) - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.uploadedBy
                      ? typeof doc.uploadedBy === 'object'
                        ? doc.uploadedBy.fullName || doc.uploadedBy.email || 'Unknown'
                        : 'Unknown'
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openViewModal(doc)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-green-600"
                        title="Tải xuống"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(doc)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-red-600"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>

            {/* Empty State */}
            {documents.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Chưa có tài liệu nào</p>
              </div>
            )}
            </div>

            {/* Overlay loading indicator for pagination */}
            {isLoading && documents.length > 0 && (
              <div className="absolute inset-0 bg-[var(--card-bg)]/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-2.5 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)]">
                  Trang {page} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => fetchDocuments(page - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchDocuments(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DocOnlineModal
        isOpen={showOnlineModal}
        onClose={handleCloseOnlineModal}
        onSave={handleCreateOnline}
        workspaces={workspaces}
      />

      <DocUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadFile}
        workspaces={workspaces}
      />

      {selectedDoc && (
        <DocEditModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          selectedDoc={selectedDoc}
          workspaces={workspaces}
        />
      )}

      {selectedDocToView && (
        <DocViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          document={selectedDocToView}
          onDownload={() => handleDownload(selectedDocToView)}
          formatFileSize={formatFileSize}
          workspaces={workspaces}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />
    </div>
  );
}
