import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Briefcase, CornerDownLeft, FileText, FolderKanban, Globe2, LayoutGrid, Mail, Moon, Plus, Search, Settings, SquareKanban } from "lucide-react";
import { useWorkspace } from "../../lib/workspace/store";
import { usePrefs } from "../../lib/prefs";

interface Command {
  id: string;
  group: "Go to" | "Projects" | "Pipeline" | "Actions";
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

export function openPalette() {
  window.dispatchEvent(new Event("tf:palette"));
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const { ws, allJobs } = useWorkspace();
  const { toggleTheme, theme } = usePrefs();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const evt = () => setOpen(true);
    window.addEventListener("keydown", key);
    window.addEventListener("tf:palette", evt);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("tf:palette", evt);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setIndex(0);
    }
  }, [open]);

  const go = (to: string) => () => navigate(to);

  const commands = useMemo<Command[]>(
    () => [
      { id: "overview", group: "Go to", label: "Overview", icon: LayoutGrid, run: go("/app") },
      { id: "projects", group: "Go to", label: "Projects", icon: FolderKanban, run: go("/app/projects") },
      { id: "pipeline", group: "Go to", label: "Pipeline", icon: SquareKanban, run: go("/app/pipeline") },
      { id: "weather", group: "Go to", label: "Client weather", icon: Globe2, run: go("/app/weather") },
      { id: "settings", group: "Go to", label: "Settings", icon: Settings, run: go("/app/settings") },
      { id: "journal", group: "Go to", label: "Journal", hint: "public site", icon: FileText, run: go("/journal") },
      { id: "contact", group: "Go to", label: "Contact TaskFlow", hint: "public site", icon: Mail, run: go("/contact") },
      { id: "new-job", group: "Actions", label: "Add a job to the pipeline", icon: Plus, run: go("/app/pipeline?new=1") },
      { id: "theme", group: "Actions", label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode", icon: Moon, run: toggleTheme },
      ...ws.projects.map<Command>((p) => ({
        id: `p-${p.id}`,
        group: "Projects",
        label: p.name,
        hint: `${p.client} · ${p.status}`,
        icon: FolderKanban,
        run: go(`/app/projects?open=${p.id}`),
      })),
      ...allJobs.map<Command>((j) => ({
        id: `j-${j.id}`,
        group: "Pipeline",
        label: `${j.role}`,
        hint: `${j.company} · ${j.status}`,
        icon: Briefcase,
        run: go(`/app/pipeline?focus=${j.id}`),
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ws.projects, allJobs, theme],
  );

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? commands.filter((c) => `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(s)) : commands.filter((c) => c.group === "Go to" || c.group === "Actions");
    return list.slice(0, 12);
  }, [q, commands]);

  useEffect(() => setIndex(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    setOpen(false);
    c.run();
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-start justify-center bg-night/45 px-4 pt-[12vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ y: -10, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-lg"
          >
            <label className="flex items-center gap-3 border-b border-line px-4">
              <Search size={17} className="text-faint" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIndex((i) => Math.min(results.length - 1, i + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIndex((i) => Math.max(0, i - 1));
                  } else if (e.key === "Enter") run(results[index]);
                  else if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Search projects, jobs, pages…"
                className="h-14 w-full bg-transparent text-[16px] outline-none placeholder:text-faint"
                aria-label="Search commands"
              />
              <kbd className="rounded border border-line-2 px-1.5 text-[11px] text-faint">Esc</kbd>
            </label>
            <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
              {results.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-muted">Nothing matches “{q}”.</li>}
              {results.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null;
                lastGroup = c.group;
                return (
                  <li key={c.id}>
                    {header && <p className="px-3 pt-2.5 pb-1 text-[11.5px] font-medium text-faint">{header}</p>}
                    <button
                      data-i={i}
                      role="option"
                      aria-selected={i === index}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => run(c)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] ${i === index ? "bg-sunk" : ""}`}
                    >
                      <c.icon size={16} className="shrink-0 text-muted" />
                      <span className="truncate">{c.label}</span>
                      {c.hint && <span className="truncate text-[12.5px] text-faint">{c.hint}</span>}
                      {i === index && <CornerDownLeft size={14} className="ml-auto shrink-0 text-faint" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
