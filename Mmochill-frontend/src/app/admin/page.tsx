"use client";

import { 
  Users, 
  CheckSquare, 
  TrendingUp, 
  ShieldCheck,
  Activity,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminStats } from "@/app/actions/admin";
import { useLoading } from "@/lib/contexts/loading-context";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { showLoading, hideLoading } = useLoading();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      showLoading();
      const res = await getAdminStats();
      if (res) setData(res);
      hideLoading();
    };
    fetchStats();

    // SSE Real-time stats
    const token = document.cookie.split('; ').find(row => row.startsWith('user_token_local='))?.split('=')[1];
    if (!token) return;

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/stream?token=${token}`);

    eventSource.addEventListener("stats", (event) => {
      try {
        const newData = JSON.parse(event.data);
        setData(newData);
      } catch (err) {
        console.error("Failed to parse SSE admin stats", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const stats = [
    { name: "Total Users", value: data?.total_users?.toLocaleString() || "0", change: "+0%", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Active Tasks", value: data?.active_tasks?.toLocaleString() || "0", change: "Stable", icon: CheckSquare, color: "text-green-500", bg: "bg-green-500/10" },
    { name: "Total Earned", value: (data?.total_earned || 0).toLocaleString() + "đ", change: "+0%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Pending Withdrawals", value: data?.pending_withdrawals?.toLocaleString() || "0", change: "Action Needed", icon: Activity, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Admin Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening on your platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.name}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Management Overview */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">User Management</h2>
            <button className="text-sm text-primary font-medium hover:underline">Manage All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Balance</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: "John Doe", email: "john@example.com", balance: "5,000 VND", status: "Active" },
                  { name: "Jane Smith", email: "jane@example.com", balance: "12,450 VND", status: "Active" },
                  { name: "Alex Brown", email: "alex@example.com", balance: "0 VND", status: "Banned" },
                  { name: "Marie Curie", email: "marie@example.com", balance: "850 VND", status: "Active" },
                ].map((user, idx) => (
                  <tr key={idx} className="border-b border-border/50 last:border-0">
                    <td className="py-4 font-medium">{user.name}</td>
                    <td className="py-4 text-muted-foreground">{user.email}</td>
                    <td className="py-4 font-semibold">{user.balance}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-right px-1">
                      <button className="text-primary hover:text-primary/70 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Quick Actions & Logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="w-full py-3 px-4 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <CheckSquare className="w-4 h-4" />
                </div>
                Create New Task
              </button>
              <button className="w-full py-3 px-4 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <Users className="w-4 h-4" />
                </div>
                Broadcast Message
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mt-5 -mr-5" />
            <h3 className="font-bold text-lg mb-2 relative z-10">Financial Summary</h3>
            <div className="mt-4 space-y-2 relative z-10">
              <div className="flex justify-between items-center text-sm opacity-90">
                <span>Total Payouts</span>
                <span className="font-bold">$1,230</span>
              </div>
              <div className="flex justify-between items-center text-sm opacity-90">
                <span>Pending Approvals</span>
                <span className="font-bold">12</span>
              </div>
            </div>
            <button 
              onClick={async () => {
                showLoading();
                await new Promise(r => setTimeout(r, 1500)); // Simulate API
                hideLoading();
                toast.success("All withdrawals approved!");
              }}
              className="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold mt-6 hover:bg-gray-100 transition-colors"
            >
              Approve Withdrawals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
