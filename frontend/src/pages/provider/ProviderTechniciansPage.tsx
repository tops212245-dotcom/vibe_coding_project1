import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, Star, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { providerApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProviderTechniciansPage: React.FC = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [techData, setTechData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'Master Electrician',
  });

  const fetchTechs = async () => {
    try {
      const res = await providerApi.getTechnicians();
      setTechnicians(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await providerApi.createTechnician(techData);
      setModalOpen(false);
      setTechData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        specialization: 'Master Electrician',
      });
      fetchTechs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to onboard technician');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Technician Fleet Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add field personnel, assign jobs, and review performance ratings.
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Onboard Technician
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading technician fleet..." />
      ) : technicians.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed">
          No technicians enrolled yet. Onboard your first technician above.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((t) => (
            <Card key={t.id} className="p-6 border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base">
                    {t.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{t.rating || '5.0'}</span>
                      <span className="text-slate-400">({t.total_jobs} completed jobs)</span>
                    </div>
                  </div>
                </div>
                <Badge status={t.is_available ? 'ACTIVE' : 'INACTIVE'}>
                  {t.is_available ? 'Active' : 'Offline'}
                </Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-600" /> {t.specialization || 'General Field Specialist'}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5" /> {t.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="w-3.5 h-3.5" /> {t.email}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Onboard New Technician">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={techData.first_name}
              onChange={(e) => setTechData({ ...techData, first_name: e.target.value })}
              placeholder="Amit"
            />
            <Input
              label="Last Name"
              required
              value={techData.last_name}
              onChange={(e) => setTechData({ ...techData, last_name: e.target.value })}
              placeholder="Verma"
            />
          </div>
          <Input
            label="Technician Email"
            type="email"
            required
            value={techData.email}
            onChange={(e) => setTechData({ ...techData, email: e.target.value })}
            placeholder="amit.tech@example.com"
          />
          <Input
            label="Mobile Phone"
            type="tel"
            required
            value={techData.phone}
            onChange={(e) => setTechData({ ...techData, phone: e.target.value })}
            placeholder="+91 98222 33344"
          />
          <Input
            label="Specialization / Trade"
            required
            value={techData.specialization}
            onChange={(e) => setTechData({ ...techData, specialization: e.target.value })}
            placeholder="e.g. Certified Electrician & AC Mechanic"
          />
          <Input
            label="Login Password"
            type="password"
            required
            value={techData.password}
            onChange={(e) => setTechData({ ...techData, password: e.target.value })}
            placeholder="••••••••"
          />
          <Button type="submit" size="md" className="w-full">
            Create Technician Credentials
          </Button>
        </form>
      </Modal>
    </div>
  );
};

