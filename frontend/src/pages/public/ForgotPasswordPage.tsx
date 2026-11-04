import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/login" className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset Password</h1>
        <p className="text-xs text-slate-500">
          Enter your registered email address and we will dispatch password recovery instructions.
        </p>
      </div>

      {submitted ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900">Recovery Instructions Sent</h3>
          <p className="text-xs text-emerald-700">
            If an account matches <strong>{email}</strong>, check your inbox for instructions to reset your password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Registered Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Button type="submit" size="md" className="w-full" isLoading={loading}>
            Send Recovery Instructions
          </Button>
        </form>
      )}
    </div>
  );
};

