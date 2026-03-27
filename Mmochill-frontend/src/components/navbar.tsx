"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Bell, Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
        >
          <Coins className="w-6 h-6" />
        </motion.div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">MMOChill</h1>
          <p className="text-xs text-muted-foreground font-medium">Earn every tap</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors text-foreground/80">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-background"></span>
        </button>
        {mounted && (
          <>
            <Link 
              href="/login"
              className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-muted transition-colors text-foreground/80"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
