"use client";

import { useNotifications } from "@/lib/contexts/notification-context";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NotificationBanner() {
  const { notifications } = useNotifications();
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const pathname = usePathname();

  // Chỉ lấy thông báo mới nhất chưa đọc hoặc thông báo mới nhất nói chung
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setLatestNotification(notifications[0]);
    }
  }, [notifications]);

  // Không hiển thị nếu đang ở trang thông báo hoặc không có thông báo
  if (pathname === "/notifications" || !latestNotification) {
    return null;
  }

  return (
    <div className="px-4 py-2 bg-background/50 backdrop-blur-sm border-b border-border/30 relative z-40 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={latestNotification.id}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <Link 
            href="/notifications"
            className="flex items-center gap-3 bg-muted/40 hover:bg-muted/60 transition-colors p-2 rounded-xl border border-border/20 group"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${latestNotification.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary animate-pulse'}`}>
              <Bell className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-foreground/90 truncate leading-tight">
                {latestNotification.title}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                {latestNotification.message}
              </p>
            </div>
            
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </Link>
        </motion.div>
      </AnimatePresence>
      
      {/* Decorative gradient for "chìm" effect */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </div>
  );
}
