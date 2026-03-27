"use client";

import {
  Moon,
  Sun,
  Bell,
  Search,
  User,
  LogOut,
  Wallet,
  CheckCircle,
  Info,
  AlertCircle,
  Check,
  CheckCircle2,
  Facebook,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProfile, userLogout } from "@/app/actions/auth";
import {
  getNotifications,
  markAsRead,
  markAllNotificationsAsRead,
} from "@/app/actions/notifications";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { toast } from "sonner";
import RankBadge from "./rank-badge";
import { ZaloIcon } from "./icons/zalo-icon";

export default function PCHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const initData = async () => {
      const [profile, notes] = await Promise.all([
        getUserProfile(),
        getNotifications(),
      ]);
      if (profile) setUser(profile);
      if (notes) setNotifications(notes);
    };
    initData();

    // SSE Real-time notifications
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_token_local="))
      ?.split("=")[1];
    if (!token) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/stream?token=${token}`,
    );
    console.log(
      "[SSE] Connecting to:",
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/stream`,
    );

    eventSource.onopen = () =>
      console.log("[SSE] Connection established successfully");

    eventSource.addEventListener("notifications", async (event) => {
      console.log("[SSE] Received notifications event");
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Notifications data count:", data.length);
        setNotifications(data);
        // Also update profile/balance as it likely changed
        const profile = await getUserProfile();
        if (profile) setUser(profile);
      } catch (err) {
        console.error("[SSE] Failed to parse notifications", err);
      }
    });

    eventSource.addEventListener("account_status", (e) => {
      if (e.data === "banned") {
        toast.error("Tài khoản của bạn đã bị khóa.");
        // Clear cookies
        document.cookie =
          "user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "user_token_local=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/banned";
      }
    });

    eventSource.onerror = (err) => {
      console.error("[SSE] Connection error/closed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLogout = async () => {
    await userLogout();
  };

  const [activeTab, setActiveTab] = useState<"system" | "task">("system");

  const handleMarkAsRead = async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotes = notifications.filter(
    (n) => (n.category || "system") === activeTab,
  );
  const systemUnread = notifications.filter(
    (n) => !n.is_read && (n.category || "system") === "system",
  ).length;
  const taskUnread = notifications.filter(
    (n) => !n.is_read && n.category === "task",
  ).length;

  return (
    <header className="hidden md:flex h-16 items-center justify-between px-8 bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tìm kiếm nhiệm vụ, lịch sử..."
          className="w-full bg-muted/50 border border-border/50 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative group/note p-1">
          <button className="relative p-2.5 rounded-full hover:bg-muted transition-all text-foreground/80 group-hover/note:bg-primary/10 group-hover/note:text-primary">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border-2 border-background text-[9px] font-black text-white flex items-center justify-center shadow-lg shadow-rose-500/20"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Dropdown Menu - Notifications */}
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all duration-300 translate-y-2 group-hover/note:translate-y-0 z-50 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between mb-3 gap-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">Thông báo</h4>
                  {unreadCount > 0 && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black ring-1 ring-primary/20 tracking-tighter">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-muted-foreground hover:text-primary font-bold transition-colors flex items-center gap-1 group/mark"
                  >
                    <CheckCircle2 className="w-3 h-3 group-hover/mark:scale-110 transition-transform" />
                    Đọc tất cả
                  </button>
                )}
              </div>

              {/* Tabs UI */}
              <div className="flex p-1 bg-background/50 rounded-xl border border-border/50 relative">
                <button
                  onClick={() => setActiveTab("system")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-bold rounded-lg transition-all relative z-10 ${activeTab === "system" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Hệ thống
                  {systemUnread > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("task")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-bold rounded-lg transition-all relative z-10 ${activeTab === "task" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Nhiệm vụ
                  {taskUnread > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
                {/* Slider background */}
                <div
                  className={`absolute inset-y-1 w-[calc(50%-4px)] bg-card border border-border/50 rounded-lg shadow-sm transition-all duration-300 ease-out ${activeTab === "system" ? "left-1" : "left-[calc(50%+2px)]"}`}
                />
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[100px]">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => !note.is_read && handleMarkAsRead(note.id)}
                    className={`p-3 rounded-xl transition-colors cursor-pointer flex gap-3 ${note.is_read ? "opacity-60 hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        note.type === "success"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : note.type === "warning"
                            ? "bg-orange-500/10 text-orange-500"
                            : note.type === "error"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {note.category === "task" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${!note.is_read ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {note.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {note.message}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-1.5 font-medium italic">
                        {new Date(note.created_at).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                    </div>
                    {!note.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto opacity-20 mb-2" />
                  <p className="text-xs">
                    Không có thông báo{" "}
                    {activeTab === "system" ? "hệ thống" : "nhiệm vụ"} nào
                  </p>
                </div>
              )}
            </div>
            {filteredNotes.length > 0 && (
              <div className="p-2 border-t border-border bg-muted/20">
                <button className="w-full py-2 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  Xem tất cả
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mr-4">
          <Link
            href="https://m.me/quang.vu.uc.579118"
            target="_blank"
            className="p-2.5 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.1)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 flex items-center justify-center border border-blue-500/20"
            title="Facebook Messenger"
          >
            <Facebook className="w-4 h-4" />
          </Link>
          <Link
            href="https://zalo.me/0399109399"
            target="_blank"
            className="p-2.5 rounded-full bg-blue-400/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-110 active:scale-95 flex items-center justify-center border border-blue-400/20"
            title="Zalo"
          >
            <ZaloIcon className="w-4 h-4" />
          </Link>
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-full hover:bg-muted transition-colors text-foreground/80"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        )}

        <div className="h-8 w-px bg-border/50 mx-1"></div>

        {/* User Dropdown Section */}
        <div className="relative group p-1">
          <div className="flex items-center gap-3 cursor-pointer group-hover:opacity-80 transition-all">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">
                {user?.full_name || user?.username || "Thành viên"}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold">
                  ID: {user?.display_id || "-------"}
                </span>
                <RankBadge peakBalance={user?.peak_balance || 0} />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden relative transition-transform group-hover:scale-105 shadow-inner flex items-center justify-center">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <p className="text-sm font-bold truncate">
                {user?.full_name || user?.username || "Người dùng"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                {user?.email}
              </p>
            </div>
            <div className="p-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors group/item"
              >
                <User className="w-4 h-4 text-muted-foreground group-hover/item:text-primary" />
                Tài khoản
              </Link>
              <Link
                href="/tasks"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors group/item"
              >
                <CheckCircle className="w-4 h-4 text-muted-foreground group-hover/item:text-primary" />
                Làm nhiệm vụ
              </Link>
              <Link
                href="/wallet"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors group/item"
              >
                <Wallet className="w-4 h-4 text-muted-foreground group-hover/item:text-primary" />
                Rút tiền
              </Link>
              <div className="h-px bg-border my-1 mx-2"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-red-500 hover:bg-red-500/10 transition-colors group/logout"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
