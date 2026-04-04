"use client";

import React, { useState, useEffect } from "react";
import Loading from "@/components/loading";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Link2, 
  AlertTriangle, 
  MessageSquare, 
  XOctagon, 
  Info,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

const RuleCard = ({ icon: Icon, title, content, color }: { icon: any, title: string, content: string | React.ReactNode, color: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    className={`p-6 rounded-3xl bg-neutral-900/50 border border-white/10 backdrop-blur-xl relative overflow-hidden group`}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${color}-500`} />
    <div className={`w-12 h-12 rounded-2xl bg-${color}-500/20 flex items-center justify-center text-${color}-500 mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{content}</div>
  </motion.div>
);

export default function TermsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4 pt-8">
      <Loading isLoading={loading} />
      {/* Header Section */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-4"
        >
          <ShieldCheck className="w-4 h-4" /> Hệ Thống Minh Bạch
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white bg-clip-text"
        >
          Điều Khoản & <span className="text-primary">Quy Định</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400 max-w-2xl mx-auto text-lg"
        >
          Vui lòng đọc kỹ các quy tắc bên dưới để đảm bảo quyền lợi và sự an toàn của bạn khi tham gia kiếm tiền tại MMOChill.
        </motion.p>
      </div>

      {/* Main Rules Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <RuleCard 
          icon={Link2}
          title="Vượt Link Trung Thực"
          color="blue"
          content={
            `• Chỉ vượt link bằng trình duyệt thực (Chrome, Safari, Edge).
             • Không sử dụng VPN, Proxies hoặc các phần mềm che giấu IP.
             • Không sử dụng Tool, Scripts hoặc các biện pháp giả lập tự động.
             • Mỗi địa chỉ IP chỉ được phép làm một số lượng lượt quy định mỗi ngày.`
          }
        />
        <RuleCard 
          icon={AlertTriangle}
          title="Cảnh Báo Lừa Đảo (Scam)"
          color="yellow"
          content={
            `• CHỈ thực hiện giao dịch và hỗ trợ trực tiếp từ Admin qua hệ thống chính quy.
             • Không cung cấp mật khẩu hoặc mã OTP cho bất kỳ ai.
             • Cẩn trọng với kẻ xấu giả danh Admin trên Telegram/Facebook để lừa đảo.
             • MMOChill không bao giờ yêu cầu bạn nạp tiền để được "ưu đãi" hay rút thưởng.`
          }
        />
        <RuleCard 
          icon={XOctagon}
          title="Hình Phạt Vi Phạm"
          color="red"
          content={
            <div className="space-y-3">
              <p>Mọi hành vi gian lận sẽ bị xử lý nghiêm khắc:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-rose-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  Mức 1: Cảnh cáo & khấu trừ 50% số dư nếu vi phạm nhẹ.
                </li>
                <li className="flex items-start gap-2 text-rose-600 font-black uppercase italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 flex-shrink-0" />
                  Mức 2: Khóa tài khoản vĩnh viễn không hoàn lại số dư nếu tái phạm hoặc dùng tool/cheat nghiêm trọng.
                </li>
              </ul>
            </div>
          }
        />
        <RuleCard 
          icon={MessageSquare}
          title="Hỗ Trợ Thành Viên"
          color="green"
          content={
            `• Nếu gặp khó khăn khi làm nhiệm vụ, hãy gửi yêu cầu hỗ trợ qua mục [Support].
             • Chúng tôi luôn lắng nghe và phản hồi sớm nhất các vấn đề về lỗi link hoặc thanh toán.
             • Trao đổi trực tiếp, công khai minh bạch.`
          }
        />
      </motion.div>

      {/* Security Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="p-8 rounded-3xl bg-gradient-to-r from-primary/20 via-black/40 to-black/60 border border-primary/30 relative overflow-hidden group shadow-2xl"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-black flex-shrink-0 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Cam Kết Bảo Mật & Minh Bạch</h4>
            <p className="text-gray-400 leading-relaxed max-w-2xl">
              Hệ thống MMOChill cam kết chi trả sòng phẳng mọi khoản thu nhập hợp lệ của người dùng. Để tránh rủi ro mất tiền, tuyệt đối <span className="text-primary font-bold">không giao dịch qua bất kỳ bên thứ ba nào không thuộc quản lý của Admin</span>.
            </p>
          </div>
          <Link 
            href="/support"
            className="px-8 py-3 bg-primary text-black font-black uppercase italic rounded-xl hover:bg-white transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            Liên hệ ngay <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Small Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600 font-medium">
        <Info className="w-4 h-4" />
        Bằng việc tham gia nhiệm vụ, bạn đã mặc định đồng ý với toàn bộ quy định trên của hệ thống.
      </div>
    </div>
  );
}
