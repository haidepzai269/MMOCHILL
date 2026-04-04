"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Copy, 
  CheckCircle2, 
  Gift, 
  Share2, 
  Trophy,
  ArrowRight,
  UserPlus,
  Coins,
  ShieldCheck,
  Zap,
  TrendingUp,
  History,
  X,
  ChevronRight,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getReferralStats } from "@/app/actions/referral";
import Loading from "@/components/loading";

interface ReferralStats {
  referral_code: string;
  referral_link: string;
  total_invited: number;
  total_commission: number;
  invited_users: {
    id: string;
    username: string;
    full_name: string;
    created_at: string;
  }[];
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInvitedModal, setShowInvitedModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getReferralStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        console.error("Failed to fetch referral stats:", res.error);
        toast.error("Không thể lấy thông tin giới thiệu. Vui lòng đăng nhập lại.");
      }
    } catch (error) {
      console.error("Failed to fetch referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, isFullMsg: boolean = false) => {
    let content = text;
    if (isFullMsg && stats) {
      content = `🔥 MMOChill - Kiếm tiền cực dễ mỗi ngày! 💰\n\nTham gia cùng mình tại: ${stats.referral_link}\n\nMã mời của mình: ${stats.referral_code}\n\nĐừng bỏ lỡ cơ hội gia tăng thu nhập thụ động ngay hôm nay! 🚀`;
    }
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(isFullMsg ? "Đã sao chép lời mời kèm link!" : "Đã sao chép!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loading isLoading={loading} />;

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#FF4D00] via-[#FF8A00] to-[#FFB800] p-8 md:p-12 text-white shadow-2xl shadow-orange-500/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl -mb-10 -ml-10" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-wider"
            >
              <Trophy className="w-3 h-3 text-yellow-300" /> Chương trình hấp dẫn nhất 2026
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              MỜI BẠN MỚI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white">NHẬN HOA HỒNG 10%</span>
            </h1>
            <p className="text-orange-50 text-base md:text-lg font-medium opacity-90 max-w-md">
              Mời ngay bạn bè tham gia MMOChill để nhận hoa hồng trọn đời từ mỗi nhiệm vụ họ hoàn thành!
            </p>
          </div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-48 h-48 md:w-64 md:h-64 relative shrink-0"
          >
             <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
             <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center p-6 shadow-inner">
                <div className="relative">
                  <Coins className="w-32 h-32 md:w-40 md:h-40 text-yellow-400 drop-shadow-2xl" />
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute -top-4 -right-4 bg-white text-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ring-4 ring-orange-500/20"
                  >
                    10%
                  </motion.div>
                </div>
             </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setShowInvitedModal(true)}
          className="bg-card border border-border/50 p-6 rounded-[2rem] shadow-lg flex items-center gap-6 group hover:border-orange-500/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/5 transition-colors" />
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-500 relative z-10">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex flex-col relative z-10">
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Bạn bè đã mời</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-foreground tracking-tight">{stats?.total_invited || 0}</span>
              <div className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-tighter">
                Xem ngay
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground/30 group-hover:text-orange-500 transition-colors" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border/50 p-6 rounded-[2rem] shadow-lg flex items-center gap-6 group hover:border-green-500/30 transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Hoa hồng đã nhận</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground tracking-tight">{stats?.total_commission.toLocaleString() || 0}</span>
              <span className="text-sm font-bold text-green-500">VND</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Actions */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border/40 p-8 rounded-[2rem] shadow-xl space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mt-16 -mr-16 blur-2xl" />
            
            <div className="space-y-6 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Chia sẻ link ngay</h3>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">Link giới thiệu của bạn</label>
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-2xl border border-border focus-within:border-orange-500/50 transition-colors bg-card-secondary/50 backdrop-blur-sm shadow-inner group">
                  <div className="flex-1 px-4 py-3 text-sm font-mono truncate text-muted-foreground group-hover:text-foreground transition-colors overflow-x-auto no-scrollbar">
                    {stats?.referral_link}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(stats?.referral_link || "", true)}
                    className="p-3.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20 md:px-6 md:flex md:items-center md:gap-2 uppercase text-xs font-bold tracking-widest"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden md:inline">Sao chép lời mời</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-2 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -mt-8 -mr-8" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mã giới thiệu</span>
                    <span className="text-2xl font-black tracking-widest text-orange-500">{stats?.referral_code}</span>
                 </div>
                 <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex flex-col justify-center">
                    <p className="text-sm font-bold text-orange-600/80 leading-relaxed italic">
                      "Càng nhiều bạn bè, thu nhập càng thụ động!"
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* How it works */}
          <div className="bg-card border border-border/40 p-8 rounded-[2.5rem] shadow-xl">
             <h3 className="text-xl font-bold mb-8 flex items-center gap-3 px-2">
               <ShieldCheck className="w-6 h-6 text-orange-500" />
               Quy trình nhận thưởng
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connector lines (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-orange-500/40 via-orange-500/10 to-transparent dashed" />
                
                {[
                  { 
                    icon: UserPlus, 
                    title: "Mời bạn bè", 
                    desc: "Gửi link giới thiệu cho bạn bè tham gia", 
                    color: "bg-blue-500", 
                    step: "01"
                  },
                  { 
                    icon: Zap, 
                    title: "Hoàn nhiệm vụ", 
                    desc: "Bạn bè hoàn thành các nhiệm vụ trên web", 
                    color: "bg-purple-500", 
                    step: "02"
                  },
                  { 
                    icon: Gift, 
                    title: "Nhận tiền", 
                    desc: "Nhận ngay 10% hoa hồng vào ví tiền tươi", 
                    color: "bg-orange-500", 
                    step: "03"
                  }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (idx * 0.1) }}
                    className="flex flex-col items-center text-center space-y-4 relative z-10"
                  >
                    <div className={`w-20 h-20 rounded-3xl ${item.color} p-5 shadow-2xl shadow-${item.color.split('-')[1]}-500/20 text-white relative group`}>
                       <item.icon className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                       <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-foreground text-background text-[10px] font-black flex items-center justify-center border-2 border-card">
                         {item.step}
                       </div>
                    </div>
                    <div className="space-y-1 px-4">
                      <h4 className="font-black text-base uppercase tracking-tight">{item.title}</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* Regulations & Sidebar info */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-card to-muted/30 border border-border/50 p-6 rounded-[2rem] shadow-xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl -mt-10 -mr-10" />
            
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              Quy định chương trình
            </h3>
            
            <ul className="space-y-4">
              {[
                "Hoa hồng 10% tính trên số tiền bạn bè thực nhận.",
                "Thanh toán ngay lập tức khi nhiệm vụ hoàn thành.",
                "Không giới hạn số lượng bạn bè tham gia mời.",
                "Nghiêm cấm tự tạo nhiều tài khoản để lách luật.",
                "Quyết định của MMOChill là quyết định cuối cùng."
              ].map((rule, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                   <div className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                   <span className="text-xs text-muted-foreground font-medium leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] italic text-muted-foreground/80 leading-relaxed">
              Lưu ý: Hệ thống quét gian lận hoạt động 24/7. Các hành vi gian lận sẽ bị khóa tài khoản vĩnh viễn.
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-card border border-border/50 p-6 rounded-[2rem] shadow-lg text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center text-muted-foreground">
              <Share2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm mb-2">Bạn cần thêm tài liệu marketing?</h4>
            <p className="text-xs text-muted-foreground mb-4">Liên hệ support để được hỗ trợ banner chất lượng cao.</p>
            <button className="w-full py-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Liên hệ Admin
            </button>
          </motion.div>
        </div>
      </div>
      {/* Invited Friends Modal */}
      <AnimatePresence>
        {showInvitedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvitedModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">Danh sách bạn bè</h3>
                </div>
                <button 
                  onClick={() => setShowInvitedModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                {!stats?.invited_users || stats.invited_users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                      <UserPlus className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Chưa có bạn bè tham gia</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Hãy bắt đầu chia sẻ link để nhận hoa hồng!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.invited_users.map((user) => (
                      <div 
                        key={user.id} 
                        className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between group hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold uppercase text-sm shadow-inner">
                            {user.full_name?.charAt(0) || user.username?.charAt(0) || "?"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold truncate max-w-[150px]">
                              {user.full_name || user.username}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.created_at).toLocaleDateString("vi-VN")}
                            </div>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                          Thành viên
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-muted/30 border-t border-border">
                <button 
                  onClick={() => setShowInvitedModal(false)}
                  className="w-full py-4 rounded-2xl bg-foreground text-background font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                >
                  Đóng danh sách
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
