"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Ghost, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] animate-pulse delay-700" />

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-block mb-8">
            <Ghost className="w-32 h-32 text-primary/20 animate-bounce" />
            <span className="absolute inset-0 flex items-center justify-center text-8xl font-black italic tracking-tighter text-foreground/10 select-none">
              404
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-4">Trang không tồn tại</h1>
          <p className="text-muted-foreground mb-10 leading-relaxed font-medium">
            Có vẻ như bạn đã lạc vào một vùng đất chưa được khai phá trên MMOChill. Đừng lo lắng, chúng tôi sẽ giúp bạn quay lại.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Home className="w-5 h-5" />
              VỀ TRANG CHỦ
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 bg-muted border border-border font-bold px-8 py-4 rounded-2xl hover:bg-muted/80 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              QUAY LẠI
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
        MMOCHILL • PREMIUM GAMING EXPERIENCE
      </div>
    </div>
  );
}
