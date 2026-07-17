import React, { useEffect, useState } from "react";

interface CategoryThumbnailsProps {
  currentCategory: string;
  setCategory: (category: string) => void;
  setActiveTab: (tab: any) => void;
}

interface Category {
  id: string;
  label: string;
  image: string;
}

export default function CategoryThumbnails({ currentCategory, setCategory, setActiveTab }: CategoryThumbnailsProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(console.error);
  }, []);

  const handleCategoryClick = (catId: string, label: string) => {
    if (label === "Sablon DTF" || catId === "Sablon DTF") {
      setActiveTab("sablon-dtf");
    } else {
      setActiveTab("home");
      setCategory(catId);
    }
  };

  return (
    <div className="py-8 my-6 bg-transparent max-w-4xl mx-auto px-6">
      <div className="flex items-center justify-center gap-6 md:gap-10 overflow-x-auto no-scrollbar px-4">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id, cat.label)}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
            >
              {cat.id === "Promo" || cat.label.toLowerCase().includes("sale") ? (
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-sans font-black text-[0.65rem] tracking-widest uppercase transition-all duration-300 ${
                    isActive 
                      ? "bg-[#D46A7A] text-white scale-105 ring-2 ring-[#D46A7A] ring-offset-2" 
                      : "bg-[#EAA0A9] text-white hover:bg-[#D46A7A] hover:scale-105"
                  }`}
                >
                  SALE
                </div>
              ) : (
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border p-0.5 transition-all duration-300 bg-white ${
                    isActive 
                      ? "border-[#D46A7A] scale-105 ring-2 ring-[#D46A7A] ring-offset-2" 
                      : "border-black/5 hover:border-[#D46A7A]/40 hover:scale-105"
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
                className={`mt-3 font-sans text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? "text-[#D46A7A]" : "text-[#5C4649]/60 group-hover:text-[#D46A7A]"
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
