"use client";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Sidebar from "@/components/sidebar";
import PCHeader from "@/components/pc-header";
import { Facebook, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ZaloIcon } from "@/components/icons/zalo-icon";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen w-full bg-background relative overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto pb-24 p-4 no-scrollbar relative w-full h-full">
          {children}
        </main>

        {/* Floating Contact Buttons for Mobile */}
        <div className="fixed bottom-24 right-4 flex flex-col gap-4 z-50">
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{
              delay: 0.5,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link
              href="https://m.me/quang.vu.uc.579118"
              target="_blank"
              className="w-13 h-13 rounded-full bg-[#1877F2] shadow-[0_4px_15px_rgba(24,119,242,0.4)] flex items-center justify-center text-white ring-2 ring-white/20 p-3"
            >
              <Facebook className="w-6 h-6 shrink-0" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{
              delay: 0.7,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link
              href="https://zalo.me/0399109399"
              target="_blank"
              className="w-13 h-13 rounded-full bg-[#0068FF] shadow-[0_4px_15px_rgba(0,104,255,0.4)] flex items-center justify-center text-white ring-2 ring-white/20 p-3"
            >
              <ZaloIcon className="w-6 h-6 shrink-0" />
            </Link>
          </motion.div>
        </div>

        <BottomNav />
      </div>

      {/* Desktop/PC Layout */}
      <div className="hidden md:flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <PCHeader />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-8 no-scrollbar">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
