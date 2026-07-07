
import { Link } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
      <div className="p-4 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-full border border-violet-100 dark:border-violet-900/30">
        <AlertCircle className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link to="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
}
