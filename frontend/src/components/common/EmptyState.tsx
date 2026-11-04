import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
      {icon && <div className="p-3 mb-4 rounded-2xl bg-brand-50 text-brand-600">{icon}</div>}
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="mt-6" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

