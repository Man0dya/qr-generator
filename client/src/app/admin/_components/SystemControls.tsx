"use client";

import { useState } from "react";
import { UserPlus, Settings, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";

export default function SystemControls({ maintenance, onToggleMaintenance, onCreateUser }: any) {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateUser({ email: newUserEmail, password: newUserPass, role: newUserRole });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create User */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserPlus size={20} /></div>
                <h3 className="text-lg font-bold text-slate-900">Create Account</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                    <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 transition" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                    <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 transition" value={newUserPass} onChange={e=>setNewUserPass(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 transition" value={newUserRole} onChange={e=>setNewUserRole(e.target.value)}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-2">
                    Create Account
                </button>
            </form>
        </div>

        {/* Maintenance Toggle */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Settings size={20} /></div>
                <h3 className="text-lg font-bold text-slate-900">System Controls</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="text-amber-500"><AlertTriangle size={20} /></div>
                    <div>
                        <p className="font-bold text-slate-900">Maintenance Mode</p>
                        <p className="text-xs text-slate-500">Stop new QR creation</p>
                    </div>
                </div>
                <button onClick={() => onToggleMaintenance(maintenance === 'true' ? 'false' : 'true')} className={`transition-transform duration-200 hover:scale-110 ${maintenance === 'true' ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {maintenance === 'true' ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                </button>
            </div>
        </div>
    </div>
  );
}