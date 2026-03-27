"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingProps {
  isLoading: boolean;
}

const Loading = ({ isLoading }: LoadingProps) => {
  const text = "MMOCHILL...";
  const characters = text.split("");

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <div className="flex space-x-0.5 md:space-x-1">
            {characters.map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: 0, opacity: 0.3 }}
                animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
                className="text-xs md:text-sm font-medium uppercase tracking-[0.4em] text-white"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loading;
