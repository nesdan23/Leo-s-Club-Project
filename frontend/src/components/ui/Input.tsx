import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ className, label, error, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
    )}
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
));
Input.displayName = 'Input';
