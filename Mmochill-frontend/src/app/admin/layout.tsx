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
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { adminLogout } from "@/app/actions/auth";

const adminLinks = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Task Management", href: "/admin/tasks", icon: CheckSquare },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Support", href: "/admin/support", icon: MessageSquare },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Bank Management", href: "/admin/bank", icon: Landmark },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [hasNewSupport, setHasNewSupport] = useState(false);

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

  useEffect(() => {
    // Use the existing notification SSE endpoint but listen for a custom event
    const token = getCookie("user_token_local");
    if (!token) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/notifications/stream?token=${token}`,
      { withCredentials: true },
    );

    eventSource.onopen = () => console.log("SSE Connected for Sidebar");
    eventSource.onerror = (e) => console.error("SSE Error for Sidebar", e);

    eventSource.addEventListener("support_update", () => {
      console.log("Received support_update event");
      if (!window.location.pathname.startsWith("/admin/support")) {
        setHasNewSupport(true);
      }
    });

    return () => eventSource.close();
  }, [pathname]);

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
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Admin User</span>
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 font-bold text-xs">
                AD
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
