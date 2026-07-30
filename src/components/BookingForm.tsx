import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, Sparkles, Send, CheckCircle2, User, Phone, Mail, FileText, ChevronDown, Loader2 } from "lucide-react";

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingForm({ isOpen, onClose }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    projectType: "Residential Villa",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.date || !formData.time) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to register booking. Please verify input fields.");
      }

      const data = await response.json();
      setSubmitResult(data.message);
    } catch (err: any) {
      console.error("Booking submission error:", err);
      alert(err.message || "Something went wrong. Please try booking again.");
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
      date: "",
      time: "",
      projectType: "Residential Villa",
      notes: ""
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
          />

          {/* Modal box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-xl bg-white border border-neutral-200 overflow-hidden shadow-2xl rounded-sm z-10"
          >
            {/* Top orange bar */}
            <div className="w-full h-[3px] bg-[#f39b34]" />

            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[#f39b34] text-[10px] tracking-[0.25em] uppercase font-bold block mb-2">
                  ITALGRES ORLANDO
                </span>
                <h3 className="font-serif text-2xl text-[#1C1A17] font-light">
                  Showroom Consultation
                </h3>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close booking form"
                className="p-2 text-neutral-400 hover:text-[#f39b34] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Inner Content (Switch depending on success) */}
            <div className="px-8 pb-8">
              {!submitResult ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <p className="text-xs text-neutral-500 font-light leading-relaxed mb-4">
                    Register your private, 1-on-1 viewing appointment. Experience full-scale slabs on cantilever displays and map layouts under museum lights with Showroom Director, Carlos.
                  </p>

                  {/* Name field */}
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
                      className="w-full bg-[#FAF9F6] border border-neutral-200 focus:border-[#f39b34] text-[#1C1A17] text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors rounded-sm"
                    />
                  </div>

                  {/* Email & Phone side-by-side */}
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
                        className="w-full bg-[#FAF9F6] border border-neutral-200 focus:border-[#f39b34] text-[#1C1A17] text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors rounded-sm"
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
                        className="w-full bg-[#FAF9F6] border border-neutral-200 focus:border-[#f39b34] text-[#1C1A17] text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Project Type */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#f39b34]">
                      <FileText size={14} />
                    </span>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full appearance-none bg-[#FAF9F6] border border-neutral-200 focus:border-[#f39b34] text-[#1C1A17] text-xs pl-11 pr-10 py-3 focus:outline-none transition-colors cursor-pointer rounded-sm"
                    >
                      <option value="Residential Villa">Residential Slabs & Porcelain</option>
                      <option value="Commercial Lobby">Commercial Architecture</option>
                      <option value="Hospitality Hotel">Hospitality Venue</option>
                      <option value="Outdoor Decking">Outdoor & Pool Surrounds</option>
                    </select>
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <ChevronDown size={14} />
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#f39b34]">
                        <Calendar size={14} />
                      </span>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 focus:border-[#f39b34] text-[#1C1A17] text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors cursor-pointer rounded-sm"
                      />
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#f39b34]">
                        <Clock size={14} />
                      </span>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 focus:border-[#f39b34] text-[#1C1A17] text-xs pl-11 pr-4 py-3 focus:outline-none transition-colors cursor-pointer rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Briefly tell Carlos about your design style or material look (optional)..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full bg-[#FAF9F6] border border-neutral-200 focus:border-[#f39b34] text-[#1C1A17] text-xs p-4 focus:outline-none transition-colors resize-none rounded-sm"
                  />

                  {/* Actions */}
                  <div className="flex justify-end pt-4 space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-3 border border-neutral-200 hover:border-[#f39b34]/20 text-neutral-500 hover:text-neutral-800 text-xs font-sans tracking-wider uppercase transition-colors cursor-pointer rounded-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-7 py-3 bg-[#f39b34] hover:bg-[#e28b24] disabled:bg-neutral-200 text-white disabled:text-neutral-400 text-xs font-sans font-semibold tracking-wider uppercase transition-colors flex items-center space-x-2 cursor-pointer rounded-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 flex flex-col items-center space-y-6"
                >
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-[#f39b34] rounded-full">
                    <CheckCircle2 size={44} className="text-emerald-600" />
                  </div>

                  <div>
                    <h4 className="font-serif text-2xl text-[#1C1A17] font-light mb-3">
                      Consultation Requested
                    </h4>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
                      {submitResult}
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] border border-neutral-200 rounded w-full max-w-sm text-left flex items-start space-x-3.5 shadow-sm">
                    <div className="p-2 bg-white border border-neutral-150 rounded text-[#f39b34]">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <h5 className="font-sans font-semibold text-[10px] tracking-widest text-[#1C1A17] uppercase mb-1">
                        Carlos - Showroom Director
                      </h5>
                      <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                        Carlos will personally review your project specifications and text/email confirmation within 2 hours.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="px-8 py-3 bg-[#f39b34] hover:bg-[#e28b24] text-white text-xs font-sans font-semibold tracking-widest uppercase transition-colors cursor-pointer rounded-sm"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
