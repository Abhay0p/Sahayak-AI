import React, { ReactNode } from 'react';

interface SummaryCardProps {
  icon?: ReactNode;
  title: string;
  value?: string | number;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export default function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  children,
  className = '',
}: SummaryCardProps) {
  return (
    <div
      className={`card summary-card flex items-center md:items-start flex-col md:flex-row gap-3 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 ${className}`}
    >
      {icon && <div className="p-2 bg-white/10 rounded-lg text-white">{icon}</div>}
      <div className="text-center md:text-left">
        {value !== undefined && (
          <span className="block text-2xl font-bold text-white">{value}</span>
        )}
        {subtitle && (
          <span className="block text-xs text-white/70 font-medium">{subtitle}</span>
        )}
        <span className="block text-xs text-white/70 font-medium mt-1">{title}</span>
        {children}
      </div>
    </div>
  );
}
