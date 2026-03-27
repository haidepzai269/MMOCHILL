"use client";

import { Home, CheckSquare, Wallet, User, Coins } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Task Center", href: "/tasks", icon: CheckSquare },
  { name: "My Wallet", href: "/wallet", icon: Wallet },
  { name: "Settings", href: "/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">
            MMOChill
          </h1>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 z-10" />
              <span className="z-10">{item.name}</span>

              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col items-center text-center">
          <p className="text-sm font-medium mb-1">Need help?</p>
          <p className="text-xs text-muted-foreground mb-3">
            Contact our support team 24/7.
          </p>
          <Link
            href="/support"
            className="w-full bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors text-center"
          >
            Support
          </Link>
        </div>
      </div>
    </aside>
  );
}
