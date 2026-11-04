import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogApi } from '../../services/api';
import { ServiceCategory } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowLeft, Clock, Wrench } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return;
      try {
        const res = await catalogApi.getCategoryBySlug(slug);
        setCategory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [slug]);

  if (loading) return <LoadingSpinner message="Loading category details..." />;
  if (!category) return <div className="text-center py-20 text-slate-500">Category not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link to="/services" className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Services Catalog
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{category.name}</h1>
        <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">{category.description}</p>
      </div>

      <div className="space-y-10">
        {category.subcategories?.map((sub) => (
          <div key={sub.id} className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900">{sub.name}</h2>
              {sub.description && <p className="text-xs text-slate-500 mt-0.5">{sub.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 border-slate-200 hover:border-brand-400">
                <h3 className="font-bold text-slate-900">{sub.name} Package</h3>
                <p className="text-xs text-slate-500 mt-1">Available through verified local technicians.</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Standard Rates</span>
                  <Link to={`/services?category=${category.slug}`}>
                    <Button size="sm">Explore Packages</Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

