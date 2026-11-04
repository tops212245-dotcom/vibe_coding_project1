import React, { useState, useEffect } from 'react';
import {
  Wrench, Calendar, Clock, MapPin, Phone, User, CheckCircle2,
  Navigation, Play, AlertCircle, FileText, Camera, ShieldCheck
} from 'lucide-react';
import { techApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

interface TechJob {
  assignment_id: number;
  booking_id: number;
  booking_reference: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_phone?: string;
  address: string;
  problem_description?: string;
  assignment_status: string;
  booking_status: string;
  total_amount: number;
}

export const TechnicianDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<TechJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<TechJob | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImageUrl, setCompletionImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await techApi.getAssignedJobs();
      setJobs(res.data);
    } catch (err: any) {
      console.error('Failed to fetch assigned technician jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAcknowledge = async (bookingId: number) => {
    try {
      setActionLoading(bookingId);
      await techApi.acknowledgeJob(bookingId);
      await fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to acknowledge job.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkArrival = async (bookingId: number) => {
    try {
      setActionLoading(bookingId);
      await techApi.markArrival(bookingId);
      await fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to mark arrival.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartJob = async (bookingId: number) => {
    try {
      setActionLoading(bookingId);
      await techApi.startJob(bookingId);
      await fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start service.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForCompletion) return;
    if (completionNotes.trim().length < 5) {
      setErrorMsg('Please enter detailed completion remarks (min 5 characters).');
      return;
    }

    try {
      setActionLoading(selectedJobForCompletion.booking_id);
      await techApi.completeJob(selectedJobForCompletion.booking_id, {
        completion_notes: completionNotes,
        after_service_image_url: completionImageUrl || undefined,
      });
      setSelectedJobForCompletion(null);
      setCompletionNotes('');
      setCompletionImageUrl('');
      setErrorMsg(null);
      await fetchJobs();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to complete job.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingOrActiveJobs = jobs.filter(
    (j) => j.assignment_status !== 'COMPLETED' && j.booking_status !== 'CANCELLED'
  );
  const completedJobs = jobs.filter((j) => j.assignment_status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Field Operations Dispatch
          </div>
          <h2 className="text-2xl font-black tracking-tight">Technician Work Orders</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Accept assignments, update on-site job progress, upload completion proof, and satisfy customer appointments.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs} className="border-slate-700 text-slate-200 hover:bg-slate-800">
          Refresh Queue
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Assigned / In Progress</span>
          <span className="text-3xl font-black text-brand-600 mt-2 block">{pendingOrActiveJobs.length}</span>
        </Card>
        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Jobs Completed</span>
          <span className="text-3xl font-black text-emerald-600 mt-2 block">{completedJobs.length}</span>
        </Card>
        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Work Orders</span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">{jobs.length}</span>
        </Card>
      </div>

      {/* Active Jobs Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Current Work Queue</h3>
          <span className="text-xs font-semibold text-slate-500">{pendingOrActiveJobs.length} Active Orders</span>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching field dispatch queue..." />
        ) : pendingOrActiveJobs.length === 0 ? (
          <EmptyState
            title="No Active Work Orders"
            description="You have no pending assignments right now. When your service provider assigns a customer job to you, it will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingOrActiveJobs.map((job) => {
              const isBusy = actionLoading === job.booking_id;

              return (
                <Card key={job.assignment_id} className="p-6 border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-brand-600 tracking-wide block">{job.booking_reference}</span>
                      <h4 className="text-lg font-bold text-slate-900">{job.service_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Value: ₹{job.total_amount.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge status={job.assignment_status} variant="info" />
                      <span className="text-[11px] text-slate-400 font-medium">Status: {job.booking_status}</span>
                    </div>
                  </div>

                  {/* Customer & Location */}
                  <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{job.customer_name}</span>
                    </div>
                    {job.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <a href={`tel:${job.customer_phone}`} className="text-brand-600 font-medium hover:underline">
                          {job.customer_phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{job.address}</span>
                    </div>
                    <div className="flex items-center gap-4 pt-1 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {job.booking_date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.booking_time}
                      </span>
                    </div>
                  </div>

                  {/* Problem Description */}
                  {job.problem_description && (
                    <div className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                      <strong className="text-amber-900 block mb-0.5">Customer Problem Notes:</strong>
                      {job.problem_description}
                    </div>
                  )}

                  {/* Action State Machine Pipeline */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {job.assignment_status === 'ASSIGNED' && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleAcknowledge(job.booking_id)}
                        className="bg-brand-600 hover:bg-brand-500"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Acknowledge Ticket
                      </Button>
                    )}

                    {(job.assignment_status === 'ACKNOWLEDGED' || job.assignment_status === 'ASSIGNED') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => handleMarkArrival(job.booking_id)}
                      >
                        <Navigation className="w-4 h-4 mr-1.5 text-brand-600" /> Mark At Customer Site
                      </Button>
                    )}

                    {(job.assignment_status === 'ARRIVED' || job.assignment_status === 'ACKNOWLEDGED') && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => handleStartJob(job.booking_id)}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        <Play className="w-4 h-4 mr-1.5" /> Start Service
                      </Button>
                    )}

                    {job.assignment_status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => {
                          setSelectedJobForCompletion(job);
                          setErrorMsg(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Service & Remarks
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed History Table */}
      {completedJobs.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Completed Service Tickets</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Assignment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedJobs.map((job) => (
                    <tr key={job.assignment_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{job.booking_reference}</td>
                      <td className="p-4 text-slate-700">{job.service_name}</td>
                      <td className="p-4 text-slate-600">{job.customer_name}</td>
                      <td className="p-4 text-slate-500">{job.booking_date}</td>
                      <td className="p-4 font-bold text-slate-900">₹{job.total_amount.toFixed(2)}</td>
                      <td className="p-4">
                        <Badge status="COMPLETED" variant="success" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {selectedJobForCompletion && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJobForCompletion(null)}
          title={`Complete Job: ${selectedJobForCompletion.booking_reference}`}
        >
          <form onSubmit={handleCompleteJobSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Provide service completion notes and optional after-service proof URL. This will trigger provider earning calculation and notify the customer.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician Work Remarks *
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
                required
                placeholder="Describe work performed, parts repaired/replaced, testing completed..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Completion Photo URL (Optional / Cloudinary)
              </label>
              <Input
                type="url"
                value={completionImageUrl}
                onChange={(e) => setCompletionImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/.../completed_job.jpg"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedJobForCompletion(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading === selectedJobForCompletion.booking_id}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {actionLoading === selectedJobForCompletion.booking_id ? 'Saving...' : 'Finalize & Submit'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

