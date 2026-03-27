"use client";

import { useState, useEffect } from "react";
import { adminLogin, adminBeginPasskeyLogin, adminFinishPasskeyLogin } from "@/app/actions/auth";
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Fingerprint, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Helper to convert base64url to Uint8Array
function base64urlToUint8Array(base64url: string) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const str = window.atob(base64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert ArrayBuffer to base64url
function bufferToBase64url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  return window.btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyAuth, setIsPasskeyAuth] = useState(false);
  const router = useRouter();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await adminLogin(formData);

    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error || "Đăng nhập thất bại");
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email) {
      setError("Vui lòng nhập Email để đăng nhập bằng vân tay");
      return;
    }

    setIsLoading(true);
    setIsPasskeyAuth(true);
    setError("");

    try {
      const beginRes = await adminBeginPasskeyLogin(email);
      if (!beginRes.success) {
        throw new Error(beginRes.error || "Không thể khởi tạo đăng nhập vân tay");
      }

      const options = beginRes.options;
      
      // Prepare options for navigator.credentials.get
      const assertionOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: base64urlToUint8Array(options.publicKey.challenge),
          timeout: 60000,
          rpId: window.location.hostname,
          allowCredentials: options.publicKey.allowCredentials.map((c: any) => ({
            type: "public-key",
            id: base64urlToUint8Array(c.id),
          })),
          userVerification: "preferred",
        },
      };

      const assertion = (await navigator.credentials.get(assertionOptions)) as any;
      if (!assertion) throw new Error("Xác thực vân tay bị hủy");

      // Format response for backend
      const credential = {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
          authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
          clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
          signature: bufferToBase64url(assertion.response.signature),
          userHandle: assertion.response.userHandle ? bufferToBase64url(assertion.response.userHandle) : null,
        },
      };

      const finishRes = await adminFinishPasskeyLogin(email, credential);
      if (finishRes.success) {
        router.push("/admin");
      } else {
        throw new Error(finishRes.error || "Xác thực vân tay thất bại");
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      setIsPasskeyAuth(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] relative flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden group">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center text-primary mb-6 border border-primary/20 shadow-lg shadow-primary/10"
            >
              <ShieldCheck className="w-10 h-10" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Portal</h1>
            <p className="text-slate-400 text-sm">
              Hệ thống quản trị MMOChill - Bảo mật đa lớp
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isPasskeyAuth ? (
              <motion.div
                key="password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Email Quản Trị</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-primary transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@mmochill.com"
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Mật Khẩu</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-primary transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl flex items-center gap-3"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handlePasswordLogin}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 group/btn"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Đăng nhập hệ thống
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#0f172a] px-3 text-slate-500">Hoặc sử dụng vân tay</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={isLoading}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-white/5 transition-all group/passkey"
                  >
                    <Fingerprint className="w-5 h-5 text-primary group-hover/passkey:scale-110 transition-transform" />
                    Xác thực bằng Passkey
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="passkey-authenticating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10"
              >
                <div className="relative mb-8">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                  />
                  <div className="relative w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 animate-pulse">
                    <Fingerprint className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Đang xác thực...</h2>
                <p className="text-slate-400 text-sm text-center px-6">
                  Vui lòng sử dụng cảm biến vân tay hoặc FaceID trên thiết bị của bạn
                </p>
                
                <button 
                  onClick={() => setIsPasskeyAuth(false)}
                  className="mt-10 text-xs text-slate-500 hover:text-white transition-colors"
                >
                  Quay lại đăng nhập bằng mật khẩu
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-8 uppercase tracking-[0.3em]">
          Dành riêng cho nhân sự được ủy quyền
        </p>
      </motion.div>
    </div>
  );
}
