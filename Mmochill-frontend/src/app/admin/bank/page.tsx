"use client";

import {
  Landmark,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  Navigation,
  DollarSign,
  User,
  History,
  CreditCard,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "@/app/actions/admin";
import { toast } from "sonner";
import { useLoading } from "@/lib/contexts/loading-context";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminBankPage() {
  const { showLoading, hideLoading } = useLoading();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    showLoading();
    const res = await getAdminWithdrawals(statusFilter);
    setWithdrawals(res || []);
    hideLoading();
  };

  useEffect(() => {
    fetchWithdrawals();

    // SSE Real-time withdrawal updates
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return decodeURIComponent(parts.pop()?.split(";").shift() || "");
      return null;
    };

    const token = getCookie("user_token_local");
    if (!token) {
      console.warn(
        "[SSE] No token found in cookies, skipping real-time updates.",
      );
      return;
    }

    const sseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/stream?token=${token}`;
    console.log("[SSE] Connecting to:", sseUrl.split("?")[0]);
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log("[SSE] Connected successfully to admin stream");
    };

    eventSource.onerror = (e) => {
      console.error("[SSE] Connection error:", e);
      // toast.error("Mất kết nối realtime với máy chủ. Vui lòng F5 trang.");
    };

    eventSource.addEventListener("withdrawals_update", (event) => {
      console.log("[SSE] Received withdrawals_update event:", event.data);
      fetchWithdrawals();

      if (event.data === "new") {
        toast.info("Có yêu cầu rút tiền mới!", {
          icon: <DollarSign className="w-4 h-4 text-primary" />,
          duration: 5000,
        });
      }
    });

    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm("Xác nhận bạn đã chuyển khoản thành công?")) return;

    startTransition(async () => {
      const res = await approveWithdrawal(id);
      if (res.success) {
        toast.success("Đã duyệt yêu cầu rút tiền thành công!");
        fetchWithdrawals();
      } else {
        toast.error("Lỗi khi duyệt yêu cầu.");
      }
    });
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Nhập lý do từ chối (không bắt buộc):");
    if (reason === null) return;

    startTransition(async () => {
      const res = await rejectWithdrawal(id); // Backend currently doesn't take reason, but could be added
      if (res.success) {
        toast.success("Đã từ chối yêu cầu.");
        fetchWithdrawals();
      } else {
        toast.error("Lỗi khi từ chối yêu cầu.");
      }
    });
  };

  const filteredWithdrawals = withdrawals.filter(
    (w) =>
      w.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.account_number?.includes(searchTerm) ||
      w.user_id?.includes(searchTerm),
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Landmark className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Hệ thống Thanh toán
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            Quản lý và phê duyệt các yêu cầu rút tiền từ người dùng. Hãy đảm bảo
            bạn đã bank thành công trước khi nhấn duyệt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1 bg-card border border-border rounded-2xl shadow-sm">
          {[
            { id: "pending", label: "Chờ Duyệt", icon: Clock },
            { id: "approved", label: "Đã Thanh Toán", icon: CheckCircle2 },
            { id: "rejected", label: "Đã Từ Chối", icon: XCircle },
            { id: "", label: "Tất Cả", icon: History },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Stats & Search bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Tìm kiếm theo STK, tên chủ thẻ hoặc User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-3.5 pl-11 pr-4 text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-2xl px-5 py-3.5">
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase font-black text-primary/70">
              Tổng:
            </span>
            <span className="text-lg font-black text-primary leading-none">
              {filteredWithdrawals.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table-like List */}
      <div className="flex flex-col gap-3">
        {/* Table Header (Desktop) */}
        <div className="hidden md:grid grid-cols-6 gap-4 px-8 py-4 bg-muted/30 rounded-2xl text-[10px] uppercase font-black tracking-widest text-muted-foreground">
          <div className="col-span-2">Người rút & Thời gian</div>
          <div>Phương thức</div>
          <div className="text-right">Số tiền</div>
          <div className="text-center">Trạng thái</div>
          <div className="text-right">Hành động</div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredWithdrawals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border border-dashed rounded-[32px] py-24 text-center shadow-inner"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Landmark className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-bold">
                Không có yêu cầu rút tiền nào.
              </p>
            </motion.div>
          ) : (
            filteredWithdrawals.map((w, index) => {
              const isExpanded = expandedId === w.id;

              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group bg-card border ${isExpanded ? "border-primary shadow-2xl shadow-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"} rounded-[24px] overflow-hidden transition-all duration-300`}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : w.id)}
                    className="flex flex-col md:grid md:grid-cols-6 items-center gap-4 p-5 md:px-8 cursor-pointer relative"
                  >
                    <div className="col-span-2 flex items-center gap-4 w-full">
                      <div
                        className={`w-12 h-12 rounded-2xl ${isExpanded ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"} flex items-center justify-center transition-all duration-500`}
                      >
                        <User className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate">
                          {w.user_id}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 uppercase">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(w.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-auto">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-border/50">
                        {w.method === "bank" ? (
                          <Landmark className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-pink-500" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-tight">
                          {w.bank_name || "Ví MoMo"}
                        </span>
                      </div>
                    </div>

                    <div className="w-full md:text-right">
                      <p className="text-xl font-black text-white tracking-tighter">
                        {w.amount?.toLocaleString()}{" "}
                        <span className="text-xs text-primary font-bold">
                          đ
                        </span>
                      </p>
                    </div>

                    <div className="flex justify-center w-full">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                          w.status === "pending"
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            : w.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        <div
                          className={`w-1 h-1 rounded-full ${
                            w.status === "pending"
                              ? "bg-orange-500"
                              : w.status === "approved"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                          }`}
                        />
                        {w.status === "pending"
                          ? "Chờ duyệt"
                          : w.status === "approved"
                            ? "Thành công"
                            : "Từ chối"}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 w-full">
                      <div
                        className={`p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors ${isExpanded ? "rotate-180 bg-primary/10 text-primary" : ""}`}
                      >
                        <Navigation className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content (Dropdown) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                      >
                        <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border/50 bg-muted/10">
                          <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="bg-background/50 border border-border p-5 rounded-[22px] group/item relative overflow-hidden"
                            >
                              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">
                                SỐ TÀI KHOẢN
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-black font-mono tracking-widest text-primary">
                                  {w.account_number}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      w.account_number,
                                    );
                                    toast.success("Đã copy số tài khoản!");
                                  }}
                                  className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="absolute top-0 right-0 p-1 opacity-5">
                                <Landmark className="w-16 h-16" />
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.15 }}
                              className="bg-background/50 border border-border p-5 rounded-[22px]"
                            >
                              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">
                                CHỦ TÀI KHOẢN
                              </p>
                              <p className="text-xl font-black uppercase tracking-tight">
                                {w.account_name}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-bold text-muted-foreground">
                                  XÁC MINH CHÍNH CHỦ
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              </div>
                            </motion.div>
                          </div>

                          <div className="flex flex-col gap-2 justify-center">
                            {w.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleApprove(w.id)}
                                  disabled={isPending}
                                  className="h-14 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                  DUYỆT BK
                                </button>
                                <button
                                  onClick={() => handleReject(w.id)}
                                  disabled={isPending}
                                  className="h-14 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                >
                                  <XCircle className="w-5 h-5" />
                                  TỪ CHỐI
                                </button>
                              </>
                            ) : (
                              <div className="h-28 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 grayscale bg-muted/5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                  ĐÃ XỬ LÝ
                                </p>
                                <History className="w-6 h-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
