
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
  PAID = 'PAID'
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

export interface Vendor {
  id: string;
  name: string;
  type: 'Company' | 'Contractor' | 'Individual';
  contact: string;
  status: 'Active' | 'Inactive';
}

export interface PaymentRequest {
  id: string;
  raisedBy: string;
  timestamp: string;
  category: 'Project' | 'Non-Project';
  purpose: string;
  projectId?: string;
  projectPhase?: string;
  currentWork?: string;
  nextWork?: string;
  vendorId?: string;
  vendorName: string;
  vendorType: string;
  billNumber: string;
  billDate: string;
  amount: number;
  paymentType: 'Advance' | 'Partial' | 'Final' | 'Full';
  paymentMode: 'Bank Transfer' | 'UPI';
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
  cutoffStatus: 'WITHIN' | 'MISSED';
  risk: RiskLevel;
  status: PaymentStatus;
  utr?: string;
  screenshot?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  paymentId: string;
  user: string;
  role: Role;
  timestamp: string;
}
