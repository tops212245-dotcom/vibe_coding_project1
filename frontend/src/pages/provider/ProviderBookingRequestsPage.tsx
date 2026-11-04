import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Phone, MapPin, CheckCircle2, XCircle,
  Users, AlertCircle
} from 'lucide-react';
import { api, bookingApi, providerApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProviderBookingRequestsPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign Technician Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      // In customerApi/admin we list bookings; for provider we query bookings for provider
      const res = await api.get('/customers/bookings'); // backend filters or returns bookings
      setBookings(res.data);
      const techRes = await providerApi.getTechnicians();
      setTechnicians(techRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (id: number, action: 'ACCEPT' | 'REJECT') => {
    try {
      await bookingApi.providerAction(id, { action });
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !selectedTechId) return;
    try {
      await bookingApi.assignTechnician(selectedBookingId, { technician_id: selectedTechId });
      setAssignModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Assignment failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Booking Requests & Dispatch</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Accept incoming customer orders, review appointment details, and dispatch qualified field technicians.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading incoming requests..." />
      ) : bookings.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed">
          No bookings currently in queue.
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id} className="p-6 border-slate-200 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-brand-600 block">{b.booking_reference}</span>
                  <h3 className="text-base font-bold text-slate-900">{b.service_name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Customer: <strong>{b.customer_name}</strong></span>
                    <span>&bull;</span>
                    <span>Phone: {b.customer_phone || '+91 98333 44455'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={b.status} />
                  <span className="text-lg font-black text-slate-900">₹{b.total_amount}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span><strong>Date:</strong> {b.booking_date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span><strong>Slot:</strong> {b.booking_time}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate"><strong>Loc:</strong> {b.address_display}</span>
                </div>
              </div>

              {b.assignment && (
                <div className="p-3 bg-brand-50 rounded-xl text-xs text-brand-900 flex items-center justify-between">
                  <span>Assigned Technician: <strong>{b.assignment.technician_name}</strong></span>
                  <Badge status={b.assignment.status} variant="info" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {b.status === 'PENDING' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleAction(b.id, 'REJECT')}>
                      <XCircle className="w-4 h-4 mr-1 text-red-500" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleAction(b.id, 'ACCEPT')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Accept Booking
                    </Button>
                  </>
                )}

                {['CONFIRMED', 'PROVIDER_ASSIGNED'].includes(b.status) && (
                  <Button
                    size="sm"
                    variant={b.assignment ? 'outline' : 'primary'}
                    onClick={() => {
                      setSelectedBookingId(b.id);
                      setAssignModalOpen(true);
                    }}
                  >
                    <Users className="w-4 h-4 mr-1.5" />
                    {b.assignment ? 'Reassign Technician' : 'Assign Technician'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Technician Assignment Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Technician to Booking">
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-xs text-slate-600">
            Select an active in-house technician from your fleet to fulfill this scheduled home service ticket.
          </p>

          <div className="space-y-2">
            {technicians.map((t) => (
              <label
                key={t.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  selectedTechId === t.id ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="technician"
                    checked={selectedTechId === t.id}
                    onChange={() => setSelectedTechId(t.id)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.specialization || 'General Technician'} &bull; ⭐ {t.rating}</div>
                  </div>
                </div>
                <Badge status={t.is_available ? 'ACTIVE' : 'INACTIVE'}>
                  {t.is_available ? 'Available' : 'Busy'}
                </Badge>
              </label>
            ))}
          </div>

          <Button type="submit" size="md" className="w-full" disabled={!selectedTechId}>
            Dispatch Technician
          </Button>
        </form>
      </Modal>
    </div>
  );
};

