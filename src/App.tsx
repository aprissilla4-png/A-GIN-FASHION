import React, { useState, useEffect, useRef } from "react";
import { User, Product, CartItem, LogoSettings, HomeMedia, DtfSettings, Banner, SmallBanner, InfoBanner, VideoBanner, ExploreVideo, MarketingText } from "./types";
import { Tab } from "./types";
import { motion, AnimatePresence } from "motion/react";
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
import { BrandLogo } from "./components/BrandLogo";
import DtfCatalogPage from "./components/DtfCatalogPage";
import ExploreView from "./components/ExploreView";
import BiteshipTestingView from "./components/BiteshipTestingView";
import ScrollVideoBanner from "./components/ScrollVideoBanner";
import CategoryThumbnails from "./components/CategoryThumbnails";
import Newsletter from "./components/Newsletter";
import DtfShowcase from "./components/DtfShowcase";
import Sidebar from "./components/Sidebar";
import InfoModal from "./components/InfoModal";
import NavigationPopup from "./components/NavigationPopup";
import OrderTrackingModal from "./components/OrderTrackingModal";
import WorkspaceView from "./components/WorkspaceView";
import PostProductView from "./components/PostProductView";
import InfoBannerCollectionView from "./components/InfoBannerCollectionView";
import { auth, googleSignIn, getWorkspaceToken } from "./lib/workspace";
import { onAuthStateChanged } from "firebase/auth";
import { Megaphone } from "lucide-react";

