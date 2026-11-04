import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Contact Support</h1>
        <p className="text-sm text-slate-500">
          Have an inquiry, booking dispute, or partnership question? Our team is available 7 days a week.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Corporate Office</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <span>HomeServe Technologies Inc., Bandra-Kurla Complex, Mumbai, MH - 400051</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>+91 (022) 8000-SERVE (9 AM - 8 PM IST)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>support@homeserve.local</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-8">
            {sent ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Message Delivered</h3>
                <p className="text-xs text-slate-500">A support representative will reply within 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Your Name" required placeholder="Aarav Mehta" />
                  <Input label="Email Address" type="email" required placeholder="aarav@example.com" />
                </div>
                <Input label="Subject / Booking Reference" required placeholder="Question about BK-2026..." />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how we can assist you..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <Button type="submit" size="md">
                  Send Message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

