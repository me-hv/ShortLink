import { Link } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 max-w-md mx-auto">
      <div className="p-4 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
        <AlertCircle className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#F9FAFB] tracking-tight">404 - Page Not Found</h1>
        <p className="text-xs text-[#94A3B8]">
          The page or dynamic route you are trying to resolve does not exist or has been deprecated.
        </p>
      </div>
      <Link to="/">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
