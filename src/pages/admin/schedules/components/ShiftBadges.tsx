import { Badge } from '../../../../components/ui';
import { resolveAttendanceLabel, resolveWorkModeLabel } from '../../../../services/workScheduleService';
import { attendanceBadgeVariant, workModeBadgeVariant } from '../lib/schedule-options';

export function AttendanceBadge({ status }: { status?: string | null }) {
  return <Badge variant={attendanceBadgeVariant(status)}>{resolveAttendanceLabel(status)}</Badge>;
}

export function WorkModeBadge({ workMode }: { workMode?: string | null }) {
  return <Badge variant={workModeBadgeVariant(workMode)}>{resolveWorkModeLabel(workMode)}</Badge>;
}
