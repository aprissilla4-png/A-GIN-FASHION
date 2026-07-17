import React from "react";
import { Product } from "../types";
import { ChevronRight, Palette } from "lucide-react";
import { motion } from "motion/react";

interface DtfShowcaseProps {
  products: Product[];
  onExplore: () => void;
  onAddToCart: (product: Product) => void;
  onViewDetail: (product: Product) => void;
}

export default function DtfShowcase({ products, onExplore, onAddToCart, onViewDetail }: DtfShowcaseProps) {
  const dtfProducts = products.filter(p => p.productType === "dtf" && !p.isBannerProduct).slice(0, 4);

  if (dtfProducts.length === 0) return null;

  return (
    <section className="mb-24 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-200/50">
            <Palette className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif text-[1.8rem] md:text-[2.2rem] font-light text-[#111111] leading-tight">
              SABLON DTF <span className="italic">Workshop</span>
            </h3>
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#D46A7A] font-black mt-1">
              Custom Kualitas Premium Surabaya
            </p>
          </div>
        </div>
        <button 
          onClick={onExplore}
          className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-[#D46A7A] transition-colors group cursor-pointer"
        >
          Lihat Katalog DTF Lengkap
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {dtfProducts.map((p) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group cursor-pointer flex flex-col gap-4"
            onClick={() => onViewDetail(p)}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 rounded-[1.8rem] border border-slate-200/50 shadow-sm">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[8px] font-black text-orange-700 rounded-full shadow-sm border border-orange-100 uppercase tracking-tighter">
                  {p.category}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="px-1">
              <h4 className="font-sans text-[0.95rem] text-[#2F2022] font-semibold leading-tight group-hover:text-[#D46A7A] transition-colors truncate mb-1">
                {p.name}
              </h4>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-[#2F2022] font-black">
                  Rp {p.price?.toLocaleString("id-ID") || "Mulai 10rb"}
                </p>
                {p.printSize && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.printSize}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
