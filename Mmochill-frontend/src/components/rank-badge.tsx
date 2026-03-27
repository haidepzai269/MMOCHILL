"use client";

import { motion } from "framer-motion";
import { Award, ShieldCheck, Crown, Star, Gem } from "lucide-react";

interface RankBadgeProps {
  peakBalance: number;
  showText?: boolean;
  className?: string;
}

export const getRankInfo = (balance: number) => {
  if (balance >= 2000000) {
    return {
      name: "VIP",
      color: "from-purple-600 via-pink-500 to-red-500",
      icon: <Crown className="w-3 h-3 text-white" />,
      textColor: "text-white",
      bgOpacity: "bg-purple-500/20",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]",
      next: null,
      min: 2000000,
    };
  }
  if (balance >= 1000000) {
    return {
      name: "Gold",
      color: "from-yellow-400 to-yellow-600",
      icon: <Gem className="w-3 h-3 text-white" />,
      textColor: "text-white",
      bgOpacity: "bg-yellow-500/20",
      glow: "shadow-[0_0_12px_rgba(234,179,8,0.4)]",
      next: 2000000,
      min: 1000000,
    };
  }
  if (balance >= 500000) {
    return {
      name: "Silver",
      color: "from-slate-300 to-slate-500",
      icon: <ShieldCheck className="w-3 h-3 text-white" />,
      textColor: "text-white",
      bgOpacity: "bg-slate-400/20",
      glow: "shadow-[0_0_8px_rgba(148,163,184,0.3)]",
      next: 1000000,
      min: 500000,
    };
  }
  if (balance >= 100000) {
    return {
      name: "Bronze",
      color: "from-orange-600 to-orange-800",
      icon: <Award className="w-3 h-3 text-white" />,
      textColor: "text-white",
      bgOpacity: "bg-orange-600/20",
      glow: "shadow-[0_0_8px_rgba(234,88,12,0.3)]",
      next: 500000,
      min: 100000,
    };
  }
  return {
    name: "Member",
    color: "from-gray-400 to-gray-600",
    icon: <Star className="w-3 h-3 text-white" />,
    textColor: "text-white",
    bgOpacity: "bg-gray-500/10",
    glow: "",
    next: 100000,
    min: 0,
  };
};

export default function RankBadge({
  peakBalance,
  showText = true,
  className = "",
}: RankBadgeProps) {
  const rank = getRankInfo(peakBalance);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 ${rank.bgOpacity} ${rank.glow} ${className} overflow-hidden group`}
    >
      {/* Animated Shine Effect */}
      <motion.div
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
      />

      <div
        className={`p-0.5 rounded-full bg-gradient-to-br ${rank.color} shadow-inner`}
      >
        {rank.icon}
      </div>

      {showText && (
        <span
          className={`text-[10px] font-black uppercase tracking-tighter ${rank.textColor}`}
        >
          {rank.name}
        </span>
      )}

      {/* Special effect for VIP */}
      {rank.name === "VIP" && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
        </span>
      )}
    </motion.div>
  );
}
