"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Coins, 
  Zap, 
  RefreshCw,
  Sparkles,
  Info,
  TrendingUp,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getBonusStatus, checkIn, spinLuckyWheel } from "@/app/actions/bonus";
import Link from "next/link";
import confetti from "canvas-confetti";
import Loading from "@/components/loading";
import { useSound } from "@/lib/contexts/sound-context";

interface BonusStatus {
  streak: number;
  can_check_in: boolean;
  can_spin: boolean;
  next_reward: number;
  days: boolean[];
}

// Cấu hình 6 ô — index phải khớp backend (0-5)
const WHEEL_SEGMENTS = [
  { label: "100", sublabel: "VND", color: "#6366f1", textColor: "#fff" },
  { label: "80",  sublabel: "VND", color: "#9333ea", textColor: "#fff" },
  { label: "200", sublabel: "VND", color: "#ec4899", textColor: "#fff" },
  { label: "10K", sublabel: "VND", color: "#f97316", textColor: "#fff" },
  { label: "20K", sublabel: "VND", color: "#eab308", textColor: "#1a1a1a" },
  { label: "✕",   sublabel: "Hụt", color: "#334155", textColor: "#94a3b8" },
];

const NUM = WHEEL_SEGMENTS.length; // 6
const DEG = 360 / NUM;             // 60°
const OFFSET = -120;               // segment 0 nằm giữa đỉnh (-90°) => từ -120° đến -60°

