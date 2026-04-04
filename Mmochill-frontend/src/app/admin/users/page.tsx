"use client";

import { Users as UsersIcon, Search, Filter, MoreHorizontal, ShieldOff, ShieldCheck, Loader2, Trophy, Mail, Calendar, Wallet, User as UserIcon, X, CheckCircle, ExternalLink, Zap } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { getAdminUsers, banUser } from "@/app/actions/admin";
import { toast } from "sonner";
import { useLoading } from "@/lib/contexts/loading-context";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsersPage() {
  const { showLoading, hideLoading } = useLoading();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = async () => {
    showLoading();
    const res = await getAdminUsers(page, 10, search, filter);
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
  }, [page, search, filter]);

  const handleBanToggle = async (userId: string, currentStatus: string) => {
    const action = currentStatus === 'banned' ? 'unban' : 'ban';
    startTransition(async () => {
      const res = await banUser(userId, action);
      if (res.success) {
        toast.success(`User ${action}ned successfully`);
        // if modal is open, update selectedUser locally
        if (selectedUser?.id === userId) {
            setSelectedUser({ ...selectedUser, status: action === 'ban' ? 'banned' : 'active' });
        }
        fetchUsers();
      } else {
        toast.error(res.error || `Failed to ${action} user`);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tighter">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-primary" />
            </div>
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Quản lý và theo dõi hiệu suất làm việc của hội viên (Tổng: {total})
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-card/50 backdrop-blur-md border border-border/50 p-4 rounded-[2rem] shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email, display ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/30">
            <button 
                onClick={() => setFilter(filter === "" ? "has_completed_tasks" : "")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === "has_completed_tasks" ? "bg-primary text-white shadow-lg shadow-primary/25" : "hover:bg-muted text-muted-foreground"}`}
            >
                <Zap className={`w-3.5 h-3.5 ${filter === "has_completed_tasks" ? "fill-white" : ""}`} />
                Người đang làm việc
            </button>
            <div className="w-px h-6 bg-border/50 mx-1" />
            <button 
                onClick={() => setFilter("")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === "" ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "hover:bg-muted text-muted-foreground"}`}
            >
                Bình thường
            </button>
        </div>
      </div>

      {/* Modern Table Grid */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-xl shadow-primary/5">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Mã ID</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Thành viên</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Số dư hiện tại</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Nhiệm vụ</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-primary/[0.02] transition-all cursor-pointer group"
                  >
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-muted/50 rounded-lg text-xs font-mono font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">{user.display_id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/20 via-blue-500/10 to-indigo-600/20 p-0.5 group-hover:rotate-6 transition-transform duration-500">
                          <div className="w-full h-full rounded-[0.875rem] bg-card flex items-center justify-center text-primary text-sm font-black uppercase overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                user.username?.charAt(0) || user.email?.charAt(0)
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-black leading-none group-hover:text-primary transition-colors">{user.username || user.full_name || 'No Name'}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground">{user.balance?.toLocaleString()}đ</span>
                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter">VND Wallet</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50 text-xs font-black ${user.completed_tasks_count > 0 ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : "bg-muted text-muted-foreground/50"}`}>
                            <Trophy className={`w-3.5 h-3.5 ${user.completed_tasks_count > 0 ? "fill-orange-600" : ""}`} />
                            {user.completed_tasks_count || 0}
                        </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex items-center justify-between px-6 py-4 bg-card/30 backdrop-blur-sm border border-border rounded-[2rem]">
        <p className="text-xs font-bold text-muted-foreground/60">Đang xem {users.length} trên {total} thành viên</p>
        <div className="flex gap-2">
           <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-6 py-2.5 bg-background border border-border rounded-xl text-xs font-black disabled:opacity-30 hover:bg-muted transition-colors active:scale-95"
           >
             Trang trước
           </button>
           <button 
            disabled={users.length < 10}
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2.5 bg-primary text-primary-foreground border border-primary/20 rounded-xl text-xs font-black disabled:opacity-30 hover:bg-primary/90 transition-colors active:scale-95"
           >
             Trang tiếp
           </button>
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
            <>
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedUser(null)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                />
                
                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -20 }}
                    className="fixed inset-x-4 top-20 bottom-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-card border border-border rounded-[3rem] shadow-2xl z-[101] overflow-hidden flex flex-col"
                >
                    {/* Modal Header */}
                    <div className="relative h-48 bg-gradient-to-br from-primary via-blue-600 to-indigo-900 overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl -mb-10 -ml-10" />
                        
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-6 right-6 p-2.5 rounded-2xl bg-black/20 hover:bg-black/40 text-white/80 transition-colors z-20 backdrop-blur-md border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 transform translate-y-12">
                            <div className="flex items-end gap-6 text-white text-left">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-card p-1 shadow-2xl rotate-3">
                                    <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-tr from-muted to-background flex items-center justify-center text-primary text-4xl font-black uppercase overflow-hidden">
                                        {selectedUser.avatar_url ? (
                                            <img src={selectedUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            selectedUser.username?.charAt(0) || selectedUser.email?.charAt(0)
                                        )}
                                    </div>
                                </div>
                                <div className="mb-14">
                                    <h2 className="text-3xl font-black tracking-tighter leading-none mb-2">{selectedUser.username || selectedUser.full_name}</h2>
                                    <p className="text-white/60 text-sm font-medium flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" />
                                        {selectedUser.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 mt-14 space-y-8">
                        {/* Status Bar */}
                        <div className="flex items-center justify-between p-6 bg-muted/30 rounded-3xl border border-border/50">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${selectedUser.status === 'active' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`} />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Trạng thái tài khoản</p>
                                    <p className="text-sm font-black uppercase tracking-wider">{selectedUser.status}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleBanToggle(selectedUser.id, selectedUser.status)}
                                disabled={isPending}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${selectedUser.status === 'banned' ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedUser.status === 'banned' ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />)}
                                {selectedUser.status === 'banned' ? 'MỞ KHÓA' : 'KHÓA TÀI KHOẢN'}
                            </button>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-card border border-border rounded-3xl hover:border-primary/30 transition-colors group/item">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover/item:scale-110 transition-transform">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Số dư hiện tại</p>
                                <p className="text-xl font-black text-foreground">{selectedUser.balance?.toLocaleString()} VNĐ</p>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-3xl hover:border-orange-500/30 transition-colors group/item">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 group-hover/item:scale-110 transition-transform">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Nhiệm vụ đã hoàn thành</p>
                                <p className="text-xl font-black text-foreground">{selectedUser.completed_tasks_count || 0} Task</p>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-3xl hover:border-blue-500/30 transition-colors group/item">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover/item:scale-110 transition-transform">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Mã hiển thị</p>
                                <p className="text-xl font-black text-foreground">{selectedUser.display_id}</p>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-3xl hover:border-indigo-500/30 transition-colors group/item">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 group-hover/item:scale-110 transition-transform">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Ngày tham gia</p>
                                <p className="text-base font-black text-foreground">{new Date(selectedUser.created_at).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-border bg-muted/10 shrink-0">
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="w-full py-4 text-sm font-black bg-background border border-border rounded-2xl hover:bg-muted transition-colors active:scale-95"
                        >
                            ĐÓNG CỬA SỔ
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
