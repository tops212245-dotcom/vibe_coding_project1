import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Shield, Clock, Award, Star, CheckCircle2, ArrowRight,
  Zap, Wrench, Wind, Sparkles, Paintbrush, Hammer, Tv, ShieldAlert,
  ChevronRight, Calendar, CreditCard, ThumbsUp
} from 'lucide-react';
import { catalogApi } from '../../services/api';
import { ServiceCategory } from '../../types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await catalogApi.getCategories();
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-6 h-6 text-amber-500" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-blue-500" />;
      case 'Wind': return <Wind className="w-6 h-6 text-sky-500" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-purple-500" />;
      case 'Paintbrush': return <Paintbrush className="w-6 h-6 text-rose-500" />;
      case 'Hammer': return <Hammer className="w-6 h-6 text-orange-500" />;
      case 'Tv': return <Tv className="w-6 h-6 text-indigo-500" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6 text-emerald-500" />;
      default: return <Wrench className="w-6 h-6 text-brand-600" />;
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-slate-50 to-white pt-16 pb-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/70 text-brand-800 text-xs font-semibold border border-brand-200">
              <Shield className="w-4 h-4 text-brand-600" />
              Verified & Certified Home Service Professionals
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Expert Home Services <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
                Delivered On Demand.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Book certified electricians, plumbers, AC technicians, and cleaners. Real-time availability, protected payments, and 30-day service warranty.
            </p>

            {/* Live Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-8">
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try 'Split AC service', 'Fan repair', or 'Kitchen deep cleaning'..."
                  className="w-full bg-transparent px-2 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <Button type="submit" size="md" className="flex-shrink-0">
                  Search Services
                </Button>
              </div>
            </form>

            {/* Popular quick chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Popular:</span>
              <Link to="/services?search=AC" className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                AC Jet Service
              </Link>
              <Link to="/services?search=Switch" className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                Switch Board
              </Link>
              <Link to="/services?search=Cleaning" className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                2 BHK Cleaning
              </Link>
              <Link to="/services?search=Tap" className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                Tap Leakage
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory 8 Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Explore Catalog</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Select a Service Category
            </h3>
          </div>
          <Link to="/services" className="mt-3 sm:mt-0 text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            Browse all services &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/categories/${cat.slug}`}>
              <Card hoverEffect className="h-full flex flex-col justify-between p-6 group border-slate-200 hover:border-brand-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                  <span>Explore Services</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Workflow Section */}
      <section className="bg-slate-900 text-white py-20 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-brand-400 uppercase tracking-wider">Seamless Process</h2>
            <h3 className="text-3xl font-extrabold tracking-tight">How HomeServe Works</h3>
            <p className="text-sm text-slate-400">
              End-to-end reliability from service booking to doorstep fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base">
                1
              </div>
              <h4 className="text-lg font-bold text-white">Choose Service</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse our transparent catalog, compare verified provider pricing, and select your preferred package.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base">
                2
              </div>
              <h4 className="text-lg font-bold text-white">Select Live Slot</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pick a guaranteed appointment time. Our database concurrency lock eliminates double bookings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base">
                3
              </div>
              <h4 className="text-lg font-bold text-white">Doorstep Execution</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                A background-verified technician arrives on schedule with tools, checklists, and real-time status updates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base">
                4
              </div>
              <h4 className="text-lg font-bold text-white">Pay & Review</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Securely pay via Razorpay after job completion, download your official tax invoice, and leave feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 space-y-4 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">100% Background Vetted</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every provider undergoes strict identity and trade license verification by platform administrators before accepting jobs.
            </p>
          </Card>

          <Card className="p-8 space-y-4 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Zero Overbooking Guarantee</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Our backend transactional scheduling engine guarantees your confirmed technician slot is 100% reserved for you.
            </p>
          </Card>

          <Card className="p-8 space-y-4 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">30-Day Service Warranty</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              If an issue persists within 30 days of service, our partner will revisit and resolve it at zero additional cost.
            </p>
          </Card>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 p-8 sm:p-14 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Are you a certified service provider?
            </h3>
            <p className="text-sm sm:text-base text-brand-100">
              Grow your customer base, manage technicians, automate invoice generation, and receive direct weekly payouts.
            </p>
          </div>
          <Link to="/register-provider" className="flex-shrink-0">
            <Button size="lg" className="bg-white text-brand-700 hover:bg-slate-100 shadow-lg">
              Join as Service Provider &rarr;
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

