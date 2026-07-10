import React from 'react';
import { Card } from './Card.js';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  loading?: boolean;
}

export function StatisticCard({ title, value, icon, description, trend, loading }: StatisticCardProps) {
  return (
    <Card className="hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-[#273449] rounded animate-pulse mt-3" />
          ) : (
            <h4 className="text-3xl font-extrabold text-[#F9FAFB] mt-2 tracking-tight truncate">
              {value}
            </h4>
          )}
          
          {/* Trend indicator or description */}
          {!loading && (trend || description) && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {trend && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide border ${
                  trend.isPositive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {trend.value}
                </span>
              )}
              {description && (
                <span className="text-xs text-[#64748B] truncate">{description}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 bg-[#111827] border border-[#273449] text-[#94A3B8] rounded-lg ml-4 shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
