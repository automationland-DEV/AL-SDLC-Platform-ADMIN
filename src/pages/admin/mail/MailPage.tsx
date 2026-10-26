import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Megaphone,
  MessagesSquare,
  Plus,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Input, PageHeader, Select, Table, TableCell, TableRow } from '../../../components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  useCancelBroadcastMutation,
  useCreateBroadcastMutation,
  useCreateTemplateMutation,
  useDeleteInternalMailMutation,
  useDeleteTemplateMutation,
  useInternalMailDetailQuery,
  useInternalMailMessagesQuery,
  useInternalMailStatsQuery,
  useMailBroadcastsQuery,
  useMailStatsQuery,
  useMailTemplatesQuery,
  usePreviewAudienceMutation,
  useSearchRecipientsQuery,
} from '../../../hooks/queries';
import { useDebounce } from '../../../hooks/useDebounce';
import { mailService } from '../../../services/mailService';
import type {
  MailBroadcastAudience,
  MailBroadcastStatus,
  MailDeliveryMode,
  MailRecipient,
} from '../../../services/mailService';
import { hasHtmlContent, plainTextToHtml } from '../../../utils/mailBody';
import MailRichTextEditor from '../../../components/mail/MailRichTextEditor';

/** Avatar of a recipient, falling back to the first letter of the name. */
function RecipientAvatar({ avatarUrl, name }: { avatarUrl?: string; name: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-lg border border-[var(--border-color)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs font-bold text-sky-500">
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'role', label: 'Theo vai trò' },
  { value: 'status', label: 'Theo trạng thái tài khoản' },
  { value: 'selected', label: 'Chọn người nhận cụ thể' },
];

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'user', label: 'User' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'pending_verification', label: 'Chờ xác thực' },
  { value: 'banned', label: 'Đình chỉ' },
];

const DELIVERY_OPTIONS = [
  { value: 'both', label: 'Hộp thư nội bộ + Email' },
  { value: 'email', label: 'Chỉ gửi Email' },
  { value: 'internal', label: 'Chỉ hộp thư nội bộ' },
];

const STATUS_LABELS: Record<MailBroadcastStatus, string> = {
  draft: 'Nháp',
  scheduled: 'Đã hẹn giờ',
  sending: 'Đang gửi',
  sent: 'Đã gửi',
  failed: 'Thất bại',
  cancelled: 'Đã huỷ',
};

const STATUS_VARIANTS: Record<MailBroadcastStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  scheduled: 'info',
  sending: 'warning',
  sent: 'success',
  failed: 'danger',
  cancelled: 'default',
};

type Tab = 'compose' | 'history' | 'internal' | 'templates';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MailPage() {
  const [tab, setTab] = useState<Tab>('compose');

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'compose', label: 'Gửi thông báo' },
    { id: 'history', label: 'Lịch sử gửi' },
    { id: 'internal', label: 'Mail người dùng' },
    { id: 'templates', label: 'Mẫu mail' },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị' }, { label: 'Mail nội bộ' }]}
        title="Mail nội bộ"
        subtitle="Gửi thông báo tới người dùng qua hộp thư nội bộ và email"
        actions={
          <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === item.id
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto pb-6">
        {tab === 'compose' ? <ComposePanel /> : null}
        {tab === 'history' ? <HistoryPanel /> : null}
        {tab === 'internal' ? <InternalMailPanel /> : null}
        {tab === 'templates' ? <TemplatesPanel /> : null}
      </div>
    </div>
  );
}

