import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'small';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md hover:shadow-lg',
  secondary: 'bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-none shadow-md hover:shadow-lg',
  success: 'bg-green-600 hover:bg-green-700 text-white border-none shadow-md hover:shadow-lg',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white border-none shadow-md hover:shadow-lg',
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
  
  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClass} ${widthClass} ${className || ''}`}
      {...props}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
