
import { PaymentRequest, RiskLevel, PaymentStatus } from './types';
import { CUT_OFF_HOUR } from './constants';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const checkCutoff = (date: Date): 'WITHIN' | 'MISSED' => {
  const hour = date.getHours();
  return hour < CUT_OFF_HOUR ? 'WITHIN' : 'MISSED';
};

export const detectRisk = (
  newRequest: Partial<PaymentRequest>,
  existingRequests: PaymentRequest[]
): { risk: RiskLevel; status: PaymentStatus } => {
  // Check exact duplicate (same vendor + same bill number)
  const exactDuplicate = existingRequests.find(
    (r) => r.vendorName === newRequest.vendorName && r.billNumber === newRequest.billNumber
  );

  if (exactDuplicate) {
    return { risk: RiskLevel.HIGH, status: PaymentStatus.SIMILAR_EXISTS };
  }

  // Check similar (same vendor + same amount within 30 days)
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

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
