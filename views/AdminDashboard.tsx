
import React, { useState } from 'react';
import { Project, PaymentRequest, AuditLog, PaymentStatus, ProjectPhase as PhaseEnum } from '../types';
import { formatCurrency } from '../utils';

interface AdminProps {
  projects: Project[];
  vendors: any[]; // Kept for compatibility, but ignored
  requests: PaymentRequest[];
  logs: AuditLog[];
  onUpdateProjects: (projects: Project[]) => void;
  onUpdateVendors: (vendors: any[]) => void;
  onUpdateRequest: (req: PaymentRequest) => void;
  onDeleteRequest: (id: string) => void;
}

const AdminDashboard: React.FC<AdminProps> = ({ projects, requests, logs, onUpdateProjects, onDeleteRequest }) => {
  const [tab, setTab] = useState<'Audit' | 'Ledger' | 'Projects'>('Audit');
  const [showProjectForm, setShowProjectForm] = useState(false);

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newP: Project = {
      id: `PRJ-${Date.now().toString().slice(-4)}`,
      name: fd.get('name') as string,
      clientDetails: fd.get('client') as string,
      location: fd.get('location') as string,
      inCharge: fd.get('inCharge') as string,
      budget: Number(fd.get('budget')),
      phase: fd.get('phase') as any,
      currentWork: '',
      nextWork: '',
      status: 'Active'
    };
    onUpdateProjects([...projects, newP]);
    setShowProjectForm(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Admin – CEO Office</h3>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        {(['Audit', 'Ledger', 'Projects'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={`px-8 py-5 text-[10px] font-black transition-all border-b-4 uppercase tracking-widest ${tab === t ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Ledger' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payee / Ref</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lifecycle</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Commitment / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-6">
                    <div className="font-black text-xs uppercase text-slate-900">{req.purpose}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{req.vendorName} | Ref: {req.id}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${req.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-black text-slate-900 text-sm">{formatCurrency(req.amount)}</span>
                      <button onClick={() => { if(confirm('Delete this record permanently?')) onDeleteRequest(req.id) }} className="text-red-600 text-[10px] font-black uppercase hover:underline">Erase Record</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Projects' && (
        <div className="space-y-6">
           <div className="flex justify-end">
              <button onClick={() => setShowProjectForm(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Create Deployment</button>
           </div>
           
           {showProjectForm && (
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl animate-in zoom-in-95">
                <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <input name="name" placeholder="PROJECT NAME" required className="p-3 bg-slate-50 border rounded-xl text-sm font-bold uppercase" />
                   <input name="client" placeholder="CLIENT DETAILS" required className="p-3 bg-slate-50 border rounded-xl text-sm font-bold uppercase" />
                   <input name="location" placeholder="LOCATION" required className="p-3 bg-slate-50 border rounded-xl text-sm font-bold uppercase" />
                   <input name="inCharge" placeholder="PERSON IN CHARGE" required className="p-3 bg-slate-50 border rounded-xl text-sm font-bold uppercase" />
                   <input name="budget" type="number" placeholder="TOTAL BUDGET" required className="p-3 bg-slate-50 border rounded-xl text-sm font-bold uppercase" />
                   <select name="phase" required className="p-3 bg-slate-50 border rounded-xl text-sm font-bold uppercase">
                      {Object.values(PhaseEnum).map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                   <div className="col-span-full flex gap-4">
                      <button type="submit" className="bg-red-600 text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Execute Deployment</button>
                      <button type="button" onClick={() => setShowProjectForm(false)} className="bg-slate-100 text-slate-600 px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                   </div>
                </form>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                   <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">{p.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-6">{p.location} | {p.id}</p>
                   <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase">Allocation</p>
                         <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(p.budget)}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase">{p.phase}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {tab === 'Audit' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timeline</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Accountability</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-8 py-6 font-mono text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="font-black text-xs text-slate-800 uppercase">{log.user}</div>
                    <div className="text-[9px] text-red-600 font-black uppercase">{log.role} {log.department && `| ${log.department}`}</div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-700 uppercase tracking-tight">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
