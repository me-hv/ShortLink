import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`bg-[#1A2332] border border-[#273449] rounded-2xl p-6 shadow-xl hover:border-[#2563EB]/40 transition-all duration-300 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h3 className="text-lg font-semibold text-[#F9FAFB] tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-[#94A3B8] mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
