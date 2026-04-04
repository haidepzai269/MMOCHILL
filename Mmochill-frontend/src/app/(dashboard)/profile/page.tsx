"use client";

import { useEffect, useState, useRef } from "react";
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  changeEmail,
} from "@/app/actions/auth";
import RankBadge from "@/components/rank-badge";
import {
  User,
  Mail,
  Shield,
  Wallet,
  CheckCircle,
  Copy,
  Share2,
  Calendar,
  Settings,
  ArrowRight,
  X,
  Loader2,
  Lock,
  LogOut,
  History,
  Check,
  Camera,
  Key,
  Eye,
  EyeOff,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/lib/contexts/loading-context";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"main" | "security">(
    "main",
  );

  // States for Edit Profile
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    avatar_url: "",
  });

  // Avatar Upload States
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Security Form States (Password Change)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Email Change State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailConfirmPassword, setEmailConfirmPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const loadProfile = async () => {
    showLoading();
    const data = await getUserProfile();
    if (data) {
      setUser(data);
      setEditForm({
        full_name: data.full_name || "",
        avatar_url: data.avatar_url || "",
      });
    }
    hideLoading();
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    let finalAvatarURL = editForm.avatar_url;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      const uploadRes = await uploadAvatar(formData);
      if (uploadRes.success) {
        finalAvatarURL = uploadRes.url;
      } else {
        toast.error("Lỗi upload ảnh: " + uploadRes.error);
        setUpdating(false);
        return;
      }
    }

    const res = await updateProfile(editForm.full_name, finalAvatarURL);
    if (res.success) {
      await loadProfile();
      window.dispatchEvent(new Event("profileUpdated")); // Notify other components (Header)
      setIsEditModalOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);
      toast.success("Cập nhật hồ sơ thành công!");
    } else {
      toast.error("Lỗi: " + res.error);
    }
    setUpdating(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    setIsUpdatingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      toast.success("Cập nhật mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
    setIsUpdatingPassword(false);
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailConfirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setIsUpdatingEmail(true);
    const res = await changeEmail(newEmail, emailConfirmPassword);
    if (res.success) {
      toast.success("Thay đổi Email thành công!");
      setUser({ ...user!, email: newEmail });
      setShowEmailModal(false);
      setNewEmail("");
      setEmailConfirmPassword("");
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
    setIsUpdatingEmail(false);
  };

  const handleBackToMain = () => {
    setActiveSection("main");
  };

  const copyRefLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.referral_code || "31121"}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Đã sao chép link giới thiệu!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !user) {
    return null; // Loading component is already handled by LoadingProvider
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-white">
        <h2 className="text-2xl font-bold">Please login to view profile</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans selection:bg-primary/30">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-primary/50 p-1 bg-slate-800">
                <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-800">
                  <img
                    src={
                      user.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-4 border-slate-950" />
            </div>

            <div className="text-center md:text-left space-y-1">
              <div className="flex justify-center md:justify-start mb-2">
                <RankBadge
                  peakBalance={Math.max(Number(user.balance || 0), Number(user.peak_balance || 0))}
                  role={user.role}
                  className="scale-125 origin-left"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white capitalize">
                {user.full_name || user.username}
              </h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center md:justify-end">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all shadow-lg shadow-white/5 active:scale-95 text-sm"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={() =>
                toast.info("Tính năng đăng xuất đang được phát triển!")
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all shadow-lg shadow-red-500/5 active:scale-95 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {activeSection === "main" ? (
                <motion.div
                  key="main-section"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-8"
                >
                  {/* Account Details */}
                  <div className="rounded-3xl bg-slate-950/20 border border-white/10 backdrop-blur-md p-8 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        Account Information
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
                          Tên tài khoản
                        </h3>
                        <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 font-mono text-sm text-slate-300">
                          {user.username}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
                          Tên đầy đủ
                        </h3>
                        <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 text-sm text-slate-300 text-ellipsis overflow-hidden">
                          {user.full_name || "Chưa cập nhật"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
                          Số dư cao nhất
                        </h3>
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary font-bold">
                          {Math.max(Number(user.balance || 0), Number(user.peak_balance || 0)).toLocaleString()} đ
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
                          Email liên kết
                        </h3>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/5 group/email hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-slate-500 group-hover/email:text-white transition-colors">
                              <Mail className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-slate-300 group-hover/email:text-white transition-colors">
                              {user.email}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowEmailModal(true)}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                          >
                            Thay đổi
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveSection("security")}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Shield className="w-4 h-4" />
                          </div>
                          <span className="text-white font-semibold">
                            Security Settings
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="security-section"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="rounded-3xl bg-slate-950/20 border border-white/10 backdrop-blur-md p-8 space-y-8"
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={handleBackToMain}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      Quay lại
                    </button>
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Security Settings
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Quản lý mật khẩu và các thiết lập bảo mật cho tài khoản
                      của bạn.
                    </p>
                  </div>

                  <div className="space-y-6 pt-4">
                    {/* Password Change Fields */}
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Mật khẩu hiện tại
                        </label>
                        <div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-primary transition-colors" />
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu cũ"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm font-sans"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Mật khẩu mới
                          </label>
                          <div className="relative group/input">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-primary transition-colors" />
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Mật khẩu mới"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm font-sans"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Xác nhận mật khẩu
                          </label>
                          <div className="relative group/input">
                            <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-primary transition-colors" />
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder="Lặp lại mật khẩu mới"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={isUpdatingPassword}
                      className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isUpdatingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Cập nhật mật khẩu"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Stats & Summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Wallet Status */}
            <div className="rounded-3xl bg-slate-950/20 border border-white/10 backdrop-blur-md p-8 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />

              <div className="flex items-center justify-between relative z-10">
                <div className="p-3 rounded-2xl bg-white/5 text-slate-400 group-hover:text-primary transition-colors">
                  <Wallet className="w-6 h-6" />
                </div>
                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 relative z-10">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  ${user.balance?.toFixed(2) || "0.00"}
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-1">
                  Available Balance
                </p>
              </div>

              <div className="pt-2 relative z-10">
                <button className="w-full py-3.5 rounded-xl bg-white text-slate-950 font-bold text-sm transition-all hover:bg-slate-200 active:scale-[0.98] flex items-center justify-center gap-2">
                  Nạp thêm tiền
                </button>
              </div>
            </div>

            {/* Referral Section */}
            <div className="rounded-3xl bg-slate-950/20 border border-white/10 backdrop-blur-md p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Invite Your Friends
                </h2>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed">
                Earn 10% lifetime commission from their rewards. Share your
                invitation link and start earning together!
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-2 p-1 pl-4 rounded-xl bg-slate-950/50 border border-white/5">
                  <span className="text-sm font-mono text-slate-400 truncate flex-1">
                    {user.referral_code}
                  </span>
                  <button
                    onClick={copyRefLink}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold text-center">
                  Your unique referral code
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl bg-slate-950/20 border border-white/10 backdrop-blur-md p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
                  <History className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Recent Activity
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Task completed: "Daily Survey"</span>
                  <span className="text-white font-medium">+500 VND</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Referral bonus: John Doe</span>
                  <span className="text-white font-medium">+1000 VND</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Withdrawal request</span>
                  <span className="text-white font-medium">-20000 VND</span>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all shadow-lg shadow-white/5 active:scale-[0.95] text-sm">
                View All Activity <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 text-white">
                <h3 className="text-xl font-bold">Chỉnh sửa hồ sơ</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                <div className="space-y-4 text-white">
                  {/* Avatar Selection */}
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div
                      className="relative group/avatar cursor-pointer"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-slate-950 group-hover/avatar:border-primary transition-all shadow-inner">
                        {previewUrl || editForm.avatar_url ? (
                          <img
                            src={previewUrl || editForm.avatar_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-500 group-hover/avatar:text-primary transition-all" />
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                      Tải lên ảnh mới
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, full_name: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all shadow-lg shadow-primary/20"
                  >
                    {updating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Change Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl relative"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    Thay đổi Email
                  </h3>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-400">
                  Vui lòng nhập Email mới và mật khẩu của bạn để xác nhận thay
                  đổi.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Email mới
                  </label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nhap-email-moi@gmail.com"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="password"
                      value={emailConfirmPassword}
                      onChange={(e) => setEmailConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm font-sans"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleChangeEmail}
                disabled={isUpdatingEmail}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isUpdatingEmail ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Xác nhận đổi Email"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
