
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Project, Vendor, PaymentRequest, AuditLog, PaymentStatus } from './types';
import { STATIC_USERS } from './constants';
import Layout from './components/Layout';
import CEODashboard from './views/CEODashboard';
import BackendDashboard from './views/BackendDashboard';
import AccountsDashboard from './views/AccountsDashboard';
import AdminDashboard from './views/AdminDashboard';
import { api } from './apiService';

const syncChannel = new BroadcastChannel('igo_compliance_sync');

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'warning' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const playNotifySound = () => {
    try {
      const context = new AudioContext();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.frequency.setValueAtTime(440, context.currentTime);
      gain.gain.setValueAtTime(0.05, context.currentTime);
      osc.start();
      osc.stop(context.currentTime + 0.1);
    } catch (e) {}
  };

  const addAuditLog = useCallback(async (action: string, paymentId: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      paymentId,
      user: currentUser.name,
      role: currentUser.role,
      timestamp: new Date().toISOString()
    };
    const savedLog = await api.createAuditLog(newLog);
    setAuditLogs(prev => [savedLog, ...prev]);
    syncChannel.postMessage({ type: 'LOG_CREATED', payload: savedLog });
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [p, v, r, l] = await Promise.all([
        api.getProjects(),
        api.getVendors(),
        api.getRequests(),
        api.getAuditLogs()
      ]);
      setProjects(p);
      setVendors(v);
      setRequests(r);
      setAuditLogs(l);
    } catch (err) {
      console.error("Failed to load cloud data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('igo_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    loadData();
  }, []);

  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'STATE_REFRESH') loadData();
      if (type === 'NEW_REQUEST' && currentUser?.role === Role.CEO) {
        setNotification({ message: "Cloud: New Payment Request Detected!", type: 'info' });
        playNotifySound();
        loadData();
      }
    };
    syncChannel.onmessage = handleSync;
    return () => { syncChannel.onmessage = null; };
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    const user = STATIC_USERS.find(u => u.username === username && u.password === password);
    if (user) {
      const userToSet = { id: user.id, username: user.username, name: user.name, role: user.role };
      setCurrentUser(userToSet);
      localStorage.setItem('igo_user', JSON.stringify(userToSet));
      setAuthError(null);
    } else {
      setAuthError('Invalid credentials. Access denied.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('igo_user');
  };

  const renderDashboard = () => {
    if (!currentUser) return null;
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Cloud Data...</p>
      </div>
    );

    switch (currentUser.role) {
      case Role.CEO:
        return (
          <CEODashboard 
            requests={requests} 
            projects={projects}
            onUpdateStatus={async (id, status) => {
              await api.updateRequestStatus(id, status);
              await addAuditLog(`CEO ACTION: ${status}`, id);
              loadData();
              syncChannel.postMessage({ type: 'STATE_REFRESH' });
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
            onSubmitRequest={async (req) => {
              await api.createRequest(req);
              await addAuditLog('BACKEND: Request Raised', req.id);
              loadData();
              syncChannel.postMessage({ type: 'NEW_REQUEST' });
            }}
          />
        );
      case Role.ACCOUNTS:
        return (
          <AccountsDashboard 
            requests={requests}
            onMarkPaid={async (id, utr, screenshot) => {
              await api.updateRequestStatus(id, PaymentStatus.PAID, { utr, screenshot });
              await addAuditLog('ACCOUNTS: Payment Disbursed', id);
              loadData();
              syncChannel.postMessage({ type: 'STATE_REFRESH' });
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
            onUpdateProjects={async (newProjects) => {
              const last = newProjects[newProjects.length - 1];
              await api.createProject(last);
              await addAuditLog('ADMIN: Project Registered', last.id);
              loadData();
            }}
            onUpdateVendors={async (newVendors) => {
              const last = newVendors[newVendors.length - 1];
              await api.createVendor(last);
              await addAuditLog('ADMIN: Vendor Onboarded', last.id);
              loadData();
            }}
            onUpdateRequest={(updated) => {}}
            onDeleteRequest={(id) => {}}
          />
        );
      default: return null;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-8 bg-slate-900 text-white text-center">
            <h1 className="text-2xl font-black tracking-tighter">IGO COMPLIANCE</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-1">Authorized Personnel Only</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {authError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-bold uppercase tracking-tight">
                  {authError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Username</label>
                <input 
                  name="username" 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all" 
                  placeholder="Employee ID"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all" 
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs shadow-xl shadow-slate-200"
              >
                Access Control System
              </button>
            </form>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase text-center leading-relaxed">
                Notice: All activity on this terminal is recorded and subject to Dr. John Yesudhas's compliance audit.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {notification && (
        <div className="fixed top-20 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-white border-l-4 border-blue-600 shadow-2xl rounded-lg p-5 flex items-start gap-4 max-w-sm">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm">{notification.message}</h4>
              <button onClick={() => setNotification(null)} className="mt-2 text-[10px] font-black uppercase text-blue-600">Dismiss Alert</button>
            </div>
          </div>
        </div>
      )}
      {renderDashboard()}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900/10 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-500">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        CLOUD STORAGE: ACTIVE
      </div>
    </Layout>
  );
};

export default App;
