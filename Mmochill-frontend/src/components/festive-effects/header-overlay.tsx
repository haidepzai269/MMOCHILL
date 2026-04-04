"use client";

import React from "react";
import { motion } from "framer-motion";

interface FestiveHeaderOverlayProps {
  event: string;
}

export function FestiveHeaderOverlay({ event }: FestiveHeaderOverlayProps) {
  if (event === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[-1]">
      {event === "victory_day" && (
        <>
          {/* Red Flag Background */}
          <div className="absolute inset-0 bg-[#da251d]" />
          
          {/* Animated Wave Effect - Moving from left to right every 3s */}
          <motion.div
            animate={{ 
              x: ["-100%", "100%"],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
          />
          
          {/* Centered Yellow Star */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
             <motion.span 
               animate={{ scale: [1, 1.1, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="text-5xl text-[#ffff00] drop-shadow-[0_0_15px_rgba(255,255,0,0.5)]"
             >
               ⭐
             </motion.span>
          </div>
        </>
      )}

      {event === "tet" && (
        <div className="absolute inset-0 bg-[#e11d48]/10 flex items-center justify-between px-4">
           <div className="flex flex-col items-center opacity-80 scale-125">
             <span className="text-xl">🧨</span>
             <span className="text-[10px] font-bold text-red-600 leading-none">Tết</span>
           </div>
           <div className="flex gap-4 opacity-30 text-2xl">
             <span>🌸</span>
             <span>🌼</span>
             <span>🌸</span>
           </div>
           <div className="flex flex-col items-center opacity-80 scale-125">
             <span className="text-xl">🍱</span> {/* Simplified Bánh Chưng emoji */}
             <span className="text-[10px] font-bold text-red-600 leading-none">An</span>
           </div>
        </div>
      )}

      {event === "halloween" && (
        <div className="absolute inset-0 bg-orange-500/5 flex items-center justify-between px-10">
           <div className="text-3xl filter drop-shadow-md">🎃</div>
           <motion.div 
             animate={{ 
               x: [-20, 20, -20],
               y: [-10, 10, -10],
               rotate: [-10, 10, -10]
             }}
             transition={{ duration: 4, repeat: Infinity }}
             className="text-3xl"
           >
             🦇
           </motion.div>
           <div className="text-3xl filter drop-shadow-md">👻</div>
        </div>
      )}
      
      {event === "christmas" && (
        <>
           <div className="absolute left-4 bottom-0 text-xl font-bold text-white/50">🎄</div>
           <div className="absolute right-4 bottom-0 text-xl font-bold text-white/50">❄️</div>
           <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
        </>
      )}
    </div>
  );
}
