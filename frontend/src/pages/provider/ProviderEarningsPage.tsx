import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ShieldCheck, Download } from 'lucide-react';
import { providerApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProviderEarningsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await providerApi.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating financial ledger..." />;

  const grossEarnings = (Number(stats?.total_earnings || 0) + Number(stats?.platform_commissions || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Earnings & Financial Settlement</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent revenue ledger with automated platform commission accounting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">Gross Booking Value</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            ₹{grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Total customer billings</span>
        </Card>

        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">Platform Fees (10%)</span>
          <span className="text-2xl font-black text-amber-600 mt-2 block">
            ₹{Number(stats?.platform_commissions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Platform commission share</span>
        </Card>

        <Card className="p-6 border-slate-200 bg-brand-50/50 border-brand-200">
          <span className="text-xs font-semibold text-brand-700 uppercase">Net Payout Balance</span>
          <span className="text-3xl font-black text-brand-700 mt-2 block">
            ₹{Number(stats?.total_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-brand-600 font-semibold mt-1 block">Direct Bank Settlement Ready</span>
        </Card>
      </div>

      <Card className="p-8 border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Payout Policy & Schedule</h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
          Weekly settlements are processed every Tuesday directly to your registered bank account via NEFT/IMPS. All earnings are escrow-backed with real-time tax invoice generation on every completed booking.
        </p>
        <div className="pt-2 flex items-center gap-3">
          <Badge status="ACTIVE" variant="success">Weekly Payout Cycle Active</Badge>
          <span className="text-xs text-slate-400">Account verified with RBI compliant payment gateway</span>
        </div>
      </Card>
    </div>
  );
};

