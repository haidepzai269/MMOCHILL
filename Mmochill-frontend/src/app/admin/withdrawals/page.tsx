"use client";

import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  ExternalLink,
  Loader2
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { getAdminWithdrawals, approveWithdrawal, rejectWithdrawal } from "@/app/actions/admin";
import { toast } from "sonner";
import { useLoading } from "@/lib/contexts/loading-context";

export default function AdminWithdrawalsPage() {
  const { showLoading, hideLoading } = useLoading();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchWithdrawals = async () => {
    showLoading();
    const res = await getAdminWithdrawals(statusFilter);
    setWithdrawals(res || []);
    hideLoading();
  };

  useEffect(() => {
    fetchWithdrawals();

    // SSE Real-time withdrawal updates
    const token = document.cookie.split('; ').find(row => row.startsWith('user_token_local='))?.split('=')[1];
    if (!token) return;

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/stream?token=${token}`);

    eventSource.addEventListener("withdrawals_update", (event) => {
      fetchWithdrawals();
    });

    return () => {
      eventSource.close();
    };
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    startTransition(async () => {
      const res = await approveWithdrawal(id);
      if (res.success) {
        toast.success("Withdrawal approved successfully");
        fetchWithdrawals();
      } else {
        toast.error("Failed to approve withdrawal");
      }
    });
  };

  const handleReject = async (id: string) => {
    startTransition(async () => {
      const res = await rejectWithdrawal(id);
      if (res.success) {
        toast.success("Withdrawal rejected successfully");
        fetchWithdrawals();
      } else {
        toast.error("Failed to reject withdrawal");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Withdrawal Requests
          </h1>
          <p className="text-muted-foreground text-sm">
            Review and process payment requests from users.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl">
          {["", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === s 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount & Method</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Details</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                  No withdrawal requests found.
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{w.user_id.slice(0, 8)}...</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{new Date(w.created_at).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-primary">{w.amount?.toLocaleString()}đ</p>
                    <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> {w.method}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold">{w.account_name}</p>
                      <p className="text-muted-foreground">{w.bank_name} - {w.account_number}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      w.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                      w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {w.status === 'pending' ? <Clock className="w-3 h-3" /> : 
                       w.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : 
                       <XCircle className="w-3 h-3" />}
                      {w.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(w.id)}
                          disabled={isPending}
                          className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleReject(w.id)}
                          disabled={isPending}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
