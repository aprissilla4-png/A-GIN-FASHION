import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, X, ChevronLeft, Film, Sparkles } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

interface Video {
  id: string;
  title: string;
  url: string;
  type: "video";
}

interface LookbookViewProps {
  onBack: () => void;
}
export default function LookbookView({ onBack }: LookbookViewProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/media?type=video");
      if (res.ok) {
        setVideos(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch lookbook videos:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-red-500" />
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">Lookbook Collection</h1>
          </div>

          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Intro */}
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider"
          >
            <Sparkles className="w-3 h-3" />
            <span>Exclusive Visual Experience</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter"
          >
            Watch the <span className="text-red-600">Style</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-sm max-w-md mx-auto font-medium"
          >
            Jelajahi koleksi terbaru kami melalui cinematic lookbook yang dirancang khusus untuk inspirasi gaya Anda.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Loading Collection...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-[9/16] md:aspect-video bg-white/5 rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-red-600/50 transition-all shadow-2xl"
                onClick={() => setSelectedVideo(video)}
              >
                <VideoPlayer 
                  src={video.url} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  onClick={() => setSelectedVideo(video)}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-xl shadow-red-600/20 group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight leading-none">{video.title}</h3>
                      <p className="text-xs text-white/60 font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-4 h-[1px] bg-red-600" />
                        Interactive Look
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {videos.length === 0 && (
              <div className="col-span-full text-center py-24 border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-white/20 font-black uppercase tracking-widest">Belum ada koleksi video</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Video Modal Overlay */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer z-[60]"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.2)] border border-white/10"
            >
              <video 
                ref={(el) => {
                  if (el) {
                    el.play().catch(e => console.log("Lookbook modal play handled:", e.message));
                  }
                }}
                src={selectedVideo.url} 
                className="w-full h-full object-contain"
                controls
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedVideo.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Decoration */}
      <footer className="py-24 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.5em]">A-GIN FASHION VISUALS</p>
      </footer>
    </div>
  );
}
