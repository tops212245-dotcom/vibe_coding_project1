import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, Shield, Star, CheckCircle2, ArrowLeft, Award, User,
  Calendar, Wrench, AlertCircle
} from 'lucide-react';
import { catalogApi } from '../../services/api';
import { ProviderSummary } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ service: any; providers: ProviderSummary[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        const res = await catalogApi.getServiceDetails(Number(id));
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading service details..." />;
  if (!data) return <div className="text-center py-20 text-slate-500">Service not found.</div>;

  const { service, providers } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Link to="/services" className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Services
      </Link>

      {/* Main Service Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              {service.category_name} &bull; {service.subcategory_name}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              {service.name}
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              {service.description || 'Professional home service delivered by certified, background-verified professionals.'}
            </p>
          </div>

          {/* Inclusions */}
          <Card className="p-6 border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Package Details & Warranty</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>30-Day Re-service Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Background Verified Technicians</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Standardized Tools & Equipment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Transparent Invoicing with GST</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Pricing / Booking Summary Card */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase">Base Rate</span>
              <span className="text-2xl font-black text-slate-900">₹{service.base_price}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> Approx. Duration</span>
              <span className="font-semibold">{service.estimated_duration_min} minutes</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-brand-600" /> Vetting</span>
              <Badge status="APPROVED" variant="success">Certified Partners</Badge>
            </div>
            <p className="text-xs text-slate-500 italic">
              Select a verified provider below to pick your date, time slot, and confirm appointment.
            </p>
          </Card>
        </div>
      </div>

      {/* Verified Providers Section */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div>
          <h2 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Available Partners</h2>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            Verified Service Providers for this Service ({providers.length})
          </h3>
        </div>

        {providers.length === 0 ? (
          <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            No approved providers currently offer this exact service. Please check back shortly or explore alternative categories.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((p) => (
              <Card key={p.provider_id} hoverEffect className="p-6 flex flex-col justify-between border-slate-200 hover:border-brand-400">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{p.business_name}</h4>
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{p.average_rating > 0 ? p.average_rating.toFixed(1) : '5.0'}</span>
                        <span className="text-slate-400">({p.total_reviews} reviews)</span>
                      </div>
                    </div>
                    <Badge status="APPROVED" variant="success">Verified</Badge>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {p.bio || `${p.experience_years} years experienced team delivering guaranteed quality.`}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-2">
                    <span><strong>{p.experience_years}</strong> yrs exp</span>
                    <span>&bull;</span>
                    <span><strong>{p.duration_min}</strong> mins duration</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Service Fee</span>
                    <span className="text-lg font-black text-slate-900">₹{p.custom_price}</span>
                  </div>
                  <Link to={`/customer/book?service_id=${service.id}&provider_id=${p.provider_id}`}>
                    <Button size="sm">
                      Select & Schedule
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

