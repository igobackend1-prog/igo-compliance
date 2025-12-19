
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Role, Project, Vendor, PaymentRequest, AuditLog, PaymentStatus, RiskLevel } from './types';
import { STATIC_USERS } from './constants';
import Layout from './components/Layout';
import CEODashboard from './views/CEODashboard';
import BackendDashboard from './views/BackendDashboard';
import AccountsDashboard from './views/AccountsDashboard';
import AdminDashboard from './views/AdminDashboard';

// Shared channel for real-time synchronization across tabs
const syncChannel = new BroadcastChannel('igo_compliance_sync');

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'warning' | 'error'} | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Sound effect for notifications (optional, using browser beep as fallback)
  const playNotifySound = () => {
    try {
      const context = new AudioContext();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, context.currentTime);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      osc.start();
      osc.stop(context.currentTime + 0.1);
    } catch (e) {}
  };

  // Sync state across tabs
  const broadcastChange = (type: string, data: any) => {
    syncChannel.postMessage({ type, data, sender: currentUser?.id });
  };

  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      const { type, data, sender } = event.data;
      if (sender === currentUser?.id && type !== 'NEW_REQUEST') return; // Don't sync own changes except for notification logic

      switch (type) {
        case 'SYNC_ALL':
          if (data.projects) setProjects(data.projects);
          if (data.vendors) setVendors(data.vendors);
          if (data.requests) setRequests(data.requests);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
          break;
        case 'NEW_REQUEST':
          setRequests(data);
          if (currentUser?.role === Role.CEO) {
            setNotification({ 
              message: "New Payment Request Received!", 
              type: 'info' 
            });
            playNotifySound();
          }
          break;
        case 'STATUS_UPDATE':
          setRequests(data);
          break;
      }
    };

    syncChannel.onmessage = handleSync;
    return () => syncChannel.onmessage = null;
  }, [currentUser]);

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

  // Save persistence & Broadcast
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
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      broadcastChange('SYNC_ALL', { auditLogs: updated });
      return updated;
    });
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
              setRequests(prev => {
                const updated = prev.map(r => r.id === id ? { ...r, status } : r);
                broadcastChange('STATUS_UPDATE', updated);
                return updated;
              });
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
              setRequests(prev => {
                const updated = [req, ...prev];
                broadcastChange('NEW_REQUEST', updated);
                return updated;
              });
              addAuditLog('Created Payment Request', req.id);
            }}
          />
        );
      case Role.ACCOUNTS:
        return (
          <AccountsDashboard 
            requests={requests}
            onMarkPaid={(id, utr, screenshot) => {
              setRequests(prev => {
                const updated = prev.map(r => r.id === id ? { ...r, status: PaymentStatus.PAID, utr, screenshot } : r);
                broadcastChange('STATUS_UPDATE', updated);
                return updated;
              });
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
            onUpdateProjects={(p) => { setProjects(p); broadcastChange('SYNC_ALL', { projects: p }); }}
            onUpdateVendors={(v) => { setVendors(v); broadcastChange('SYNC_ALL', { vendors: v }); }}
            onUpdateRequest={(updated) => {
              setRequests(prev => {
                const newReqs = prev.map(r => r.id === updated.id ? updated : r);
                broadcastChange('STATUS_UPDATE', newReqs);
                return newReqs;
              });
              addAuditLog('Admin updated record', updated.id);
            }}
            onDeleteRequest={(id) => {
              setRequests(prev => {
                const newReqs = prev.filter(r => r.id !== id);
                broadcastChange('STATUS_UPDATE', newReqs);
                return newReqs;
              });
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
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-white border-l-4 border-blue-600 shadow-2xl rounded-lg p-5 flex items-start gap-4 max-w-sm">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm">{notification.message}</h4>
              <p className="text-xs text-slate-500 mt-1">A backend user has just submitted a new task for your review.</p>
              <button 
                onClick={() => setNotification(null)}
                className="mt-3 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800"
              >
                Dismiss Notification
              </button>
            </div>
          </div>
        </div>
      )}
      
      {renderDashboard()}
      
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900/10 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-500">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        REAL-TIME SYNC ACTIVE
      </div>
    </Layout>
  );
};

export default App;
