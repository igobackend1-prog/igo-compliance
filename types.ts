
export enum Role {
  ADMIN = 'ADMIN',
  CEO = 'CEO',
  BACKEND = 'BACKEND',
  ACCOUNTS = 'ACCOUNTS'
}

export enum PaymentStatus {
  NEW = 'NEW',
  SIMILAR_EXISTS = 'SIMILAR_EXISTS',
  APPROVED = 'APPROVED',
  HOLD = 'HOLD',
  PAID = 'PAID',
  REQUEST_CUT_OFF_MISSED = 'REQUEST_CUT_OFF_MISSED',
  PAYMENT_CUT_OFF_MISSED = 'PAYMENT_CUT_OFF_MISSED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ProjectPhase {
  PLANNING = 'Planning',
  ONGOING = 'Ongoing',
  NEAR_COMPLETION = 'Near Completion',
  COMPLETED = 'Completed'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  clientDetails: string;
  location: string;
  inCharge: string;
  budget: number;
  phase: ProjectPhase;
  currentWork: string;
  nextWork: string;
  status: 'Active' | 'Closed';
}

export interface PaymentRequest {
  id: string;
  // Requester Responsibility (Text inputs per request)
  raisedBy: string; 
  raisedByRole: string;
  raisedByDepartment: string;
  
  timestamp: string; // Submission time
  paymentDeadline: string; // User-entered cut-off date/time
  
  category: 'Project' | 'Non-Project';
  purpose: string;
  
  projectId?: string;
  workOrderNumber?: string;
  
  vendorName: string; // Free-text
  paymentMode: 'Bank Transfer' | 'UPI';
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
  
  billNumber?: string;
  billDate: string;
  amount: number; // IMMUTABLE
  paymentType: 'Advance' | 'Partial' | 'Final' | 'Full';
  
  driveLinkBills: string;
  driveLinkWorkProof: string;
  
  cutoffStatus: 'WITHIN' | 'MISSED';
  risk: RiskLevel;
  status: PaymentStatus;
  
  // Settlement
  utr?: string;
  screenshotLink?: string; // Changed to Google Drive link (string)
}

export interface AuditLog {
  id: string;
  action: string;
  paymentId: string;
  user: string;
  role: string;
  department?: string;
  timestamp: string;
}
