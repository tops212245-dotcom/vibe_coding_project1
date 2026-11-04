import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar, Clock, User, Phone, MapPin, Download, Star, AlertCircle,
  CheckCircle2, ArrowLeft, Shield, Wrench, XCircle
} from 'lucide-react';
import { bookingApi, paymentApi, api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const fetchBooking = async () => {
    if (!id) return;
    try {
      const res = await bookingApi.getBookingDetails(Number(id));
      setBooking(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      await api.post('/reviews', {
        booking_id: booking.id,
        rating,
        comment,
      });
      setReviewSuccess(true);
      setReviewModalOpen(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelSubmitting(true);
    try {
      await bookingApi.cancelBooking(booking.id, { reason: cancelReason });
      setCancelModalOpen(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Cancellation failed');
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading booking details..." />;
  if (!booking) return <div className="text-center py-20 text-slate-500">Booking record not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/customer" className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Appointments
      </Link>

      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
            Booking Reference #{booking.booking_reference}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{booking.service_name}</h1>
          <p className="text-xs text-slate-500 mt-1">Provider: {booking.provider_business_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={booking.status} className="text-sm px-3.5 py-1" />
          {['PENDING', 'CONFIRMED'].includes(booking.status) && (
            <Button variant="danger" size="sm" onClick={() => setCancelModalOpen(true)}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Booking Progress Timeline */}
      <Card className="p-6 border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Status Timeline</h3>
        <div className="space-y-3">
          {booking.status_history?.map((h: any, idx: number) => (
            <div key={h.id || idx} className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{h.new_status}</div>
                <div className="text-slate-500">{h.remarks}</div>
              </div>
              <div className="text-slate-400">
                {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Assignment & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Appointment Location & Schedule</h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span><strong>Date:</strong> {booking.booking_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span><strong>Slot:</strong> {booking.booking_time} (~{booking.estimated_duration_min} mins)</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span><strong>Address:</strong> {booking.address_display}</span>
            </div>
            {booking.problem_description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                <strong>Instructions:</strong> {booking.problem_description}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Dispatched Technician</h3>
          {booking.assignment ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                  {booking.assignment.technician_name[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{booking.assignment.technician_name}</div>
                  <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {booking.assignment.technician_phone || '+91 98222 33344'}
                  </div>
                </div>
              </div>
              <div className="text-slate-500">
                Field Status: <strong>{booking.assignment.status}</strong>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
              A certified technician will be assigned shortly by {booking.provider_business_name}.
            </div>
          )}
        </Card>
      </div>

      {/* Tax Invoice & Review Action Bar */}
      <Card className="p-6 border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Official Tax Invoice</h4>
          <p className="text-xs text-slate-500">
            Total Settled: <strong>₹{booking.total_amount}</strong> (Includes GST 5%)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {booking.status === 'COMPLETED' && (
            <Button size="sm" variant="secondary" onClick={() => setReviewModalOpen(true)}>
              <Star className="w-4 h-4 mr-1.5 text-amber-400 fill-amber-400" /> Submit Review
            </Button>
          )}
          <a
            href={`/api/v1/invoices/${booking.id}/html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1.5" /> Download Tax Invoice
            </Button>
          </a>
        </div>
      </Card>

      {/* Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Rate Your Service Experience">
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rating (1 to 5 Stars)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-xl border ${
                    rating >= star ? 'bg-amber-50 border-amber-300 text-amber-500' : 'bg-white border-slate-200 text-slate-300'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Written Feedback</label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the technician's punctuality, work quality, and cleanliness?"
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" size="md" className="w-full" isLoading={reviewSubmitting}>
            Submit Verified Review
          </Button>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Appointment">
        <form onSubmit={handleCancelBooking} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to cancel this booking? This will immediately free up the reserved time slot for other customers.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for Cancellation</label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, problem resolved itself..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="danger" size="md" className="w-full" isLoading={cancelSubmitting}>
            Confirm Cancellation
          </Button>
        </form>
      </Modal>
    </div>
  );
};

