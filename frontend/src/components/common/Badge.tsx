import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children, className = '' }) => {
  let appliedVariant = variant || 'neutral';

  if (status) {
    const s = status.toUpperCase();
    if (['COMPLETED', 'APPROVED', 'ACTIVE', 'PAID', 'SUCCESS'].includes(s)) {
      appliedVariant = 'success';
    } else if (['PENDING', 'PROVIDER_ASSIGNED', 'ACKNOWLEDGED', 'ARRIVED'].includes(s)) {
      appliedVariant = 'warning';
    } else if (['CANCELLED', 'REJECTED', 'FAILED', 'SUSPENDED'].includes(s)) {
      appliedVariant = 'danger';
    } else if (['CONFIRMED', 'IN_PROGRESS'].includes(s)) {
      appliedVariant = 'info';
    }
  }

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-red-50 text-red-700 border-red-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[appliedVariant]} ${className}`}
    >
      {children || status}
    </span>
  );
};

