import React from 'react';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost' | 'success' | 'warning' | 'small';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#263a5f] hover:bg-[#1f3152] text-white border border-[#263a5f] shadow-[0_1px_2px_rgba(15,23,42,0.08)]',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  ghost: 'bg-transparent border border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100',
  danger: 'bg-red-500 hover:bg-red-600 text-white border border-red-500 shadow-[0_1px_2px_rgba(15,23,42,0.08)]',
  dangerGhost: 'bg-transparent border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200',
  success: 'bg-green-600 hover:bg-green-700 text-white border border-green-600 shadow-sm hover:shadow-md',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-600 shadow-sm hover:shadow-md',
  small: 'px-3 py-1 text-sm font-medium border-none',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const sizeClass = variant === 'small' ? variantClasses[variant] : `${sizeClasses[size]} ${variantClasses[variant]}`;
  const widthClass = fullWidth ? 'w-full' : '';

  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'md' : 'sm';
  const spinnerColor = variant === 'danger' ? 'red' : variant === 'success' ? 'green' : variant === 'warning' ? 'red' : 'blue';
  
  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClass} ${widthClass} ${className || ''}`}
      {...props}
    >
      {loading ? (
        <Spinner size={spinnerSize} color={spinnerColor} variant="default" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
