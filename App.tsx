
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [syncStatus, setSyncStatus] = useState<'cloud' | 'terminal' | 'connecting'>('connecting');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Persistent reference for state synchronization
  const stateRef = useRef({ projects, vendors, requests, auditLogs });
  stateRef.current = { projects, vendors, requests, auditLogs };

  /**
   * LOAD LOCAL DATA ON STARTUP
   */
  useEffect(() => {
    const localData = localStorage.getItem('igo_terminal_cache');
    if (localData) {
      const parsed = JSON.parse(localData);
      setProjects(parsed.projects || []);
      setVendors(parsed.vendors || []);
      setRequests(parsed.requests || []);
      setAuditLogs(parsed.auditLogs || []);
    }
  }, []);

  /**
   * HYBRID SYNC ENGINE
   * Attempts cloud handshake, falls back to terminal storage on failure.
   */
  const syncWithGateway = useCallback(async () => {
    try {
      const state = await api.getFullState();
      
      if (state._isFallback) {
        setSyncStatus('terminal');
      } else {
        setProjects(state.projects || []);
        setVendors(state.vendors || []);
        setRequests(state.requests || []);
        setAuditLogs(state.auditLogs || []);
        setSyncStatus('cloud');
        
        // Cache successful cloud state to terminal
        localStorage.setItem('igo_terminal_cache', JSON.stringify(state));
      }
    } catch (err) {
      setSyncStatus('terminal');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('igo_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    
    syncWithGateway();
    const interval = setInterval(syncWithGateway, 5000);
    return () => clearInterval(interval);
  }, [syncWithGateway]);

  // Local-only update helper for terminal mode
  const updateTerminalData = (type: string, data: any) => {
    if (syncStatus === 'terminal') {
      const newRequests = type === 'request' ? [data, ...requests] : requests;
      const newProjects = type === 'project' ? [...projects, data] : projects;
      const newVendors = type === 'vendor' ? [...vendors, data] : vendors;
      
      setRequests(newRequests);
      setProjects(newProjects);
      setVendors(newVendors);
      
      localStorage.setItem('igo_terminal_cache', JSON.stringify({
        requests: newRequests,
        projects: newProjects,
        vendors: newVendors,
        auditLogs
      }));
    }
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const user = STATIC_USERS.find(x => x.username === formData.get('username') && x.password === formData.get('password'));
    if (user) {
      const uData = { id: user.id, username: user.username, name: user.name, role: user.role };
      setCurrentUser(uData);
      localStorage.setItem('igo_user', JSON.stringify(uData));
      setAuthError(null);
    } else {
      setAuthError('AUTHORIZATION FAILED');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('igo_user');
  };

  const renderDashboard = () => {
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case Role.CEO:
        return <CEODashboard requests={requests} projects={projects} onUpdateStatus={async (id, s) => { 
          await api.updateRequestStatus(id, s); 
          if (syncStatus === 'terminal') {
            const updated = requests.map(r => r.id === id ? { ...r, status: s } : r);
            setRequests(updated);
          } else {
            syncWithGateway();
          }
        }} />;
      case Role.BACKEND:
        return <BackendDashboard user={currentUser} projects={projects} vendors={vendors} requests={requests} onSubmitRequest={async (r) => { 
          await api.createRequest(r); 
          updateTerminalData('request', r);
          if (syncStatus === 'cloud') syncWithGateway();
        }} />;
      case Role.ACCOUNTS:
        return <AccountsDashboard requests={requests} onMarkPaid={async (id, utr, img) => { 
          await api.updateRequestStatus(id, PaymentStatus.PAID, { utr, screenshot: img }); 
          if (syncStatus === 'terminal') {
            const updated = requests.map(r => r.id === id ? { ...r, status: PaymentStatus.PAID, utr, screenshot: img } : r);
            setRequests(updated);
          } else {
            syncWithGateway();
          }
        }} />;
      case Role.ADMIN:
        return <AdminDashboard projects={projects} vendors={vendors} requests={requests} logs={auditLogs} onUpdateProjects={async (ps) => { 
          const last = ps[ps.length-1];
          await api.createProject(last); 
          updateTerminalData('project', last);
        }} onUpdateVendors={async (vs) => { 
          const last = vs[vs.length-1];
          await api.createVendor(last); 
          updateTerminalData('vendor', last);
        }} onUpdateRequest={()=>{}} onDeleteRequest={()=>{}} />;
      default: return null;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="p-12 text-center bg-slate-800/50">
            <h1 className="text-4xl font-black tracking-tighter text-white">IGO COMPLIANCE</h1>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Internal Management Hub</p>
          </div>
          <div className="p-12">
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-xl text-center">{authError}</div>}
              <input name="username" placeholder="Terminal ID" required className="w-full bg-slate-800 border border-white/5 p-4 rounded-xl text-white text-sm outline-none focus:bg-slate-700" />
              <input name="password" type="password" placeholder="Passkey" required className="w-full bg-slate-800 border border-white/5 p-4 rounded-xl text-white text-sm outline-none focus:bg-slate-700" />
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-slate-100 transition-all">Authenticate</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {renderDashboard()}

      {/* SYSTEM STATUS MONITOR */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-500 ${
          syncStatus === 'cloud' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' : 
          syncStatus === 'terminal' ? 'bg-amber-950/80 border-amber-500/30 text-amber-400' : 
          'bg-blue-950/80 border-blue-500/30 text-blue-400'
        }`}>
          <div className="relative">
             <div className={`w-2.5 h-2.5 rounded-full ${
               syncStatus === 'cloud' ? 'bg-emerald-500' : 
               syncStatus === 'terminal' ? 'bg-amber-500' : 
               'bg-blue-500 animate-pulse'
             }`}></div>
             {syncStatus === 'cloud' && <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-50"></div>}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {syncStatus === 'cloud' ? 'Cloud Mirror: Active' : 
               syncStatus === 'terminal' ? 'Terminal Mode: Local Cache' : 
               'Gateway: Handshaking...'}
            </span>
            {syncStatus === 'terminal' && (
              <span className="text-[8px] font-bold opacity-70 uppercase mt-1">Gateway Link Interrupted</span>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
