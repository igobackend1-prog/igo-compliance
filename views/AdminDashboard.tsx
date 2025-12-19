
import React, { useState } from 'react';
import { Project, Vendor, PaymentRequest, AuditLog, ProjectPhase } from '../types';

interface AdminProps {
  projects: Project[];
  vendors: Vendor[];
  requests: PaymentRequest[];
  logs: AuditLog[];
  onUpdateProjects: (projects: Project[]) => void;
  onUpdateVendors: (vendors: Vendor[]) => void;
  onUpdateRequest: (req: PaymentRequest) => void;
  onDeleteRequest: (id: string) => void;
}

const AdminDashboard: React.FC<AdminProps> = ({ projects, vendors, requests, logs, onUpdateProjects, onUpdateVendors, onUpdateRequest, onDeleteRequest }) => {
  const [tab, setTab] = useState<'Projects' | 'Vendors' | 'Audit'>('Audit');

  const addProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newProject: Project = {
      id: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: fd.get('name') as string,
      clientDetails: fd.get('client') as string,
      location: fd.get('location') as string,
      inCharge: fd.get('inCharge') as string,
      budget: Number(fd.get('budget')),
      phase: ProjectPhase.PLANNING,
      currentWork: '',
      nextWork: '',
      status: 'Active'
    };
    onUpdateProjects([...projects, newProject]);
    e.currentTarget.reset();
  };

  const addVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newVendor: Vendor = {
      id: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      name: fd.get('name') as string,
      type: fd.get('type') as any,
      contact: fd.get('contact') as string,
      status: 'Active'
    };
    onUpdateVendors([...vendors, newVendor]);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex border-b border-slate-200">
        {(['Audit', 'Projects', 'Vendors'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${tab === t ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'Audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">System Activity Logs</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest underline decoration-red-200 decoration-2 underline-offset-4">Immutable Trace</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User / Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Related ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">No activity recorded yet.</td>
                  </tr>
                )}
                {logs.map(log => (
                  <tr key={log.id} className="text-sm">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{log.user}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{log.role}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-blue-600">
                      {log.paymentId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b pb-2">Add New Project</h4>
              <form onSubmit={addProject} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Name</label>
                  <input name="name" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Client Details</label>
                  <input name="client" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location</label>
                    <input name="location" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Budget (INR)</label>
                    <input name="budget" type="number" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">In-Charge Name</label>
                  <input name="inCharge" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-red-500/20">
                  Register Project
                </button>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50/50">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Project ID</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name & Location</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Phase</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Budget</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {projects.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No projects registered.</td></tr>}
                   {projects.map(p => (
                     <tr key={p.id}>
                       <td className="px-6 py-4 font-bold text-sm text-slate-800">{p.id}</td>
                       <td className="px-6 py-4">
                         <div className="font-bold text-sm">{p.name}</div>
                         <div className="text-[10px] text-slate-500 uppercase">{p.location}</div>
                       </td>
                       <td className="px-6 py-4">
                         <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">{p.phase}</span>
                       </td>
                       <td className="px-6 py-4 text-right font-black text-slate-900">
                         ₹{p.budget.toLocaleString()}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'Vendors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b pb-2">Onboard Vendor</h4>
                <form onSubmit={addVendor} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vendor Name</label>
                    <input name="name" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vendor Type</label>
                    <select name="type" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500">
                      <option value="Company">Company</option>
                      <option value="Contractor">Contractor</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Info</label>
                    <input name="contact" required className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder="Email or Phone" />
                  </div>
                  <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-red-500/20">
                    Register Vendor
                  </button>
                </form>
             </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50/50">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vendor ID</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name & Type</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contact</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {vendors.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No vendors registered.</td></tr>}
                   {vendors.map(v => (
                     <tr key={v.id}>
                       <td className="px-6 py-4 font-bold text-sm text-slate-800">{v.id}</td>
                       <td className="px-6 py-4">
                         <div className="font-bold text-sm uppercase">{v.name}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase">{v.type}</div>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-600">{v.contact}</td>
                       <td className="px-6 py-4 text-right">
                         <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase">Active</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
