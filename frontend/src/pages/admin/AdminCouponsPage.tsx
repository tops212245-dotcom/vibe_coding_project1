import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, Calendar, DollarSign, Percent, AlertCircle,
  CheckCircle2, Clock, Users, ArrowRight
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface CouponItem {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(100);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCoupons();
      setCoupons(res.data);
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      await adminApi.createCoupon({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrder),
        max_discount_amount: maxDiscount ? Number(maxDiscount) : null,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
        usage_limit: Number(usageLimit),
      });
      setShowModal(false);
      setCode('');
      await fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create coupon.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Tag className="w-3.5 h-3.5" /> Promotion Engine
          </div>
          <h2 className="text-2xl font-black tracking-tight">Discount Coupons & Offers</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Create promotional discount codes (Percentage or Flat off) with minimum checkout value and customer usage quotas.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="md" className="bg-brand-600 hover:bg-brand-500 text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Create Coupon
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading active promotional campaigns..." />
      ) : coupons.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 border-dashed">
          No promotional coupons created yet. Click Create Coupon above to set one up.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c) => (
            <Card key={c.id} className="p-6 border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-lg font-black text-brand-600 tracking-wider block bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 inline-block">
                    {c.code}
                  </span>
                  <div className="mt-2 text-xl font-bold text-slate-900">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                  </div>
                </div>
                <Badge status={c.is_active ? 'ACTIVE' : 'INACTIVE'} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p><strong>Min Order:</strong> ₹{c.min_order_amount}</p>
                {c.max_discount_amount && (
                  <p><strong>Max Cap:</strong> ₹{c.max_discount_amount}</p>
                )}
                <p><strong>Usage Limit:</strong> {c.used_count || 0} / {c.usage_limit} used</p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Valid: {new Date(c.valid_from).toLocaleDateString()} &ndash; {new Date(c.valid_until).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Coupon Modal */}
      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title="Create Promotional Coupon">
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
              <Input
                type="text"
                placeholder="e.g. FESTIVE20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Flat Amount (INR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Value *</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Order Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Cap (₹, optional)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid From *</label>
                <Input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until *</label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Global Usage Quota</label>
              <Input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Creating...' : 'Activate Coupon'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

