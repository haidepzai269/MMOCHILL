"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Coins, 
  ChevronRight, 
  Heart, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Mail
} from "lucide-react";
import { FacebookIcon } from "./icons/facebook-icon";
import { ZaloIcon } from "./icons/zalo-icon";

const footerLinks = [
  {
    title: "Khám phá",
    links: [
      { name: "Nhiệm vụ mới", href: "/tasks" },
      { name: "Bảng xếp hạng", href: "/leaderboard" },
      { name: "Sự kiện HOT", href: "/bonus/daily-checkin" },
    ]
  },
  {
    title: "Hỗ trợ",
    links: [
      { name: "Ví tiền", href: "/wallet" },
      { name: "Trung tâm trợ giúp", href: "/support" },
      { name: "Điều khoản & Quy định", href: "/terms" },
    ]
  }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background/40 backdrop-blur-md border-t border-border/50 py-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                <Coins className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                MMOChill
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Nền tảng kiếm tiền online uy tín, minh bạch và hiệu quả nhất cho cộng đồng MMO Việt Nam. 
              <span className="block mt-1 font-medium text-foreground/60">Earn every tap.</span>
            </p>
            <div className="flex gap-3 mt-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Bảo mật SSL
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                <Zap className="w-3 h-3" /> Payout 24/7
              </span>
            </div>
          </div>

          {/* Links Sections */}
          {footerLinks.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/80">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link 
                      href={link.href} 
                      className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social & Contact Section */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/80">
              Kết nối cộng đồng
            </h3>
            <p className="text-xs text-muted-foreground">
              Theo dõi chúng tôi để cập nhật những cơ hội kiếm tiền mới nhất.
            </p>
            <div className="flex flex-col gap-3 mt-1">
              <motion.a
                whileHover={{ x: 5 }}
                href="https://m.me/quang.vu.uc.579118"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#1877F2] p-2 overflow-hidden shadow-lg shadow-blue-500/20">
                  <FacebookIcon className="w-full h-full" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold group-hover:text-primary transition-colors">Facebook Messenger</span>
                  <span className="text-[10px] text-muted-foreground italic">Hỗ trợ 24/7</span>
                </div>
                <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/30 group-hover:text-primary" />
              </motion.a>

              <motion.a
                whileHover={{ x: 5 }}
                href="https://zalo.me/0399109399"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#0068FF] overflow-hidden shadow-lg shadow-cyan-500/20">
                  <ZaloIcon className="w-full h-full" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold group-hover:text-primary transition-colors">Zalo Official</span>
                  <span className="text-[10px] text-muted-foreground italic">Cộng đồng MMO</span>
                </div>
                <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/30 group-hover:text-primary" />
              </motion.a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span>© {currentYear} MMOChill Project. Build with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            <span>by Team.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>Vietnam</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span>contact@mmochill.app</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
