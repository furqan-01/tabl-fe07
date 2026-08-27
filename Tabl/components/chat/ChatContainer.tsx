'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Square,
  RefreshCw,
  AlertCircle,
  X,
  Bot,
  User,
  Info,
  ArrowDown,
  Trash2,
  Check,
  Plus,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status?: 'thinking' | 'streaming' | 'complete' | 'stopped';
  createdAt?: Date;
}

interface ChatContainerProps {
  onClose?: () => void;
  onAddToCartItemName?: (itemName: string) => void;
}

const QUICK_SUGGESTIONS = [
  '🥗 Vegetarian under Rs. 1000',
  '🏷️ Current Deals & Combos',
  '🌶️ Mild spice recommendations',
  '🌿 Vegan & Gluten-Free options',
  '💳 How do I pay for my order?',
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    content:
      "👋 Hello! I am your **Tabl Concierge**.\n\nI have real-time access to our live kitchen catalog, active deals, ingredient allergens, and spice levels. Ask me for recommendations within your budget, dietary options, or dish availability!",
    status: 'complete',
  },
];

/**
 * Sanitizes in-flight streaming markdown so unclosed code fences or dangling
 * asterisks do not glitch or jump visually while tokens are streaming.
 */
function sanitizeStreamingMarkdown(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // If there's an unclosed code block (odd number of ```), close it temporarily
  const codeBlockMatches = sanitized.match(/```/g);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    sanitized += '\n```';
  }

  // If it ends on a single dangling asterisk or underscore mid-token, trim for clean render
  if (sanitized.endsWith('***') || sanitized.endsWith('**') || sanitized.endsWith('*')) {
    // Keep as is or let ReactMarkdown parse cleanly
  }

  return sanitized;
}

