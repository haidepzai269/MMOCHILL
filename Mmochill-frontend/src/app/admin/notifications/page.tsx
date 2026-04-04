"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  MoreVertical,
  Trash2,
  Filter,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminAlerts, markAdminAlertsAsRead } from "@/app/actions/admin";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"payment" | "task">("payment");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchAlerts = useCallback(async (p = 1, cat = activeTab) => {
    setLoading(true);
    const res = await getAdminAlerts(p, 20, cat);
    if (res) {
      setAlerts(res.alerts || []);
      setTotal(res.total || 0);
      
      // Auto-mark as read for current view
      if (res.alerts && res.alerts.some((a: any) => !a.is_read)) {
        await markAdminAlertsAsRead(res.alerts.filter((a: any) => !a.is_read).map((a: any) => a.id));
      }
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchAlerts(1, activeTab);
  }, [activeTab, fetchAlerts]);

  const handleMarkAsRead = async (id?: string) => {
    const res = await markAdminAlertsAsRead(id ? [id] : undefined);
    if (res.success) {
      toast.success("Đã đánh dấu là đã đọc");
      fetchAlerts(page, activeTab);
    }
  };

  const getIcon = (category: string, type: string) => {
    if (category === "payment") {
      return <CreditCard className={`w-5 h-5 ${type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`} />;
    }
    return <Zap className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo hệ thống</h1>
          <p className="text-muted-foreground text-sm mt-1">Theo dõi các yêu cầu duyệt tiền và hoạt động của người dùng.</p>
        </div>
        <button 
          onClick={() => handleMarkAsRead()}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-all rounded-xl text-sm font-bold border border-primary/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          Đọc tất cả
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-card border border-border/50 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "payment" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"}`}
        >
          <CreditCard className="w-4 h-4" />
          Duyệt Tiền
        </button>
        <button
          onClick={() => setActiveTab("task")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "task" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"}`}
        >
          <Zap className="w-4 h-4" />
          Nhiệm Vụ
        </button>
      </div>

      {/* Alerts List */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center"
            >
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-sm font-medium">Đang tải dữ liệu...</p>
            </motion.div>
          ) : alerts.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="divide-y divide-border/50"
            >
              {alerts.map((alert, index) => (
                <div 
                  key={alert.id}
                  className={`p-5 flex gap-4 transition-all hover:bg-muted/30 group ${!alert.is_read ? 'bg-primary/[0.02]' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${!alert.is_read ? 'bg-primary/10 border border-primary/20' : 'bg-muted border border-border/50'}`}>
                    {getIcon(alert.category, alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold transition-colors ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {alert.title}
                      </h3>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${!alert.is_read ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                      {alert.message}
                    </p>

                    {alert.data && (
                       <div className="mt-3 p-3 bg-muted/40 rounded-xl border border-border/40 text-xs text-muted-foreground flex flex-wrap gap-4 font-mono">
                          {Object.entries(alert.data).map(([key, val]: [string, any]) => (
                            <div key={key} className="flex gap-1">
                              <span className="text-primary/70">{key}:</span>
                              <span className="text-foreground/70 font-bold">{val}</span>
                            </div>
                          ))}
                       </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    {!alert.is_read ? (
                      <button 
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="p-2.5 rounded-xl hover:bg-primary/10 text-primary transition-all opacity-0 group-hover:opacity-100"
                        title="Đánh dấu là đã đọc"
                      >
                         <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="p-2.5 opacity-40">
                         <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                <Bell className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <h3 className="font-bold text-lg">Hộp thư trống</h3>
              <p className="text-muted-foreground text-sm max-w-[250px] mx-auto mt-2">
                Không tìm thấy thông báo nào trong danh mục {activeTab === "payment" ? "Duyệt Tiền" : "Nhiệm Vụ"}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination (Simplified) */}
      {total > 20 && (
         <div className="flex items-center justify-center gap-2">
            <button 
               disabled={page === 1}
               onClick={() => setPage(p => p - 1)}
               className="px-4 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30"
            >
               Trước
            </button>
            <span className="text-sm font-bold px-4">Trang {page}</span>
            <button 
               disabled={page * 20 >= total}
               onClick={() => setPage(p => p + 1)}
               className="px-4 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30"
            >
               Sau
            </button>
         </div>
      )}
    </div>
  );
}
