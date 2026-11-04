import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { providerApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ProviderWorkingHoursPage: React.FC = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await providerApi.getWorkingHours();
        if (res.data && res.data.length > 0) {
          setSchedule(res.data);
        } else {
          // Defaults: Mon-Sat 09:00 - 18:00, Sun closed
          const defaults = DAYS.map((_, i) => ({
            day_of_week: i,
            start_time: '09:00',
            end_time: '18:00',
            is_closed: i === 6,
          }));
          setSchedule(defaults);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHours();
  }, []);

  const handleToggleClosed = (index: number) => {
    const updated = [...schedule];
    updated[index].is_closed = !updated[index].is_closed;
    setSchedule(updated);
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', val: string) => {
    const updated = [...schedule];
    updated[index][field] = val;
    setSchedule(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await providerApi.setWorkingHours(schedule);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading operating hours..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operating Schedule & Slots</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure active hours. Customers can only book slots within your verified schedule.
          </p>
        </div>
        <Button size="md" isLoading={saving} onClick={handleSave}>
          Save Operating Schedule
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Weekly schedule updated successfully!</span>
        </div>
      )}

      <Card className="p-6 border-slate-200 divide-y divide-slate-100">
        {schedule.map((item, idx) => (
          <div key={item.day_of_week} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-32">
              <span className="font-bold text-sm text-slate-900">{DAYS[item.day_of_week]}</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!item.is_closed}
                  onChange={() => handleToggleClosed(idx)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>{item.is_closed ? 'Closed' : 'Open'}</span>
              </label>

              {!item.is_closed && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={item.start_time}
                    onChange={(e) => handleTimeChange(idx, 'start_time', e.target.value)}
                    className="text-xs rounded-xl border border-slate-300 p-2 font-medium"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="time"
                    value={item.end_time}
                    onChange={(e) => handleTimeChange(idx, 'end_time', e.target.value)}
                    className="text-xs rounded-xl border border-slate-300 p-2 font-medium"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

