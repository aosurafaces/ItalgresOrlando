import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Loader2, User, CornerDownLeft, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Marble-look slabs for kitchen island",
  "Outdoor non-slip pool surround tile",
  "Travertine format sizes & finishes",
  "Minimalist concrete look for living room"
];

export default function SorenChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: "Hello. I'm Soren, Italgres Orlando's design concierge. Tell me about your project — the space, the look you're after, or the material you have in mind. I'll find the right collections for you.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const handleSorenTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail && customEvent.detail.query) {
        handleSend(customEvent.detail.query);
        const element = document.getElementById("soren-ai");
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
    };
    window.addEventListener("ask-soren", handleSorenTrigger);
    return () => window.removeEventListener("ask-soren", handleSorenTrigger);
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Map conversation history for full-stack endpoint
      const payloadMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: payloadMessages })
      });

      if (!response.ok) {
        throw new Error("Soren is currently updating his collections. Please retry in a moment.");
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `soren_${Date.now()}`,
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to transmit message. Please verify your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend(input);
    }
  };

  return (
    <section id="soren-ai" className="relative w-full bg-[#FAF9F6] py-20 md:py-28 border-t border-neutral-200">
      {/* Dynamic atmospheric ambient backlights */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#f39b34]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-white blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Side: Editorial Typography Copy */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <span className="text-[#f39b34] text-[10px] tracking-[0.25em] uppercase font-semibold block mb-3">
            AI DESIGN CONCIERGE
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-[#1C1A17] font-light mb-6">
            Meet Soren.
          </h2>
          <p className="text-sm md:text-base text-neutral-600 font-light leading-relaxed mb-6 tracking-wide">
            Tell Soren about your project. Material style, application, format preferences — Soren scans our full European porcelain collections catalog instantly, recommends fits, and connects you directly with Carlos.
          </p>
          
          <div className="flex flex-col space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center space-x-3 text-xs text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available 24 hours · Response time under 2 minutes</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f39b34]" />
              <span>Personal showroom manager (Carlos) setup integrated</span>
            </div>
          </div>
        </div>

        {/* Right Side: Soren Chat Panel */}
        <div className="lg:col-span-7">
          <div className="w-full bg-white border border-neutral-200 border-t-2 border-t-[#f39b34] shadow-xl flex flex-col overflow-hidden rounded-sm">
            
            {/* Panel Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 bg-[#f39b34] rounded-full" />
                <span className="font-sans font-semibold text-xs tracking-widest text-[#1C1A17] uppercase">
                  ITALGRES <span className="text-[#f39b34]/60">|</span> Orlando
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Sparkles size={11} className="text-[#f39b34]" />
                <span className="font-mono text-[9px] tracking-widest uppercase text-[#f39b34] font-semibold">
                  AI CONCIERGE: SOREN
                </span>
              </div>
            </div>

            {/* Chat Area Scrollable */}
            <div className="p-6 h-[340px] overflow-y-auto custom-scrollbar flex flex-col space-y-4 bg-white">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    {/* Role Header label */}
                    <span className="text-[9px] text-[#1C1A17]/40 font-mono mb-1 flex items-center space-x-1 uppercase">
                      {msg.role === "user" ? (
                        <>
                          <span>CLIENT</span>
                          <User size={8} />
                        </>
                      ) : (
                        <>
                          <Sparkles size={8} className="text-[#f39b34]" />
                          <span className="text-[#f39b34]">SOREN</span>
                        </>
                      )}
                    </span>

                    {/* Content text block */}
                    <div
                      className={`p-4 rounded-lg text-xs leading-relaxed font-sans ${
                        msg.role === "user"
                          ? "bg-neutral-800 text-white rounded-tr-none"
                          : "bg-neutral-50 text-neutral-800 border border-neutral-150 rounded-tl-none border-l-2 border-l-[#f39b34]"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[9px] text-neutral-400 font-mono mt-1">
                      {msg.timestamp}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loader Typing animation */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start max-w-[85%] self-start"
                >
                  <span className="text-[9px] text-[#f39b34]/60 font-mono mb-1 flex items-center space-x-1 uppercase">
                    <Sparkles size={8} className="text-[#f39b34]" />
                    <span>SOREN IS TYPING</span>
                  </span>
                  <div className="bg-neutral-50 p-4 border border-neutral-100 rounded-r-lg rounded-bl-lg flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-[#f39b34] rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                    <div className="w-1.5 h-1.5 bg-[#f39b34] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-1.5 h-1.5 bg-[#f39b34] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </motion.div>
              )}

              {/* Error state */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs flex items-start space-x-2 rounded">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chip strip */}
            <div className="px-6 py-3 bg-neutral-50/50 border-t border-neutral-100 overflow-x-auto custom-scrollbar flex space-x-2.5 whitespace-nowrap">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full border border-neutral-200 hover:border-[#f39b34]/40 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-[#f39b34] text-[10px] font-sans transition-all duration-300 cursor-pointer disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-neutral-150 bg-neutral-50 flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Soren about tiles, formats, or styles..."
                disabled={isLoading}
                className="flex-grow bg-white border border-neutral-200 focus:border-[#f39b34] text-neutral-800 text-xs px-4 py-3 focus:outline-none transition-colors"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                aria-label="Send message to Soren"
                className="p-3 bg-[#f39b34] disabled:bg-neutral-200 text-white disabled:text-neutral-400 transition-all duration-300 flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px] rounded-sm"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
