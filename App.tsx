
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Project, Vendor, PaymentRequest, AuditLog, PaymentStatus, ProjectPhase } from './types';
import { STATIC_USERS } from './constants';
import Layout from './components/Layout';
import CEODashboard from './views/CEODashboard';
import BackendDashboard from './views/BackendDashboard';
import AccountsDashboard from './views/AccountsDashboard';
import AdminDashboard from './views/AdminDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Simulated Centralized Store
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load persistence
  useEffect(() => {
    const storedProjects = localStorage.getItem('igo_projects');
    const storedVendors = localStorage.getItem('igo_vendors');
    const storedRequests = localStorage.getItem('igo_requests');
    const storedLogs = localStorage.getItem('igo_logs');
    const storedUser = localStorage.getItem('igo_user');

    if (storedProjects) setProjects(JSON.parse(storedProjects));
    if (storedVendors) setVendors(JSON.parse(storedVendors));
    if (storedRequests) setRequests(JSON.parse(storedRequests));
    if (storedLogs) setAuditLogs(JSON.parse(storedLogs));
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  // Save persistence
  useEffect(() => {
    localStorage.setItem('igo_projects', JSON.stringify(projects));
    localStorage.setItem('igo_vendors', JSON.stringify(vendors));
    localStorage.setItem('igo_requests', JSON.stringify(requests));
    localStorage.setItem('igo_logs', JSON.stringify(auditLogs));
  }, [projects, vendors, requests, auditLogs]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const user = STATIC_USERS.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser({ id: user.id, username: user.username, name: user.name, role: user.role });
      localStorage.setItem('igo_user', JSON.stringify(user));
      setAuthError(null);
    } else {
      setAuthError('Invalid credentials. Access denied.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('igo_user');
  };

  const addAuditLog = useCallback((action: string, paymentId: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      paymentId,
      user: currentUser.name,
      role: currentUser.role,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">IGO COMPLIANCE</h1>
            <p className="text-slate-500 mt-2 font-medium">Internal Secure Access Portal</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
              <input 
                name="username"
                type="text" 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="root_id"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
              <input 
                name="password"
                type="password" 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-semibold">
                {authError}
              </div>
            )}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">
              Secure Login
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">Authorized Use Only</p>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case Role.CEO:
        return (
          <CEODashboard 
            requests={requests} 
            projects={projects}
            onUpdateStatus={(id, status) => {
              setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
              addAuditLog(`CEO Decision: ${status}`, id);
            }} 
          />
        );
      case Role.BACKEND:
        return (
          <BackendDashboard 
            user={currentUser}
            projects={projects}
            vendors={vendors}
            requests={requests}
            onSubmitRequest={(req) => {
              setRequests(prev => [req, ...prev]);
              addAuditLog('Created Payment Request', req.id);
            }}
          />
        );
      case Role.ACCOUNTS:
        return (
          <AccountsDashboard 
            requests={requests}
            onMarkPaid={(id, utr, screenshot) => {
              setRequests(prev => prev.map(r => r.id === id ? { ...r, status: PaymentStatus.PAID, utr, screenshot } : r));
              addAuditLog('Payment Processed', id);
            }}
          />
        );
      case Role.ADMIN:
        return (
          <AdminDashboard 
            projects={projects}
            vendors={vendors}
            requests={requests}
            logs={auditLogs}
            onUpdateProjects={setProjects}
            onUpdateVendors={setVendors}
            onUpdateRequest={(updated) => {
              setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
              addAuditLog('Admin updated record', updated.id);
            }}
            onDeleteRequest={(id) => {
              setRequests(prev => prev.filter(r => r.id !== id));
              addAuditLog('Admin deleted record', id);
            }}
          />
        );
      default:
        return <div className="p-10 text-center text-slate-500">Access Restricted</div>;
    }
  };

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {renderDashboard()}
    </Layout>
  );
};

export default App;
