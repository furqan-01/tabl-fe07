'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { UIMessage } from 'ai';
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
  Search,
  Filter,
  Flame,
  Utensils,
  ShoppingBag,
} from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { MenuItem } from '@/types/restaurant';
import { QueryMenuItem, QueryMenuOutput } from '@/lib/ai/tools';

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

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "👋 Hello! I am your **Tabl Concierge**.\n\nI have real-time access to our live kitchen catalog, active deals, ingredient allergens, and spice levels. Ask me for recommendations within your budget, dietary options, or dish availability!",
      },
    ],
  },
];

/**
 * Sanitizes in-flight streaming markdown so unclosed code fences or dangling
 * asterisks do not glitch visually while tokens are streaming.
 */
function sanitizeStreamingMarkdown(text: string): string {
  if (!text) return '';
  let sanitized = text;
  const codeBlockMatches = sanitized.match(/```/g);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    sanitized += '\n```';
  }
  return sanitized;
}

/**
 * Helper to render spice level indicators
 */
function renderSpiceIndicator(level: number) {
  if (level === 0) return <span className="text-gray-500 text-[11px]">Mild / No Heat</span>;
  if (level === 1) return <span className="text-amber-600 text-[11px] font-medium">🌶️ Mild Spice</span>;
  if (level === 2) return <span className="text-orange-600 text-[11px] font-medium">🌶️🌶️ Medium</span>;
  return <span className="text-rose-600 text-[11px] font-semibold">🌶️🌶️🌶️ Hot</span>;
}

/**
 * Generative UI: Interactive Dish Card Component
 */
