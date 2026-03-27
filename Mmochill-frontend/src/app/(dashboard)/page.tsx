"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, CheckCircle, ChevronRight, Clock, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
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
            <p className="text-xl font-bold capitalize">{user?.role || "Member"}</p>
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
                <div className="flex items-center gap-4">
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
        {/* Recent History */}
        <section>
          <h3 className="font-bold text-lg mb-4">Referral Status</h3>
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
             <p className="text-sm text-muted-foreground mb-1">Your Referral Code</p>
             <div className="bg-muted p-3 rounded-xl font-mono text-center font-bold text-lg tracking-wider">
               {user?.referral_code || "-------"}
             </div>
             <p className="text-[10px] text-center mt-2 text-muted-foreground">Share this code to earn 10% lifetime commission</p>
          </div>
        </section>

        {/* Promo / Ads for PC */}
        <section className="hidden md:block">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white overflow-hidden relative shadow-lg"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mt-10 -mr-10" />
            <h3 className="font-bold text-xl mb-2 relative z-10">Invite Friends</h3>
            <p className="text-sm text-balance text-indigo-50 leading-relaxed mb-5 relative z-10">
              Earn lifetime commission from your friends&apos; task rewards!
            </p>
            <button className="bg-white text-indigo-600 font-bold py-2.5 px-4 rounded-xl text-sm hover:bg-gray-100 transition-colors relative z-10 w-full shadow-sm">
              Copy Link
            </button>
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
