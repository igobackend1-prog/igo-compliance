
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Project, PaymentRequest, AuditLog, PaymentStatus } from './types';
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
  const [syncStatus, setSyncStatus] = useState<'cloud' | 'terminal' | 'connecting'>('connecting');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const syncWithGateway = useCallback(async () => {
    try {
      const state = await api.getFullState();
      
      if (state._isFallback) {
        setSyncStatus('terminal');
      } else {
        if (state.projects) setProjects(state.projects);
        if (state.requests) setRequests(state.requests);
        if (state.auditLogs) setAuditLogs(state.auditLogs);
        setSyncStatus('cloud');
        localStorage.setItem('igo_terminal_cache', JSON.stringify(state));
      }
    } catch (err) {
      setSyncStatus('terminal');
    }
  }, []);

  useEffect(() => {
    const localData = localStorage.getItem('igo_terminal_cache');
    if (localData) {
      const parsed = JSON.parse(localData);
      setProjects(parsed.projects || []);
      setRequests(parsed.requests || []);
      setAuditLogs(parsed.auditLogs || []);
    }
    
    const storedUser = localStorage.getItem('igo_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    
    syncWithGateway();
    const interval = setInterval(syncWithGateway, 5000);
    return () => clearInterval(interval);
  }, [syncWithGateway]);

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

  const handleUpdateStatus = async (id: string, status: PaymentStatus, extra: any = {}) => {
    // Optimistic Update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, ...extra } : r));
    try {
      await api.updateRequestStatus(id, status, extra);
      syncWithGateway();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const handleCreateRequest = async (r: PaymentRequest) => {
    // Optimistic Update
    setRequests(prev => [r, ...prev]);
    try {
      await api.createRequest(r);
      syncWithGateway();
    } catch (err) {
      console.error('Request creation failed', err);
    }
  };

  const handleCreateProject = async (p: Project) => {
    // Optimistic Update
    setProjects(prev => [...prev, p]);
    try {
      await api.createProject(p);
      syncWithGateway();
    } catch (err) {
      console.error('Project creation failed', err);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    // Optimistic Update
    setRequests(prev => prev.filter(r => r.id !== id));
    try {
      await api.deleteRequest(id);
      syncWithGateway();
    } catch (err) {
      console.error('Deletion failed', err);
    }
  };

  const renderDashboard = () => {
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case Role.CEO:
        return <CEODashboard 
          requests={requests} 
          projects={projects} 
          onUpdateStatus={handleUpdateStatus} 
        />;
      case Role.BACKEND:
        return <BackendDashboard 
          user={currentUser} 
          projects={projects} 
          requests={requests} 
          onSubmitRequest={handleCreateRequest} 
        />;
      case Role.ACCOUNTS:
        return <AccountsDashboard 
          requests={requests} 
          onMarkPaid={(id, utr, imgLink) => handleUpdateStatus(id, PaymentStatus.PAID, { utr, screenshotLink: imgLink })} 
        />;
      case Role.ADMIN:
        return <AdminDashboard 
          projects={projects} 
          vendors={[]} 
          requests={requests} 
          logs={auditLogs} 
          onUpdateProjects={(ps) => handleCreateProject(ps[ps.length-1])} 
          onUpdateVendors={()=>{}} 
          onUpdateRequest={()=>{}} 
          onDeleteRequest={handleDeleteRequest} 
        />;
      default: return null;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="p-16 text-center bg-slate-800/20 border-b border-white/5">
            <h1 className="text-5xl font-black tracking-tighter text-white leading-none">IGO</h1>
            <h2 className="text-xl font-black tracking-widest text-white/40 uppercase mt-2 text-center">Compliance</h2>
          </div>
          <div className="p-16">
            <form onSubmit={handleLogin} className="space-y-6">
              {authError && <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl text-center tracking-widest">{authError}</div>}
              <input name="username" placeholder="TERMINAL ID" required className="w-full bg-slate-800/50 border border-white/10 p-5 rounded-2xl text-white text-sm font-black tracking-widest outline-none focus:bg-slate-700 transition-all" />
              <input name="password" type="password" placeholder="PASSKEY" required className="w-full bg-slate-800/50 border border-white/10 p-5 rounded-2xl text-white text-sm font-black tracking-widest outline-none focus:bg-slate-700 transition-all" />
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl uppercase tracking-[0.3em] text-[10px] hover:bg-slate-100 shadow-2xl">Execute Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {renderDashboard()}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
          syncStatus === 'cloud' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : 'bg-slate-900/90 border-slate-700 text-slate-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${syncStatus === 'cloud' ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            {syncStatus === 'cloud' ? 'Cloud Sync' : 'Local Workspace'}
          </span>
        </div>
      </div>
    </Layout>
  );
};

export default App;
