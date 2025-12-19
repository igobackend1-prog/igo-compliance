
import React, { useState } from 'react';
import { PaymentRequest, PaymentStatus } from '../types';
import { formatCurrency, fileToBase64 } from '../utils';

interface AccountsProps {
  requests: PaymentRequest[];
  onMarkPaid: (id: string, utr: string, screenshot: string) => void;
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
    const file = fd.get('screenshot') as File;

    try {
      const base64 = await fileToBase64(file);
      onMarkPaid(activePayment.id, utr, base64);
      setActivePayment(null);
    } catch (err) {
      alert('Error processing file upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'pending' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500'}`}
        >
          PENDING EXECUTION ({pending.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500'}`}
        >
          PAYMENT HISTORY ({history.length})
        </button>
      </div>

      {activeTab === 'pending' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Payment Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Destination</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Amount / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map(req => (
                <tr key={req.id}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-slate-800">{req.id}</div>
                    <div className="text-xs text-slate-600 font-bold uppercase">{req.vendorName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-mono bg-slate-50 p-2 rounded border border-slate-100">
                      {req.paymentMode}: {req.accountNumber || req.upiId}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-black text-slate-900">{formatCurrency(req.amount)}</span>
                      <button onClick={() => setActivePayment(req)} className="bg-slate-900 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase">Execute</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reference</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Paid To</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Amount / Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map(req => (
                <tr key={req.id}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{req.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">UTR: {req.utr}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold uppercase">{req.vendorName}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-slate-900">{formatCurrency(req.amount)}</span>
                      {req.screenshot && (
                        <a href={req.screenshot} download={`PROOF_${req.id}.png`} className="text-[9px] text-blue-600 font-bold uppercase underline">View Screenshot</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activePayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-8 border border-slate-200">
            <h4 className="text-xl font-bold text-slate-900 mb-6">Confirm Settlement</h4>
            <form onSubmit={handleMarkPaid} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">UTR Number</label>
                <input name="utr" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proof of Payment</label>
                <input type="file" name="screenshot" accept="image/*" required className="w-full text-xs text-slate-500" />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setActivePayment(null)} className="flex-1 py-3 text-sm font-bold border rounded-lg uppercase">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg uppercase">Submit Proof</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsDashboard;
