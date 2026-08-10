import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, SlidersHorizontal, Search, MousePointer, Plus, ShoppingBag } from "lucide-react";

const STORAGE_KEY = "italgres_tour_v6";

interface Rect { top: number; left: number; width: number; height: number; }

function getRect(id: string): Rect | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function waitForEl(id: string, timeout = 3000): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    const el = document.getElementById(id);
    if (el) return resolve(el);
    const obs = new MutationObserver(() => {
      const found = document.getElementById(id);
      if (found) { obs.disconnect(); resolve(found); }
    });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
    setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
  });
}

const STEPS = [
  {
    targetId: "tour-filter-btn",
    icon: <SlidersHorizontal size={20} style={{ color: "#f39b34" }} />,
    title: "Filter Results",
    text: "Click the orange Filter Results button to open filter options — Application, Color Group, Finish & Feel, Size, and Visual Look.",
    hint: "↑ Click the highlighted button above to try it",
    tooltipSide: "bottom" as const,
    onEnter: null as null | (() => Promise<void>),
    onNext: () => window.dispatchEvent(new Event("open-filter")),
  },
  {
    targetId: "tour-filter-drawer",
    icon: <SlidersHorizontal size={20} style={{ color: "#f39b34" }} />,
    title: "Choose Your Filters",
    text: "Select any combination of filters — they apply together automatically. Click Show Results or Next when done.",
    hint: "↑ The filter panel is open — explore or click Next to continue",
    tooltipSide: "left" as const,
    onEnter: async () => { await waitForEl("tour-filter-drawer"); await new Promise(r => setTimeout(r, 400)); },
    onNext: () => window.dispatchEvent(new Event("close-filter")),
  },
  {
    targetId: "tour-nav-search",
    icon: <Search size={20} style={{ color: "#f39b34" }} />,
    title: "Search the Catalog",
    text: "Type any color, material, finish, or size — results update instantly as you type.",
    hint: "↑ Try typing \"marble\" or \"white\" in the search bar",
    tooltipSide: "bottom" as const,
    onEnter: null,
    onNext: null,
  },
  {
    targetId: "tour-first-card",
    icon: <MousePointer size={20} style={{ color: "#f39b34" }} />,
    title: "View Product Details",
    text: "Click any tile card to open a full detail view — specs, dimensions, finish, and high-resolution photo.",
    hint: "↑ Click this tile to open the detail view",
    tooltipSide: "right" as const,
    onEnter: null,
    onNext: () => {
      const card = document.getElementById("tour-first-card");
      if (card) card.click();
    },
  },
  {
    targetId: "tour-detail-modal",
    icon: <MousePointer size={20} style={{ color: "#f39b34" }} />,
    title: "Full Product View",
    text: "Here you see all specs — finish, size, thickness, applications, and the full photo. Click Next to close and continue.",
    hint: "↑ Review the product details — click Next when ready",
    tooltipSide: "center" as const,
    onEnter: async () => { await waitForEl("tour-detail-modal"); await new Promise(r => setTimeout(r, 300)); },
    onNext: () => window.dispatchEvent(new Event("close-modal")),
  },
  {
    targetId: "tour-preselect",
    icon: <Plus size={20} style={{ color: "#f39b34" }} />,
    title: "Pre-Select a Tile",
    text: "Tap the + button on any tile card to add it to your shortlist. Your selections save automatically across sessions.",
    hint: "↑ Tap this + button to add the tile to your shortlist",
    tooltipSide: "left" as const,
    onEnter: null,
    onNext: () => {
      const btn = document.getElementById("tour-preselect");
      if (btn) btn.click();
    },
  },
  {
    targetId: "floating-selection-btn",
    icon: <ShoppingBag size={20} style={{ color: "#f39b34" }} />,
    title: "Review & Submit",
    text: "Your pre-selected tiles appear here. Open the shortlist to review your picks and send them directly to Carlos with one tap.",
    hint: "↑ This button shows your shortlist — tap to review and submit",
    tooltipSide: "top" as const,
    onEnter: async () => { await waitForEl("floating-selection-btn"); await new Promise(r => setTimeout(r, 300)); },
    onNext: null,
  },
];

