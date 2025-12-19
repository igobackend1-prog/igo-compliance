
import React, { useState } from 'react';
import { User, Project, Vendor, PaymentRequest, PaymentStatus } from '../types';
import { generatePaymentId, detectRisk, checkCutoff, formatCurrency } from '../utils';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';

interface BackendProps {
  user: User;
  projects: Project[];
  vendors: Vendor[];
  requests: PaymentRequest[];
  onSubmitRequest: (req: PaymentRequest) => void;
}

const BackendDashboard: React.FC<BackendProps> = ({ user, projects, vendors, requests, onSubmitRequest }) => {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [category, setCategory] = useState<'Project' | 'Non-Project'>('Project');
  const [bankMismatch, setBankMismatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const fd = new FormData(e.currentTarget);
    const acc1 = fd.get('accountNumber') as string;
    const acc2 = fd.get('accountNumberConfirm') as string;

    if (fd.get('paymentMode') === 'Bank Transfer' && acc1 !== acc2) {
      setBankMismatch(true);
      setIsSubmitting(false);
      return;
    }

    const vendorName = fd.get('vendorName') as string;
    const amount = Number(fd.get('amount'));
    const billNumber = fd.get('billNumber') as string;
    const billDate = fd.get('billDate') as string;

    const riskDetection = detectRisk({ vendorName, amount, billNumber }, requests);

    const newReq: PaymentRequest = {
      id: generatePaymentId(),
      raisedBy: user.name,
      timestamp: new Date().toISOString(),
      category: category,
      purpose: fd.get('purpose') as string,
      projectId: category === 'Project' ? (fd.get('projectId') as string) : undefined,
      vendorName,
      vendorType: fd.get('vendorType') as string,
      billNumber,
      billDate: billDate,
      amount,
      paymentType: fd.get('paymentType') as any,
      paymentMode: fd.get('paymentMode') as any,
      accountNumber: acc1,
      ifsc: fd.get('ifsc') as string,
      upiId: fd.get('upiId') as string,
      cutoffStatus: checkCutoff(new Date()),
      risk: riskDetection.risk,
      status: riskDetection.status
    };

    try {
      await onSubmitRequest(newReq);
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const myRequests = requests.filter(r => r.raisedBy === user.name);
  const filteredRequests = myRequests.filter(r => {
    if (activeTab === 'pending') return r.status !== PaymentStatus.PAID;
    if (activeTab === 'completed') return r.status === PaymentStatus.PAID;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Operational Desk</h3>
          <p className="text-xs text-slate-500 font-medium">Internal control for organizational disbursements.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all ${showForm ? 'bg-slate-200 text-slate-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {showForm ? 'Cancel' : '+ New Payment Request'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xl max-w-4xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Form fields same as previous but kept clean for submission */}
             <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Classification</h4>
                <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none">
                  <option value="Project">Project-Based</option>
                  <option value="Non-Project">General Overhead</option>
                </select>
                <input name="vendorName" placeholder="Vendor Name" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none uppercase font-bold" />
                <textarea name="purpose" placeholder="Purpose of Payment" required rows={2} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none" />
             </div>
             <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Financials</h4>
                <input name="amount" type="number" placeholder="Amount (INR)" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm font-black outline-none" />
                <input name="billDate" type="date" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none" />
                <input name="accountNumber" placeholder="Account Number / UPI ID" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none" />
                <input name="accountNumberConfirm" placeholder="Confirm Account Number" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none" />
                <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-xs disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Submit Request'}
                </button>
             </div>
          </form>
        </div>
      )}

      <div className="flex border-b border-slate-200 gap-6">
        {(['all', 'pending', 'completed'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t} Requests</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Vendor</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center">Risk</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Amount / Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <div className="font-bold text-xs uppercase text-slate-800">{req.vendorName}</div>
                  <div className="text-[10px] text-slate-500 italic">{req.purpose}</div>
                </td>
                <td className="px-6 py-4 text-center"><RiskBadge risk={req.risk} /></td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                  <div className="flex flex-col items-end gap-1">
                    {formatCurrency(req.amount)}
                    {req.status === PaymentStatus.PAID && req.screenshot && (
                      <a href={req.screenshot} download={`PROOF_${req.id}.png`} className="text-[9px] text-blue-600 font-bold uppercase underline">Download Proof</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BackendDashboard;
