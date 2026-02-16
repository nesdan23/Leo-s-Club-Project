import { cn } from '@/utils/cn';
import type { EventStatus, TaskStatus } from '@/types';

type Status = EventStatus | TaskStatus | string;

const statusStyles: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Upcoming: 'bg-accent-sky/80 text-slate-800',
  'In Progress': 'bg-accent-lavender/80 text-slate-800',
  Completed: 'bg-accent-mint/80 text-slate-800',
  Cancelled: 'bg-slate-200 text-slate-600',
  Pending: 'bg-accent-yellow/80 text-slate-800',
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = statusStyles[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
