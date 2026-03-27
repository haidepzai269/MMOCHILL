"use client";

import { forgotPassword } from "@/app/actions/auth";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const res = await forgotPassword(email);
    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || "Có lỗi xảy ra, vui lòng thử lại.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />

      <div className="w-full max-w-md relative">
        <div className="rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
          <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>

          {!submitted ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center space-y-6 py-8 animate-in zoom-in-95 duration-500">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Check your email</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We've sent a password reset link to <br/><span className="text-white font-medium">{email}</span>
                </p>
              </div>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-primary font-bold text-sm hover:underline"
              >
                Didn't receive the email? Try again
              </button>
            </div>
          )}
        </div>
        
        <p className="text-center mt-8 text-slate-600 text-xs uppercase tracking-[0.2em] font-bold">
          MMOCHILL SECURITY SYSTEM
        </p>
      </div>
    </div>
  );
}
