"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wallet, Trophy, ArrowUpRight, TrendingUp } from "lucide-react";

export function CashFlowChart() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayMoney: 0,
    todayTasks: 0,
    totalBalance: 0,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('user_token_local='))?.split('=')[1];
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/transactions?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const rawText = await res.text();
        let json;
        try {
           json = JSON.parse(rawText);
        } catch (e) {
           console.error("Lỗi parse JSON. HTTP Status:", res.status, "Raw text:", rawText);
           return;
        }

        if (json.transactions) {
          const txs = json.transactions;
          setStats(prev => ({ ...prev, totalBalance: json.wallet?.balance || 0 }));

          // Calculate today's stats
          const today = new Date().toDateString();
          let todayMoney = 0;
          let todayTasks = 0;
          
          txs.forEach((tx: any) => {
            const txDate = new Date(tx.created_at).toDateString();
            if (txDate === today) {
              if (tx.amount > 0) todayMoney += tx.amount;
              if (tx.type === "task_reward") todayTasks++;
            }
          });
          
          setStats(prev => ({ ...prev, todayMoney, todayTasks }));

          // Group for chart (last 7 days or hourly if today). Let's group by day for the chart
          const grouped: Record<string, number> = {};
          // Initialize last 7 days to 0
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            grouped[d.toLocaleDateString("vi-VN", { month: "short", day: "numeric" })] = 0;
          }

          txs.forEach((tx: any) => {
            if (tx.amount > 0) {
              const d = new Date(tx.created_at).toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
              if (grouped[d] !== undefined) {
                grouped[d] += tx.amount;
              }
            }
          });

          const chartData = Object.keys(grouped).map(k => ({
            name: k,
            amount: grouped[k]
          }));
          
          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch wallet info:", error);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-xl shadow-primary/5 relative overflow-hidden mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cột Thống Kê */}
      <div className="md:col-span-1 flex flex-col justify-center space-y-6 relative z-10">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 tracking-tighter text-foreground mb-1">
            <Wallet className="w-5 h-5 text-primary" /> Dòng Tiền
          </h2>
          <p className="text-muted-foreground text-xs font-medium">Thống kê hoạt động của bạn hôm nay</p>
        </div>

        <div className="space-y-4">
          <div className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Thu nhập hôm nay</p>
              <div className="text-2xl font-black text-emerald-500 group-hover:scale-105 transition-transform origin-left">
                +{stats.todayMoney.toLocaleString()}đ
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-orange-500/30 transition-colors">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Task đã vượt</p>
              <div className="text-2xl font-black text-foreground group-hover:scale-105 transition-transform origin-left flex items-baseline gap-1">
                {stats.todayTasks} <span className="text-sm text-muted-foreground font-semibold">lượt</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Cột Chart */}
      <div className="md:col-span-2 relative h-[250px] md:h-full min-h-[250px] w-full rounded-3xl overflow-hidden bg-background border border-border p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biểu đồ thu nhập 7 ngày</h3>
           <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3 h-3" /> Live
           </div>
        </div>
        <div className="flex-1 w-full relative -ml-4 z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
              <XAxis 
                 dataKey="name" 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                 dy={10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderRadius: '1rem', 
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  fontWeight: 800,
                  fontSize: '12px'
                }}
                formatter={(value: any) => [(typeof value === 'number' ? value : 0).toLocaleString() + 'đ', "Thu nhập"]}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'hsl(var(--background))', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
