'use client';

import { ShieldAlert } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="flex items-center p-3 text-sm text-red-400 bg-red-900/20 border border-red-400/30 rounded-lg">
      <ShieldAlert className="w-5 h-5 mr-2" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;
