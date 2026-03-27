"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
          
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-black mb-2">Đã có lỗi xảy ra</h1>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Hệ thống gặp sự cố không mong muốn. Đội ngũ kỹ thuật đã được thông báo. Vui lòng thử lại sau giây lát.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 bg-foreground text-background font-black py-3 rounded-2xl hover:opacity-90 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              THỬ LẠI
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-muted border border-border font-bold py-3 rounded-2xl hover:bg-muted/80 transition-all"
            >
              <Home className="w-4 h-4" />
              TRANG CHỦ
            </Link>
          </div>
          
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-muted/50 rounded-xl text-[10px] text-left font-mono overflow-auto max-h-32 text-red-400">
               {error.message}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
