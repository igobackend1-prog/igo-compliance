
import React, { useState } from 'react';
import { PaymentRequest, PaymentStatus, Project } from '../types';
import { RiskBadge } from '../components/StatusBadge';
import { formatCurrency } from '../utils';

interface CEOProps {
  requests: PaymentRequest[];
  projects: Project[];
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
}

const CEODashboard: React.FC<CEOProps> = ({ requests, projects, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');

  const pending = requests.filter(r => r.status === PaymentStatus.NEW || r.status === PaymentStatus.SIMILAR_EXISTS);
  const settled = requests.filter(r => r.status === PaymentStatus.PAID);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Approval Queue</p>
          <p className="text-4xl font-black text-slate-900">{pending.length}</p>
        </div>
        <div className="bg-emerald-50 p-8 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Settled Funds</p>
          <p className="text-4xl font-black text-emerald-700">{settled.length}</p>
        </div>
        <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Total Disbursement</p>
          <p className="text-2xl font-black text-blue-700">{formatCurrency(settled.reduce((s, r) => s + r.amount, 0))}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-10">
        <button onClick={() => setActiveTab('pending')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'pending' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'}`}>Approvals</button>
        <button onClick={() => setActiveTab('settled')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'settled' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'}`}>Settled Ledger</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payee Details</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Risk Factor</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount / Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(activeTab === 'pending' ? pending : settled).map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="text-[10px] font-bold text-slate-400 font-mono mb-1">{req.id}</div>
                  <div className="font-black text-sm text-slate-800 uppercase">{req.vendorName}</div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{req.purpose}</div>
                </td>
                <td className="px-8 py-6 flex justify-center items-center h-full pt-8">
                  <RiskBadge risk={req.risk} />
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-black text-slate-900 text-lg">{formatCurrency(req.amount)}</span>
                    {activeTab === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => onUpdateStatus(req.id, PaymentStatus.APPROVED)} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Approve</button>
                        <button onClick={() => onUpdateStatus(req.id, PaymentStatus.HOLD)} className="border border-slate-200 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Hold</button>
                      </div>
                    ) : (
                      req.screenshot && (
                        <a href={req.screenshot} download={`PROOF_${req.id}.png`} className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 border border-blue-100">Download Proof</a>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(activeTab === 'pending' ? pending : settled).length === 0 && (
              <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">No matching records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEODashboard;
