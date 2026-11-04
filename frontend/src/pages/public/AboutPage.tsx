import React from 'react';
import { Shield, Users, Award, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../../components/common/Card';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          About HomeServe Technologies
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          HomeServe is modernizing the unorganized home maintenance industry through vetted partnerships, transparent pricing, guaranteed arrival windows, and reliable digital warranties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 space-y-3">
          <Shield className="w-8 h-8 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">Rigorous Vetting</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every business and technician passes comprehensive identity validation and technical skill checks before acceptance.
          </p>
        </Card>

        <Card className="p-8 space-y-3">
          <Clock className="w-8 h-8 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">Guaranteed Slots</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our proprietary concurrency engine protects customer appointments from overlapping or double-booked slots.
          </p>
        </Card>

        <Card className="p-8 space-y-3">
          <Award className="w-8 h-8 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">30-Day Guarantee</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every completed ticket is backed by our customer protection fund, ensuring 100% satisfaction or free re-service.
          </p>
        </Card>
      </div>
    </div>
  );
};

