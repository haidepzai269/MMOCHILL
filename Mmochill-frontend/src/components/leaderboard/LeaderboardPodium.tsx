"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Crown } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  email: string;
  balance: number;
  tasks_completed: number;
  rank: number;
  avatar_url: string;
}

interface Props {
  data: LeaderboardEntry[];
}

export default function LeaderboardPodium({ data }: Props) {
  const top3 = data.slice(0, 3);
  const others = data.slice(3, 10);

  // Reorder for podium: [2, 1, 3]
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push(top3[1]); // Silver
  if (top3[0]) podiumOrder.push(top3[0]); // Gold
  if (top3[2]) podiumOrder.push(top3[2]); // Bronze

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "from-yellow-400 to-yellow-600";
      case 2: return "from-gray-300 to-gray-500";
      case 3: return "from-amber-600 to-amber-800";
      default: return "from-white/10 to-white/5";
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-12 py-8">
      {/* Podium Section */}
      <div className="flex items-end justify-center w-full max-w-4xl gap-2 md:gap-8 px-4 h-[400px]">
        {podiumOrder.map((user) => (
          <motion.div
            key={user.user_id}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: user.rank === 1 ? 0.2 : user.rank === 2 ? 0.4 : 0.6 }}
            className={`flex flex-col items-center w-1/3 max-w-[200px] relative`}
          >
            {/* User Avatar & Info */}
            <div className="mb-4 text-center">
              <div className="relative mb-2">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                  alt={user.username}
                  className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-4 object-cover shadow-lg ${
                    user.rank === 1 ? "border-yellow-500 shadow-yellow-500/50" : 
                    user.rank === 2 ? "border-gray-400 shadow-gray-400/50" : "border-amber-700 shadow-amber-700/50"
                  }`}
                />
                {user.rank === 1 && (
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2"
                  >
                    <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-glow" />
                  </motion.div>
                )}
              </div>
              <div className="font-bold text-white text-sm md:text-lg truncate w-full max-w-[120px] md:max-w-none">
                {user.username}
              </div>
              <div className="text-xs text-primary font-bold">
                {user.tasks_completed} tasks
              </div>
            </div>

            {/* The Podium Step */}
            <div 
              className={`w-full rounded-t-2xl bg-gradient-to-b ${getRankColor(user.rank)} border-t border-white/20 shadow-2xl relative flex flex-col items-center justify-start pt-4`}
              style={{ height: user.rank === 1 ? "100%" : user.rank === 2 ? "70%" : "50%" }}
            >
              <div className="text-4xl md:text-7xl font-black text-white/30 italic">
                {user.rank}
              </div>
              {user.rank === 1 && <Trophy className="w-10 h-10 text-white animate-bounce mt-4" />}
              
              <div className="mt-auto pb-4 text-center">
                <div className="text-xs md:text-sm font-bold text-white/80">Số dư</div>
                <div className="text-sm md:text-xl font-black text-white tracking-wider">
                  {user.balance.toLocaleString()}đ
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Others Section (Rank 4-10) */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
        {others.map((user, index) => (
          <motion.div
            key={user.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="text-xl font-black text-gray-500 italic w-8 text-center">
              {user.rank}
            </div>
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
              alt={user.username}
              className="w-10 h-10 rounded-full border border-white/10"
            />
            <div className="flex-1">
              <div className="font-bold text-white">{user.username}</div>
              <div className="text-xs text-gray-400">{user.tasks_completed} nhiệm vụ</div>
            </div>
            <div className="text-right">
              <div className="font-black text-primary italic">
                {user.balance.toLocaleString()}đ
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
