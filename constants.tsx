
import { Role } from './types';

export const STATIC_USERS = [
  { id: '1', username: 'admin_root', password: 'igoadmin123@', name: 'Admin – CEO Office', role: Role.ADMIN },
  { id: '2', username: 'igo_ceo', password: 'igoceo123@', name: 'Dr. John Yesudhas', role: Role.CEO },
  { id: '3', username: 'backend_root', password: 'igobackend123@', name: 'Backend Submission Desk', role: Role.BACKEND },
  { id: '4', username: 'igo_accountant', password: 'igoaccountant123@', name: 'Main Accountant', role: Role.ACCOUNTS }
];

// Departments are now free-text as per 4th requirement.
