"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Calendar,
  User,
  Search,
  RefreshCw,
  Bot,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface SessionData {
  id: string;
  userId: string | null;
  guestId: string | null;
  role: string;
  username: string;
  createdAt: string;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function AdminChatView() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "user" | "guest">("all");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/chat-sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error loading chat sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSessionMessages = async (sessId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/chat-sessions?sessionId=${sessId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error loading session messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionMessages(selectedSessionId);
    } else {
      setMessages([]);
    }
  }, [selectedSessionId]);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.guestId &&
        s.guestId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.userId && s.userId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterType === "user") {
      return matchesSearch && s.userId !== null;
    }
    if (filterType === "guest") {
      return matchesSearch && s.userId === null;
    }
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Master List (Sessions Panel) */}
      <div className="w-[380px] bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-xs shrink-0">
        {/* Search & Header */}
        <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Riwayat Sesi</h2>
            <button
              onClick={fetchSessions}
              className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer border border-gray-100"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Filter Type tabs */}
          <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-150">
            {(["all", "user", "guest"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                  filterType === type
                    ? "bg-white text-gray-800 shadow-xs border border-gray-100"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {type === "all"
                  ? "Semua"
                  : type === "user"
                    ? "Registered"
                    : "Guest"}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
          {loadingSessions ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-gray-800" />
              <span>Memuat Sesi...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-xs">
              Tidak ada sesi obrolan ditemukan.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = selectedSessionId === session.id;
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer group/item ${
                    isSelected
                      ? "bg-gray-900 text-white border border-gray-900"
                      : "hover:bg-gray-50 border border-transparent text-gray-700"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected
                        ? "bg-white/10 text-white"
                        : "bg-gray-50 text-gray-500 group-hover/item:bg-gray-100"
                    }`}
                  >
                    <MessageSquare size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span
                        className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md ${
                          session.userId
                            ? isSelected
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-emerald-50 text-emerald-700"
                            : isSelected
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {session.userId ? "Registered" : "Guest"}
                      </span>
                      <span
                        className={`text-[9px] ${isSelected ? "text-gray-400" : "text-gray-400"}`}
                      >
                        {session.messageCount} pesan
                      </span>
                    </div>
                    <h4 className="text-xs font-bold truncate">
                      {session.username}
                    </h4>
                    <span
                      className={`text-[10px] flex items-center gap-1 mt-1 ${isSelected ? "text-gray-400" : "text-gray-400"}`}
                    >
                      <Calendar size={10} />
                      {formatDate(session.createdAt)}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity ${
                      isSelected ? "text-white" : "text-gray-400"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Pane (Conversation Transcript) */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-xs">
        {selectedSessionId ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                  Detail Percakapan
                </span>
                <h3 className="text-xs font-bold text-gray-800 truncate mt-0.5">
                  ID Sesi: {selectedSessionId}
                </h3>
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-800" />
                  <span>Memuat isi obrolan...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                  Sesi ini kosong (tidak ada pesan).
                </div>
              ) : (
                messages.map((msg) => {
                  const isBot = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${
                        isBot ? "justify-start" : "ml-auto justify-end"
                      }`}
                    >
                      {isBot && (
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center border border-gray-100 shrink-0 text-xs">
                          <Bot size={14} />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div
                          className={`px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                            isBot
                              ? "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-xs"
                              : "bg-gray-900 text-white rounded-2xl rounded-tr-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span
                          className={`text-[8px] block text-right font-medium text-gray-400`}
                        >
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      {!isBot && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200 shrink-0 text-xs">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageSquare size={40} className="text-gray-200 animate-pulse" />
            <p className="text-xs font-semibold">
              Pilih salah satu sesi di sebelah kiri untuk melihat riwayat
              percakapan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