function ComposePanel() {
  const { data: stats } = useMailStatsQuery();
  const createMutation = useCreateBroadcastMutation();
  const previewMutation = usePreviewAudienceMutation();
  const { data: templates = [] } = useMailTemplatesQuery({ includeInactive: false });

  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [audience, setAudience] = useState<MailBroadcastAudience>('all');
  const [role, setRole] = useState('user');
  const [accountStatus, setAccountStatus] = useState('active');
  const [deliveryMode, setDeliveryMode] = useState<MailDeliveryMode>('both');
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<MailRecipient[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');

  const debouncedSearch = useDebounce(recipientSearch, 400);
  const { data: recipientResults = [] } = useSearchRecipientsQuery(debouncedSearch);

  const selectedRecipientIds = useMemo(
    () => selectedRecipients.map((item) => item.id),
    [selectedRecipients],
  );

  const suggestions = useMemo(() => {
    return recipientResults
      .filter((item) => !selectedRecipientIds.includes(item.id))
      .slice(0, 8);
  }, [recipientResults, selectedRecipientIds]);

  const templateOptions = useMemo(
    () => [
      { value: '', label: 'Tự soạn nội dung' },
      ...templates.map((template) => ({ value: template._id, label: template.name })),
    ],
    [templates],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template._id === templateId) ?? null,
    [templates, templateId],
  );

  /**
   * Loads a template into the composer. The content stays editable, so the
   * admin can still adjust it before sending.
   */
  const handleTemplateChange = (value: string) => {
    setTemplateId(value);

    const template = templates.find((item) => item._id === value);
    if (!template) return;

    setSubject(template.subject);
    setBodyHtml(template.bodyHtml ?? plainTextToHtml(template.body));
  };

  const canSubmit =
    subject.trim().length > 0 &&
    hasHtmlContent(bodyHtml) &&
    (audience !== 'selected' || selectedRecipients.length > 0) &&
    (sendNow || scheduledAt.length > 0);

  const buildPayload = () => ({
    subject: subject.trim(),
    bodyHtml,
    audience,
    ...(audience === 'role' ? { role } : {}),
    ...(audience === 'status' ? { status: accountStatus } : {}),
    ...(audience === 'selected' ? { recipientIds: selectedRecipientIds } : {}),
    ...(templateId ? { templateId } : {}),
    deliveryMode,
    ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    sendNow,
  });

  /** Counting recipients only depends on the audience selection. */
  const buildAudiencePayload = () => ({
    audience,
    ...(audience === 'role' ? { role } : {}),
    ...(audience === 'status' ? { status: accountStatus } : {}),
    ...(audience === 'selected' ? { recipientIds: selectedRecipientIds } : {}),
  });

  const handlePreview = () => {
    previewMutation.mutate(buildAudiencePayload(), {
      onSuccess: (result) => {
        toast.success(`Đối tượng nhận: ${result.count} người`);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string | string[] } } };
        const message = err.response?.data?.message;
        toast.error(
          Array.isArray(message) ? message[0] : message || 'Không xem được số lượng người nhận',
        );
      },
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    createMutation.mutate(buildPayload(), {
      onSuccess: (broadcast) => {
        toast.success(
          broadcast.status === 'scheduled'
            ? 'Đã lên lịch gửi thông báo'
            : `Đã gửi tới ${broadcast.totalRecipients} người`,
        );
        setSubject('');
        setBodyHtml('');
        setTemplateId('');
        setSelectedRecipients([]);
        setScheduledAt('');
      },
      onError: () => {
        toast.error('Không gửi được thông báo');
      },
    });
  };

  const statCards = [
    { label: 'Tổng thông báo', value: stats?.totalBroadcasts ?? 0, icon: Mail, tone: 'text-sky-500' },
    { label: 'Đã gửi', value: stats?.sentBroadcasts ?? 0, icon: CheckCircle2, tone: 'text-emerald-500' },
    { label: 'Đã hẹn giờ', value: stats?.scheduledBroadcasts ?? 0, icon: Calendar, tone: 'text-amber-500' },
    { label: 'Thất bại', value: stats?.failedBroadcasts ?? 0, icon: XCircle, tone: 'text-rose-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{card.value}</p>
                </div>
                <Icon className={`h-6 w-6 ${card.tone}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card title="Soạn nội dung">
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Mẫu mail
            </label>
            <Select
              options={templateOptions}
              value={templateId}
              onChange={handleTemplateChange}
              placeholder="Tự soạn nội dung"
            />
            {selectedTemplate ? (
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                Đang dùng mẫu “{selectedTemplate.name}”. Nội dung vẫn có thể chỉnh sửa trước khi gửi.
              </p>
            ) : templates.length === 0 ? (
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                Chưa có mẫu nào. Tạo mẫu ở tab “Mẫu mail” để dùng lại nội dung.
              </p>
            ) : null}
          </div>

          <Input
            label="Tiêu đề"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Ví dụ: Thông báo bảo trì hệ thống cuối tuần"
          />

          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nội dung
            </label>
            <div className="mt-1.5">
              <MailRichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                placeholder="Nội dung thông báo tới người dùng..."
                uploadMedia={async (file) => {
                  try {
                    const result = await mailService.uploadMedia(file);
                    return { url: result.url, kind: result.kind };
                  } catch {
                    toast.error('Không tải lên được tệp. Vui lòng thử lại.');
                    throw new Error('upload failed');
                  }
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Hỗ trợ biến: {'{{recipientName}}'}, {'{{senderName}}'}, {'{{currentDate}}'}
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Đối tượng nhận">
            <div className="space-y-3">
              <Select
                options={AUDIENCE_OPTIONS}
                value={audience}
                onChange={(value) => setAudience(value as MailBroadcastAudience)}
              />

              {audience === 'role' ? (
                <Select options={ROLE_OPTIONS} value={role} onChange={setRole} />
              ) : null}

              {audience === 'status' ? (
                <Select
                  options={STATUS_OPTIONS}
                  value={accountStatus}
                  onChange={setAccountStatus}
                />
              ) : null}

              {audience === 'selected' ? (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Người nhận đã chọn ({selectedRecipients.length})
                    </label>
                    {selectedRecipients.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRecipients([]);
                          setRecipientSearch('');
                        }}
                        className="text-[11px] font-medium text-[var(--text-muted)] transition hover:text-rose-500"
                      >
                        Xoá tất cả
                      </button>
                    ) : null}
                  </div>

                  {selectedRecipients.length > 0 ? (
                    <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
                      {selectedRecipients.map((recipient) => (
                        <li
                          key={recipient.id}
                          className="flex items-center gap-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-2.5 py-2"
                        >
                          <RecipientAvatar
                            avatarUrl={recipient.avatar}
                            name={recipient.fullName || recipient.email}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                              {recipient.fullName || 'Chưa cập nhật tên'}
                            </p>
                            <p className="truncate text-[11px] text-[var(--text-muted)]">
                              {recipient.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            title="Bỏ người nhận này"
                            aria-label={`Bỏ ${recipient.fullName || recipient.email}`}
                            onClick={() =>
                              setSelectedRecipients((current) =>
                                current.filter((item) => item.id !== recipient.id),
                              )
                            }
                            className="shrink-0 rounded p-1 text-[var(--text-muted)] transition hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 rounded-lg border border-dashed border-[var(--border-color)] px-3 py-3 text-center text-[11px] text-[var(--text-muted)]">
                      Chưa chọn người nhận nào. Tìm theo tên hoặc email bên dưới để thêm.
                    </p>
                  )}

                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      value={recipientSearch}
                      onChange={(event) => setRecipientSearch(event.target.value)}
                      placeholder="Tìm theo tên hoặc email"
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-sky-500"
                    />
                  </div>

                  {suggestions.length > 0 ? (
                    <ul className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-[var(--border-color)]">
                      {suggestions.map((recipient) => (
                        <li key={recipient.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecipients((current) => [...current, recipient]);
                              setRecipientSearch('');
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-[var(--bg-tertiary)]"
                          >
                            <RecipientAvatar
                              avatarUrl={recipient.avatar}
                              name={recipient.fullName || recipient.email}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-[var(--text-primary)]">
                                {recipient.fullName || 'Chưa cập nhật tên'}
                              </span>
                              <span className="block truncate text-[11px] text-[var(--text-muted)]">
                                {recipient.email}
                              </span>
                            </span>
                            <UserPlus className="h-4 w-4 shrink-0 text-sky-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : recipientSearch.trim().length >= 2 ? (
                    <p className="mt-2 rounded-lg border border-dashed border-[var(--border-color)] px-3 py-2 text-center text-[11px] text-[var(--text-muted)]">
                      Không tìm thấy người dùng phù hợp.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Users className="mr-2 h-3.5 w-3.5" />
                )}
                Xem số người nhận
              </Button>
            </div>
          </Card>

          <Card title="Lịch gửi">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={sendNow}
                  onChange={(event) => setSendNow(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-color)] accent-sky-500"
                />
                Gửi ngay
              </label>

              {!sendNow ? (
                <Input
                  label="Thời gian gửi"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              ) : null}

              <Select
                options={DELIVERY_OPTIONS}
                value={deliveryMode}
                onChange={(value) => setDeliveryMode(value as MailDeliveryMode)}
              />

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {sendNow ? 'Gửi thông báo' : 'Lên lịch gửi'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HistoryPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { data, isLoading } = useMailBroadcastsQuery({
    page,
    limit: 20,
    status: statusFilter,
    search: debouncedSearch || undefined,
  });
  const cancelMutation = useCancelBroadcastMutation();

  const broadcasts = data?.broadcasts ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const handleCancel = (id: string) => {
    cancelMutation.mutate(id, {
      onSuccess: () => toast.success('Đã huỷ lịch gửi'),
      onError: () => toast.error('Không huỷ được thông báo'),
    });
  };

  return (
    <Card
      title="Lịch sử gửi thông báo"
      subtitle={`Tổng cộng ${total} thông báo`}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tiêu đề"
              className="w-56 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] py-1.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-sky-500"
            />
          </div>
          <div className="w-44">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            />
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
          <Mail className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Chưa có thông báo nào</p>
          <p className="text-xs text-[var(--text-muted)]">
            Dùng tab &quot;Gửi thông báo&quot; để tạo thông báo đầu tiên.
          </p>
        </div>
      ) : (
        <>
          <Table
            headers={[
              { label: 'Tiêu đề' },
              { label: 'Trạng thái' },
              { label: 'Người nhận', align: 'right' },
              { label: 'Kết quả', align: 'right' },
              { label: 'Thời gian' },
              { label: '', align: 'right' },
            ]}
          >
            {broadcasts.map((broadcast) => (
              <TableRow key={broadcast._id}>
                <TableCell>
                  <p className="font-medium text-[var(--text-primary)]">{broadcast.subject}</p>
                  <p className="mt-0.5 max-w-md truncate text-xs text-[var(--text-muted)]">
                    {broadcast.body}
                  </p>
                  {broadcast.lastError ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-rose-500">
                      <AlertTriangle className="h-3 w-3" />
                      {broadcast.lastError}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[broadcast.status]} dot>
                    {STATUS_LABELS[broadcast.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-[var(--text-primary)]">
                    {broadcast.totalRecipients}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-emerald-600">{broadcast.deliveredCount}</span>
                  <span className="ml-1 text-sm text-rose-500">{broadcast.failedCount}</span>
                </TableCell>
                <TableCell>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatDate(broadcast.sentAt ?? broadcast.createdAt)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {broadcast.createdByName}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  {broadcast.status === 'scheduled' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(broadcast._id)}
                      disabled={cancelMutation.isPending}
                    >
                      Huỷ lịch
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </Table>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </Button>
              <span className="text-xs text-[var(--text-muted)]">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Sau
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}

const INTERNAL_KIND_OPTIONS = [
  { value: 'all', label: 'Tất cả mail' },
  { value: 'direct', label: 'Mail người dùng gửi nhau' },
  { value: 'broadcast', label: 'Thông báo của admin' },
];

const INTERNAL_KIND_LABELS: Record<string, string> = {
  direct: 'Nội bộ',
  broadcast: 'Thông báo',
};

function InternalMailPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'direct' | 'broadcast'>('direct');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { data, isLoading } = useInternalMailMessagesQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    kind: kindFilter,
  });
  const { data: stats } = useInternalMailStatsQuery();
  const { data: detail, isLoading: isDetailLoading } = useInternalMailDetailQuery(selectedId);
  const deleteMutation = useDeleteInternalMailMutation();

  const messages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;

  const statCards = [
    { label: 'Mail người dùng gửi nhau', value: stats?.totalInternal ?? 0, icon: Mail, tone: 'text-sky-500' },
    { label: 'Bản tin thông báo', value: stats?.totalBroadcast ?? 0, icon: Megaphone, tone: 'text-violet-500' },
    { label: 'Hội thoại', value: stats?.totalThreads ?? 0, icon: MessagesSquare, tone: 'text-emerald-500' },
    { label: '7 ngày gần nhất', value: stats?.last7Days ?? 0, icon: Calendar, tone: 'text-amber-500' },
  ];

  const handleDelete = (id: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success('Đã xoá mail');
          setSelectedId(null);
        },
        onError: () => toast.error('Không xoá được mail'),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{card.value}</p>
                </div>
                <Icon className={`h-6 w-6 ${card.tone}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card
        title="Mail nội bộ giữa người dùng"
        subtitle={`Tổng cộng ${total} mail`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tiêu đề hoặc nội dung"
                className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] py-1.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-sky-500"
              />
            </div>
            <div className="w-56">
              <Select
                options={INTERNAL_KIND_OPTIONS}
                value={kindFilter}
                onChange={(value) => {
                  setKindFilter(value as 'all' | 'direct' | 'broadcast');
                  setPage(1);
                }}
              />
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <Mail className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Chưa có mail nào</p>
            <p className="text-xs text-[var(--text-muted)]">
              Mail người dùng gửi cho nhau sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <>
            <Table
              headers={[
                { label: 'Người gửi' },
                { label: 'Người nhận' },
                { label: 'Tiêu đề' },
                { label: 'Loại' },
                { label: 'Trả lời', align: 'right' },
                { label: 'Thời gian' },
                { label: '', align: 'right' },
              ]}
            >
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <p className="font-medium text-[var(--text-primary)]">{message.senderName}</p>
                    <p className="mt-0.5 max-w-[180px] truncate text-xs text-[var(--text-muted)]">
                      {message.senderEmail}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-[var(--text-primary)]">
                      {message.recipientNames.join(', ') || '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {message.recipientNames.length} người nhận
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-[var(--text-primary)]">{message.subject}</p>
                    <p className="mt-0.5 max-w-md truncate text-xs text-[var(--text-muted)]">
                      {message.body}
                    </p>
                  </TableCell>
                  <TableCell>
                    {message.kind === 'broadcast' ? (
                      <Badge variant="info">Thông báo</Badge>
                    ) : message.broadcastId ? (
                      <Badge variant="info">Trả lời thông báo</Badge>
                    ) : (
                      <Badge variant="default">
                        {INTERNAL_KIND_LABELS[message.kind] ?? message.kind}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-[var(--text-primary)]">{message.replyCount}</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatDate(message.createdAt)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {message.readCount}/{message.recipientIds.length} đã đọc
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => setSelectedId(message.id)}>
                        Xem
                      </Button>
                      <button
                        type="button"
                        title="Xoá mail"
                        aria-label="Xoá mail"
                        onClick={() => handleDelete(message.id)}
                        className="rounded p-1.5 text-[var(--text-muted)] transition hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Trước
                </Button>
                <span className="text-xs text-[var(--text-muted)]">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Sau
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail?.message.subject ?? 'Chi tiết mail'}
            </DialogTitle>
            <DialogDescription>
              {detail?.message.senderName} · {formatDate(detail?.message.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {(detail?.messages ?? []).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.senderName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{item.senderEmail}</p>
                    <span className="text-xs text-[var(--text-muted)]">
                      · {formatDate(item.createdAt)}
                    </span>
                    {item.kind === 'broadcast' ? (
                      <Badge variant="info">Thông báo</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Đến: {item.recipientNames.join(', ') || '—'}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.body || '(không có nội dung văn bản)'}
                  </p>
                </div>
              ))}

              {detail?.thread ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Hội thoại gồm {detail.thread.participantIds.length} người tham gia.
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter>
            {detail?.thread ? (
              <Button
                variant="outline"
                onClick={() => {
                  if (detail?.message.id) {
                    deleteMutation.mutate(
                      { id: detail.message.id, scope: 'thread' },
                      {
                        onSuccess: () => {
                          toast.success('Đã xoá cả hội thoại');
                          setSelectedId(null);
                        },
                        onError: () => toast.error('Không xoá được hội thoại'),
                      },
                    );
                  }
                }}
              >
                Xoá cả hội thoại
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setSelectedId(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplatesPanel() {
  const { data: templates = [], isLoading } = useMailTemplatesQuery({ includeInactive: true });
  const createMutation = useCreateTemplateMutation();
  const deleteMutation = useDeleteTemplateMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBodyHtml, setTemplateBodyHtml] = useState('');
  const [category, setCategory] = useState('general');

  const handleCreate = () => {
    if (!name.trim() || !templateSubject.trim() || !hasHtmlContent(templateBodyHtml)) return;

    createMutation.mutate(
      {
        name: name.trim(),
        subject: templateSubject.trim(),
        bodyHtml: templateBodyHtml,
        category: category.trim() || 'general',
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo mẫu mail');
          setName('');
          setTemplateSubject('');
          setTemplateBodyHtml('');
          setShowForm(false);
        },
        onError: () => toast.error('Không tạo được mẫu mail'),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Đã xoá mẫu mail'),
      onError: () => toast.error('Không xoá được mẫu mail'),
    });
  };

  return (
    <Card
      title="Mẫu mail"
      subtitle="Tái sử dụng nội dung thông báo đã soạn sẵn"
      actions={
        <Button onClick={() => setShowForm((current) => !current)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo mẫu
        </Button>
      }
    >
      {showForm ? (
        <div className="mb-5 space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4">
          <Input
            label="Tên mẫu"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Thông báo bảo trì"
          />
          <Input
            label="Tiêu đề mẫu"
            value={templateSubject}
            onChange={(event) => setTemplateSubject(event.target.value)}
            placeholder="Thông báo bảo trì ngày {{currentDate}}"
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nội dung mẫu
            </label>
            <div className="mt-1.5">
              <MailRichTextEditor
                value={templateBodyHtml}
                onChange={setTemplateBodyHtml}
                placeholder="Xin chào {{recipientName}}, ... Trân trọng, {{senderName}}"
                minHeight={160}
                uploadMedia={async (file) => {
                  try {
                    const result = await mailService.uploadMedia(file);
                    return { url: result.url, kind: result.kind };
                  } catch {
                    toast.error('Không tải lên được tệp. Vui lòng thử lại.');
                    throw new Error('upload failed');
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-48">
              <Input
                label="Nhóm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="general"
              />
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Lưu mẫu
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
          <Mail className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Chưa có mẫu mail nào</p>
          <p className="text-xs text-[var(--text-muted)]">
            Tạo mẫu để tái sử dụng nội dung thông báo.
          </p>
        </div>
      ) : (
        <Table headers={['Tên mẫu', 'Tiêu đề', 'Nhóm', 'Đã dùng', { label: '', align: 'right' }]}>
          {templates.map((template) => (
            <TableRow key={template._id}>
              <TableCell>
                <p className="font-medium text-[var(--text-primary)]">{template.name}</p>
                <p className="mt-0.5 max-w-md truncate text-xs text-[var(--text-muted)]">
                  {template.body}
                </p>
              </TableCell>
              <TableCell>
                <span className="text-sm text-[var(--text-secondary)]">{template.subject}</span>
              </TableCell>
              <TableCell>
                <Badge variant="info">{template.category || 'general'}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-[var(--text-secondary)]">{template.usageCount} lần</span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template._id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </Card>
  );
}
