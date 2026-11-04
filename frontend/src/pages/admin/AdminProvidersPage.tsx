import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertCircle, FileText,
  Percent, ExternalLink, User, Mail, Phone, Clock
} from 'lucide-react';
import { adminApi, api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

interface PendingProvider {
  provider_id: number;
  user_id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone?: string;
  business_reg_no?: string;
  tax_id?: string;
  id_proof_url?: string;
  business_proof_url?: string;
  experience_years: number;
  bio?: string;
  submitted_at?: string;
}

export const AdminProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<PendingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Verification modal state
  const [verifyTarget, setVerifyTarget] = useState<{ id: number; action: 'APPROVED' | 'REJECTED'; name: string } | null>(null);
  const [remarks, setRemarks] = useState('');

  // Commission modal state
  const [commissionTarget, setCommissionTarget] = useState<{ id: number; name: string } | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(10);

  const fetchPendingProviders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPendingProviders();
      setProviders(res.data);
    } catch (err) {
      console.error('Failed to fetch pending providers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTarget) return;

    try {
      setActionLoading(verifyTarget.id);
      await adminApi.verifyProvider(verifyTarget.id, {
        verification_status: verifyTarget.action,
        remarks: remarks.trim() || undefined,
      });
      setVerifyTarget(null);
      setRemarks('');
      await fetchPendingProviders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Verification update failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionTarget) return;

    try {
      setActionLoading(commissionTarget.id);
      await api.put(`/admin/providers/${commissionTarget.id}/commission`, {
        commission_rate: Number(commissionRate),
      });
      alert(`Updated platform commission rate to ${commissionRate}% for ${commissionTarget.name}`);
      setCommissionTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update commission rate.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Provider KYC Governance
          </div>
          <h2 className="text-2xl font-black tracking-tight">Provider Verification Queue</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Audit government IDs, business registration certificates, and trade credentials. Approved providers immediately go live on the public service marketplace.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPendingProviders} className="border-slate-700 text-slate-200 hover:bg-slate-800">
          Refresh List
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading pending provider applications..." />
      ) : providers.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="There are currently no provider KYC applications pending verification review."
        />
      ) : (
        <div className="space-y-6">
          {providers.map((p) => {
            const isBusy = actionLoading === p.provider_id;

            return (
              <Card key={p.provider_id} className="p-6 border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-brand-600 block">PROVIDER #{p.provider_id}</span>
                    <h3 className="text-xl font-bold text-slate-900">{p.business_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Owner: {p.owner_name} &bull; Experience: {p.experience_years} years</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status="PENDING" variant="warning" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCommissionTarget({ id: p.provider_id, name: p.business_name });
                        setCommissionRate(10);
                      }}
                    >
                      <Percent className="w-3.5 h-3.5 mr-1 text-slate-400" /> Set Commission
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">Contact Information</span>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {p.email}
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.phone}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">Legal Identifiers</span>
                    <p className="text-slate-700"><strong>Reg No:</strong> {p.business_reg_no || 'N/A'}</p>
                    <p className="text-slate-700"><strong>GST / Tax ID:</strong> {p.tax_id || 'N/A'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">Uploaded KYC Documents</span>
                    <div className="space-y-1.5">
                      {p.id_proof_url ? (
                        <a
                          href={p.id_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-brand-600 font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Identity Proof Document <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">No identity document attached</span>
                      )}

                      {p.business_proof_url ? (
                        <a
                          href={p.business_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-brand-600 font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Business Registration Proof <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">No business license document attached</span>
                      )}
                    </div>
                  </div>
                </div>

                {p.bio && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="block text-slate-800 mb-0.5">Business Bio / Pitch:</strong>
                    {p.bio}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={isBusy}
                    onClick={() => setVerifyTarget({ id: p.provider_id, action: 'REJECTED', name: p.business_name })}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Reject Application
                  </Button>
                  <Button
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setVerifyTarget({ id: p.provider_id, action: 'APPROVED', name: p.business_name })}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Activate Provider
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Verify / Reject Confirmation Modal */}
      {verifyTarget && (
        <Modal
          isOpen={true}
          onClose={() => setVerifyTarget(null)}
          title={`${verifyTarget.action === 'APPROVED' ? 'Approve' : 'Reject'} ${verifyTarget.name}`}
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              {verifyTarget.action === 'APPROVED'
                ? 'Approving this provider marks their business as verified and allows their listed services to be booked by customers.'
                : 'Rejecting this provider marks their KYC application as rejected and notifies them with your reasons.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auditor Remarks {verifyTarget.action === 'REJECTED' && '*'}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                required={verifyTarget.action === 'REJECTED'}
                placeholder="Enter approval congratulations or missing document requirements for rejection..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setVerifyTarget(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className={verifyTarget.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}
                disabled={actionLoading === verifyTarget.id}
              >
                Confirm {verifyTarget.action}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Commission Modal */}
      {commissionTarget && (
        <Modal
          isOpen={true}
          onClose={() => setCommissionTarget(null)}
          title={`Set Commission: ${commissionTarget.name}`}
        >
          <form onSubmit={handleCommissionSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Set the percentage fee HomeServe retains on completed bookings for this provider. Default is 10.0%.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform Commission Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCommissionTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Rate
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

