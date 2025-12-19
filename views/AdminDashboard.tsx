
import React, { useState } from 'react';
import { Project, Vendor, PaymentRequest, AuditLog, ProjectPhase, PaymentStatus } from '../types';
import { formatCurrency } from '../utils';

interface AdminProps {
  projects: Project[];
  vendors: Vendor[];
  requests: PaymentRequest[];
  logs: AuditLog[];
  onUpdateProjects: (projects: Project[]) => void;
  onUpdateVendors: (vendors: Vendor[]) => void;
  onUpdateRequest: (req: PaymentRequest) => void;
  onDeleteRequest: (id: string) => void;
}

const AdminDashboard: React.FC<AdminProps> = ({ projects, vendors, requests, logs, onUpdateProjects, onUpdateVendors }) => {
  const [tab, setTab] = useState<'Projects' | 'Vendors' | 'Audit' | 'Ledger'>('Audit');

  return (
    <div className="space-y-8">
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {(['Audit', 'Ledger', 'Projects', 'Vendors'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${tab === t ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'Ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Master Payment Ledger</h3>
            <p className="text-xs text-slate-500">Global view of all transactions and compliance proofs.</p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Payee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Amount / Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4 font-mono text-[10px]">{req.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-xs uppercase">{req.vendorName}</div>
                    <div className="text-[10px] text-slate-400">{req.purpose}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${req.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-slate-900 text-xs">{formatCurrency(req.amount)}</span>
                      {req.screenshot && (
                        <a href={req.screenshot} download={`PROOF_${req.id}.png`} className="text-[9px] text-blue-600 font-bold uppercase underline">Download Proof</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">System Activity Logs</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No activity recorded.</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="text-sm hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{log.user}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{log.role}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{log.action}</td>
                  <td className="px-6 py-4 font-mono text-[10px] font-bold text-red-600 uppercase">{log.paymentId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects and Vendors tabs logic remains same as original but included for full file integrity */}
      {tab === 'Projects' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50/50">
               <tr>
                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name & Location</th>
                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Budget</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {projects.map(p => (
                 <tr key={p.id}>
                   <td className="px-6 py-4 font-bold text-sm">{p.id}</td>
                   <td className="px-6 py-4 font-bold text-xs uppercase">{p.name} - {p.location}</td>
                   <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(p.budget)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {tab === 'Vendors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50/50">
               <tr>
                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vendor ID</th>
                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name & Type</th>
                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {vendors.map(v => (
                 <tr key={v.id}>
                   <td className="px-6 py-4 font-bold text-sm">{v.id}</td>
                   <td className="px-6 py-4 font-bold text-xs uppercase">{v.name} ({v.type})</td>
                   <td className="px-6 py-4 text-right">
                     <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase">Active</span>
                   </td>
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
