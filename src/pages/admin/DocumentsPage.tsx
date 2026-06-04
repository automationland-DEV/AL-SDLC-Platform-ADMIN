import { useEffect, useState } from 'react';
import { Search, Edit, Trash2, Eye, Download, Upload, FileText } from 'lucide-react';
import { Button, Card, Badge, Table, TableRow, TableCell } from '../../components/ui';
import { useDocumentsStore } from '../../stores';

export default function DocumentsPage() {
  const {
    documents, total, page, totalPages, isLoading,
    fetchDocuments, setFilter, deleteDocument
  } = useDocumentsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments]);

  const handleFilterChange = (type: string) => {
    setTypeFilter(type);
    setFilter(type);
    fetchDocuments(1, type);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa tài liệu này?')) {
      await deleteDocument(id);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Documents</h2>
          <p className="text-gray-500 mt-1">Tổng cộng {total} tài liệu</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <FileText className="w-4 h-4 mr-2" />
            Tạo Online
          </Button>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleFilterChange('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'upload'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => handleFilterChange('online')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'online'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Online
            </button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <Table headers={['ID', 'Tên', 'Loại', 'Kích thước', 'Workspace', 'Người tạo', 'Ngày tạo', 'Thao tác']}>
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>#{doc._id?.slice(-6)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc.documentType === 'online' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {getTypeIcon(doc.documentType)}
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        {doc.originalName && doc.originalName !== doc.name && (
                          <p className="text-xs text-gray-500">{doc.originalName}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(doc.documentType)}</TableCell>
                  <TableCell>{formatFileSize(doc.size)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {doc.workspaceIds?.slice(0, 2).map((wsId) => (
                        <span key={wsId} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                          WS
                        </span>
                      ))}
                      {(doc.workspaceIds?.length || 0) > 2 && (
                        <span className="text-xs text-gray-500">+{(doc.workspaceIds?.length || 0) - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {doc.documentType === 'upload' && (
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
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
            {documents.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có tài liệu nào</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
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
      </Card>
    </div>
  );
}
