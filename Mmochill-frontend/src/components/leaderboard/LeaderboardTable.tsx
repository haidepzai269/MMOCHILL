"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Hash } from "lucide-react";

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

export default function LeaderboardTable({ data }: Props) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400/20 via-yellow-500/30 to-yellow-400/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
      case 2:
        return "bg-gradient-to-r from-gray-300/20 via-gray-400/30 to-gray-300/20 border-gray-400/50 shadow-[0_0_15px_rgba(156,163,175,0.2)]";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 via-amber-700/30 to-amber-600/20 border-amber-700/50 shadow-[0_0_15px_rgba(180,83,9,0.2)]";
      default:
        return "bg-white/5 border-white/10 hover:bg-white/10 transition-colors";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-6 py-4 font-semibold text-gray-400 text-sm uppercase tracking-wider">Hạng</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-sm uppercase tracking-wider">Người dùng</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-sm uppercase tracking-wider hidden md:table-cell">Nhiệm vụ</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-sm uppercase tracking-wider text-right">Số dư</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((user, index) => (
            <motion.tr
              key={user.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`group ${getRankStyle(user.rank)} border-l-4`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {getRankIcon(user.rank)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                      alt={user.username}
                      className="w-10 h-10 rounded-full border border-white/20 object-cover"
                    />
                    {user.rank <= 3 && (
                      <div className="absolute -top-1 -right-1">
                        <Star className={`w-4 h-4 fill-current ${
                          user.rank === 1 ? "text-yellow-500" : 
                          user.rank === 2 ? "text-gray-400" : "text-amber-700"
                        }`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-primary transition-colors">
                      {user.username}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-300">{user.tasks_completed.toLocaleString()}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-lg font-black bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent italic">
                  {user.balance.toLocaleString()}đ
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
