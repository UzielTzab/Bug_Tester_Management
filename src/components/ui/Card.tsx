import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'compact';
  children: React.ReactNode;
}

const variantClasses = {
  base: 'bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
  elevated: 'bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
  compact: 'bg-white rounded-xl border border-slate-200 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
};

export function Card({ variant = 'base', children, className, ...props }: CardProps) {
  return (
    <div className={`${variantClasses[variant]} transition-all duration-200 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}
