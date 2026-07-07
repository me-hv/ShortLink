
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#121824] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-full text-slate-400 dark:text-slate-500 mb-4">
        <Inbox className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
    </div>
  );
}
