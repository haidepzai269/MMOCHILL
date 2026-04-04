"use client";

import { useEffect, useState } from "react";
import { useSound } from "@/lib/contexts/sound-context";
import {
  Volume2,
  VolumeX,
  Settings as SettingsIcon,
  Bell,
  Monitor,
  Shield,
  ChevronRight,
  Info,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { isMuted, toggleMute } = useSound();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary">
            <SettingsIcon className="w-8 h-8" />
          </div>
          Cài đặt hệ thống
        </h1>
        <p className="text-muted-foreground font-medium">
          Quản lý trải nghiệm cá nhân và tùy chỉnh hệ thống theo ý muốn của bạn.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Âm thanh \& Thông báo */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Volume2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Âm thanh & Thông báo</h2>
          </div>
          
          <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex gap-4">
                <div className={`p-3 rounded-2xl flex items-center justify-center transition-colors ${isMuted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold">Âm thanh hệ thống</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Phát âm thanh khi click, thông báo và hoàn thành nhiệm vụ.</p>
                </div>
              </div>
              
              <button
                onClick={toggleMute}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                  !isMuted ? "bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                    !isMuted ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            
            <div className="h-px bg-border/50 mx-6"></div>
            
            <div className="p-6 flex items-center justify-between opacity-50 cursor-not-allowed">
              <div className="flex gap-4">
                <div className="p-3 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Thông báo đẩy (Push)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Nhận thông báo ngay cả khi bạn không mở trình duyệt.</p>
                </div>
              </div>
              <div className="text-[10px] bg-muted px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Sắp ra mắt</div>
            </div>
          </div>
        </section>

        {/* Bảo mật \& Tài khoản */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Bảo mật & Tài khoản</h2>
          </div>
          
          <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
            <a href="/profile" className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group">
              <div className="flex gap-4">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Cài đặt bảo mật</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Thay đổi mật khẩu, email và quản lý xác thực 2 lớp.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </a>
          </div>
        </section>

        {/* Khác */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Thông tin khác</h2>
          </div>
          
          <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm p-4 space-y-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/30">
               <p className="text-[11px] leading-relaxed text-muted-foreground">
                 Cài đặt âm thanh của bạn được lưu trữ đồng bộ với tài khoản. Khi bạn thay đổi ở đây, âm thanh sẽ tự động bật hoặc tắt trên tất cả các thiết bị khác của bạn sau khi đăng nhập.
               </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
