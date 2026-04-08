import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'compact';
  children: React.ReactNode;
}

const variantClasses = {
  base: 'bg-white rounded-lg border border-gray-200 p-4',
  elevated: 'bg-white rounded-lg border border-gray-300 p-6',
  compact: 'bg-white rounded-lg border border-gray-200 p-3',
};

export function Card({ variant = 'base', children, className, ...props }: CardProps) {
  return (
    <div className={`${variantClasses[variant]} transition-all duration-200 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}
