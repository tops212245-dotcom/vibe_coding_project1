import React, { useState } from 'react';
import { Shield, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { providerApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const ProviderKYCPage: React.FC = () => {
  const { user } = useAuth();
  const [kycData, setKycData] = useState({
    business_reg_no: 'REG-2024-MH-8902',
    tax_id: 'GSTIN27AAACH1234F1Z5',
    id_proof_url: 'https://res.cloudinary.com/demo/image/upload/id_proof_sample.pdf',
    business_proof_url: 'https://res.cloudinary.com/demo/image/upload/trade_license_sample.pdf',
    bio: 'Professional home maintenance organization with certified technicians.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await providerApi.submitKyc(kycData);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit KYC documents');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Provider KYC & Business Verification</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Government-issued trade licenses and identity documents are reviewed by Super Admin before your services go live.
        </p>
      </div>

      <Card className="p-6 border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Current Status</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">
            {user?.verification_status || 'APPROVED'}
          </span>
        </div>
        <Badge status={user?.verification_status || 'APPROVED'} />
      </Card>

      {submitted ? (
        <Card className="p-8 text-center space-y-3 bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-emerald-900">KYC Submitted Successfully</h3>
          <p className="text-xs text-emerald-700">
            Our compliance team will review your business license within 24 business hours.
          </p>
        </Card>
      ) : (
        <Card className="p-8 border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Business Registration / MSME No."
                required
                value={kycData.business_reg_no}
                onChange={(e) => setKycData({ ...kycData, business_reg_no: e.target.value })}
              />
              <Input
                label="GSTIN / Tax ID"
                required
                value={kycData.tax_id}
                onChange={(e) => setKycData({ ...kycData, tax_id: e.target.value })}
              />
            </div>

            <Input
              label="Government Photo ID Proof URL (Cloudinary / S3)"
              required
              value={kycData.id_proof_url}
              onChange={(e) => setKycData({ ...kycData, id_proof_url: e.target.value })}
            />

            <Input
              label="Business Certificate / Trade License URL"
              required
              value={kycData.business_proof_url}
              onChange={(e) => setKycData({ ...kycData, business_proof_url: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Bio</label>
              <textarea
                rows={3}
                value={kycData.bio}
                onChange={(e) => setKycData({ ...kycData, bio: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" size="md" className="w-full" isLoading={submitting}>
              Submit Documents for Verification
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};

