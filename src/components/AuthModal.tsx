import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";
import { User } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  if (!isOpen) return null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const endpoint = "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Autentikasi gagal.");
      }

      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Autentikasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      // In this app, we use googleSignIn from workspace lib
      const { googleSignIn } = await import("../lib/workspace");
      const result = await googleSignIn();
      if (result) {
        onLoginSuccess({
          id: result.user.uid,
          name: result.user.displayName || "User",
          email: result.user.email || "",
          isAdmin: result.user.email === 'aprhyzsilla1@gmail.com',
          avatarUrl: result.user.photoURL || ""
        });
        onClose();
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Login dibatalkan atau jendela ditutup. Silakan coba lagi.");
      } else if (err.code === "auth/popup-blocked") {
        setErrorMsg("Popup diblokir browser. Izinkan popup untuk melanjutkan.");
      } else {
        setErrorMsg("Gagal login dengan Google. Silakan coba lagi atau gunakan email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      id="auth-modal-overlay" 
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        id="auth-modal-card" 
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        <div className="bg-gradient-to-r from-red-600 to-emerald-950 px-6 py-8 text-white relative">
          <button
            id="close-auth-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup login"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h3 className="font-extrabold text-xl tracking-tight">
            Masuk / Daftar Akun
          </h3>
          <p className="text-xs text-red-100 mt-1 font-semibold">
            Akun baru akan otomatis terdaftar saat Anda pertama kali masuk.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md shadow-red-100 transition-all cursor-pointer text-center"
            >
              {loading ? "Memproses..." : "Masuk / Daftar Sekarang"}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">
              Atau masuk dengan akun media sosial
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Google
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            A-GIN Fashion Security Handshake
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
