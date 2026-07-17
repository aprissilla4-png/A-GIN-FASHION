import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { Heart } from "lucide-react";

interface FlashSaleProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetail: (product: Product) => void;
}

export default function FlashSale({ products, onAddToCart, onViewDetail }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 12, seconds: 21 });
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const flashProducts = products.filter((p) => {
    const isFashion = p.productType === "fashion" || !p.productType;
    return p.isFlashSale && isFashion && !p.isBannerProduct;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        else if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        else if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        else return { hours: 5, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  if (flashProducts.length === 0) return null;

  // Generate deterministic stars/reviews based on product ID/name length
  const getRating = (name: string) => {
    const score = 4.2 + ((name.length % 9) / 10);
    const count = 15 + (name.charCodeAt(0) % 80);
    const starString = "★".repeat(Math.round(score)) + "☆".repeat(5 - Math.round(score));
    return { score: score.toFixed(1), count, starString };
  };

  return (
    <section className="mb-24">
      {/* Header section matching the image exactly */}
      <div className="flex flex-col md:flex-row justify-between md:items-end border-t border-[#1B1B1B]/10 pt-16 pb-12 mt-16 gap-4">
        <div>
          <p className="font-mono text-[0.8rem] uppercase tracking-[0.2em] text-red-600 font-bold mb-2 flex items-center gap-1.5 animate-pulse">
            <span>⚡</span> LIMITED FLASH SALE
          </p>
          <h3 className="font-serif text-[2.2rem] md:text-[3.2rem] font-light text-[#111111] leading-none">
            Kebut Kebyar <span className="italic">Deals</span>
          </h3>
        </div>
        
        {/* Sleek countdown timer box */}
        <div className="flex items-center gap-2 bg-[#D46A7A] text-[#FAF1EE] font-sans text-[0.75rem] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-md">
          <span>ENDS IN:</span>
          <span className="font-black text-white">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
        {flashProducts.slice(0, 4).map((p) => {
          const rating = getRating(p.name);
          const isFavorited = !!favorites[p.id];

          return (
            <div key={p.id} className="group cursor-pointer flex flex-col justify-between bg-white/90 hover:bg-white backdrop-blur-md rounded-[2.2rem] p-5 shadow-lg border border-white/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-1" onClick={() => onViewDetail(p)}>
              <div className="space-y-4">
                {/* Image Wrapper */}
                <div className="w-full aspect-[3/4] overflow-hidden bg-[#FAF1EE] rounded-3xl relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105"
                  />
                  
                  {/* Floating Heart Button */}
                  <button 
                    onClick={(e) => toggleFavorite(p.id, e)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center border border-black/5 hover:scale-110 active:scale-95 transition-all shadow-sm z-10 cursor-pointer"
                  >
                    <Heart 
                      className={`w-4.5 h-4.5 transition-colors ${
                        isFavorited 
                          ? "fill-red-500 text-red-500" 
                          : "text-[#111111]/70 hover:text-[#111111]"
                      }`} 
                    />
                  </button>

                  {/* Promo Discount Tag */}
                  <div className="absolute top-4 left-4 bg-[#D46A7A] text-[#FAF1EE] font-sans text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Sale -30%
                  </div>
                </div>

                {/* Details Block */}
                <div className="space-y-1">
                  <h4 className="font-sans text-[1.05rem] text-[#2F2022] font-normal leading-tight tracking-tight group-hover:text-[#D46A7A] transition-colors truncate">
                    {p.name}
                  </h4>
                  
                  {/* Rating Section */}
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="text-[#D46A7A] text-[0.8rem] tracking-tight">{rating.starString}</span>
                    <span className="text-[#1B1B1B]/40 font-mono text-[0.75rem]">({rating.count})</span>
                  </div>

                  <p className="font-mono text-[1rem] text-[#2F2022] font-semibold flex items-center gap-2">
                    <span>Rp {p.price.toLocaleString("id-ID")}</span>
                    {p.originalPrice && (
                      <span className="opacity-30 line-through font-normal text-[0.85rem]">
                        Rp {p.originalPrice.toLocaleString("id-ID")}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                className="mt-4 font-sans text-[0.75rem] uppercase tracking-[0.18em] bg-[#D46A7A] hover:bg-[#C55263] text-white rounded-full py-3.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full cursor-pointer font-bold shadow-md shadow-[#D46A7A]/10"
              >
                Add to Bag
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
