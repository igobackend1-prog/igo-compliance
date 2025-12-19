
import React, { useState } from 'react';
import { PaymentRequest, PaymentStatus, RiskLevel, Project } from '../types';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';
import { formatCurrency } from '../utils';

interface CEOProps {
  requests: PaymentRequest[];
  projects: Project[];
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
}

const CEODashboard: React.FC<CEOProps> = ({ requests, projects, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'projects' | 'settled'>('approvals');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const pending = requests.filter(r => r.status === PaymentStatus.NEW || r.status === PaymentStatus.SIMILAR_EXISTS);
  const settled = requests.filter(r => r.status === PaymentStatus.PAID);
  const approvedToday = requests.filter(r => r.status === PaymentStatus.APPROVED && new Date(r.timestamp).toDateString() === new Date().toDateString()).length;
  
  const calculateSpent = (projectId: string) => {
    return requests
      .filter(r => r.projectId === projectId && r.status === PaymentStatus.PAID)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Queue Size</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black text-slate-900">{pending.length}</p>
            {pending.length > 0 && <span className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>}
          </div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase mb-2">Total Settled</p>
          <p className="text-3xl font-black text-emerald-700">{settled.length}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase mb-2">Approved Today</p>
          <p className="text-3xl font-black text-blue-700">{approvedToday}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-8">
        <button onClick={() => setActiveTab('approvals')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'approvals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>APPROVAL QUEUE</button>
        <button onClick={() => setActiveTab('settled')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'settled' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>SETTLED LEDGER</button>
        <button onClick={() => setActiveTab('projects')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'projects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>PROJECT MASTER</button>
      </div>

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vendor & Purpose</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Risk Analysis</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-slate-900">{req.vendorName}</div>
                    <div className="text-xs text-slate-500">{req.purpose}</div>
                  </td>
                  <td className="px-6 py-4"><RiskBadge risk={req.risk} /></td>
                  <td className="px-6 py-4 font-black text-slate-900">{formatCurrency(req.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onUpdateStatus(req.id, PaymentStatus.APPROVED)} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold uppercase">Approve</button>
                      <button onClick={() => onUpdateStatus(req.id, PaymentStatus.HOLD)} className="border border-slate-200 px-4 py-1.5 rounded text-xs font-bold uppercase">Hold</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settled' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reference</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Payee</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">UTR Number</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settled.map(req => (
                <tr key={req.id}>
                  <td className="px-6 py-4 font-mono text-xs">{req.id}</td>
                  <td className="px-6 py-4 font-bold text-sm uppercase">{req.vendorName}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 font-mono text-xs font-bold">{req.utr}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-slate-900">{formatCurrency(req.amount)}</span>
                      {req.screenshot && (
                        <a href={req.screenshot} download={`PROOF_${req.id}.png`} className="text-[10px] text-blue-600 font-bold uppercase hover:underline">Download Proof</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Project Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Budget</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Utilization</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map(p => {
                const spent = calculateSpent(p.id);
                const percent = (spent / p.budget) * 100;
                return (
                  <tr key={p.id}>
                    <td className="px-6 py-4 font-black text-slate-800 uppercase">{p.name}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(p.budget)}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{percent.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-blue-600 uppercase">Active</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CEODashboard;
