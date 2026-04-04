"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAppearance } from "@/components/appearance-provider";
import { getUserProfile } from "@/app/actions/auth";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => Promise<void>;
  playSound: (type: "click" | "notification" | "success") => void;
}

const SoundContext = createContext<SoundContextType>({
  isMuted: false,
  toggleMute: async () => {},
  playSound: () => {},
});

export const useSound = () => useContext(SoundContext);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useAppearance();
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Audio elements refs for preloading
  const clickAudio = useRef<HTMLAudioElement | null>(null);
  const notificationAudio = useRef<HTMLAudioElement | null>(null);
  const successAudio = useRef<HTMLAudioElement | null>(null);

  // Load user preference from DB
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const user = await getUserProfile();
        if (user) {
          setIsMuted(!user.sound_enabled);
        }
      } catch (error) {
        console.error("Failed to load sound preference:", error);
      }
      setIsInitialized(true);
    };
    loadPreference();
  }, []);

  // Initialize/Update audio elements when settings change
  useEffect(() => {
    if (settings) {
      if (settings.sound_click_url) clickAudio.current = new Audio(settings.sound_click_url);
      if (settings.sound_notification_url) notificationAudio.current = new Audio(settings.sound_notification_url);
      if (settings.sound_success_url) successAudio.current = new Audio(settings.sound_success_url);
      
      // Preload
      [clickAudio, notificationAudio, successAudio].forEach(ref => {
        if (ref.current) {
          ref.current.load();
          ref.current.volume = 0.5; // Default volume
        }
      });
    }
  }, [settings]);

  const playSound = useCallback((type: "click" | "notification" | "success") => {
    if (isMuted || !isInitialized) return;

    let audio: HTMLAudioElement | null = null;
    switch (type) {
      case "click": audio = clickAudio.current; break;
      case "notification": audio = notificationAudio.current; break;
      case "success": audio = successAudio.current; break;
    }

    if (audio) {
      // Clone for overlapping sounds if needed, but for SFX simple reset is usually enough
      audio.currentTime = 0;
      audio.play().catch(e => console.warn("Audio play blocked by browser:", e));
    }
  }, [isMuted, isInitialized]);

  const toggleMute = async () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    try {
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      };
      const token = getCookie("user_token_local");

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1'}/auth/settings/sound`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !newMuteState }),
      });

      if (!res.ok) {
         // Revert on error
         setIsMuted(isMuted);
         console.error("Failed to save sound preference to server");
      }
    } catch (error) {
      setIsMuted(isMuted);
      console.error("Error toggling sound:", error);
    }
  };

  // Global click listener
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Play sound if clicked on button, link, or elements with specifically defined sound
      if (
        target.tagName === "BUTTON" || 
        target.tagName === "A" || 
        target.closest("button") || 
        target.closest("a") ||
        target.getAttribute("role") === "button"
      ) {
        playSound("click");
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [playSound]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}
