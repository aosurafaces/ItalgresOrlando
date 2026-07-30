import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Search, Send, X, ChevronDown, Minus } from "lucide-react";
import { PreSelectedItem } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  finish: string;
  colorGroup: string;
  sizeAndFormat: string;
  specs: string;
  productPhotoUrl: string;
  backgroundGradient: string;
  inStock: boolean;
}

interface TileAIProps {
  preSelectedSlabs: PreSelectedItem[];
}

type Mode = "search" | "chat";

export default function TileAI({ preSelectedSlabs }: TileAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<Mode>("search");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCartLength = useRef(preSelectedSlabs.length);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-suggest similar when cart changes
  useEffect(() => {
    if (
      preSelectedSlabs.length > 0 &&
      preSelectedSlabs.length !== prevCartLength.current &&
      isOpen
    ) {
      handleFindSimilar();
    }
    prevCartLength.current = preSelectedSlabs.length;
  }, [preSelectedSlabs.length]);

  const handleFindSimilar = async () => {
    if (preSelectedSlabs.length === 0) return;
    setIsFindingSimilar(true);
    setIsOpen(true);
    setMode("chat");

    const summary = preSelectedSlabs.map(item => {
      const c = item.collection;
      return `${c.name} (${c.category}, ${c.colorGroup}, ${c.finish})`;
    }).join("; ");

    const userMsg: Message = {
      role: "user",
      content: `Find me similar tiles to what I've selected: ${summary}`
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const history = messages.slice(-6).concat(userMsg);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      if (data.text) {
        const assistantMsg: Message = {
          role: "assistant",
          content: data.text,
          products: data.products
        };
        setMessages(prev => [...prev, assistantMsg]);

        // Also fire a filter event to update the grid
        const filterTerm = extractFilterTerm(summary);
        if (filterTerm) {
          window.dispatchEvent(new CustomEvent("ai-filter-trigger", {
            detail: { query: filterTerm }
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFindingSimilar(false);
    }
  };

  const extractFilterTerm = (summary: string): string => {
    // Pull dominant color/finish from selections
    const lower = summary.toLowerCase();
    if (lower.includes("white") || lower.includes("bianco")) return "white";
    if (lower.includes("black") || lower.includes("nero") || lower.includes("anthracite")) return "black";
    if (lower.includes("beige") || lower.includes("cream")) return "beige";
    if (lower.includes("grey") || lower.includes("gray")) return "grey";
    if (lower.includes("marble")) return "marble";
    if (lower.includes("concrete") || lower.includes("cement")) return "concrete";
    if (lower.includes("wood")) return "wood";
    return summary.split("(")[0].trim().split(" ").slice(0, 2).join(" ");
  };

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    window.dispatchEvent(new CustomEvent("ai-filter-trigger", {
      detail: { query: q.trim() }
    }));
    setInput("");
    // Scroll to collections
    const el = document.getElementById("collections");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (mode === "search") {
      handleSearch(input);
      return;
    }

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-8).concat(userMsg);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.text,
          products: data.products
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddProduct = (product: Product) => {
    window.dispatchEvent(new CustomEvent("add-pre-selection-trigger", {
      detail: {
        collection: {
          id: product.id,
          name: product.name,
          category: product.category,
          finish: product.finish,
          colorGroup: product.colorGroup,
          sizeAndFormat: product.sizeAndFormat,
          specs: product.specs,
          productPhotoUrl: product.productPhotoUrl,
          backgroundGradient: product.backgroundGradient,
          inStock: product.inStock,
          brand: "", collection: "", colors: [], applications: [],
          formats: [], finishAndFeel: product.finish, visualLook: "",
          specificMaterialStyle: "", thickness: "", origin: "European",
          unit: "SqFt", sqFtPerBox: null, stockQuantities: null, price: null,
          description: product.name
        }
      }
    }));
  };

  const placeholder = mode === "search"
    ? "Search tiles — or ask TileAI anything..."
    : "Ask TileAI about finishes, sizes, applications...";

  return (
    <>
      {/* Floating trigger button — bottom left */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="fixed bottom-6 left-6 z-40 bg-[#1C1A17] hover:bg-[#2a2824] text-white px-4 py-3 rounded-sm shadow-2xl flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles size={14} className="text-[#f39b34]" />
          <span className="text-xs font-bold uppercase tracking-widest font-sans">TileAI</span>
          {preSelectedSlabs.length > 0 && (
            <span className="bg-[#f39b34] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
              {preSelectedSlabs.length} selected
            </span>
          )}
        </button>
      )}

      {/* Main TileAI panel */}
      {isOpen && (
        <div className={`fixed bottom-6 left-6 z-50 w-[380px] bg-[#1C1A17] rounded-sm shadow-2xl flex flex-col transition-all duration-200 ${isMinimized ? "h-12" : "h-[520px]"}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles size={13} className="text-[#f39b34]" />
              <span className="text-white text-xs font-bold uppercase tracking-widest font-sans">TileAI</span>
              {preSelectedSlabs.length > 0 && (
                <button
                  onClick={handleFindSimilar}
                  disabled={isFindingSimilar}
                  className="bg-[#f39b34]/20 hover:bg-[#f39b34]/30 text-[#f39b34] text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isFindingSimilar ? "Finding..." : `Find similar to ${preSelectedSlabs.length} selected`}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(m => !m)}
                className="text-white/40 hover:text-white/80 p-1 cursor-pointer transition-colors"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white/80 p-1 cursor-pointer transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Mode toggle */}
              <div className="flex border-b border-white/10 flex-shrink-0">
                <button
                  onClick={() => setMode("search")}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${mode === "search" ? "text-[#f39b34] border-b-2 border-[#f39b34]" : "text-white/40 hover:text-white/60"}`}
                >
                  <Search size={11} />
                  <span>Search</span>
                </button>
                <button
                  onClick={() => setMode("chat")}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${mode === "chat" ? "text-[#f39b34] border-b-2 border-[#f39b34]" : "text-white/40 hover:text-white/60"}`}
                >
                  <Sparkles size={11} />
                  <span>Ask TileAI</span>
                </button>
              </div>

              {/* Messages (chat mode) */}
              {mode === "chat" && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Sparkles size={20} className="text-[#f39b34] mx-auto mb-3" />
                      <p className="text-white/50 text-xs font-sans leading-relaxed">
                        Ask me about finishes, sizes, applications, or let me find tiles similar to your selections.
                      </p>
                      {preSelectedSlabs.length > 0 && (
                        <button
                          onClick={handleFindSimilar}
                          className="mt-4 bg-[#f39b34] text-black text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-sm cursor-pointer hover:bg-[#e28b24] transition-colors"
                        >
                          Find similar to my {preSelectedSlabs.length} selection{preSelectedSlabs.length > 1 ? "s" : ""}
                        </button>
                      )}
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] ${msg.role === "user" ? "bg-[#f39b34] text-black" : "bg-white/10 text-white"} rounded-sm px-3 py-2`}>
                        <p className="text-xs font-sans leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        {msg.products && msg.products.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {msg.products.slice(0, 3).map(p => (
                              <div key={p.id} className="flex items-center space-x-2 bg-white/10 rounded-sm p-1.5">
                                <div
                                  className="w-8 h-8 rounded-sm flex-shrink-0 bg-cover bg-center"
                                  style={p.productPhotoUrl
                                    ? { backgroundImage: `url(${p.productPhotoUrl})` }
                                    : { background: p.backgroundGradient }
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-bold text-white truncate">{p.name}</p>
                                  <p className="text-[8px] text-white/50">{p.specs}</p>
                                </div>
                                <button
                                  onClick={() => handleAddProduct(p)}
                                  className="text-[8px] bg-[#f39b34] text-black font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 cursor-pointer hover:bg-[#e28b24] transition-colors"
                                >
                                  + Add
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(isLoading || isFindingSimilar) && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 rounded-sm px-3 py-2">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-[#f39b34] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Search results hint (search mode) */}
              {mode === "search" && (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <Search size={24} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-xs font-sans leading-relaxed">
                      Type to filter the catalog below, or switch to Ask TileAI for recommendations.
                    </p>
                    {preSelectedSlabs.length > 0 && (
                      <button
                        onClick={handleFindSimilar}
                        className="mt-4 bg-[#f39b34]/20 hover:bg-[#f39b34]/30 text-[#f39b34] text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-sm cursor-pointer transition-colors"
                      >
                        Auto-filter similar to selections
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-white/10 p-3 flex-shrink-0">
                <div className="flex items-center space-x-2 bg-white/8 border border-white/15 rounded-sm px-3 py-2">
                  {mode === "search" ? (
                    <Search size={13} className="text-white/40 flex-shrink-0" />
                  ) : (
                    <Sparkles size={13} className="text-[#f39b34] flex-shrink-0" />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white text-xs font-sans outline-none placeholder-white/30"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="text-[#f39b34] disabled:text-white/20 cursor-pointer disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Send size={13} />
                  </button>
                </div>
                <p className="text-white/20 text-[9px] mt-1.5 text-center font-sans">
                  {mode === "search" ? "Enter to filter catalog · Switch to Ask TileAI for recommendations" : "Powered by Italgres catalog · " + new Date().getFullYear()}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
