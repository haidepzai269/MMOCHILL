"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNotifications } from "@/lib/contexts/notification-context";
import { markAsRead } from "@/app/actions/notifications";
import { 
    Bell, 
    CheckCheck, 
    ChevronRight, 
    Clock, 
    Info, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Calendar,
    ArrowLeft,
    Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const NotificationIcon = ({ type, className }: { type: string, className?: string }) => {
    switch (type) {
        case "success": return <CheckCircle2 className={cn("text-emerald-400", className)} />;
        case "error": return <XCircle className={cn("text-rose-400", className)} />;
        case "warning": return <AlertTriangle className={cn("text-amber-400", className)} />;
        default: return <Info className={cn("text-blue-400", className)} />;
    }
};

export default function NotificationsPage() {
    const params = useParams();
    const router = useRouter();
    const { notifications, unreadCount, total, hasMore, refreshNotifications, loadMore, setNotifications } = useNotifications();
    
    // params.id is an array due to [[...id]]
    const activeId = params.id?.[0];
    const [isMobileView, setIsMobileView] = useState(false);
    const processingIds = React.useRef<Set<string>>(new Set());

    const selectedNotification = useMemo(() => {
        return notifications.find(n => n.id === activeId);
    }, [notifications, activeId]);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (activeId && selectedNotification && !selectedNotification.is_read && !processingIds.current.has(activeId)) {
            handleMarkAsRead(activeId);
        }
    }, [activeId, selectedNotification]);

    const handleMarkAsRead = async (id: string) => {
        if (processingIds.current.has(id)) return;
        
        processingIds.current.add(id);
        const res = await markAsRead(id);
        if (res.success) {
            // Update local state for immediate feedback
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } else {
            // If failed, allow retry
            processingIds.current.delete(id);
        }
    };

    const handleSelectNotification = (id: string) => {
        router.push(`/notifications/${id}`);
    };

    const handleBackToList = () => {
        router.push("/notifications");
    };

    return (
        <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden gap-4 p-2 md:p-4">
            {/* Left Sidebar: Notification List */}
            <div className={cn(
                "flex flex-col w-full md:w-[380px] lg:w-[420px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-all duration-500",
                isMobileView && activeId ? "hidden" : "flex"
            )}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-xl">
                            <Bell className="w-5 h-5 text-purple-400" />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Thông báo
                        </h1>
                    </div>
                    {notifications.some(n => !n.is_read) && (
                        <button 
                            onClick={() => refreshNotifications()}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Làm mới
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                            <Inbox className="w-12 h-12 mb-4" />
                            <p>Chưa có thông báo nào</p>
                        </div>
                    ) : (
                        <>
                            {notifications.map((n, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={n.id}
                                    onClick={() => handleSelectNotification(n.id)}
                                    className={cn(
                                        "group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border",
                                        activeId === n.id 
                                            ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                                            : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "mt-1 p-2 rounded-xl h-fit",
                                            activeId === n.id ? "bg-purple-500/20" : "bg-white/5"
                                        )}>
                                            <NotificationIcon type={n.type} className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={cn(
                                                    "font-semibold text-[15px] truncate pr-4 transition-colors",
                                                    !n.is_read ? "text-white" : "text-white/60",
                                                    activeId === n.id && "text-purple-300"
                                                )}>
                                                    {n.title}
                                                </h3>
                                                {!n.is_read && (
                                                    <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                                )}
                                            </div>
                                            <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3 text-[11px] text-white/30 font-medium tracking-wider uppercase">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(n.created_at), "HH:mm - dd/MM", { locale: vi })}
                                            </div>
                                        </div>
                                        <ChevronRight className={cn(
                                            "w-4 h-4 mt-1 transition-all duration-300",
                                            activeId === n.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                        )} />
                                    </div>
                                </motion.div>
                            ))}

                            {hasMore && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        loadMore();
                                    }}
                                    className="w-full py-4 mt-2 mb-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl text-white/40 hover:text-white/80 text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Clock className="w-4 h-4" />
                                    Xem các thông báo cũ hơn
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Right Pane: Details */}
            <div className={cn(
                "flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative transition-all duration-500",
                isMobileView && !activeId ? "hidden" : "block"
            )}>
                <AnimatePresence mode="wait">
                    {!activeId ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="h-full flex flex-col items-center justify-center p-8 text-center"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                                <div className="relative p-8 bg-white/5 rounded-full border border-white/10 shadow-2xl">
                                    <Bell className="w-16 h-16 text-purple-400 opacity-20 animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Hãy chọn thông báo để đọc</h2>
                            <p className="text-white/40 max-w-md leading-relaxed">
                                Danh sách thông báo giúp bạn cập nhật các hoạt động mới nhất về nhiệm vụ, ví tiền và hệ thống.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key={activeId}
                            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="h-full flex flex-col"
                        >
                            {/* Detail Header */}
                            <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-gradient-to-r from-white/5 to-transparent">
                                {isMobileView && (
                                    <button 
                                        onClick={handleBackToList}
                                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-white/60" />
                                    </button>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <NotificationIcon type={selectedNotification?.type || "info"} className="w-5 h-5" />
                                        <span className="text-xs font-bold tracking-widest uppercase text-purple-400">
                                            {selectedNotification?.category || "Hệ thống"}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {selectedNotification?.title}
                                    </h2>
                                </div>
                            </div>

                            {/* Detail Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                                <div className="max-w-3xl">
                                    <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/5">
                                        <div className="flex items-center gap-2 text-white/40 text-sm">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                            <span>Ngày: {selectedNotification ? format(new Date(selectedNotification.created_at), "eeee, dd MMMM yyyy", { locale: vi }) : ""}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/40 text-sm">
                                            <Clock className="w-4 h-4 text-blue-400" />
                                            <span>Giờ: {selectedNotification ? format(new Date(selectedNotification.created_at), "HH:mm:ss") : ""}</span>
                                        </div>
                                    </div>

                                    <div className="prose prose-invert max-w-none text-white/80 text-lg leading-relaxed whitespace-pre-wrap font-light">
                                        {selectedNotification?.message}
                                    </div>

                                    {/* Action Button Section (Dynamic based on notification content) */}
                                    {(selectedNotification?.message.toLowerCase().includes("nhiệm vụ") || selectedNotification?.category === "task") && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => router.push("/tasks")}
                                            className="mt-12 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-bold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all"
                                        >
                                            Đến trang nhiệm vụ ngay
                                        </motion.button>
                                    )}

                                    {selectedNotification?.category === "wallet" && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => router.push("/wallet")}
                                            className="mt-12 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all"
                                        >
                                            Kiểm tra số dư ví
                                        </motion.button>
                                    )}
                                </div>
                            </div>

                            {/* Decorative background Elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
