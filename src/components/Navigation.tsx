import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight, SlidersHorizontal, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavigationProps {
  onBookClick: () => void;
  onHomeClick: () => void;
}

export default function Navigation({ onBookClick, onHomeClick }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync search input from external clear events
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{query: string}>;
      if (ce.detail?.query === "") setLocalSearch("");
    };
    window.addEventListener("nav-search-clear", handler);
    return () => window.removeEventListener("nav-search-clear", handler);
  }, []);

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    onHomeClick();
  };

  const submitSearch = (q: string) => {
    window.dispatchEvent(new CustomEvent("nav-search", { detail: { query: q } }));
  };

  const openFilter = () => {
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event("open-filter"));
  };

  return (
    <>
      <header
        id="navbar"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-[#f39b34]/10 shadow-sm py-2"
            : "bg-white/95 border-[#f39b34]/10 py-2"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center gap-4">

          {/* Brand */}
          <a
            href="#"
            onClick={handleHomeClick}
            className="flex items-center shrink-0 text-[#1C1A17] hover:text-[#f39b34] transition-colors"
          >
            <span className="font-sans font-semibold tracking-[0.18em] text-xs uppercase whitespace-nowrap">
              ITALGRES <span className="text-[#f39b34] font-light mx-1">|</span> Orlando
            </span>
          </a>

          {/* Home link */}
          <button
            onClick={handleHomeClick}
            className="hidden sm:block relative text-[11px] tracking-[0.2em] uppercase font-sans font-medium text-[#1C1A17]/60 hover:text-[#f39b34] transition-colors cursor-pointer py-1 group shrink-0"
          >
            Home
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#f39b34] transition-all duration-300 group-hover:w-full" />
          </button>

          {/* Filter button */}
          <button
            onClick={openFilter}
            className="hidden lg:flex items-center space-x-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer shrink-0 transition-all"
            style={{ background: "#f39b34", color: "#000000" }}
          >
            <SlidersHorizontal size={15} />
            <span>Filter Results</span>
          </button>

          {/* Search — grows to fill space */}
          <div className="hidden lg:flex flex-1 items-center border border-neutral-200 bg-white px-3 py-1.5 min-w-0">
            <Search size={11} className="text-[#f39b34] mr-2 shrink-0" />
            <input
              type="text"
              id="tour-nav-search"
              placeholder="Search catalog..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") submitSearch(localSearch);
              }}
              className="bg-transparent text-[11px] text-[#1C1A17] placeholder-neutral-400 focus:outline-none w-full font-sans"
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(""); submitSearch(""); }}
                className="text-neutral-400 hover:text-[#1C1A17] shrink-0 ml-1 cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            onChange={e => window.dispatchEvent(new CustomEvent("nav-sort", { detail: { sort: e.target.value } }))}
            defaultValue="default"
            className="hidden lg:block appearance-none border border-neutral-200 bg-white text-[10px] font-bold tracking-wider uppercase text-[#1C1A17]/70 px-2.5 py-1.5 focus:outline-none cursor-pointer shrink-0"
          >
            <option value="default">Sort: Default</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="category">Category</option>
          </select>

          {/* Book Consultation */}
          <button
            onClick={onBookClick}
            className="hidden sm:block px-4 py-2 bg-transparent border border-[#f39b34]/40 hover:border-[#f39b34] text-[9px] font-sans tracking-[0.18em] uppercase text-[#f39b34] hover:bg-[#f39b34] hover:text-white transition-all duration-300 cursor-pointer shrink-0"
          >
            Book Consultation
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#1C1A17] hover:text-[#f39b34] transition-colors ml-auto cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white/95 backdrop-blur-lg z-40 flex flex-col justify-center px-8 lg:hidden"
          >
            <div className="flex flex-col space-y-6 max-w-md mx-auto w-full">
              <span className="text-[#f39b34] text-[10px] tracking-[0.25em] uppercase font-semibold">
                ITALGRES ORLANDO SHOWROOM
              </span>
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={handleHomeClick}
                  className="text-left font-serif text-3xl text-[#1C1A17] hover:text-[#f39b34] transition-colors py-2 border-b border-neutral-100 flex justify-between items-center group cursor-pointer"
                >
                  <span>Home</span>
                  <ArrowRight size={18} className="text-[#f39b34]" />
                </button>

                <div className="pt-2 space-y-3">
                  {/* Mobile search */}
                  <div className="flex items-center bg-white px-3 py-2 border border-neutral-200">
                    <Search size={12} className="text-[#f39b34] mr-2" />
                    <input
                      type="text"
                      placeholder="Search catalog..."
                      value={localSearch}
                      onChange={e => setLocalSearch(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          submitSearch(localSearch);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className="bg-transparent text-xs text-[#1C1A17] placeholder-neutral-400 focus:outline-none w-full"
                    />
                  </div>

                  {/* Mobile filter */}
                  <button
                    onClick={openFilter}
                    className="w-full py-2.5 text-[11px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: "#f39b34", color: "#000000" }}
                  >
                    <SlidersHorizontal size={13} />
                    Filter Results
                  </button>
                </div>
              </nav>

              <button
                onClick={() => { setIsMobileMenuOpen(false); onBookClick(); }}
                className="mt-4 w-full py-4 bg-[#f39b34] hover:bg-[#e28b24] text-white text-center font-sans font-semibold tracking-widest uppercase text-xs transition-colors flex justify-center items-center space-x-2 cursor-pointer"
              >
                <span>Book a Consultation</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
