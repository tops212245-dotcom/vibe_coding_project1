import React from 'react';
import { Card } from '../../components/common/Card';

export const FAQPage: React.FC = () => {
  const faqs = [
    {
      q: 'How does HomeServe prevent double bookings?',
      a: 'When you select an appointment slot, our backend locks that provider’s schedule atomically within a database transaction. If two users click simultaneously, our ACID-compliant concurrency engine confirms one and instantly guides the second to an adjacent available slot.'
    },
    {
      q: 'Are technicians verified before entering my home?',
      a: 'Yes. Every service provider must upload government-issued identity documents and business licenses. Technicians undergo identity checks and carry digital HomeServe badges.'
    },
    {
      q: 'What is the 30-Day Service Guarantee?',
      a: 'If a repaired appliance, plumbing fixture, or electrical line fails within 30 days of service completion, the provider will return to fix it at zero additional cost.'
    },
    {
      q: 'Can I cancel or reschedule my appointment?',
      a: 'Yes. Customers can reschedule or cancel directly from the Customer Dashboard before the technician marks arrival on site.'
    },
    {
      q: 'How do payments work?',
      a: 'We support 100% secure Razorpay transactions (UPI, Credit/Debit cards, Netbanking) with server-side signature validation, as well as a development simulator mode for rapid test evaluations.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-500">
          Everything you need to know about booking, slot locking, payments, and technician dispatch.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <Card key={i} className="p-6">
            <h3 className="font-bold text-slate-900 text-base">{f.q}</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{f.a}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

