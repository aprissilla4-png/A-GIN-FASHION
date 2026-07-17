import React, { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="my-24 max-w-[1400px] mx-auto">
      <div 
        className="rounded-[2.5rem] overflow-hidden grid grid-cols-1 md:grid-cols-[1.1fr_1.8fr] items-center min-h-[380px] p-6 sm:p-12 md:p-0 gap-8 md:gap-16 bg-white/90 backdrop-blur-md border border-white/25 shadow-2xl"
      >
        {/* Left column: Beautiful Fashion Portrait */}
        <div className="h-full min-h-[250px] max-h-[400px] hidden md:block overflow-hidden rounded-r-[2.5rem]">
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800" 
            alt="Fashion model look" 
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Right column: Form Content */}
        <div className="space-y-6 md:pr-16 max-w-xl">
          <div className="space-y-2">
            <span className="font-sans text-[0.6rem] md:text-[0.65rem] uppercase tracking-[0.25em] text-[#D46A7A] font-black block">
              GET 10% OFF YOUR FIRST ORDER
            </span>
            <h3 className="font-serif text-[2.2rem] md:text-[3rem] font-light text-[#2F2022] leading-none tracking-tight">
              Join Our Style List
            </h3>
            <p className="font-sans text-[0.85rem] md:text-[0.95rem] text-[#1B1B1B]/60 font-light leading-relaxed">
              Sign up for exclusive offers, new arrivals, and style inspiration.
            </p>
          </div>

          {subscribed ? (
            <div className="bg-[#D46A7A] text-[#FAF1EE] font-sans text-[0.75rem] font-bold uppercase tracking-widest px-6 py-4 rounded-full text-center animate-fade-in shadow-md">
              ✨ Thank you for subscribing! Check your inbox soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white border border-[#EAA0A9]/30 rounded-full px-6 py-4 text-[0.85rem] font-sans focus:outline-none focus:border-[#D46A7A] text-[#2F2022] placeholder:text-[#5C4649]/40"
              />
              <button 
                type="submit"
                className="bg-[#D46A7A] text-white font-sans text-[0.7rem] uppercase tracking-[0.2em] font-bold px-8 py-4 rounded-full hover:bg-[#C55263] transition-all cursor-pointer whitespace-nowrap shadow-md shadow-[#D46A7A]/15"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
