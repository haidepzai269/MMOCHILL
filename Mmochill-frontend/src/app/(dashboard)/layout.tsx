"use client";
import React, { useState } from "react";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Sidebar from "@/components/sidebar";
import PCHeader from "@/components/pc-header";
import NotificationBanner from "@/components/notification-banner";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { ZaloIcon } from "@/components/icons/zalo-icon";
import { Facebook, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Layout - Giữ nguyên logic cũ */}
      <div className="md:hidden flex flex-col min-h-screen w-full bg-background relative overflow-hidden text-foreground">
        <Navbar />
        <NotificationBanner />
        <main className="flex-1 overflow-y-auto pb-24 p-4 no-scrollbar relative w-full h-full">
          {children}
          <Footer />
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
              className="w-13 h-13 rounded-full bg-[#1877F2] shadow-[0_4px_15px_rgba(24,119,242,0.4)] flex items-center justify-center text-white ring-2 ring-white/20 overflow-hidden"
              title="Facebook"
            >
              <FacebookIcon className="w-full h-full" />
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
              className="w-13 h-13 rounded-full bg-[#0068FF] shadow-[0_4px_15px_rgba(0,104,255,0.4)] flex items-center justify-center text-white ring-2 ring-white/20 overflow-hidden"
              title="Zalo"
            >
              <ZaloIcon className="w-full h-full" />
            </Link>
          </motion.div>
        </div>

        <BottomNav />
      </div>

      {/* Desktop/PC Layout - Kỹ thuật Sticky Reveal Hoàn hảo */}
      <div 
        className="hidden md:flex flex-col min-h-screen w-full bg-background relative selection:bg-primary/20"
        style={{ 
          '--sidebar-width': sidebarCollapsed ? '80px' : '288px',
          '--sidebar-gap': '1rem' 
        } as any}
      >
        {/* Layer 3: Fixed Header (Full width) */}
        <PCHeader />

        <div className="flex-1 flex flex-col relative w-full">
          {/* Main Scrollable Content Area */}
          <div className="flex-1 flex flex-col relative w-full">
            
            {/* Layer 2: Main Content Area (Đè lên Footer) - Bây giờ chứa cả Sidebar */}
            <div 
               className="relative z-20 bg-background shadow-[0_40px_100px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-screen w-full flex p-6 gap-6"
            >
              {/* Sticky Sidebar inside Layer 2 */}
              <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={setSidebarCollapsed} 
              />

              <main 
                className="flex-1 min-h-[calc(100vh-80px-3rem)] transition-all duration-500"
              >
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>

            {/* 
                Layer 1: Footer Reveal Layer (Dính ở đáy màn hình sau Content) 
                Bây giờ đã full-width (không có marginLeft).
            */}
            <div className="relative z-10 h-[450px]">
               <div className="sticky bottom-0 left-0 w-full h-[450px]">
                  <Footer />
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
