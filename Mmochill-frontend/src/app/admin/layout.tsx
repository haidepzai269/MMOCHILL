"use client";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Settings,
  LogOut,
  Coins,
  CreditCard,
  Bell,
  Landmark,
  MessageSquare,
  Activity,
  Zap,
  Palette,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { adminLogout, getUserProfile } from "@/app/actions/auth";
import { getAdminAlerts, markAdminAlertsAsRead } from "@/app/actions/admin";
import RankBadge from "@/components/rank-badge";
import { toast } from "sonner";

const adminLinks = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Task Management", href: "/admin/tasks", icon: CheckSquare },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Support", href: "/admin/support", icon: MessageSquare },
  { name: "Progress", href: "/admin/progress", icon: Activity },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Bank Management", href: "/admin/bank", icon: Landmark },
  { name: "Appearance", href: "/admin/appearance", icon: Palette },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasNewSupport, setHasNewSupport] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [adminAlerts, setAdminAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchAdmin = async () => {
      const data = await getUserProfile();
      if (data && data.role === "admin") setAdmin(data);
    };
    fetchAdmin();

    const fetchAlerts = async () => {
      const res = await getAdminAlerts(1, 10);
      if (res && res.alerts) {
        setAdminAlerts(res.alerts);
        setUnreadCount(res.unread_count || 0);
      }
    };
    fetchAlerts();
  }, []);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  };

  useEffect(() => {
    // Clear notification if we enter support page
    if (pathname?.startsWith("/admin/support")) {
      setHasNewSupport(false);
    }
  }, [pathname]);

  // Initial check for open tickets
  useEffect(() => {
    const checkInitialSupport = async () => {
      try {
        const token = getCookie("user_token_local");
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/admin/support?status=open`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHasNewSupport(true);
        }
      } catch (error) {
        console.error("Error checking initial support:", error);
      }
    };

    if (admin) {
      checkInitialSupport();
    }
  }, [admin]);

  useEffect(() => {
    // Persistent SSE Connection for Sidebar
    const token = getCookie("user_token_local");
    if (!token) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/admin/stream?token=${token}`,
      { withCredentials: true },
    );

    eventSource.onopen = () => console.log("SSE Connected for Admin Layout");
    eventSource.onerror = (e) => console.error("SSE Error for Admin Layout", e);

    eventSource.addEventListener("support_update", () => {
      console.log("Received support_update event");
      // Use window.location directly to check current path
      if (!window.location.pathname.startsWith("/admin/support")) {
        setHasNewSupport(true);
      }
    });

    eventSource.addEventListener("admin_notification", async () => {
        console.log("Received admin_notification event");
        // Refresh alerts
        const res = await getAdminAlerts(1, 10);
        if (res && res.alerts) {
          setAdminAlerts(res.alerts);
          setUnreadCount(res.unread_count || 0);
          
          // Play sound
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(e => console.log("Audio play failed:", e));
          
          // Show toast for latest alert
          if (res.alerts.length > 0 && !res.alerts[0].is_read) {
            toast.info(res.alerts[0].title, {
              description: res.alerts[0].message,
              action: {
                label: "Xem",
                onClick: () => router.push("/admin/notifications")
              }
            });
          }
        }
      });

    return () => {
      console.log("Closing SSE Admin connection");
      eventSource.close();
    };
  }, [router, admin]);

  // If we're on the login page, don't show the sidebar or header
  if (pathname === "/admin/login") {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark" // Admins usually prefer dark themes
      enableSystem={false}
    >
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground selection:bg-primary/20">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex">
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">
                MMO Admin
              </h1>
            </div>
          </div>

          <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Management
            </p>
            {adminLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(`${link.href}/`);
              const Icon = link.icon;
              const hasSupportNotification =
                link.name === "Support" && hasNewSupport;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors relative group ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                  {hasSupportNotification && !isActive && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                  )}
                  {!isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full transition-all group-hover:h-1/2 opacity-0 group-hover:opacity-100" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/50">
            <button
              onClick={() => adminLogout()}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              Log out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-muted/30">
          <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
            <h2 className="font-semibold">
              {(pathname?.split("/").pop() || "Dashboard")
                .charAt(0)
                .toUpperCase() +
                (pathname?.split("/").pop() || "Dashboard").slice(1)}
            </h2>
            <div className="flex items-center gap-4">
              {/* Admin Notifications Bell with Hover Dropdown */}
              <div className="relative group/note p-1">
                <button 
                  onClick={() => router.push("/admin/notifications")}
                  className="relative p-2.5 rounded-full hover:bg-muted transition-all text-foreground/80 group-hover/note:bg-primary/10 group-hover/note:text-primary"
                >
                  <Bell className="w-5 h-5 transition-transform group-active/note:scale-90" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-background text-[10px] font-black text-white flex items-center justify-center shadow-lg shadow-red-500/20">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Hover Dropdown */}
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all duration-300 translate-y-2 group-hover/note:translate-y-0 z-50 overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm">Thông báo Admin</h4>
                      {adminAlerts.some(a => !a.is_read) && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            const res = await markAdminAlertsAsRead();
                            if (res.success) {
                              const updated = await getAdminAlerts(1, 10);
                              if (updated && updated.alerts) setAdminAlerts(updated.alerts);
                              toast.success("Đã đọc tất cả");
                            }
                          }}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[100px]">
                    {adminAlerts.length > 0 ? (
                      adminAlerts.map((alert) => (
                        <div 
                          key={alert.id}
                          onClick={() => {
                            router.push("/admin/notifications");
                          }}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex gap-3 group/item ${!alert.is_read ? 'bg-primary/[0.03] hover:bg-primary/[0.08]' : 'opacity-60 hover:bg-muted/50'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.category === 'payment' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {alert.category === 'payment' ? <Landmark className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {alert.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                              {alert.message}
                            </p>
                          </div>
                          {!alert.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-1 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto opacity-20 mb-2" />
                        <p className="text-xs">Không có thông báo mới</p>
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-t border-border bg-muted/20">
                    <button 
                      onClick={() => router.push("/admin/notifications")}
                      className="w-full py-2 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors block text-center"
                    >
                      Xem tất cả
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">
                  {admin?.full_name || admin?.username || "Admin User"}
                </p>
                <div className="flex justify-end mt-1">
                  <RankBadge peakBalance={admin?.peak_balance || 0} role={admin?.role || "admin"} className="scale-90" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/20 overflow-hidden flex items-center justify-center text-red-500 font-bold">
                {admin?.avatar_url ? (
                  <img src={admin.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  (admin?.full_name || "AD").slice(0, 2).toUpperCase()
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
