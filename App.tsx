
import React, { useState, useEffect } from 'react';
import { User, Role, Project, Vendor, PaymentRequest, AuditLog, PaymentStatus } from './types';
import { STATIC_USERS } from './constants';
import Layout from './components/Layout';
import CEODashboard from './views/CEODashboard';
import BackendDashboard from './views/BackendDashboard';
import AccountsDashboard from './views/AccountsDashboard';
import AdminDashboard from './views/AdminDashboard';
import { api } from './apiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadData = async () => {
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
      setIsConnected(api.getStatus());
    } catch (err) {
      console.warn("Sync failed. Check if server.js is running.");
      setIsConnected(false);
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
    
    // Check for updates every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const u = formData.get('username') as string;
    const p = formData.get('password') as string;
    const user = STATIC_USERS.find(x => x.username === u && x.password === p);
    if (user) {
      const uData = { id: user.id, username: user.username, name: user.name, role: user.role };
      setCurrentUser(uData);
      localStorage.setItem('igo_user', JSON.stringify(uData));
      setAuthError(null);
    } else {
      setAuthError('Access Denied: Invalid Credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('igo_user');
  };

  const renderDashboard = () => {
    if (!currentUser) return null;
    
    if (isLoading && requests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Connection...</p>
        </div>
      );
    }

    switch (currentUser.role) {
      case Role.CEO:
        return <CEODashboard requests={requests} projects={projects} onUpdateStatus={async (id, s) => { await api.updateRequestStatus(id, s); loadData(); }} />;
      case Role.BACKEND:
        return <BackendDashboard user={currentUser} projects={projects} vendors={vendors} requests={requests} onSubmitRequest={async (r) => { await api.createRequest(r); loadData(); }} />;
      case Role.ACCOUNTS:
        return <AccountsDashboard requests={requests} onMarkPaid={async (id, utr, img) => { await api.updateRequestStatus(id, PaymentStatus.PAID, { utr, screenshot: img }); loadData(); }} />;
      case Role.ADMIN:
        return <AdminDashboard projects={projects} vendors={vendors} requests={requests} logs={auditLogs} onUpdateProjects={async (ps) => { await api.createProject(ps[ps.length-1]); loadData(); }} onUpdateVendors={async (vs) => { await api.createVendor(vs[vs.length-1]); loadData(); }} onUpdateRequest={()=>{}} onDeleteRequest={()=>{}} />;
      default: return null;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-10 bg-slate-900 text-white text-center">
            <h1 className="text-3xl font-black tracking-tighter">IGO COMPLIANCE</h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 mt-2">Internal Audit Gateway</p>
          </div>
          <div className="p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {authError && <div className="bg-red-50 p-4 border-l-4 border-red-500 text-red-700 text-[10px] font-black uppercase">{authError}</div>}
              <input name="username" placeholder="Employee ID" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
              <input name="password" type="password" placeholder="Terminal Password" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 uppercase tracking-widest text-xs transition-transform active:scale-95">Verify & Connect</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {/* CONNECTION STATUS BANNER */}
      {!isConnected && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4 animate-in slide-in-from-top duration-500">
          <div className="bg-amber-100 p-2 rounded-lg">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Local-Only Mode Enabled</p>
            <p className="text-[10px] text-amber-700">Cloud synchronization is offline. Data entered will only be visible on this device until the server is connected.</p>
          </div>
        </div>
      )}
      
      {renderDashboard()}

      {/* FOOTER CLOUD STATUS */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white/90 backdrop-blur shadow-2xl border border-slate-200 px-4 py-2.5 rounded-full z-50">
        <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></span>
        <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.1em]">
          {isConnected ? 'Cloud Synchronized' : 'Standalone Terminal'}
        </span>
      </div>
    </Layout>
  );
};

export default App;
