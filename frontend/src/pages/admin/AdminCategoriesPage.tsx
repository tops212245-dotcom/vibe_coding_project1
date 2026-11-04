import React, { useState, useEffect } from 'react';
import {
  Briefcase, Plus, FolderPlus, Tag, CheckCircle2, AlertCircle,
  Layers, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { ServiceCategory, ServiceSubcategory } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Wrench');

  // New Subcategory modal
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<ServiceCategory | null>(null);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDesc, setSubDesc] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories?include_inactive=true');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      await api.post('/categories', {
        name: catName.trim(),
        slug: catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: catDesc.trim(),
        icon: catIcon.trim() || 'Wrench',
        sort_order: categories.length + 1,
      });
      setShowCategoryModal(false);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      await fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForSub) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      await api.post('/categories/subcategories', {
        category_id: selectedCategoryForSub.id,
        name: subName.trim(),
        slug: subSlug.trim() || subName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: subDesc.trim(),
      });
      setSelectedCategoryForSub(null);
      setSubName('');
      setSubSlug('');
      setSubDesc('');
      await fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create subcategory.');
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
            <Layers className="w-3.5 h-3.5" /> Marketplace Taxonomy
          </div>
          <h2 className="text-2xl font-black tracking-tight">Master Categories & Services</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Configure platform taxonomy. Providers attach their service offerings and pricing to these verified parent categories.
          </p>
        </div>
        <Button onClick={() => setShowCategoryModal(true)} size="md" className="bg-brand-600 hover:bg-brand-500 text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Add Master Category
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading marketplace service catalog structure..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-6 border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">/{cat.slug}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedCategoryForSub(cat);
                    setErrorMsg(null);
                  }}
                >
                  <FolderPlus className="w-3.5 h-3.5 mr-1 text-slate-500" /> + Subcategory
                </Button>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-600">{cat.description}</p>
              )}

              {/* Subcategories list */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Subcategories ({cat.subcategories?.length || 0})
                </span>
                {(!cat.subcategories || cat.subcategories.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No subcategories yet. Click + Subcategory above.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                      >
                        <Tag className="w-3 h-3 mr-1.5 text-brand-600" />
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Category Modal */}
      {showCategoryModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCategoryModal(false)}
          title="Create New Service Category"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
              <Input
                type="text"
                placeholder="e.g. Smart Home & Automation"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug *</label>
              <Input
                type="text"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Brief description of the service domain..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Subcategory Modal */}
      {selectedCategoryForSub && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCategoryForSub(null)}
          title={`Add Subcategory to: ${selectedCategoryForSub.name}`}
        >
          <form onSubmit={handleCreateSubcategory} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subcategory Name *</label>
              <Input
                type="text"
                placeholder="e.g. CCTV Camera Installation"
                value={subName}
                onChange={(e) => {
                  setSubName(e.target.value);
                  setSubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug *</label>
              <Input
                type="text"
                value={subSlug}
                onChange={(e) => setSubSlug(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Specific job scope..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCategoryForSub(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Adding...' : 'Add Subcategory'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

