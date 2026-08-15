import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import FeaturedCollections from "./components/FeaturedCollections";
import Projects from "./components/Projects";
import BookingForm from "./components/BookingForm";
import PreSelectionDrawer from "./components/PreSelectionDrawer";
import Footer from "./components/Footer";
import TourOverlay from "./components/TourOverlay";
import { Collection, PreSelectedItem } from "./types";
import { ShoppingBag, ChevronRight, HelpCircle } from "lucide-react";

export default function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isPreSelectionOpen, setIsPreSelectionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("default");

  const [preSelectedSlabs, setPreSelectedSlabs] = useState<PreSelectedItem[]>(() => {
    try {
      const saved = localStorage.getItem("italgres_pre_selections");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("italgres_pre_selections", JSON.stringify(preSelectedSlabs));
  }, [preSelectedSlabs]);

  const handleTogglePreSelection = (col: Collection) => {
    setPreSelectedSlabs(prev => {
      const exists = prev.find(item => item.collection.id === col.id);
      if (exists) return prev.filter(item => item.collection.id !== col.id);
      return [...prev, { collection: col, quantity: 1, quantityType: "Slabs" }];
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setPreSelectedSlabs(prev =>
      prev.map(item => item.collection.id === id ? { ...item, quantity } : item)
    );
  };

  const handleUpdateQuantityType = (id: string, quantityType: 'Slabs' | 'Sq Ft' | 'Boxes') => {
    setPreSelectedSlabs(prev =>
      prev.map(item => item.collection.id === id ? { ...item, quantityType } : item)
    );
  };

  const handleRemoveItem = (id: string) => {
    setPreSelectedSlabs(prev => prev.filter(item => item.collection.id !== id));
  };

  const handleClearPreSelection = () => {
    setPreSelectedSlabs([]);
  };

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const offsetPosition = elementRect - bodyRect - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const startTour = () => {
    window.dispatchEvent(new Event("start-tour"));
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#1C1A17] font-sans antialiased overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-30 bg-noise mix-blend-overlay opacity-5" />

      {/* Tour overlay */}
      <TourOverlay />

      {/* ? Help button — fixed bottom left */}
      <button
        onClick={startTour}
        className="fixed bottom-6 left-6 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110"
        style={{ background: "#1C1A17", border: "1px solid rgba(243,155,52,0.4)" }}
        title="View tutorial"
      >
        <HelpCircle size={18} style={{ color: "#f39b34" }} />
      </button>

      <Navigation
        onBookClick={() => setIsBookingOpen(true)}
        onHomeClick={() => handleScrollToSection("collections")}
      />

      <main className="pt-[104px] sm:pt-[112px] lg:pt-16">
        <FeaturedCollections
          onBookClick={() => setIsBookingOpen(true)}
          selectedSlabIds={preSelectedSlabs.map(item => item.collection.id)}
          onTogglePreSelection={handleTogglePreSelection}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tempSearchQuery={tempSearchQuery}
          setTempSearchQuery={setTempSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
        <Projects />
      </main>

      {/* Floating Pre-Selection Button */}
      {preSelectedSlabs.length > 0 && (
        <button
          id="floating-selection-btn"
          onClick={() => setIsPreSelectionOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#f39b34] hover:bg-[#e28b24] text-[#0a0a0a] px-5 py-3.5 rounded-sm shadow-2xl flex items-center space-x-2.5 transition-transform hover:scale-105 active:scale-95 group font-sans font-bold text-xs uppercase tracking-widest cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag size={15} />
            <span className="absolute -top-2.5 -right-2.5 bg-black text-[#f39b34] font-mono text-[9px] h-4 w-4 rounded-full flex items-center justify-center border border-[#f39b34]/30 font-bold">
              {preSelectedSlabs.length}
            </span>
          </div>
          <span>PRE-SELECTED</span>
          <ChevronRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <PreSelectionDrawer
        isOpen={isPreSelectionOpen}
        onClose={() => setIsPreSelectionOpen(false)}
        items={preSelectedSlabs}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateQuantityType={handleUpdateQuantityType}
        onRemoveItem={handleRemoveItem}
        onClear={handleClearPreSelection}
      />

      <BookingForm
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <Footer
        onBookClick={() => setIsBookingOpen(true)}
        onLinkClick={handleScrollToSection}
      />
    </div>
  );
}