export default function App() {
  const mainScrollRef = useRef<HTMLDivElement>(null);
  // Session & UI states
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [marketingTexts, setMarketingTexts] = useState<MarketingText[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals / Panels toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [selectedInfoBanner, setSelectedInfoBanner] = useState<InfoBanner | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<"contact" | "shipping" | "returns" | "size-guide">("contact");
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubscribed, setFooterSubscribed] = useState(false);

  // Business state
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [smallBanners, setSmallBanners] = useState<SmallBanner[]>([]);
  const [infoBanners, setInfoBanners] = useState<InfoBanner[]>([]);
  const [videoBanners, setVideoBanners] = useState<VideoBanner[]>([]);
  const [exploreVideos, setExploreVideos] = useState<ExploreVideo[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
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

  const fetchMarketingTexts = async () => {
    try {
      const response = await fetch("/api/marketing-texts");
      if (response.ok) {
        const data = await response.json();
        setMarketingTexts(data);
      }
    } catch (err) {
      console.error("Error fetching marketing texts:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const headers: any = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const [logoRes, dtfRes, mediaRes, bannersRes, smallBannersRes, infoBannersRes, videoBannersRes, exploreRes] = await Promise.all([
        fetch("/api/settings/logo", { headers }),
        fetch("/api/settings/dtf", { headers }),
        fetch("/api/settings/homemedia", { headers }),
        fetch("/api/banners", { headers }),
        fetch("/api/small-banners", { headers }),
        fetch("/api/info-banners", { headers }),
        fetch("/api/video-banners", { headers }),
        fetch("/api/explore-videos", { headers })
      ]);
      if (logoRes.ok) setLogoSettings(await logoRes.json());
      if (dtfRes.ok) setDtfSettings(await dtfRes.json());
      if (mediaRes.ok) setHomeMedia(await mediaRes.json());
      if (bannersRes.ok) setBanners(await bannersRes.json());
      if (smallBannersRes.ok) setSmallBanners(await smallBannersRes.json());
      if (infoBannersRes.ok) setInfoBanners(await infoBannersRes.json());
      if (videoBannersRes.ok) setVideoBanners(await videoBannersRes.json());
      if (exploreRes.ok) setExploreVideos(await exploreRes.json());
      fetchMarketingTexts();
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
      case "dark": return "bg-[#1E1113] text-[#FAF1EE] min-h-screen transition-colors duration-500";
      case "pastel": return "bg-[#FDF3F0] text-[#2F2022] min-h-screen transition-colors duration-500";
      case "vibrant": return "bg-[#D46A7A] text-white min-h-screen transition-colors duration-500";
      default: return "bg-white text-[#2F2022] min-h-screen transition-all duration-500";
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

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => 
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
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
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": user?.email || ""
        },
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
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": user?.email || ""
        },
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

  const handleDeleteAllProductsAPI = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/products", { 
        method: "DELETE",
        headers: {
          "X-Admin-Email": user?.email || ""
        }
      });
      if (res.ok) {
        await fetchProducts();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting all products:", err);
      return false;
    }
  };

  const handleDeleteProductAPI = async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Email": user?.email || ""
        }
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

  if (!user) {
    return <MandatoryLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-root-layout" className={`flex flex-col font-sans antialiased overflow-hidden ${getThemeClasses()}`}>
      
      {/* Sticky Header Topbar */}
      <Topbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNav={() => setIsNavOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        currentCategory={categoryFilter}
        setCategory={setCategoryFilter}
        logoSettings={logoSettings}
      />

      <AnimatePresence>
        {isNavOpen && (
          <motion.div key="navigation-popup">
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
              onOpenExplore={() => setActiveTab("explore")}
              onOpenSablonDtf={() => setActiveTab("sablon-dtf")}
              onOpenBiteshipTesting={() => setActiveTab("biteship-testing")}
              currentTheme={theme}
              onThemeChange={handleThemeChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <main ref={mainScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative pb-10 no-scrollbar">
          
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[400px] flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-10 h-10 border-4 border-[#1B1B1B] border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-xs uppercase tracking-widest text-[#1B1B1B]/60">Memuat katalog...</p>
            </motion.div>
          ) : activeTab === "workspace" ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WorkspaceView 
                idToken={idToken || ""} 
                workspaceToken={workspaceToken || ""} 
              />
            </motion.div>
          ) : activeTab === "explore" ? (
            <motion.div
              key="explore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ExploreView videos={exploreVideos} />
            </motion.div>
          ) : (user?.isAdmin && activeTab === "biteship-testing") ? (
            <motion.div
              key="biteship-testing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BiteshipTestingView />
            </motion.div>
          ) : activeTab === "post-product" ? (
            <motion.div
              key="post-product"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PostProductView 
                onBackToHome={() => setActiveTab("home")}
                onProductAdded={fetchProducts}
                user={user}
              />
            </motion.div>
          ) : activeTab === "sablon-dtf" ? (
            <motion.div
              key="sablon-dtf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DtfCatalogPage 
                dtfSettings={dtfSettings}
                products={products}
                onAddToCart={handleAddToCart}
                onBack={() => setActiveTab("home")}
              />
            </motion.div>
          ) : activeTab === "admin" ? (
            // ADMIN BACKEND CRUD VIEW WITH ORIGINAL SIDEBAR LAYOUT RESTORED
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] w-full overflow-hidden bg-white"
            >
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
                onDeleteProducts={handleDeleteAllProductsAPI}
                onReloadProducts={fetchProducts}
                onReloadSettings={fetchSettings}
                onViewDetail={setSelectedDetailProduct}
                user={user}
              />
            </div>
          </motion.div>
        ) : (
          <>
            {/* 1. IMMERSIVE BRAND HERO - FULL SCREEN */}
        {/* FRONTEND E-COMMERCE VIEW */}
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          {/* Top Video Banners */}
          {categoryFilter === "all" && searchQuery === "" && videoBanners.filter(b => b.position === "top" && b.isActive).map(banner => (
            <ScrollVideoBanner 
              key={banner.id} 
              containerRef={mainScrollRef} 
              banner={banner} 
              onNavigate={setActiveTab} 
              products={products}
              onAddToCart={handleAddToCart}
            />
          ))}

          {/* Slider Hero Banner (Full Width) */}
          {categoryFilter === "all" && searchQuery === "" && (
            <HeroSlider 
              banners={banners}
              onShopNow={handleShopNow}
              onViewBadge={handleViewBadge}
            />
          )}

          {/* Small Banner + MADE TO MOVE Slogan Section */}
          {categoryFilter === "all" && searchQuery === "" && (
            <SmallBannerSection smallBanners={smallBanners} />
          )}

          {/* Marketing Texts - Bottom position */}
          {marketingTexts.filter(t => t.position === 'bottom' && t.isActive).map((mt) => (
            <div key={mt.id} className="max-w-7xl mx-auto px-6 py-12">
               <div className="bg-slate-50 rounded-3xl p-10 text-center border border-slate-100">
                  <h3 className="font-display font-black text-2xl text-slate-900 uppercase tracking-tighter mb-4">{mt.title}</h3>
                  <p className="text-slate-600 font-medium max-w-2xl mx-auto">{mt.content}</p>
               </div>
            </div>
          ))}

            {/* Middle Video Banners */}
            {categoryFilter === "all" && searchQuery === "" && videoBanners.filter(b => b.position === "middle" && b.isActive).map(banner => (
              <ScrollVideoBanner 
                key={banner.id} 
                containerRef={mainScrollRef} 
                banner={banner} 
                onNavigate={setActiveTab} 
                products={products}
                onAddToCart={handleAddToCart}
              />
            ))}

            {/* Info Banners (Third banner type) */}
            {categoryFilter === "all" && searchQuery === "" && (
              <InfoBannerSection 
                infoBanners={infoBanners} 
                onNavigateToCollection={(banner) => {
                  setSelectedInfoBanner(banner);
                }}
                isAdmin={user?.isAdmin}
                onGoToAdmin={() => setActiveTab("admin")}
              />
            )}

            <div className="max-w-[1400px] mx-auto px-[4vw]">
              {/* Category Circular Navigation Menu */}
              {searchQuery === "" && (
                <CategoryThumbnails
                  currentCategory={categoryFilter}
                  setCategory={setCategoryFilter}
                  setActiveTab={setActiveTab}
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

            {/* Sablon DTF Teaser Section */}
            {categoryFilter === "all" && searchQuery === "" && (
              <DtfShowcase 
                products={products}
                onExplore={() => setActiveTab("sablon-dtf")}
                onAddToCart={handleAddToCart}
                onViewDetail={setSelectedDetailProduct}
              />
            )}

            {/* Primary Product Grid Section / Custom Sablon DTF Workshop */}
            <div id="catalog-section" className="scroll-mt-24">
              <ProductGrid
                products={products.filter(p => !p.isBannerProduct)}
                categoryFilter={categoryFilter}
                searchQuery={searchQuery}
                onAddToCart={handleAddToCart}
                onViewDetail={setSelectedDetailProduct}
                onToggleWishlist={toggleWishlist}
                wishlist={wishlist}
              />
            </div>

            {/* Newsletter Subscription Box */}
            {categoryFilter === "all" && searchQuery === "" && (
              <Newsletter />
            )}

            {/* Bottom Video Banners */}
            {categoryFilter === "all" && searchQuery === "" && videoBanners.filter(b => b.position === "bottom" && b.isActive).map(banner => (
              <ScrollVideoBanner 
                key={banner.id} 
                containerRef={mainScrollRef} 
                banner={banner} 
                onNavigate={setActiveTab} 
                products={products}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Elegant Rose-Blush Footer matching the beauty makeup theme */}
            <footer className="mt-32 -mx-[4vw] px-[4vw] pt-20 pb-16 bg-white text-[#5C4649] grid grid-cols-1 md:grid-cols-5 gap-12 border-t border-gray-100">
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
                    />
                  </div>
                ) : (
                  <div className="font-serif text-3xl font-medium tracking-wide text-[#2F2022]">
                    {logoSettings?.text || "A-GIN"} <span className="font-sans text-[8px] tracking-[0.3em] text-[#D46A7A] font-black uppercase block mt-1">{logoSettings?.highlightText || "FASHION"}</span>
                  </div>
                )}
                <p className="text-[0.8rem] font-light leading-relaxed max-w-xs text-[#5C4649]/80 mt-4">
                  Koleksi fashion premium dengan detail presisi dan material berkualitas tinggi untuk gaya hidup modern.
                </p>
                <div className="flex gap-4 text-[#D46A7A] text-lg">
                  <a href="https://instagram.com/andho_rakat_ntt" target="_blank" rel="noreferrer" className="hover:text-[#C55263] transition-colors">📸</a>
                  <a href="#" className="hover:text-[#C55263] transition-colors">🎵</a>
                  <a href="https://wa.me/6281219154973" target="_blank" rel="noreferrer" className="hover:text-[#C55263] transition-colors">💬</a>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#D46A7A] font-black">SHOP</p>
                <ul className="space-y-2.5 text-[0.8rem] font-medium text-[#5C4649]/80 list-none p-0 m-0">
                  <li><button onClick={() => setCategoryFilter("all")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">All Products</button></li>
                  <li><button onClick={() => setCategoryFilter("Promo")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">New Arrivals</button></li>
                  <li><button onClick={() => setCategoryFilter("Women")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Women's Collection</button></li>
                  <li><button onClick={() => setCategoryFilter("Men")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Men's Collection</button></li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#D46A7A] font-black">CUSTOMER CARE</p>
                <ul className="space-y-2.5 text-[0.8rem] font-medium text-[#5C4649]/80 list-none p-0 m-0">
                  <li><button onClick={() => handleOpenInfoTab("contact")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Contact Us</button></li>
                  <li><button onClick={() => handleOpenInfoTab("shipping")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Shipping & Delivery</button></li>
                  <li><button onClick={() => handleOpenInfoTab("returns")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Returns & Exchanges</button></li>
                  <li><button onClick={() => handleOpenInfoTab("size-guide")} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Size Guide</button></li>
                  <li><button onClick={() => setIsOrderTrackingOpen(true)} className="hover:text-[#D46A7A] transition-colors cursor-pointer bg-transparent border-none p-0 text-[#D46A7A] font-bold text-left flex items-center gap-1.5">📦 Order Tracking</button></li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#D46A7A] font-black">PAYMENT & DELIVERY</p>
                <div className="grid grid-cols-3 gap-2">
                  <img src="/uploads/upload_logo_processed_1783612821680_osvcx.png" alt="Logo" className="h-8 w-auto object-contain" />
                  <img src="/uploads/upload_logo_processed_1783605564517_a6y1h.png" alt="Logo" className="h-8 w-auto object-contain" />
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#D46A7A] font-black">STAY CONNECTED</p>
                <p className="text-[0.8rem] font-light text-[#5C4649]/80">Sign up for updates and get 10% off your next purchase.</p>
                {footerSubscribed ? (
                  <div className="bg-[#D46A7A] text-white font-sans text-[10px] font-bold uppercase tracking-wider px-4 py-3 rounded-full text-center border border-[#EAA0A9]/30 text-emerald-400 shadow-sm">
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
                      className="bg-white text-[#2F2022] border border-[#EAA0A9]/30 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#D46A7A] flex-1 font-medium"
                    />
                    <button type="submit" className="bg-[#D46A7A] hover:bg-[#C55263] text-white font-sans text-[11px] uppercase tracking-wider font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-md">
                      →
                    </button>
                  </form>
                )}
              </div>

              {/* Payment and Courier Logos for Trust */}
              <div className="col-span-1 md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 border-t border-[#EAA0A9]/20 pt-8">
                <div>
                  <h4 className="text-[10px] font-black text-[#5C4649] uppercase tracking-[0.2em] mb-4 text-center md:text-left">Metode Pembayaran</h4>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center">
                    <BrandLogo brand="QRIS" className="h-4 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
                    <BrandLogo brand="VA_BCA" className="h-4 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
                    <BrandLogo brand="VA_MANDIRI" className="h-3 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
                    <BrandLogo brand="VA_BRI" className="h-4 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
                    <BrandLogo brand="VA_BNI" className="h-4 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-[#5C4649] uppercase tracking-[0.2em] mb-4 text-center md:text-left">Kurir Pengiriman</h4>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center">
                    <BrandLogo brand="JNE" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="J&T" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="SICEPAT" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="GOJEK" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="GRAB" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="POS" className="h-5 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="NINJA" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="TIKI" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="IDEXPRESS" className="h-4 w-auto hover:opacity-80 transition-all" />
                    <BrandLogo brand="LALAMOVE" className="h-4 w-auto hover:opacity-80 transition-all" />
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-5 pt-12 mt-8 border-t border-[#EAA0A9]/20 text-center flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-[#5C4649]/60 uppercase tracking-[0.18em] font-bold">
                <p>© 2026 {logoSettings?.text || "A-GIN"} STUDIO. ALL RIGHTS RESERVED.</p>
                <p>Designed by Andho Rakat NTT</p>
              </div>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </main>

      {/* 3. Slide-out Cart Drawer Panel */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div key="cart-drawer">
            <CartDrawer
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cart={cart}
              user={user}
              onUpdateQuantity={handleUpdateCartQuantity}
              onUpdateSize={handleUpdateCartSize}
              onRemoveItem={handleRemoveCartItem}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Auth Register/Login Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div key="auth-modal">
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => setIsAuthOpen(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Product Detail Zoom Modal */}
      <AnimatePresence>
        {selectedDetailProduct && (
          <motion.div 
            key={`detail-${selectedDetailProduct.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
          >
            <ProductDetailModal
              product={selectedDetailProduct}
              allProducts={products}
              onClose={() => setSelectedDetailProduct(null)}
              onAddToCart={handleAddToCart}
              logoSettings={logoSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Profile Customization Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <motion.div key="profile-modal">
            <ProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              user={user}
              onUpdateUser={handleUpdateUser}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onAddToCart={handleAddToCart}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. General Brand Information Help Modal */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div key="info-modal">
            <InfoModal 
              isOpen={isInfoOpen}
              onClose={() => setIsInfoOpen(false)}
              tab={infoTab}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. Biteship Order Tracking Modal */}
      <AnimatePresence>
        {isOrderTrackingOpen && (
          <motion.div key="order-tracking-modal">
            <OrderTrackingModal 
              isOpen={isOrderTrackingOpen}
              onClose={() => setIsOrderTrackingOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. Nike-Style Info Banner Collection Pop-up Modal Overlay */}
      <AnimatePresence>
        {selectedInfoBanner && (
          <motion.div 
            key="info-banner-collection-popup"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto no-scrollbar"
          >
            <InfoBannerCollectionView 
              banner={selectedInfoBanner}
              products={products}
              onAddToCart={handleAddToCart}
              onBack={() => {
                setSelectedInfoBanner(null);
              }}
              user={user}
              onReloadProducts={fetchProducts}
              onViewDetail={setSelectedDetailProduct}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
