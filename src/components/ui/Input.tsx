import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </span>
        )}
        <input
          className={`w-full px-4 ${icon ? 'pl-10' : 'pl-4'} py-2 border-2 ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            className || ''
          }`}
          {...props}
        />
      </div>
      {error && <p className="text-red-600 text-xs font-semibold mt-1">{error}</p>}
    </div>
  );
}
