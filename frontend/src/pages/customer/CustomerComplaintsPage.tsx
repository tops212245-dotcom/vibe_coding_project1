import React, { useState, useEffect } from 'react';
import { AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState({
    booking_id: 1,
    category: 'Technician Delay',
    description: '',
  });

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/complaints', ticketData);
      setModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to file ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispute & Support Tickets</h1>
          <p className="text-xs text-slate-500 mt-0.5">Report service quality issues or billing concerns directly to Super Admin.</p>
        </div>
        <Button size="sm" variant="danger" onClick={() => setModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Raise New Dispute
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading support tickets..." />
      ) : complaints.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed">
          No active dispute tickets. If you experience any service irregularity, raise a ticket here for priority resolution.
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Card key={c.id} className="p-6 border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-600">{c.ticket_number}</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">{c.category}</h3>
                  <p className="text-xs text-slate-500">Booking Ref: {c.booking_reference}</p>
                </div>
                <Badge status={c.status} />
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {c.description}
              </p>
              {c.admin_resolution && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <strong>Admin Resolution:</strong> {c.admin_resolution}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Raise Dispute Ticket">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Booking ID"
            type="number"
            required
            value={ticketData.booking_id}
            onChange={(e) => setTicketData({ ...ticketData, booking_id: Number(e.target.value) })}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issue Category</label>
            <select
              value={ticketData.category}
              onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Technician Delay">Technician Delay / Unpunctual</option>
              <option value="Poor Service Quality">Poor Work Quality / Incomplete</option>
              <option value="Overcharging Dispute">Overcharging / Additional Demands</option>
              <option value="Appliance Damage">Property / Appliance Damage</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Detailed Description</label>
            <textarea
              rows={4}
              required
              value={ticketData.description}
              onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
              placeholder="Provide specific details of the incident..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="danger" size="md" className="w-full">
            Submit Dispute Ticket
          </Button>
        </form>
      </Modal>
    </div>
  );
};

