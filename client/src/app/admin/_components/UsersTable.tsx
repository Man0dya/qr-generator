"use client";

import { useMemo, useState } from "react";
import { Trash2, Key, Shield, UserMinus, QrCode } from "lucide-react";

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
    <tr key={u.id} className="hover:bg-muted/50 transition">
      <td className="p-4 font-medium text-foreground">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
            {u.email.charAt(0).toUpperCase()}
          </div>
          <span className="truncate" title={u.email}>
            {u.email}
          </span>
        </div>
      </td>
      <td className="p-4">
        <span
          className={
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " +
            (u.role === "admin" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground")
          }
        >
          {u.role}
        </span>
      </td>
      <td className="p-4 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>

      {canAct ? (
        <td className="p-4 text-right">
          <div className="flex justify-end items-center gap-2 flex-wrap">
            {onViewQrs ? (
              <button
                onClick={() => onViewQrs(u.id)}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition"
              >
                <QrCode size={14} /> View QRs
              </button>
            ) : null}

            {role === "super_admin" && u.id !== currentUser?.id ? (
              <>
                {u.role === "user" ? (
                  <button
                    onClick={() => onAction("change_role", u.id, { new_role: "admin" })}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition"
                  >
                    <Shield size={14} /> Promote
                  </button>
                ) : (
                  <button
                    onClick={() => onAction("change_role", u.id, { new_role: "user" })}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border transition"
                  >
                    <UserMinus size={14} /> Demote
                  </button>
                )}

                <button
                  onClick={() => onAction("force_logout", u.id)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border transition"
                  title="Force logout user (closes open sessions)"
                >
                  <Key size={14} /> Force Logout
                </button>

                <button
                  onClick={() => onAction("delete_user", u.id)}
                  className="inline-flex items-center justify-center h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg transition"
                  title="Delete user"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : null}
          </div>
        </td>
      ) : null}
    </tr>
  );

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-card border border-border text-foreground">
            Total: {counts.total}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            Admins: {counts.admins}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-muted/50 border border-border text-muted-foreground">
            Users: {counts.users}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => {
                setTab("admins");
                setPage(1);
              }}
              className={
                "h-8 px-3 rounded-md text-xs font-bold transition " +
                (tab === "admins" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:bg-muted")
              }
            >
              Admins
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("users");
                setPage(1);
              }}
              className={
                "h-8 px-3 rounded-md text-xs font-bold transition " +
                (tab === "users" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted")
              }
            >
              Users
            </button>
          </div>

          <span className="text-xs font-bold text-muted-foreground ml-1">Sort</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-foreground"
          >
            <option value="joined_desc">Joined (newest)</option>
            <option value="joined_asc">Joined (oldest)</option>
            <option value="email_asc">Email (A-Z)</option>
            <option value="email_desc">Email (Z-A)</option>
          </select>

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            className="h-9 w-56 max-w-full text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
          />

          <span className="text-xs font-bold text-muted-foreground ml-1">Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-foreground"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{tab === "admins" ? "Admins" : "Users"}</span>
          <span className="ml-2 text-muted-foreground">Showing {rangeLabel}</span>
          {normalizedQuery ? <span className="ml-2 text-muted-foreground/70">for “{query.trim()}”</span> : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={
              "h-9 px-3 rounded-lg border text-xs font-bold transition " +
              (page <= 1
                ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                : "bg-card text-foreground border-border hover:bg-muted")
            }
          >
            Prev
          </button>
          <span className="text-xs font-bold text-muted-foreground">Page {Math.min(Math.max(1, page), pageCount)} / {pageCount}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            className={
              "h-9 px-3 rounded-lg border text-xs font-bold transition " +
              (page >= pageCount
                ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                : "bg-card text-foreground border-border hover:bg-muted")
            }
          >
            Next
          </button>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="p-4 text-xs font-bold text-muted-foreground uppercase">User Email</th>
            <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Role</th>
            <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Joined</th>
            {canAct && (
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pagedList.map((u) => (
            <Row key={u.id} u={u} />
          ))}

          {activeList.length === 0 ? (
            <tr>
              <td className="p-6 text-muted-foreground" colSpan={canAct ? 4 : 3}>
                No {tab === "admins" ? "admins" : "users"} found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}