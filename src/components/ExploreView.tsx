import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, X, Sparkles, Clock, Share2, Heart } from "lucide-react";
import { ExploreVideo } from "../types";

interface ExploreViewProps {
  videos: ExploreVideo[];
}

export default function ExploreView({ videos }: ExploreViewProps) {
  const [selectedVideo, setSelectedVideo] = useState<ExploreVideo | null>(null);
  const activeVideos = videos.filter(v => v.isActive);

  return (
    <div className="min-h-screen bg-[#F8F7F4] pt-20 pb-32 px-[4vw]">
      {/* Header Section */}
      <div className="max-w-4xl mb-16 space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest rounded-full"
        >
          <Sparkles className="w-3 h-3 text-yellow-400" />
          <span>A-GIN Universe</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight text-emerald-950 leading-none"
        >
          EXPLORE THE <br /> <span className="italic">CRAFTSMANSHIP.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-slate-600 max-w-xl font-medium"
        >
          Saksikan dibalik layar pembuatan koleksi eksklusif, kampanye sinematik, dan narasi gaya hidup A-GIN.
        </motion.p>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeVideos.map((video, idx) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            className="group relative"
          >
            <div 
              onClick={() => setSelectedVideo(video)}
              className="relative aspect-[9/16] md:aspect-video rounded-[32px] overflow-hidden bg-slate-200 cursor-pointer shadow-xl border border-white"
            >
              <img 
                src={video.thumbnailUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1000"} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={video.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              {/* Info Bottom */}
              <div className="absolute bottom-0 inset-x-0 p-8 space-y-2">
                <h3 className="text-xl font-black text-white leading-tight uppercase italic">{video.title}</h3>
                <div className="flex items-center gap-4 text-white/70 text-[10px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> 2026 Edition</span>
                  <span className="flex items-center gap-1.5"><Heart className="w-3 h-3" /> Exclusive</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {activeVideos.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Play className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada konten eksplorasi.</p>
          </div>
        )}
      </div>

      {/* Video Modal Player */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/95 backdrop-blur-2xl p-4 md:p-10"
          >
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/20 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl aspect-video bg-black rounded-[40px] overflow-hidden shadow-2xl relative"
            >
              <video 
                src={selectedVideo.videoUrl} 
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
              
              <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <div className="max-w-xl space-y-2">
                  <h2 className="text-3xl font-black text-white italic uppercase">{selectedVideo.title}</h2>
                  <p className="text-white/70 text-sm font-medium">{selectedVideo.description}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
