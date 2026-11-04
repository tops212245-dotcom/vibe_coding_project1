import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Wrench, LayoutDashboard, Calendar, Users, Briefcase, FileText,
  Settings, LogOut, Bell, Menu, X, ShieldCheck, Tag, AlertCircle,
  Clock, DollarSign, CheckSquare, PlusCircle, UserCheck, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build role-specific sidebar navigation
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN':
        return [
          { name: 'Analytics & KPIs', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
          { name: 'Provider Approvals (KYC)', path: '/admin/providers', icon: <ShieldCheck className="w-5 h-5" /> },
          { name: 'Customer & Accounts', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
          { name: 'Category Management', path: '/admin/categories', icon: <Briefcase className="w-5 h-5" /> },
          { name: 'Discount Coupons', path: '/admin/coupons', icon: <Tag className="w-5 h-5" /> },
          { name: 'Disputes & Complaints', path: '/admin/complaints', icon: <AlertCircle className="w-5 h-5" /> },
          { name: 'CSV Reports & Exports', path: '/admin/reports', icon: <FileText className="w-5 h-5" /> },
        ];
      case 'PROVIDER':
        return [
          { name: 'Overview', path: '/provider', icon: <LayoutDashboard className="w-5 h-5" /> },
          { name: 'Booking Requests', path: '/provider/requests', icon: <Calendar className="w-5 h-5" /> },
          { name: 'Technician Fleet', path: '/provider/technicians', icon: <Users className="w-5 h-5" /> },
          { name: 'Catalog & Pricing', path: '/provider/services', icon: <Tag className="w-5 h-5" /> },
          { name: 'Operating Hours', path: '/provider/schedule', icon: <Clock className="w-5 h-5" /> },
          { name: 'Earnings & Payouts', path: '/provider/earnings', icon: <DollarSign className="w-5 h-5" /> },
          { name: 'KYC Verification', path: '/provider/kyc', icon: <ShieldCheck className="w-5 h-5" /> },
        ];
      case 'TECHNICIAN':
        return [
          { name: 'Job Queue', path: '/technician', icon: <CheckSquare className="w-5 h-5" /> },
        ];
      case 'CUSTOMER':
      default:
        return [
          { name: 'My Appointments', path: '/customer', icon: <Calendar className="w-5 h-5" /> },
          { name: 'Book New Service', path: '/services', icon: <PlusCircle className="w-5 h-5" /> },
          { name: 'Saved Addresses', path: '/customer/addresses', icon: <Users className="w-5 h-5" /> },
          { name: 'Disputes & Support', path: '/customer/complaints', icon: <AlertCircle className="w-5 h-5" /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                Home<span className="text-brand-400">Serve</span>
              </span>
              <div className="text-[10px] font-semibold text-slate-400 tracking-wider">
                {user?.role} PORTAL
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footprint & Logout in Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-brand-700 text-white flex items-center justify-center font-bold text-xs">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 capitalize hidden sm:block">
              {location.pathname.split('/')[2]?.replace('-', ' ') || `${user?.role?.toLowerCase()} Dashboard`}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-brand-600 hidden sm:inline-block">
              &larr; View Marketplace
            </Link>
            <Badge status={user?.status} />
          </div>
        </header>

        {/* Dynamic Nested View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-slate-900 text-slate-300 flex flex-col z-10">
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
              <span className="font-bold text-white text-base">HomeServe Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    location.pathname === item.path ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 text-xs font-medium text-red-400 p-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

