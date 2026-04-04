"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Table, Trophy, Sparkles, RefreshCw, Star } from "lucide-react";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import LeaderboardPodium from "@/components/leaderboard/LeaderboardPodium";
import { getLeaderboardData } from "@/app/actions/leaderboard";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  email: string;
  balance: number;
  tasks_completed: number;
  rank: number;
  avatar_url: string;
}

export default function LeaderboardPage() {
  const [view, setView] = useState<"podium" | "table">("podium");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    // 1. Initial Fetch
    const fetchInitial = async () => {
      try {
        const json = await getLeaderboardData();
        if (json.top_users) {
          setData(json.top_users);
          setLastUpdate(json.last_update ? json.last_update * 1000 : Date.now());
        }
      } catch (err) {
        console.error("Failed to fetch initial leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    // 2. Setup SSE for Real-time updates
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";
    const sse = new EventSource(`${backendBase}/leaderboard/stream`);
    
    sse.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        if (Array.isArray(newData)) {
          setData(newData);
          setLastUpdate(Date.now());
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    sse.onerror = () => {
      console.warn("SSE connection lost. Reconnecting...");
    };

    return () => {
      sse.close();
    };
  }, []);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Đang tải bảng xếp hạng realtime...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-primary"
          >
            <Trophy className="w-8 h-8" />
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
              Bảng Xếp Hạng
            </h1>
          </motion.div>
          <p className="text-gray-400 max-w-xl">
            Đua top nhận thưởng hàng tháng! Top 1 nhận <span className="text-yellow-500 font-bold">10%</span>, Top 2 nhận <span className="text-gray-300 font-bold">8%</span>, Top 3 nhận <span className="text-amber-700 font-bold">5%</span> tổng số dư hiện có.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md self-start md:self-auto">
          <button
            onClick={() => setView("podium")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              view === "podium" ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Bậc thang
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              view === "table" ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <Table className="w-4 h-4" />
            Bảng điểm
          </button>
        </div>
      </div>

      {/* Realtime Status */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 py-1 px-3 rounded-full w-fit border border-white/5">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Cập nhật trực tuyến: {new Date(lastUpdate).toLocaleTimeString("vi-VN")}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="min-h-[600px]"
        >
          {view === "podium" ? (
            <LeaderboardPodium data={data} />
          ) : (
            <LeaderboardTable data={data} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Monthly Reward Info Card */}
      <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-black/40 to-black/60 border border-primary/20 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="w-40 h-40 text-primary" />
        </div>
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <Star className="text-primary fill-primary" />
            Quy Hoạch Thưởng Cuối Tháng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-yellow-500 font-black text-3xl">Top 1</div>
              <div className="text-white text-lg font-bold">+10% Tổng số dư</div>
              <p className="text-xs text-gray-500">Cộng trực tiếp vào ví vào cuối mỗi tháng.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-gray-300 font-black text-3xl">Top 2</div>
              <div className="text-white text-lg font-bold">+8% Tổng số dư</div>
              <p className="text-xs text-gray-500">Tính trên balance thực tế (trừ đi số tiền đã rút).</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-amber-700 font-black text-3xl">Top 3</div>
              <div className="text-white text-lg font-bold">+5% Tổng số dư</div>
              <p className="text-xs text-gray-500">Đua top realtime để giữ vững vị trí của bạn.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
