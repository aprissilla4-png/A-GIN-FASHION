import React from "react";
import { User, LogoSettings, Tab } from "../types";

interface SidebarProps {
  currentCategory: string;
  setCategory: (category: string) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  logoSettings?: LogoSettings;
}

export default function Sidebar({
  currentCategory,
  setCategory,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenAuth,
  onOpenProfile,
  logoSettings
}: SidebarProps) {
  const categories = [
    { name: "Promo Spesial", value: "Promo" },
    { name: "Batik Modern", value: "Batik" },
    { name: "Streetwear", value: "Streetwear" },
    { name: "Outerwear", value: "Outerwear" },
    { name: "Celana & Bottoms", value: "Bottoms" },
    { name: "Gaun Wanita", value: "Women" },
    { name: "Sablon DTF", value: "Sablon DTF" },
  ];

  return (
    <aside className="h-full border-r border-black/10 py-12 px-8 flex flex-col gap-12 font-sans bg-[#F8F7F4] w-full">
      <div>
        {logoSettings?.logoUrl ? (
          <div 
            className="h-16 w-auto flex items-center justify-start relative animate-none" 
            style={{ mixBlendMode: 'multiply', filter: 'invert(1) contrast(1.2)' }}
          >
            <img 
              src={logoSettings.logoUrl} 
              alt="A-GIN" 
              className={logoSettings.logoUrl.includes('a_gin_logo') ? "h-16 w-auto object-contain" : "h-28 w-auto object-cover object-top -mt-3"}
              referrerPolicy="no-referrer"
              style={logoSettings.logoUrl.includes('a_gin_logo') ? {} : { clipPath: 'inset(10% 0 35% 0)' }}
            />
          </div>
        ) : (
          <h1 className="font-serif text-[2.5rem] leading-[0.9] text-[#1B1B1B] m-0 tracking-tight">
            {logoSettings?.text || "A-GIN"}<br />{logoSettings?.highlightText || "FASHION"}
          </h1>
        )}
      </div>
      
      <nav className="flex flex-col gap-4">
        <span className="text-[0.65rem] uppercase tracking-[0.15em] text-[#1B1B1B]/60 mb-2 block">
          Menu Utama
        </span>
        
        <button
          onClick={() => { setActiveTab("home"); setCategory("all"); }}
          className={`text-[0.65rem] uppercase tracking-[0.15em] text-left transition-opacity ${
            activeTab === "home" && currentCategory === "all" ? "opacity-100 text-[#1B1B1B] font-bold" : "opacity-60 text-[#1B1B1B] hover:opacity-100"
          }`}
        >
          Beranda
        </button>

        <button
          onClick={() => setActiveTab("workspace")}
          className={`text-[0.65rem] uppercase tracking-[0.15em] text-left transition-opacity ${
            activeTab === "workspace" ? "opacity-100 text-[#1B1B1B] font-bold" : "opacity-60 text-[#1B1B1B] hover:opacity-100"
          }`}
        >
          Google Workspace
        </button>

        <div className="flex flex-col gap-4 pl-3 border-l border-black/10 mt-2 mb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setActiveTab("home"); setCategory(cat.value); }}
              className={`text-[0.65rem] uppercase tracking-[0.15em] text-left transition-opacity ${
                activeTab === "home" && currentCategory === cat.value ? "opacity-100 text-[#1B1B1B] font-bold" : "opacity-60 text-[#1B1B1B] hover:opacity-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {user?.isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`text-[0.65rem] uppercase tracking-[0.15em] text-left transition-opacity mt-4 ${
              activeTab === "admin" ? "opacity-100 text-[#1B1B1B] font-bold" : "opacity-60 text-[#1B1B1B] hover:opacity-100"
            }`}
          >
            Panel Admin
          </button>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {user ? (
          <div className="flex flex-col gap-3">
            <button 
              onClick={onOpenProfile}
              className="text-[0.65rem] uppercase tracking-[0.15em] text-left opacity-60 text-[#1B1B1B] hover:opacity-100"
            >
              Profil ({user.name})
            </button>
            <button 
              onClick={onLogout}
              className="text-[0.65rem] uppercase tracking-[0.15em] text-left opacity-60 text-[#1B1B1B] hover:opacity-100"
            >
              Keluar
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="text-[0.65rem] uppercase tracking-[0.15em] text-left opacity-60 text-[#1B1B1B] hover:opacity-100"
          >
            Masuk / Daftar
          </button>
        )}
        
        <p className="text-[0.55rem] uppercase tracking-[0.15em] text-[#1B1B1B]/60 mt-4">
          © 2026 A-GIN STUDIO
        </p>
      </div>
    </aside>
  );
}
