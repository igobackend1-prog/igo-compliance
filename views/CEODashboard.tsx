
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
  const [activeTab, setActiveTab] = useState<'approvals' | 'projects'>('approvals');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const pending = requests.filter(r => r.status === PaymentStatus.NEW || r.status === PaymentStatus.SIMILAR_EXISTS);
  const approvedToday = requests.filter(r => r.status === PaymentStatus.APPROVED && new Date(r.timestamp).toDateString() === new Date().toDateString()).length;
  const highRiskCount = pending.filter(r => r.risk === RiskLevel.HIGH).length;
  const missedCutoffCount = pending.filter(r => r.cutoffStatus === 'MISSED').length;

  const calculateSpent = (projectId: string) => {
    return requests
      .filter(r => r.projectId === projectId && r.status === PaymentStatus.PAID)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const calculateExposure = (projectId: string) => {
    return requests
      .filter(r => r.projectId === projectId && (r.status === PaymentStatus.APPROVED || r.status === PaymentStatus.NEW || r.status === PaymentStatus.SIMILAR_EXISTS))
      .reduce((sum, r) => sum + r.amount, 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Pending Decision</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black text-slate-900">{pending.length}</p>
            {pending.length > 0 && <span className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>}
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
          <p className="text-xs font-bold text-red-500 uppercase mb-2">High Risk Flagged</p>
          <p className="text-3xl font-black text-red-700">{highRiskCount}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm">
          <p className="text-xs font-bold text-orange-500 uppercase mb-2">Missed Cut-offs</p>
          <p className="text-3xl font-black text-orange-700">{missedCutoffCount}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase mb-2">Approved Today</p>
          <p className="text-3xl font-black text-emerald-700">{approvedToday}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-8">
        <button onClick={() => setActiveTab('approvals')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'approvals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>APPROVAL QUEUE</button>
        <button onClick={() => setActiveTab('projects')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'projects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>PROJECT MASTER</button>
      </div>

      {activeTab === 'approvals' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Review Required</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">All decisions are permanent and logged</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reference</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vendor & Purpose</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Risk Analysis</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">Clear! No pending tasks for review.</td></tr>
                ) : (
                  pending.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-slate-900">{req.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(req.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-blue-800 uppercase">{req.vendorName}</div>
                        <div className="text-xs bg-yellow-100 text-yellow-900 p-2 rounded-md font-bold leading-tight border border-yellow-200 mt-1">{req.purpose}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <RiskBadge risk={req.risk} />
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${req.cutoffStatus === 'WITHIN' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{req.cutoffStatus} CUTOFF</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-black text-slate-900">{formatCurrency(req.amount)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{req.paymentType}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col gap-2 items-end">
                          <button onClick={() => onUpdateStatus(req.id, PaymentStatus.APPROVED)} className="px-5 py-2 rounded-lg text-xs font-bold uppercase bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20">Approve</button>
                          <button onClick={() => onUpdateStatus(req.id, PaymentStatus.HOLD)} className="px-5 py-2 rounded-lg text-xs font-bold uppercase border border-slate-200 hover:bg-slate-50 text-slate-600">Hold</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Project Financial Ledger</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Project Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Budget</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Settled</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Utilization</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map(p => {
                    const spent = calculateSpent(p.id);
                    const percent = (spent / p.budget) * 100;
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-black text-blue-800 uppercase">{p.name}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{p.location} | {p.inCharge}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-sm text-slate-600">{formatCurrency(p.budget)}</td>
                          <td className="px-6 py-4 font-bold text-sm text-emerald-600">{formatCurrency(spent)}</td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-red-600' : percent > 60 ? 'bg-orange-400' : 'bg-blue-600'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                            </div>
                            <span className="text-[9px] font-black uppercase text-slate-400 mt-1 block">Paid: {percent.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setExpandedProjectId(expandedProjectId === p.id ? null : p.id)} className="text-xs font-black text-blue-600 uppercase border-2 border-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                              {expandedProjectId === p.id ? 'Close' : 'View'}
                            </button>
                          </td>
                        </tr>
                        {expandedProjectId === p.id && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={5} className="px-8 py-6">
                              <div className="bg-white rounded-xl border-2 border-blue-100 shadow-lg overflow-hidden">
                                <div className="p-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest">Transaction History: {p.name}</div>
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                      <th className="p-4 uppercase font-bold text-slate-500">Ref ID</th>
                                      <th className="p-4 uppercase font-bold text-slate-500">Vendor</th>
                                      <th className="p-4 uppercase font-bold text-slate-500">Purpose</th>
                                      <th className="p-4 uppercase font-bold text-slate-500">Status</th>
                                      <th className="p-4 uppercase font-bold text-slate-500 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {requests.filter(r => r.projectId === p.id).length === 0 ? (
                                      <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No transactions found.</td></tr>
                                    ) : (
                                      requests.filter(r => r.projectId === p.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(tr => (
                                        <tr key={tr.id} className={`${tr.status === PaymentStatus.PAID ? 'bg-emerald-50/20' : ''}`}>
                                          <td className="p-4 font-mono font-bold text-slate-500">{tr.id}</td>
                                          <td className="p-4 uppercase font-bold text-slate-800">{tr.vendorName}</td>
                                          <td className="p-4 text-slate-600 italic">{tr.purpose}</td>
                                          <td className="p-4"><StatusBadge status={tr.status} /></td>
                                          <td className="p-4 text-right font-black text-slate-900">{formatCurrency(tr.amount)}</td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEODashboard;
