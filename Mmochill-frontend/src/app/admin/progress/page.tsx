"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminClaims } from "@/app/actions/admin";
import { 
  Activity, 
  User, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function AdminProgressPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchClaims = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await getAdminClaims(page, 20);
      if (data) {
        setClaims(data.claims || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách tiến độ");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    fetchClaims();

    // SSE Real-time Updates
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
    };
    
    const token = getCookie("user_token_local");
    if (!token) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/stream?token=${token}`
    );

    eventSource.addEventListener("claims_update", (event) => {
      console.log("[SSE] Claims update received");
      setIsRefreshing(true);
      fetchClaims(true);
      toast.info("Có lượt vượt link mới!", { duration: 2000 });
    });

    return () => eventSource.close();
  }, [fetchClaims]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
            <Clock className="w-3 h-3" /> Đang đợi
          </span>
        );
      case "failed":
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="w-3 h-3" /> Thất bại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Tiến độ vượt link
          </h1>
          <p className="text-muted-foreground text-sm">
            Theo dõi thời gian thực các lượt thực hiện nhiệm vụ của người dùng.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => fetchClaims()}
                className={`p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
            >
                <RefreshCw className="w-4 h-4" />
            </button>
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/20">
                Tổng cộng: {total} lượt
            </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Nhiệm vụ / Phần thưởng</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">IP / Thiết bị</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Chưa có dữ liệu vượt link nào.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                          {claim.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{claim.username}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{claim.user_id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                          {claim.task_title}
                        </div>
                        <div className="text-xs text-green-500 font-bold">
                          +{claim.reward.toLocaleString()} VND
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                           <Search className="w-3 h-3" /> {claim.ip_address || "N/A"}
                        </div>
                        <div className="max-w-[150px] truncate opacity-50 italic">
                          {claim.user_agent || "Unknown Browser"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1.5">
                           <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                           <span>Bắt đầu: {formatDate(claim.claimed_at)}</span>
                        </div>
                        {claim.completed_at && (
                          <div className="flex items-center gap-1.5 text-green-500 font-medium">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                             <span>Xong: {formatDate(claim.completed_at)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
