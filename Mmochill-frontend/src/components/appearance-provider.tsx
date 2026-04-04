"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { HolidayEffects } from "./festive-effects";

interface AppearanceSettings {
  sidebar_bg: string;
  sidebar_text: string;
  page_bg: string;
  primary_color: string;
  active_event: string;
  event_mode: string;
  sound_click_url: string;
  sound_notification_url: string;
  sound_success_url: string;
}

const AppearanceContext = createContext<{
  settings: AppearanceSettings | null;
  effectiveEvent: string;
  refresh: () => Promise<void>;
}>({
  settings: null,
  effectiveEvent: "none",
  refresh: async () => {},
});

export const useAppearance = () => useContext(AppearanceContext);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1'}/appearance`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        applySettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch appearance settings:", error);
    }
  };

  const getAutoEvent = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // 30/4 & 1/5 (Victory Day)
    if ((month === 4 && day >= 25) || (month === 5 && day <= 3)) return "victory_day";
    // Tết (Approx for 2026: Jan 15 - Feb 5)
    if ((month === 1 && day >= 15) || (month === 2 && day <= 5)) return "tet";
    // Halloween (Oct 25 - Nov 2)
    if ((month === 10 && day >= 25) || (month === 11 && day <= 2)) return "halloween";
    // Christmas (Dec 15 - Dec 31)
    if (month === 12 && day >= 15) return "christmas";

    return "none";
  };

  const applySettings = (data: AppearanceSettings) => {
    const root = document.documentElement;
    const effectiveEvent = data.event_mode === "auto" ? getAutoEvent() : data.active_event;

    // Apply Primary Color
    if (data.primary_color) {
      if (effectiveEvent === "victory_day") {
        root.style.setProperty("--primary", "#ef4444"); // Victory Red
        root.style.setProperty("--primary-foreground", "#fcd34d"); // Star Yellow
      } else if (effectiveEvent === "tet") {
        root.style.setProperty("--primary", "#e11d48"); // Lunar Red
      } else {
        root.style.setProperty("--primary", data.primary_color);
      }
    }

    // Apply Page Background
    if (data.page_bg) {
      if (data.page_bg.includes("gradient")) {
        root.style.setProperty("--background", "transparent");
        document.body.style.backgroundImage = data.page_bg;
        document.body.style.backgroundAttachment = "fixed";
      } else {
        root.style.setProperty("--background", data.page_bg);
        document.body.style.backgroundImage = "none";
      }
    }

    // Apply Sidebar/Card Background
    if (data.sidebar_bg) {
      if (data.sidebar_bg.includes("gradient")) {
        root.style.setProperty("--card", "transparent");
        // We'll handle sidebar specifically in the sidebar component or via a specific variable
        root.style.setProperty("--sidebar-bg", data.sidebar_bg);
      } else {
        root.style.setProperty("--card", data.sidebar_bg);
        root.style.setProperty("--sidebar-bg", data.sidebar_bg);
      }
    }

    // Apply Text Colors if needed
    if (data.sidebar_text) {
      root.style.setProperty("--card-foreground", data.sidebar_text);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const effectiveEvent = settings ? (settings.event_mode === "auto" ? getAutoEvent() : settings.active_event) : "none";

  return (
    <AppearanceContext.Provider value={{ settings, effectiveEvent, refresh: fetchSettings }}>
      {children}
      <HolidayEffects event={effectiveEvent} />
    </AppearanceContext.Provider>
  );
}
