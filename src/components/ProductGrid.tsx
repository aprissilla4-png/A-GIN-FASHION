import React, { useState } from "react";
import { Product } from "../types";
import { Heart } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  categoryFilter: string;
  searchQuery: string;
  onAddToCart: (product: Product) => void;
  onViewDetail: (product: Product) => void;
  onResetFilters?: () => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
}

export default function ProductGrid({
  products,
  categoryFilter,
  searchQuery,
  onAddToCart,
  onViewDetail,
  onResetFilters,
  wishlist,
  onToggleWishlist
}: ProductGridProps) {
  const [sortOption, setSortOption] = useState<'default' | 'price-asc' | 'price-desc' | 'newest'>('default');

  // Filter products based on category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      categoryFilter === "all" ||
      p.category === categoryFilter ||
      (categoryFilter === "Promo" && (p.isPromo === true || p.category === "Promo"));
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Feature: Simple Visibility
    // Only show standard products (exclude flash sale, DTF, and banner collection products)
    const isFashion = p.productType === "fashion" || !p.productType;
    return matchesCategory && !p.isFlashSale && isFashion && !p.isBannerProduct; 
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
      default: return 0;
    }
  });

  const getCategoryTitle = () => {
    switch (categoryFilter) {
      case "all": return "Our Most Loved Picks";
      case "Batik": return "Koleksi Batik Modern";
      case "Streetwear": return "Streetwear";
      case "Outerwear": return "Outerwear";
      case "Bottoms": return "Celana & Bottoms";
      case "Women": return "Gaun Wanita";
      case "Promo": return "Promo Spesial";
      default: return "Produk Rekomendasi";
    }
  };

  // Generate deterministic stars/reviews based on product ID/name length
  const getRating = (name: string) => {
    const score = 4.0 + ((name.length % 10) / 10);
    const count = 30 + (name.charCodeAt(0) % 150);
    const starString = "★".repeat(Math.round(score)) + "☆".repeat(5 - Math.round(score));
    return { score: score.toFixed(1), count, starString };
  };

  return (
    <section id="catalog-section" className="mb-24 scroll-mt-28">
      {/* Header section to match the image exactly */}
      <div className="flex flex-col md:flex-row justify-between md:items-end border-t border-[#1B1B1B]/10 pt-16 pb-12 mt-16 gap-4">
        <div>
          <p className="font-mono text-[0.8rem] uppercase tracking-[0.2em] text-[#A68966] font-semibold mb-2">
            BEST SELLERS
          </p>
          <h3 className="font-serif text-[2.2rem] md:text-[3.2rem] font-light text-[#111111] leading-none">
            {getCategoryTitle()}
          </h3>
        </div>
        <button 
          onClick={onResetFilters}
          className="font-mono text-[0.8rem] uppercase tracking-[0.15em] text-[#1B1B1B]/60 hover:text-[#A68966] transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
        >
          View All Products →
        </button>
        <select 
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as any)}
          className="font-mono text-[0.8rem] uppercase tracking-[0.15em] bg-transparent text-[#1B1B1B]/60 border border-[#1B1B1B]/10 rounded-full px-4 py-2 cursor-pointer focus:outline-none hover:text-[#A68966] hover:border-[#A68966] transition-colors"
        >
          <option value="default">Sort By</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      
      {sortedProducts.length === 0 && (
        <div className="py-24 text-center font-mono text-[0.8rem] uppercase tracking-widest text-[#1B1B1B]/60">
          Archive Empty.
        </div>
      )}

      {/* Grid structure matching the image perfectly */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
        {sortedProducts.map((p) => {
          const rating = getRating(p.name);
          const isWishlisted = !!wishlist.find(w => w.id === p.id);
          
          return (
            <div 
              key={p.id} 
              className="group cursor-pointer flex flex-col justify-between bg-transparent transition-all duration-300 hover:-translate-y-1" 
              onClick={() => onViewDetail(p)}
            >
              <div className="space-y-4">
                {/* Image Wrapper */}
                <div className="w-full aspect-[3/4] overflow-hidden bg-transparent relative">
                  <img 
                    src={p.image} 
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105" 
                  />
                  
                  {/* Floating Heart Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleWishlist(p); }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center border border-black/5 hover:scale-110 active:scale-95 transition-all shadow-sm z-10 cursor-pointer"
                  >
                    <Heart 
                      className={`w-4.5 h-4.5 transition-colors ${
                        isWishlisted 
                          ? "fill-red-500 text-red-500" 
                          : "text-[#111111]/70 hover:text-[#111111]"
                      }`} 
                    />
                  </button>

                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-[#FAF7F2] px-4 py-2 text-[#111111] font-mono text-[0.65rem] uppercase tracking-widest font-bold rounded-full">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Block */}
                <div className="space-y-1">
                  <h4 className="font-sans text-[1.05rem] text-[#2F2022] font-normal leading-tight tracking-tight group-hover:text-[#D46A7A] transition-colors truncate">
                    {p.name}
                  </h4>
                  
                  {/* Rating Section from image */}
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="text-[#D46A7A] text-[0.8rem] tracking-tight">{rating.starString}</span>
                    <span className="text-[#1B1B1B]/40 font-mono text-[0.75rem]">({rating.count})</span>
                  </div>

                  <p className="font-mono text-[1rem] text-[#2F2022] font-semibold">
                    Rp {p.price.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Elegant Button */}
              <button 
                disabled={p.stock === 0}
                onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                className="mt-4 font-sans text-[0.75rem] uppercase tracking-[0.18em] bg-[#D46A7A] hover:bg-[#C55263] text-white rounded-full py-3.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 w-full cursor-pointer font-bold shadow-md shadow-[#D46A7A]/10"
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
