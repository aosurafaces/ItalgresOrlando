import { useRef } from "react";
import { motion } from "motion/react";
import { PROJECT_CARDS } from "../data";
import { ChevronLeft, ChevronRight, Compass, Shield } from "lucide-react";

export default function Projects() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 360 : scrollLeft + 360;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section id="projects" className="relative w-full bg-white py-20 md:py-28 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="flex justify-between items-end mb-16">
          <div>
            <span className="text-[#f39b34] text-[10px] tracking-[0.25em] uppercase font-semibold block mb-3">
              REALIZED SPACES
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-[#1C1A17] font-light">
              Installation Gallery
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll project list left"
              className="p-3 border border-neutral-200 hover:border-[#f39b34] text-neutral-500 hover:text-[#f39b34] transition-colors rounded-full cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll project list right"
              className="p-3 border border-neutral-200 hover:border-[#f39b34] text-neutral-500 hover:text-[#f39b34] transition-colors rounded-full cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Strip */}
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto scroll-smooth flex space-x-6 pb-8 custom-scrollbar scrollbar-hide snap-x snap-mandatory"
        >
          {PROJECT_CARDS.map((proj, idx) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="snap-start shrink-0 w-[320px] h-[420px] relative bg-[#FAF9F6] border border-neutral-150 flex flex-col justify-end p-6 overflow-hidden group rounded-sm shadow-sm"
            >
              {/* Luxury light gradient placeholder replicating stone background */}
              <div
                className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `
                    linear-gradient(to top, rgba(250,249,246,0.98) 0%, rgba(250,249,246,0.5) 65%, rgba(255,255,255,0.15) 100%),
                    radial-gradient(circle at 50% 30%, rgba(201,169,110,0.06) 0%, transparent 60%),
                    linear-gradient(${110 + idx * 20}deg, #FFFFFF 0%, #FAF9F6 100%)
                  `,
                }}
              />
              {/* Texture noise */}
              <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" />

              {/* Graphic Icon overlay */}
              <div className="absolute top-6 right-6 opacity-40 group-hover:opacity-100 transition-opacity">
                <Compass size={18} className="text-[#f39b34]" />
              </div>

              {/* Project Meta Information overlaid bottom */}
              <div className="relative z-10">
                <span className="text-[#f39b34] text-[9px] font-mono tracking-widest uppercase block mb-1.5 font-semibold">
                  {proj.type}
                </span>

                <h3 className="font-serif text-xl text-[#1C1A17] font-medium mb-1.5 group-hover:text-[#f39b34] transition-colors">
                  {proj.title}
                </h3>

                <p className="text-neutral-500 text-xs font-light mb-4">
                  {proj.location}
                </p>

                {/* Material Specification Details Block */}
                <div className="pt-3.5 border-t border-neutral-150 flex items-center space-x-2 text-[10px] font-sans tracking-wide text-neutral-600">
                  <Shield size={11} className="text-[#f39b34]" />
                  <span>Slabs: {proj.material}</span>
                </div>
              </div>

              {/* Orange vertical slide indicator */}
              <div className="absolute left-0 bottom-0 w-[2px] h-0 group-hover:h-full bg-[#f39b34] transition-all duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Swipe prompt for touch screens */}
        <p className="text-center text-[10px] font-mono tracking-widest text-neutral-400 mt-4 uppercase sm:hidden">
          ← Swipe to browse projects →
        </p>

      </div>
    </section>
  );
}
