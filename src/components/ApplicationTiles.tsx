import { motion } from "motion/react";
import { APPLICATION_TILES } from "../data";
import { ArrowUpRight } from "lucide-react";

interface ApplicationTilesProps {
  onTileClick: (application: string) => void;
}

export default function ApplicationTiles({ onTileClick }: ApplicationTilesProps) {
  // Define premium light luxury gradients for each architectural application area
  const lightGradients: Record<string, string> = {
    residential: "linear-gradient(to top, rgba(250,249,246,0.98) 0%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.1) 100%), linear-gradient(135deg, #FAF9F6 0%, #FFFFFF 100%)",
    commercial: "linear-gradient(to top, rgba(250,249,246,0.98) 0%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.1) 100%), linear-gradient(145deg, #F0EFEA 0%, #FFFFFF 100%)",
    hospitality: "linear-gradient(to top, rgba(250,249,246,0.98) 0%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.1) 100%), linear-gradient(125deg, #F5F3EC 0%, #FFFFFF 100%)",
    outdoor: "linear-gradient(to top, rgba(250,249,246,0.98) 0%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.1) 100%), linear-gradient(180deg, #F3ECE1 0%, #FFFFFF 100%)"
  };

  return (
    <section id="applications" className="relative w-full bg-[#FAF9F6] py-16 md:py-24 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12">
        <span className="text-[#f39b34] text-[10px] tracking-[0.25em] uppercase font-bold block mb-3">
          AREAS OF PRACTICE
        </span>
        <h2 className="font-serif text-3xl md:text-4xl text-[#1C1A17] font-light">
          Architectural Applications
        </h2>
      </div>

      {/* Grid: 2 columns x 2 rows on desktop, 1 column on mobile */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 border-t border-b border-neutral-200">
        {APPLICATION_TILES.map((tile, idx) => (
          <motion.div
            key={tile.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: idx * 0.1 }}
            onClick={() => onTileClick(tile.title)}
            className="group relative min-h-[380px] md:min-h-[440px] flex flex-col justify-end p-8 md:p-12 cursor-pointer overflow-hidden border-b md:border-r border-neutral-200 bg-white"
          >
            {/* Light Stone Texture Gradient Placeholder */}
            <div
              className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
              style={{ background: lightGradients[tile.id] || lightGradients.residential }}
            />

            {/* Subtle veining/dust overlay for realism */}
            <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-15" />

            {/* Content Container */}
            <div className="relative z-10 w-full transition-all duration-500 group-hover:translate-y-[-8px]">
              {/* Corner Accent Icon */}
              <div className="absolute top-[-80px] right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:top-auto md:bottom-2">
                <ArrowUpRight className="text-[#f39b34]" size={20} />
              </div>

              <span className="text-[#f39b34] text-[10px] tracking-widest uppercase font-mono mb-2 block font-semibold">
                {tile.tagline}
              </span>
              
              <h3 className="font-serif text-3xl text-[#1C1A17] font-light mb-4 group-hover:text-[#f39b34] transition-colors">
                {tile.title}
              </h3>

              <p className="text-neutral-600 text-xs md:text-sm font-light max-w-md leading-relaxed opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-[100px] transition-all duration-500">
                {tile.description}
              </p>
            </div>

            {/* Orange bottom border reveal on hover */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#f39b34] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
