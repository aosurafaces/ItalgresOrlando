import React from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";

interface HeroProps {
  onExploreClick: () => void;
  onSorenClick: () => void;
}

export default function Hero({ onExploreClick, onSorenClick }: HeroProps) {
  
  const handleSlabClick = (id: string) => {
    // Fire custom view-collection event to FeaturedCollections component
    const event = new CustomEvent("view-collection", {
      detail: { id }
    });
    window.dispatchEvent(event);
  };

  const heroSlabs = [
    {
      id: "nero-marquina",
      name: "Nero Marquina",
      category: "MARBLE LOOK",
      finish: "POLISHED",
      format: "160×120",
      gradient: "linear-gradient(145deg, #090909 0%, #141414 45%, #5a5a5a 46%, #121212 48%, #0f0f0f 100%)"
    },
    {
      id: "calacatta-gold",
      name: "Calacatta Gold",
      category: "MARBLE LOOK",
      finish: "POLISHED",
      format: "160×280",
      gradient: "linear-gradient(135deg, #161616 0%, #1e1d1a 40%, #2e261b 45%, #1d1d1d 50%, #181818 100%)"
    },
    {
      id: "travertine",
      name: "Travertine",
      category: "STONE LOOK",
      finish: "NATURAL",
      format: "120×280",
      gradient: "linear-gradient(180deg, #1c1a17 0%, #29241e 30%, #201d19 60%, #1c1a17 100%)"
    },
    {
      id: "distrito-iron",
      name: "Distrito Iron",
      category: "CONCRETE LOOK",
      finish: "MATTE",
      format: "48×102",
      gradient: "linear-gradient(135deg, #151312 0%, #261f1b 45%, #3c2a1e 55%, #1c1816 70%, #151312 100%)"
    }
  ];

  return (
    <section className="relative min-h-screen bg-[#FAF9F6] overflow-hidden flex items-stretch pt-28 lg:pt-20">
      
      {/* Editorial subtle stone background glow */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <div 
          className="w-full h-full animate-pulse" 
          style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(201,169,110,0.1) 0%, transparent 65%)`,
            animationDuration: "8s"
          }}
        />
        <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full relative z-10 py-10">
        
        {/* Left Column: Typography & Corporate Identity */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full py-2">
          
          <div className="space-y-6 md:space-y-8">
            {/* Header Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center space-x-3"
            >
              <span className="text-[#f39b34] text-[9px] md:text-[10px] font-sans font-bold tracking-[0.25em] uppercase">
                ITALGRES ORLANDO · LARGE-FORMAT PORCELAIN
              </span>
            </motion.div>

            {/* Main Editorial Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="font-serif text-4xl sm:text-5xl xl:text-6xl text-[#1C1A17] font-light leading-[1.15] tracking-tight"
            >
              Where material <br />
              meets <span className="italic font-serif text-[#f39b34]">intention.</span>
            </motion.h1>

            {/* Editorial Description Paragraph */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.35 }}
              className="text-[#1C1A17]/70 text-xs sm:text-sm font-light leading-relaxed max-w-sm tracking-wide"
            >
              European large-format porcelain for residential, commercial, and hospitality projects throughout Central Florida.
            </motion.p>

            {/* CTA Outline Glass Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <button
                onClick={onExploreClick}
                className="px-6 py-3 border border-[#f39b34]/40 bg-white hover:bg-[#f39b34] text-[#f39b34] hover:text-white text-[10px] sm:text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 rounded-sm cursor-pointer shadow-md"
              >
                EXPLORE COLLECTIONS
              </button>
              
              <button
                onClick={onSorenClick}
                className="px-6 py-3 border border-[#f39b34]/40 bg-white hover:bg-[#f39b34] text-[#f39b34] hover:text-white text-[10px] sm:text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 rounded-sm cursor-pointer flex items-center space-x-1.5 shadow-md"
              >
                <Sparkles size={11} className="mr-1 shrink-0" />
                <span>MEET SOREN</span>
              </button>
            </motion.div>

            {/* Luxury Design Concierge Card Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative p-5 bg-white border border-[#f39b34]/25 hover:border-[#f39b34]/50 backdrop-blur-md max-w-sm flex items-center space-x-5 transition-all duration-300 rounded-sm shadow-xl group"
            >
              {/* Compass Vector drawing inside a fine circle */}
              <div className="shrink-0 flex items-center justify-center bg-[#FAF9F6] p-2.5 rounded-full border border-[#f39b34]/20">
                <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#f39b34]">
                  <path d="M22 8L15 32M22 8L29 32" stroke="#f39b34" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="22" cy="8" r="1" fill="#0a0a0a" stroke="#f39b34" strokeWidth="1" />
                  <path d="M17 24C19.5 25.5 24.5 25.5 27 24" stroke="#f39b34" strokeWidth="0.7" strokeLinecap="round" />
                  <line x1="15" y1="32" x2="15" y2="34" stroke="#f39b34" strokeWidth="0.7" />
                  <line x1="29" y1="32" x2="29" y2="34" stroke="#f39b34" strokeWidth="0.7" />
                </svg>
              </div>

              <div className="flex-grow">
                <span className="text-[9px] font-mono tracking-widest text-[#f39b34] uppercase block font-semibold">
                  DESIGN CONCIERGE -
                </span>
                <h4 className="font-serif text-base text-[#1C1A17] font-light leading-snug">
                  Curated for your vision.
                </h4>
                <button
                  onClick={onSorenClick}
                  className="text-[9px] font-mono text-[#f39b34] tracking-widest uppercase hover:text-[#1C1A17] transition-colors mt-2 flex items-center space-x-1 cursor-pointer"
                >
                  <span>LEARN MORE</span>
                  <ArrowRight size={8} className="transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Bottom Corporate Tagline Signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-[#1C1A17]/40 text-[9px] font-mono tracking-[0.25em] uppercase mt-12 block pt-2"
          >
            AD SURFACES GROUP LLC · ORLANDO, FL
          </motion.div>
        </div>

        {/* Right Column: 2x2 Showroom Standing Slab Grid (Flow Layout) */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4 lg:gap-6 w-full py-4 relative z-10 self-center">
          {heroSlabs.map((slab, idx) => {
            return (
              <motion.div
                key={slab.id}
                initial={{ opacity: 0, scale: 0.96, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.15 + 0.3 }}
                onClick={() => handleSlabClick(slab.id)}
                className="group relative cursor-pointer flex flex-col justify-end overflow-hidden"
                style={{ contentVisibility: "auto" }}
              >
                
                {/* Physical freestanding 3D slab container */}
                <div className="relative aspect-[3/4] sm:aspect-[4/5] xl:aspect-[1.1] w-full transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(201,169,110,0.12)] border-b-4 border-black/80 bg-[#0d0d0d] overflow-hidden">
                  
                  {/* Standing gold profile frame extrusion trim (mimicking screenshot design) */}
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-[#f39b34] z-20 shadow-md group-hover:bg-amber-300 transition-colors" />
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-[#f39b34]/70 z-20" />
                  <div className="absolute inset-y-0 right-0 w-[1px] bg-[#f39b34]/30 z-20" />

                  {/* High fidelity procedural background slab gradient representation */}
                  <div
                    className="w-full h-full transition-transform duration-700 scale-102 group-hover:scale-105"
                    style={{ background: slab.gradient }}
                  />

                  {/* Surface grain & reflection layers for stunning material fidelity */}
                  <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay pointer-events-none" />
                  
                  {/* Subtle gallery spot lighting shadow reflection overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                  {/* Fine border outlining the inside card */}
                  <div className="absolute inset-0 border border-white/5 pointer-events-none" />

                  {/* Upright glass-card bottom details overlay panel matching screenshot */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-[#f39b34]/20 p-3 transform transition-all duration-300 group-hover:border-[#f39b34]/40 shadow-lg">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-serif text-sm sm:text-base text-[#1C1A17] font-light tracking-wide group-hover:text-[#f39b34] transition-colors">
                        {slab.name}
                      </h3>
                      <span className="text-[8px] text-[#f39b34] font-mono tracking-wider font-semibold">
                        DETAIL
                      </span>
                    </div>
                    <div className="text-[8.5px] font-mono text-[#1C1A17]/60 tracking-widest uppercase flex flex-wrap gap-x-1.5 gap-y-0.5">
                      <span>{slab.category}</span>
                      <span className="text-[#f39b34]/40">·</span>
                      <span>{slab.finish}</span>
                      <span className="text-[#f39b34]/40">·</span>
                      <span>{slab.format}</span>
                    </div>
                  </div>

                </div>

                {/* Showroom floor shadow reflection simulation under standing slab */}
                <div className="h-2 w-full bg-gradient-to-b from-black/30 to-transparent blur-[2px] mt-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />

              </motion.div>
            );
          })}
        </div>

      </div>

    </section>
  );
}
