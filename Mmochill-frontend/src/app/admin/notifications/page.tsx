"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, Send, Info, CheckCircle, AlertTriangle, XCircle, Megaphone, Trash2, Clock, History, CheckSquare, Square, X } from "lucide-react";
import { sendGlobalNotification, getSentNotifications, deleteNotification, bulkDeleteNotifications } from "@/app/actions/admin";
import { toast } from "sonner";
import { useLoading } from "@/lib/contexts/loading-context";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminNotificationsPage() {
  const { showLoading, hideLoading } = useLoading();
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    category: "system"
  });

  const fetchSent = useCallback(async () => {
    const data = await getSentNotifications();
    setSentNotifications(data);
  }, []);

  useEffect(() => {
    fetchSent();
  }, [fetchSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung");
      return;
    }

    showLoading();
    const res = await sendGlobalNotification(formData);
    hideLoading();

    if (res.success) {
      toast.success("Thông báo đã gửi thành công!");
      setFormData({ title: "", message: "", type: "info", category: "system" });
      fetchSent();
    } else {
      toast.error(res.error || "Gửi thông báo thất bại");
    }
  };

  const handleDelete = async (id: string, groupId?: string) => {
    if (!confirm("Xóa thông báo này ở tất cả người dùng?")) return;

    showLoading();
    const res = await deleteNotification(id, groupId);
    hideLoading();

    if (res.success) {
      toast.success("Đã xóa!");
      fetchSent();
      // Clear selection if deleted item was selected
      if (groupId) {
        setSelectedGroupIds(prev => { const n = new Set(prev); n.delete(groupId); return n; });
      } else {
        setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      }
    }
  };

  const toggleSelect = (id: string, groupId?: string) => {
    if (groupId) {
      setSelectedGroupIds(prev => {
        const next = new Set(prev);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const isSelected = (id: string, groupId?: string) => {
    if (groupId) return selectedGroupIds.has(groupId);
    return selectedIds.has(id);
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size + selectedGroupIds.size;
    if (count === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${count} mục đã chọn?`)) return;

    showLoading();
    const res = await bulkDeleteNotifications({
      ids: Array.from(selectedIds),
      group_ids: Array.from(selectedGroupIds)
    });
    hideLoading();

    if (res.success) {
      toast.success(`Đã xóa ${count} mục!`);
      setSelectedIds(new Set());
      setSelectedGroupIds(new Set());
      fetchSent();
    } else {
      toast.error("Xóa hàng loạt thất bại");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size + selectedGroupIds.size === sentNotifications.length) {
      setSelectedIds(new Set());
      setSelectedGroupIds(new Set());
    } else {
      const newIds = new Set<string>();
      const newGIds = new Set<string>();
      sentNotifications.forEach(n => {
        if (n.group_id) newGIds.add(n.group_id);
        else newIds.add(n.id);
      });
      setSelectedIds(newIds);
      setSelectedGroupIds(newGIds);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto min-h-screen pb-20">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          Notification Management
        </h1>
        <p className="text-muted-foreground italic">Quản lý và điều phối thông báo toàn hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: STICKY FORM */}
        <div className="xl:col-span-5 flex flex-col gap-6 sticky top-4 self-start">
          <div className="bg-card border border-border rounded-3xl p-5 shadow-xl relative overflow-hidden group/form">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover/form:scale-110 transition-transform">
               <Send className="w-32 h-32 text-primary" />
            </div>
            
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
               <div className="w-1.5 h-6 bg-primary rounded-full" />
               Soạn thảo thông báo
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-muted-foreground ml-1">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tiêu đề thông báo..."
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-muted-foreground ml-1">Nội dung</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Nội dung chi tiết..."
                  rows={3}
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-muted-foreground ml-1">Mức độ</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-muted-foreground ml-1">Loại</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold"
                  >
                    <option value="system">Hệ thống</option>
                    <option value="task">Nhiệm vụ</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 bg-primary text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-95 group/btn"
              >
                GỬI NGAY
                <Send className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Preview Bubble */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
             <h3 className="text-[10px] font-black uppercase text-primary/60 mb-4 tracking-widest flex items-center gap-2">
                <Megaphone className="w-3 h-3" />
                Live Preview
             </h3>
             <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex gap-4 ring-1 ring-primary/5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  formData.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                  formData.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                  formData.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {formData.type === 'success' ? <CheckCircle className="w-6 h-6" /> : 
                   formData.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : 
                   formData.type === 'error' ? <XCircle className="w-6 h-6" /> :
                   <Info className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{formData.title || "Chưa có tiêu đề"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed italic">
                    {formData.message || "Nội dung sẽ hiện ở đây..."}
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY TABLE */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <History className="w-6 h-6 text-primary" />
               <h2 className="text-xl font-bold">Lịch sử gửi</h2>
            </div>
            {sentNotifications.length > 0 && (
               <button 
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-primary hover:underline"
               >
                  {selectedIds.size + selectedGroupIds.size === sentNotifications.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
               </button>
            )}
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm relative">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-muted/30 border-b border-border">
                         <th className="pl-6 w-10 py-4">
                            <button onClick={toggleSelectAll}>
                               {selectedIds.size + selectedGroupIds.size === sentNotifications.length && sentNotifications.length > 0 ? 
                                  <CheckSquare className="w-4 h-4 text-primary" /> : 
                                  <Square className="w-4 h-4 text-muted-foreground/30" />
                               }
                            </button>
                         </th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Thông báo</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-center">Phân loại</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-right">Thao tác</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border/50">
                      {sentNotifications.length > 0 ? sentNotifications.map((note) => (
                         <tr 
                            key={note.id} 
                            onClick={() => toggleSelect(note.id, note.group_id)}
                            className={`hover:bg-muted/20 transition-colors group cursor-pointer ${isSelected(note.id, note.group_id) ? 'bg-primary/5' : ''}`}
                         >
                            <td className="pl-6 py-4">
                               {isSelected(note.id, note.group_id) ? 
                                  <CheckSquare className="w-4 h-4 text-primary" /> : 
                                  <Square className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                               }
                            </td>
                            <td className="px-4 py-4">
                               <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                     note.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                                     note.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                                     note.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                  }`}>
                                     {note.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : 
                                      note.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : 
                                      note.type === 'error' ? <XCircle className="w-3.5 h-3.5" /> :
                                      <Info className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                     <span className="text-sm font-bold truncate max-w-[200px]">{note.title}</span>
                                     <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {new Date(note.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                     </span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                               <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ring-1 ring-inset ${
                                  note.category === 'task' ? 'bg-purple-500/10 text-purple-600 ring-purple-500/20' : 'bg-blue-500/10 text-blue-600 ring-blue-500/20'
                               }`}>
                                  {note.category === 'task' ? 'Task' : 'Sys'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id, note.group_id); }}
                                  className="p-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                               >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                         </tr>
                      )) : (
                         <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic text-sm">
                               Lịch sử thông báo trống.
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR FOR BULK ACTIONS */}
      <AnimatePresence>
        {(selectedIds.size + selectedGroupIds.size > 0) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-8 ring-4 ring-primary/20 min-w-[350px]"
          >
            <div className="flex items-center gap-4 border-r border-background/20 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-black text-white shadow-lg shadow-primary/30">
                {selectedIds.size + selectedGroupIds.size}
              </div>
              <p className="text-sm font-bold uppercase tracking-tighter">Đã chọn</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                XÓA MỤC ĐÃ CHỌN
              </button>
              <button 
                onClick={() => { setSelectedIds(new Set()); setSelectedGroupIds(new Set()); }}
                className="bg-background/10 hover:bg-background/20 text-background font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-background/10"
              >
                <X className="w-4 h-4" />
                HỦY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
