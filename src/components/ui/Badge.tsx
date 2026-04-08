import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border border-green-300',
  danger: 'bg-red-100 text-red-800 border border-red-300',
  warning: 'bg-amber-100 text-amber-800 border border-amber-300',
  info: 'bg-blue-100 text-blue-800 border border-blue-300',
  neutral: 'bg-gray-100 text-gray-800 border border-gray-300',
};

export function Badge({ variant = 'neutral', children, icon, className }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className || ''}`}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
