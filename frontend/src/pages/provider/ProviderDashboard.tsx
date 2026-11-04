import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, DollarSign, Star, ShieldCheck, ArrowRight,
  Clock, CheckCircle2, AlertCircle, Wrench
} from 'lucide-react';
import { providerApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProviderDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await providerApi.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating business metrics..." />;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-navy-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div>
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">
            Vendor Operations Suite
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Provider Control Center</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Dispatch technicians, accept incoming jobs, configure catalog rates, and monitor settlements.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/provider/requests">
            <Button size="md" className="bg-brand-600 hover:bg-brand-500 shadow-md">
              Review Requests ({stats?.pending_requests || 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Gross Earnings</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            ₹{stats?.total_earnings?.toLocaleString() || '0.00'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Net after commission</span>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending Requests</span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 mt-2 block">
            {stats?.pending_requests || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Action required</span>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed Services</span>
            <CheckCircle2 className="w-5 h-5 text-brand-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            {stats?.completed_services || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Total fulfilled</span>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Customer Rating</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            {Number(stats?.average_rating || 5.0).toFixed(1)} / 5.0
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Across verified reviews</span>
        </Card>
      </div>

      {/* Quick Action Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/provider/requests">
          <Card hoverEffect className="p-6 space-y-3 border-slate-200 hover:border-brand-400">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">Manage Booking Requests</h4>
            <p className="text-xs text-slate-500">
              Accept customer appointments, reject conflicting dates, and assign in-house technicians.
            </p>
            <div className="pt-2 text-xs font-bold text-brand-600 flex items-center gap-1">
              View queue &rarr;
            </div>
          </Card>
        </Link>

        <Link to="/provider/technicians">
          <Card hoverEffect className="p-6 space-y-3 border-slate-200 hover:border-brand-400">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">Technician Fleet ({stats?.total_technicians || 0})</h4>
            <p className="text-xs text-slate-500">
              Onboard field technicians with individual credentials, review jobs dispatched, and track ratings.
            </p>
            <div className="pt-2 text-xs font-bold text-brand-600 flex items-center gap-1">
              Manage fleet &rarr;
            </div>
          </Card>
        </Link>

        <Link to="/provider/schedule">
          <Card hoverEffect className="p-6 space-y-3 border-slate-200 hover:border-brand-400">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">Operating Hours & Coverage</h4>
            <p className="text-xs text-slate-500">
              Define your weekly shifts, slot intervals, and emergency closures to prevent slot conflicts.
            </p>
            <div className="pt-2 text-xs font-bold text-brand-600 flex items-center gap-1">
              Update schedule &rarr;
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

