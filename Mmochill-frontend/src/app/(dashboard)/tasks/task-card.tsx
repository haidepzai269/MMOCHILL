"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckSquare, TrendingUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { DatabaseTask } from "@/app/actions/tasks";
import Link from "next/link";

export default function TaskCard({ task, index, isJustCompleted = false }: { task: DatabaseTask, index: number, isJustCompleted?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ 
        opacity: isJustCompleted ? 0.7 : 1, 
        y: 0,
        backgroundColor: isJustCompleted ? "rgba(34, 197, 94, 0.05)" : undefined,
      }}
      transition={{ 
        duration: 0.4, 
        delay: isJustCompleted ? 0 : index * 0.05,
        layout: { type: "spring", bounce: 0.2, duration: 0.7 }
      }}
      className={`group relative bg-card/60 backdrop-blur-md border rounded-[2rem] overflow-hidden transition-all duration-300 ${
        isExpanded ? "ring-2 ring-primary/20 shadow-2xl bg-card/80" : "hover:border-primary/30 shadow-sm"
      } ${
        isJustCompleted ? "border-green-500/40 pointer-events-none" : "border-white/5"
      }`}
    >
      {/* Header Clickable Area */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer flex items-center justify-between gap-4 select-none"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${
            isExpanded ? "bg-primary text-white" : "bg-primary/10 text-primary"
          }`}>
            {task.type === "surf" && <Clock className="w-6 h-6" />}
            {task.type === "app" && <CheckSquare className="w-6 h-6" />}
            {task.type === "video" && <TrendingUp className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors text-foreground">
              {task.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] font-bold text-muted-foreground/60 px-2 py-0.5 bg-muted rounded-full uppercase tracking-tighter border border-border/30">
                {task.type}
              </span>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 opacity-50" /> {task.time_requirement}s
              </p>
              {task.max_completions_today !== undefined && task.max_completions_today > 1 && (
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-blue-500/20">
                  {task.completions_today || 0}/{task.max_completions_today} Lượt
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            {isJustCompleted ? (
              <p className="font-black text-[11px] text-green-500 uppercase tracking-widest mt-1">Hoàn thành</p>
            ) : (
              <>
                <p className="font-black text-lg text-emerald-500 leading-none">+{task.reward_amount.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground/70 uppercase font-bold tracking-widest mt-0.5">VND</p>
              </>
            )}
          </div>
          {!isJustCompleted && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
          >
            <div className="px-5 pb-6 pt-2 border-t border-border/30 mx-5 space-y-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {task.description || "Hãy hoàn thành nhiệm vụ này để nhận phần thưởng hấp dẫn. Đảm bảo bạn làm đúng theo thời gian yêu cầu."}
                </p>
              </div>

              <Link
                href={`/tasks/${task.id}`}
                className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Xem hướng dẫn & Bắt đầu
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
