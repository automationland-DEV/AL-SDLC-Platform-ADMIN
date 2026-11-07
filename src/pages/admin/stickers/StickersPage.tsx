import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  CheckCircle2,
  Copy,
  Database,
  Edit3,
  HardDrive,
  Layers,
  Pause,
  Play,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  formatBytes,
  resolveStickerMediaUrl,
  stickerService,
  type ImportedPackDetail,
  type ImportedPackItem,
  type ImportedStickerItem,
  type StickerOverviewStats,
} from '../../../services/stickerService';

interface AnimatedStickerProps {
  animatedUrl: string;
  thumbUrl: string;
  animatedType: string;
  frames: number;
  size?: number;
  autoPlay?: boolean;
  fps?: number;
  className?: string;
}

export function AnimatedSticker({
  animatedUrl,
  thumbUrl,
  animatedType,
  frames,
  size = 84,
  autoPlay = true,
  fps = 14,
  className = '',
}: AnimatedStickerProps) {
  const [hovered, setHovered] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const shouldPlay = autoPlay || hovered;
  const safeFrames = Math.max(1, Number(frames) || 1);
  const isSpriteSheet =
    animatedType?.toLowerCase() === 'png' && safeFrames > 1;

  useEffect(() => {
    if (!isSpriteSheet || !shouldPlay) {
      setFrameIndex(0);
      return;
    }
    const intervalMs = Math.max(40, Math.round(1000 / Math.max(1, fps)));
    const timer = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % safeFrames);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isSpriteSheet, shouldPlay, safeFrames, fps]);

  const resolvedAnimated = resolveStickerMediaUrl(animatedUrl);
  const resolvedThumb = resolveStickerMediaUrl(thumbUrl || animatedUrl);

  if (isSpriteSheet && shouldPlay) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `url("${resolvedAnimated}")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${safeFrames * size}px ${size}px`,
          backgroundPosition: `-${frameIndex * size}px 0px`,
        }}
        className={`shrink-0 select-none ${className}`}
      />
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`shrink-0 flex items-center justify-center select-none ${className}`}
    >
      <img
        src={shouldPlay ? resolvedAnimated : resolvedThumb}
        alt="sticker"
        loading="lazy"
        className="max-w-full max-h-full object-contain pointer-events-none"
      />
    </div>
  );
}