export default function ChatContainer({
  onClose,
  onAddToCartItemName,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tabl_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((m: ChatMessage) => ({
              ...m,
              status:
                m.status === 'streaming' || m.status === 'thinking'
                  ? 'complete'
                  : (m.status || 'complete'),
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load chat history from localStorage', e);
      }
    }
    return INITIAL_MESSAGES;
  });
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewStreamContentWhileScrolled, setHasNewStreamContentWhileScrolled] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantMsgIdRef = useRef<string | null>(null);

  // Auto-focus input and scroll to bottom on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (messages && messages.length > 0) {
        const serializable = messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          status:
            m.status === 'streaming' || m.status === 'thinking'
              ? 'complete'
              : (m.status || 'complete'),
          createdAt: m.createdAt,
        }));
        localStorage.setItem('tabl_chat_history', JSON.stringify(serializable));
      }
    } catch (e) {
      console.error('Failed to save chat history to localStorage', e);
    }
  }, [messages]);

  // Lock body scroll on mobile/desktop when assistant drawer is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Scroll Detection:
   * 1. Pin to bottom ONLY while user is already at the bottom (threshold <= 40px).
   * 2. The moment they scroll up, release the pin immediately.
   * 3. Clear new incoming stream alert when user reaches the bottom.
   */
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = distanceToBottom <= 40;

    isAtBottomRef.current = isAtBottom;
    setShowScrollToBottom(!isAtBottom);

    if (isAtBottom) {
      setHasNewStreamContentWhileScrolled(false);
    }
  }, []);

  /**
   * Smooth Jump to bottom
   */
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });

    isAtBottomRef.current = true;
    setShowScrollToBottom(false);
    setHasNewStreamContentWhileScrolled(false);
  }, []);

  /**
   * Core stream consumer
   */
  const sendMessageStream = async (conversationHistory: ChatMessage[]) => {
    setIsGenerating(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Generate assistant placeholder with 'thinking' status
    const assistantMessageId = `asst-${Date.now()}`;
    currentAssistantMsgIdRef.current = assistantMessageId;

    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      status: 'thinking',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    // Ensure we start pinned to bottom when user sends a new message
    isAtBottomRef.current = true;
    setShowScrollToBottom(false);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const payloadMessages = conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: payloadMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorText = 'The assistant is currently busy. Please try again.';
        try {
          const errData = await response.json();
          if (typeof errData.error === 'string') {
            errorText = errData.error;
          } else if (errData.error?.message) {
            errorText = typeof errData.error.message === 'string' ? errData.error.message : JSON.stringify(errData.error.message);
          }
        } catch {
          // Ignore parse failure
        }
        throw new Error(errorText);
      }

      if (!response.body) {
        throw new Error('Response stream unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let hasReceivedFirstToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        accumulatedText += chunkText;

        if (!hasReceivedFirstToken && accumulatedText.trim().length > 0) {
          hasReceivedFirstToken = true;
        }

        // Update assistant message state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: accumulatedText,
                  status: 'streaming',
                }
              : msg
          )
        );

        // Auto-scroll robustness:
        // 1. If user is at bottom, maintain pin to bottom.
        // 2. If user scrolled up, DO NOT jump their scroll position, and flag new stream content.
        if (isAtBottomRef.current) {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
        } else {
          setHasNewStreamContentWhileScrolled(true);
        }
      }

      // Mark message as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                status: 'complete',
              }
            : msg
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[ChatContainer] Generation stopped by user.');
        // Update state to stopped, preserving whatever partial text was streamed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  status: 'stopped',
                }
              : msg
          )
        );
      } else {
        console.error('[ChatContainer] Streaming error:', err);
        setError(err.message || 'Failed to receive assistant response');
        // If no content was received at all, clean up the empty placeholder
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId || msg.content.length > 0)
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      currentAssistantMsgIdRef.current = null;
      // Re-enable and focus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /**
   * Stop generation handler (State Problem Solved)
   * After stopping:
   * 1. The partial message persists in history
   * 2. The input immediately re-enables and focuses
   * 3. Next send works seamlessly
   */
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    if (currentAssistantMsgIdRef.current) {
      const stoppedId = currentAssistantMsgIdRef.current;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === stoppedId ? { ...msg, status: 'stopped' } : msg
        )
      );
      currentAssistantMsgIdRef.current = null;
    }

    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      status: 'complete',
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    await sendMessageStream(newMessages);
  };

  const handleSuggestionClick = async (suggestionText: string) => {
    if (isGenerating) return;

    const cleanText = suggestionText.replace(/^[^\w\s]+\s*/, ''); // strip leading emoji
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanText,
      status: 'complete',
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    await sendMessageStream(newMessages);
  };

  const handleRetry = async () => {
    if (messages.length === 0 || isGenerating) return;
    setError(null);

    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const actualIdx = messages.length - 1 - lastUserIdx;
    const conversationUpToLastUser = messages.slice(0, actualIdx + 1);
    setMessages(conversationUpToLastUser);

    await sendMessageStream(conversationUpToLastUser);
  };

  const handleClearHistory = () => {
    if (isGenerating) handleStop();
    try {
      localStorage.removeItem('tabl_chat_history');
    } catch (e) {
      console.error('Failed to clear chat history from localStorage', e);
    }
    setMessages(INITIAL_MESSAGES);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /**
   * Streaming-Aware Markdown Renderer
   */
  const renderMessageContent = (message: ChatMessage) => {
    const isStreaming = message.status === 'streaming';
    const isStopped = message.status === 'stopped';
    const cleanContent = sanitizeStreamingMarkdown(message.content);

    return (
      <div className="text-sm leading-relaxed text-gray-900 break-words space-y-2">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h3 className="font-bold text-gray-950 text-base mt-2 mb-1">{children}</h3>,
            h2: ({ children }) => <h3 className="font-bold text-gray-950 text-sm mt-2 mb-1">{children}</h3>,
            h3: ({ children }) => <h4 className="font-bold text-gray-900 text-sm mt-2 mb-1">{children}</h4>,
            h4: ({ children }) => <h5 className="font-semibold text-gray-900 text-xs mt-1.5 mb-1">{children}</h5>,
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm text-gray-800">{children}</p>,
            ul: ({ children }) => <ul className="space-y-1.5 my-2 list-none pl-0">{children}</ul>,
            ol: ({ children }) => <ol className="space-y-1.5 my-2 list-decimal pl-4 text-sm text-gray-800">{children}</ol>,
            li: ({ children }) => (
              <li className="flex items-start gap-2 text-sm text-gray-800 my-1">
                <span className="text-amber-500 font-bold select-none mt-0.5 shrink-0">•</span>
                <span className="flex-1 min-w-0">{children}</span>
              </li>
            ),
            strong: ({ children }) => <strong className="font-bold text-gray-950">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
            hr: () => <hr className="my-2.5 border-gray-200" />,
            code: ({ children }) => (
              <code className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-xs text-gray-800 border border-gray-200">
                {children}
              </code>
            ),
          }}
        >
          {cleanContent}
        </ReactMarkdown>

        {/* Live typing pulse cursor while streaming */}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-gray-800 ml-1 animate-pulse align-middle" />
        )}

        {/* Stopped indicator note */}
        {isStopped && (
          <div className="mt-2 text-[11px] font-medium text-gray-400 italic">
            (Response paused by user)
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="smart-menu-concierge-sidebar"
      className="flex flex-col h-full max-h-full w-full bg-white text-gray-900 select-text overflow-hidden"
    >
      {/* Concierge Header Bar */}
      <header
        id="concierge-header"
        className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 bg-gray-900 text-white shrink-0"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="concierge-title" className="text-sm font-bold text-white tracking-tight truncate">
                Tabl Concierge
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Kitchen
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">Dietary & Menu AI Advisor</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            id="concierge-clear-history-btn"
            onClick={handleClearHistory}
            title="Reset conversation"
            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              id="concierge-close-btn"
              onClick={onClose}
              aria-label="Close concierge"
              className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area with Pin-to-Bottom Auto-scroll */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="concierge-messages-list"
  className="flex-1 min-h-0 h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50/60 chat-scroll-area relative"
  style={{ overflow: "scroll" }} >

        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isThinking = m.status === 'thinking' && !m.content;

          return (
            <article
              key={m.id}
              id={`chat-message-${m.id}`}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4 text-gray-800" />}
              </div>

              {/* Message Bubble with Smooth Thinking-to-Token Handoff */}
              <div
                className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-2xs break-words overflow-hidden ${
                  isUser
                    ? 'bg-gray-900 text-white rounded-tr-xs'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                ) : isThinking ? (
                  /* Thinking wave indicator seamlessly in place */
                  <div className="flex items-center gap-2 py-0.5">
                    <div className="flex space-x-1.5 items-center">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium ml-1">
                      Consulting live kitchen menu & deals...
                    </span>
                  </div>
                ) : (
                  renderMessageContent(m)
                )}
              </div>
            </article>
          );
        })}

        {/* Error State Banner with Retry */}
        {error && (
          <div
            id="concierge-error-banner"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Response interrupted</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
            <button
              type="button"
              id="concierge-retry-btn"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-2xs shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Floating Jump to Bottom Affordance when user scrolls away */}
        {showScrollToBottom && (
          <div className="sticky bottom-2 flex justify-center z-20 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              id="jump-to-bottom-btn"
              onClick={() => scrollToBottom(true)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg transition-all hover:scale-105 ${
                hasNewStreamContentWhileScrolled
                  ? 'bg-amber-500 text-gray-950 hover:bg-amber-400 ring-2 ring-amber-400/50'
                  : 'bg-gray-900/95 hover:bg-gray-900 text-white backdrop-blur-xs'
              }`}
            >
              {hasNewStreamContentWhileScrolled ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-950 animate-ping" />
                  <span>New updates • Jump to bottom</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Jump to bottom</span>
                  <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Suggested Quick Inquiries - Clean Wrap Pills without awkward scrollbar */}
      <section
        id="concierge-suggestions"
        aria-label="Quick suggestions"
        className="flex-shrink-0 px-3 py-2 bg-gray-50 border-t border-gray-200/80 flex flex-wrap items-center gap-1.5 max-h-[85px] overflow-y-auto no-scrollbar"
      >
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 whitespace-nowrap pl-1 pr-1">
          Suggestions:
        </span>
        {QUICK_SUGGESTIONS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isGenerating}
            onClick={() => handleSuggestionClick(chip)}
            className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors whitespace-nowrap shadow-2xs disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            {chip}
          </button>
        ))}
      </section>

      {/* Input Area with Working Stop Button and Resilient Send */}
      <footer id="concierge-input-area" className="flex-shrink-0 p-3.5 bg-white border-t border-gray-200">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            id="concierge-input-field"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? 'Tabl Concierge is answering...'
                : 'Ask about dishes, deals, dietary options, or price...'
            }
            className="flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-colors shadow-2xs"
          />

          {/* Dedicated Working Stop Button during generation, otherwise Send Button */}
          {isGenerating ? (
            <button
              type="button"
              id="concierge-stop-btn"
              onClick={handleStop}
              className="inline-flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xs shrink-0 font-semibold text-xs animate-in fade-in"
              title="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              id="concierge-send-btn"
              disabled={!input.trim() || isGenerating}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors shadow-xs disabled:opacity-40 disabled:pointer-events-none shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-gray-400" />
            Live sync with kitchen inventory
          </span>
          <span>Press Enter to send</span>
        </div>
      </footer>
    </div>
  );
}
