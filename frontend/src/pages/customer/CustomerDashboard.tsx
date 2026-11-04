import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Wrench, CheckCircle2, AlertCircle, PlusCircle,
  FileText, Star, ArrowRight, User
} from 'lucide-react';
import { customerApi } from '../../services/api';
import { Booking } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await customerApi.getBookings();
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const upcomingBookings = bookings.filter((b) =>
    ['PENDING', 'CONFIRMED', 'PROVIDER_ASSIGNED', 'IN_PROGRESS'].includes(b.status)
  );
  const pastBookings = bookings.filter((b) =>
    ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Customer Appointment Hub</h2>
          <p className="text-xs sm:text-sm text-brand-200 mt-1">
            Track active technician visits, review completed services, and download official tax receipts.
          </p>
        </div>
        <Link to="/services" className="flex-shrink-0">
          <Button size="md" className="bg-brand-500 hover:bg-brand-400 text-white shadow-md">
            <PlusCircle className="w-4 h-4 mr-2" /> Book New Service
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Upcoming Appointments</span>
          <span className="text-3xl font-extrabold text-brand-600 mt-2 block">{upcomingBookings.length}</span>
        </Card>
        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Completed Services</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">
            {bookings.filter((b) => b.status === 'COMPLETED').length}
          </span>
        </Card>
        <Card className="p-6 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Bookings</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-2 block">{bookings.length}</span>
        </Card>
      </div>

      {/* Active Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Active Bookings</h3>
          <span className="text-xs text-slate-500">{upcomingBookings.length} scheduled</span>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching your bookings..." />
        ) : upcomingBookings.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 border-dashed">
            You currently have no active appointments. Need plumbing, AC, or electrical maintenance?
            <div className="mt-4">
              <Link to="/services">
                <Button size="sm">Explore Catalog</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingBookings.map((b) => (
              <Card key={b.id} className="p-6 border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-brand-600 block">{b.booking_reference}</span>
                    <h4 className="text-base font-bold text-slate-900">{b.service_name}</h4>
                    <p className="text-xs text-slate-500">Provider: {b.provider_business_name}</p>
                  </div>
                  <Badge status={b.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.booking_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.booking_time}</span>
                  </div>
                  <div className="col-span-2 truncate">
                    <strong>Address:</strong> {b.address_display}
                  </div>
                </div>

                {b.assignment && (
                  <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-center justify-between">
                    <div>
                      <span className="font-semibold block">Technician Dispatched</span>
                      <span>{b.assignment.technician_name} ({b.assignment.technician_phone})</span>
                    </div>
                    <Badge status={b.assignment.status} variant="info" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-black text-slate-900">Total: ₹{b.total_amount}</span>
                  <Link to={`/customer/bookings/${b.id}`}>
                    <Button variant="outline" size="sm">
                      Details & Invoice &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* History Table */}
      {pastBookings.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Booking History</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{b.booking_reference}</td>
                      <td className="p-4 text-slate-700">{b.service_name}</td>
                      <td className="p-4 text-slate-600">{b.provider_business_name}</td>
                      <td className="p-4 text-slate-500">{b.booking_date}</td>
                      <td className="p-4 font-bold text-slate-900">₹{b.total_amount}</td>
                      <td className="p-4"><Badge status={b.status} /></td>
                      <td className="p-4 text-right">
                        <Link to={`/customer/bookings/${b.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

