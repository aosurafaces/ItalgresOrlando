import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mail, MapPin, X } from "lucide-react";

interface FooterProps {
  onBookClick: () => void;
  onLinkClick: (id: string) => void;
}

export default function Footer({ onBookClick, onLinkClick }: FooterProps) {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[#FAF9F6] pt-10 sm:pt-16 pb-8 sm:pb-12 border-t border-t-[#f39b34]/30">

      {/* Footer Top — Brand + Consultations only (Collections & Company columns removed) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 pb-8 sm:pb-16">

        {/* Col 1: Brand */}
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <a
            href="#"
            onClick={handleLogoClick}
            className="font-sans font-semibold tracking-[0.18em] text-sm uppercase text-[#1C1A17] hover:text-[#f39b34] transition-colors self-start"
          >
            ITALGRES
          </a>
          <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-sm">
            A destination for those who value craftsmanship, innovation and European design. Every collection is selected with purpose, offering access to materials, inspiring trends and unique surfaces that transform residential, commercial and hospitality projects.
          </p>
          <div className="flex flex-col space-y-2 pt-2">
            <span className="text-[11px] text-neutral-500 font-mono flex items-start space-x-2">
              <MapPin size={12} className="text-[#f39b34] mt-0.5 flex-shrink-0" />
              <span>Showroom: 1160 Solana Ave, Winter Park, FL 32789<br />(By Appointment Only)</span>
            </span>
          </div>
        </div>

        {/* Col 2: Contact & Consultations */}
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <h4 className="font-sans font-semibold text-[10px] tracking-widest text-[#f39b34] uppercase">
            Consultations
          </h4>
          <p className="text-xs text-neutral-500 font-light leading-relaxed">
            Contact us for a private viewing.
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
              <a href="mailto:carlos@italgres.com" className="hover:text-[#f39b34] transition-colors">
                carlos@italgres.com
              </a>
            </span>
            <span className="flex items-center space-x-2">
              <a href="https://italgres.com" target="_blank" rel="noreferrer" className="hover:text-[#f39b34] transition-colors text-neutral-400">
                italgres.com
              </a>
            </span>
          </div>

          <div className="flex flex-col space-y-1.5 pt-3 border-t border-neutral-200 text-[11px] text-neutral-600 font-mono">
            <span className="text-[10px] font-sans font-semibold text-[#1C1A17] tracking-wide">Carlos Avila</span>
            <a href="tel:+13054983631" className="hover:text-[#f39b34] transition-colors">
              Cell: 305.498.3631
            </a>
            <a href="tel:+13212526369" className="hover:text-[#f39b34] transition-colors">
              Office: 321.252.6369
            </a>
          </div>
        </div>

      </div>

      {/* Footer Bottom copyright row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-6 sm:pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-mono tracking-wide text-neutral-400 text-center md:text-left">
        <span>© 2026 All Rights Reserved. ITALGRES</span>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="hover:text-[#f39b34] transition-colors cursor-pointer"
          >
            Privacy Terms
          </button>
          <span>·</span>
          <a
            href="https://rewiretransform.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#f39b34] transition-colors"
          >
            Site by Rewire Business Transformation
          </a>
        </div>
      </div>

      {/* Privacy Terms Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyOpen(false)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: "spring", damping: 26 }}
              className="relative w-full max-w-2xl bg-white border-0 sm:border border-neutral-200 shadow-2xl rounded-none sm:rounded-sm z-10 my-0 sm:my-8 max-h-[100vh] sm:max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 flex-shrink-0">
                <h3 className="font-serif text-lg text-[#1C1A17] font-semibold">Privacy & Terms</h3>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="p-2 text-neutral-400 hover:text-[#f39b34] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6 overflow-y-auto text-xs text-neutral-600 leading-relaxed space-y-5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Last updated 2026</p>

                <div>
                  <h4 className="text-[#1C1A17] font-semibold text-sm mb-2">Information We Collect</h4>
                  <p>When you submit a consultation request or material selection through this site, we collect your name, email address, phone number, project type, and any notes you provide. This information is used solely to respond to your inquiry and provide the services you've requested.</p>
                </div>

                <div>
                  <h4 className="text-[#1C1A17] font-semibold text-sm mb-2">How We Use Your Information</h4>
                  <p>Your information is used to contact you regarding your inquiry, prepare quotes and consultations, and improve our services. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
                </div>

                <div>
                  <h4 className="text-[#1C1A17] font-semibold text-sm mb-2">Data Storage & Security</h4>
                  <p>Submissions are transmitted securely over HTTPS and stored only as long as necessary to fulfill your request. We take reasonable technical measures to protect your information from unauthorized access.</p>
                </div>

                <div>
                  <h4 className="text-[#1C1A17] font-semibold text-sm mb-2">Cookies</h4>
                  <p>This site may use minimal local storage to remember your material selections between visits. No third-party advertising or tracking cookies are used.</p>
                </div>

                <div>
                  <h4 className="text-[#1C1A17] font-semibold text-sm mb-2">Your Rights</h4>
                  <p>You may request access to, correction of, or deletion of your personal information at any time by contacting us directly.</p>
                </div>

                <div>
                  <h4 className="text-[#1C1A17] font-semibold text-sm mb-2">Contact</h4>
                  <p>Questions about this policy can be directed to <a href="mailto:carlos@italgres.com" className="text-[#f39b34] hover:underline">carlos@italgres.com</a>.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 flex-shrink-0">
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-full py-3 bg-[#1C1A17] hover:bg-[#f39b34] text-white text-xs font-sans font-semibold tracking-widest uppercase transition-colors cursor-pointer rounded-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </footer>
  );
}
