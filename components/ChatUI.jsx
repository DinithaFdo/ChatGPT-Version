"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Session management helpers
function getAllSessions() {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("chat_sessions");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveSession(sessionId, preview = "") {
  if (typeof window === "undefined") return;
  const sessions = getAllSessions();
  const existing = sessions.find((s) => s.id === sessionId);

  if (!existing) {
    sessions.unshift({
      id: sessionId,
      preview: preview || "New conversation",
      timestamp: Date.now(),
    });
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  } else if (preview && preview !== existing.preview) {
    existing.preview = preview;
    existing.timestamp = Date.now();
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  }
}

function setCurrentSession(sessionId) {
  if (typeof window === "undefined") return;
  localStorage.setItem("chat_session_id", sessionId);
}

function getCurrentSession() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("chat_session_id") || "";
}

function createNewSession() {
  if (typeof window === "undefined") return "";
  const newId = uuidv4();
  setCurrentSession(newId);
  saveSession(newId);
  return newId;
}

export default function ChatUI() {
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    let currentId = getCurrentSession();
    if (!currentId) {
      currentId = createNewSession();
    } else {
      saveSession(currentId);
    }
    setSessionId(currentId);
    setSessions(getAllSessions());
  }, []);

  // Load chat history when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/chat?sessionId=${encodeURIComponent(sessionId)}`,
        );
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          // Update session preview with first user message
          const firstUserMsg = data.messages.find((m) => m.role === "user");
          if (firstUserMsg) {
            saveSession(sessionId, firstUserMsg.text.slice(0, 50));
            setSessions(getAllSessions());
          }
        } else {
          // No history, show welcome message
          setMessages([
            {
              role: "model",
              text: "Hi! I'm your Gemini-powered assistant. Ask me anything.",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        // Show welcome message on error
        setMessages([
          {
            role: "model",
            text: "Hi! I'm your Gemini-powered assistant. Ask me anything.",
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleNewChat() {
    const newId = createNewSession();
    setSessionId(newId);
    setSessions(getAllSessions());
    setMessages([]);
    setError("");
  }

  function handleSwitchSession(id) {
    if (id === sessionId) return;
    setCurrentSession(id);
    setSessionId(id);
    setShowSidebar(false);
    setError("");
  }

  async function sendMessage(e) {
    e.preventDefault();
    setError("");

    const trimmed = input.trim();
    if (!trimmed || isTyping || !sessionId) return;

    // Optimistic UI
    const userMsg = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Save session preview with first message
    if (messages.length <= 1) {
      saveSession(sessionId, trimmed.slice(0, 50));
      setSessions(getAllSessions());
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Request failed.");
      }

      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setError(err?.message || "Something went wrong.");
      // Show a helpful assistant message (optional)
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "I ran into an issue sending that. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4">
      {/* Sidebar */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            + New Chat
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-73px)]">
          {sessions.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No previous chats
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSwitchSession(session.id)}
                className={`w-full px-4 py-3 text-left text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  session.id === sessionId ? "bg-gray-100" : ""
                }`}
              >
                <div className="font-medium text-gray-900 truncate">
                  {session.preview}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(session.timestamp).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle sidebar"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
              <p className="text-xs text-gray-500">
                Session:{" "}
                <span className="font-mono">{sessionId || "loading..."}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="Start new chat"
            >
              New Chat
            </button>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              Gemini 2.5 Flash
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-4 overflow-y-auto max-h-[70dvh] space-y-3">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <span className="text-sm text-gray-500">
                Loading chat history...
              </span>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      isUser
                        ? "bg-gray-900 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md",
                    ].join(" ")}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-700 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:120ms]" />
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:240ms]" />
                  <span className="ml-2">Typing…</span>
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t border-gray-200 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="rounded-xl px-4 py-3 text-sm font-medium bg-gray-900 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
