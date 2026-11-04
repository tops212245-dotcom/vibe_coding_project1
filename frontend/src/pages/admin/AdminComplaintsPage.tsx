import React, { useState, useEffect } from 'react';
import {
  AlertCircle, CheckCircle2, MessageSquare, Clock, ShieldAlert,
  User, Check, X, Filter
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

interface ComplaintItem {
  id: number;
  booking_id: number;
  booking_reference: string;
  customer_name: string;
  category: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'INVESTIGATING' | 'RESOLVED' | 'CLOSED'>('RESOLVED');
  const [saving, setSaving] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getComplaints();
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setSaving(true);
      await adminApi.resolveComplaint(selectedComplaint.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes.trim(),
      });
      setSelectedComplaint(null);
      setResolutionNotes('');
      await fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update dispute status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Customer Dispute Center
          </div>
          <h2 className="text-2xl font-black tracking-tight">Disputes & Complaints</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Mediate service quality issues, billing questions, and technician no-show complaints to maintain marketplace trust.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchComplaints} className="border-slate-700 text-slate-200 hover:bg-slate-800">
          Refresh Tickets
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading customer support tickets..." />
      ) : complaints.length === 0 ? (
        <EmptyState
          title="No Open Disputes"
          description="There are currently no customer dispute tickets lodged against any bookings."
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Card key={c.id} className="p-6 border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-600">TICKET #{c.id}</span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs font-mono text-slate-600">Booking: {c.booking_reference}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{c.subject}</h3>
                  <p className="text-xs text-slate-500">
                    Category: <span className="font-semibold text-slate-700">{c.category}</span> &bull; By: {c.customer_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={c.status} />
                  {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedComplaint(c);
                        setResolutionNotes(c.resolution_notes || '');
                        setResolutionStatus('RESOLVED');
                      }}
                    >
                      Resolve Ticket &rarr;
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <strong className="block text-slate-800 font-semibold">Customer Grievance:</strong>
                <p>{c.description}</p>
              </div>

              {c.resolution_notes && (
                <div className="text-xs text-emerald-900 bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-1">
                  <strong className="block text-emerald-950 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Administrative Resolution Notes:
                  </strong>
                  <p>{c.resolution_notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title={`Resolve Dispute Ticket #${selectedComplaint.id}`}
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Status</label>
              <select
                value={resolutionStatus}
                onChange={(e: any) => setResolutionStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option value="INVESTIGATING">Mark Under Investigation</option>
                <option value="RESOLVED">Mark Resolved (Satisfied)</option>
                <option value="CLOSED">Close Ticket</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Statement & Actions Taken *
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                required
                placeholder="State the resolution steps taken (e.g. provider cautioned, partial refund sanctioned, free re-service arranged)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedComplaint(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save Resolution'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

