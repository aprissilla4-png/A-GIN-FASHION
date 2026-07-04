import React from "react";
import { motion } from "motion/react";
import { X, LogOut, User as UserIcon, Shield, Palette } from "lucide-react";
import { User } from "../types";

interface NavigationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onGoogleLogin: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenWorkspace: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const THEMES = [
  { id: "default", name: "Default (Cream)", color: "bg-[#F5F2EB]" },
  { id: "dark", name: "Modern Dark", color: "bg-slate-900" },
  { id: "pastel", name: "Soft Pastel", color: "bg-rose-50" },
  { id: "vibrant", name: "Vibrant Blue", color: "bg-blue-600" }
];

export default function NavigationPopup({
  isOpen,
  onClose,
  user,
  onGoogleLogin,
  onLogout,
  onOpenAdmin,
  onOpenProfile,
  onOpenWorkspace,
  currentTheme,
  onThemeChange
}: NavigationPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-[#1B1B1B]">Navigation</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* User Section */}
          <div className="space-y-4">
            <p className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-400 font-bold">Account</p>
            {user ? (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img 
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1B1B1B] truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onGoogleLogin}
                className="w-full flex items-center justify-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group cursor-pointer"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span className="font-bold text-[#1B1B1B]">Login with Google</span>
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <p className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-400 font-bold">Menu</p>
            <div className="grid grid-cols-2 gap-3">
              {user && (
                <>
                  <button 
                    onClick={() => { onOpenProfile(); onClose(); }}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group cursor-pointer"
                  >
                    <UserIcon className="w-6 h-6 text-slate-400 group-hover:text-[#1B1B1B] transition-colors" />
                    <span className="text-xs font-bold text-slate-600">Profile</span>
                  </button>

                  <button 
                    onClick={() => { onOpenWorkspace(); onClose(); }}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors group cursor-pointer"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Workspace" className="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs font-bold text-blue-600">Workspace</span>
                  </button>
                </>
              )}
              
              {user?.isAdmin && (
                <button 
                  onClick={() => { onOpenAdmin(); onClose(); }}
                  className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors group cursor-pointer col-span-2"
                >
                  <Shield className="w-6 h-6 text-red-400 group-hover:text-red-600 transition-colors" />
                  <span className="text-xs font-bold text-red-600">Admin Panel</span>
                </button>
              )}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-400" />
              <p className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-400 font-bold">Theme Settings</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left cursor-pointer ${
                    currentTheme === t.id 
                      ? "border-[#1B1B1B] bg-slate-50 ring-2 ring-[#1B1B1B]/5" 
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border border-black/10 ${t.color}`} />
                  <span className="text-[10px] font-bold text-slate-700">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 text-center">
          <p className="text-[10px] text-slate-400 font-mono">A-GIN FASHION VERSION 2.1.0</p>
        </div>
      </motion.div>
    </div>
  );
}
