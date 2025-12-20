
import React, { useState } from 'react';
import { PaymentRequest, PaymentStatus } from '../types';
import { formatCurrency } from '../utils';

interface AccountsProps {
  requests: PaymentRequest[];
  onMarkPaid: (id: string, utr: string, screenshotLink: string) => void;
}

const AccountsDashboard: React.FC<AccountsProps> = ({ requests, onMarkPaid }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [activePayment, setActivePayment] = useState<PaymentRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pending = requests.filter(r => r.status === PaymentStatus.APPROVED);
  const history = requests.filter(r => r.status === PaymentStatus.PAID);

  const handleMarkPaid = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activePayment) return;
    setIsSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const utr = fd.get('utr') as string;
    const screenshotLink = fd.get('screenshotLink') as string;

    try {
      onMarkPaid(activePayment.id, utr, screenshotLink);
      setActivePayment(null);
    } catch (err) {
      alert('Error recording settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Accounts Execution Desk</h3>
           <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Operational (Ready for Settlement)</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'pending' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Approvals ({pending.length})</button>
           <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>History ({history.length})</button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference / Destination</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Mode</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Commitment / Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(activeTab === 'pending' ? pending : history).map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-8 py-6">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{req.id}</div>
                  <div className="font-black text-sm text-slate-800 uppercase leading-none mb-1">{req.vendorName}</div>
                  <div className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">
                    {req.accountNumber || req.upiId} {req.ifsc && `| ${req.ifsc}`}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase">{req.paymentMode}</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-black text-slate-900 text-lg">{formatCurrency(req.amount)}</span>
                    {activeTab === 'pending' ? (
                      <button 
                        onClick={() => setActivePayment(req)} 
                        className={`bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg`}
                      >
                        Execute Payment
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">UTR: {req.utr}</span>
                        {req.screenshotLink && (
                          <a href={req.screenshotLink} target="_blank" className="text-[9px] font-black text-blue-600 uppercase underline">Proof Document</a>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(activeTab === 'pending' ? pending : history).length === 0 && (
              <tr><td colSpan={3} className="px-8 py-24 text-center text-slate-300 font-black uppercase tracking-widest">Queue Status: Settled</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {activePayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden p-10 border border-slate-200 animate-in zoom-in-95 duration-300">
            <h4 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Mark as Settled</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Target: {activePayment.vendorName} | {formatCurrency(activePayment.amount)}</p>
            
            <form onSubmit={handleMarkPaid} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">UTR Reference (Mandatory)</label>
                <input name="utr" required placeholder="REFERENCE NUMBER" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-mono outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Google Drive Proof Link (Mandatory)</label>
                <input name="screenshotLink" type="url" required placeholder="HTTPS://DRIVE.GOOGLE.COM/..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setActivePayment(null)} className="flex-1 py-4 text-[10px] font-black border border-slate-200 rounded-2xl uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 text-[10px] font-black text-white bg-slate-900 rounded-2xl uppercase tracking-widest hover:bg-emerald-600 transition-all">
                  {isSubmitting ? 'Recording...' : 'Certify Execution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsDashboard;
