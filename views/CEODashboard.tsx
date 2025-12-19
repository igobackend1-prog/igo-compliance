
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
  const approvedTodayCount = requests.filter(r => r.status === PaymentStatus.APPROVED && new Date(r.timestamp).toDateString() === new Date().toDateString()).length;
  const highRiskCount = pending.filter(r => r.risk === RiskLevel.HIGH).length;
  const missedCutoffCount = pending.filter(r => r.cutoffStatus === 'MISSED').length;

  const calculateSpent = (projectId: string) => {
    return requests
      .filter(r => r.projectId === projectId && r.status === PaymentStatus.PAID)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Pending Approvals</p>
          <p className="text-3xl font-extrabold text-slate-900">{pending.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-red-500 uppercase mb-2">High Risk Flagged</p>
          <p className="text-3xl font-extrabold text-red-700">{highRiskCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-orange-500 uppercase mb-2">Missed Cut-off</p>
          <p className="text-3xl font-extrabold text-orange-700">{missedCutoffCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-blue-500 uppercase mb-2">Approved Today</p>
          <p className="text-3xl font-extrabold text-blue-700">{approvedTodayCount}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'approvals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          DECISION QUEUE ({pending.length})
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'projects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          PROJECT FINANCIALS & MASTER
        </button>
      </div>

      {activeTab === 'approvals' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-800">Pending Decision Queue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project / Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor & Purpose</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk / Cutoff</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No pending requests in queue.</td></tr>
                ) : (
                  pending.map(req => {
                    const project = projects.find(p => p.id === req.projectId);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-slate-800">{req.id}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{new Date(req.timestamp).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          {req.category === 'Project' ? (
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-blue-700">{project?.name || req.projectId}</div>
                              <div className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded inline-block font-bold">PHASE: {req.projectPhase}</div>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-slate-400 uppercase italic">Non-Project Vertical</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-slate-800 uppercase">{req.vendorName}</div>
                            <div className="text-xs bg-yellow-100 text-yellow-900 p-2 rounded-md font-bold leading-tight border border-yellow-200 group-hover:bg-yellow-200 transition-colors">
                              PURPOSE: {req.purpose}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <RiskBadge risk={req.risk} />
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${req.cutoffStatus === 'WITHIN' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              {req.cutoffStatus} CUTOFF
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-black text-slate-900">{formatCurrency(req.amount)}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.paymentType}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col gap-2 items-end">
                            <button 
                              disabled={req.cutoffStatus === 'MISSED'}
                              onClick={() => onUpdateStatus(req.id, PaymentStatus.APPROVED)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${req.cutoffStatus === 'MISSED' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => onUpdateStatus(req.id, PaymentStatus.HOLD)}
                              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-50 transition-all text-slate-600"
                            >
                              Hold
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <h3 className="text-lg font-bold text-slate-800">Real-time Budget Tracking</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project ID & Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Budget</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Paid (Spent)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Utilization</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map(p => {
                    const spent = calculateSpent(p.id);
                    const remaining = p.budget - spent;
                    const percent = Math.min((spent / p.budget) * 100, 100);
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-sm">{p.id}</div>
                            <div className="text-sm font-semibold text-blue-600">{p.name}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{p.location}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-sm text-slate-600">{formatCurrency(p.budget)}</td>
                          <td className="px-6 py-4 font-bold text-sm text-emerald-600">{formatCurrency(spent)}</td>
                          <td className="px-6 py-4 font-bold text-sm text-slate-900">{formatCurrency(remaining)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden min-w-[100px]">
                                <div className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-red-600' : percent > 60 ? 'bg-orange-400' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-500">{percent.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setExpandedProjectId(expandedProjectId === p.id ? null : p.id)}
                              className="text-xs font-black text-blue-600 uppercase border border-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                            >
                              {expandedProjectId === p.id ? 'Hide History' : 'View All'}
                            </button>
                          </td>
                        </tr>
                        {expandedProjectId === p.id && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={6} className="px-8 py-6">
                              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase text-slate-500 tracking-widest">Complete Transaction History: {p.name}</div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="border-b border-slate-50">
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Ref ID</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Vendor</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Purpose</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase text-right">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {requests.filter(r => r.projectId === p.id).length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic text-xs">No transactions recorded for this project.</td></tr>
                                      ) : (
                                        requests.filter(r => r.projectId === p.id).map(tr => (
                                          <tr key={tr.id} className="text-xs">
                                            <td className="p-4 font-mono font-bold text-slate-500">{tr.id}</td>
                                            <td className="p-4 uppercase font-bold text-slate-700">{tr.vendorName}</td>
                                            <td className="p-4 italic text-slate-600">{tr.purpose}</td>
                                            <td className="p-4"><StatusBadge status={tr.status} /></td>
                                            <td className="p-4 text-right font-black text-slate-900">{formatCurrency(tr.amount)}</td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
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
