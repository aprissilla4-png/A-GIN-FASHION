import React from "react";

interface HomeMediaShowcaseProps {
  onShopSale: () => void;
  onExploreNewIn: () => void;
}

export default function HomeMediaShowcase({ onShopSale, onExploreNewIn }: HomeMediaShowcaseProps) {
  return (
    <section className="my-16 md:my-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        
        {/* Card 1: Spring Sale */}
        <div 
          className="rounded-[2rem] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group min-h-[350px] transition-all duration-300 hover:shadow-lg"
          style={{ backgroundColor: "#F3EEE3" }}
        >
          {/* Content Block */}
          <div className="space-y-6 max-w-[60%] z-10">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#111111]/40 block font-semibold">
              LIMITED TIME OFFER
            </span>
            <h3 className="font-serif text-[1.8rem] sm:text-[2.2rem] md:text-[2.6rem] leading-tight font-light text-[#111111] tracking-tight">
              Spring Sale <br />
              <span className="italic">Up to 50% Off</span>
            </h3>
            
            <button 
              onClick={onShopSale}
              className="bg-[#111111] text-[#F8F7F4] font-mono text-[0.65rem] uppercase tracking-[0.15em] font-bold px-6 py-3 rounded-full hover:bg-[#111111]/80 transition-all cursor-pointer"
            >
              Shop The Sale →
            </button>
          </div>
          
          {/* Image Block Floating Right */}
          <div className="absolute right-0 bottom-0 top-0 w-[42%] overflow-hidden rounded-l-[1.5rem]">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600" 
              alt="Spring Collection Model" 
              className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
            />
          </div>
        </div>

        {/* Card 2: Fresh Styles */}
        <div 
          className="rounded-[2rem] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group min-h-[350px] transition-all duration-300 hover:shadow-lg"
          style={{ backgroundColor: "#EBE6DC" }}
        >
          {/* Content Block */}
          <div className="space-y-6 max-w-[60%] z-10">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#111111]/40 block font-semibold">
              NEW ARRIVALS
            </span>
            <h3 className="font-serif text-[1.8rem] sm:text-[2.2rem] md:text-[2.6rem] leading-tight font-light text-[#111111] tracking-tight">
              Fresh Styles <br />
              <span className="italic font-light">Just Landed</span>
            </h3>
            
            <button 
              onClick={onExploreNewIn}
              className="bg-[#111111] text-[#F8F7F4] font-mono text-[0.65rem] uppercase tracking-[0.15em] font-bold px-6 py-3 rounded-full hover:bg-[#111111]/80 transition-all cursor-pointer"
            >
              Explore New In →
            </button>
          </div>
          
          {/* Image Block Floating Right */}
          <div className="absolute right-0 bottom-0 top-0 w-[42%] overflow-hidden rounded-l-[1.5rem]">
            <img 
              src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=600" 
              alt="Fresh Arrivals Rack" 
              className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
