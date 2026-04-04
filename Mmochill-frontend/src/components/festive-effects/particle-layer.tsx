"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ParticleLayerProps {
  event: string;
}

export function ParticleLayer({ event }: ParticleLayerProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    if (event === "none") {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles((prev) => [
        ...prev.slice(-30), // Limit particles
        {
          id: Math.random(),
          x: Math.random() * 100,
          y: -10,
          size: Math.random() * 10 + 5,
          duration: Math.random() * 20 + 10,
        },
      ]);
    }, 500);

    return () => clearInterval(interval);
  }, [event]);

  const getParticleType = () => {
    switch (event) {
      case "tet":
        return "🌸"; // Can alternate between cherry and apricot
      case "christmas":
        return "❄️";
      case "victory_day":
        return "⭐";
      case "halloween":
        return "🎃";
      default:
        return "";
    }
  };

  if (event === "none") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "-10vh", x: `${p.x}vw`, opacity: 0, rotate: 0 }}
            animate={{ 
              y: "110vh", 
              x: `${p.x + (Math.random() * 20 - 10)}vw`, 
              opacity: [0, 1, 1, 0],
              rotate: 360 
            }}
            transition={{ duration: p.duration, ease: "linear" }}
            exit={{ opacity: 0 }}
            className="absolute text-xl"
            style={{ fontSize: p.size }}
          >
            {getParticleType()}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
