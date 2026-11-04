import React, { useState, useEffect } from 'react';
import { Tag, PlusCircle, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { providerApi, catalogApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProviderServicesPage: React.FC = () => {
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [masterServices, setMasterServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    service_id: 1,
    custom_price: 499,
    duration_min: 60,
    description: 'Delivered with genuine spares and 30-day warranty.',
    is_available: true,
  });

  const fetchData = async () => {
    try {
      const res = await providerApi.getServices();
      setProviderServices(res.data);
      const allRes = await catalogApi.getServices();
      setMasterServices(allRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await providerApi.upsertService(formData);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update service');
    }
  };

  const handleDelete = async (serviceId: number) => {
    if (!confirm('Remove this service from your active portfolio?')) return;
    try {
      await providerApi.deleteService(serviceId);
      fetchData();
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Service Portfolio & Pricing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure custom pricing and duration for services you fulfill.
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Add Service Offering
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading portfolio..." />
      ) : providerServices.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed">
          No services configured in your portfolio yet. Click "Add Service Offering" above.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providerServices.map((ps) => (
            <Card key={ps.id} className="p-6 border-slate-200 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase">
                    {ps.category_name}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">Active</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{ps.service_name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{ps.description}</p>
                <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                  Estimated Duration: <strong>{ps.duration_min} mins</strong>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Your Price</span>
                  <span className="text-xl font-black text-slate-900">₹{ps.custom_price}</span>
                </div>
                <button
                  onClick={() => handleDelete(ps.service_id)}
                  className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add or Edit Service Offering">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Master Service</label>
            <select
              value={formData.service_id}
              onChange={(e) => setFormData({ ...formData, service_id: Number(e.target.value) })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {masterServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Base: ₹{s.base_price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Your Custom Rate (INR)"
              type="number"
              min={1}
              required
              value={formData.custom_price}
              onChange={(e) => setFormData({ ...formData, custom_price: Number(e.target.value) })}
            />
            <Input
              label="Estimated Duration (Mins)"
              type="number"
              min={15}
              required
              value={formData.duration_min}
              onChange={(e) => setFormData({ ...formData, duration_min: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Warranty / Inclusions Remark"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Button type="submit" size="md" className="w-full">
            Save Service to Catalog
          </Button>
        </form>
      </Modal>
    </div>
  );
};

