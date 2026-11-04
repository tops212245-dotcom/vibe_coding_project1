import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, User, Phone, AlertCircle, FileCheck } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ProviderRegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experienceYears: 3,
    businessRegNo: '',
    taxId: '',
    bio: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.registerProvider({
        business_name: formData.businessName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        experience_years: Number(formData.experienceYears),
        business_reg_no: formData.businessRegNo || undefined,
        tax_id: formData.taxId || undefined,
        bio: formData.bio || undefined,
        password: formData.password,
      });

      const { access_token, refresh_token, user } = res.data;
      login(access_token, refresh_token, user);
      navigate('/provider');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Provider registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partner with HomeServe</h1>
        <p className="text-xs text-slate-500">
          Scale your home service business, manage technician teams, and access high-intent customer bookings.
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
          label="Registered Business Name"
          required
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          placeholder="e.g. Apex Electrical Solutions"
          leftIcon={<Briefcase className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Owner First Name"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Rajesh"
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label="Owner Last Name"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Sharma"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Business Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@apexhomes.in"
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98111 22233"
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Experience (Years)"
            type="number"
            min={0}
            required
            value={formData.experienceYears}
            onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
          />
          <Input
            label="GSTIN / Tax ID"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            placeholder="27AAACH1234F1Z5"
          />
        </div>

        <Input
          label="Account Password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <Button type="submit" size="md" className="w-full" isLoading={loading}>
          Submit Provider Application
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign In
        </Link>
      </div>
    </div>
  );
};

