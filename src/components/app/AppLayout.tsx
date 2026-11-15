import { Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Bell, Briefcase, CheckCircle2, CreditCard, FileText, FolderKanban, Mail, Menu, MessageSquare, Search, UserRound } from "lucide-react";
import Sidebar from "./Sidebar";
import CommandPalette, { openPalette } from "./CommandPalette";
import { readStore, writeStore } from "../../lib/prefs";
import { HUES, initials, timeAgo, useWorkspace } from "../../lib/workspace/store";
import type { ActivityKind } from "../../lib/workspace/types";

export const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  payment: CreditCard,
  comment: MessageSquare,
  file: FileText,
  task: CheckCircle2,
  pipeline: Briefcase,
  profile: UserRound,
  message: Mail,
  project: FolderKanban,
};

const TITLES: [string, string][] = [
  ["/app/projects", "Projects"],
  ["/app/pipeline", "Pipeline"],
  ["/app/weather", "Client weather"],
  ["/app/settings", "Settings"],
  ["/app", "Overview"],
];

function Notifications() {
  const { ws, unread, markRead } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const latest = ws.activity.slice(0, 3);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-sunk hover:text-ink"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[10px] font-semibold text-white tabular">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-40 mt-2 w-[min(360px,calc(100vw-24px))] origin-top-right overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[14px] font-semibold">Recent activity</p>
              <button onClick={markRead} disabled={!unread} className="text-[12.5px] font-medium text-brand disabled:text-faint">
                Mark all read
              </button>
            </div>
            <ul className="border-t border-line">
              {latest.map((a) => {
                const Icon = ACTIVITY_ICON[a.kind];
                const isNew = a.at > ws.lastReadAt;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => {
                        setOpen(false);
                        if (a.link) navigate(a.link);
                      }}
                      className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-sunk"
                    >
                      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sunk text-brand">
                        <Icon size={15} />
                        {isNew && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-bad" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13.5px] leading-snug">
                          <span className="font-medium">{a.who}</span> <span className="text-muted">{a.text}</span>
                        </span>
                        <span className="text-[12px] text-faint">{timeAgo(a.at)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link
              to="/app#activity"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-4 py-2.5 text-center text-[13px] font-medium text-muted hover:text-ink"
            >
              See all activity
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppLayout() {
  const outlet = useOutlet();
  const { pathname, hash } = useLocation();
  const { ws } = useWorkspace();
  const [collapsed, setCollapsed] = useState<boolean>(() => readStore("tf-collapsed") === "1");
  const [drawer, setDrawer] = useState(false);
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Overview";
  const hue = HUES[ws.profile.hue] ?? HUES.butter;

  useEffect(() => writeStore("tf-collapsed", collapsed ? "1" : "0"), [collapsed]);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (hash) {
      const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 250);
      return () => window.clearTimeout(id);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 1024px)").matches) setCollapsed((c) => !c);
        else setDrawer((d) => !d);
      }
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-night/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              drag="x"
              dragConstraints={{ left: -300, right: 0 }}
              dragElastic={{ left: 0.2, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -400) setDrawer(false);
              }}
            >
              <Sidebar collapsed={false} mobile onToggle={() => {}} onNavigate={() => setDrawer(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setDrawer(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-sunk lg:hidden"
              aria-label="Open menu"
              aria-expanded={drawer}
            >
              <Menu size={19} />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[14px]">
              <span className="hidden truncate text-muted sm:inline">{ws.profile.name.split(" ")[0]}'s Studio</span>
              <span className="hidden text-faint sm:inline">/</span>
              <span className="truncate font-medium">{title}</span>
            </nav>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={openPalette}
                className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] text-faint transition-colors hover:border-line-2 hover:text-muted md:flex md:w-[240px]"
              >
                <Search size={15} />
                Search or jump to…
                <kbd className="ml-auto rounded border border-line-2 px-1.5 text-[11px]">Ctrl K</kbd>
              </button>
              <button onClick={openPalette} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-sunk md:hidden" aria-label="Search">
                <Search size={18} />
              </button>
              <Notifications />
              <Link
                to="/app/settings"
                className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-[12px] font-semibold"
                style={{ background: hue.bg, color: hue.fg }}
                aria-label="Profile settings"
              >
                {initials(ws.profile.name)}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-2xl bg-sunk/70" />}>{outlet}</Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
