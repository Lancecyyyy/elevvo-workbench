import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardList, Plus, Sparkles, X } from "lucide-react";
import { SPECS, specForPath } from "../lib/spec";

/** A small "Brief" tab that maps the current screen back to the Elevvo task list. */
export default function SpecSheet() {
  const { pathname } = useLocation();
  const spec = specForPath(pathname);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!spec) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-[70] flex items-center gap-2 rounded-full border border-line-2 bg-surface/95 py-1.5 pr-3.5 pl-1.5 text-[13px] text-ink shadow-md backdrop-blur transition-transform hover:-translate-y-0.5"
        aria-haspopup="dialog"
      >
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-hi px-1.5 text-[11px] font-semibold text-on-hi tabular">
          T{String(spec.task).padStart(2, "0")}
        </span>
        Internship brief
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-night/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`Task ${spec.task} brief`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 right-0 z-[81] flex w-full max-w-[420px] flex-col overflow-y-auto bg-surface shadow-lg"
            >
              <div className="flex items-start justify-between border-b border-line p-6">
                <div>
                  <p className="text-[12.5px] text-muted">
                    Elevvo task {String(spec.task).padStart(2, "0")} · {spec.level}
                  </p>
                  <h2 className="mt-1 font-display text-[30px] leading-none">{spec.title}</h2>
                </div>
                <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-sunk" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-7 p-6">
                <Section icon={<ClipboardList size={15} />} title="Required" items={spec.required} tone="ok" />
                <Section icon={<Plus size={15} />} title="Bonus" items={spec.bonus} tone="hi" />
                <Section icon={<Sparkles size={15} />} title="Went further" items={spec.extra} tone="brand" />
              </div>

              <div className="mt-auto border-t border-line p-6">
                <p className="text-[12.5px] text-muted">All tasks in this build</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SPECS.map((s) => (
                    <Link
                      key={s.task}
                      to={s.where}
                      className={`rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${
                        s.task === spec.task ? "border-ink bg-ink text-bg" : "border-line-2 text-muted hover:text-ink"
                      }`}
                    >
                      T{String(s.task).padStart(2, "0")} {s.title.split(" ")[0]}
                    </Link>
                  ))}
                </div>
                <p className="mt-4 text-[12px] text-faint">Tasks 05, 09 and 10 need separate toolchains (Next.js, Storybook) and aren't part of this build.</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ icon, title, items, tone }: { icon: ReactNode; title: string; items: string[]; tone: "ok" | "hi" | "brand" }) {
  const dot = tone === "ok" ? "bg-ok/15 text-ok" : tone === "hi" ? "bg-hi text-on-hi" : "bg-brand/12 text-brand";
  return (
    <section>
      <h3 className="flex items-center gap-2 text-[13px] font-semibold">
        <span className="text-muted">{icon}</span>
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex gap-3 text-[14px] leading-snug">
            <span className={`mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full ${dot}`}>
              <Check size={11} strokeWidth={3} />
            </span>
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}
