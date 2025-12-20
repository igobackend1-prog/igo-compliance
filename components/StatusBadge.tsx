
import React from 'react';
import { PaymentStatus, RiskLevel } from '../types';

export const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  // Define styles for all possible payment statuses to ensure the record is exhaustive
  const styles: Record<PaymentStatus, string> = {
    [PaymentStatus.NEW]: 'bg-blue-100 text-blue-700 border-blue-200',
    [PaymentStatus.SIMILAR_EXISTS]: 'bg-purple-100 text-purple-700 border-purple-200',
    [PaymentStatus.APPROVED]: 'bg-green-100 text-green-700 border-green-200',
    [PaymentStatus.HOLD]: 'bg-slate-100 text-slate-700 border-slate-200',
    [PaymentStatus.PAID]: 'bg-emerald-600 text-white border-emerald-700',
    [PaymentStatus.REQUEST_CUT_OFF_MISSED]: 'bg-red-100 text-red-700 border-red-200',
    [PaymentStatus.PAYMENT_CUT_OFF_MISSED]: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border tracking-wider ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => {
  // Define indicator colors based on risk level
  const styles: Record<RiskLevel, string> = {
    [RiskLevel.LOW]: 'bg-green-500',
    [RiskLevel.MEDIUM]: 'bg-orange-500',
    [RiskLevel.HIGH]: 'bg-red-600',
  };

  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${styles[risk]}`}></span>
      <span className="text-xs font-semibold">{risk}</span>
    </span>
  );
};
