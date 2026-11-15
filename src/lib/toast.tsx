import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";

export interface ToastInput {
  title: string;
  body?: string;
  tone?: "ok" | "info";
  action?: { label: string; run: () => void };
  duration?: number;
}
interface Toast extends ToastInput {
  id: number;
}

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = next.current++;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), t.duration ?? (t.action ? 6000 : 3600));
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-[420px] items-start gap-3 rounded-xl bg-night px-4 py-3 text-cream shadow-lg dark:bg-cream dark:text-night"
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  t.tone === "info" ? "bg-cream/15 dark:bg-night/10" : "bg-butter text-cobalt-deep"
                }`}
              >
                {t.tone === "info" ? <Info size={12} /> : <Check size={12} strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{t.title}</p>
                {t.body && <p className="text-[13px] opacity-70">{t.body}</p>}
              </div>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.run();
                    dismiss(t.id);
                  }}
                  className="shrink-0 rounded-md px-2 py-0.5 text-[13px] font-semibold text-butter hover:bg-cream/10 dark:text-cobalt dark:hover:bg-night/10"
                >
                  {t.action.label}
                </button>
              )}
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="shrink-0 opacity-50 hover:opacity-100">
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
