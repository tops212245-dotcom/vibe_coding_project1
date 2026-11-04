import React, { useState, useEffect } from 'react';
import {
  Users, Search, Shield, UserCheck, UserX, AlertCircle,
  Filter, CheckCircle, RefreshCw, Activity
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface UserRecord {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  is_verified: boolean;
  created_at: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (selectedRole) params.role = selectedRole;
      const res = await adminApi.getUsers(params);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user: UserRecord) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change ${user.name}'s status to ${newStatus}?`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      await adminApi.updateUserStatus(user.id, newStatus);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Identity & Access Governance
          </div>
          <h2 className="text-2xl font-black tracking-tight">Platform User Accounts</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Directory of all registered customers, verified providers, field technicians, and system administrators.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              type="text"
              placeholder="Search by full name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="PROVIDER">Service Providers</option>
              <option value="TECHNICIAN">Technicians</option>
              <option value="ADMIN">Super Admins</option>
            </select>

            <Button type="submit" size="sm">
              <Search className="w-4 h-4 mr-1.5" /> Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Searching registered user accounts..." />
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 border-dashed">
          No user accounts matched your search criteria.
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered On</th>
                  <th className="p-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isBusy = actionLoading === u.id;
                  const isSuspended = u.status === 'SUSPENDED';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-400">#{u.id}</td>
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'PROVIDER'
                            ? 'bg-blue-100 text-blue-700'
                            : u.role === 'TECHNICIAN'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge status={u.status} />
                      </td>
                      <td className="p-4 text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <Button
                            variant={isSuspended ? 'secondary' : 'danger'}
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 mr-1" /> Reactivate
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5 mr-1" /> Suspend
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

