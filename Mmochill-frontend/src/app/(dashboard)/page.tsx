"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, CheckCircle, ChevronRight, Clock, ShieldCheck, ExternalLink, Loader2, User, Mail, Copy, Trophy, Fingerprint, Star } from "lucide-react";
import Link from "next/link";
import RankBadge, { getRankInfo } from "@/components/rank-badge";
import { useEffect, useState, useTransition } from "react";
import { getUserProfile } from "@/app/actions/auth";
import { getActiveTasks, claimTask } from "@/app/actions/tasks";
import { toast } from "sonner";
import { useLoading } from "@/lib/contexts/loading-context";

export default function Home() {
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isClaiming, startClaiming] = useTransition();

  useEffect(() => {
    const initData = async () => {
      showLoading();
      const [profile, activeTasks] = await Promise.all([
        getUserProfile(),
        getActiveTasks()
      ]);
      
      if (profile) setUser(profile);
      setTasks(activeTasks || []);
      hideLoading();
    };
    initData();
  }, []);

  const handleClaimTask = (taskId: string) => {
    showLoading();
    startClaiming(async () => {
      const result = await claimTask(taskId);
      if (result.success) {
        toast.success("Task claimed! Redirecting to bypass link...");
        if (result.data.bypass_url) {
          window.open(result.data.bypass_url, "_blank");
        }
      } else {
        toast.error(result.error || "Failed to claim task");
      }
      hideLoading();
    });
  };

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      toast.success("Mã mời đã được sao chép!");
    }
  };

  const copyReferralLink = () => {
    if (user?.referral_code) {
      const link = `${window.location.origin}/register?ref=${user.referral_code}`;
      navigator.clipboard.writeText(link);
      toast.success("Liên kết giới thiệu đã được sao chép!");
    }
  };

  if (isLoading && !user) return null;

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 md:items-start gap-6 md:gap-8">
      {/* Left Column */}
      <div className="md:col-span-8 flex flex-col gap-6 md:gap-8">
        {/* Welcome & Balance */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-br from-primary/90 to-blue-600 rounded-3xl p-6 text-primary-foreground shadow-lg overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10" />
          <div className="relative z-10">
            <p className="font-medium text-primary-foreground/80 mb-1">Total Balance</p>
            <div className="flex items-end gap-2 mb-4">
              <h2 className="text-4xl font-bold tracking-tight">
                {user?.balance?.toLocaleString() || "0"}
              </h2>
              <span className="text-primary-foreground/80 text-sm font-medium mb-1.5">VND</span>
            </div>
            
            <div className="flex gap-4 max-w-sm">
              <Link href="/wallet" className="flex-1 bg-white/20 hover:bg-white/30 transition-colors py-2.5 rounded-2xl font-semibold backdrop-blur-md flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" /> Withdraw
              </Link>
              <button className="flex-1 bg-white hover:bg-gray-100 text-primary transition-colors py-2.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-sm">
                <CheckCircle className="w-4 h-4" /> Earn
              </button>
            </div>
          </div>
        </motion.section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 gap-4 md:gap-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card border border-border rounded-3xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Rank</span>
            </div>
            <p className="text-xl font-bold capitalize">
              {user?.role === "admin" ? "Admin" : getRankInfo(Math.max(Number(user?.balance || 0), Number(user?.peak_balance || 0)), user?.role).name}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-card border border-border rounded-3xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Verified</span>
            </div>
            <p className="text-xl font-bold">{user?.email_verified ? "Yes" : "No"}</p>
          </motion.div>
        </section>

        {/* Available Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Available Tasks</h3>
            <Link href="/tasks" className="text-primary text-sm font-medium flex items-center hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex flex-col gap-3">
            {tasks.length > 0 ? tasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleClaimTask(task.id)}
                className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                       {task.provider} • {task.min_time_seconds}s
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RankBadge 
                    peakBalance={Math.max(Number(user?.balance || 0), Number(user?.peak_balance || 0))} 
                    role={user?.role} 
                    showText={false} 
                    className="scale-90" 
                  />
                  <div className="text-right">
                    <p className="font-bold text-primary">+{task.reward.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-0.5">VND</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            )) : (
              <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
                No tasks available at the moment.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column */}
      <div className="md:col-span-4 flex flex-col gap-6 md:gap-8">
        {/* User Profile & Referral Card (PC Only) */}
        <section className="hidden md:flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:shadow-primary/5 transition-all duration-500"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mt-10 -mr-10 group-hover:bg-primary/10 transition-colors" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mb-10 -ml-10" />

            <div className="relative z-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4 group/avatar">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary via-blue-500 to-indigo-600 p-1 shadow-lg shadow-primary/20 rotate-3 group-hover/avatar:rotate-0 transition-transform duration-500">
                    <div className="w-full h-full rounded-[1.25rem] bg-card flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-primary italic font-black text-3xl">
                           {user?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "M"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-500 border-4 border-card flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <h3 className="font-black text-2xl tracking-tighter text-foreground mb-1 leading-tight">
                  {user?.full_name || "Thành viên"}
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20 mb-2">
                  <Star className="w-3 h-3 fill-primary" />
                  {user?.role === "admin" ? "ADMINISTRATOR" : getRankInfo(Math.max(Number(user?.balance || 0), Number(user?.peak_balance || 0)), user?.role).name.toUpperCase()}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group/item">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover/item:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Email</p>
                    <p className="text-xs font-semibold truncate text-foreground/80">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group/item">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover/item:text-orange-500 transition-colors">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Mã giới thiệu</p>
                    <p className="text-sm font-black tracking-widest text-foreground">{user?.referral_code || "-------"}</p>
                  </div>
                  <button 
                    onClick={copyReferralCode}
                    className="p-2.5 rounded-xl hover:bg-primary hover:text-white text-muted-foreground transition-all active:scale-95"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={copyReferralLink}
                  className="w-full bg-primary text-primary-foreground font-black text-sm py-4 rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group/btn"
                >
                  <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Copy Referral Link
                </button>
                <Link 
                  href="/profile"
                  className="w-full bg-muted/80 text-foreground/80 font-bold text-sm py-4 rounded-2xl hover:bg-muted transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <Fingerprint className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  View Full Profile
                </Link>
              </div>
              
              <p className="text-center mt-6 text-[10px] text-muted-foreground font-medium italic opacity-60">
                Earn 10% lifetime commission from invited friends
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 animate-pulse">
      <div className="md:col-span-8 flex flex-col gap-6 md:gap-8">
        <div className="h-48 bg-muted rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-3xl" />
          <div className="h-24 bg-muted rounded-3xl" />
        </div>
        <div>
          <div className="h-6 w-32 bg-muted rounded-md mb-4" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="md:col-span-4 hidden md:flex flex-col text-center">
         <div className="h-6 w-32 bg-muted rounded-md mb-4 self-center" />
         <div className="h-32 bg-muted rounded-3xl mb-8" />
         <div className="h-48 bg-muted rounded-3xl" />
      </div>
    </div>
  );
}
