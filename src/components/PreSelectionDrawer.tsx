import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Send, CheckCircle2, ShoppingBag, Plus, Minus, User, Mail, Phone, FileText, Loader2, Info } from "lucide-react";
import { Collection, PreSelectedItem } from "../types";

interface PreSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: PreSelectedItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateQuantityType: (id: string, type: 'Slabs' | 'Sq Ft' | 'Boxes') => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
}

export default function PreSelectionDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onUpdateQuantityType,
  onRemoveItem,
  onClear
}: PreSelectionDrawerProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "Residential Villa",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ message: string; summary: string; emailSimulated: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || items.length === 0) return;

    setIsSubmitting(true);
    try {
      // Map items to simplified payload
      const slabsPayload = items.map(item => ({
        id: item.collection.id,
        name: item.collection.name,
        category: item.collection.category,
        finish: item.collection.finish,
        quantity: item.quantity,
        quantityType: item.quantityType
      }));

      const response = await fetch("/api/pre-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slabs: slabsPayload
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit material pre-selection. Please verify inputs.");
      }

      const data = await response.json();
      setSubmitResult({
        message: data.message,
        summary: data.summary,
        emailSimulated: data.emailSimulated
      });
      
      // Clear items upon successful submission
      onClear();
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(err.message || "An error occurred while compiling your pre-selection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitResult(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      projectType: "Residential Villa",
      notes: ""
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
          />

          {/* Drawer container right side */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="w-screen max-w-xl bg-[#FAF9F6] border-l border-neutral-200 flex flex-col justify-between shadow-2xl relative"
            >
              {/* Premium Orange Top Bar */}
              <div className="w-full h-[3px] bg-[#f39b34]" />

              {/* Drawer Header */}
              <div className="p-6 border-b border-neutral-200 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#FAF9F6] border border-neutral-200 text-[#f39b34]">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#1C1A17] font-semibold">
                      Material Pre-Selection List
                    </h3>
                    <p className="text-[10px] font-mono tracking-widest text-[#1C1A17]/40 uppercase">
                      Bespoke Specification Sheet Builder
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-neutral-400 hover:text-[#f39b34] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable List or Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {submitResult ? (
                  /* Success Feedback & Email Simulation log block */
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center py-6 flex flex-col items-center space-y-4">
                      <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-[#f39b34] rounded-full">
                        <CheckCircle2 size={38} className="text-emerald-600 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="font-serif text-xl text-[#1C1A17] font-light mb-2">
                          Material Pre-Selection Sent
                        </h4>
                        <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                          {submitResult.summary}
                        </p>
                      </div>
                    </div>

                    {/* Email Dispatch Simulated Terminal Box */}
                    <div className="bg-[#1C1A17] border border-neutral-300 rounded overflow-hidden shadow-md">
                      <div className="bg-neutral-800 px-4 py-2 border-b border-neutral-700 flex items-center justify-between">
                        <span className="text-[9px] font-mono tracking-widest text-[#f39b34] uppercase font-bold">
                          SYSTEM EMAIL DISPATCH LEDGER
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                      <pre className="p-4 text-[10px] font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-64 custom-scrollbar">
                        {submitResult.emailSimulated}
                      </pre>
                    </div>

                    <div className="p-4 bg-white border border-neutral-200 rounded flex items-start space-x-3.5 shadow-sm">
                      <div className="p-2 bg-neutral-50 border border-neutral-100 rounded text-[#f39b34]">
                        <Info size={14} className="shrink-0" />
                      </div>
                      <div>
                        <h5 className="font-sans font-semibold text-[10px] tracking-widest text-[#1C1A17] uppercase mb-0.5">
                          Follow-up consultation
                        </h5>
                        <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                          Carlos will review your pre-selected formats & finishes to cross-check real-time warehouse counts and contact you within 2 hours.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full py-3.5 bg-[#f39b34] hover:bg-[#e28b24] text-white text-xs font-sans font-semibold tracking-widest uppercase transition-colors text-center cursor-pointer rounded-sm"
                    >
                      Return to Material Catalog
                    </button>
                  </motion.div>
                ) : items.length === 0 ? (
                  /* Empty state */
                  <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-300 shadow-sm">
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-[#1C1A17] font-light">
                        No materials pre-selected
                      </h4>
                      <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mt-1">
                        Explore the collections catalog and click "Pre-select Slab" on your preferred porcelain models to compile a specifications list.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 border border-[#f39b34]/50 bg-white hover:bg-[#f39b34] text-[#f39b34] hover:text-white text-[10px] font-sans font-semibold tracking-widest uppercase transition-colors rounded-sm shadow-sm"
                    >
                      BROWSE MATERIALS
                    </button>
                  </div>
                ) : (
                  /* List of Pre-selected Slabs and Checkout Form */
                  <div className="space-y-6">
                    <div className="space-y-3.5">
                      <span className="text-[10px] font-mono tracking-widest text-[#1C1A17]/40 uppercase block">
                        SELECTED MATERIALS ({items.length})
                      </span>
                      
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.collection.id}
                            className="bg-white border border-neutral-200 p-4 flex items-stretch space-x-4 rounded-sm hover:border-[#f39b34]/40 transition-colors shadow-sm animate-fadeIn"
                          >
                            {/* Miniature gradient swatch */}
                            <div
                              className="w-12 h-auto aspect-[3/4] border border-neutral-100 relative overflow-hidden shrink-0"
                              style={{ background: item.collection.backgroundGradient }}
                            >
                              <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" />
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>

                            {/* Content details and quantity picker */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h4 className="font-serif text-sm text-[#1C1A17] font-medium tracking-wide uppercase">
                                    {item.collection.name}
                                  </h4>
                                  <button
                                    onClick={() => onRemoveItem(item.collection.id)}
                                    className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                                    title="Remove from pre-selection"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                                <p className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">
                                  {item.collection.category} · {item.collection.finish}
                                </p>
                              </div>

                              {/* Quantity configuration block */}
                              <div className="flex items-center justify-between mt-3.5">
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQuantity(item.collection.id, Math.max(1, item.quantity - 1))}
                                    className="p-1 border border-neutral-200 hover:border-[#f39b34]/30 bg-neutral-50 hover:bg-white text-neutral-500 hover:text-[#f39b34] transition-colors rounded-sm cursor-pointer"
                                  >
                                    <Minus size={10} />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => onUpdateQuantity(item.collection.id, Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-10 text-center bg-[#FAF9F6] border border-neutral-200 text-neutral-800 text-xs py-0.5 focus:outline-none focus:border-[#f39b34] rounded-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQuantity(item.collection.id, item.quantity + 1)}
                                    className="p-1 border border-neutral-200 hover:border-[#f39b34]/30 bg-neutral-50 hover:bg-white text-neutral-500 hover:text-[#f39b34] transition-colors rounded-sm cursor-pointer"
                                  >
                                    <Plus size={10} />
                                  </button>
                                </div>

                                {/* Quantity Unit Picker */}
                                <div className="flex space-x-1.5">
                                  {(['Slabs', 'Sq Ft'] as const).map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => onUpdateQuantityType(item.collection.id, type)}
                                      className={`px-2 py-1 text-[9px] font-mono tracking-wider uppercase border transition-colors rounded-sm ${
                                        item.quantityType === type
                                          ? "border-[#f39b34] bg-[#f39b34]/10 text-[#f39b34]"
                                          : "border-neutral-200 bg-transparent text-neutral-400 hover:text-neutral-700"
                                      }`}
                                    >
                                      {type}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pre-Selection Verification Form */}
                    <form onSubmit={handleSubmit} className="border-t border-neutral-200 pt-6 space-y-4">
                      <span className="text-[10px] font-mono tracking-widest text-[#1C1A17]/40 uppercase block">
                        REQUEST SPECIFICATIONS & PRICING
                      </span>
                      <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                        Carlos will receive your selection, verify physical inventory in the Orlando depot, and prepare format alternatives. Fill in your details below.
                      </p>

                      {/* Name input */}
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#f39b34]">
                          <User size={14} />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name *"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white border border-neutral-200 focus:border-[#f39b34] text-neutral-800 text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors rounded-sm"
                        />
                      </div>

                      {/* Email & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#f39b34]">
                            <Mail size={14} />
                          </span>
                          <input
                            type="email"
                            required
                            placeholder="Email Address *"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white border border-neutral-200 focus:border-[#f39b34] text-neutral-800 text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors rounded-sm"
                          />
                        </div>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#f39b34]">
                            <Phone size={14} />
                          </span>
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-white border border-neutral-200 focus:border-[#f39b34] text-neutral-800 text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors rounded-sm"
                          />
                        </div>
                      </div>

                      {/* Project Type selection */}
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#f39b34]">
                          <FileText size={14} />
                        </span>
                        <select
                          value={formData.projectType}
                          onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                          className="w-full appearance-none bg-white border border-neutral-200 focus:border-[#f39b34] text-neutral-800 text-xs pl-11 pr-10 py-3 focus:outline-none transition-colors cursor-pointer rounded-sm"
                        >
                          <option value="Residential Villa">Residential Kitchen & Bath</option>
                          <option value="Commercial Lobby">Commercial Architecture</option>
                          <option value="Outdoor Pool">Outdoor Patio & Cladding</option>
                        </select>
                      </div>

                      {/* Notes input */}
                      <textarea
                        placeholder="Tell Carlos about any custom edge detailing, countertop templates, or miter cuts needed..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full bg-white border border-neutral-200 focus:border-[#f39b34] text-neutral-800 text-xs p-4 focus:outline-none transition-colors resize-none rounded-sm"
                      />

                      {/* Submit Actions */}
                      <div className="pt-2 flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={onClear}
                          className="px-4 py-3 border border-red-200 hover:border-red-400 text-red-500 text-xs font-sans tracking-wider uppercase transition-colors cursor-pointer bg-white rounded-sm shadow-sm"
                        >
                          Clear All
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-3 bg-[#f39b34] hover:bg-[#e28b24] disabled:bg-neutral-200 text-white disabled:text-neutral-400 text-xs font-sans font-semibold tracking-widest uppercase transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md rounded-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Compiling Sheet...</span>
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              <span>Submit Pre-Selection</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
