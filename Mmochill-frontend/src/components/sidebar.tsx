"use client";

import {
  Home,
  CheckSquare,
  Wallet,
  User,
  Coins,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  Users,
  Gift,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Globe,
} from "lucide-react";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  subItems?: { name: string; href: string }[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Task Center", href: "/tasks", icon: CheckSquare },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "My Wallet", href: "/wallet", icon: Wallet },
  {
    name: "Bonus",
    href: "/bonus",
    icon: Gift,
    subItems: [
      { name: "Daily Check-in", href: "/bonus/daily-checkin" },
      { name: "Referral", href: "/bonus/referral" },
    ],
  },
  { name: "Settings", href: "/profile", icon: User },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export default function Sidebar({
  isCollapsed: externalCollapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setIsCollapsed = (val: boolean) => {
    if (onToggle) onToggle(val);
    else setInternalCollapsed(val);
  };

  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { getUserProfile } = await import("@/app/actions/auth");
      const profile = await getUserProfile();
      setUser(profile);
    };
    fetchUser();
  }, []);

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/community") {
      const isVipRank = (user?.peak_balance || 0) >= 2000000;
      return user?.role === "admin" || user?.is_vip || isVipRank;
    }
    return true;
  });

  // Tự động mở menu nếu đang ở trang con
  useEffect(() => {
    filteredNavItems.forEach((item) => {
      if (
        item.subItems &&
        item.subItems.some(
          (sub) => pathname === sub.href || pathname?.startsWith(sub.href),
        )
      ) {
        if (!openMenus.includes(item.name)) {
          setOpenMenus((prev) => [...prev, item.name]);
        }
      }
    });
  }, [pathname, user]);

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name],
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col border border-border shadow-2xl rounded-3xl sticky transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-[50] group/sidebar ${isCollapsed ? "w-20" : "w-72"} h-fit max-h-[calc(100vh-80px-2rem)] overflow-hidden`}
      style={
        {
          background: "var(--sidebar-bg, var(--card))",
          "--sidebar-width": isCollapsed ? "80px" : "288px",
          top: "calc(80px + 1.5rem)",
        } as any
      }
    >
      {/* Header & Toggle Button */}
      <div className={`pt-6 px-6 pb-2 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
        {!isCollapsed && (
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Menu
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-xl hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all group/toggle"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 group-hover/toggle:scale-110 transition-transform" />
          ) : (
            <ChevronLeft className="w-4 h-4 group-hover/toggle:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-2 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => {
          const isParentActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = openMenus.includes(item.name);
          const Icon = item.icon;

          return (
            <div key={item.name} className="flex flex-col gap-1">
              {hasSubItems ? (
                <button
                  onClick={() => !isCollapsed && toggleMenu(item.name)}
                  className={`relative flex items-center ${isCollapsed ? "justify-center h-12" : "gap-4 px-4 py-3.5"} rounded-2xl transition-all duration-300 group ${
                    isParentActive
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 z-10 ${isParentActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : ""}`}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="z-10 text-sm tracking-wide flex-1 text-left">
                        {item.name}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </motion.div>
                    </>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-[100] whitespace-nowrap shadow-xl">
                      {item.name}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`relative flex items-center ${isCollapsed ? "justify-center h-12" : "gap-4 px-4 py-3.5"} rounded-2xl transition-all duration-300 group ${
                    isParentActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 z-10 ${isParentActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : ""}`}
                  />
                  {!isCollapsed && (
                    <span className="z-10 text-sm tracking-wide">
                      {item.name}
                    </span>
                  )}

                  {isParentActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-2xl"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-[100] whitespace-nowrap shadow-xl">
                      {item.name}
                    </div>
                  )}
                </Link>
              )}

              {/* Sub items */}
              <AnimatePresence>
                {!isCollapsed && hasSubItems && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden flex flex-col gap-1 ml-9 border-l border-border/50 pl-4 py-1"
                  >
                    {item.subItems?.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`py-2 text-xs font-medium transition-all duration-200 hover:translate-x-1 ${
                            isSubActive
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer Support Section */}
      <div
        className={`p-4 border-t border-border/10 transition-all duration-500 ${isCollapsed ? "items-center" : ""}`}
      >
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden group/support"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover/support:bg-primary/10 transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold mb-1">Need help?</p>
            <p className="text-[11px] text-muted-foreground mb-4 px-2 leading-relaxed">
              Our support team is here for you 24/7.
            </p>
            <Link
              href="/support"
              className="w-full bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
            >
              Contact Support
            </Link>
          </motion.div>
        ) : (
          <Link
            href="/support"
            className="w-12 h-12 mx-auto rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/10 hover:border-primary/40 transition-all group/help relative"
          >
            <HelpCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-[100] whitespace-nowrap shadow-xl">
              Support
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
