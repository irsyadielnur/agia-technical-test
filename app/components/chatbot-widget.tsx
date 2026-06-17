"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface TypewriterTextProps {
  text: string;
  isStreaming: boolean;
  onParse: (text: string) => React.ReactNode;
}

function TypewriterText({ text, isStreaming, onParse }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (!isStreaming && displayedText === text) {
      return;
    }

    const intervalId = setInterval(() => {
      const target = textRef.current;
      setDisplayedText((prev) => {
        if (prev === target) {
          if (!isStreaming) {
            clearInterval(intervalId);
          }
          return prev;
        }

        if (target.startsWith(prev)) {
          const remaining = target.substring(prev.length);
          if (!remaining) return prev;

          const nextWordMatch = remaining.match(/^(\s*\S+)/);
          if (nextWordMatch) {
            return prev + nextWordMatch[1];
          }
          return target;
        } else {
          return target.substring(0, Math.min(prev.length + 5, target.length));
        }
      });
    }, 30);

    return () => clearInterval(intervalId);
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) {
      const timeout = setTimeout(() => {
        setDisplayedText(text);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isStreaming, text]);

  return <>{onParse(displayedText || text)}</>;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "bot",
      text: "Halo! Selamat datang di UNEEYA. Saya adalah asisten virtual Anda. Ada yang bisa saya bantu hari ini? 😊",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [productsCatalog, setProductsCatalog] = useState<any[]>([]);

  // Chat session states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const generateGuestId = () => {
    if (typeof window !== "undefined") {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return crypto.randomUUID();
      }
      return (
        "guest-" +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36)
      );
    }
    return "";
  };

  const setDefaultWelcome = () => {
    setMessages([
      {
        id: "initial",
        sender: "bot",
        text: "Halo! Selamat datang di UNEEYA. Saya adalah asisten virtual Anda. Ada yang bisa saya bantu hari ini? 😊",
        timestamp: new Date(),
      },
    ]);
  };

  const loadChatHistory = async (uId: string | null, gId: string | null) => {
    try {
      const res = await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uId, guestId: gId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          if (data.messages && data.messages.length > 0) {
            const restored = data.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }));
            setMessages(restored);
          } else {
            setDefaultWelcome();
          }
        } else {
          setSessionId(null);
          setDefaultWelcome();
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const handleNewChat = () => {
    if (window.confirm("Apakah Anda ingin memulai obrolan baru?")) {
      setSessionId(null);
      setDefaultWelcome();
    }
  };

  // Load products and initialize chat history
  useEffect(() => {
    // Load products
    supabase
      .from("products")
      .select("*, product_images(image_url)")
      .then(({ data, error }) => {
        if (error) console.error("Error loading chat catalog:", error);
        if (data) setProductsCatalog(data);
      });

    // Initialize guest session and auth check
    let gId = localStorage.getItem("uneeya_chat_guest_id");
    if (!gId) {
      gId = generateGuestId();
      localStorage.setItem("uneeya_chat_guest_id", gId);
    }
    setGuestId(gId);

    const checkUserAndLoadHistory = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      await loadChatHistory(currentUserId, gId);
    };

    checkUserAndLoadHistory();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);

      let currentGuestId = localStorage.getItem("uneeya_chat_guest_id");
      if (!currentGuestId) {
        currentGuestId = generateGuestId();
        localStorage.setItem("uneeya_chat_guest_id", currentGuestId);
      }
      setGuestId(currentGuestId);
      await loadChatHistory(currentUserId, currentGuestId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Parser helper to support simple markdown links like [text](url)
  // Parser helper to support inline markdown formatting: links [text](url), bold **text**, and italic *text*
  const parseInlineMarkdown = (text: string) => {
    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const index = match.index;
      const fullMatch = match[0];

      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }

      if (match[1]) {
        // Bold
        parts.push(
          <strong key={"b-" + index} className="font-extrabold text-brand-text">
            {match[2]}
          </strong>,
        );
      } else if (match[3]) {
        // Italic / Semi-bold
        parts.push(
          <span key={"i-" + index} className="font-semibold text-gray-800">
            {match[4]}
          </span>,
        );
      } else if (match[5]) {
        // Link
        parts.push(
          <a
            key={"l-" + index}
            href={match[7]}
            className="underline font-bold hover:text-black transition-colors text-brand-text"
          >
            {match[6]}
          </a>,
        );
      }

      lastIndex = index + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Parser helper to support multiline formatting, lists, links, and text formatting
  const parseMessageText = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, lineIdx) => {
      // Match list markers: * or - followed by a space
      const bulletMatch = line.match(/^(\s*)([*\-])\s+(.*)$/);
      let content = line;
      let isBullet = false;

      if (bulletMatch) {
        content = bulletMatch[3];
        isBullet = true;
      }

      const parsedElements = parseInlineMarkdown(content);

      if (isBullet) {
        return (
          <div
            key={lineIdx}
            className="flex items-start gap-1.5 ml-2 mt-0.5 mb-0.5"
          >
            <span className="text-brand-secondary font-bold shrink-0">•</span>
            <span className="flex-1">{parsedElements}</span>
          </div>
        );
      } else {
        return (
          <p key={lineIdx} className={line.trim() === "" ? "h-2" : "mb-1"}>
            {parsedElements}
          </p>
        );
      }
    });
  };

  // Format IDR Price Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Strip recommended tags from message bubble text
  const cleanMessageText = (text: string) => {
    const lowerText = text.toLowerCase();

    // Hide as soon as "[recommended" or "recommended_ids" starts appearing
    const matchPatterns = ["[recommended", "recommended_ids"];
    for (const pattern of matchPatterns) {
      const index = lowerText.indexOf(pattern);
      if (index !== -1) {
        let sliceIndex = index;
        if (sliceIndex > 0 && text[sliceIndex - 1] === "[") {
          sliceIndex--;
        }
        return text.substring(0, sliceIndex).trim();
      }
    }
    return text.trim();
  };

  // Parse recommended product IDs and get product objects from catalog (with name matching fallback)
  const getRecommendedProducts = (text: string) => {
    const matchedProductsMap = new Map<string, any>();

    // 1. Match by RECOMMENDED_IDS tag (case-insensitive & flexible formatting)
    const tagRegex =
      /(?:\[)?RECOMMENDED_IDS(?:\s*\])?\s*:?\s*([a-zA-Z0-9\s,\-_<>'"'`\[\]]+)(?:\])?/i;
    const match = text.match(tagRegex);
    if (match) {
      const ids = match[1]
        .split(",")
        .map((id) => id.trim().replace(/^<|>|'|"|`|\[|\]/g, ""));

      productsCatalog.forEach((p) => {
        if (ids.includes(p.id)) {
          matchedProductsMap.set(p.id, p);
        }
      });
    }

    // 2. Match by product names mentioned in the text (case-insensitive, supports split names)
    if (productsCatalog.length > 0) {
      const lowerText = text.toLowerCase();
      productsCatalog.forEach((product) => {
        if (!product.name) return;

        // Split name by common dividers to handle alternative titles (like "Aestra Wallet || Dompet...")
        const subNames = product.name
          .split(/(?:\|\||\||\/|\(|\)|\[|\]|-)/)
          .map((part: string) => part.trim())
          .filter((part: string) => part.length >= 3);

        // Include full name if not already present
        if (
          !subNames.some(
            (sn: string) => sn.toLowerCase() === product.name.toLowerCase(),
          )
        ) {
          subNames.push(product.name.trim());
        }

        const isMentioned = subNames.some((subName: string) => {
          const lowerSub = subName.toLowerCase();

          // If name is very short, do word boundary check to avoid false positives (e.g. "tas" matching in "kertas")
          if (lowerSub.length <= 4) {
            const escapedSub = lowerSub.replace(
              /[-\/\\^$*+?.()|[\]{}]/g,
              "\\$&",
            );
            const regex = new RegExp(`\\b${escapedSub}\\b`, "i");
            return regex.test(text);
          }
          return lowerText.includes(lowerSub);
        });

        if (isMentioned) {
          matchedProductsMap.set(product.id, product);
        }
      });
    }

    // Limit to max 5 recommended products
    return Array.from(matchedProductsMap.values()).slice(0, 5);
  };

  // Send message to Next.js Gemini API stream
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: inputText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          userId,
          guestId,
          sessionId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Gagal menghubungi asisten virtual.");
      }

      const returnedSessionId = response.headers.get("x-session-id");
      if (returnedSessionId && returnedSessionId !== sessionId) {
        setSessionId(returnedSessionId);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";

      const botMessageId = `msg-bot-${Date.now()}`;

      // Append a placeholder bot message
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          sender: "bot",
          text: "",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);

      // Stream the response chunks in real-time
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        botText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: botText } : msg,
          ),
        );
      }
      setIsStreaming(false);
    } catch (err) {
      console.error("Chat error:", err);
      const botErrorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        sender: "bot",
        text: "Maaf, terjadi gangguan koneksi dengan asisten virtual. Silakan coba kirim ulang pesan Anda.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botErrorMessage]);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className={`fixed z-50 ${
      isOpen 
        ? "inset-0 sm:inset-auto sm:bottom-6 sm:right-6" 
        : "bottom-6 right-4 sm:bottom-6 sm:right-6"
    }`}>
      <AnimatePresence mode="wait">
        {/* Toggle Floating Button (shows only when chat is closed) */}
        {!isOpen && (
          <motion.button
            key="chat-btn"
            id="chatbot-toggle-button"
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.05,
            }}
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.0 }}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-brand-text text-white hover:bg-brand-secondary hover:text-brand-text shadow-xl hover:shadow-brand-secondary/20 transition-transform duration-300 cursor-pointer group"
          >
            <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
          </motion.button>
        )}

        {/* Chatbot Form Panel Container */}
        {isOpen && (
          <motion.div
            key="chat-container"
            id="chatbot-container"
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full sm:w-[380px] h-full sm:h-[550px] sm:max-h-[600px] bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-gray-150 flex flex-col overflow-hidden relative"
          >
            {/* Chatbot Header */}
            <div className="bg-linear-to-r from-brand-text to-[#1d2939] text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                {/* Bot Avatar indicator */}
                <div className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                  <Bot className="w-5 h-5 text-brand-secondary" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-brand-text">
                    <span className="animate-ping absolute top-0 left-0 inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">UNEEYA AI</span>
                    <Sparkles className="w-3.5 h-3.5 text-brand-tertiary" />
                  </div>
                  <span className="text-[10px] text-gray-400 block font-medium">
                    Asisten Bot • Aktif
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* New Chat button */}
                <button
                  onClick={handleNewChat}
                  title="Mulai obrolan baru"
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10 text-[10px] font-semibold flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-brand-tertiary" />
                  <span>Obrolan Baru</span>
                </button>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  id="chatbot-close-button"
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10"
                  aria-label="Tutup chatbot"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Message Lists (Creamy light background matching globals.css theme) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcfcf0]">
              {messages.map((msg, idx) => {
                const recProducts = getRecommendedProducts(msg.text);
                const cleanedText = cleanMessageText(msg.text);

                return (
                  <div key={msg.id} className="space-y-2">
                    <div
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-brand-secondary text-brand-text rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-xs"
                            : "bg-white text-brand-text border border-gray-100 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-xs"
                        }`}
                      >
                        <div className="whitespace-pre-wrap flex flex-col gap-0.5">
                          {msg.sender === "bot" && idx === messages.length - 1 ? (
                            <TypewriterText
                              text={cleanedText}
                              isStreaming={isStreaming || msg.text === ""}
                              onParse={parseMessageText}
                            />
                          ) : (
                            parseMessageText(cleanedText)
                          )}
                        </div>
                        <span
                          className={`text-[8px] mt-1 block text-right font-medium opacity-60 ${
                            msg.sender === "user"
                              ? "text-brand-text"
                              : "text-gray-450"
                          }`}
                        >
                          {msg.timestamp.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Render Recommendation Cards directly inside the chat flow if available */}
                    {msg.sender === "bot" && recProducts.length > 0 && (
                      <div className="flex justify-start pl-2">
                        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 w-full max-w-[85%] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent shrink-0">
                          {recProducts.map((product) => (
                            <Link
                              href={`/catalog/${product.id}`}
                              key={product.id}
                              onClick={() => setIsOpen(false)} // close chatbot when navigating
                              className="w-32 shrink-0 bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer group/card"
                            >
                              <div className="relative h-20 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border-b border-gray-100">
                                <img
                                  src={
                                    product.product_images?.[0]?.image_url ||
                                    product.image_url ||
                                    "https://dummyimage.com/150x150/ccc/000&text=No+Image"
                                  }
                                  alt={product.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                                />
                              </div>
                              <div className="p-2 flex flex-col justify-between flex-1 min-h-[64px]">
                                <div>
                                  <h5 className="text-[9px] font-bold text-gray-800 line-clamp-1 group-hover/card:text-brand-secondary transition-colors">
                                    {product.name}
                                  </h5>
                                  <span className="text-[9px] font-extrabold text-gray-955 block mt-0.5">
                                    {formatIDR(product.price)}
                                  </span>
                                </div>
                                <span className="text-[8px] font-bold text-brand-secondary group-hover/card:text-brand-secondary/80 mt-1.5 block">
                                  Detail &rarr;
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bot Loading / Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 text-brand-text max-w-[75%] px-4 py-3 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                id="chatbot-input-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik pesan di sini..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent transition-all placeholder-gray-400 text-brand-text"
                disabled={isLoading}
              />
              <button
                type="submit"
                id="chatbot-send-button"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-2xl bg-brand-text text-white hover:bg-brand-secondary hover:text-brand-text transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-400 hover:scale-105 active:scale-100 cursor-pointer shadow-md shadow-gray-100 shrink-0"
                aria-label="Kirim pesan"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
