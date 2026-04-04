"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAppearance } from "@/components/appearance-provider";
import { Palette, Layout, Sidebar as SidebarIcon, Type, Save, RotateCcw, Check, Zap } from "lucide-react";
import { motion } from "framer-motion";

const PRESETS = [
  { name: "Đỏ", color: "#ef4444" },
  { name: "Xanh lá", color: "#22c55e" },
  { name: "Vàng", color: "#eab308" },
  { name: "Cam", color: "#f97316" },
  { name: "Tím", color: "#a855f7" },
];

const GRADIENTS = [
  { name: "Blue Purple", value: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" },
  { name: "Sunset Orange", value: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" },
  { name: "Emerald Sea", value: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)" },
  { name: "Midnight", value: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" },
  { name: "Candy", value: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" },
];

export default function AppearanceAdminPage() {
  const { settings, refresh } = useAppearance();
  const [sidebarBg, setSidebarBg] = useState("#18181b");
  const [sidebarText, setSidebarText] = useState("#fafafa");
  const [pageBg, setPageBg] = useState("#09090b");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [activeEvent, setActiveEvent] = useState("none");
  const [eventMode, setEventMode] = useState("manual");
  const [soundClickUrl, setSoundClickUrl] = useState("");
  const [soundNotificationUrl, setSoundNotificationUrl] = useState("");
  const [soundSuccessUrl, setSoundSuccessUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setSidebarBg(settings.sidebar_bg);
      setSidebarText(settings.sidebar_text);
      setPageBg(settings.page_bg);
      setPrimaryColor(settings.primary_color);
      setActiveEvent(settings.active_event || "none");
      setEventMode(settings.event_mode || "manual");
      setSoundClickUrl(settings.sound_click_url || "");
      setSoundNotificationUrl(settings.sound_notification_url || "");
      setSoundSuccessUrl(settings.sound_success_url || "");
    }
  }, [settings]);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = getCookie("user_token_local");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1'}/admin/appearance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          sidebar_bg: sidebarBg,
          sidebar_text: sidebarText,
          page_bg: pageBg,
          primary_color: primaryColor,
          active_event: activeEvent,
          event_mode: eventMode,
          sound_click_url: soundClickUrl,
          sound_notification_url: soundNotificationUrl,
          sound_success_url: soundSuccessUrl,
        }),
      });

      if (res.ok) {
        toast.success("Đã cập nhật giao diện thành công!");
        refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Không thể cập nhật giao diện");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setSidebarBg("#18181b");
    setSidebarText("#fafafa");
    setPageBg("#09090b");
    setPrimaryColor("#3b82f6");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 italic uppercase">
          <Palette className="w-8 h-8 text-primary" />
          Quản lý Giao diện
        </h1>
        <p className="text-muted-foreground">Tùy chỉnh màu sắc hệ thống cho toàn bộ người dùng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6 bg-card border border-border rounded-3xl p-8 shadow-xl">
          {/* Primary Color Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" /> Màu sắc chủ đạo (Nút bấm, Active)
            </h2>
            <div className="flex flex-wrap gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setPrimaryColor(p.color)}
                  className="group relative w-12 h-12 rounded-2xl border-2 border-transparent hover:border-white transition-all shadow-lg overflow-hidden"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {primaryColor === p.color && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-2xl border-2 border-transparent cursor-pointer bg-transparent"
              />
            </div>
          </section>

          {/* Page Background Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" /> Nền trang người dùng
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setPageBg("#09090b")}
                className={`px-4 py-2 rounded-xl border border-border transition-all ${pageBg === "#09090b" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Mặc định (Tối)
              </button>
              <button
                onClick={() => setPageBg("#f8fafc")}
                className={`px-4 py-2 rounded-xl border border-border transition-all ${pageBg === "#f8fafc" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Sáng
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g.name}
                  onClick={() => setPageBg(g.value)}
                  className={`h-12 rounded-xl border-2 transition-all overflow-hidden relative text-[10px] font-bold uppercase tracking-wider ${pageBg === g.value ? "border-white" : "border-transparent opacity-70 hover:opacity-100"}`}
                  style={{ background: g.value }}
                >
                  <span className="relative z-10 text-white drop-shadow-md">{g.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Sidebar Background Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <SidebarIcon className="w-5 h-5 text-primary" /> Nền Sidebar
            </h2>
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">Chọn màu nền:</span>
                <input
                  type="color"
                  value={sidebarBg.includes("gradient") ? "#18181b" : sidebarBg}
                  onChange={(e) => setSidebarBg(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between gap-4 mt-4">
                <span className="text-sm">Màu chữ hiển thị:</span>
                <div className="flex gap-2">
                  <button onClick={() => setSidebarText("#fafafa")} className={`w-8 h-8 rounded-full border border-border bg-[#fafafa] ${sidebarText === "#fafafa" ? "ring-2 ring-primary" : ""}`} />
                  <button onClick={() => setSidebarText("#0f172a")} className={`w-8 h-8 rounded-full border border-border bg-[#0f172a] ${sidebarText === "#0f172a" ? "ring-2 ring-primary" : ""}`} />
                </div>
              </div>
            </div>
          </section>

          {/* Holiday Configuration Section */}
          <section className="space-y-4 pt-4 border-t border-border/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Cấu hình Lễ hội
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Chế độ</label>
                <select 
                  value={eventMode} 
                  onChange={(e) => setEventMode(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="manual">Thủ công</option>
                  <option value="auto">Tự động (Theo ngày)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase text-nowrap">Sự kiện kích hoạt</label>
                <select 
                  value={activeEvent} 
                  disabled={eventMode === "auto"}
                  onChange={(e) => setActiveEvent(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="none">Không có</option>
                  <option value="victory_day">30/4 & 1/5</option>
                  <option value="tet">Tết Nguyên Đán</option>
                  <option value="christmas">Giáng sinh</option>
                  <option value="halloween">Halloween</option>
                </select>
              </div>
            </div>
            {eventMode === "auto" && (
              <p className="text-[10px] text-primary bg-primary/5 p-2 rounded-lg italic">
                * Ở chế độ Tự động, hệ thống sẽ tự kích hoạt hiệu ứng dựa trên ngày tháng thực tế.
              </p>
            )}
          </section>
          
          {/* Sound Configuration Section */}
          <section className="space-y-4 pt-4 border-t border-border/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Cấu hình Âm thanh (Freesound URL)
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Âm thanh Click</label>
                <input 
                  type="text"
                  value={soundClickUrl}
                  onChange={(e) => setSoundClickUrl(e.target.value)}
                  placeholder="URL âm thanh click..."
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Âm thanh Thông báo</label>
                <input 
                  type="text"
                  value={soundNotificationUrl}
                  onChange={(e) => setSoundNotificationUrl(e.target.value)}
                  placeholder="URL âm thanh thông báo..."
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Âm thanh Thành công (Claim)</label>
                <input 
                  type="text"
                  value={soundSuccessUrl}
                  onChange={(e) => setSoundSuccessUrl(e.target.value)}
                  placeholder="URL âm thanh thành công..."
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic bg-muted/50 p-2 rounded-lg">
                Mẹo: Bạn có thể lấy link trực tiếp từ Freesound (chuột phải vào nút Play → Copy Link Address) hoặc các nguồn CDN khác.
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Save className="w-5 h-5" />
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              onClick={resetToDefault}
              className="p-4 bg-muted hover:bg-muted/80 rounded-2xl transition-all"
              title="Khôi phục mặc định"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold italic uppercase tracking-wider">Preview (Trực tiếp)</h2>
          
          <div 
            className="rounded-[2.5rem] border-8 border-gray-800 shadow-2xl relative overflow-hidden aspect-[4/3] flex"
            style={{ background: pageBg.includes("gradient") ? pageBg : pageBg }}
          >
            {/* Mock Sidebar */}
            <div 
              className="w-1/4 b-r border-white/10 p-4 space-y-4"
              style={{ background: sidebarBg.includes("gradient") ? sidebarBg : sidebarBg }}
            >
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: primaryColor }} />
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-white/20" />
                <div className="h-2 w-3/4 rounded bg-white/10" />
                <div className="h-2 w-full rounded bg-white/10" />
              </div>
              <div className="pt-8 space-y-2">
                 <div className="h-6 w-full rounded-lg" style={{ backgroundColor: `${primaryColor}30` }} />
                 <div className="h-2 w-1/2 mx-auto rounded bg-white/10" />
              </div>
            </div>

            {/* Mock Content */}
            <div className="flex-1 p-8 space-y-6 overflow-hidden">
               <div className="flex justify-between items-center">
                  <div className="h-6 w-1/3 rounded bg-white/10" />
                  <div className="w-8 h-8 rounded-full bg-white/10" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-white/5 rounded-3xl border border-white/10 flex flex-col justify-end p-4">
                     <div className="h-2 w-1/2 bg-white/20 rounded" />
                  </div>
                  <div className="h-32 bg-white/5 rounded-3xl border border-white/10 flex flex-col justify-end p-4">
                     <div className="h-2 w-1/2 bg-white/20 rounded" />
                  </div>
               </div>

               <div className="space-y-4">
                  <button className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs" style={{ backgroundColor: primaryColor, color: '#fff' }}>
                     Gửi tiền ngay
                  </button>
                  <div className="h-40 bg-white/5 rounded-3xl border border-white/10" />
               </div>
            </div>

            {/* Overlay Gradient for page background if solid */}
            {!pageBg.includes("gradient") && (
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent" />
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-sm text-blue-200">
             <Layout className="w-5 h-5 shrink-0" />
             <p>Giao diện xem trước chỉ là mô phỏng. Sau khi lưu, toàn bộ hệ thống sẽ được áp dụng màu sắc mới ngay lập tức.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
