
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
  const [syncActive, setSyncActive] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // THE MASTER SYNC ENGINE
  // This function mirrors the cloud database state across all organization devices.
  const syncOrganizationData = async () => {
    try {
      const isLive = await api.verifyCloudSync();
      setSyncActive(isLive);
      
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
      console.error("Cloud Sync Interrupted. Re-establishing link...");
      setSyncActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('igo_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Initial Sync
    syncOrganizationData();
    
    // FORCED CLOUD SYNC: Every 3 seconds.
    // Guaranteed to update CEO dashboard if Backend raises a request.
    const interval = setInterval(syncOrganizationData, 3000);
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
      setAuthError('INVALID CREDENTIALS: ACCESS DENIED');
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
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="w-10 h-10 border-4 border-slate-900/5 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Verifying Organizational Sync...</p>
        </div>
      );
    }

    switch (currentUser.role) {
      case Role.CEO:
        return <CEODashboard requests={requests} projects={projects} onUpdateStatus={async (id, s) => { await api.updateRequestStatus(id, s); syncOrganizationData(); }} />;
      case Role.BACKEND:
        return <BackendDashboard user={currentUser} projects={projects} vendors={vendors} requests={requests} onSubmitRequest={async (r) => { await api.createRequest(r); syncOrganizationData(); }} />;
      case Role.ACCOUNTS:
        return <AccountsDashboard requests={requests} onMarkPaid={async (id, utr, img) => { await api.updateRequestStatus(id, PaymentStatus.PAID, { utr, screenshot: img }); syncOrganizationData(); }} />;
      case Role.ADMIN:
        return <AdminDashboard projects={projects} vendors={vendors} requests={requests} logs={auditLogs} onUpdateProjects={async (ps) => { await api.createProject(ps[ps.length-1]); syncOrganizationData(); }} onUpdateVendors={async (vs) => { await api.createVendor(vs[vs.length-1]); syncOrganizationData(); }} onUpdateRequest={()=>{}} onDeleteRequest={()=>{}} />;
      default: return null;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="p-12 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-white">IGO COMPLIANCE</h1>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Global Server Live</span>
            </div>
          </div>
          <div className="p-12 pt-0">
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-xl text-center">{authError}</div>}
              <input name="username" placeholder="Employee Terminal ID" required className="w-full bg-slate-800 border border-white/5 p-4 rounded-xl text-white text-sm focus:ring-2 focus:ring-white/20 outline-none transition-all" />
              <input name="password" type="password" placeholder="Passkey" required className="w-full bg-slate-800 border border-white/5 p-4 rounded-xl text-white text-sm focus:ring-2 focus:ring-white/20 outline-none transition-all" />
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Authorize Session</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      <div className="max-w-7xl mx-auto">
        {renderDashboard()}
      </div>

      {/* CLOUD STATUS INDICATOR (FIXED) */}
      <div className="fixed bottom-8 right-8 z-[9999]">
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${syncActive ? 'bg-emerald-950/90 border-emerald-500/30' : 'bg-red-950/90 border-red-500/30'} backdrop-blur-md`}>
          <div className="relative">
            <span className={`block w-2.5 h-2.5 rounded-full ${syncActive ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></span>
            {syncActive && <span className="absolute inset-0 block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75"></span>}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white uppercase tracking-widest">
              {syncActive ? 'Global Sync Active' : 'Connecting to Server...'}
            </span>
            <span className="text-[8px] text-white/50 font-bold uppercase tracking-tighter">Project ID: gen-lang-client-0829363952</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
