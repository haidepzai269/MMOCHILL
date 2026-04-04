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
  Facebook,
  MessageCircle,
  Loader2,
  Zap,
  ChevronRight,
  LifeBuoy,
  Trophy,
  CheckCircle2,
  Settings as SettingsIcon,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getUserProfile, userLogout } from "@/app/actions/auth";
import { globalSearch } from "@/app/actions/search";
import { AnimatePresence } from "framer-motion";
import {
  getNotifications,
  markAsRead,
  markAllNotificationsAsRead,
} from "@/app/actions/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { toast } from "sonner";
import RankBadge, { getRankInfo } from "./rank-badge";
import { ZaloIcon } from "./icons/zalo-icon";
import { FacebookIcon } from "./icons/facebook-icon";
import { useAppearance } from "./appearance-provider";
import { FestiveHeaderOverlay } from "./festive-effects/header-overlay";
import { useNotifications } from "@/lib/contexts/notification-context";

export default function PCHeader() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { notifications, setNotifications, unreadCount, refreshNotifications } = useNotifications();

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{tasks: any[], actions: any[]}>({tasks: [], actions: []});
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({tasks: [], actions: []});
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await globalSearch(searchQuery);
      setSearchResults(data);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setMounted(true);
    
    const fetchProfile = async () => {
      const data = await getUserProfile();
      if (data) setUser(data);
    };

    const initData = async () => {
      const profileData = await getUserProfile();
      if (profileData) setUser(profileData);
    };
    initData();

    const handleProfileUpdate = () => {
      initData();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
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

  const filteredNotes = notifications.filter(
    (n) => (n.category || "system") === activeTab,
  );
  const systemUnread = notifications.filter(
    (n) => !n.is_read && (n.category || "system") === "system",
  ).length;
  const taskUnread = notifications.filter(
    (n) => !n.is_read && n.category === "task",
  ).length;

  const { effectiveEvent } = useAppearance();

  return (
    <header className={`hidden md:flex h-16 items-center justify-between px-8 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40 transition-all duration-500 ${effectiveEvent === 'victory_day' ? 'bg-[#da251d] text-white shadow-lg border-none' : 'bg-background/80'}`}>
      <FestiveHeaderOverlay event={effectiveEvent} />
      <div className="relative w-96" ref={searchRef}>
        <div className="relative group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${effectiveEvent === 'victory_day' ? 'text-white' : (isSearchFocused ? 'text-primary' : 'text-muted-foreground')}`} />
          <input
            type="text"
            placeholder="Tìm kiếm nhiệm vụ, rút tiền, hỗ trợ..."
            className={`w-full border rounded-full pl-10 pr-10 py-2.5 text-sm focus:outline-none transition-all font-sans ${effectiveEvent === 'victory_day' ? 'bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30' : 'bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary/30'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Floating Search Results */}
        <AnimatePresence>
          {isSearchFocused && searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col max-h-[480px]"
            >
              <div className="p-2 overflow-y-auto custom-scrollbar">
                {/* Actions Results */}
                {searchResults?.actions?.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-2">Hành động nhanh</h5>
                    {searchResults.actions.map((action, idx) => (
                      <Link 
                        key={idx}
                        href={action.url}
                        onClick={() => setIsSearchFocused(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-all group"
                      >
                         <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            {action.icon === 'Wallet' && <Wallet className="w-3.5 h-3.5" />}
                            {action.icon === 'Zap' && <Zap className="w-3.5 h-3.5" />}
                            {action.icon === 'UserCog' && <User className="w-3.5 h-3.5" />}
                            {action.icon === 'LifeBuoy' && <LifeBuoy className="w-3.5 h-3.5" />}
                            {action.icon === 'Dizzy' && <Trophy className="w-3.5 h-3.5" />}
                         </div>
                         <span className="text-xs font-semibold">{action.title}</span>
                         <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Tasks Results */}
                <div>
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-2">Nhiệm vụ ({searchResults?.tasks?.length || 0})</h5>
                  {searchResults?.tasks?.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.tasks.map((task) => (
                        <Link 
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          onClick={() => setIsSearchFocused(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border/50 group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-lg shrink-0 border border-border/50">
                            {task.provider === 'traffic68' ? '🎁' : '⚡'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h6 className="font-bold text-xs truncate group-hover:text-primary transition-colors">{task.title}</h6>
                            <p className="text-[9px] text-muted-foreground truncate">{task.provider}</p>
                          </div>
                          <div className="text-right">
                             <span className="text-primary font-black text-[11px]">+{task.reward.toLocaleString()}đ</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="py-8 text-center">
                        <p className="text-[11px] text-muted-foreground italic">Không tìm thấy kết quả phù hợp</p>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="p-2 border-t border-border bg-muted/10">
                <Link 
                  href="/tasks"
                  onClick={() => setIsSearchFocused(false)}
                  className="w-full py-2.5 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors block text-center"
                >
                  Xem tất cả nhiệm vụ
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative group/note p-1">
          <button className={`relative p-2.5 rounded-full transition-all flex items-center justify-center ${effectiveEvent === 'victory_day' ? 'hover:bg-white/20 text-white' : 'hover:bg-muted text-foreground/80 group-hover/note:bg-primary/10 group-hover/note:text-primary'}`}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full border-2 text-[9px] font-black flex items-center justify-center shadow-lg ${effectiveEvent === 'victory_day' ? 'bg-[#fcd34d] text-[#da251d] border-[#da251d]' : 'bg-gradient-to-tr from-red-600 to-rose-500 border-background text-white shadow-rose-500/20'}`}
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
                <RankBadge 
                  peakBalance={Math.max(Number(user?.balance || 0), Number(user?.peak_balance || 0))} 
                  role={user?.role} 
                  showText={false} 
                  className="scale-90" 
                />
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
                    onClick={() => {
                        if (!note.is_read) handleMarkAsRead(note.id);
                        router.push(`/notifications/${note.id}`);
                    }}
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
                <Link 
                    href="/notifications"
                    className="w-full py-2 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors block text-center"
                >
                  Xem tất cả
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mr-4">
          <Link
            href="https://m.me/quang.vu.uc.579118"
            target="_blank"
            className="w-9 h-9 rounded-full bg-[#1877F2] hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-blue-500/20 overflow-hidden"
            title="Facebook Messenger"
          >
            <FacebookIcon className="w-full h-full" />
          </Link>
          <Link
            href="https://zalo.me/0399109399"
            target="_blank"
            className="w-9 h-9 rounded-full bg-[#0068FF] hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-blue-400/20 overflow-hidden"
            title="Zalo"
          >
            <ZaloIcon className="w-full h-full" />
          </Link>
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-2.5 rounded-full transition-colors ${effectiveEvent === 'victory_day' ? 'hover:bg-white/10 text-white' : 'hover:bg-muted text-foreground/80'}`}
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
              <p className={`text-sm font-bold leading-none ${effectiveEvent === 'victory_day' ? 'text-white' : ''}`}>
                {user?.full_name || user?.username || "Thành viên"}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${effectiveEvent === 'victory_day' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                  ID: {user?.display_id || "-------"}
                </span>
                <RankBadge 
                  peakBalance={Math.max(Number(user?.balance || 0), Number(user?.peak_balance || 0))} 
                  role={user?.role} 
                />
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
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors group/item"
              >
                <SettingsIcon className="w-4 h-4 text-muted-foreground group-hover/item:text-primary" />
                Cài đặt
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
