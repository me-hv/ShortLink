import React from 'react';
import { Card } from './Card.js';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
}

export function ChartCard({ title, subtitle, children, loading }: ChartCardProps) {
  return (
    <Card title={title} subtitle={subtitle}>
      {loading ? (
        <div className="h-64 w-full bg-slate-100 dark:bg-slate-900/40 rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-sm text-slate-400">Loading chart data...</span>
        </div>
      ) : (
        <div className="h-64 w-full mt-2">
          {children}
        </div>
      )}
    </Card>
  );
}
