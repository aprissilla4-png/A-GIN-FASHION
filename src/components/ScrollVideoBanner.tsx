import React, { useState, useMemo } from "react";
import { useScroll, useTransform, motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Play, X, ShoppingBag, Info, Heart, Star, Package, Truck } from "lucide-react";
import { VideoBanner, Product } from "../types";

export interface ScrollVideoBannerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  banner?: VideoBanner;
  onNavigate?: (tab: string) => void;
  products: Product[];
  onAddToCart: (product: Product, quantity: number, size: string) => void;
}

// Utility to extract YouTube video ID
function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
  return match ? match[1] : null;
}

const ScrollVideoBanner: React.FC<ScrollVideoBannerProps> = ({ containerRef, banner, onNavigate, products, onAddToCart }) => {
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [isShopPopupOpen, setIsShopPopupOpen] = useState(false);
  const [selectedProductForQuickView, setSelectedProductForQuickView] = useState<Product | null>(null);

  // Filter products that belong specifically to this banner
  const bannerProducts = useMemo(() => {
    if (!banner) return [];
    return products.filter(p => p.bannerId === banner.id);
  }, [products, banner]);
  // Use scroll hook bound to the scrollable main container
  const { scrollY } = useScroll({
    container: containerRef,
  });

  // If no banner is provided, we can return null or a default one
  if (!banner || !banner.isActive) return null;

  const ytId = getYoutubeId(banner.videoUrl);

  // Dynamic animations mapped to scroll position (0 to 250px)
  const scale = useTransform(scrollY, [0, 250], [1, 0.94]);
  const borderRadius = useTransform(scrollY, [0, 250], ["0px", "28px"]);
  const paddingX = useTransform(scrollY, [0, 250], ["0px", "16px"]);
  const paddingTop = useTransform(scrollY, [0, 250], ["0px", "12px"]);
  const opacity = useTransform(scrollY, [0, 250], [1, 0.98]);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (video && !ytId) {
      // Ensure the video attributes are strictly set programmatically to bypass browser autoplay policies
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "true");
      video.setAttribute("playsinline", "true");
      video.setAttribute("autoplay", "true");
      video.setAttribute("loop", "true");

      const playVideo = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Autoplay was prevented. This is normal for some browsers until user interacts.", err.message);
            // Try playing again after a short delay or on next interaction
          });
        }
      };

      const handleCanPlay = () => {
        playVideo();
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("loadedmetadata", handleCanPlay);
      video.addEventListener("error", (e) => {
        const error = video.error;
        let errorMessage = "Unknown video error";
        if (error) {
          switch (error.code) {
            case 1: errorMessage = "Video loading aborted"; break;
            case 2: errorMessage = "Network error while loading video"; break;
            case 3: errorMessage = "Video decoding failed"; break;
            case 4: errorMessage = "Video format not supported or URL invalid"; break;
          }
        }
        console.error(`Video Error (Code ${error?.code || 0}): ${errorMessage}`, {
          src: video.currentSrc || video.src || banner.videoUrl,
          error
        });
      });

      // Force video load/reload when the source URL changes
      video.load();
      playVideo();

      // Listen for first user interaction to resume playback if blocked
      const resumePlay = () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
        ["click", "touchstart", "scroll", "mousemove", "keydown"].forEach(ev => 
          window.removeEventListener(ev, resumePlay)
        );
      };

      ["click", "touchstart", "scroll", "mousemove", "keydown"].forEach(ev => 
        window.addEventListener(ev, resumePlay, { passive: true })
      );

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("loadedmetadata", handleCanPlay);
        ["click", "touchstart", "scroll", "mousemove", "keydown"].forEach(ev => 
          window.removeEventListener(ev, resumePlay)
        );
      };
    }
  }, [banner.videoUrl, ytId]);

  const handleAction = () => {
    // If we have banner products, always prioritize opening the shop popup
    if (bannerProducts.length > 0 || banner.buttonText?.toLowerCase().includes("shop")) {
      setIsShopPopupOpen(true);
      return;
    }
    
    if (banner.buttonUrl) {
      if (banner.buttonUrl === "#explore" && onNavigate) {
        onNavigate("explore");
        return;
      }
      if (banner.buttonUrl.startsWith("#")) {
        const element = document.getElementById(banner.buttonUrl.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        window.open(banner.buttonUrl, "_blank");
      }
    }
  };

  return (
    <motion.div
      id={`scroll-video-banner-wrapper-${banner.id}`}
      className="w-full relative transition-all duration-300 ease-out z-20 flex justify-center"
      style={{
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop: paddingTop,
      }}
    >
      <motion.div
        id={`scroll-video-banner-${banner.id}`}
        className="w-full relative h-screen overflow-hidden bg-slate-950 shadow-2xl border border-white/5"
        style={{
          scale,
          borderRadius,
          opacity,
        }}
      >
        {/* Background Visual: Looping Video with Poster fallback or YouTube Embed */}
        <div className="absolute inset-0 w-full h-full z-0 bg-black">
          {ytId ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`}
                className="w-full h-full pointer-events-none opacity-60 scale-[1.35] origin-center"
                allow="autoplay; encrypted-media"
                title="Banner Video"
              />
            </div>
          ) : (
            <video
              key={banner.videoUrl}
              ref={videoRef}
              poster={banner.posterUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover opacity-100"
            >
              <source src={banner.videoUrl} type="video/mp4" />
              <source src={banner.videoUrl} type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
          )}

          {/* Elegant gradients overlapping to make text super readable, conditionally shown if any text exists */}
          {(banner.title || banner.subtitle || banner.buttonText) && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/20 pointer-events-none" />
            </>
          )}
        </div>

        {/* Floating badge */}
        {(banner.title || banner.subtitle) && (
          <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10 flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-white/10 shadow-lg tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 animate-pulse" />
              <span>FEATURED COLLECTION</span>
            </span>
          </div>
        )}

        {/* Main Content Area */}
        {(banner.title || banner.subtitle || banner.buttonText) && (
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 lg:p-16 text-white z-10">
            <div className="max-w-2xl space-y-4 md:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-2"
              >
                {banner.title && (
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-none uppercase italic">
                    {banner.title}
                  </h1>
                )}
                {banner.subtitle && (
                  <p className="text-sm md:text-lg text-slate-200 font-medium max-w-lg leading-relaxed">
                    {banner.subtitle}
                  </p>
                )}
              </motion.div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {banner.buttonText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <button
                      onClick={handleAction}
                      className="group flex items-center gap-2 bg-white text-slate-950 hover:bg-red-600 hover:text-white font-black text-xs md:text-sm px-8 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <span>{banner.buttonText}</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                )}

                {banner.videoUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <button
                      onClick={() => setIsPlayModalOpen(true)}
                      className="group flex items-center gap-2 bg-white/20 hover:bg-white text-white hover:text-slate-950 backdrop-blur-md font-black text-xs md:text-sm px-8 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
                    >
                      <Play className="w-4 h-4 fill-current text-red-500 animate-pulse" />
                      <span>TONTON VIDEO</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ambient bottom linear shadows */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-0 opacity-80" />
      </motion.div>

      {/* Fullscreen Video Player Modal */}
      <AnimatePresence>
        {isPlayModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 md:p-10"
          >
            <button
              onClick={() => setIsPlayModalOpen(false)}
              className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/20 transition-all z-10 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative"
            >
              <video
                src={banner.videoUrl}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />

              <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <div className="max-w-xl space-y-1">
                  <h2 className="text-xl md:text-3xl font-black text-white italic uppercase">{banner.title}</h2>
                  {banner.subtitle && (
                    <p className="text-white/70 text-xs md:text-sm font-medium">{banner.subtitle}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Specific Shop Popup */}
      <AnimatePresence>
        {isShopPopupOpen && banner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-white overflow-y-auto"
          >
            <div className="min-h-screen flex flex-col">
              {/* Header / Navbar of the Popup */}
              <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-950 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-900 uppercase">
                    {banner.title} Collection
                  </span>
                </div>
                <button
                  onClick={() => setIsShopPopupOpen(false)}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Content Layout */}
              <div className="flex-1 flex flex-col md:flex-row">
                {/* Hero Side (Sticky on Desktop) - Video Banner (Pure Video, no text/description) */}
                <div className="w-full md:w-[40%] md:sticky md:top-20 md:h-[calc(100vh-80px)] bg-slate-950 relative overflow-hidden flex items-center justify-center">
                  {banner.videoUrl && banner.videoUrl.includes("youtube.com") || banner.videoUrl && banner.videoUrl.includes("youtu.be") ? (
                    (() => {
                      const popupYtId = getYoutubeId(banner.videoUrl);
                      return popupYtId ? (
                        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden bg-black">
                          <iframe
                            src={`https://www.youtube.com/embed/${popupYtId}?autoplay=1&mute=1&loop=1&playlist=${popupYtId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`}
                            className="w-full h-full pointer-events-none opacity-100 scale-[1.35] origin-center"
                            allow="autoplay; encrypted-media"
                            title="Popup Banner Video"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-white z-10">
                          <ShoppingBag className="w-16 h-16 text-slate-700 animate-pulse mb-4" />
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">No Video Loaded</p>
                        </div>
                      );
                    })()
                  ) : banner.videoUrl ? (
                    <video
                      key={banner.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="absolute inset-0 w-full h-full object-cover opacity-100 bg-black"
                    >
                      <source src={banner.videoUrl} type="video/mp4" />
                      <source src={banner.videoUrl} type="video/quicktime" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-white z-10">
                      <ShoppingBag className="w-16 h-16 text-slate-700 animate-pulse mb-4" />
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-black">No Video Uploaded</p>
                    </div>
                  )}
                </div>

                {/* Product Grid Side */}
                <div className="flex-1 bg-white p-6 md:p-20">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                          Catalog Items
                        </h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                          {bannerProducts.length} Products Available
                        </p>
                      </div>
                    </div>

                    {bannerProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-16">
                        {bannerProducts.map((product) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group"
                          >
                            <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-slate-50">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                              />
                              <div className="absolute top-6 right-6">
                                <button className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-black/5 active:scale-90">
                                  <Heart className="w-5 h-5" />
                                </button>
                              </div>
                              {product.isFlashSale && (
                                <div className="absolute top-6 left-6 bg-red-600 text-white text-[10px] font-black px-4 py-2 uppercase tracking-[0.2em] shadow-2xl">
                                  Flash Sale
                                </div>
                              )}
                              
                              {/* Quick View Overlay on Hover */}
                              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                <button className="bg-white text-slate-950 text-[10px] font-black px-8 py-4 uppercase tracking-[0.3em] translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                  View Detail
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.category}</span>
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs font-black text-slate-900">4.9</span>
                                </div>
                              </div>
                              <h5 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-red-600 transition-colors leading-none">
                                {product.name}
                              </h5>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-slate-900">Rp {Number(product.price).toLocaleString('id-ID')}</span>
                                {product.originalPrice && (
                                  <span className="text-sm text-slate-400 line-through font-medium">Rp {Number(product.originalPrice).toLocaleString('id-ID')}</span>
                                )}
                              </div>
                              
                              <button
                                onClick={() => {
                                  onAddToCart(product, 1, product.sizes?.[0] || "M");
                                  setIsShopPopupOpen(false);
                                }}
                                className="w-full mt-6 bg-slate-950 text-white text-[10px] font-black uppercase py-4 hover:bg-red-600 transition-all tracking-[0.3em] active:scale-[0.98] flex items-center justify-center gap-3"
                              >
                                <ShoppingBag className="w-4 h-4" />
                                Add to Shopping Bag
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-12 h-12 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Collections Coming Soon</p>
                          <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Kami sedang menyiapkan kurasi terbaik untuk koleksi ini. Pastikan Anda kembali lagi segera.</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Footer Info */}
                    <div className="mt-40 pt-20 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto md:mx-0">
                          <Truck className="w-6 h-6 text-slate-400" />
                        </div>
                        <h6 className="text-xs font-black text-slate-900 uppercase tracking-widest">Fast Shipping</h6>
                        <p className="text-xs text-slate-500 leading-relaxed">Pengiriman kilat ke seluruh Indonesia dengan partner logistik terpercaya.</p>
                      </div>
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto md:mx-0">
                          <Info className="w-6 h-6 text-slate-400" />
                        </div>
                        <h6 className="text-xs font-black text-slate-900 uppercase tracking-widest">Safe Payment</h6>
                        <p className="text-xs text-slate-500 leading-relaxed">Sistem pembayaran aman dan terenkripsi untuk keamanan data Anda.</p>
                      </div>
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto md:mx-0">
                          <Heart className="w-6 h-6 text-slate-400" />
                        </div>
                        <h6 className="text-xs font-black text-slate-900 uppercase tracking-widest">Premium Service</h6>
                        <p className="text-xs text-slate-500 leading-relaxed">Tim support kami siap membantu kebutuhan belanja Anda 24/7.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ScrollVideoBanner;