export default function StickersPage() {
  const [autoPlayGrid, setAutoPlayGrid] = useState<boolean>(true);
  const [importing, setImporting] = useState(false);

  // Overview stats
  const [overview, setOverview] = useState<StickerOverviewStats | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Backend Stickers state
  const [importedPacks, setImportedPacks] = useState<ImportedPackItem[]>([]);
  const [importedPackSearch, setImportedPackSearch] = useState('');
  const [importedPackStatus, setImportedPackStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [loadingImportedPacks, setLoadingImportedPacks] = useState(false);
  const [selectedImportedCateId, setSelectedImportedCateId] = useState<string>('');
  const [importedPackDetail, setImportedPackDetail] =
    useState<ImportedPackDetail | null>(null);
  const [loadingImportedDetail, setLoadingImportedDetail] = useState(false);

  // Sticker Editor & Interactive Test
  const [selectedImportedSticker, setSelectedImportedSticker] =
    useState<ImportedStickerItem | null>(null);
  const [editStickerTitle, setEditStickerTitle] = useState('');
  const [editStickerKeywords, setEditStickerKeywords] = useState('');
  const [editStickerActive, setEditStickerActive] = useState(true);
  const [savingSticker, setSavingSticker] = useState(false);

  // Pack Editor
  const [editPackTitle, setEditPackTitle] = useState('');
  const [editPackKeywords, setEditPackKeywords] = useState('');
  const [savingPack, setSavingPack] = useState(false);

  // Interactive test chat simulation messages
  const [testMessages, setTestMessages] = useState<
    Array<{
      id: string;
      sticker: ImportedStickerItem;
      sentAt: string;
    }>
  >([]);

  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const data = await stickerService.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load sticker overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadImportedPacks = async (preferredCateId?: string) => {
    try {
      setLoadingImportedPacks(true);
      const res = await stickerService.listImportedPacks({
        search: importedPackSearch || undefined,
        status: importedPackStatus,
      });
      const list = res.items || [];
      setImportedPacks(list);
      const targetCate =
        preferredCateId ||
        (list.some((p) => p.cateId === selectedImportedCateId)
          ? selectedImportedCateId
          : list[0]?.cateId || '');
      setSelectedImportedCateId(targetCate);
      if (!targetCate) {
        setImportedPackDetail(null);
        setSelectedImportedSticker(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách sticker trong Backend');
    } finally {
      setLoadingImportedPacks(false);
    }
  };

  const loadImportedPackDetail = async (cateId: string) => {
    if (!cateId) return;
    try {
      setLoadingImportedDetail(true);
      const detail = await stickerService.getImportedPackDetail(cateId);
      setImportedPackDetail(detail);
      setEditPackTitle(detail.title || detail.name);
      setEditPackKeywords((detail.topKeywords || []).join(', '));
      if (detail.stickers?.length > 0) {
        const keep = detail.stickers.find(
          (s) => s.stickerId === selectedImportedSticker?.stickerId,
        );
        handleSelectImportedSticker(keep || detail.stickers[0]);
      } else {
        setSelectedImportedSticker(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImportedDetail(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    loadImportedPacks();
  }, [importedPackStatus]);

  useEffect(() => {
    if (selectedImportedCateId) {
      loadImportedPackDetail(selectedImportedCateId);
    }
  }, [selectedImportedCateId]);

  const handleSelectImportedSticker = (sticker: ImportedStickerItem) => {
    setSelectedImportedSticker(sticker);
    setEditStickerTitle(sticker.title || '');
    setEditStickerKeywords((sticker.keywords || []).join(', '));
    setEditStickerActive(Boolean(sticker.isActive));
  };

  const handleSaveImportedSticker = async () => {
    if (!selectedImportedSticker) return;
    try {
      setSavingSticker(true);
      const keywords = editStickerKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      const updated = await stickerService.updateImportedSticker(
        selectedImportedSticker.stickerId,
        {
          title: editStickerTitle,
          keywords,
          isActive: editStickerActive,
        },
      );
      toast.success(`Đã cập nhật sticker #${updated.stickerId}`);
      setSelectedImportedSticker(updated);
      if (selectedImportedCateId) {
        await loadImportedPackDetail(selectedImportedCateId);
      }
      await loadOverview();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cập nhật sticker thất bại');
    } finally {
      setSavingSticker(false);
    }
  };

  const handleToggleStickerActiveQuick = async (sticker: ImportedStickerItem) => {
    try {
      const updated = await stickerService.updateImportedSticker(
        sticker.stickerId,
        { isActive: !sticker.isActive },
      );
      toast.success(
        updated.isActive
          ? `Đã bật hiển thị sticker #${sticker.stickerId}`
          : `Đã ẩn sticker #${sticker.stickerId}`,
      );
      if (selectedImportedCateId) {
        await loadImportedPackDetail(selectedImportedCateId);
      }
      await loadOverview();
    } catch {
      toast.error('Không thể đổi trạng thái sticker');
    }
  };

  const handleSetPackCover = async (sticker: ImportedStickerItem) => {
    try {
      await stickerService.updateImportedPack(sticker.cateId, {
        coverStickerId: sticker.stickerId,
      });
      toast.success(`Đã đặt sticker #${sticker.stickerId} làm ảnh đại diện Pack!`);
      await loadImportedPacks(sticker.cateId);
      await loadImportedPackDetail(sticker.cateId);
    } catch {
      toast.error('Không thể đặt ảnh đại diện cho Pack');
    }
  };

  const handleTestInteractSticker = async (sticker: ImportedStickerItem) => {
    try {
      const updated = await stickerService.useSticker(sticker.stickerId);
      setSelectedImportedSticker(updated);
      setTestMessages((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          sticker: updated,
          sentAt: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
        ...prev.slice(0, 7),
      ]);
      if (importedPackDetail) {
        setImportedPackDetail({
          ...importedPackDetail,
          stickers: importedPackDetail.stickers.map((s) =>
            s.stickerId === updated.stickerId ? updated : s,
          ),
        });
      }
      loadOverview();
    } catch {
      toast.error('Không thể gửi thử sticker');
    }
  };

  const handleDeleteImportedSticker = async (sticker: ImportedStickerItem) => {
    if (
      !window.confirm(
        `Xóa sticker #${sticker.stickerId} khỏi Backend?`,
      )
    ) {
      return;
    }
    try {
      const res = await stickerService.deleteImportedSticker(sticker.stickerId);
      toast.success(`Đã xóa sticker #${sticker.stickerId} khỏi Backend`);
      await loadOverview();
      if (res.remainingInPack === 0) {
        await loadImportedPacks();
      } else {
        await loadImportedPackDetail(sticker.cateId);
        await loadImportedPacks(sticker.cateId);
      }
    } catch {
      toast.error('Xóa sticker thất bại');
    }
  };

  const handleSaveImportedPack = async () => {
    if (!importedPackDetail) return;
    try {
      setSavingPack(true);
      const topKeywords = editPackKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      await stickerService.updateImportedPack(importedPackDetail.cateId, {
        title: editPackTitle,
        topKeywords,
      });
      toast.success('Đã lưu thông tin Bộ Sticker');
      await loadImportedPacks(importedPackDetail.cateId);
      await loadImportedPackDetail(importedPackDetail.cateId);
    } catch {
      toast.error('Cập nhật bộ sticker thất bại');
    } finally {
      setSavingPack(false);
    }
  };

  const handleTogglePackActive = async (pack: ImportedPackItem) => {
    try {
      await stickerService.updateImportedPack(pack.cateId, {
        isActive: !pack.isActive,
      });
      toast.success(
        !pack.isActive
          ? `Đã HIỆN bộ ${pack.title} trên Frontend`
          : `Đã ẨN bộ ${pack.title} khỏi Frontend`,
      );
      await loadImportedPacks(pack.cateId);
      if (selectedImportedCateId === pack.cateId) {
        await loadImportedPackDetail(pack.cateId);
      }
      await loadOverview();
    } catch {
      toast.error('Không thể đổi trạng thái bộ sticker');
    }
  };

  const handleBulkVisibilityPacks = async (isActive: boolean) => {
    try {
      setImporting(true);
      const res = await stickerService.bulkUpdateVisibility({
        applyToAllPacks: true,
        cascadeStickers: isActive,
        isActive,
      });
      toast.success(
        isActive
          ? `Đã HIỆN toàn bộ ${res.activePackCount} bộ (${res.activeStickerCount} sticker) trên Frontend!`
          : `Đã ẨN toàn bộ các bộ sticker khỏi Frontend!`,
      );
      await Promise.all([
        loadOverview(),
        loadImportedPacks(selectedImportedCateId),
        selectedImportedCateId
          ? loadImportedPackDetail(selectedImportedCateId)
          : Promise.resolve(),
      ]);
    } catch {
      toast.error('Không thể cập nhật trạng thái ẩn/hiện hàng loạt');
    } finally {
      setImporting(false);
    }
  };

  const handleBulkVisibilityPackStickers = async (
    cateId: string,
    isActive: boolean,
  ) => {
    try {
      setImporting(true);
      await stickerService.bulkUpdateVisibility({
        cateIds: [cateId],
        cascadeStickers: true,
        isActive,
      });
      toast.success(
        isActive
          ? `Đã HIỆN bộ #${cateId} và toàn bộ sticker trong bộ trên Frontend!`
          : `Đã ẨN bộ #${cateId} và các sticker trong bộ khỏi Frontend!`,
      );
      await Promise.all([
        loadOverview(),
        loadImportedPacks(cateId),
        loadImportedPackDetail(cateId),
      ]);
    } catch {
      toast.error('Không thể cập nhật trạng thái ẩn/hiện bộ sticker');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteImportedPack = async (pack: ImportedPackItem) => {
    if (
      !window.confirm(
        `Xóa toàn bộ bộ sticker "${pack.title}" (${pack.stickerCount} sticker) khỏi Backend?`,
      )
    ) {
      return;
    }
    try {
      await stickerService.deleteImportedPack(pack.cateId);
      toast.success(`Đã xóa bộ sticker ${pack.title} khỏi Backend`);
      await loadOverview();
      await loadImportedPacks();
    } catch {
      toast.error('Xóa bộ sticker thất bại');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Overview Cards */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[var(--text-primary)]">
                  Quản lý Kho Sticker Hệ Thống
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  Quản lý danh sách bộ sticker trong Backend, bật/tắt hiển thị trên Frontend và chỉnh sửa từ khóa gợi ý.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={importing}
              onClick={() => handleBulkVisibilityPacks(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Hiện tất cả trên FE
            </button>

            <button
              type="button"
              disabled={importing}
              onClick={() => handleBulkVisibilityPacks(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Ẩn tất cả khỏi FE
            </button>

            <button
              type="button"
              onClick={() => setAutoPlayGrid((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                autoPlayGrid
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
              title="Bật/tắt tự động chạy hiệu ứng động trên toàn bộ lưới sticker"
            >
              {autoPlayGrid ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {autoPlayGrid ? 'Đang chạy động toàn bộ' : 'Chỉ chạy khi di chuột'}
            </button>

            <button
              type="button"
              onClick={() => {
                loadOverview();
                loadImportedPacks(selectedImportedCateId);
                if (selectedImportedCateId) {
                  loadImportedPackDetail(selectedImportedCateId);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`}
              />
              Làm mới
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Tổng Sticker trong Backend</span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {overview?.imported.stickerCount?.toLocaleString() ?? 0}{' '}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                stickers / {overview?.imported.packCount ?? 0} packs
              </span>
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Đang kích hoạt (Active trên FE)</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-extrabold text-[var(--text-primary)] mt-1">
              {overview?.imported.activeStickerCount?.toLocaleString() ?? 0}{' '}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                stickers ({overview?.imported.activePackCount ?? 0} packs)
              </span>
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Dung lượng & Lượt dùng</span>
              <HardDrive className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-lg font-extrabold text-[var(--text-primary)] mt-1">
              {formatBytes(overview?.imported.totalStorageBytes)}{' '}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                • {overview?.imported.totalUsageCount ?? 0} lượt tương tác
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Manage & Interact with Backend Stickers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Packs in Backend (3 cols) */}
        <div className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col h-[720px]">
          <div className="p-3 border-b border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--text-primary)]">
                Bộ Sticker ({importedPacks.length})
              </h3>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={importedPackSearch}
                onChange={(e) => setImportedPackSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadImportedPacks();
                }}
                placeholder="Tìm bộ sticker..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>
            <select
              value={importedPackStatus}
              onChange={(e) => setImportedPackStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang bật (Active)</option>
              <option value="inactive">Đang tắt (Inactive)</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loadingImportedPacks ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                Đang tải dữ liệu từ Backend...
              </div>
            ) : importedPacks.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <p className="text-xs text-[var(--text-muted)]">
                  Không tìm thấy bộ sticker nào phù hợp.
                </p>
              </div>
            ) : (
              importedPacks.map((pack) => {
                const isSelected = pack.cateId === selectedImportedCateId;
                return (
                  <div
                    key={pack.cateId}
                    onClick={() => setSelectedImportedCateId(pack.cateId)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-xs'
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                        {pack.coverThumbUrl ? (
                          <img
                            src={resolveStickerMediaUrl(pack.coverThumbUrl)}
                            alt={pack.title}
                            className="w-9 h-9 object-contain"
                          />
                        ) : (
                          <Layers className="w-5 h-5 text-[var(--text-muted)]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {pack.title}
                          </p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              pack.isActive
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-500'
                            }`}
                          >
                            {pack.isActive ? 'BẬT' : 'TẮT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {pack.activeStickerCount}/{pack.stickerCount} active •{' '}
                          {formatBytes(pack.totalStorageBytes)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-[var(--border-color)]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePackActive(pack);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {pack.isActive ? 'Tạm ẩn' : 'Kích hoạt'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImportedPack(pack);
                        }}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="Xóa bộ sticker khỏi Backend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Pack Editor & Stickers Grid (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col h-[720px]">
          {loadingImportedDetail ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)]">
              Đang tải chi tiết bộ sticker...
            </div>
          ) : !importedPackDetail ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)]">
              Chọn 1 bộ sticker bên trái để quản lý và tương tác
            </div>
          ) : (
            <>
              {/* Pack Metadata Quick Edit Bar */}
              <div className="p-3 border-b border-[var(--border-color)] space-y-2 bg-[var(--bg-primary)]/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Bộ #{importedPackDetail.cateId} •{' '}
                    <span
                      className={
                        importedPackDetail.isActive
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }
                    >
                      {importedPackDetail.isActive
                        ? 'ĐANG HIỆN TRÊN FE'
                        : 'ĐANG ẨN KHỎI FE'}
                    </span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={importing}
                      onClick={() =>
                        handleBulkVisibilityPackStickers(
                          importedPackDetail.cateId,
                          true,
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold cursor-pointer"
                    >
                      Hiện cả bộ trên FE
                    </button>
                    <button
                      type="button"
                      disabled={importing}
                      onClick={() =>
                        handleBulkVisibilityPackStickers(
                          importedPackDetail.cateId,
                          false,
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-[11px] font-bold cursor-pointer"
                    >
                      Ẩn cả bộ khỏi FE
                    </button>
                    <button
                      type="button"
                      disabled={savingPack}
                      onClick={handleSaveImportedPack}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {savingPack ? 'Đang lưu...' : 'Lưu tên & từ khóa'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-0.5">
                      Tên hiển thị Bộ Sticker
                    </label>
                    <input
                      type="text"
                      value={editPackTitle}
                      onChange={(e) => setEditPackTitle(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg text-xs bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-0.5">
                      Từ khóa Pack (cách nhau dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={editPackKeywords}
                      onChange={(e) => setEditPackKeywords(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg text-xs bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Stickers Grid */}
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
                {importedPackDetail.stickers.map((st) => {
                  const isSelected =
                    selectedImportedSticker?.stickerId === st.stickerId;
                  return (
                    <div
                      key={st.stickerId}
                      onClick={() => handleSelectImportedSticker(st)}
                      className={`rounded-xl p-2.5 border transition-all flex flex-col items-center cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                          : !st.isActive
                            ? 'bg-[var(--bg-primary)]/50 border-[var(--border-color)] opacity-60'
                            : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[10px]">
                        <span className="font-mono-code text-[var(--text-muted)]">
                          #{st.stickerId}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            st.isActive
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {st.isActive ? 'Bật' : 'Tắt'}
                        </span>
                      </div>

                      <div className="my-1.5 flex items-center justify-center h-[88px] w-[88px]">
                        <AnimatedSticker
                          animatedUrl={st.animatedUrl}
                          thumbUrl={st.thumbUrl}
                          animatedType={st.animatedType}
                          frames={st.frames}
                          size={84}
                          autoPlay={autoPlayGrid}
                        />
                      </div>

                      <p className="text-xs font-bold text-[var(--text-primary)] truncate w-full text-center">
                        {st.title}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Đã dùng: {st.usageCount || 0} lần
                      </p>

                      <div className="w-full flex items-center gap-1 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestInteractSticker(st);
                          }}
                          className="flex-1 py-1 px-2 rounded bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          title="Bấm để gửi thử sticker này vào khung tương tác"
                        >
                          <Send className="w-3 h-3" />
                          Thử
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStickerActiveQuick(st);
                          }}
                          className="py-1 px-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] font-semibold text-[var(--text-secondary)] cursor-pointer"
                        >
                          {st.isActive ? 'Ẩn' : 'Bật'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Admin Interaction, Editor & Live Chat Sandbox (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col h-[720px]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Tương Tác & Chỉnh Sửa Sticker
              </h3>
            </div>
          </div>

          {!selectedImportedSticker ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)] text-center px-6">
              Chọn một sticker ở giữa để chỉnh sửa tên, từ khóa, bật/tắt hiển thị hoặc gửi tương tác thử.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pt-3">
              {/* Preview & Quick Actions */}
              <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 flex items-center gap-4">
                <div className="w-28 h-28 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                  <AnimatedSticker
                    animatedUrl={selectedImportedSticker.animatedUrl}
                    thumbUrl={selectedImportedSticker.thumbUrl}
                    animatedType={selectedImportedSticker.animatedType}
                    frames={selectedImportedSticker.frames}
                    size={100}
                    autoPlay={true}
                  />
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {selectedImportedSticker.title}
                  </p>
                  <p className="text-xs font-mono-code text-[var(--text-secondary)]">
                    ID: #{selectedImportedSticker.stickerId} •{' '}
                    {selectedImportedSticker.frames} frames
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Dung lượng: {formatBytes(selectedImportedSticker.animatedSize)} •{' '}
                    Lượt dùng: {selectedImportedSticker.usageCount || 0}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTestInteractSticker(selectedImportedSticker)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      Gửi tương tác thử
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPackCover(selectedImportedSticker)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-primary)] cursor-pointer"
                    >
                      Đặt làm bìa Pack
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit Metadata Form */}
              <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Tên / Nhãn Sticker
                  </label>
                  <input
                    type="text"
                    value={editStickerTitle}
                    onChange={(e) => setEditStickerTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    <Tag className="w-3 h-3 inline mr-1" />
                    Từ khóa gợi ý khi gõ chat (cách nhau dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={editStickerKeywords}
                    onChange={(e) => setEditStickerKeywords(e.target.value)}
                    placeholder="xin chào, hello, vui vẻ..."
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editStickerActive}
                      onChange={(e) => setEditStickerActive(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    Cho phép người dùng sử dụng trong hệ thống
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={savingSticker}
                    onClick={handleSaveImportedSticker}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {savingSticker ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteImportedSticker(selectedImportedSticker)
                    }
                    className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mb-1">
                    <span>URL Media từ Backend:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          resolveStickerMediaUrl(selectedImportedSticker.animatedUrl),
                        );
                        toast.success('Đã copy URL sticker từ Backend!');
                      }}
                      className="inline-flex items-center gap-1 text-sky-500 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy URL
                    </button>
                  </div>
                  <code className="block p-1.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] font-mono-code break-all text-[var(--text-secondary)]">
                    {resolveStickerMediaUrl(selectedImportedSticker.animatedUrl)}
                  </code>
                </div>
              </div>

              {/* Live Interactive Sandbox (Khung Test Tương Tác Sticker) */}
              <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Khung Tương Tác Thử (Chat / Comment Preview)
                  </span>
                  {testMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTestMessages([])}
                      className="text-[11px] text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                    >
                      Xóa lịch sử thử
                    </button>
                  )}
                </div>

                {testMessages.length === 0 ? (
                  <p className="text-[11px] text-[var(--text-muted)] py-4 text-center">
                    Bấm nút <b>"Thử"</b> hoặc <b>"Gửi tương tác thử"</b> để kiểm tra hiển thị thực tế khi gửi sticker.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {testMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-end justify-end gap-2 bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]"
                      >
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-sky-500 block">
                            Admin vừa gửi • {msg.sentAt}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)]">
                            {msg.sticker.title} (#{msg.sticker.stickerId})
                          </span>
                        </div>
                        <AnimatedSticker
                          animatedUrl={msg.sticker.animatedUrl}
                          thumbUrl={msg.sticker.thumbUrl}
                          animatedType={msg.sticker.animatedType}
                          frames={msg.sticker.frames}
                          size={64}
                          autoPlay={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
