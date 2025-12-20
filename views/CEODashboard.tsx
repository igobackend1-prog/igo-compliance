
import React, { useState, useMemo } from 'react';
import { PaymentRequest, PaymentStatus, Project, RiskLevel } from '../types';
import { RiskBadge, StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../utils';

interface CEOProps {
  requests: PaymentRequest[];
  projects: Project[];
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
}

const CEODashboard: React.FC<CEOProps> = ({ requests, projects, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'settled' | 'projects'>('pending');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const pending = useMemo(() => requests.filter(r => 
    r.status === PaymentStatus.NEW || 
    r.status === PaymentStatus.SIMILAR_EXISTS || 
    r.status === PaymentStatus.REQUEST_CUT_OFF_MISSED ||
    r.status === PaymentStatus.HOLD
  ), [requests]);

  const approved = useMemo(() => requests.filter(r => r.status === PaymentStatus.APPROVED), [requests]);
  
  const settled = useMemo(() => requests.filter(r => r.status === PaymentStatus.PAID), [requests]);

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const projectAnalytics = useMemo(() => {
    if (!selectedProject) return null;
    const projectRequests = requests.filter(r => r.projectId === selectedProject.id);
    const spent = projectRequests.filter(r => r.status === PaymentStatus.PAID).reduce((s, r) => s + r.amount, 0);
    const approvedVal = projectRequests.filter(r => r.status === PaymentStatus.APPROVED).reduce((s, r) => s + r.amount, 0);
    const remaining = selectedProject.budget - spent;
    const utilization = (spent / selectedProject.budget) * 100;
    return { requests: projectRequests, spent, approved: approvedVal, remaining, utilization };
  }, [selectedProject, requests]);

  const renderProjectGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
      {projects.map(project => {
        const spent = requests.filter(r => r.projectId === project.id && r.status === PaymentStatus.PAID).reduce((s, r) => s + r.amount, 0);
        const util = (spent / project.budget) * 100;
        return (
          <button key={project.id} onClick={() => { setSelectedProjectId(project.id); setActiveTab('projects'); }} className="text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.id}</span>
            <h4 className="font-black text-slate-900 uppercase leading-tight mt-1">{project.name}</h4>
            <div className="mt-6 space-y-4">
               <div className="flex justify-between items-end">
                 <p className="text-[10px] font-bold text-slate-500 uppercase">Utilization</p>
                 <p className="text-xs font-black text-slate-900">{util.toFixed(1)}%</p>
               </div>
               <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div className={`h-full ${util > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(util, 100)}%` }}></div>
               </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const getFilteredList = () => {
    switch (activeTab) {
      case 'pending': return pending;
      case 'approved': return approved;
      case 'settled': return settled;
      default: return [];
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* High-Level Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Queue Authority</p>
            <p className="text-4xl font-black">{pending.length}</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Approved Waiting</p>
          <p className="text-3xl font-black text-blue-600">{approved.length} Requests</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Project List</p>
          <p className="text-3xl font-black text-slate-900">{projects.length} Entries</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-10">
        {['pending', 'approved', 'settled', 'projects'].map(t => (
          <button 
            key={t}
            onClick={() => { setActiveTab(t as any); setSelectedProjectId(null); }}
            className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'projects' ? (
        selectedProjectId ? (
          <div className="space-y-6">
             <button onClick={() => setSelectedProjectId(null)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">← Back to List</button>
             <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl">
               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">{selectedProject?.name}</h3>
               <div className="grid grid-cols-4 gap-6">
                 <div className="p-6 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Total Budget</p>
                    <p className="text-xl font-black">{formatCurrency(selectedProject?.budget || 0)}</p>
                 </div>
                 <div className="p-6 bg-emerald-50 rounded-2xl">
                    <p className="text-[9px] font-black text-emerald-400 uppercase">Paid Out</p>
                    <p className="text-xl font-black text-emerald-600">{formatCurrency(projectAnalytics?.spent || 0)}</p>
                 </div>
                 <div className="p-6 bg-blue-50 rounded-2xl">
                    <p className="text-[9px] font-black text-blue-400 uppercase">Approved</p>
                    <p className="text-xl font-black text-blue-600">{formatCurrency(projectAnalytics?.approved || 0)}</p>
                 </div>
                 <div className="p-6 bg-slate-900 rounded-2xl text-white">
                    <p className="text-[9px] font-black text-white/40 uppercase">Balance</p>
                    <p className="text-xl font-black">{formatCurrency(projectAnalytics?.remaining || 0)}</p>
                 </div>
               </div>
             </div>
          </div>
        ) : renderProjectGrid()
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Requester / Purpose</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status / Risk</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Commitment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {getFilteredList().map(req => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Requester: {req.raisedBy} | {req.raisedByRole} | {req.raisedByDepartment}
                      </span>
                    </div>
                    <div className="font-black text-lg text-slate-900 uppercase leading-tight tracking-tight mb-2 underline decoration-blue-200 underline-offset-4">{req.purpose}</div>
                    <div className="flex gap-4 items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Vendor: {req.vendorName}</span>
                      <a href={req.driveLinkBills} target="_blank" className="text-[9px] font-black text-blue-600 uppercase underline">View Invoice</a>
                      <a href={req.driveLinkWorkProof} target="_blank" className="text-[9px] font-black text-blue-600 uppercase underline">View Work Proof</a>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <StatusBadge status={req.status} />
                       <RiskBadge risk={req.risk} />
                       {req.status === PaymentStatus.REQUEST_CUT_OFF_MISSED && (
                         <div className="mt-2 px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded-full animate-pulse shadow-lg">Emergency Case</div>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="flex flex-col items-end gap-3">
                      <span className="font-black text-slate-900 text-2xl tracking-tighter">{formatCurrency(req.amount)}</span>
                      {activeTab === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onUpdateStatus(req.id, PaymentStatus.APPROVED)} 
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                          >
                            Approve
                          </button>
                          <button onClick={() => onUpdateStatus(req.id, PaymentStatus.HOLD)} className="border border-slate-200 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 hover:text-amber-700 transition-all">Hold</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {getFilteredList().length === 0 && (
                <tr><td colSpan={3} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-[0.5em]">Global Zero State</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CEODashboard;
