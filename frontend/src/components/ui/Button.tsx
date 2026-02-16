import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-soft',
          secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
          ghost: 'hover:bg-slate-100 text-slate-700',
          danger: 'bg-red-500 text-white hover:bg-red-600',
        }[variant],
        {
          sm: 'px-3 py-1.5 text-sm',
          md: 'px-4 py-2 text-sm',
          lg: 'px-6 py-3 text-base',
        }[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
