import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COLLECTIONS as fallbackCollections } from "../data";
import { Collection } from "../types";
import { X, Compass, Sparkles, SlidersHorizontal, Search, Check, RefreshCw } from "lucide-react";

interface FeaturedCollectionsProps {
  onBookClick: () => void;
  selectedSlabIds: string[];
  onTogglePreSelection: (col: Collection) => void;
  
  // Shared search/filter state from top bar
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  tempSearchQuery: string;
  setTempSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<string>>;
  aiFilterQuery?: string;
  onApplyAiFilter?: (q: string) => void;
}

export default function FeaturedCollections({
  onBookClick,
  selectedSlabIds = [],
  onTogglePreSelection,
  searchQuery,
  setSearchQuery,
  tempSearchQuery,
  setTempSearchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
  sortOption,
  setSortOption,
  aiFilterQuery,
  onApplyAiFilter
}: FeaturedCollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [activePhoto, setActivePhoto] = useState<string>("");

  // Reset activePhoto when a new collection is selected
  useEffect(() => {
    if (selectedCollection) {
      setActivePhoto(selectedCollection.productPhotoUrl || selectedCollection.thumbnailUrl || "");
    }
  }, [selectedCollection]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    let active = true;
    fetch("/api/collections")
      .then((res) => {
        if (!res.ok) throw new Error("Catalog fetch failed");
        return res.json();
      })
      .then((data) => {
        if (active) {
          setCollections(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Catalog fetch failed, using fallback static data:", err);
        if (active) {
          setCollections(fallbackCollections);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  
  // Search & Filter Transition States
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchStatus, setAiSearchStatus] = useState("");

  const [selectedFinishAndFeels, setSelectedFinishAndFeels] = useState<string[]>([]);
  const [selectedColorGroups, setSelectedColorGroups] = useState<string[]>([]);
  const [selectedSizeFormats, setSelectedSizeFormats] = useState<string[]>([]);
  const [selectedVisualLooks, setSelectedVisualLooks] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    application: true,
    finishAndFeel: false,
    colorGroup: true,
    sizeFormat: false,
    visualLook: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Listen for custom trigger to view a collection (e.g., from AI search chatbot)
  useEffect(() => {
    const handleViewCollection = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail && customEvent.detail.id) {
        const col = collections.find(c => c.id === customEvent.detail.id);
        if (col) {
          setSelectedCollection(col);
          const element = document.getElementById("collections");
          if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }
      }
    };
    window.addEventListener("view-collection", handleViewCollection);
    return () => window.removeEventListener("view-collection", handleViewCollection);
  }, [collections]);

  // Listen for general prompt queries
  useEffect(() => {
    const handleAskSorenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail && customEvent.detail.query) {
        handleQuickSearch(customEvent.detail.query);
      }
    };
    window.addEventListener("ask-soren", handleAskSorenEvent);
    return () => window.removeEventListener("ask-soren", handleAskSorenEvent);
  }, []);

  // Toggle helpers
  const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(item => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setTempSearchQuery("");
    setSelectedFinishAndFeels([]);
    setSelectedColorGroups([]);
    setSelectedSizeFormats([]);
    setSelectedVisualLooks([]);
    setSelectedApplications([]);
  };

  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, selectedFinishAndFeels, selectedColorGroups, selectedSizeFormats, selectedVisualLooks, selectedApplications]);

  // Filter open/close events
  useEffect(() => {
    const openHandler = () => setIsFilterOpen(true);
    const closeHandler = () => setIsFilterOpen(false);
    window.addEventListener("open-filter", openHandler);
    window.addEventListener("close-filter", closeHandler);
    return () => {
      window.removeEventListener("open-filter", openHandler);
      window.removeEventListener("close-filter", closeHandler);
    };
  }, []);

  // Close modal event from tour
  useEffect(() => {
    const handler = () => setSelectedCollection(null);
    window.addEventListener("close-modal", handler);
    return () => window.removeEventListener("close-modal", handler);
  }, []);

  // Listen for search from nav bar
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{query: string}>;
      setSearchQuery(ce.detail.query);
      setTempSearchQuery(ce.detail.query);
    };
    window.addEventListener("nav-search", handler);
    return () => window.removeEventListener("nav-search", handler);
  }, []);

  // Listen for sort from nav bar
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{sort: string}>;
      setSortOption(ce.detail.sort);
    };
    window.addEventListener("nav-sort", handler);
    return () => window.removeEventListener("nav-sort", handler);
  }, []);

  // Listen to external searchQuery updates to trigger visual search scan feedback
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsAiSearching(true);
      setAiSearchStatus("Scanning lot catalog database...");
      const timer1 = setTimeout(() => {
        setAiSearchStatus("Filtering material specifications...");
        const timer2 = setTimeout(() => {
          setIsAiSearching(false);
        }, 300);
        return () => clearTimeout(timer2);
      }, 300);
      return () => clearTimeout(timer1);
    } else {
      setIsAiSearching(false);
    }
  }, [searchQuery]);

  // Search submission helper
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(tempSearchQuery);
  };

  // Quick pre-selected search handles
  const handleQuickSearch = (query: string) => {
    setTempSearchQuery(query);
    setSearchQuery(query);
  };

  // Filter collections based on selections
  const filteredCollections = collections.filter(col => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      const fFeel = getFinishAndFeel(col).toLowerCase();
      const finish = col.finish.toLowerCase();
      const cGroup = getColorGroup(col).toLowerCase();
      const sFormat = (col.sizeAndFormat || "Porcelain Slabs & Panels").toLowerCase();
      const thick = (col.thickness || getThickness(col)).toLowerCase();
      const vLook = getVisualLook(col).toLowerCase();
      const mStyle = getMaterialStyle(col).toLowerCase();
      const apps = col.applications.map(a => a.toLowerCase());
      const formats = col.formats.map(f => f.replace("×", "x").toLowerCase());
      const name = col.name.toLowerCase();
      const category = col.category.toLowerCase();
      const origin = col.origin.toLowerCase();
      
      const matchesName = name.includes(query);
      const matchesFinishAndFeel = fFeel.includes(query);
      const matchesFinish = finish.includes(query);
      const matchesColorGroup = cGroup.includes(query);
      const matchesSizeAndFormat = sFormat.includes(query);
      const matchesThickness = thick.includes(query);
      const matchesVisualLook = vLook.includes(query);
      const matchesMaterialStyle = mStyle.includes(query);
      const matchesApplication = apps.some(a => a.includes(query));
      const matchesSlabFormat = formats.some(f => f.includes(query)) || name.includes(query);
      const matchesCategory = category.includes(query);
      const matchesOrigin = origin.includes(query);

      if (!matchesName && 
          !matchesFinishAndFeel && 
          !matchesFinish && 
          !matchesColorGroup && 
          !matchesSizeAndFormat && 
          !matchesThickness && 
          !matchesVisualLook && 
          !matchesMaterialStyle && 
          !matchesApplication && 
          !matchesSlabFormat &&
          !matchesCategory &&
          !matchesOrigin) {
        return false;
      }
    }

    // 2. Finish & Feel — OR within category
    if (selectedFinishAndFeels.length > 0) {
      const val = getFinishAndFeel(col).toLowerCase();
      const matches = selectedFinishAndFeels.some(s => 
        val.includes(s.toLowerCase()) || s.toLowerCase().includes(val)
      );
      if (!matches) return false;
    }

    // 4. Color Group — OR within category
    if (selectedColorGroups.length > 0) {
      const val = getColorGroup(col).toLowerCase();
      const matches = selectedColorGroups.some(s => 
        val.includes(s.toLowerCase()) || s.toLowerCase().includes(val)
      );
      if (!matches) return false;
    }

    // 5. Size & Format
    if (selectedSizeFormats.length > 0) {
      const val = col.sizeAndFormat || "Porcelain Slabs & Panels";
      if (!selectedSizeFormats.includes(val)) return false;
    }

    // 7. Visual Look — OR within category
    if (selectedVisualLooks.length > 0) {
      const val = getVisualLook(col).toLowerCase();
      const matches = selectedVisualLooks.some(s => 
        val.includes(s.toLowerCase()) || s.toLowerCase().includes(val)
      );
      if (!matches) return false;
    }

    // 9. Application
    if (selectedApplications.length > 0) {
      const hasMatch = col.applications.some(app => selectedApplications.includes(app));
      if (!hasMatch) return false;
    }


    return true;
  });

  // Apply sorting to the filtered list
  const sortedAndFilteredCollections = [...filteredCollections].sort((a, b) => {
    if (sortOption === "name-asc") {
      return a.name.localeCompare(b.name);
    } else if (sortOption === "name-desc") {
      return b.name.localeCompare(a.name);
    } else if (sortOption === "thickness") {
      const getThick = (col: Collection) => {
        const val = col.thickness || getThickness(col);
        return parseFloat(val) || 0;
      };
      return getThick(a) - getThick(b);
    } else if (sortOption === "category") {
      return a.category.localeCompare(b.category);
    }
    return 0; // Default
  });

  return (
    <>
    <style>{`@keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-4px);opacity:1} }`}</style>
    <section id="collections" className="relative w-full bg-[#FAF9F6] py-8 border-t border-[#f39b34]/15">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Filter Drawer Overlay */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 z-40"
                style={{background:"rgba(0,0,0,0.5)"}}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                id="tour-filter-drawer" className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col shadow-2xl"
                style={{background:"#ffffff"}}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100" style={{background:"#1C1A17"}}>
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal size={16} style={{color:"#f39b34"}} />
                    <span className="text-sm font-bold uppercase tracking-widest" style={{color:"#ffffff"}}>Filter Results</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    {(selectedFinishAndFeels.length > 0 || selectedColorGroups.length > 0 || selectedSizeFormats.length > 0 || selectedVisualLooks.length > 0 || selectedApplications.length > 0) && (
                      <button onClick={handleClearFilters} className="text-xs font-mono uppercase tracking-wider cursor-pointer" style={{color:"#f39b34"}}>Clear All</button>
                    )}
                    <button onClick={() => setIsFilterOpen(false)} className="cursor-pointer" style={{color:"rgba(255,255,255,0.6)"}}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {[
                    { key: "application", label: "Application", options: [...new Set(collections.flatMap(c => c.applications).filter(Boolean))].sort() as string[], list: selectedApplications, setList: setSelectedApplications },
                    { key: "finishAndFeel", label: "Finish & Feel", options: [...new Set(collections.map(c => getFinishAndFeel(c)).filter(Boolean))].sort() as string[], list: selectedFinishAndFeels, setList: setSelectedFinishAndFeels },
                    { key: "colorGroup", label: "Color Group", options: [...new Set(collections.map(c => getColorGroup(c)).filter(Boolean))].sort() as string[], list: selectedColorGroups, setList: setSelectedColorGroups },
                    { key: "sizeFormat", label: "Size & Format", options: [...new Set(collections.map(c => c.sizeAndFormat).filter(Boolean))].sort() as string[], list: selectedSizeFormats, setList: setSelectedSizeFormats },
                    { key: "visualLook", label: "Visual Look", options: [...new Set(collections.map(c => getVisualLook(c)).filter(Boolean))].sort() as string[], list: selectedVisualLooks, setList: setSelectedVisualLooks },
                  ].map(({ key, label, options, list, setList }) => (
                    <div key={key} className="border-b border-neutral-100">
                      <button
                        onClick={() => toggleSection(key)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-semibold" style={{color:"#1C1A17"}}>{label}</span>
                          {list.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:"#f39b34",color:"#000"}}>{list.length}</span>
                          )}
                        </div>
                        <span className="text-lg" style={{color:"#9a9690"}}>{openSections[key] ? "−" : "+"}</span>
                      </button>
                      {openSections[key] && (
                        <div className="px-6 pb-5 space-y-4">
                          {options.map(val => {
                            const isChecked = list.includes(val);
                            return (
                              <label key={val} className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" checked={isChecked} onChange={() => toggleFilter(list, setList, val)} className="sr-only" />
                                <div className={`w-5 h-5 border-2 transition-all flex items-center justify-center rounded-sm flex-shrink-0 ${isChecked ? "border-[#f39b34] bg-[#f39b34]" : "border-neutral-300 group-hover:border-[#f39b34]/50"}`}>
                                  {isChecked && <Check size={12} strokeWidth={3} style={{color:"#000"}} />}
                                </div>
                                <span className="text-base" style={{color: isChecked ? "#1C1A17" : "#6b6762"}}>{val}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-neutral-100">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-4 text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors"
                    style={{background:"#1C1A17",color:"#ffffff"}}
                  >
                    Show {sortedAndFilteredCollections.length} Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Full Width Grid */}
        <div className="flex flex-col space-y-6">
            
            {/* Result count */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{color:"#9a9690"}}>
                <span style={{color:"#f39b34",fontWeight:600}}>{sortedAndFilteredCollections.length}</span> lots
                {searchQuery && <> — <span style={{color:"#1C1A17"}}>"{searchQuery}"</span></>}
              </span>
            </div>

            {/* Active Filter Pills */}
            {(selectedFinishAndFeels.length > 0 || selectedColorGroups.length > 0 || selectedSizeFormats.length > 0 || selectedVisualLooks.length > 0 || selectedApplications.length > 0 || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-wider" style={{color:"#9a9690"}}>My Filters:</span>
                {searchQuery && <button onClick={() => { setSearchQuery(""); setTempSearchQuery(""); }} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>Search: {searchQuery} <X size={9} /></button>}
                {selectedApplications.map(v => <button key={v} onClick={() => toggleFilter(selectedApplications, setSelectedApplications, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedFinishAndFeels.map(v => <button key={v} onClick={() => toggleFilter(selectedFinishAndFeels, setSelectedFinishAndFeels, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedColorGroups.map(v => <button key={v} onClick={() => toggleFilter(selectedColorGroups, setSelectedColorGroups, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedSizeFormats.map(v => <button key={v} onClick={() => toggleFilter(selectedSizeFormats, setSelectedSizeFormats, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedVisualLooks.map(v => <button key={v} onClick={() => toggleFilter(selectedVisualLooks, setSelectedVisualLooks, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                <button onClick={handleClearFilters} className="text-[10px] font-mono hover:underline cursor-pointer uppercase tracking-wider" style={{color:"#f39b34"}}>Clear All</button>
              </div>
            )}

            {/* Quick preset links to assist speed of search */}
            <div className="flex flex-wrap gap-2 items-center px-1">
              <span className="text-[9px] text-[#1C1A17]/40 font-mono uppercase tracking-wider mr-1">Warehouse Shortcuts:</span>
              {[
                "Smooth Matte",
                "Metal & Oxid Look",
                "Polished/High Gloss",
                "Deep Black",
                "White & Cream"
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickSearch(prompt)}
                  className="text-[10px] font-sans text-[#1C1A17]/70 hover:text-[#f39b34] bg-white hover:bg-neutral-50 px-3 py-1 border border-neutral-200 hover:border-[#f39b34]/20 transition-all cursor-pointer rounded-sm shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* AI Filter Suggestion Banner */}
            {aiFilterQuery && onApplyAiFilter && (
              <div className="flex items-center justify-between bg-[#f39b34]/10 border border-[#f39b34]/30 px-4 py-2.5 rounded-sm">
                <div className="flex items-center space-x-2">
                  <Sparkles size={12} className="text-[#f39b34]" />
                  <span className="text-[10px] font-mono text-[#1C1A17]/70 uppercase tracking-wider">
                    TileAI suggests filtering by <span className="text-[#f39b34] font-bold">"{aiFilterQuery}"</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onApplyAiFilter(aiFilterQuery)}
                    className="text-[9px] font-bold uppercase tracking-wider bg-[#f39b34] text-black px-3 py-1 rounded-sm cursor-pointer hover:bg-[#e28b24] transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => onApplyAiFilter("")}
                    className="text-[9px] font-mono text-[#1C1A17]/40 hover:text-[#1C1A17] cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Loader / Empty States */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col space-y-4"
                >
                  {/* Loading banner */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#1C1A17] border border-[#f39b34]/20 rounded-sm">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-full bg-[#f39b34]/30 blur-md animate-pulse" />
                      <Sparkles size={16} className="text-[#f39b34] animate-spin relative z-10" style={{ animationDuration: "2.5s" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white">Loading catalog</p>
                      <p className="text-[9px] font-mono text-white/35 uppercase tracking-widest">Fetching lot inventory from database...</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#f39b34]" style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                  {/* Skeleton grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="bg-white border border-neutral-100 rounded-sm overflow-hidden animate-pulse">
                        <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : isAiSearching ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full bg-white border border-neutral-200 shadow-sm p-16 text-center flex flex-col items-center justify-center space-y-4 rounded-sm"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#f39b34]/20 blur-xl animate-pulse" />
                    <Sparkles size={32} className="text-[#f39b34] animate-spin relative z-10" style={{ animationDuration: "3s" }} />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm text-[#1C1A17] uppercase tracking-wider mb-1">
                      {aiSearchStatus}
                    </h3>
                    <p className="text-[9px] font-mono text-[#1C1A17]/40 uppercase tracking-widest">
                      Cross-referencing database with live lot numbers
                    </p>
                  </div>
                </motion.div>
              ) : sortedAndFilteredCollections.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full bg-white border border-neutral-200 shadow-sm p-16 text-center flex flex-col items-center justify-center space-y-4 rounded-sm"
                >
                  <Compass size={32} className="text-neutral-300" />
                  <div>
                    <h3 className="font-serif text-lg text-[#1C1A17] font-light mb-1">
                      No matching slab spec sheets found.
                    </h3>
                    <p className="text-[11px] text-neutral-500 max-w-sm leading-relaxed mx-auto">
                      Please refine your parameters or click reset below to inspect the full list of products in Table 1.
                    </p>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 border border-[#f39b34]/50 text-[#f39b34] hover:bg-[#f39b34] hover:text-white bg-white shadow-sm text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer rounded-sm"
                  >
                    Reset Explorer
                  </button>
                </motion.div>
              ) : (
                /* Pure High-Density Grid styled 100% like the requested mockup */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-start"
                >
                  {sortedAndFilteredCollections.slice(0, visibleCount).map((col, cardIndex) => {
                    const isPreSelected = selectedSlabIds.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        id={cardIndex === 0 ? "tour-first-card" : undefined}
                        onClick={() => setSelectedCollection(col)}
                        className="group bg-white border border-neutral-100 hover:border-[#f39b34]/40 hover:shadow-md transition-all duration-300 flex flex-col rounded-sm overflow-hidden cursor-pointer"
                      >
                        {/* Photo — fills the card, square aspect ratio */}
                        <div className="relative w-full aspect-square overflow-hidden bg-[#f0ede8]">
                          {(col.thumbnailUrl || col.productPhotoUrl) ? (
                            <img
                              src={col.thumbnailUrl || col.productPhotoUrl}
                              alt={col.name}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                el.style.display = "none";
                                el.parentElement!.style.background = col.backgroundGradient;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full" style={{ background: col.backgroundGradient }} />
                          )}
                          {/* Finish tag top-left */}
                          <div className="absolute top-2.5 left-2.5 flex gap-1">
                            <span className="text-[7px] font-mono tracking-widest uppercase bg-black/60 px-1.5 py-0.5 backdrop-blur-sm" style={{color:"#ffffff"}}>
                              {col.finish}
                            </span>
                            <span className="text-[7px] font-mono tracking-widest uppercase bg-black/60 px-1.5 py-0.5 backdrop-blur-sm" style={{color:"rgba(255,255,255,0.85)"}}>
                              {col.category.split(" ")[0]}
                            </span>
                          </div>

                          {/* Pre-select button top-right */}
                          <button
                            id={cardIndex === 0 ? "tour-preselect" : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePreSelection(col);
                            }}
                            className={`absolute top-2.5 right-2.5 text-[7px] font-bold tracking-wider uppercase px-2 py-1 transition-all cursor-pointer rounded-sm ${
                              isPreSelected
                                ? "bg-[#f39b34] text-black"
                                : "bg-black/60 text-white/80 hover:bg-[#f39b34] hover:text-black backdrop-blur-sm"
                            }`}
                          >
                            {isPreSelected ? "✓" : "+"}
                          </button>

                          {/* Name at bottom over gradient */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="font-sans text-[10px] font-bold tracking-wide leading-tight uppercase truncate" style={{color:"#ffffff",textShadow:"0 2px 8px rgba(0,0,0,1),0 0 20px rgba(0,0,0,1)"}}>
                              {col.name}
                            </h3>
                            <p className="text-[8px] font-mono uppercase mt-0.5" style={{color:"rgba(255,255,255,0.9)",textShadow:"0 2px 6px rgba(0,0,0,1)"}}>
                              {col.sizeAndFormat || col.specs}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load More */}
            {visibleCount < sortedAndFilteredCollections.length && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="px-8 py-4 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors border-2"
                  style={{borderColor:"rgba(243,155,52,0.4)",color:"#f39b34",background:"#ffffff"}}
                >
                  Load More <span className="opacity-60 ml-1">({visibleCount} of {sortedAndFilteredCollections.length})</span>
                </button>
              </div>
            )}

          </div>

      </div>

      {/* Luxury Collection Detail Drawer Modal — id for tour */}
      <AnimatePresence>
        {selectedCollection && (
          <div id="tour-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCollection(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-4xl bg-white border border-neutral-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-sm z-10"
            >
              {/* Left Side: Photo Gallery */}
              <div className="relative h-[300px] md:h-full min-h-[360px] border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col overflow-hidden bg-[#1C1A17]">
                
                {/* Main photo */}
                <div className="relative flex-1 overflow-hidden">
                  <div className="absolute inset-0" style={{ background: selectedCollection.backgroundGradient }} />
                  {activePhoto && (
                    <img
                      src={activePhoto}
                      alt={selectedCollection.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  )}

                  {/* Mobile close */}
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="absolute top-3 left-3 z-10 p-2 rounded-full bg-[#0a0a0a]/80 hover:bg-[#f39b34] text-white hover:text-[#0a0a0a] transition-all md:hidden cursor-pointer"
                  >
                    <X size={15} />
                  </button>

                  {/* Download + Copy buttons on active photo */}
                  {activePhoto && (
                    <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                      <a
                        href={`/api/download?url=${encodeURIComponent(activePhoto)}&filename=${encodeURIComponent(selectedCollection.name.replace(/\s+/g, "-").toLowerCase() + ".jpg")}`}
                        download
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#0a0a0a]/80 hover:bg-[#f39b34] text-white hover:text-black transition-all rounded-sm cursor-pointer backdrop-blur-sm"
                        title="Download photo"
                      >
                        ↓ Download
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activePhoto).then(() => {
                            const btn = document.getElementById("copy-btn");
                            if (btn) { btn.textContent = "✓ Copied"; setTimeout(() => { btn.textContent = "Copy URL"; }, 2000); }
                          });
                        }}
                        id="copy-btn"
                        className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#0a0a0a]/80 hover:bg-[#f39b34] text-white hover:text-black transition-all rounded-sm cursor-pointer backdrop-blur-sm"
                        title="Copy photo URL"
                      >
                        Copy URL
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip — all photos from Photo attachment field */}
                {(() => {
                  const allPhotos = [
                    ...(selectedCollection.productPhotoUrl ? [{ url: selectedCollection.productPhotoUrl, filename: "product-photo" }] : []),
                    ...((selectedCollection as any).photos || []),
                  ];
                  if (allPhotos.length <= 1) return null;
                  return (
                    <div className="flex gap-1.5 p-2 overflow-x-auto bg-[#0a0a0a]/60 backdrop-blur-sm scrollbar-hide">
                      {allPhotos.map((photo: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActivePhoto(photo.url)}
                          className={`flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${
                            activePhoto === photo.url
                              ? "border-[#f39b34] opacity-100"
                              : "border-transparent opacity-55 hover:opacity-90"
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Photo ${i + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                          />
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Right Side: Specifications Panel */}
              <div className="p-6 md:p-8 flex flex-col justify-between h-full bg-[#FAF9F6] overflow-y-auto max-h-[70vh] md:max-h-[90vh]">
                <div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-6">
                    <div>
                      <h4 className="font-sans text-sm font-bold text-[#1C1A17] tracking-wide">
                        {selectedCollection.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedCollection(null)}
                      className="hidden md:flex p-2 hover:bg-neutral-100 rounded text-neutral-400 hover:text-[#1C1A17] transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Surface attributes */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border border-[#f39b34]/30 p-3 rounded bg-[#f39b34]/05 flex flex-col justify-center">
                      <span className="text-[9px] font-mono tracking-widest text-[#f39b34] uppercase block mb-1">
                        Sizes
                      </span>
                      <span className="text-[10px] font-bold text-[#f39b34] uppercase tracking-wide leading-tight">
                        Other sizes may be available — consult us
                      </span>
                    </div>

                    <div className="border border-neutral-200/60 p-3 rounded bg-white">
                      <span className="text-[9px] font-mono tracking-widest text-[#1C1A17]/40 uppercase block mb-1">
                        THICKNESS SPEC
                      </span>
                      <span className="text-xs text-[#1C1A17] font-sans uppercase">
                        {selectedCollection.thickness || getThickness(selectedCollection)}
                      </span>
                    </div>
                  </div>

                  {/* Production Properties List */}
                  <div className="border border-neutral-200/60 p-3.5 rounded bg-white space-y-2.5 mb-6 shadow-sm">
                    <div className="flex justify-between items-center text-[10px] border-b border-neutral-100 pb-1.5">
                      <span className="text-[#1C1A17]/40 uppercase font-mono">Material Style:</span>
                      <span className="text-teal-700 font-sans font-semibold">{selectedCollection.specificMaterialStyle || getMaterialStyle(selectedCollection)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] border-b border-neutral-100 pb-1.5">
                      <span className="text-[#1C1A17]/40 uppercase font-mono">Finish:</span>
                      <span className="text-sky-700 font-sans font-semibold">{selectedCollection.finish}</span>
                    </div>

                    {/* Extra Airtable Custom Fields */}
                    {selectedCollection.brand && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Brand:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.brand}</span>
                      </div>
                    )}
                    {selectedCollection.unit && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Sold By:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.unit}</span>
                      </div>
                    )}
                    {selectedCollection.sqFtPerUnit !== undefined && selectedCollection.sqFtPerUnit !== null && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">SqFt per Unit:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.sqFtPerUnit}</span>
                      </div>
                    )}
                    {selectedCollection.sqFtPerBox !== undefined && selectedCollection.sqFtPerBox !== null && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">SqFt per Box:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.sqFtPerBox}</span>
                      </div>
                    )}
                    {selectedCollection.stockQuantities !== undefined && selectedCollection.stockQuantities !== null && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Stock Quantities:</span>
                        <span className="text-emerald-600 font-mono font-bold">{selectedCollection.stockQuantities}</span>
                      </div>
                    )}
                    {selectedCollection.price && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Price fields:</span>
                        <span className="text-[#f39b34] font-mono font-bold">{selectedCollection.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200 mt-auto">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onTogglePreSelection(selectedCollection);
                      }}
                      className={`flex-grow py-3 text-xs font-sans font-bold tracking-widest uppercase transition-colors duration-300 text-center cursor-pointer rounded-sm ${
                        selectedSlabIds.includes(selectedCollection.id)
                          ? "bg-transparent border border-[#f39b34] text-[#f39b34] hover:bg-[#f39b34]/10"
                          : "bg-[#f39b34] hover:bg-[#e28b24] text-white"
                      }`}
                    >
                      {selectedSlabIds.includes(selectedCollection.id)
                        ? "✓ Pre-Selected (Remove)"
                        : "+ Pre-Select Slab Model"}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedCollection(null);
                        onBookClick();
                      }}
                      className="px-5 py-3 border border-[#f39b34]/30 bg-white hover:bg-[#f39b34] text-[#f39b34] hover:text-white text-xs font-sans font-semibold tracking-widest uppercase transition-colors duration-300 text-center cursor-pointer rounded-sm"
                    >
                      Contact Us
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="w-full py-2 border border-neutral-200 hover:border-red-500/20 text-[9px] tracking-widest font-mono text-neutral-400 hover:text-[#1C1A17] transition-all cursor-pointer text-center uppercase"
                  >
                    Close Specifications
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
    </>
  );
}

// ==========================================
// FALLBACK UTILITY GENERATORS FOR HIGH DENSITY CATALOG
// ==========================================

const getLifestyleImage = (col: Collection): string => {
  if (col.productPhotoUrl) return col.productPhotoUrl;
  const images: Record<string, string> = {
    "calacatta-gold": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "nero-marquina": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    "travertine": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "statuario-extra": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    "roma-imperial": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "frappuccino-marble": "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
    "arabescato-orobico": "https://images.unsplash.com/photo-1502005229762-fc1b2d812ca5?auto=format&fit=crop&w=800&q=80",
    "concrete-series": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    "quartzite-corteccia": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    "patagonie": "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80",
    "dual-white": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
    "nature-mood-rainforest": "https://images.unsplash.com/photo-1530745342582-0795f23ec976?auto=format&fit=crop&w=800&q=80",
    "nature-mood-mountain-peak": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
    "nature-mood-riverbed": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "distrito-iron": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "distrito-iron-natural": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "distrito-zinc-natural": "https://images.unsplash.com/photo-1530745342582-0795f23ec976?auto=format&fit=crop&w=800&q=80",
    "distrito-aluminio-natural": "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
    "jw02-washington-polished": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "jw02-nero-marquinia-polished": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    "jw02-statuario-venato-polished": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    "ankara-bronze": "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80",
    "arken-gris": "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80"
  };
  return col.id && images[col.id] ? images[col.id] : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
};

const getFinishAndFeel = (col: Collection): string => {
  if (col.finishAndFeel) return col.finishAndFeel;
  if (col.finish === "Polished") return "Polished/High Gloss";
  if (col.finish === "Matte") return "Smooth Matte";
  if (col.finish === "Silk") return "Velvet Silk";
  if (col.finish === "Textured") return "Structured Grip";
  return "Satin Tactile";
};

const getColorGroup = (col: Collection): string => {
  return col.colorGroup || "";
};

const getThickness = (col: Collection): string => {
  if (col.thickness) return col.thickness;
  if (col.category === "Marble Look") return "6 mm";
  if (col.category === "Stone Look") return "12 mm";
  if (col.category === "Concrete Look") return "5.6 mm";
  if (col.category === "Metal Look") return "5.6 mm";
  return "6 mm";
};

const getVisualLook = (col: Collection): string => {
  if (col.visualLook) return col.visualLook;
  if (col.category === "Metal Look") return "Metal & Oxid Look";
  return col.category;
};

const getMaterialStyle = (col: Collection): string => {
  if (col.specificMaterialStyle) return col.specificMaterialStyle;
  const id = col.id;
  if (id.includes("calacatta")) return "Calacatta Gold";
  if (id.includes("nero")) return "Nero Marquina";
  if (id.includes("statuario")) return "Statuario";
  if (id.includes("travertine")) return "Travertine";
  if (id.includes("roma")) return "Quartzite";
  if (id.includes("frappuccino")) return "Frappuccino";
  if (id.includes("orobico")) return "Arabescato";
  if (id.includes("concrete")) return "Concrete Style";
  if (id.includes("patagonie")) return "Patagonia";
  if (id.includes("nature")) return "Nature Slabs";
  if (id.includes("distrito")) return "Metal";
  if (id.includes("ankara")) return "Bronze";
  if (id.includes("arken")) return "Basaltic";
  return "Bespoke";
};

const getProductPhotoUrl = (col: Collection): string => {
  if (col.productPhotoUrl) return col.productPhotoUrl;
  return `https://media.italgresorlando.com/productos/${col.id.replace(/-/g, "_")}_list.webp`;
};
