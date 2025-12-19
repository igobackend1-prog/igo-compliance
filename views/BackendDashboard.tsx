
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
    setBankMismatch(false);

    const vendorName = fd.get('vendorName') as string;
    const amount = Number(fd.get('amount'));
    const billNumber = fd.get('billNumber') as string;
    const billDate = fd.get('billDate') as string;

    // Critical Fix: Improved validation for date
    if (!billDate) {
      alert("Bill Date is mandatory. Please select a valid date.");
      setIsSubmitting(false);
      return;
    }

    const riskDetection = detectRisk({ vendorName, amount, billNumber }, requests);

    const newReq: PaymentRequest = {
      id: generatePaymentId(),
      raisedBy: user.name,
      timestamp: new Date().toISOString(),
      category: category,
      purpose: fd.get('purpose') as string,
      projectId: category === 'Project' ? (fd.get('projectId') as string) : undefined,
      projectPhase: category === 'Project' ? (fd.get('projectPhase') as string) : undefined,
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
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Compliance Desk</h3>
          <p className="text-xs text-slate-500 font-medium">Standardized payment request lifecycle management.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20'}`}
        >
          {showForm ? 'Cancel Request' : '+ Generate Payment Request'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-xl border-2 border-green-50 shadow-2xl max-w-4xl animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Record Mapping</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vertical</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Project">Project Assets</option>
                    <option value="Non-Project">Overhead/General</option>
                  </select>
                </div>
                {category === 'Project' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Project</label>
                    <select name="projectId" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">-- Active Projects --</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purpose Description</label>
                <textarea name="purpose" required rows={2} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="Breakdown of work/service provided..." />
              </div>

              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mt-8">Vendor & Invoice</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payee Name</label>
                  <input name="vendorName" list="vendors-list" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500 uppercase font-bold" />
                  <datalist id="vendors-list">{vendors.map(v => <option key={v.id} value={v.name} />)}</datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payee Type</label>
                  <select name="vendorType" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Company">Pvt Ltd / LLP</option>
                    <option value="Contractor">Labor Contractor</option>
                    <option value="Individual">Personal Payment</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Invoice / Bill No.</label>
                  <input name="billNumber" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Invoice Date (Issue Date)</label>
                  {/* Fixed Issue #2: Native Date Picker */}
                  <input name="billDate" type="date" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Financial Allocation</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount (Gross INR)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Slab</label>
                  <select name="paymentType" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Advance">Initial Advance</option>
                    <option value="Partial">Stage Completion</option>
                    <option value="Final">Retention Release</option>
                    <option value="Full">One-time Settlement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transmission Mode</label>
                <select name="paymentMode" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                  <option value="Bank Transfer">Bank Transfer (RTGS/NEFT)</option>
                  <option value="UPI">UPI Transfer</option>
                </select>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Primary Account / UPI ID</label>
                    <input name="accountNumber" required className="w-full bg-white border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirmation Input</label>
                    <input name="accountNumberConfirm" required className="w-full bg-white border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-green-500" />
                    {bankMismatch && <p className="text-[10px] text-red-600 font-black mt-1">ERROR: ACCOUNT NUMBER MISMATCH</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank IFSC Code</label>
                    <input name="ifsc" className="w-full bg-white border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-green-500 uppercase" placeholder="ABCD0123456" />
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest text-xs shadow-xl shadow-slate-400/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting to Cloud...' : 'Commit Compliance Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex border-b border-slate-200 gap-6">
        {(['all', 'pending', 'completed'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t} Workflow</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Asset ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Transaction Data</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center">Risk Index</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Process Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 group transition-all">
                <td className="px-6 py-4 font-bold text-xs text-slate-800 font-mono">{req.id}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-xs uppercase text-slate-800 tracking-tight">{req.vendorName}</div>
                  <div className="text-[10px] text-slate-500 italic line-clamp-1">{req.purpose}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <RiskBadge risk={req.risk} />
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${req.cutoffStatus === 'WITHIN' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}>{req.cutoffStatus} WINDOW</span>
                  </div>
                </td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(req.amount)}</td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No matching records found in cloud database</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BackendDashboard;
