
import React, { useState } from 'react';
import { User, Project, Vendor, PaymentRequest, PaymentStatus, RiskLevel } from '../types';
import { generatePaymentId, detectRisk, checkCutoff, formatCurrency, fileToBase64 } from '../utils';
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const acc1 = fd.get('accountNumber') as string;
    const acc2 = fd.get('accountNumberConfirm') as string;

    if (fd.get('paymentMode') === 'Bank Transfer' && acc1 !== acc2) {
      setBankMismatch(true);
      return;
    }
    setBankMismatch(false);

    const vendorName = fd.get('vendorName') as string;
    const amount = Number(fd.get('amount'));
    const billNumber = fd.get('billNumber') as string;

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
      billDate: fd.get('billDate') as string,
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

    onSubmitRequest(newReq);
    setShowForm(false);
  };

  const myRequests = requests.filter(r => r.raisedBy === user.name);
  const filteredRequests = myRequests.filter(r => {
    if (activeTab === 'pending') return r.status !== PaymentStatus.PAID;
    if (activeTab === 'completed') return r.status === PaymentStatus.PAID;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Operational Records</h3>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Perpetual history of all payment lifecycles.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
        >
          {showForm ? 'Cancel' : '+ Raise New Request'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-xl border-2 border-green-100 shadow-xl max-w-4xl animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Basic Identification</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Project">Project-Based</option>
                    <option value="Non-Project">Other Vertical</option>
                  </select>
                </div>
                {category === 'Project' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Linked Project</label>
                    <select name="projectId" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purpose of Payment (MANDATORY)</label>
                <input name="purpose" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="E.g., Second installment for site earthwork" />
              </div>

              {category === 'Project' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Project Phase</label>
                  <select name="projectPhase" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Planning">Planning</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Near Completion">Near Completion</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}

              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 mt-8">Billing & Vendor</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vendor Name</label>
                  <input name="vendorName" list="vendors" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  <datalist id="vendors">
                    {vendors.map(v => <option key={v.id} value={v.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vendor Type</label>
                  <select name="vendorType" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Company">Company</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bill Number</label>
                  <input name="billNumber" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bill Date</label>
                  <input name="billDate" type="date" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Payment Instruction</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount (INR)</label>
                  <input name="amount" type="number" min="1" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Type</label>
                  <select name="paymentType" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Advance">Advance</option>
                    <option value="Partial">Partial</option>
                    <option value="Final">Final</option>
                    <option value="Full">Full Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transfer Mode</label>
                <select name="paymentMode" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500">
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI (ID/Mobile)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account / UPI ID</label>
                    <input name="accountNumber" required className="w-full bg-white border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-green-500" placeholder="Primary Input" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Re-enter for Validation</label>
                    <input name="accountNumberConfirm" required className="w-full bg-white border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-green-500" placeholder="Double Check" />
                    {bankMismatch && <p className="text-[10px] text-red-600 font-bold mt-1 uppercase">Warning: Values do not match!</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IFSC (Only for Bank Transfer)</label>
                    <input name="ifsc" className="w-full bg-white border border-slate-200 p-2.5 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-green-500" placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest text-sm shadow-xl shadow-slate-400/20">
                  Generate Compliance Request
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tabs for Records */}
      <div className="flex border-b border-slate-200 gap-6">
        <button onClick={() => setActiveTab('all')} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'all' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>All Records</button>
        <button onClick={() => setActiveTab('pending')} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'pending' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Active / Pipeline</button>
        <button onClick={() => setActiveTab('completed')} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'completed' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Completed (PAID)</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Request ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vendor & Purpose</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Risk</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Proof of Closure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No submissions found in this category.</td>
              </tr>
            )}
            {filteredRequests.map(req => (
              <tr key={req.id} className={`transition-colors ${req.status === PaymentStatus.PAID ? 'bg-emerald-50/10' : 'hover:bg-slate-50/50'}`}>
                <td className="px-6 py-4">
                  <div className="font-bold text-sm text-slate-800">{req.id}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{new Date(req.timestamp).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold uppercase text-slate-700 tracking-tight">{req.vendorName}</div>
                  <div className="text-xs text-slate-500 truncate max-w-xs italic">{req.purpose}</div>
                  {req.category === 'Project' && (
                    <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1 uppercase border border-blue-100">{projects.find(p=>p.id === req.projectId)?.name || 'N/A'}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center"><RiskBadge risk={req.risk} /></div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-6 py-4 font-black text-slate-900">
                  {formatCurrency(req.amount)}
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === PaymentStatus.PAID ? (
                    <div className="space-y-1.5 flex flex-col items-end">
                      <div className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">UTR: {req.utr}</div>
                      {req.screenshot && (
                        <a 
                          href={req.screenshot} 
                          download={`IGO-PAID-${req.id}.png`}
                          className="flex items-center gap-1 text-[9px] text-blue-600 font-black hover:text-blue-800 uppercase tracking-tighter"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          Download Proof
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Awaiting Action</span>
                  )}
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
