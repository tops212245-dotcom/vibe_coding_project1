import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Home<span className="text-brand-400">Serve</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              India's premier on-demand home services booking platform. Connecting households with certified, background-checked electricians, plumbers, cleaners, and appliance technicians.
            </p>
            <div className="pt-2 flex items-center space-x-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-brand-400" /> 100% Verified Partners</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 30-Day Guarantee</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Core Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/services" className="hover:text-white transition-colors">Electrical Works</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Plumbing & Drains</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">AC Servicing & Gas</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Deep Home Cleaning</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Carpentry & Locks</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Pest Extermination</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About HomeServe</Link></li>
              <li><Link to="/providers" className="hover:text-white transition-colors">Verified Providers</Link></li>
              <li><Link to="/register-provider" className="hover:text-white transition-colors">Join as Partner</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Help & FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Legal & Contacts */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Contact & Trust</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>B-104 Tech Park, BKC, Mumbai - 400051</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>+91 (022) 8000-SERVE</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>support@homeserve.local</span>
              </li>
              <li className="pt-2 border-t border-slate-800 flex gap-3 text-slate-500">
                <Link to="/terms" className="hover:text-slate-400">Terms</Link>
                <span>&bull;</span>
                <Link to="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} HomeServe Technologies Inc. All rights reserved. Built with FastAPI, MySQL, React, and Tailwind CSS.
        </div>
      </div>
    </footer>
  );
};

