"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingProps {
  isLoading: boolean;
}

const Loading = ({ isLoading }: LoadingProps) => {
  const letters = "MMOCHILL".split("");
  const [dotCount, setDotCount] = useState(1);

  // Dấu chấm động: 1 → 2 → 3 → 1 → ...
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 480);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/65 backdrop-blur-sm"
        >
          {/* Glow phía sau */}
          <div className="absolute w-56 h-56 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

          {/* Cụm chữ MMOCHILL + dấu chấm */}
          <div className="relative flex items-end gap-[1px]">
            {letters.map((char, i) => (
              <motion.span
                key={i}
                animate={{
                  y: [0, -24, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: letters.length * 0.09 + 0.3,
                  delay: i * 0.09,
                  times: [0, 0.3, 1],
                  ease: "easeInOut",
                }}
                className="text-2xl md:text-4xl font-black text-white tracking-wide select-none"
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.span>
            ))}

            {/* Dấu chấm động */}
            <div className="flex items-end pb-[3px] ml-[2px] gap-[1px] min-w-[28px] md:min-w-[40px]">
              <AnimatePresence mode="popLayout">
                {Array.from({ length: dotCount }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.3, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.18 }}
                    className="text-2xl md:text-4xl font-black text-white select-none leading-none"
                    style={{ display: "inline-block" }}
                  >
                    .
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Tagline nhỏ */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-5 text-[10px] md:text-xs font-medium uppercase tracking-[0.35em] text-white/50 select-none"
          >
            Đang tải...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loading;
