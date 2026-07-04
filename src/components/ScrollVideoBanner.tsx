import React from "react";
import { useScroll, useTransform, motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";

interface ScrollVideoBannerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ScrollVideoBanner({ containerRef }: ScrollVideoBannerProps) {
  // Use scroll hook bound to the scrollable main container
  const { scrollY } = useScroll({
    container: containerRef,
  });

  // Dynamic animations mapped to scroll position (0 to 250px)
  const scale = useTransform(scrollY, [0, 250], [1, 0.94]);
  const borderRadius = useTransform(scrollY, [0, 250], ["0px", "28px"]);
  const paddingX = useTransform(scrollY, [0, 250], ["0px", "16px"]);
  const opacity = useTransform(scrollY, [0, 250], [1, 0.98]);

  // Video fallback and cover PNG
  const posterUrl = "/uploads/upload_1783093896290_hmnpd.png";
  // Reliable high-availability CDN video loop
  const videoUrl = "https://vjs.zencdn.net/v/oceans.mp4";

  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay prevented or video source load issue (using poster fallback):", err.message);
      });
    }
  }, []);

  const handleShopNow = () => {
    // Scroll to products smoothly
    const element = document.getElementById("product-grid-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.div
      id="scroll-video-banner-wrapper"
      className="w-full relative transition-all duration-300 ease-out z-20 flex justify-center"
      style={{
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop: useTransform(scrollY, [0, 250], ["0px", "12px"]),
      }}
    >
      <motion.div
        id="scroll-video-banner"
        className="w-full relative h-[420px] md:h-[500px] overflow-hidden bg-slate-950 shadow-2xl border border-white/5"
        style={{
          scale,
          borderRadius,
          opacity,
        }}
      >
        {/* Background Visual: Looping Video with Poster fallback */}
        <div className="absolute inset-0 w-full h-full z-0 bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity duration-700"
          />
          {/* Elegant gradients overlapping to make text super readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        {/* Floating elements inside banner for depth */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10 flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-white/10 shadow-lg tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 animate-pulse" />
            <span>Koleksi Eksklusif "Natural Rascal"</span>
          </span>
        </div>

        {/* Main Content Area */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 lg:p-16 text-white z-10 pointer-events-none">
          <div className="max-w-xl space-y-4 md:space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                NATURAL RASCAL
              </h1>
              <p className="text-xs md:text-sm font-black tracking-widest text-red-500 uppercase">
                BY VERAW.STUDIOS × WT_FLEX
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm md:text-base text-slate-200/90 font-medium leading-relaxed"
            >
              Kemeja polo premium dengan detail jahitan estetik, material ultra-lembut, dan perpaduan karya visual modern. Sempurnakan style urban-lokal NTT Anda sekarang.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-2 pointer-events-auto"
            >
              <button
                onClick={handleShopNow}
                className="group flex items-center gap-2 bg-white text-slate-950 hover:bg-red-600 hover:text-white font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-xl shadow-xl transition-all duration-300 hover:shadow-red-600/20 active:scale-95 cursor-pointer"
              >
                <span>Mulai Belanja</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Ambient bottom linear shadows */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-0" />
      </motion.div>
    </motion.div>
  );
}
