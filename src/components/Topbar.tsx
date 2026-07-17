import React, { useState, useRef, useEffect } from "react";
import { Menu, ShoppingBag, Search, User as UserIcon, ShieldCheck, MapPin, X } from "lucide-react";
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
  activeTab: "home" | "admin" | "sablon-dtf";
  setActiveTab: (tab: "home" | "admin" | "sablon-dtf") => void;
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const locationSuggestions = [
    { value: "Cafe Paradiso", subtext: "West 65th Street, New York, NY", type: "place" },
    { value: "Cafe Wha?", subtext: "MacDougal Street, New York, NY", type: "place" },
    { value: "Café Maud", subtext: "2nd Avenue, New York, NY", type: "place" },
    { value: "Café China", subtext: "West 37th Street, New York, NY", type: "place" },
    { value: "Cafe Grumpy", subtext: "West 20th Street, New York, NY", type: "place" },
    { value: "Cafe Lalo", subtext: "West 83rd Street, New York, NY", type: "place" }
  ];

  const filteredSuggestions = searchQuery.trim() 
    ? locationSuggestions.filter(s => s.value.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  const handleNavClick = (tab: "home" | "admin" | "sablon-dtf", catFilter: string = "all") => {
    setActiveTab(tab);
    setCategory(catFilter);
    // Smooth scroll back to top of main scroll wrapper when changing categories/tabs
    const mainScroll = document.querySelector("main");
    if (mainScroll) {
      mainScroll.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full z-50 sticky top-0 flex flex-col shadow-sm border-b border-[#D46A7A]/20">
      {/* Top Announcement Promo Bar */}
      <div 
        id="top-announcement-bar"
        className="w-full bg-[#2F2022] py-2 px-4 text-center text-[10px] md:text-xs font-semibold tracking-[0.25em] text-[#FCF8F5] uppercase flex items-center justify-center gap-1.5"
      >
        <span>✨ FREE SHIPPING ON ALL ORDERS OVER $50 | 30 DAYS EASY RETURNS ✨</span>
      </div>

      {/* Main Luxury Header - Clean White */}
      <header className="w-full bg-white py-4 md:py-6 px-[4vw] shadow-sm border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          
          {/* Left Block: Brand Logo Mark */}
          <div 
            id="brand-logo-container"
            className="flex items-center cursor-pointer select-none" 
            onClick={() => handleNavClick("home", "all")}
          >
            {logoSettings?.logoUrl ? (
              <img 
                src={logoSettings.logoUrl} 
                alt="Logo" 
                className="h-10 md:h-12 w-auto object-contain brightness-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-start leading-none">
                <span className="font-serif text-2xl md:text-3xl font-extrabold tracking-wide text-slate-900 uppercase">
                  {logoSettings?.text || "A-GIN"}
                </span>
                <span className="text-[8px] font-sans font-black tracking-[0.35em] text-slate-400 uppercase mt-1">
                  {logoSettings?.highlightText || "FASHION"}
                </span>
              </div>
            )}
          </div>

          {/* Center Block: Desktop Elegant Menu Links */}
          <nav className="hidden lg:flex items-center gap-8 font-sans text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
            <button
              onClick={() => handleNavClick("home", "all")}
              className={`hover:text-black transition-colors cursor-pointer ${
                activeTab === "home" && currentCategory === "all" ? "text-black border-b-2 border-black pb-1" : "pb-1"
              }`}
            >
              HOME
            </button>
            <button
              onClick={() => handleNavClick("home", "BAJU WANITA")}
              className={`hover:text-black transition-colors cursor-pointer ${
                activeTab === "home" && currentCategory === "BAJU WANITA" ? "text-black border-b-2 border-black pb-1" : "pb-1"
              }`}
            >
              WOMEN
            </button>
            <button
              onClick={() => handleNavClick("home", "BAJU PRIA")}
              className={`hover:text-black transition-colors cursor-pointer ${
                activeTab === "home" && currentCategory === "BAJU PRIA" ? "text-black border-b-2 border-black pb-1" : "pb-1"
              }`}
            >
              MEN
            </button>
            <button
              onClick={() => handleNavClick("sablon-dtf", "all")}
              className={`hover:text-black transition-colors cursor-pointer ${
                activeTab === "sablon-dtf" ? "text-black border-b-2 border-black pb-1" : "pb-1"
              }`}
            >
              SABLON DTF
            </button>
            {user?.isAdmin && (
              <button
                onClick={() => handleNavClick("admin", "all")}
                className={`hover:bg-red-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-red-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black border border-red-400/20 shadow-sm ${
                  activeTab === "admin" ? "bg-red-700 text-white border-white" : ""
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ADMIN PANEL</span>
              </button>
            )}
          </nav>

          {/* Right Block: Elegant Utility Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search Bar Input */}
            <div ref={searchRef} className="relative hidden sm:flex items-center border-b border-slate-200 pb-0.5 focus-within:border-black transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <input
                type="text"
                placeholder="Cari lokasi atau produk..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="bg-transparent focus:outline-none w-24 md:w-48 text-xs text-slate-800 placeholder-slate-400 tracking-wider font-medium"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-[#D46A7A]/10 overflow-hidden z-[60] min-w-[240px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-[#D46A7A] uppercase tracking-widest pl-2">Saran Lokasi</span>
                    <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <div className="py-1.5 max-h-64 overflow-y-auto">
                    {filteredSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item.value);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-rose-50 transition-colors flex items-start gap-3 group"
                      >
                        <div className="p-1.5 bg-rose-50 group-hover:bg-rose-100 rounded-lg transition-colors">
                          <MapPin className="w-3 h-3 text-[#D46A7A]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-800">{item.value}</span>
                          {item.subtext && (
                            <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">{item.subtext}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-2.5 bg-[#FAF1EE] text-center border-t border-[#D46A7A]/5">
                    <p className="text-[9px] text-[#5C4649]/60 font-bold uppercase tracking-tight">Cari lebih lengkap di Peta Checkout</p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar/Login Trigger */}
            <button
              onClick={user ? onOpenProfile : onOpenAuth}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-all cursor-pointer flex items-center justify-center"
              title={user ? "Profil Saya" : "Masuk"}
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="User" 
                  className="w-6 h-6 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </button>

            {/* Cart Icon with count badge */}
            <button 
              onClick={onOpenCart}
              className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors relative flex items-center justify-center cursor-pointer text-slate-900 border border-slate-100"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Mobile Navigation Drawer Trigger */}
            <button 
              onClick={onOpenNav}
              className="lg:hidden p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-all cursor-pointer flex items-center justify-center"
              title="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* Responsive Horizontal Categories List Subheader for Home view - REMOVED AS PER USER REQUEST */}
    </div>
  );
}
