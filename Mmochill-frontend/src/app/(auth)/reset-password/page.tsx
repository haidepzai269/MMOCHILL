"use client";

import { resetPassword } from "@/app/actions/auth";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Shield, Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp!");
      return;
    }
    if (!token) {
      setError("Token không hợp lệ!");
      return;
    }
    
    setLoading(true);
    setError("");
    const res = await resetPassword(token, password);
    if (res.success) {
      setCompleted(true);
    } else {
      setError(res.error || "Giao dịch thất bại!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
          {!completed ? (
            <div className="space-y-6">
              <div className="flex justify-center mb-2">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Shield className="w-8 h-8" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Set New Password</h1>
                <p className="text-slate-400 text-sm">Please enter your new password below to secure your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center space-y-8 py-4 animate-in zoom-in-95 duration-500">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
                <CheckCircle className="w-10 h-10 relative z-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white">Password Updated!</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your password has been changed successfully. <br/>You can now login with your new credentials.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full bg-white text-slate-950 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.95]"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