export default function DailyCheckinPage() {
  const [status, setStatus] = useState<BonusStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonSegment, setWonSegment] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    setLoading(true); setError(null);
    const res = await getBonusStatus();
    if (res.success) setStatus(res.data);
    else { setError(res.error || "Không thể tải bonus"); toast.error(res.error || "Không thể tải bonus"); }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!status?.can_check_in) return;
    toast.promise(checkIn(), {
      loading: "Đang thực hiện điểm danh...",
      success: (res: any) => {
        if (res.success) { 
          playSound("success");
          fetchStatus(); 
          return `Điểm danh thành công! Nhận được ${res.data.reward} VND`; 
        }
        throw new Error(res.error);
      },
      error: (err) => err.message,
    });
  };

  const handleSpin = async () => {
    if (!status?.can_spin || spinning) return;
    setSpinning(true); setWonSegment(null);

    const res = await spinLuckyWheel();
    if (!res.success) { toast.error(res.error); setSpinning(false); return; }

    const { index, reward, label } = res.data;

    // Tính góc dừng: ô i chiếm [OFFSET + i*DEG, OFFSET + (i+1)*DEG], giữa ô = OFFSET + i*DEG + DEG/2
    // Để giữa ô i lên đỉnh (-90°), ta cần xoay thêm -(90 + midAngle)
    const midAngle = OFFSET + index * DEG + DEG / 2;
    const targetAngle = -90 - midAngle; // counter-rotate để đưa midAngle về -90° (đỉnh thực sự trên hệ toạ độ SVG/CSS)
    const extraRounds = 6 * 360;
    const newRotation = rotation + extraRounds + (targetAngle - (rotation % 360));

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false); setWonSegment(index); fetchStatus();
      if (reward > 0) {
        playSound("success");
        toast.success(`🎉 Chúc mừng! Bạn trúng ${label}`);
        const fire = (angle: number, spread: number) => confetti({ particleCount: 60, angle, spread, origin: { y: 0.6 }, colors: ["#6366f1","#a855f7","#ec4899","#f97316","#eab308"] });
        setTimeout(() => { fire(60, 55); fire(120, 55); }, 100);
        setTimeout(() => { fire(75, 70); fire(105, 70); }, 450);
      } else { toast.info(label); }
    }, 4500);
  };

  /* ── Loading / Error states ── */
  if (loading && !status) return <Loading isLoading={loading} />;

  if (error && !status) return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <Info className="w-10 h-10 text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Không thể tải dữ liệu</h2>
        <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
      </div>
      <button onClick={fetchStatus} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">Thử lại</button>
    </div>
  );

  const rewards = [100, 100, 150, 150, 200, 200, 300];

  /* ── Helpers vẽ SVG ── */
  const segmentPath = (i: number) => {
    const s = (OFFSET + i * DEG) * Math.PI / 180;
    const e = (OFFSET + (i + 1) * DEG) * Math.PI / 180;
    return `M 0 0 L ${Math.cos(s)} ${Math.sin(s)} A 1 1 0 0 1 ${Math.cos(e)} ${Math.sin(e)} Z`;
  };

  /* Vị trí text overlay (%) — cố định, không bị ảnh hưởng bởi rotation */
  const textPos = (i: number) => {
    const mid = (OFFSET + i * DEG + DEG / 2) * Math.PI / 180;
    const r = 0.61;
    return { left: `${50 + r * Math.cos(mid) * 50}%`, top: `${50 + r * Math.sin(mid) * 50}%` };
  };

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto">

      {/* ─── Header Banner ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white shadow-2xl shadow-purple-500/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20 animate-pulse" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">System Update 2026</div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase">
              Hệ Thống <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-white">Siêu Bonus</span>
            </h1>
            <p className="text-purple-100 text-sm md:text-base font-medium opacity-90 max-w-md">
              Tham gia điểm danh mỗi ngày và thử vận may với vòng quay để nhận hàng ngàn phần quà giá trị.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center p-6 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Chuỗi ngày</span>
              <span className="text-5xl font-black tracking-tighter">{status?.streak || 0}</span>
            </div>
            <Link href="/bonus/referral" className="p-4 rounded-[2rem] bg-yellow-400 text-yellow-950 hover:bg-yellow-300 transition-colors shadow-lg group">
              <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ─── Daily Check-in ─── */}
        <div className="lg:col-span-12">
          <section className="bg-card border border-border/50 rounded-[3rem] p-8 md:p-10 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -mt-10 -mr-10" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-black flex items-center gap-3"><Calendar className="w-7 h-7 text-indigo-500" />Điểm danh nhận quà</h2>
                <p className="text-sm text-muted-foreground font-medium">Hoàn thành 7 ngày để nhận thưởng lớn nhất</p>
              </div>
              <button
                onClick={handleCheckIn} disabled={!status?.can_check_in}
                className={`px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-xl active:scale-95 ${status?.can_check_in ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                {status?.can_check_in ? "Điểm danh ngay" : "Đã nhận hôm nay"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
              {rewards.map((reward, i) => {
                const isClaimed = status?.days[i];
                const isCurrent = status?.can_check_in && i === status.streak;
                const isLocked = !isClaimed && !isCurrent;
                return (
                  <motion.div key={i} whileHover={{ y: isLocked ? 0 : -5 }}
                    className={`relative p-5 rounded-[2rem] flex flex-col items-center gap-4 transition-all duration-300 border ${isClaimed ? "bg-indigo-600/5 border-indigo-600/20" : isCurrent ? "bg-gradient-to-b from-indigo-500/10 to-transparent border-indigo-500/40 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20" : "bg-muted/30 border-border/50 opacity-60"}`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isCurrent ? "text-indigo-500" : "text-muted-foreground"}`}>Ngày {i + 1}</span>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isClaimed ? "bg-indigo-600 text-white" : isCurrent ? "bg-indigo-500/20 text-indigo-500 scale-110" : "bg-card text-muted-foreground"}`}>
                      {isClaimed ? <CheckCircle2 className="w-6 h-6" /> : <Coins className="w-6 h-6" />}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`text-base font-black ${isClaimed ? "text-indigo-600" : isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{reward}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">VND</span>
                    </div>
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ─── Lucky Spin ─── */}
        <div className="lg:col-span-12">
          <section className="bg-card border border-border/50 rounded-[3rem] p-8 md:p-12 shadow-xl overflow-hidden relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_70%)]" />

            {/* Cột mô tả + nút */}
            <div className="flex-1 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                <Zap className="w-3 h-3" /> May mắn mỗi ngày
              </div>
              <h2 className="text-4xl font-black tracking-tight leading-tight uppercase">
                Vòng Quay <br /><span className="text-purple-600">May Mắn</span>
              </h2>
              <p className="text-muted-foreground font-medium max-w-sm leading-relaxed">
                Cơ hội nhận tới 20,000 VND chỉ với một lượt quay duy nhất. Đừng bỏ lỡ vận may của bạn hôm nay!
              </p>
              <div className="flex items-center justify-center lg:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold">1 Lượt / Ngày</span>
                </div>
              </div>
              <button
                onClick={handleSpin} disabled={!status?.can_spin || spinning}
                className={`w-full lg:w-auto px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl active:scale-95 z-20 relative ${status?.can_spin && !spinning ? "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/30" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  {spinning ? <><RefreshCw className="w-5 h-5 animate-spin" /> Đang quay...</> : !status?.can_spin ? "Đã quay hôm nay" : "Quay ngay"}
                </span>
              </button>
            </div>

            {/* ─── WHEEL ─── */}
            <div
              className="relative shrink-0 w-[300px] h-[300px] md:w-[420px] md:h-[420px] z-10"
              ref={wheelRef}
            >
              {/* Kim chỉ */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 -translate-y-2">
                <svg width="24" height="36" viewBox="0 0 24 36" className="drop-shadow-xl">
                  <polygon points="12,0 22,10 2,10" fill="#f43f5e" />
                  <rect x="9" y="10" width="6" height="26" rx="3" fill="#f43f5e" />
                </svg>
              </div>

              {/* Vành đai glow */}
              <div className={`absolute inset-0 rounded-full border-4 border-purple-500/30 transition-all duration-300 pointer-events-none ${spinning ? "shadow-[0_0_80px_rgba(168,85,247,0.5)]" : "shadow-[0_0_40px_rgba(168,85,247,0.15)]"}`} />

              {/* Vòng quay — Chứa cả màu và chữ để cùng xoay */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
                }}
              >
                {/* SVG vẽ các miếng màu */}
                <svg viewBox="-1 -1 2 2" className="w-full h-full">
                  {WHEEL_SEGMENTS.map((seg, i) => (
                    <g key={i}>
                      <path d={segmentPath(i)} fill={seg.color} stroke="rgba(255,255,255,0.2)" strokeWidth="0.016" opacity={wonSegment === i ? 1 : 0.88} />
                      {wonSegment === i && (
                        <path d={segmentPath(i)} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.03" />
                      )}
                    </g>
                  ))}
                  <circle cx="0" cy="0" r="0.13" fill="rgba(255,255,255,0.08)" />
                </svg>

                {/* TEXT LAYER — Bây giờ đã nằm TRONG div xoay */}
                {WHEEL_SEGMENTS.map((seg, i) => {
                  // Tính góc cho từng nhãn: 
                  // Múi giờ gốc OFFSET = -120, mỗi ô 60deg
                  const midAngle = OFFSET + i * DEG + DEG / 2;
                  const angle = midAngle + 90;
                  // Tính vị trí x,y bằng lượng giác (bán kính r = 120px)
                  const r = 120;
                  const dx = r * Math.cos(midAngle * Math.PI / 180);
                  const dy = r * Math.sin(midAngle * Math.PI / 180);
                  
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 pointer-events-none select-none flex flex-col items-center justify-center z-10"
                      style={{ 
                        width: "100px",
                        height: "40px",
                        // Dịch tâm về chính giữa phần tử (-50%), sau đó đẩy đi dx, dy, rồi xoay góc
                        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${angle}deg)`,
                      }}
                    >
                      <span className="font-black leading-none text-center" style={{ color: seg.textColor, fontSize: "clamp(12px, 4vw, 20px)", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                        {seg.label}
                      </span>
                      <span className="font-bold leading-none text-center" style={{ color: seg.textColor, fontSize: "clamp(8px, 2vw, 10px)", opacity: 0.9, marginTop: "2px" }}>
                        {seg.sublabel}
                      </span>
                    </div>
                  );
                })}
              </div>


              {/* Nút tâm */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-20 md:h-20 bg-card border-[4px] border-white/20 rounded-full flex items-center justify-center shadow-2xl z-20 pointer-events-none">
                {spinning
                  ? <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-purple-400 animate-spin" />
                  : <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
                }
              </div>

              {/* Pulse khi đang quay */}
              {spinning && <div className="absolute inset-[-6px] rounded-full border-2 border-purple-400/40 animate-ping pointer-events-none" />}
            </div>
          </section>
        </div>
      </div>

      {/* ─── Quy định ─── */}
      <section className="bg-card/50 border border-border/40 rounded-[2.5rem] p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Info className="w-5 h-5 text-indigo-500" />Quy định chương trình</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[
              ["01", "Điểm danh liên tục trong 7 ngày để tối ưu hóa thu nhập. Nếu bỏ lỡ một ngày, chuỗi ngày sẽ được đặt lại về 1."],
              ["02", <>Vòng quay may mắn được làm mới vào lúc <b>00:00</b> mỗi ngày.</>],
            ].map(([n, text], idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-bold text-xs">{n}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[
              ["03", "Tiền thưởng từ Điểm danh và Vòng quay được cộng trực tiếp vào ví chính và có thể rút ngay lập tức."],
              ["04", "Mọi hành vi gian lận (sử dụng nhiều tài khoản, auto-click) sẽ bị khóa tài khoản vĩnh viễn."],
            ].map(([n, text], idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-bold text-xs">{n}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
