import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      const { access_token, refresh_token, user } = res.data;
      login(access_token, refresh_token, user);

      // Route to user's dedicated dashboard
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'PROVIDER':
          navigate('/provider');
          break;
        case 'TECHNICIAN':
          navigate('/technician');
          break;
        case 'CUSTOMER':
        default:
          navigate('/customer');
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
        <p className="text-xs text-slate-500">
          Sign in to your HomeServe account to manage appointments, services, or earnings.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. priya@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Forgot?
            </Link>
          </div>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />
        </div>

        <Button type="submit" size="md" className="w-full" isLoading={loading}>
          Sign In to Dashboard
        </Button>
      </form>

      {/* 1-Click Demo Evaluation Credentials */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            1-Click Demo Login
          </span>
          <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-semibold">
            Pre-seeded Accounts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillDemoAccount('admin@homeserve.com', 'AdminPassword123!')}
            className="p-2 rounded-xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Super Admin</div>
            <div className="text-[10px] text-slate-400">admin@homeserve.com</div>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('provider@homeserve.com', 'Provider123!')}
            className="p-2 rounded-xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Service Provider</div>
            <div className="text-[10px] text-slate-400">provider@homeserve.com</div>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('tech@homeserve.com', 'Tech123!')}
            className="p-2 rounded-xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Field Technician</div>
            <div className="text-[10px] text-slate-400">tech@homeserve.com</div>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('customer@homeserve.com', 'Customer123!')}
            className="p-2 rounded-xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Customer</div>
            <div className="text-[10px] text-slate-400">customer@homeserve.com</div>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-2">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create Customer Account
        </Link>
        {' '}&bull;{' '}
        <Link to="/register-provider" className="font-semibold text-brand-600 hover:text-brand-700">
          Join as Provider
        </Link>
      </div>
    </div>
  );
};

