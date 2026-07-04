import React from "react";
import { User, CartItem, LogoSettings } from "../types";

interface TopbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cart: CartItem[];
  onOpenCart: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenNav: () => void;
  activeTab: "home" | "admin";
  setActiveTab: (tab: "home" | "admin") => void;
  currentCategory: string;
  setCategory: (category: string) => void;
  logoSettings?: LogoSettings;
}

export default function Topbar({
  searchQuery,
  setSearchQuery,
  cart,
  onOpenCart,
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenNav,
  activeTab,
  setActiveTab,
  currentCategory,
  setCategory,
  logoSettings
}: TopbarProps) {
  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-[#F5F2EB]/90 backdrop-blur-md border-b border-[#1B1B1B]/10">
      <div className="max-w-[1400px] mx-auto px-[4vw] py-8 grid grid-cols-2 md:grid-cols-3 items-center">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#A68966] hidden md:block">
          JAKARTA / 2026
        </div>
        
        <div 
          className="flex justify-start md:justify-center cursor-pointer" 
          onClick={() => { setActiveTab("home"); setCategory("all"); }}
        >
          {logoSettings?.logoUrl ? (
            <div 
              className="h-12 w-auto flex items-center justify-center relative" 
              style={{ mixBlendMode: 'multiply', filter: 'invert(1) contrast(1.2)' }}
            >
              <img 
                src={logoSettings.logoUrl} 
                alt="A-GIN" 
                className={logoSettings.logoUrl.includes('a_gin_logo') ? "h-12 w-auto object-contain" : "h-20 w-auto object-cover object-top -mt-2"}
                referrerPolicy="no-referrer"
                style={logoSettings.logoUrl.includes('a_gin_logo') ? {} : { clipPath: 'inset(10% 0 35% 0)' }}
              />
            </div>
          ) : (
            <div className="font-serif text-[2.5rem] font-semibold tracking-[-0.02em] md:text-center text-[#1B1B1B]">
              {logoSettings?.text || "A-GIN"}
            </div>
          )}
        </div>

        <ul className="flex items-center justify-end gap-3 sm:gap-6 font-mono text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[#A68966] list-none m-0 p-0">
          <li className="block">
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-b border-[#1B1B1B]/20 pb-0.5 focus:outline-none focus:border-[#1B1B1B] w-20 sm:w-32 text-[#A68966] placeholder:text-[#A68966]/40 text-[0.55rem] sm:text-[0.65rem]"
            />
          </li>
          {user?.isAdmin && (
            <li className="block">
              <button onClick={() => setActiveTab("admin")} className="hover:text-[#1B1B1B] transition-colors uppercase font-semibold cursor-pointer">
                Admin
              </button>
            </li>
          )}
          <li className="block">
            <button onClick={onOpenNav} className="hover:text-[#1B1B1B] transition-colors uppercase font-semibold cursor-pointer">
              Navigation
            </button>
          </li>
          <li>
            <button onClick={onOpenCart} className="hover:text-[#1B1B1B] transition-colors uppercase font-bold cursor-pointer bg-black/5 px-2.5 py-1 rounded-full text-[#111111]">
              Bag [{totalCartItems}]
            </button>
          </li>
        </ul>
      </div>
      
      {/* Category Nav - optional subheader */}
      {activeTab === "home" && (
        <div className="max-w-[1400px] mx-auto px-[4vw] pb-4 flex gap-6 overflow-x-auto no-scrollbar font-mono text-[0.6rem] uppercase tracking-[0.15em] text-[#1B1B1B]/60">
            {["all", "Promo", "Batik", "Streetwear", "Outerwear", "Bottoms", "Women", "Sablon DTF"].map(cat => (
                <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`whitespace-nowrap hover:text-[#1B1B1B] transition-colors ${currentCategory === cat ? 'text-[#1B1B1B] font-bold border-b border-[#1B1B1B]' : ''}`}
                >
                    {cat === 'all' ? 'Archive' : cat}
                </button>
            ))}
        </div>
      )}
    </header>
  );
}
