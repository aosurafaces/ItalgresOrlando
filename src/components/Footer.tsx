import React from "react";
import { Globe, Mail, MapPin, ExternalLink } from "lucide-react";

interface FooterProps {
  onBookClick: () => void;
  onLinkClick: (id: string) => void;
}

export default function Footer({ onBookClick, onLinkClick }: FooterProps) {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[#FAF9F6] pt-10 sm:pt-16 pb-8 sm:pb-12 border-t border-t-[#f39b34]/30">
      
      {/* Footer Top Column grids */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-12 pb-8 sm:pb-16">
        
        {/* Col 1: Brand Wordmark (4 cols) */}
        <div className="col-span-2 lg:col-span-4 flex flex-col space-y-3 sm:space-y-4">
          <a
            href="#"
            onClick={handleLogoClick}
            className="font-sans font-semibold tracking-[0.18em] text-sm uppercase text-[#1C1A17] hover:text-[#f39b34] transition-colors self-start"
          >
            ITALGRES <span className="text-[#f39b34] font-light">|</span> Orlando
          </a>
          <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-sm">
            Miami proven, Orlando ready. Curators of large-format European porcelain slabs and premium architectural tiles for luxury estates and commercial environments.
          </p>
          <div className="flex flex-col space-y-2 pt-2">
            <span className="text-[11px] text-neutral-500 font-mono flex items-center space-x-2">
              <MapPin size={12} className="text-[#f39b34]" />
              <span>4,000 sq ft Showroom · Orlando, FL</span>
            </span>
          </div>
        </div>

        {/* Col 2: Collections Links (2 cols) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col space-y-3 sm:space-y-4">
          <h4 className="font-sans font-semibold text-[10px] tracking-widest text-[#f39b34] uppercase">
            Collections
          </h4>
          <ul className="flex flex-col space-y-2.5 text-xs text-neutral-600">
            {["Marble Look", "Stone Look", "Wood Look", "Concrete Look", "Metal Look"].map((col) => (
              <li key={col}>
                <button
                  onClick={() => onLinkClick("collections")}
                  className="hover:text-[#f39b34] transition-colors cursor-pointer text-left"
                >
                  {col}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Company Links (2 cols) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col space-y-3 sm:space-y-4">
          <h4 className="font-sans font-semibold text-[10px] tracking-widest text-[#f39b34] uppercase">
            Company
          </h4>
          <ul className="flex flex-col space-y-2.5 text-xs text-neutral-600">
            {[
              { label: "Soren AI Search", id: "soren-ai" },
              { label: "Featured Collections", id: "collections" },
              { label: "Application Areas", id: "applications" },
              { label: "Realized Projects", id: "projects" }
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onLinkClick(item.id)}
                  className="hover:text-[#f39b34] transition-colors cursor-pointer text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Contact & Consultations (4 cols) */}
        <div className="col-span-2 lg:col-span-4 flex flex-col space-y-3 sm:space-y-4">
          <h4 className="font-sans font-semibold text-[10px] tracking-widest text-[#f39b34] uppercase">
            Consultations
          </h4>
          <p className="text-xs text-neutral-500 font-light leading-relaxed">
            Connect with Carlos for a private materials viewing. Register a timeslot online or email Carlos directly.
          </p>

          <button
            onClick={onBookClick}
            className="w-full sm:w-auto py-3 bg-transparent border border-[#f39b34] hover:bg-[#f39b34] hover:text-white text-[#f39b34] text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 cursor-pointer text-center rounded-sm"
          >
            Book showroom viewing
          </button>

          <div className="flex flex-col space-y-2 pt-2 text-[11px] text-neutral-600 font-mono">
            <span className="flex items-center space-x-2">
              <Mail size={12} className="text-[#f39b34]" />
              <a href="mailto:orlando@italgres.com" className="hover:text-[#f39b34] transition-colors">
                orlando@italgres.com
              </a>
            </span>
            <span className="flex items-center space-x-2">
              <Globe size={12} className="text-[#f39b34]" />
              <div className="flex flex-wrap gap-2 text-neutral-400">
                <a href="https://italgres-orlando.com" target="_blank" rel="noreferrer" className="hover:text-[#f39b34] flex items-center space-x-1 transition-colors">
                  <span>italgres-orlando.com</span>
                  <ExternalLink size={8} />
                </a>
                <span>·</span>
                <a href="https://aosurfaces.com" target="_blank" rel="noreferrer" className="hover:text-[#f39b34] flex items-center space-x-1 transition-colors">
                  <span>aosurfaces.com</span>
                  <ExternalLink size={8} />
                </a>
              </div>
            </span>
          </div>
        </div>

      </div>

      {/* Footer Bottom copyright row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-6 sm:pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-mono tracking-wide text-neutral-400 text-center md:text-left">
        <span>© 2025 Italgres Orlando · Operated by AOSurfaces Group LLC</span>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-[#f39b34] transition-colors">Privacy Terms</a>
          <span>·</span>
          <a href="#" className="hover:text-[#f39b34] transition-colors">Bespoke Design Portal</a>
        </div>
      </div>

    </footer>
  );
}
