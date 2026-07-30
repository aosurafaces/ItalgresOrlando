import { motion } from "motion/react";
import { ArrowRight, Sparkles, Trophy, MapPin } from "lucide-react";

interface StudioProps {
  onBookClick: () => void;
}

export default function Studio({ onBookClick }: StudioProps) {
  return (
    <section id="studio" className="relative w-full bg-white py-20 md:py-28 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left: Large Editorial Photo Placeholder with veined stone columns aesthetic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-6 relative h-[360px] md:h-[480px] bg-[#FAF9F6] border border-neutral-200 overflow-hidden group flex flex-col justify-end p-8 rounded-sm shadow-sm"
        >
          {/* Custom Luxury Showroom backdrop via CSS */}
          <div
            className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-102"
            style={{
              backgroundImage: `
                linear-gradient(to top, rgba(250,249,246,0.98) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.1) 100%),
                linear-gradient(30deg, #FFFFFF 0%, #FAF9F6 100%)
              `,
            }}
          />
          {/* Grid architecture lines representing porcelain displays */}
          <div className="absolute inset-y-0 left-1/3 w-[1px] bg-neutral-200/20" />
          <div className="absolute inset-y-0 left-2/3 w-[1px] bg-neutral-200/20" />
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-200/20" />

          {/* Texture noise */}
          <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" />

          {/* Label Card overlay */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md p-6 border border-neutral-200 max-w-sm rounded-xs shadow-sm">
            <span className="text-[#f39b34] text-[9px] font-mono tracking-widest uppercase block mb-1.5 font-semibold">
              THE ITALGRES STANDARDS
            </span>
            <p className="text-xs text-neutral-600 font-light leading-relaxed">
              Our 4,000 sq ft boutique Orlando studio showcases architectural slabs on full-scale floor maps and cantilever steel frames.
            </p>
          </div>
        </motion.div>

        {/* Right: Studio Editorial Content */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <span className="text-[#f39b34] text-[10px] tracking-[0.25em] uppercase font-bold block mb-3">
            THE STUDIO
          </span>
          
          <h2 className="font-serif text-3xl md:text-5xl text-[#1C1A17] font-light leading-tight mb-6">
            Miami proven. <br />
            <span className="italic font-normal text-[#f39b34]">Orlando ready.</span>
          </h2>

          <p className="text-sm md:text-base text-neutral-600 font-light leading-relaxed mb-8 tracking-wide">
            Italgres brings 30 years of expertise in large-format European porcelain surfaces to Central Florida. As an authorized boutique franchise showroom, Italgres Orlando offers access to premier Italian and Spanish collections with the hyper-focused personal attention of an executive design consultancy.
          </p>

          {/* Stat highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 pb-8 border-b border-neutral-150">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-[#FAF9F6] border border-neutral-200 rounded text-[#f39b34]">
                <Trophy size={16} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-xs tracking-wider text-[#1C1A17] uppercase mb-1">
                  30+ Years Heritage
                </h4>
                <p className="text-xs text-neutral-500 font-light">
                  Direct connections to Italian and Spanish manufacturers.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-[#FAF9F6] border border-neutral-200 rounded text-[#f39b34]">
                <MapPin size={16} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-xs tracking-wider text-[#1C1A17] uppercase mb-1">
                  Boutique Experience
                </h4>
                <p className="text-xs text-neutral-500 font-light">
                  Private viewing sessions hosted by Showroom Director, Carlos.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBookClick}
            className="text-xs tracking-widest uppercase font-sans font-semibold text-[#f39b34] hover:text-neutral-800 flex items-center space-x-2 transition-colors cursor-pointer group self-start"
          >
            <span>Book a Consultation</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
}
