import { cn } from '@/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: 'default' | 'pastel-yellow' | 'pastel-lavender' | 'pastel-mint' | 'pastel-sky';
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-card',
  'pastel-yellow': 'bg-accent-yellow/60',
  'pastel-lavender': 'bg-accent-lavender/60',
  'pastel-mint': 'bg-accent-mint/60',
  'pastel-sky': 'bg-accent-sky/60',
};

export function MetricCard({
  title,
  value,
  description,
  variant = 'default',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 shadow-soft p-5 transition-shadow hover:shadow-soft-lg',
        variantClasses[variant],
        className
      )}
    >
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
  );
}