// ── Tooltip card — shared between desktop floating and mobile bottom sheet ──
function StepCard({
  current, step, isLast, onPrev, onNext, onFinish,
}: {
  current: typeof STEPS[0]; step: number; isLast: boolean;
  onPrev: () => void; onNext: () => void; onFinish: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {current.icon}
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ffffff" }}>
            {current.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
            {step + 1}/{STEPS.length}
          </span>
          <button onClick={onFinish} className="cursor-pointer" style={{ color: "rgba(255,255,255,0.3)" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-xs leading-relaxed mb-2.5" style={{ color: "rgba(255,255,255,0.65)" }}>
          {current.text}
        </p>
        {current.hint && (
          <div className="px-3 py-2" style={{ background: "rgba(243,155,52,0.1)", borderLeft: "2px solid #f39b34" }}>
            <span className="text-[11px] font-mono" style={{ color: "#f39b34" }}>{current.hint}</span>
          </div>
        )}
      </div>

      {/* Progress + actions */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 18 : 5, height: 5, borderRadius: 999,
              background: i === step ? "#f39b34" : "rgba(255,255,255,0.15)",
              transition: "all 0.3s"
            }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onFinish} className="text-[10px] font-mono uppercase tracking-wider cursor-pointer mr-1"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            Skip
          </button>
          {step > 0 && (
            <button onClick={onPrev}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)", color: "#ffffff" }}>
              <ChevronLeft size={11} /> Back
            </button>
          )}
          <button onClick={onNext}
            className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
            style={{ background: "#f39b34", color: "#000" }}>
            {isLast ? "Done" : "Next"} {!isLast && <ChevronRight size={11} />}
          </button>
        </div>
      </div>
    </>
  );
}

export default function TourOverlay() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setShowWelcome(true), 1200);
    }
  }, []);

  useEffect(() => {
    const handler = () => { setStep(0); setShowWelcome(false); setActive(true); };
    window.addEventListener("start-tour", handler);
    return () => window.removeEventListener("start-tour", handler);
  }, []);

  const positionTooltip = useCallback((rect: Rect, side: string) => {
    // On mobile we use bottom sheet — no need to position
    if (window.innerWidth < 640) return;

    const pad = 16;
    const tw = 340;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let style: React.CSSProperties = { position: "fixed", width: tw, zIndex: 99 };

    if (side === "bottom") {
      style.top = Math.min(rect.top + rect.height + pad, vh - 220);
      style.left = Math.max(pad, Math.min(rect.left, vw - tw - pad));
    } else if (side === "top") {
      style.top = Math.max(pad, rect.top - 200 - pad);
      style.left = Math.max(pad, Math.min(rect.left, vw - tw - pad));
    } else if (side === "right") {
      style.top = Math.max(pad, Math.min(rect.top, vh - 220));
      style.left = Math.min(rect.left + rect.width + pad, vw - tw - pad);
    } else if (side === "left") {
      style.top = Math.max(pad, Math.min(rect.top, vh - 220));
      style.left = Math.max(pad, rect.left - tw - pad);
    } else {
      style.bottom = 28;
      style.left = "50%";
      style.transform = "translateX(-50%)";
    }
    setTooltipStyle(style);
  }, []);

  const activateStep = useCallback(async (s: number) => {
    const stepDef = STEPS[s];
    if (stepDef.onEnter) await stepDef.onEnter();
    await new Promise(r => setTimeout(r, 150));

    const rect = getRect(stepDef.targetId);
    if (rect) {
      setSpotlight(rect);
      positionTooltip(rect, stepDef.tooltipSide);
    } else {
      setSpotlight(null);
      setTooltipStyle({
        position: "fixed", bottom: 28, left: "50%",
        transform: "translateX(-50%)", width: 340, zIndex: 99
      });
    }
  }, [positionTooltip]);

  useEffect(() => {
    if (!active) return;
    activateStep(step);
  }, [active, step, activateStep]);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const rect = getRect(STEPS[step].targetId);
      if (rect) {
        setSpotlight(rect);
        positionTooltip(rect, STEPS[step].tooltipSide);
      }
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active, step, positionTooltip]);

  const finish = () => {
    setActive(false);
    setShowWelcome(false);
    setSpotlight(null);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const next = async () => {
    const current = STEPS[step];
    if (current.onNext) current.onNext();
    await new Promise(r => setTimeout(r, 250));
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* ── Welcome modal ── */}
      <AnimatePresence>
        {showWelcome && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{ background: "rgba(0,0,0,0.65)" }}
              onClick={() => setShowWelcome(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="fixed z-[91] shadow-2xl"
              style={{
                // Centered on desktop, bottom sheet on mobile
                ...(isMobile
                  ? { bottom: 0, left: 0, right: 0, borderRadius: "16px 16px 0 0" }
                  : { top: 0, left: 0, right: 0, bottom: 0, margin: "auto", width: 360, height: "fit-content" }
                ),
                background: "#1C1A17",
                borderTop: "4px solid #f39b34",
              }}
            >
              <div className="p-6 sm:p-8">
                <div className="w-12 h-12 flex items-center justify-center mb-5"
                  style={{ background: "rgba(243,155,52,0.12)" }}>
                  <span style={{ fontSize: 24 }}>🪨</span>
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: "#ffffff" }}>
                  Welcome to Italgres Orlando
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Your private European tile catalog. Would you like a quick interactive tour?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowWelcome(false); localStorage.setItem(STORAGE_KEY, "1"); }}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer border"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", background: "transparent" }}>
                    Skip
                  </button>
                  <button
                    onClick={() => { setShowWelcome(false); setStep(0); setActive(true); }}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
                    style={{ background: "#f39b34", color: "#000" }}>
                    Show me around <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Tour ── */}
      <AnimatePresence>
        {active && (
          <>
            {/* Spotlight */}
            {spotlight && (
              <motion.div
                key={`spot-${step}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  position: "fixed",
                  top: spotlight.top - 6,
                  left: spotlight.left - 6,
                  width: spotlight.width + 12,
                  height: spotlight.height + 12,
                  zIndex: 89,
                  pointerEvents: "none",
                  borderRadius: 4,
                  border: "2px solid #f39b34",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
                }}
              />
            )}

            {/* Fallback backdrop */}
            {!spotlight && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 pointer-events-none"
                style={{ zIndex: 89, background: "rgba(0,0,0,0.58)" }}
              />
            )}

            {/* ── DESKTOP: floating tooltip ── */}
            {!isMobile && (
              <motion.div
                key={`tip-${step}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ ...tooltipStyle, background: "#1C1A17", borderTop: "3px solid #f39b34" }}
                className="shadow-2xl"
              >
                <StepCard
                  current={current} step={step} isLast={isLast}
                  onPrev={prev} onNext={next} onFinish={finish}
                />
              </motion.div>
            )}

            {/* ── MOBILE: bottom sheet ── */}
            {isMobile && (
              <motion.div
                key={`sheet-${step}`}
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                style={{
                  position: "fixed",
                  bottom: 0, left: 0, right: 0,
                  zIndex: 99,
                  background: "#1C1A17",
                  borderTop: "3px solid #f39b34",
                  borderRadius: "16px 16px 0 0",
                  // Safe area for iPhone home indicator
                  paddingBottom: "env(safe-area-inset-bottom, 8px)",
                }}
                className="shadow-2xl"
              >
                <StepCard
                  current={current} step={step} isLast={isLast}
                  onPrev={prev} onNext={next} onFinish={finish}
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
