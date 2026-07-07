import React from 'react';
import { Card } from './Card.js';

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  loading?: boolean;
}

export function StatisticCard({ title, value, icon, description, loading }: StatisticCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2" />
          ) : (
            <h4 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1 tracking-tight truncate">
              {value}
            </h4>
          )}
          {description && !loading && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 truncate">{description}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl ml-4 shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
