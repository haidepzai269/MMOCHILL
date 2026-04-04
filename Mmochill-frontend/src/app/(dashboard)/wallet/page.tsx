"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowLeft,
  Landmark,
  CreditCard,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { getUserProfile } from "@/app/actions/auth";
import { requestWithdrawal } from "@/app/actions/wallet";
import { toast } from "sonner";
import RankBadge, { getRankInfo } from "@/components/rank-badge";
import Loading from "@/components/loading";

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState("bank");
  const [amount, setAmount] = useState<number>(0);
  const [bankOpen, setBankOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);

  const banks = [
    {
      id: "vcb",
      name: "Vietcombank",
      code: "VCB",
      logo: "https://cdn.vietqr.io/img/VCB.png",
    },
    {
      id: "tcb",
      name: "Techcombank",
      code: "TCB",
      logo: "https://cdn.vietqr.io/img/TCB.png",
    },
    {
      id: "mbb",
      name: "MB Bank",
      code: "MB",
      logo: "https://cdn.vietqr.io/img/MB.png",
    },
    {
      id: "tpb",
      name: "TP Bank",
      code: "TPB",
      logo: "https://cdn.vietqr.io/img/TPB.png",
    },
    {
      id: "acb",
      name: "ACB",
      code: "ACB",
      logo: "https://cdn.vietqr.io/img/ACB.png",
    },
    {
      id: "vpb",
      name: "VPBank",
      code: "VPB",
      logo: "https://cdn.vietqr.io/img/VPB.png",
    },
    {
      id: "vbi",
      name: "VietinBank",
      code: "ICB",
      logo: "https://cdn.vietqr.io/img/ICB.png",
    },
    {
      id: "bidv",
      name: "BIDV",
      code: "BIDV",
      logo: "https://cdn.vietqr.io/img/BIDV.png",
    },
    {
      id: "hdb",
      name: "HDBank",
      code: "HDB",
      logo: "https://cdn.vietqr.io/img/HDB.png",
    },
    {
      id: "shb",
      name: "SHB",
      code: "SHB",
      logo: "https://cdn.vietqr.io/img/SHB.png",
    },
  ];

  const momoLogo = "https://cdn.vietqr.io/img/momo.png";

  useEffect(() => {
    getUserProfile().then((profile) => {
      setUser(profile);
      setLoading(false);
    });
  }, []);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await requestWithdrawal(formData);
      if (result.success) {
        toast.success("Withdrawal request submitted successfully!");
        // Refresh profile to see balance change
        const profile = await getUserProfile();
        setUser(profile);
      } else {
        toast.error(result.error || "Failed to submit request");
      }
    });
  };

  if (loading) return <Loading isLoading={loading} />;

  return (
    <div className="max-w-2xl mx-auto py-6 flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Your Wallet</h1>
      </div>

      {/* Balance Card - Glassmorphism Redesign */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-[#0a0a0b]/80 backdrop-blur-3xl border border-white/10 rounded-[30px] p-8 shadow-2xl overflow-hidden">
          {/* Decorative mesh gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mt-20 -mr-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] -mb-10 -ml-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
                  Available Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-white">
                    {user?.balance?.toLocaleString() || "0"}
                  </span>
                  <span className="text-xl font-bold text-primary">VND</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <RankBadge
                  peakBalance={user?.peak_balance || 0}
                  role={user?.role}
                  className="scale-110"
                />
              </div>
            </div>

            {/* Rank Progress Bar */}
            {getRankInfo(user?.peak_balance || 0, user?.role).next && (
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white/40">
                    Tiến trình lên{" "}
                    {
                      getRankInfo(getRankInfo(user?.peak_balance || 0, user?.role).next!)
                        .name
                    }
                  </span>
                  <span className="text-primary">
                    {Math.min(
                      100,
                      Math.floor(
                        (((user?.peak_balance || 0) -
                          getRankInfo(user?.peak_balance || 0, user?.role).min) /
                          (getRankInfo(user?.peak_balance || 0, user?.role).next! -
                            getRankInfo(user?.peak_balance || 0, user?.role).min)) *
                          100,
                      ),
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, Math.floor((((user?.peak_balance || 0) - getRankInfo(user?.peak_balance || 0, user?.role).min) / (getRankInfo(user?.peak_balance || 0, user?.role).next! - getRankInfo(user?.peak_balance || 0, user?.role).min)) * 100))}%`,
                    }}
                    className={`h-full bg-gradient-to-r ${getRankInfo(getRankInfo(user?.peak_balance || 0, user?.role).next!).color}`}
                  />
                </div>
                <p className="text-[9px] text-white/30 italic text-center">
                  Cần thêm{" "}
                  {(
                    getRankInfo(user?.peak_balance || 0, user?.role).next! -
                    (user?.peak_balance || 0)
                  ).toLocaleString()}
                  đ số dư cao nhất để thăng hạng
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm group/item hover:bg-white/10 transition-colors">
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">
                  Locked Amount
                </p>
                <p className="text-lg font-bold text-orange-400">
                  {user?.locked_amount?.toLocaleString() || "0"} đ
                </p>
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm group/item hover:bg-white/10 transition-colors">
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">
                  Total Earned
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  {user?.total_earned?.toLocaleString() || "0"} đ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" /> Request Withdrawal
        </h3>

        <form action={handleSubmit} className="space-y-6">
          <div className="bg-muted/50 p-1.5 rounded-[20px] grid grid-cols-2 gap-2 border border-border">
            <button
              type="button"
              onClick={() => setMethod("bank")}
              className={`py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${method === "bank" ? "bg-background text-primary shadow-sm border border-border scale-[1.02]" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Landmark className="w-4 h-4" />
              Chuyển khoản
            </button>
            <button
              type="button"
              onClick={() => setMethod("momo")}
              className={`py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${method === "momo" ? "bg-background text-pink-500 shadow-sm border border-border scale-[1.02]" : "text-muted-foreground hover:text-foreground"}`}
            >
              <img
                src={momoLogo}
                alt="MoMo"
                className="w-5 h-5 rounded-md object-contain"
              />
              Ví MoMo
            </button>
          </div>
          <input type="hidden" name="method" value={method} />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">
                Số tiền muốn rút (Min: 10,000đ)
              </label>
              <input
                name="amount"
                type="number"
                min="10000"
                required
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                placeholder="Nhập số tiền (VD: 10000)"
              />
            </div>

            {method === "bank" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold ml-1 text-muted-foreground">
                    Tên ngân hàng
                  </label>
                  <div
                    onClick={() => setBankOpen(!bankOpen)}
                    className="w-full bg-muted/50 border border-border rounded-xl py-4 px-4 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {selectedBank ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 border border-border overflow-hidden">
                          <img
                            src={selectedBank.logo}
                            alt={selectedBank.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="font-bold">{selectedBank.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Chọn ngân hàng của bạn
                      </span>
                    )}
                    <Landmark
                      className={`w-5 h-5 transition-transform ${bankOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <input
                    type="hidden"
                    name="bank_name"
                    value={selectedBank?.name || ""}
                    required
                  />

                  <AnimatePresence>
                    {bankOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute z-50 left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto p-2"
                      >
                        <div className="grid grid-cols-1 gap-1">
                          {banks.map((bank) => (
                            <div
                              key={bank.id}
                              onClick={() => {
                                setSelectedBank(bank);
                                setBankOpen(false);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedBank?.id === bank.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"}`}
                            >
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 border border-border shadow-sm overflow-hidden">
                                <img
                                  src={bank.logo}
                                  alt={bank.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{bank.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">
                                  {bank.code}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">
                    Số tài khoản
                  </label>
                  <input
                    name="account_number"
                    type="text"
                    required
                    placeholder="Nhập số tài khoản"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">
                    Tên chủ tài khoản
                  </label>
                  <input
                    name="account_name"
                    type="text"
                    required
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                  />
                </div>
              </motion.div>
            )}

            {method === "momo" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={momoLogo}
                      alt="MoMo"
                      className="w-6 h-6 object-contain"
                    />
                    <label className="text-sm font-bold text-muted-foreground">
                      Số điện thoại MoMo
                    </label>
                  </div>
                  <input
                    name="account_number"
                    type="text"
                    required
                    placeholder="Nhập số điện thoại đăng ký MoMo"
                    className="w-full bg-muted/50 border border-border rounded-xl py-4 px-4 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 text-muted-foreground">
                    Tên chủ tài khoản MoMo
                  </label>
                  <input
                    name="account_name"
                    type="text"
                    required
                    placeholder="Nhập tên chính xác trên MoMo"
                    className="w-full bg-muted/50 border border-border rounded-xl py-4 px-4 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all uppercase font-bold"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Phí rút tiền (Ưu đãi 0%)
              </span>
              <span className="font-medium text-emerald-500">0 VND</span>
            </div>
            <div className="flex justify-between font-bold border-t border-border pt-3">
              <span>Số tiền thực nhận</span>
              <span className="text-primary text-lg">
                {amount > 0 ? amount.toLocaleString() : "---"} VND
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="group/btn w-full bg-primary text-primary-foreground py-5 rounded-[22px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                <span>Xác nhận rút tiền</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
