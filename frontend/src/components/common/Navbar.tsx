import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, Shield, Bell, User as UserIcon, LogOut, Menu, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'PROVIDER':
        return '/provider';
      case 'TECHNICIAN':
        return '/technician';
      case 'CUSTOMER':
      default:
        return '/customer';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                Home<span className="text-brand-600">Serve</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                PRO SAAS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/services" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Services
            </Link>
            <Link to="/providers" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Find Providers
            </Link>
            <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              About Us
            </Link>
            <Link to="/faq" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              FAQ
            </Link>
            <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Action Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link to={getDashboardRoute()}>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>

                {/* Profile menu */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2.5 p-1.5 pl-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-slate-900 leading-tight">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-[10px] font-medium text-brand-600 tracking-wider">
                        {user.role}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                      {user.first_name[0]}
                      {user.last_name[0]}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-medium text-slate-500">Signed in as</p>
                        <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                      </div>
                      <Link
                        to={getDashboardRoute()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 mr-2.5 text-slate-400" />
                        My Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2.5 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/register-provider" className="text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors px-2 py-1">
                  Partner with Us
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Services
          </Link>
          <Link
            to="/providers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Find Providers
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            About Us
          </Link>
          <Link
            to="/faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            FAQ
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Contact
          </Link>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button className="w-full" size="md">
                    Go to {user.role} Dashboard
                  </Button>
                </Link>
                <Button variant="outline" className="w-full text-red-600" onClick={handleLogout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                  <Button className="w-full">Get Started</Button>
                </Link>
                <Link to="/register-provider" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center text-xs font-semibold text-brand-600 pt-2">
                  Register as Service Provider &rarr;
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

