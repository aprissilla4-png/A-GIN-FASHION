import React, { useState, useEffect, useRef } from "react";
import { User, Product, CartItem, LogoSettings, HomeMedia, DtfSettings, Banner, SmallBanner, InfoBanner } from "./types";
import { Tab } from "./types";
import Topbar from "./components/Topbar";
import HeroSlider from "./components/HeroSlider";
import SmallBannerSection from "./components/SmallBannerSection";
import InfoBannerSection from "./components/InfoBannerSection";
import FlashSale from "./components/FlashSale";
import ProductGrid from "./components/ProductGrid";
import CartDrawer from "./components/CartDrawer";
import AdminPanel from "./components/AdminPanel";
import AuthModal from "./components/AuthModal";
import MandatoryLogin from "./components/MandatoryLogin";
import ProductDetailModal from "./components/ProductDetailModal";
import ProfileModal from "./components/ProfileModal";
import SablonDtfView from "./components/SablonDtfView";
import HomeMediaShowcase from "./components/HomeMediaShowcase";
import CategoryThumbnails from "./components/CategoryThumbnails";
import Newsletter from "./components/Newsletter";
import Sidebar from "./components/Sidebar";
import LookbookView from "./components/LookbookView";
import InfoModal from "./components/InfoModal";
import NavigationPopup from "./components/NavigationPopup";
import WorkspaceView from "./components/WorkspaceView";
import { auth, googleSignIn, getWorkspaceToken } from "./lib/workspace";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const mainScrollRef = useRef<HTMLDivElement>(null);
  // Session & UI states
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals / Panels toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<"contact" | "shipping" | "returns" | "size-guide" | "lookbook">("contact");
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubscribed, setFooterSubscribed] = useState(false);

  // Business state
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [smallBanners, setSmallBanners] = useState<SmallBanner[]>([]);
  const [infoBanners, setInfoBanners] = useState<InfoBanner[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("default");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const token = await fbUser.getIdToken();
        setIdToken(token);
        // We might not have the workspace token on refresh if we don't cache it, 
        // but for now we'll handle it during sign-in.
        
        // Try to fetch user data from our backend
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          }
        } catch (err) {
          console.error("Failed to sync user:", err);
        }
      } else {
        setUser(null);
        setIdToken(null);
        setWorkspaceToken(null);
      }
    });
  }, []);

  // Dynamic App Customizations
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    text: "A-GIN",
    highlightText: "FASHION",
    slogan: "Exclusive Elegance",
    logoUrl: ""
  });
  const [dtfSettings, setDtfSettings] = useState<DtfSettings>({
    bannerImage: "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400",
    identityTitle: "A-GIN DTF & SABLON PREMIUM",
    identitySubtitle: "Hasil Cetak Detail Tinggi, Elastis, dan Tahan Cuci",
    description: "Layanan sablon Digital Transfer Film (DTF) premium."
  });
  const [homeMedia, setHomeMedia] = useState<HomeMedia[]>([]);

  // Load user session, products, and custom settings on mount
  useEffect(() => {
    // 2. Retrieve cart from local storage
    const savedCart = localStorage.getItem("tf_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to parse saved cart", err);
      }
    }

    // 3. Load products & customizations from dynamic APIs
    fetchProducts();
    fetchSettings();
  }, [idToken]);

  const fetchSettings = async () => {
    try {
      const headers: any = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const [logoRes, dtfRes, mediaRes, bannersRes, smallBannersRes, infoBannersRes] = await Promise.all([
        fetch("/api/settings/logo", { headers }),
        fetch("/api/settings/dtf", { headers }),
        fetch("/api/settings/homemedia", { headers }),
        fetch("/api/banners", { headers }),
        fetch("/api/small-banners", { headers }),
        fetch("/api/info-banners", { headers })
      ]);
      if (logoRes.ok) setLogoSettings(await logoRes.json());
      if (dtfRes.ok) setDtfSettings(await dtfRes.json());
      if (mediaRes.ok) setHomeMedia(await mediaRes.json());
      if (bannersRes.ok) setBanners(await bannersRes.json());
      if (smallBannersRes.ok) setSmallBanners(await smallBannersRes.json());
      if (infoBannersRes.ok) setInfoBanners(await infoBannersRes.json());
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  // Save cart to localStorage on update
  useEffect(() => {
    localStorage.setItem("tf_cart", JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        console.error("Failed to fetch products from backend API");
      }
    } catch (err) {
      console.error("Error connecting to backend API:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("tf_user", JSON.stringify(loggedInUser));
    
    // Redirect to admin panel if the logged-in user is an admin
    if (loggedInUser.isAdmin) {
      setActiveTab("admin");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      localStorage.removeItem("tf_user");
      setActiveTab("home");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser({
          id: result.user.uid,
          name: result.user.displayName || "User",
          email: result.user.email || "",
          isAdmin: result.user.email === 'aprhyzsilla1@gmail.com',
          avatarUrl: result.user.photoURL || ""
        });
        setIdToken(result.idToken);
        setWorkspaceToken(result.accessToken);
        setIsAuthOpen(false);
      }
    } catch (err) {
      console.error("Google Login failed:", err);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      
      await fetch("/api/settings/theme", {
        method: "PUT",
        headers,
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case "dark": return "bg-slate-950 text-slate-100 min-h-screen transition-colors duration-500";
      case "pastel": return "bg-rose-50 text-slate-800 min-h-screen transition-colors duration-500";
      case "vibrant": return "bg-blue-600 text-white min-h-screen transition-colors duration-500";
      default: return "bg-[#F5F2EB] text-[#1B1B1B] min-h-screen transition-colors duration-500";
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("tf_user", JSON.stringify(updatedUser));
  };

  // Cart operations
  const handleAddToCart = (product: Product, sizeOrQuantity?: any, selectedSizeParam?: string) => {
    // REQUIRE LOGIN BEFORE BUYING
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    let selectedSize = "L";
    let quantityToAdd = 1;

    if (typeof sizeOrQuantity === "number") {
      quantityToAdd = sizeOrQuantity;
      selectedSize = selectedSizeParam || "L";
    } else if (typeof sizeOrQuantity === "string") {
      selectedSize = sizeOrQuantity;
    }

    setCart((prevCart) => {
      // Check if product with exact size is already in cart
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingIndex];
        const newQuantity = Math.min(existingItem.quantity + quantityToAdd, product.stock);
        updatedCart[existingIndex] = { ...existingItem, quantity: newQuantity };
        return updatedCart;
      } else {
        return [...prevCart, { product, quantity: quantityToAdd, selectedSize: selectedSize }];
      }
    });

    // Automatically slide out cart drawer for premium UX feedback
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number, size: string) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId, size);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleUpdateCartSize = (productId: string, oldSize: string, newSize: string) => {
    setCart((prevCart) => {
      const itemToUpdate = prevCart.find(
        (item) => item.product.id === productId && item.selectedSize === oldSize
      );
      if (!itemToUpdate) return prevCart;

      // Filter out the old item
      const otherItems = prevCart.filter(
        (item) => !(item.product.id === productId && item.selectedSize === oldSize)
      );

      // Check if item with the NEW size already exists in the cart
      const duplicateIndex = otherItems.findIndex(
        (item) => item.product.id === productId && item.selectedSize === newSize
      );

      if (duplicateIndex > -1) {
        // If duplicate exists, merge quantities
        const updatedItems = [...otherItems];
        const existingDuplicate = updatedItems[duplicateIndex];
        const mergedQty = Math.min(
          existingDuplicate.quantity + itemToUpdate.quantity,
          itemToUpdate.product.stock
        );
        updatedItems[duplicateIndex] = { ...existingDuplicate, quantity: mergedQty };
        return updatedItems;
      } else {
        // Just rename size
        return [...otherItems, { ...itemToUpdate, selectedSize: newSize }];
      }
    });
  };

  const handleRemoveCartItem = (productId: string, size: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.product.id === productId && item.selectedSize === size))
    );
  };

  // Click Action Callback Handlers for Interactive Buttons
  const scrollToCatalog = () => {
    setTimeout(() => {
      const element = document.getElementById("catalog-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleShopNow = () => {
    setCategoryFilter("all");
    setSearchQuery("");
    scrollToCatalog();
  };

  const handleWatchLookbook = () => {
    setActiveTab("lookbook");
  };

  const handleViewBadge = (tab: "shipping" | "returns" | "contact") => {
    setInfoTab(tab);
    setIsInfoOpen(true);
  };

  const handleShopSale = () => {
    setCategoryFilter("Promo");
    setSearchQuery("");
    scrollToCatalog();
  };

  const handleExploreNewIn = () => {
    setCategoryFilter("all");
    setSearchQuery("");
    scrollToCatalog();
  };

  const handleOpenInfoTab = (tab: "contact" | "shipping" | "returns" | "size-guide") => {
    setInfoTab(tab);
    setIsInfoOpen(true);
  };

  const handleFooterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (footerEmail.trim()) {
      setFooterSubscribed(true);
      setTimeout(() => {
        setFooterSubscribed(false);
        setFooterEmail("");
      }, 5000);
    }
  };

  // CRUD API Handlers (Admin Panel)
  const handleAddProductAPI = async (productData: Partial<Product>): Promise<boolean> => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        await fetchProducts(); // refresh list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error creating product:", err);
      return false;
    }
  };

  const handleUpdateProductAPI = async (productId: string, productData: Partial<Product>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        await fetchProducts(); // refresh list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error updating product:", err);
      return false;
    }
  };

  const handleDeleteProductAPI = async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchProducts(); // refresh list
        // Remove from cart also if present
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting product:", err);
      return false;
    }
  };

  const handleDeleteAllProductsAPI = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/products", {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchProducts(); // refresh list
        setCart([]); // clear cart
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting all products:", err);
      return false;
    }
  };

  if (!user) {
    return <MandatoryLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-root-layout" className={`flex flex-col font-sans antialiased overflow-hidden ${getThemeClasses()}`}>
      
      {/* Sticky Header Topbar */}
      {activeTab !== "lookbook" && (
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cart={cart}
          onOpenCart={() => setIsCartOpen(true)}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNav={() => setIsNavOpen(true)}
          activeTab={activeTab === "lookbook" ? "home" : activeTab}
          setActiveTab={(tab) => setActiveTab(tab as any)}
          currentCategory={categoryFilter}
          setCategory={setCategoryFilter}
          logoSettings={logoSettings}
        />
      )}

      <NavigationPopup
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        user={user}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onOpenAdmin={() => setActiveTab("admin")}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenWorkspace={() => setActiveTab("workspace")}
        onOpenHome={() => { setActiveTab("home"); setCategoryFilter("all"); }}
        onOpenLookbook={() => setActiveTab("lookbook")}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content Wrapper */}
      <main ref={mainScrollRef} className="flex-1 overflow-y-auto relative pb-10 no-scrollbar">
          
        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1B1B1B] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-[#1B1B1B]/60">Memuat katalog...</p>
          </div>
        ) : activeTab === "workspace" ? (
          <WorkspaceView 
            idToken={idToken || ""} 
            workspaceToken={workspaceToken || ""} 
          />
        ) : activeTab === "lookbook" ? (
          <LookbookView onBack={() => setActiveTab("home")} />
        ) : activeTab === "admin" ? (
          // ADMIN BACKEND CRUD VIEW WITH ORIGINAL SIDEBAR LAYOUT RESTORED
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] w-full overflow-hidden bg-[#F5F2EB]">
            {/* Left Sidebar on Desktop in Admin Mode */}
            <div className="hidden lg:block w-[240px] flex-shrink-0 border-r border-[#1B1B1B]/10 h-full">
              <Sidebar
                currentCategory={categoryFilter}
                setCategory={(cat) => {
                  setCategoryFilter(cat);
                  setActiveTab("home");
                }}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                onLogout={handleLogout}
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenProfile={() => setIsProfileOpen(true)}
                logoSettings={logoSettings}
              />
            </div>
            
            {/* Scrollable Main Admin Workspace Panel */}
            <div className="flex-1 px-6 md:px-12 py-8 overflow-y-auto no-scrollbar">
              <AdminPanel
                products={products}
                onAddProduct={handleAddProductAPI}
                onUpdateProduct={handleUpdateProductAPI}
                onDeleteProduct={handleDeleteProductAPI}
                onDeleteAllProducts={handleDeleteAllProductsAPI}
                onReloadProducts={fetchProducts}
                onReloadSettings={fetchSettings}
              />
            </div>
          </div>
        ) : (
          // FRONTEND E-COMMERCE VIEW
          <div className="w-full">
            {/* Slider Hero Banner (Full Width) */}
            {categoryFilter === "all" && searchQuery === "" && (
              <HeroSlider 
                banners={banners}
                onShopNow={handleShopNow}
                onWatchLookbook={handleWatchLookbook}
                onViewBadge={handleViewBadge}
              />
            )}

            {/* Small Banner + MADE TO MOVE Slogan Section */}
            {categoryFilter === "all" && searchQuery === "" && (
              <SmallBannerSection smallBanners={smallBanners} />
            )}

            {/* Info Banners (Third banner type) */}
            {categoryFilter === "all" && searchQuery === "" && (
              <InfoBannerSection infoBanners={infoBanners} />
            )}

            <div className="max-w-[1400px] mx-auto px-[4vw]">
              {/* Category Circular Navigation Menu */}
              {searchQuery === "" && (
                <CategoryThumbnails
                  currentCategory={categoryFilter}
                  setCategory={setCategoryFilter}
                />
              )}

            {/* Kebut Kebyar (Flash Sale Countdown) */}
            {categoryFilter === "all" && searchQuery === "" && (
              <FlashSale
                products={products}
                onAddToCart={handleAddToCart}
                onViewDetail={setSelectedDetailProduct}
              />
            )}

            {/* Primary Product Grid Section / Custom Sablon DTF Workshop */}
            {categoryFilter === "Sablon DTF" ? (
              <SablonDtfView
                dtfSettings={dtfSettings}
                products={products}
                onAddToCart={handleAddToCart}
              />
            ) : (
              <ProductGrid
                products={products}
                categoryFilter={categoryFilter}
                searchQuery={searchQuery}
                onAddToCart={handleAddToCart}
                onViewDetail={setSelectedDetailProduct}
                onResetFilters={handleShopNow}
              />
            )}

            {/* Newsletter Subscription Box */}
            {categoryFilter === "all" && searchQuery === "" && (
              <Newsletter />
            )}

            {/* Elegant Dark Footer matching the mockup */}
            <footer className="mt-32 -mx-[4vw] px-[4vw] pt-20 pb-16 bg-[#111111] text-[#F8F7F4]/80 grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-black">
              <div className="space-y-6">
                {logoSettings?.logoUrl ? (
                  <div 
                    className="h-16 w-auto flex items-center justify-start relative animate-none" 
                  >
                    <img 
                      src={logoSettings.logoUrl} 
                      alt="A-GIN" 
                      className="h-16 w-auto object-contain"
                      referrerPolicy="no-referrer"
                      style={{ filter: 'invert(1) brightness(100)' }}
                    />
                  </div>
                ) : (
                  <div className="font-serif text-3xl font-light tracking-widest text-[#F8F7F4]">
                    {logoSettings?.text || "A-GIN"} <span className="font-sans text-[0.6rem] tracking-[0.3em] text-[#A68966] uppercase block mt-1">{logoSettings?.highlightText || "STUDIO"}</span>
                  </div>
                )}
                <p className="text-[0.8rem] font-light leading-relaxed max-w-xs text-[#F8F7F4]/60 mt-4">
                  Koleksi fashion premium dengan detail presisi dan material berkualitas tinggi untuk gaya hidup modern.
                </p>
                <div className="flex gap-4 text-[#F8F7F4]/60 text-lg">
                  <a href="https://instagram.com/andho_rakat_ntt" target="_blank" rel="noreferrer" className="hover:text-[#A68966] transition-colors">📸</a>
                  <a href="#" className="hover:text-[#A68966] transition-colors">🎵</a>
                  <a href="https://wa.me/6281219154973" target="_blank" rel="noreferrer" className="hover:text-[#A68966] transition-colors">💬</a>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#A68966] font-bold">SHOP</p>
                <ul className="space-y-2.5 text-[0.8rem] font-light text-[#F8F7F4]/60 list-none p-0 m-0">
                  <li><button onClick={() => setCategoryFilter("all")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">All Products</button></li>
                  <li><button onClick={() => setCategoryFilter("Promo")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">New Arrivals</button></li>
                  <li><button onClick={() => setCategoryFilter("Women")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Women's Collection</button></li>
                  <li><button onClick={() => setCategoryFilter("Men")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Men's Collection</button></li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#A68966] font-bold">CUSTOMER CARE</p>
                <ul className="space-y-2.5 text-[0.8rem] font-light text-[#F8F7F4]/60 list-none p-0 m-0">
                  <li><button onClick={() => handleOpenInfoTab("contact")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Contact Us</button></li>
                  <li><button onClick={() => handleOpenInfoTab("shipping")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Shipping & Delivery</button></li>
                  <li><button onClick={() => handleOpenInfoTab("returns")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Returns & Exchanges</button></li>
                  <li><button onClick={() => handleOpenInfoTab("size-guide")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Size Guide</button></li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#A68966] font-bold">STAY CONNECTED</p>
                <p className="text-[0.8rem] font-light text-[#F8F7F4]/60">Sign up for updates and get 10% off your next purchase.</p>
                {footerSubscribed ? (
                  <div className="bg-[#222222] text-[#F8F7F4] font-mono text-[0.6rem] uppercase tracking-wider px-4 py-3 rounded-full text-center border border-emerald-800 text-emerald-400">
                    ✨ Subscribed! Thank you.
                  </div>
                ) : (
                  <form onSubmit={handleFooterSubscribe} className="flex gap-2">
                    <input 
                      type="email" 
                      required
                      placeholder="Enter email" 
                      value={footerEmail}
                      onChange={(e) => setFooterEmail(e.target.value)}
                      className="bg-[#222222] text-white border border-[#333333] rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#A68966] flex-1"
                    />
                    <button type="submit" className="bg-white text-black font-mono text-[0.65rem] uppercase tracking-wider font-bold px-4 py-2 rounded-full hover:bg-white/80 transition-all cursor-pointer">
                      →
                    </button>
                  </form>
                )}
              </div>

              <div className="col-span-1 md:col-span-4 pt-12 mt-8 border-t border-[#F8F7F4]/10 text-center flex flex-col md:flex-row justify-between items-center gap-4 text-[0.7rem] text-[#F8F7F4]/40 uppercase tracking-[0.15em] font-mono">
                <p>© 2026 {logoSettings?.text || "A-GIN"} STUDIO. ALL RIGHTS RESERVED.</p>
                <p>Designed by Andho Rakat NTT</p>
              </div>
            </footer>
          </div>
          </div>
        )}
      </main>

      {/* 3. Slide-out Cart Drawer Panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onUpdateSize={handleUpdateCartSize}
        onRemoveItem={handleRemoveCartItem}
      />

      {/* 4. Auth Register/Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 5. Product Detail Zoom Modal */}
      <ProductDetailModal
        product={selectedDetailProduct}
        allProducts={products}
        onClose={() => setSelectedDetailProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 6. Profile Customization Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />

      {/* 7. General Brand Information Help Modal */}
      <InfoModal 
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        tab={infoTab}
      />
    </div>
  );
}
