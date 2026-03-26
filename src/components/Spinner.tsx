import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Spinner({ size = 'md', color = 'blue' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses: Record<string, string> = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
  };

  return (
    <div className={`${sizeClasses[size]} border-4 border-gray-300 border-t-${colorClasses[color].split('-')[1]}-600 rounded-full animate-spin`} />
  );
}
