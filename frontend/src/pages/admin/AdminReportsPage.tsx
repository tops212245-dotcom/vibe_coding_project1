import React, { useState } from 'react';
import {
  FileText, Download, Calendar, DollarSign, Table, CheckCircle2,
  FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadCsv = async (reportType: 'bookings' | 'revenue') => {
    try {
      setDownloading(reportType);
      const res = await api.get(`/analytics/reports/csv?report_type=${reportType}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `homeserve_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download CSV export. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Data Exports & Audits
          </div>
          <h2 className="text-2xl font-black tracking-tight">Financial & Operational Reports</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Generate and export real-time CSV spreadsheets for tax audits, vendor payout reconciliations, and executive reviews.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Bookings & Appointments Ledger</h3>
          <p className="text-xs text-slate-600">
            Complete transaction log of every appointment: Booking Reference, Scheduled Date & Time, Customer Name, Provider Business, Service Item, Current Status, and Total Amount (INR).
          </p>
          <div className="pt-2">
            <Button
              onClick={() => handleDownloadCsv('bookings')}
              disabled={downloading === 'bookings'}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading === 'bookings' ? 'Exporting CSV...' : 'Download Bookings CSV'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Revenue & Commission Reconciliation</h3>
          <p className="text-xs text-slate-600">
            Accounting ledger containing Gross Merchandise Value (GMV), HomeServe 10% platform commission retained, Net provider payout liabilities, and payout settlement indicators.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => handleDownloadCsv('revenue')}
              disabled={downloading === 'revenue'}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading === 'revenue' ? 'Exporting CSV...' : 'Download Revenue CSV'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

