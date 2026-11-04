import React from 'react';
import { Card } from '../../components/common/Card';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
      <Card className="p-8 prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
        <p>Last updated: November 2026</p>
        <h3 className="text-base font-bold text-slate-900">1. Data Collection</h3>
        <p>HomeServe collects user contact details, geographical service locations, and booking preferences solely to facilitate home services execution and security verification.</p>
        <h3 className="text-base font-bold text-slate-900">2. Payment Security</h3>
        <p>Financial transactions are handled through Razorpay compliant with PCI-DSS Level 1 standards. HomeServe never stores raw credit card details or CVVs on its servers.</p>
      </Card>
    </div>
  );
};

