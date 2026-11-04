import React from 'react';
import { Card } from '../../components/common/Card';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms and Conditions</h1>
      <Card className="p-8 prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
        <p>Last updated: November 2026</p>
        <h3 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h3>
        <p>By accessing or using the HomeServe Technologies platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.</p>
        <h3 className="text-base font-bold text-slate-900">2. Customer Obligations</h3>
        <p>Customers must provide accurate addresses and safe working environments for field technicians. Payment for services must be completed in full upon delivery.</p>
        <h3 className="text-base font-bold text-slate-900">3. Service Provider Obligations</h3>
        <p>Service providers agree to assign only qualified, background-verified personnel to jobs and honor the 30-day rework warranty.</p>
      </Card>
    </div>
  );
};

