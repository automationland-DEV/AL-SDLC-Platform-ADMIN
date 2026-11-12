import { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Button, Input, SearchableSelect } from '../../../../components/ui';
import { Card, FieldLabel, type StaffOption } from '../lib/schedule-ui';

interface GenerateTabProps {
  staffOptions: StaffOption[];
  initialFrom: string;
  initialTo: string;
  isPending: boolean;
  onSubmit: (payload: { userId: string; from: string; to: string }) => void;
  vi: boolean;
}

export default function GenerateTab({
  staffOptions,
  initialFrom,
  initialTo,
  isPending,
  onSubmit,
  vi,
}: GenerateTabProps) {
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card
        title={vi ? 'Tự tạo lịch từ ca mẫu' : 'Auto-create from templates'}
        description={
          vi
            ? 'Bước 1: chọn nhân viên. Bước 2: chọn khoảng ngày. Bước 3: bấm nút tạo. Ca nào trùng giờ sẽ tự bỏ qua.'
            : 'Step 1: pick staff. Step 2: pick dates. Step 3: press create. Overlapping shifts are skipped.'
        }
        icon={<Wand2 className="h-4 w-4" />}
      >
        <div className="space-y-4">
          <div>
            <FieldLabel step="1">{vi ? 'Chọn nhân viên' : 'Pick staff'}</FieldLabel>
            <SearchableSelect
              options={staffOptions}
              value={userId}
              onChange={setUserId}
              placeholder={vi ? 'Bấm để chọn nhân viên...' : 'Click to pick staff...'}
            />
          </div>

          <div>
            <FieldLabel step="2">{vi ? 'Chọn khoảng ngày' : 'Pick date range'}</FieldLabel>
            <div className="grid grid-cols-2 gap-2.5">
              <Input label={vi ? 'Từ ngày' : 'From'} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input label={vi ? 'Đến ngày' : 'To'} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div>
            <FieldLabel step="3">{vi ? 'Bấm nút để tạo' : 'Press to create'}</FieldLabel>
            <Button
              className="w-full py-3 text-sm font-bold"
              disabled={isPending || !userId}
              onClick={() => onSubmit({ userId, from, to })}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {vi ? 'Tạo lịch ngay' : 'Create now'}
            </Button>
            {!userId && (
              <p className="mt-1.5 text-center text-xs text-[var(--text-muted)]">
                {vi ? 'Hãy chọn nhân viên ở bước 1 trước nhé' : 'Please pick staff in step 1 first'}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