function DishCard({
  dish,
  onAddToCart,
}: {
  dish: QueryMenuItem;
  onAddToCart: (dish: QueryMenuItem) => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(dish);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      id={`generative-dish-${dish.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs hover:border-gray-900 hover:shadow-xs transition-all text-left"
    >
      <div className="space-y-1.5">
        {/* Top Badges & Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {dish.category || 'Mains'}
              </span>
              {dish.isVegan && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🌿 100% Vegan
                </span>
              )}
              {!dish.isVegan && dish.isVegetarian && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🌱 Vegetarian
                </span>
              )}
              {dish.isGlutenFree && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  🌾 Gluten-Free
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-gray-950 mt-1.5 group-hover:text-black leading-snug">
              {dish.name}
            </h4>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-sm font-extrabold text-gray-950 font-mono">
              Rs. {dish.price}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        {dish.description && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            {dish.description}
          </p>
        )}

        {/* Spice and Allergens meta */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500 border-t border-gray-100/80">
          <div>{renderSpiceIndicator(dish.spiceLevel ?? 0)}</div>
          {dish.allergens && dish.allergens.length > 0 && (
            <span className="text-[10px] text-gray-400 truncate max-w-[120px]" title={dish.allergens.join(', ')}>
              Allergens: {dish.allergens.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Working Add to Cart Button */}
      <div className="mt-3 pt-2">
        <button
          type="button"
          id={`add-to-cart-gen-${dish.id}`}
          onClick={handleAdd}
          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-semibold transition-all shadow-2xs ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-900 hover:bg-black text-white hover:scale-[1.01]'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added to Table Cart!</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Generative UI: Grid container for returned menu items
 */
function DishCardGrid({
  items,
  onAddToCart,
}: {
  items: QueryMenuItem[];
  onAddToCart: (dish: QueryMenuItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 my-2">
      {items?.map((dish) => (
        <DishCard key={dish.id} dish={dish} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}

/**
 * Generative UI: 4-State Lifecycle Machine Renderer for Tool Invocations
 */
function ToolInvocationRenderer({
  toolState,
  toolInput,
  toolOutput,
  errorText,
  onAddToCart,
  onResetFilters,
  onClose,
}: {
  toolState: string;
  toolInput: any;
  toolOutput?: QueryMenuOutput | any;
  errorText?: string;
  onAddToCart: (dish: QueryMenuItem) => void;
  onResetFilters: () => void;
  onClose?: () => void;
}) {
  // Format filter badges for display
  const filterPills: string[] = [];
  if (toolInput?.category) filterPills.push(`Category: ${toolInput.category}`);
  if (typeof toolInput?.maxPrice === 'number') filterPills.push(`Under Rs. ${toolInput.maxPrice}`);
  if (toolInput?.isVegan) filterPills.push('100% Vegan');
  else if (toolInput?.isVegetarian) filterPills.push('Vegetarian');
  if (toolInput?.isGlutenFree) filterPills.push('Gluten-Free');
  if (typeof toolInput?.maxSpiceLevel === 'number') {
    filterPills.push(`Spice ≤ ${toolInput.maxSpiceLevel}`);
  }
  if (toolInput?.query) filterPills.push(`"${toolInput.query}"`);

  // STATE 1: Input Streaming (input-streaming / call-streaming / partial-call)
  if (toolState === 'input-streaming' || toolState === 'partial-call') {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 my-2 flex items-center gap-2.5 text-xs text-gray-700 animate-pulse shadow-2xs transition-all">
        <Search className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="font-semibold text-gray-800">
          🔍 Tabl Concierge is searching kitchen catalog...
        </span>
      </div>
    );
  }

  // STATE 2: Input Available (input-available / call)
  if (toolState === 'input-available' || toolState === 'call') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 my-2 space-y-2 shadow-2xs transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Filter className="w-3.5 h-3.5 text-gray-600" />
            <span>Active Menu Search</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Querying Kitchen...
          </span>
        </div>

        {filterPills.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {filterPills.map((pill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 border border-gray-200"
              >
                {pill}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // STATE 3 & STATE 4: Output Available / Error (output-available / output-error / result)
  if (toolState === 'output-available' || toolState === 'result' || toolState === 'output-error') {
    const rawResult = toolOutput;
    const isError = toolState === 'output-error' || Boolean(errorText);
    const extractedItems: QueryMenuItem[] = Array.isArray(rawResult?.items)
      ? rawResult.items
      : Array.isArray(rawResult)
      ? rawResult
      : [];
    const count = rawResult?.count ?? extractedItems.length;

    // STATE 4: Output Error / Empty (found: false or count: 0 or error)
    if (isError || extractedItems.length === 0 || rawResult?.found === false) {
      return (
        <div
          id="generative-empty-state"
          className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 my-2 text-xs text-amber-900 space-y-3 shadow-2xs transition-all"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-amber-950 text-xs">
                No matching in-stock dishes found
              </h4>
              <p className="mt-1 text-amber-800 text-xs leading-relaxed">
                {errorText ||
                  rawResult?.message ||
                  'No items currently on the menu matched all your selected criteria.'}
              </p>
            </div>
          </div>

          {filterPills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] font-bold text-amber-700 self-center">Tried:</span>
              {filterPills.map((pill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200"
                >
                  {pill}
                </span>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-amber-200/70 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="generative-reset-filters-btn"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Filters
            </button>
            <Link
              href="/menu"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black transition-colors shadow-2xs"
            >
              <Utensils className="w-3 h-3" />
              Browse Full Menu
            </Link>
          </div>
        </div>
      );
    }

    // STATE 3: Output Available (found: true with items) -> Interactive Generative UI
    return (
      <div id="generative-ui-results" className="my-2 space-y-2 transition-all">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Recommended Kitchen Dishes ({count})</span>
          </div>

          {filterPills.length > 0 && (
            <span className="text-[10px] text-gray-500 font-mono">
              {filterPills.slice(0, 2).join(' · ')}
            </span>
          )}
        </div>

        <DishCardGrid items={extractedItems} onAddToCart={onAddToCart} />
      </div>
    );
  }

  return null;
}

export default function ChatContainer({
  onClose,
  onAddToCartItemName,
}: ChatContainerProps) {
  const [initialLoadedMessages] = useState<UIMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tabl_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load chat history from localStorage', e);
      }
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');

  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop,
    status,
    error: sdkError,
  } = useChat({
    messages: initialLoadedMessages,
    onError: (err) => {
      console.error('[useChat Error]:', err);
    },
  });

  const isGenerating = status === 'streaming' || status === 'submitted';

  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewStreamContentWhileScrolled, setHasNewStreamContentWhileScrolled] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

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
        localStorage.setItem('tabl_chat_history', JSON.stringify(messages));
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

  // Scroll detection
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

  // Smooth jump to bottom
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

  // Auto-scroll when messages change if pinned to bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    } else {
      setHasNewStreamContentWhileScrolled(true);
    }
  }, [messages]);

  const handleAddToCartItem = (dish: QueryMenuItem) => {
    // Map QueryMenuItem to MenuItem
    const menuItem: MenuItem = {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: dish.price,
      description: dish.description,
      ingredients: [],
      allergens: dish.allergens || [],
      isVegetarian: dish.isVegetarian,
      isVegan: dish.isVegan,
      isGlutenFree: dish.isGlutenFree,
      spiceLevel: dish.spiceLevel,
      isAvailable: true,
    };
    addToCart(menuItem, 1);
    if (onAddToCartItemName) {
      onAddToCartItemName(dish.name);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;
    try {
      await sendMessage({ text: text.trim() });
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    const text = input;
    setInput('');
    await handleSendMessage(text);
  };

  const handleSuggestionClick = async (suggestionText: string) => {
    if (isGenerating) return;
    const cleanText = suggestionText.replace(/^[^\w\s]+\s*/, '');
    await handleSendMessage(cleanText);
  };

  const handleClearHistory = () => {
    if (isGenerating) stop();
    try {
      localStorage.removeItem('tabl_chat_history');
    } catch (e) {
      console.error('Failed to clear chat history from localStorage', e);
    }
    setMessages(INITIAL_MESSAGES);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleResetFilters = () => {
    handleSuggestionClick('Show all popular in-stock dishes');
  };

  /**
   * Streaming-Aware Markdown Renderer
   */
  const renderMessageContent = (content: string, isStreaming: boolean) => {
    if (!content && isStreaming) {
      return null;
    }
    const cleanContent = sanitizeStreamingMarkdown(content);

    return (
      <div className="text-sm leading-relaxed text-gray-900 break-words space-y-2">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h3 className="font-bold text-gray-950 text-base mt-2 mb-1">{children}</h3>
            ),
            h2: ({ children }) => (
              <h3 className="font-bold text-gray-950 text-sm mt-2 mb-1">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="font-bold text-gray-900 text-sm mt-2 mb-1">{children}</h4>
            ),
            h4: ({ children }) => (
              <h5 className="font-semibold text-gray-900 text-xs mt-1.5 mb-1">{children}</h5>
            ),
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 leading-relaxed text-sm text-gray-800">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="space-y-1.5 my-2 list-none pl-0">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-1.5 my-2 list-decimal pl-4 text-sm text-gray-800">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="flex items-start gap-2 text-sm text-gray-800 my-1">
                <span className="text-amber-500 font-bold select-none mt-0.5 shrink-0">•</span>
                <span className="flex-1 min-w-0">{children}</span>
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-gray-950">{children}</strong>
            ),
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

        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-gray-800 ml-1 animate-pulse align-middle" />
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
            <p className="text-[11px] text-gray-400 truncate">Generative Menu & Dietary AI Advisor</p>
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
        style={{ overflow: 'scroll' }}
      >
        {(messages || []).map((m: any, mIdx) => {
          const isUser = m.role === 'user';
          const isLastMessage = mIdx === (messages || []).length - 1;
          const isStreaming = isGenerating && isLastMessage && !isUser;

          // Support both UIMessage parts and legacy fields
          const parts: any[] = Array.isArray(m?.parts) ? m.parts : [];
          const textContent =
            parts?.filter((p) => p?.type === 'text')?.map((p) => p?.text).join('') ||
            (typeof m?.content === 'string' ? m.content : '');

          const toolParts = parts?.filter(
            (p) =>
              p?.type === 'tool' ||
              (typeof p?.type === 'string' &&
                (p.type.startsWith('tool-') ||
                  p.type === 'dynamic-tool' ||
                  p.type === 'tool-invocation' ||
                  p.type === 'tool-call' ||
                  p.type === 'tool-result')) ||
              p?.toolName === 'queryMenu' ||
              p?.name === 'queryMenu'
          );

          // Support legacy toolInvocations if present
          const legacyToolInvocations: any[] = Array.isArray(m?.toolInvocations)
            ? m.toolInvocations
            : [];

          const hasTools = (toolParts || []).length > 0 || (legacyToolInvocations || []).length > 0;
          const isThinking = isStreaming && !textContent && !hasTools;
          const isEmptyAssistant = !isUser && !isStreaming && !textContent && !hasTools;

          return (
            <article
              key={m?.id || mIdx}
              id={`chat-message-${m?.id || mIdx}`}
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

              {/* Message Bubble */}
              <div
                className={`min-w-0 max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-2xs break-words overflow-hidden ${
                  isUser
                    ? 'bg-gray-900 text-white rounded-tr-xs'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{textContent}</p>
                ) : isThinking ? (
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
                ) : isEmptyAssistant ? (
                  <div className="space-y-2 py-0.5">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      I didn&apos;t get a complete response from the kitchen. Would you like me to try again?
                    </p>
                    <button
                      type="button"
                      onClick={() => regenerate()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 transition-colors shadow-2xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Render UIMessage Tool Parts */}
                    {toolParts?.map((tp, tpIdx) => (
                      <ToolInvocationRenderer
                        key={tp?.toolCallId || tpIdx}
                        toolState={tp?.state || 'output-available'}
                        toolInput={tp?.input || tp?.args}
                        toolOutput={tp?.output || tp?.result}
                        errorText={tp?.errorText}
                        onAddToCart={handleAddToCartItem}
                        onResetFilters={handleResetFilters}
                        onClose={onClose}
                      />
                    ))}

                    {/* Render Legacy Tool Invocations */}
                    {legacyToolInvocations?.map((ti, tiIdx) => (
                      <ToolInvocationRenderer
                        key={ti?.toolCallId || tiIdx}
                        toolState={ti?.state}
                        toolInput={ti?.args}
                        toolOutput={ti?.result}
                        onAddToCart={handleAddToCartItem}
                        onResetFilters={handleResetFilters}
                        onClose={onClose}
                      />
                    ))}

                    {/* Markdown Text Response */}
                    {textContent && renderMessageContent(textContent, isStreaming)}
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {/* Error State Banner with Retry */}
        {sdkError && (
          <div
            id="concierge-error-banner"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Response interrupted</p>
                <p className="mt-0.5 text-rose-700">{sdkError.message || 'An error occurred.'}</p>
              </div>
            </div>
            <button
              type="button"
              id="concierge-retry-btn"
              onClick={() => regenerate()}
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

      {/* Suggested Quick Inquiries */}
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
        <form onSubmit={handleSubmitForm} className="flex items-center gap-2">
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

          {/* Stop Button during generation, otherwise Send Button */}
          {isGenerating ? (
            <button
              type="button"
              id="concierge-stop-btn"
              onClick={() => stop()}
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
