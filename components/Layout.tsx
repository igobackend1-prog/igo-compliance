
import React from 'react';
import { Role, User } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return 'bg-red-600';
      case Role.CEO: return 'bg-blue-700';
      case Role.BACKEND: return 'bg-green-600';
      case Role.ACCOUNTS: return 'bg-amber-600';
      default: return 'bg-slate-700';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className={`w-full md:w-64 ${getRoleColor(user.role)} text-white flex-shrink-0 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight">IGO COMPLIANCE</h1>
          <p className="text-xs opacity-80 mt-1 uppercase tracking-widest">Internal Control System</p>
        </div>
        
        <div className="flex-1 p-6 space-y-6">
          <div>
            <p className="text-[10px] uppercase font-bold opacity-60 mb-2">User Session</p>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs opacity-70 truncate">{user.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
             <p className="text-[10px] uppercase font-bold opacity-60 mb-2">Navigation</p>
             <div className="flex flex-col gap-1 text-sm font-medium">
               <div className="px-3 py-2 bg-white/20 rounded-md cursor-default">Dashboard</div>
             </div>
          </nav>
        </div>

        <div className="p-6 mt-auto">
          <button 
            onClick={onLogout}
            className="w-full bg-white/10 hover:bg-white/20 py-2 px-4 rounded-md transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">Operational Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
