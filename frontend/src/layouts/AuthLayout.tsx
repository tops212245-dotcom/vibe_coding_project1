import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Wrench, Shield, CheckCircle2, Star } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      {/* Left Form View */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <div>
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Home<span className="text-brand-600">Serve</span>
            </span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto my-10">
          <Outlet />
        </div>

        <div className="text-xs text-slate-400 text-center sm:text-left">
          &copy; {new Date().getFullYear()} HomeServe Technologies. Secure 256-bit SSL encrypted.
        </div>
      </div>

      {/* Right Brand Showcase Panel */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-slate-900 via-navy-900 to-brand-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-warm-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-brand-300 border border-white/10 mb-6">
            <Shield className="w-4 h-4" /> Trusted by 50,000+ Urban Households
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight leading-snug">
            Professional Home Services, <br />
            <span className="text-brand-400">Scheduled in Under 60 Seconds.</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-md">
            Whether you are booking repairs as a homeowner, scaling an electrical business, or fulfilling field tickets as a technician — HomeServe powers your complete workflow.
          </p>
        </div>

        {/* Testimonial highlight card */}
        <div className="relative z-10 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-4">
          <div className="flex items-center space-x-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <p className="text-sm italic text-slate-200">
            "HomeServe transformed how we book verified electricians in Mumbai. The slot locking guaranteed zero delays, and payment through Razorpay gave complete peace of mind."
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-brand-600/60 flex items-center justify-center font-bold text-xs text-white">
              AK
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Ananya Kulkarni</div>
              <div className="text-[11px] text-slate-400">Verified Customer, Mumbai</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time Double Booking Protection</span>
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-brand-400" /> Vetted Professionals</span>
        </div>
      </div>
    </div>
  );
};

