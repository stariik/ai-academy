'use client';

// ============================================================
// Walle Support Chat - A simple AI assistant for help and support
// ============================================================

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Send, Sparkles, X } from 'lucide-react';
import { Walle, type WalleState } from '@/components/walle/Walle';
import { cn } from '@/lib/utils';
import { isLocale, type Locale } from '@/lib/v2/i18n';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const COPY = {
  en: {
    open: 'Chat with Walle',
    close: 'Close',
    name: 'walle',
    roleIdle: 'AI Support',
    roleThinking: 'typing…',
    greeting: 'Hi 👋 I am Walle, your AI assistant.',
    pitch: 'Ask me anything about our courses, how to get started, or if you need help with anything!',
    placeholder: 'Ask me anything...',
    sendLabel: 'Send message',
    error: 'Something went wrong. Please try again.',
  },
  ka: {
    open: 'ჩატი Walle-სთან',
    close: 'დახურვა',
    name: 'walle',
    roleIdle: 'AI მხარდაჭერა',
    roleThinking: 'ვბეჭდავ…',
    greeting: 'გამარჯობა 👋 მე Walle ვარ, შენი AI ასისტენტი.',
    pitch: 'შემიძლია დაგეხმარო კურსების შესახებ, ან თუ რაიმე კითხვა გაქვს!',
    placeholder: 'მომწერე რაც გინდა...',
    sendLabel: 'გაგზავნა',
    error: 'რაღაც არ გამოვიდა. გთხოვ სცადე ხელახლა.',
  },
} satisfies Record<Locale, Record<string, unknown>>;

type Copy = (typeof COPY)['en'];

/**
 * True while a full-screen mobile menu owns the viewport. The navbar lives in a
 * different tree than this bot, so it flags `<body data-menu-open>` and we watch it.
 */
function useMobileMenuOpen() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const read = () => setMenuOpen(document.body.dataset.menuOpen === 'true');
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-menu-open'] });
    return () => observer.disconnect();
  }, []);

  return menuOpen;
}

export default function WalleBot() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const locale: Locale = isLocale(segments[0] ?? '') ? (segments[0] as Locale) : 'ka';
  const section = segments[1] ?? '';
  // Public storefront only — inside a lesson the tutor chat already is Walle.
  const visible = ['', 'courses', 'about', 'contact'].includes(section);
  // Course detail pages carry a sticky mobile buy bar; step over it.
  const overBuyBar = section === 'courses' && Boolean(segments[2]);

  const T = COPY[locale];
  const reducedMotion = useReducedMotion();
  const menuOpen = useMobileMenuOpen();

  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [error, setError] = React.useState('');

  const bodyRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Escape closes; on phones the panel is full-screen, so lock the page behind it.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const phone = !window.matchMedia('(min-width: 640px)').matches;
    const previous = document.body.style.overflow;
    if (phone) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      // Don't hand scrolling back if the burger sheet has since claimed the lock.
      if (phone && !document.body.dataset.menuOpen) {
        document.body.style.overflow = previous;
      }
    };
  }, [open]);

  // The burger sheet takes over the screen — fold the chat away behind it.
  React.useEffect(() => {
    if (menuOpen) setOpen(false);
  }, [menuOpen]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 220);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, locale }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'I am here to help! How can I assist you?',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(T.error);
      // Fallback response if API fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: locale === 'ka'
          ? 'მადლობა შეტყობინებისთვის! ამჟამად ვერ ვუპასუხებ, მაგრამ მალე დაგიკავშირდები.'
          : 'Thanks for reaching out! I cannot respond right now, but I will get back to you soon.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!visible || menuOpen) return null;

  const walleState: WalleState = isTyping ? 'tilt' : 'idle';
  const status = isTyping ? T.roleThinking : T.roleIdle;
  const launcherAnchor = overBuyBar ? 'bottom-24 lg:bottom-6' : 'bottom-5 sm:bottom-6';
  const panelAnchor = overBuyBar ? 'sm:bottom-24 lg:bottom-6' : 'sm:bottom-6';

  return (
    <>
      {/* ---------- Launcher ---------- */}
      <div
        className={cn(
          'fixed right-4 z-50 flex flex-row-reverse items-end gap-2 sm:right-6',
          launcherAnchor,
          open && 'hidden',
        )}
      >
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={T.open}
          aria-expanded={open}
          whileHover={reducedMotion ? undefined : { y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="group relative grid h-16 w-16 shrink-0 place-items-center rounded-full border border-border bg-card/90 shadow-[0_10px_30px_var(--pulse-glow)] backdrop-blur-xl transition-colors hover:border-pulse/60"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-pulse/10 opacity-0 transition-opacity group-hover:opacity-100"
          />
          <Walle state="idle" size={46} noShadow label="Walle" />
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-pulse text-primary-foreground shadow-[0_0_0_3px_var(--background)]"
          >
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        </motion.button>
      </div>

      {/* ---------- Panel ---------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={T.open}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{ originX: 1, originY: 1 }}
            className={cn(
              'fixed inset-0 z-50 flex flex-col overflow-hidden border-border bg-card shadow-2xl',
              'sm:inset-auto sm:right-6 sm:h-[min(40rem,calc(100dvh-7.5rem))] sm:w-[24.5rem] sm:rounded-[1.75rem] sm:border',
              'lg:w-[26rem]',
              panelAnchor,
            )}
          >
            {/* Header */}
            <div className="relative flex shrink-0 items-center gap-2.5 border-b border-border bg-gradient-to-r from-pulse/10 via-transparent to-heart/10 px-3.5 py-2.5">
              <Walle state={walleState} size={34} noShadow label="Walle" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black lowercase leading-none">{T.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 rounded-full', isTyping ? 'bg-heart' : 'bg-pulse')} />
                  {status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={T.close}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div
              ref={bodyRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 space-y-3"
            >
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <motion.div
                    animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Walle state="wave" size={112} label="Walle" />
                  </motion.div>
                  <h2 className="mt-4 text-lg font-black">{T.greeting}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{T.pitch}</p>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-pulse text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-2xl rounded-bl-md px-3.5 py-2.5">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((index) => (
                        <motion.span
                          key={index}
                          className="h-1.5 w-1.5 rounded-full bg-pulse"
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: index * 0.14 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-heart/40 bg-heart/5 px-3.5 py-3 text-xs leading-relaxed text-foreground">
                  {error}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="shrink-0 border-t border-border bg-card px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-grow
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 104)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={T.placeholder}
                  className="max-h-[104px] min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-[13px] leading-snug outline-none transition placeholder:text-muted-foreground focus:border-pulse"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  aria-label={T.sendLabel}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pulse text-primary-foreground shadow-[0_6px_18px_var(--pulse-glow)] transition enabled:hover:-translate-y-0.5 disabled:opacity-35"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
