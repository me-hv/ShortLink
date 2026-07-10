import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-[#0B1220] border ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-[#273449] focus:border-blue-500 focus:ring-blue-500/20'
          } rounded-lg text-sm text-[#F9FAFB] placeholder-[#64748B] focus:outline-none focus:ring-4 transition-all duration-200 ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-red-500 mt-1.5">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[#64748B] mt-1.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
