"use client";

import { ShieldAlert, LogOut, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { userLogout } from "@/app/actions/auth";

export default function BannedPage() {
  const handleLogout = async () => {
    await userLogout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Danger Stripe */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-gradient-x" />
          
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-red-500/5">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-4 uppercase text-red-500">
            Tài khoản bị khóa
          </h1>
          
          <div className="space-y-4 mb-10 text-muted-foreground leading-relaxed">
            <p className="font-bold text-foreground">
              Chúng tôi rất tiếc phải thông báo rằng tài khoản của bạn đã bị đình chỉ quyền truy cập vào các dịch vụ của MMOChill.
            </p>
            <p className="text-sm">
              Lý do có thể bao gồm việc vi phạm điều khoản sử dụng, gian lận trong nhiệm vụ hoặc các hoạt động bất thường gây ảnh hưởng đến hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
               onClick={handleLogout}
               className="flex items-center justify-center gap-2 bg-foreground text-background font-black py-4 rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-foreground/10"
            >
              <LogOut className="w-5 h-5" />
              ĐĂNG XUẤT
            </button>
            <a
               href="https://t.me/mmochill_support"
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 font-black py-4 rounded-2xl hover:bg-primary/20 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              LIÊN HỆ HỖ TRỢ
            </a>
          </div>

          <p className="mt-8 text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 italic">
            Mã định danh bảo mật: CHILL-BAN-PRO-V1
          </p>
        </motion.div>
      </div>
    </div>
  );
}
