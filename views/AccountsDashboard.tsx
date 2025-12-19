
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
    <div className="space-y-8">
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
        <>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl">
            <h3 className="text-amber-800 font-black uppercase text-sm tracking-widest mb-1">Execution Pipeline</h3>
            <p className="text-amber-700 text-sm font-medium">Approved requests waiting for financial settlement. UTR and proof mandatory.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Payment Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Destination (Bank/UPI)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No approved payments pending execution.</td>
                  </tr>
                )}
                {pending.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-slate-800">{req.id}</div>
                      <div className="text-xs text-slate-600 font-bold uppercase">{req.vendorName}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{req.purpose}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 font-mono text-xs">
                        <p className="font-bold text-slate-700">{req.paymentMode}</p>
                        <p className="mt-1">{req.accountNumber || req.upiId}</p>
                        {req.ifsc && <p className="text-slate-400">IFSC: {req.ifsc}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-black text-slate-900">{formatCurrency(req.amount)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setActivePayment(req)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 shadow-md shadow-slate-300"
                      >
                        Execute Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reference</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Paid To</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">UTR Number</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No historical records found.</td>
                </tr>
              )}
              {history.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{req.id}</div>
                    <div className="text-[10px] text-slate-400">{new Date(req.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold uppercase">{req.vendorName}</div>
                    <div className="text-[10px] text-slate-500">{req.purpose}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded inline-block border border-emerald-100">
                      {req.utr}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black">
                    {formatCurrency(req.amount)}
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
            <h4 className="text-xl font-bold text-slate-900 mb-6">Payment Confirmation: {activePayment.id}</h4>
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Vendor</span>
                <span className="text-sm font-bold text-slate-800">{activePayment.vendorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Amount</span>
                <span className="text-lg font-black text-slate-900">{formatCurrency(activePayment.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleMarkPaid} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transaction ID / UTR Number</label>
                <input 
                  name="utr" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="E.g., 234512009876"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Screenshot (Proof)</label>
                <input 
                  type="file" 
                  name="screenshot" 
                  accept="image/*" 
                  required 
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setActivePayment(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSubmitting}
                  type="submit" 
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Submit Proof'}
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
