"use client";

import { Users as UsersIcon, Search, Filter, MoreHorizontal, ShieldOff, ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { getAdminUsers, banUser } from "@/app/actions/admin";
import { toast } from "sonner";
import { useLoading } from "@/lib/contexts/loading-context";

export default function AdminUsersPage() {
  const { showLoading, hideLoading } = useLoading();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchUsers = async () => {
    showLoading();
    const res = await getAdminUsers(page, 10, search);
    setUsers(res.users || []);
    setTotal(res.total || 0);
    hideLoading();
  };

  useEffect(() => {
    fetchUsers();

    // SSE Real-time user updates
    const token = document.cookie.split('; ').find(row => row.startsWith('user_token_local='))?.split('=')[1];
    if (!token) return;

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/stream?token=${token}`);

    eventSource.addEventListener("users_update", (event) => {
      fetchUsers();
    });

    return () => {
      eventSource.close();
    };
  }, [page, search]);

  const handleBanToggle = async (userId: string, currentStatus: string) => {
    const action = currentStatus === 'banned' ? 'unban' : 'ban';
    startTransition(async () => {
      const res = await banUser(userId, action);
      if (res.success) {
        toast.success(`User ${action}ned successfully`);
        fetchUsers();
      } else {
        toast.error(res.error || `Failed to ${action} user`);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage all registered users on the platform. (Total: {total})
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID / Display</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                  {user.display_id}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
                      {user.username?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{user.username || user.full_name || 'No Name'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-primary">
                  {user.balance?.toLocaleString()}đ
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <button 
                    onClick={() => handleBanToggle(user.id, user.status)}
                    disabled={isPending}
                    title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                    className={`p-2 rounded-lg transition-colors ${user.status === 'banned' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                   >
                     {user.status === 'banned' ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Simple */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground">Showing {users.length} of {total} users</p>
        <div className="flex gap-2">
           <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold disabled:opacity-50"
           >
             Previous
           </button>
           <button 
            disabled={users.length < 10}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold disabled:opacity-50"
           >
             Next
           </button>
        </div>
      </div>
    </div>
  );
}
