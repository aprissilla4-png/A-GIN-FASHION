import React, { useEffect, useState } from "react";

interface CategoryThumbnailsProps {
  currentCategory: string;
  setCategory: (category: string) => void;
}

interface Category {
  id: string;
  label: string;
  image: string;
}

export default function CategoryThumbnails({ currentCategory, setCategory }: CategoryThumbnailsProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="py-12 border-b border-[#1B1B1B]/10 max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-6 md:gap-10 overflow-x-auto no-scrollbar px-4">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
            >
              {cat.id === "Promo" || cat.label.toLowerCase().includes("sale") ? (
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-mono font-semibold text-[0.65rem] tracking-widest uppercase transition-all duration-300 ${
                    isActive 
                      ? "bg-[#A68966] text-white scale-105 ring-2 ring-[#A68966] ring-offset-2" 
                      : "bg-black text-white hover:bg-black/90 hover:scale-105"
                  }`}
                >
                  SALE
                </div>
              ) : (
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border p-0.5 transition-all duration-300 bg-white ${
                    isActive 
                      ? "border-[#A68966] scale-105 ring-2 ring-[#A68966] ring-offset-2" 
                      : "border-black/10 hover:border-black/30 hover:scale-105"
                  }`}
                >
                  <img
                    src={cat.image || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=200&h=200"}
                    alt={cat.label}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}
              <span 
                className={`mt-3 font-mono text-[0.65rem] uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? "text-[#A68966] font-semibold" : "text-[#1B1B1B]/60 group-hover:text-[#1B1B1B]"
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
