"use client";

import { useMemo, useState } from "react";
import { Trash2, Key, Shield, UserMinus, QrCode, Search, ChevronLeft, ChevronRight, UserCog } from "lucide-react";

type UserRole = "user" | "admin" | "super_admin";

type Props = {
  users: Array<{ id: number; email: string; role: UserRole; created_at: string; name?: string | null }>;
  currentUser: { id?: number; role?: UserRole } | null;
  onAction: (action: string, id: number, extra?: Record<string, unknown>) => void;
  onViewQrs?: (id: number) => void;
};

type SortKey = "joined_desc" | "joined_asc" | "email_asc" | "email_desc";
type ViewTab = "admins" | "users";

function compareUsers(a: { email: string; created_at: string }, b: { email: string; created_at: string }, sort: SortKey) {
  switch (sort) {
    case "joined_asc":
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    case "email_asc":
      return a.email.localeCompare(b.email);
    case "email_desc":
      return b.email.localeCompare(a.email);
    case "joined_desc":
    default:
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }
}

export default function UsersTable({ users, currentUser, onAction, onViewQrs }: Props) {
  const role = currentUser?.role;

  const [sort, setSort] = useState<SortKey>("joined_desc");
  const [tab, setTab] = useState<ViewTab>("users");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [query, setQuery] = useState<string>("");

  const visibleUsers = useMemo(() => {
    // Requested: don't show super admins in the list.
    return (users || []).filter((u) => u.role !== "super_admin");
  }, [users]);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const searchedUsers = useMemo(() => {
    if (!normalizedQuery) return visibleUsers;
    return visibleUsers.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      return email.includes(normalizedQuery) || name.includes(normalizedQuery);
    });
  }, [visibleUsers, normalizedQuery]);

  const counts = useMemo(() => {
    const total = visibleUsers.length;
    const admins = visibleUsers.filter((u) => u.role === "admin").length;
    const normalUsers = visibleUsers.filter((u) => u.role === "user").length;
    return { total, admins, users: normalUsers };
  }, [visibleUsers]);

  const sortedAdmins = useMemo(() => {
    return searchedUsers
      .filter((u) => u.role === "admin")
      .slice()
      .sort((x, y) => compareUsers(x, y, sort));
  }, [searchedUsers, sort]);

  const sortedUsers = useMemo(() => {
    return searchedUsers
      .filter((u) => u.role === "user")
      .slice()
      .sort((x, y) => compareUsers(x, y, sort));
  }, [searchedUsers, sort]);

  const activeList = useMemo(() => {
    const list = tab === "admins" ? sortedAdmins : sortedUsers;
    return list;
  }, [tab, sortedAdmins, sortedUsers]);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(activeList.length / pageSize));
  }, [activeList.length, pageSize]);

  const pagedList = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    return activeList.slice(start, start + pageSize);
  }, [activeList, page, pageCount, pageSize]);

  const rangeLabel = useMemo(() => {
    if (activeList.length === 0) return "0";
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(activeList.length, safePage * pageSize);
    return `${start}-${end} of ${activeList.length}`;
  }, [activeList.length, page, pageCount, pageSize]);

  const canAct = role === "admin" || role === "super_admin";

  const Row = ({ u }: { u: { id: number; email: string; role: UserRole; created_at: string; name?: string | null } }) => (
    <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
      <td className="px-5 py-3.5 font-medium text-foreground">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {u.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="truncate text-sm font-medium" title={u.email}>
              {u.email}
            </div>
            {u.name && <div className="text-xs text-muted-foreground">{u.name}</div>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={
            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase " +
            (u.role === "admin" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground")
          }
        >
          {u.role}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>

      {canAct ? (
        <td className="px-5 py-3.5 text-right">
          <div className="flex justify-end items-center gap-1.5 flex-wrap">
            {onViewQrs ? (
              <button
                onClick={() => onViewQrs(u.id)}
                className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                title="View QRs"
              >
                <QrCode size={14} />
              </button>
            ) : null}

            {role === "super_admin" && u.id !== currentUser?.id ? (
              <>
                {u.role === "user" ? (
                  <button
                    onClick={() => onAction("change_role", u.id, { new_role: "admin" })}
                    className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-amber-600 hover:bg-amber-500/10 transition-colors"
                    title="Promote to Admin"
                  >
                    <Shield size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => onAction("change_role", u.id, { new_role: "user" })}
                    className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
                    title="Demote to User"
                  >
                    <UserMinus size={14} />
                  </button>
                )}

                <button
                  onClick={() => onAction("force_logout", u.id)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
                  title="Force Logout"
                >
                  <Key size={14} />
                </button>

                <button
                  onClick={() => onAction("delete_user", u.id)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete User"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : null}
          </div>
        </td>
      ) : null}
    </tr>
  );

  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/60 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <UserCog size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">User Management</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">
                Total: {counts.total}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600">
                Admins: {counts.admins}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                Users: {counts.users}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-background border border-border/60 rounded-md p-0.5 flex items-center">
            <button
              onClick={() => { setTab("admins"); setPage(1); }}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${tab === "admins" ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Admins
            </button>
            <button
              onClick={() => { setTab("users"); setPage(1); }}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${tab === "users" ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Users
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search users..."
            className="h-9 pl-9 pr-3 w-64 max-w-full text-sm bg-background border border-border rounded-md outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="h-8 text-xs bg-background border border-border rounded-md px-2 outline-none focus:border-primary transition text-foreground"
          >
            <option value="joined_desc">Newest First</option>
            <option value="joined_asc">Oldest First</option>
            <option value="email_asc">Email (A-Z)</option>
            <option value="email_desc">Email (Z-A)</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 text-xs bg-background border border-border rounded-md px-2 outline-none focus:border-primary transition text-foreground"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              {canAct && (
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pagedList.map((u) => (
              <Row key={u.id} u={u} />
            ))}

            {activeList.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-muted-foreground" colSpan={canAct ? 4 : 3}>
                  No {tab === "admins" ? "admins" : "users"} found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {pagedList.length > 0 && (
        <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
          <div>
            Showing {rangeLabel}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="p-1 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}