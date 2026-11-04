import React, { useState, useEffect } from 'react';
import {
  Users, Briefcase, Calendar, DollarSign, TrendingUp, ShieldCheck,
  AlertCircle, CheckCircle, Clock, ArrowUpRight, BarChart3, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

interface AdminStats {
  total_customers: number;
  total_providers: number;
  approved_providers: number;
  pending_providers: number;
  total_technicians: number;
  total_bookings: number;
  pending_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  total_commission: number;
  total_provider_earnings: number;
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getAnalytics();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !stats) {
    return <LoadingSpinner message="Calculating real-time SaaS financial metrics..." />;
  }

  const bookingBreakdownData = [
    { name: 'Completed', value: stats.completed_bookings },
    { name: 'Pending', value: stats.pending_bookings },
    { name: 'Cancelled / Rejected', value: stats.cancelled_bookings },
  ];

  const financialData = [
    { name: 'Gross Volume (GMV)', amount: Number(stats.total_revenue) },
    { name: 'Provider Payouts', amount: Number(stats.total_provider_earnings) },
    { name: 'Platform Revenue (10%)', amount: Number(stats.total_commission) },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Control Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Executive SaaS Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time multi-tenant telemetry queried directly from database engine. Track marketplace liquidity, Gross Merchandise Value, and platform earnings.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Volume (GMV)</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-3 block">
            ₹{Number(stats.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Gross customer payments
          </span>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Commission</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-emerald-600 mt-3 block">
            ₹{Number(stats.total_commission).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-1 block">
            Retained platform revenue
          </span>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-3 block">{stats.total_bookings}</span>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{stats.completed_bookings} Completed</span>
            <span>&bull;</span>
            <span className="text-amber-600 font-semibold">{stats.pending_bookings} Pending</span>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Providers</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-3 block">{stats.total_providers}</span>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-emerald-600 font-semibold">{stats.approved_providers} Verified</span>
            <span>&bull;</span>
            <span className="text-amber-600 font-semibold">{stats.pending_providers} Pending KYC</span>
          </div>
        </Card>
      </div>

      {/* Secondary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border-slate-200 bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500 uppercase">Registered Customers</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_customers}</p>
        </Card>
        <Card className="p-5 border-slate-200 bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500 uppercase">Field Technicians Fleet</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_technicians}</p>
        </Card>
        <Card className="p-5 border-slate-200 bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500 uppercase">Provider Net Earnings</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{Number(stats.total_provider_earnings).toLocaleString('en-IN')}</p>
        </Card>
      </div>

      {/* Visual Analytics Charts with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" /> Platform Financial Flow (INR)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" /> Appointment Status Distribution
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bookingBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

