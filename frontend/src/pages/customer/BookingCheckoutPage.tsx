import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, MapPin, Tag, Shield, AlertCircle,
  CheckCircle2, CreditCard, ArrowLeft, PlusCircle
} from 'lucide-react';
import { catalogApi, customerApi, bookingApi, paymentApi, api } from '../../services/api';
import { Address } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const BookingCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = Number(searchParams.get('service_id'));
  const providerId = Number(searchParams.get('provider_id'));
  const navigate = useNavigate();

  const [service, setService] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // New Address modal
  const [newAddrModal, setNewAddrModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    title: 'Home',
    address_line1: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400050',
  });

  // Scheduling State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState(defaultDateStr);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [problemDescription, setProblemDescription] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Slot Availability Check state
  const [slotChecking, setSlotChecking] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState<boolean | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any>(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const srvRes = await catalogApi.getServiceDetails(serviceId);
        setService(srvRes.data.service);
        const prov = srvRes.data.providers.find((p: any) => p.provider_id === providerId);
        setProvider(prov || srvRes.data.providers[0]);

        const addrRes = await customerApi.getAddresses();
        setAddresses(addrRes.data);
        if (addrRes.data.length > 0) {
          const def = addrRes.data.find((a: Address) => a.is_default) || addrRes.data[0];
          setSelectedAddressId(def.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (serviceId) loadDetails();
  }, [serviceId, providerId]);

  // Live Slot Availability Check whenever date or time slot changes
  useEffect(() => {
    const verifySlot = async () => {
      if (!providerId || !serviceId || !bookingDate || !bookingTime) return;
      setSlotChecking(true);
      setSlotError(null);
      try {
        const res = await bookingApi.checkAvailability({
          provider_id: providerId,
          service_id: serviceId,
          booking_date: bookingDate,
          booking_time: bookingTime,
        });
        setSlotAvailable(res.data.is_available);
        if (!res.data.is_available) {
          setSlotError(res.data.reason || 'This slot is unavailable.');
        }
      } catch (err: any) {
        setSlotAvailable(false);
        setSlotError(err.response?.data?.detail || 'Failed to verify slot.');
      } finally {
        setSlotChecking(false);
      }
    };
    verifySlot();
  }, [bookingDate, bookingTime, providerId, serviceId]);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME50') {
      const price = provider ? provider.custom_price : service?.base_price || 0;
      const disc = Math.min(price * 0.15, 200);
      setCouponDiscount(disc);
    } else {
      alert('Invalid coupon code. Try WELCOME50 for 15% discount!');
      setCouponDiscount(0);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await customerApi.createAddress(newAddr);
      setAddresses([...addresses, res.data]);
      setSelectedAddressId(res.data.id);
      setNewAddrModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add address');
    }
  };

  const handleConfirmAndPay = async () => {
    if (!selectedAddressId) {
      alert('Please select or add a service address.');
      return;
    }
    if (slotAvailable === false) {
      alert('Selected time slot conflicts with existing appointments. Please pick another slot.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create atomic booking on backend
      const bookingRes = await bookingApi.createBooking({
        provider_id: providerId,
        service_id: serviceId,
        address_id: selectedAddressId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        problem_description: problemDescription,
        coupon_code: couponDiscount > 0 ? couponCode : undefined,
      });

      const newBooking = bookingRes.data;

      // Step 2: Initialize Razorpay / Simulator Order
      const orderRes = await paymentApi.createOrder(newBooking.id);
      const { order_id, is_simulation } = orderRes.data;

      // Step 3: Verify and Capture Payment Server-Side
      const fakePayId = `pay_sim_${Date.now()}`;
      await paymentApi.verifyPayment({
        booking_id: newBooking.id,
        razorpay_order_id: order_id,
        razorpay_payment_id: fakePayId,
        razorpay_signature: `sim_sig_${fakePayId}`,
        is_simulation: true,
      });

      setSuccessBooking(newBooking);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Booking failed. Slot may have been taken.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) return <LoadingSpinner message="Preparing checkout..." />;

  const basePrice = provider ? Number(provider.custom_price) : Number(service.base_price);
  const tax = Math.round((Math.max(basePrice - couponDiscount, 0) * 0.05) * 100) / 100;
  const grandTotal = Math.round((Math.max(basePrice - couponDiscount, 0) + tax) * 100) / 100;

  const timeSlots = ['09:00', '10:00', '11:30', '14:00', '15:30', '17:00', '18:30'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link to={`/services/${service.id}`} className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Service
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Confirm & Schedule Appointment</h1>
        <p className="text-xs text-slate-500 mt-1">
          Guaranteed reservation with real-time slot conflict detection and secure escrow billing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Schedule Selection */}
          <Card className="p-6 space-y-5 border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <CalendarIcon className="w-5 h-5 text-brand-600" />
              <h3>1. Select Date & Time Slot</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Service Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Available Slots</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBookingTime(slot)}
                      className={`p-2 text-xs font-bold rounded-xl border transition-all ${
                        bookingTime === slot
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-time slot conflict indicator */}
            <div className="pt-2">
              {slotChecking ? (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <LoadingSpinner message="Checking schedule availability..." />
                </div>
              ) : slotAvailable === false ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{slotError || 'Slot is occupied or conflicts with existing jobs.'}</span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Time slot {bookingTime} on {bookingDate} is guaranteed available!</span>
                </div>
              )}
            </div>
          </Card>

          {/* Step 2: Service Address */}
          <Card className="p-6 space-y-4 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <MapPin className="w-5 h-5 text-brand-600" />
                <h3>2. Service Address</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewAddrModal(true)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 border border-dashed rounded-xl text-center">
                No addresses saved. Click "Add Address" to proceed.
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      selectedAddressId === addr.id
                        ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold text-slate-900">{addr.title}</span> &bull; {addr.address_line1}, {addr.city} - {addr.postal_code}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Card>

          {/* Step 3: Instructions & Notes */}
          <Card className="p-6 space-y-3 border-slate-200">
            <label className="block text-sm font-bold text-slate-900">
              3. Instructions for Technician (Optional)
            </label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="e.g. Please bring a tall ladder; switch board is above the false ceiling..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </Card>
        </div>

        {/* Right Summary & Checkout Panel */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-200 shadow-lg space-y-5">
            <h3 className="font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900">{service.name}</div>
              <div className="text-slate-500">Provider: {provider?.business_name}</div>
              <div className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Duration: {service.estimated_duration_min} mins
              </div>
            </div>

            {/* Coupon input */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Coupon Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="WELCOME50"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button variant="outline" size="sm" onClick={handleApplyCoupon}>
                  Apply
                </Button>
              </div>
              {couponDiscount > 0 && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  15% discount applied (-₹{couponDiscount.toFixed(2)})
                </p>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Base Service Fee</span>
                <span>₹{basePrice.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              isLoading={submitting}
              disabled={slotAvailable === false || addresses.length === 0}
              onClick={handleConfirmAndPay}
            >
              Confirm Booking & Pay ₹{grandTotal.toFixed(2)}
            </Button>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1 pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Test Gateway &bull; 100% Escrow Protected</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal isOpen={newAddrModal} onClose={() => setNewAddrModal(false)} title="Add Service Address">
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Input
            label="Address Title"
            required
            value={newAddr.title}
            onChange={(e) => setNewAddr({ ...newAddr, title: e.target.value })}
            placeholder="Home, Office, or Villa"
          />
          <Input
            label="Flat / House / Street Address"
            required
            value={newAddr.address_line1}
            onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
            placeholder="Flat 402, Green Meadows"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              required
              value={newAddr.city}
              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
            />
            <Input
              label="Postal Code"
              required
              value={newAddr.postal_code}
              onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
            />
          </div>
          <Button type="submit" size="md" className="w-full">
            Save Address
          </Button>
        </form>
      </Modal>

      {/* Booking Success Confirmation Modal */}
      {successBooking && (
        <Modal isOpen={true} onClose={() => navigate('/customer')} title="Appointment Booked & Confirmed!">
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Payment Captured Successfully</h4>
              <p className="text-xs text-slate-500 mt-1">
                Booking Reference: <strong className="text-brand-600">{successBooking.booking_reference}</strong>
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-700 space-y-1.5 border border-slate-200">
              <div><strong>Scheduled For:</strong> {bookingDate} at {bookingTime}</div>
              <div><strong>Service:</strong> {service.name}</div>
              <div><strong>Total Paid:</strong> ₹{grandTotal.toFixed(2)} (Tax Invoice Issued)</div>
            </div>
            <div className="flex gap-3 pt-3">
              <Link to={`/customer/bookings/${successBooking.id}`} className="w-full">
                <Button size="md" className="w-full">
                  View Booking & Tax Invoice &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

