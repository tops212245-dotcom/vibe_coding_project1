import React, { useState, useEffect } from 'react';
import { MapPin, PlusCircle, Trash2 } from 'lucide-react';
import { customerApi } from '../../services/api';
import { Address } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerAddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({
    title: 'Home',
    address_line1: '',
    address_line2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400050',
    is_default: false,
  });

  const fetchAddresses = async () => {
    try {
      const res = await customerApi.getAddresses();
      setAddresses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerApi.createAddress(newAddr);
      setModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save address');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await customerApi.deleteAddress(id);
      fetchAddresses();
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved Addresses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage multiple service addresses for fast 1-click booking.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Add New Address
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading address book..." />
      ) : addresses.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed">
          No addresses saved yet. Click "Add New Address" above.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <Card key={a.id} className="p-6 border-slate-200 flex justify-between items-start">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{a.title}</span>
                  {a.is_default && (
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-full">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-slate-600">{a.address_line1}</p>
                {a.address_line2 && <p className="text-slate-500">{a.address_line2}</p>}
                <p className="text-slate-500 font-medium">
                  {a.city}, {a.state} - {a.postal_code}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Address">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Address Title"
            required
            value={newAddr.title}
            onChange={(e) => setNewAddr({ ...newAddr, title: e.target.value })}
            placeholder="Home, Office, Holiday Home"
          />
          <Input
            label="Street Address / Building"
            required
            value={newAddr.address_line1}
            onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
            placeholder="Flat 101, Sunflower Apts"
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
            Save to Address Book
          </Button>
        </form>
      </Modal>
    </div>
  );
};

