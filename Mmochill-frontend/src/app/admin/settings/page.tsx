"use client";

import { useState } from "react";
import { Settings as SettingsIcon, Save, Bell, Shield, Database, Globe, Fingerprint, Loader2, CheckCircle2, AlertCircle, Palette } from "lucide-react";
import { adminBeginPasskeyRegistration, adminFinishPasskeyRegistration } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

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

export default function AdminSettingsPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    try {
      const beginRes = await adminBeginPasskeyRegistration();
      if (!beginRes.success) throw new Error(beginRes.error || "Failed to start registration");

      const options = beginRes.options;

      // Prepare options for navigator.credentials.create
      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: base64urlToUint8Array(options.publicKey.challenge),
          rp: options.publicKey.rp,
          user: {
            id: base64urlToUint8Array(options.publicKey.user.id),
            name: options.publicKey.user.name,
            displayName: options.publicKey.user.displayName,
          },
          pubKeyCredParams: options.publicKey.pubKeyCredParams,
          timeout: 60000,
          attestation: options.publicKey.attestation,
          authenticatorSelection: options.publicKey.authenticatorSelection,
        },
      };

      const credential = (await navigator.credentials.create(creationOptions)) as any;
      if (!credential) throw new Error("Registration cancelled");

      // Format for backend
      const attestationResponse = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: bufferToBase64url(credential.response.attestationObject),
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          transports: credential.response.getTransports ? credential.response.getTransports() : [],
        },
      };

      const finishRes = await adminFinishPasskeyRegistration(attestationResponse);
      if (finishRes.success) {
        toast.success("Đăng ký vân tay thành công!");
      } else {
        throw new Error(finishRes.error || "Failed to finish registration");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi đăng ký vân tay");
    } finally {
      setIsRegistering(false);
    }
  };

  const sections = [
    { id: "general", title: "General Settings", desc: "Basic platform configuration", icon: Globe, href: "/admin/settings" },
    { id: "notifications", title: "Notification Settings", desc: "Manage system-wide alerts", icon: Bell, href: "/admin/notifications" },
    { id: "appearance", title: "Giao diện & Âm thanh", desc: "Màu sắc, sự kiện và SFX", icon: Palette, href: "/admin/appearance" },
    { id: "database", title: "Database & Backups", desc: "Infrastructure management", icon: Database, href: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Cấu hình hệ thống
          </h1>
          <p className="text-slate-400 text-sm">
            Quản lý thiết lập toàn cục và quyền quản trị.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Passkey / Biometrics Section - Featured */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Fingerprint className="w-32 h-32 text-primary" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Xác thực sinh trắc học</h3>
                <p className="text-sm text-slate-400">Thiết lập Passkey để đăng nhập nhanh bằng Vân tay hoặc FaceID.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-slate-950/50 rounded-2xl p-6 border border-white/5">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Khuyên dùng</span>
                </div>
                <p className="text-sm text-slate-300">
                  Passkey an toàn hơn mật khẩu truyền thống và giúp bạn truy cập Dashboard chỉ trong vài giây.
                </p>
              </div>
              <button 
                onClick={handleRegisterPasskey}
                disabled={isRegistering}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-xl text-sm font-bold border border-white/10 transition-all group/p"
              >
                {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-5 h-5 text-primary group-hover/p:scale-110 transition-transform" />}
                Thiết lập Vân tay
              </button>
            </div>
          </div>
        </motion.div>

        {/* Other Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.filter(s => s.id !== 'security').map((section) => (
            <Link 
              key={section.id} 
              href={section.href}
              className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 hover:border-primary/20 hover:bg-primary/[0.02] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <section.icon className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">{section.title}</h3>
                  <p className="text-xs text-slate-500">{section.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 border-t border-white/5 pt-8">
        <h2 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Vùng nguy hiểm
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Các hành động không thể hoàn tác ảnh hưởng đến toàn bộ hệ thống.
        </p>
        <button className="bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5">
          Chế độ bảo trì hệ thống
        </button>
      </div>
    </div>
  );
}
