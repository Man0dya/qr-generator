"use client";

import { Trash2, Key, Shield, UserMinus, QrCode } from "lucide-react";

type UserRole = "user" | "admin" | "super_admin";

type Props = {
  users: Array<{ id: number; email: string; role: UserRole; created_at: string }>;
  currentUser: { id?: number; role?: UserRole } | null;
  onAction: (action: string, id: number, extra?: Record<string, unknown>) => void;
  onViewQrs?: (id: number) => void;
};

export default function UsersTable({ users, currentUser, onAction, onViewQrs }: Props) {
  const role = currentUser?.role;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase">User Email</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
            {(role === 'admin' || role === 'super_admin') && (
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/80 transition">
              <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                  {u.email.charAt(0).toUpperCase()}
                </div>
                {u.email}
              </td>
              <td className="p-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                    {u.role}
                </span>
              </td>
              <td className="p-4 text-sm text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
              
              {(role === 'admin' || role === 'super_admin') && (
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3">
                    {onViewQrs ? (
                      <button
                        onClick={() => onViewQrs(u.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                      >
                        <QrCode size={14} /> View QRs
                      </button>
                    ) : null}

                    {role === 'super_admin' && u.id !== currentUser?.id && (
                      <>
                        {u.role === 'user' ? (
                          <button
                            onClick={() => onAction('change_role', u.id, { new_role: 'admin' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                          >
                            <Shield size={14} /> Promote
                          </button>
                        ) : (
                          <button
                            onClick={() => onAction('change_role', u.id, { new_role: 'user' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                          >
                            <UserMinus size={14} /> Demote
                          </button>
                        )}

                        <button
                          onClick={() => onAction('force_logout', u.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                          title="Force logout user (closes open sessions)"
                        >
                          <Key size={14} /> Force Logout
                        </button>

                        <button
                          onClick={() => onAction('delete_user', u.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}