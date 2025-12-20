
import React, { useState } from 'react';
import { User, Project, PaymentRequest, PaymentStatus } from '../types';
import { generatePaymentId, detectRisk, checkCutoff, formatCurrency } from '../utils';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';

interface BackendProps {
  user: User;
  projects: Project[];
  requests: PaymentRequest[];
  onSubmitRequest: (req: PaymentRequest) => void;
}

const BackendDashboard: React.FC<BackendProps> = ({ user, projects, requests, onSubmitRequest }) => {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<'Project' | 'Non-Project'>('Project');
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'UPI'>('Bank Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    const fd = new FormData(e.currentTarget);
    
    // Account/UPI matching validation
    if (paymentMode === 'Bank Transfer') {
      if (fd.get('accountNumber') !== fd.get('accountNumberConfirm')) {
        setError("Account Number mismatch.");
        setIsSubmitting(false);
        return;
      }
    } else {
      if (fd.get('upiId') !== fd.get('upiIdConfirm')) {
        setError("UPI ID mismatch.");
        setIsSubmitting(false);
        return;
      }
    }

    const vendorName = fd.get('vendorName') as string;
    const amount = Number(fd.get('amount'));
    const billNumber = fd.get('billNumber') as string;
    const paymentDeadlineStr = fd.get('paymentDeadline') as string;
    const paymentDeadline = new Date(paymentDeadlineStr);
    const now = new Date();

    const cutoffStatus = checkCutoff(now, paymentDeadline);
    const riskDetection = detectRisk({ vendorName, amount, billNumber }, requests, cutoffStatus === 'MISSED');

    const newReq: PaymentRequest = {
      id: generatePaymentId(),
      raisedBy: fd.get('reqName') as string,
      raisedByRole: fd.get('reqRole') as string,
      raisedByDepartment: fd.get('reqDept') as string,
      timestamp: now.toISOString(),
      paymentDeadline: paymentDeadline.toISOString(),
      category: category,
      purpose: fd.get('purpose') as string,
      projectId: category === 'Project' ? (fd.get('projectId') as string) : undefined,
      workOrderNumber: category === 'Project' ? (fd.get('workOrderNumber') as string) : undefined,
      vendorName,
      paymentMode,
      accountNumber: fd.get('accountNumber') as string,
      ifsc: fd.get('ifsc') as string,
      upiId: fd.get('upiId') as string,
      billNumber,
      billDate: fd.get('billDate') as string,
      amount,
      paymentType: fd.get('paymentType') as any,
      driveLinkBills: fd.get('driveLinkBills') as string,
      driveLinkWorkProof: fd.get('driveLinkWorkProof') as string,
      cutoffStatus,
      risk: riskDetection.risk,
      status: riskDetection.status
    };

    try {
      await onSubmitRequest(newReq);
      setShowForm(false);
    } catch (e) {
      setError("Cloud sync failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const myRequests = requests.filter(r => r.raisedByRole && r.raisedBy); 

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Backend Submission Desk</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Terminal Active: {user.name}</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 shadow-xl transition-all"
          >
            + Raise Payment
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-widest">New Compliance Submission</h4>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-black uppercase text-[10px]">Discard Draft</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Requester Accountability */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">01. Responsibility Profile</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Requester Name</label>
                    <input name="reqName" defaultValue={user.name} required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all uppercase" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Requester Role</label>
                    <input name="reqRole" defaultValue="Backend" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all uppercase" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Requester Department</label>
                    <input name="reqDept" required placeholder="E.G. CIVIL" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all uppercase" />
                  </div>
                  <textarea name="purpose" placeholder="PURPOSE OF PAYMENT" required rows={2} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none placeholder:text-slate-300 uppercase" />
                </div>
              </div>

              {/* Destination & Amount */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">02. Execution Timing & Vendor</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Payment Cut-Off (Target Completion)</label>
                    <input name="paymentDeadline" type="datetime-local" required className="w-full bg-slate-900 text-white p-3 rounded-xl text-sm font-black outline-none" />
                  </div>
                  <input name="vendorName" placeholder="VENDOR NAME" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-black outline-none uppercase" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="amount" type="number" placeholder="AMOUNT (₹)" required min="1" className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-black outline-none" />
                    <select name="paymentType" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black outline-none uppercase">
                      <option value="Advance">Advance</option>
                      <option value="Partial">Partial</option>
                      <option value="Final">Final</option>
                      <option value="Full">Full Payment</option>
                    </select>
                  </div>
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none">
                    <option value="Bank Transfer">BANK TRANSFER</option>
                    <option value="UPI">UPI / G-PAY</option>
                  </select>
                  {paymentMode === 'Bank Transfer' ? (
                    <>
                      <input name="accountNumber" placeholder="ACC NUMBER" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-mono outline-none" />
                      <input name="accountNumberConfirm" placeholder="CONFIRM ACC NUMBER" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-mono outline-none" />
                      <input name="ifsc" placeholder="IFSC CODE" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-mono outline-none uppercase" />
                    </>
                  ) : (
                    <>
                      <input name="upiId" placeholder="UPI ID / MOBILE" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-mono outline-none" />
                      <input name="upiIdConfirm" placeholder="CONFIRM UPI ID" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-mono outline-none" />
                    </>
                  )}
                </div>
              </div>

              {/* Compliance & Projects */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">03. Project & Proofs</h4>
                <div className="space-y-4">
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none">
                    <option value="Project">PROJECT-BASED</option>
                    <option value="Non-Project">GENERAL OVERHEAD</option>
                  </select>
                  {category === 'Project' && (
                    <>
                      <select name="projectId" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none">
                        <option value="">SELECT PROJECT</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input name="workOrderNumber" placeholder="WORK ORDER #" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-black outline-none uppercase" />
                    </>
                  )}
                  <input name="billNumber" placeholder="BILL NUMBER" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none uppercase" />
                  <input name="billDate" type="date" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none" />
                  <input name="driveLinkBills" type="url" placeholder="GOOGLE DRIVE: INVOICE LINK" required className="w-full bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs outline-none" />
                  <input name="driveLinkWorkProof" type="url" placeholder="GOOGLE DRIVE: WORK PHOTO LINK" required className="w-full bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs outline-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 disabled:opacity-50 transition-all">
                {isSubmitting ? 'SECURELY RECORDING...' : 'FINALIZE SUBMISSION'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request Log */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Global Status Sync</h4>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Requester | Purpose</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Lifecycle</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Commitment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-8 py-6">
                  <div className="text-[9px] font-bold text-slate-400 mb-1">
                    {req.raisedBy} | {req.raisedByRole} | {req.raisedByDepartment}
                  </div>
                  <div className="font-black text-xs text-slate-800 uppercase leading-tight">{req.purpose}</div>
                  <div className="text-[10px] text-slate-500 uppercase mt-1">Ref: {req.id}</div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <StatusBadge status={req.status} />
                    <RiskBadge risk={req.risk} />
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-black text-slate-900 text-base">{formatCurrency(req.amount)}</span>
                    {req.status === PaymentStatus.PAID && req.screenshotLink && (
                      <a href={req.screenshotLink} target="_blank" className="text-[9px] font-black text-blue-600 uppercase underline">View Settlement Proof</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Database Initialized (Empty)</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BackendDashboard;
