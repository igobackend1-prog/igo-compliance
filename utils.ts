
import { PaymentRequest, RiskLevel, PaymentStatus } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const checkCutoff = (submissionDate: Date, deadlineDate: Date): 'WITHIN' | 'MISSED' => {
  return submissionDate > deadlineDate ? 'MISSED' : 'WITHIN';
};

export const detectRisk = (
  newRequest: Partial<PaymentRequest>,
  existingRequests: PaymentRequest[],
  isCutoffMissed: boolean
): { risk: RiskLevel; status: PaymentStatus } => {
  // Check exact duplicate (Already Paid / High Risk)
  const exactDuplicate = existingRequests.find(
    (r) => r.vendorName === newRequest.vendorName && 
           r.billNumber === newRequest.billNumber && 
           r.billNumber !== '' && 
           r.status === PaymentStatus.PAID
  );

  if (exactDuplicate) {
    return { risk: RiskLevel.HIGH, status: PaymentStatus.SIMILAR_EXISTS };
  }

  if (isCutoffMissed) {
    return { risk: RiskLevel.HIGH, status: PaymentStatus.REQUEST_CUT_OFF_MISSED };
  }

  // Check similar (Med Risk)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const similarExists = existingRequests.find((r) => {
    const rDate = new Date(r.timestamp);
    return (
      r.vendorName === newRequest.vendorName &&
      r.amount === newRequest.amount &&
      rDate >= thirtyDaysAgo
    );
  });

  if (similarExists) {
    return { risk: RiskLevel.MEDIUM, status: PaymentStatus.SIMILAR_EXISTS };
  }

  return { risk: RiskLevel.LOW, status: PaymentStatus.NEW };
};

export const generatePaymentId = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `IGO-PAY-${num}`;
};
