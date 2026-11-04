import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Clock, ArrowRight, Wrench } from 'lucide-react';
import { catalogApi } from '../../services/api';
import { Service, ServiceCategory } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const ServicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await catalogApi.getCategories();
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (search) params.search = search;
        if (selectedCategory) {
          const matched = categories.find((c) => c.slug === selectedCategory);
          if (matched) params.category_id = matched.id;
        }
        const res = await catalogApi.getServices(params);
        setServices(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [search, selectedCategory, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse Home Services</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Certified technicians for installations, repairs, maintenance, and deep cleaning.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by keyword..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === ''
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Services
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.slug
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <LoadingSpinner message="Loading verified services..." />
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8" />}
          title="No services found"
          description="Try adjusting your search keywords or selecting a different service category."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <Card key={srv.id} hoverEffect className="flex flex-col justify-between p-6 border-slate-200 hover:border-brand-400">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
                    Verified Package
                  </span>
                  <div className="flex items-center text-xs text-slate-500 gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{srv.estimated_duration_min} mins</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {srv.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {srv.description || 'Delivered by background-verified licensed technicians with full warranty.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Starting at</span>
                  <span className="text-xl font-black text-slate-900">₹{srv.base_price}</span>
                </div>
                <Link to={`/services/${srv.id}`}>
                  <Button size="sm">
                    Book Now &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

