import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Search,
  Users,
  Layers,
  RefreshCw,
  CheckCircle2,
  XCircle,
  UserCheck,
  Filter,
  Check,
} from 'lucide-react';
import {
  avatarFrameAdminService,
  type AdminAvatarFrameOverview,
  type AdminAvatarFrameUserSearchItem,
} from '../../../services/avatarFrameService';
import { resolveAvatarFrameUrl, resolveAvatarUrl } from '../../../utils/avatar';
import { Button, Badge } from '../../../components/ui';

export default function AvatarFramesPage() {
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overview, setOverview] = useState<AdminAvatarFrameOverview | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'catalog'>('users');

  // Search & Filters for Catalog
  const [frameSearch, setFrameSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // User search & Assignment state
  const [userSearch, setUserSearch] = useState('');
  const [usersList, setUsersList] = useState<AdminAvatarFrameUserSearchItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modal / Assign selection
  const [selectedUserForAssign, setSelectedUserForAssign] =
    useState<AdminAvatarFrameUserSearchItem | null>(null);
  const [assignFrameId, setAssignFrameId] = useState<string | null>(null);
  const [savingAssign, setSavingAssign] = useState(false);

  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const data = await avatarFrameAdminService.getOverview();
      setOverview(data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu tổng quan khung avatar');
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadUsers = async (searchStr?: string) => {
    try {
      setLoadingUsers(true);
      const data = await avatarFrameAdminService.searchUsers(searchStr, 100);
      setUsersList(data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tìm danh sách người dùng');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadUsers();
  }, []);

  const handleSearchUsersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(userSearch);
  };

  const categories = useMemo(() => {
    if (overview?.categories && overview.categories.length > 0) {
      return overview.categories.filter((c) => c.id !== 'all');
    }
    if (!overview?.catalog) return [];
    const set = new Set<string>();
    overview.catalog.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).map((c) => ({ id: c, name: c, nameVi: c }));
  }, [overview]);

  const filteredFrames = useMemo(() => {
    if (!overview?.catalog) return [];
    return overview.catalog.filter((f) => {
      const q = frameSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.nameVi && f.nameVi.toLowerCase().includes(q)) ||
        f.id.toLowerCase().includes(q);
      const matchCat =
        selectedCategory === 'all' || f.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [overview, frameSearch, selectedCategory]);

  const handleOpenAssignModal = (user: AdminAvatarFrameUserSearchItem) => {
    setSelectedUserForAssign(user);
    setAssignFrameId(user.avatarFrame || null);
  };

  const handleExecuteAssign = async () => {
    if (!selectedUserForAssign) return;
    try {
      setSavingAssign(true);
      const res = await avatarFrameAdminService.assignFrame(
        selectedUserForAssign.id,
        assignFrameId,
      );
      toast.success(
        res.avatarFrame
          ? `Đã gắn khung cho ${selectedUserForAssign.fullName || selectedUserForAssign.email}`
          : `Đã gỡ khung của ${selectedUserForAssign.fullName || selectedUserForAssign.email}`,
      );

      // Cập nhật lại danh sách users hiển thị
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === selectedUserForAssign.id ? { ...u, avatarFrame: res.avatarFrame } : u,
        ),
      );

      // Reload overview stats
      loadOverview();
      setSelectedUserForAssign(null);
    } catch (err) {
      console.error(err);
      toast.error('Gán khung avatar thất bại');
    } finally {
      setSavingAssign(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 font-sans pb-10">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">
                Quản lý Khung Avatar (Avatar Frames)
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Kho hiệu ứng viền động {overview?.totalFrames || 107} khung GIF & phân quyền cho thành viên
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadOverview();
              loadUsers(userSearch);
            }}
            disabled={loadingOverview || loadingUsers}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${
                loadingOverview || loadingUsers ? 'animate-spin' : ''
              }`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[var(--text-muted)]">Tổng số khung GIF</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {overview?.totalFrames ?? 107}
            </div>
            <div className="text-[11px] text-purple-600 mt-1 font-medium">100% Sẵn sàng sử dụng</div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[var(--text-muted)]">User đang gắn khung</div>
            <div className="text-2xl font-bold text-sky-600 mt-1">
              {overview?.totalUsersWithFrame ?? 0}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Thành viên hệ thống</div>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[var(--text-muted)]">Chế độ phân phối</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">Trực tiếp</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">User tự chọn hoặc Super Admin gán</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'users'
              ? 'text-sky-600 border-b-2 border-sky-600'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Users className="w-4 h-4" />
          Quản lý gán khung cho thành viên ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-2.5 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'text-sky-600 border-b-2 border-sky-600'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Kho 107 Khung GIF ({overview?.catalog?.length || 107})
        </button>
      </div>

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {/* User search bar */}
          <form
            onSubmit={handleSearchUsersSubmit}
            className="flex flex-col sm:flex-row gap-2 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm user theo tên hoặc email để gán khung..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <Button type="submit" size="sm" disabled={loadingUsers}>
              {loadingUsers ? 'Đang tìm...' : 'Tìm kiếm'}
            </Button>
          </form>

          {/* Table of users */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-primary)] text-xs text-[var(--text-muted)] uppercase border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-3">Thành viên</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Khung đang dùng</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                        Không tìm thấy người dùng nào
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => {
                      const frameUrl = resolveAvatarFrameUrl(u.avatarFrame);
                      const avatarUrl = resolveAvatarUrl(u.avatarUrl);
                      return (
                        <tr key={u.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={u.fullName}
                                    className="w-9 h-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                                    {u.fullName?.charAt(0) || u.email?.charAt(0) || 'U'}
                                  </div>
                                )}
                                {frameUrl && (
                                  <img
                                    src={frameUrl}
                                    alt="Frame"
                                    className="absolute inset-0 w-full h-full pointer-events-none object-contain scale-[1.3]"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-[var(--text-primary)]">
                                  {u.fullName || 'Chưa cập nhật tên'}
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.role === 'super_admin' ? 'info' : 'default'} mono>
                              {u.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {u.avatarFrame ? (
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                {u.avatarFrame}
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">Chưa có khung</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenAssignModal(u)}
                            >
                              Đổi / Gỡ khung
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Catalog of 107 Frames */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Catalog filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm khung avatar theo tên hoặc id..."
                value={frameSearch}
                onChange={(e) => setFrameSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">Tất cả thể loại</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameVi || cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of frames */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredFrames.map((frame) => {
              const fullUrl = resolveAvatarFrameUrl(frame.id);
              return (
                <div
                  key={frame.id}
                  className="group relative flex flex-col items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 hover:border-purple-500/50 hover:shadow-md transition-all text-center"
                >
                  <div className="relative w-20 h-20 my-2 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700/60" />
                    {fullUrl && (
                      <img
                        src={fullUrl}
                        alt={frame.name}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.25]"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="w-full mt-2">
                    <div
                      className="text-xs font-semibold text-[var(--text-primary)] truncate"
                      title={frame.name}
                    >
                      {frame.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{frame.id}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assign / Remove Frame Modal */}
      {selectedUserForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Gán Khung Cho: {selectedUserForAssign.fullName || selectedUserForAssign.email}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Chọn khung GIF từ kho hiệu ứng hoặc gỡ bỏ khung hiện tại của người dùng
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAssign(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Picker */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]">
                <div className="text-xs text-[var(--text-muted)]">
                  Khung đang chọn:
                  <span className="ml-1.5 font-semibold text-[var(--text-primary)]">
                    {assignFrameId || '(Không sử dụng khung nào)'}
                  </span>
                </div>
                {assignFrameId && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setAssignFrameId(null)}
                  >
                    Gỡ khung
                  </Button>
                )}
              </div>

              {/* Grid of options */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto p-1">
                {overview?.catalog?.map((f) => {
                  const isSelected = assignFrameId === f.id;
                  const fullUrl = resolveAvatarFrameUrl(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAssignFrameId(f.id)}
                      className={`relative flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                        isSelected
                          ? 'border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20'
                          : 'border-[var(--border-color)] hover:border-purple-400/50 bg-[var(--bg-primary)]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <div className="relative w-14 h-14 my-1 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                        {fullUrl && (
                          <img
                            src={fullUrl}
                            alt={f.name}
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.3]"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-[var(--text-primary)] truncate w-full mt-1">
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedUserForAssign(null)}
                disabled={savingAssign}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteAssign}
                disabled={savingAssign}
              >
                {savingAssign ? 'Đang lưu...' : 'Xác nhận gán'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
