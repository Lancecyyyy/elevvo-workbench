import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ChevronsLeft, FolderKanban, Globe2, LayoutGrid, Moon, Settings, SquareKanban, Sun, Volume2, VolumeX } from "lucide-react";
import { Mark } from "../ui/Logo";
import { usePrefs } from "../../lib/prefs";
import { HUES, initials, useWorkspace } from "../../lib/workspace/store";

export const SIDEBAR_OPEN = 256;
export const SIDEBAR_CLOSED = 76;

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobile = false, onNavigate }: SidebarProps) {
  const { theme, toggleTheme, sound, toggleSound } = usePrefs();
  const { ws, board, boardLoading } = useWorkspace();
  const { pathname } = useLocation();
  const open = mobile || !collapsed;

  const active = ws.projects.filter((p) => p.status !== "Completed").length;
  const inFlight = boardLoading ? undefined : board.applied.length + board.interviewing.length;
  const offers = boardLoading ? 0 : board.offer.filter((j) => !j.projectId).length;
  const cities = new Set(ws.projects.filter((p) => p.status !== "Completed").map((p) => p.place.id)).size + ws.extraCities.length;

  const workspace: Item[] = [
    { to: "/app", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/app/projects", label: "Projects", icon: FolderKanban, badge: active },
    { to: "/app/pipeline", label: "Pipeline", icon: SquareKanban, badge: inFlight },
    { to: "/app/weather", label: "Client weather", icon: Globe2, badge: cities },
  ];
  const account: Item[] = [{ to: "/app/settings", label: "Settings", icon: Settings }];

  const isActive = (it: Item) => (it.end ? pathname === it.to || pathname === "/app/overview" : pathname.startsWith(it.to));
  const hue = HUES[ws.profile.hue] ?? HUES.butter;

  const renderItem = (it: Item) => {
    const on = isActive(it);
    const Icon = it.icon;
    return (
      <li key={it.to} className="group relative">
        <NavLink
          to={it.to}
          end={it.end}
          onClick={onNavigate}
          aria-label={open ? undefined : it.label}
          className={`relative flex h-10 items-center gap-3 rounded-[10px] px-[13px] text-[14px] transition-colors ${
            on ? "text-cobalt-deep" : "text-cream/72 hover:bg-cream/[0.07] hover:text-cream"
          }`}
        >
          {on && (
            <motion.span
              layoutId={mobile ? "side-on-m" : "side-on"}
              className="absolute inset-0 rounded-[10px] bg-butter"
              transition={{ type: "spring", stiffness: 460, damping: 36 }}
            />
          )}
          <Icon size={18} strokeWidth={1.9} className="relative shrink-0" />
          <span className={`relative flex-1 truncate font-medium transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>
            {it.label}
          </span>
          {it.badge !== undefined && it.badge > 0 && (
            <span
              className={`relative rounded-md px-1.5 text-[11px] font-medium tabular transition-opacity ${open ? "opacity-100" : "opacity-0"} ${
                on ? "bg-cobalt-deep/10" : "bg-cream/10 text-cream/80"
              }`}
            >
              {it.badge}
            </span>
          )}
          {it.to === "/app/pipeline" && offers > 0 && (
            <span className={`absolute top-2 left-[27px] h-2 w-2 rounded-full bg-[#5fd39c] ring-2 ring-[var(--side)] ${open ? "hidden" : ""}`} />
          )}
        </NavLink>
        {!open && (
          <span className="pointer-events-none absolute top-1/2 left-[60px] z-50 -translate-y-1/2 translate-x-1 rounded-md bg-night px-2.5 py-1.5 text-[13px] whitespace-nowrap text-cream opacity-0 shadow-lg transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:bg-cream dark:text-night">
            {it.label}
            {it.badge ? <span className="ml-1.5 opacity-60">{it.badge}</span> : null}
          </span>
        )}
      </li>
    );
  };

  const label = (text: string) => (
    <p className={`mb-1.5 px-[13px] text-[11.5px] font-medium text-cream/45 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}>{text}</p>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: mobile ? 284 : open ? SIDEBAR_OPEN : SIDEBAR_CLOSED }}
      transition={{ type: "spring", stiffness: 400, damping: 38 }}
      className="grain flex h-full flex-col overflow-hidden bg-side text-cream"
    >
      {/* logo slot */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-[18px]">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream/10 ring-1 ring-cream/15" aria-label="Workspace logo">
          <Mark size={26} inverted />
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="min-w-0 whitespace-nowrap"
            >
              <p className="truncate text-[14.5px] font-semibold">{ws.profile.name.split(" ")[0]}'s Studio</p>
              <p className="text-[12px] text-cream/55">TaskFlow Pro · demo</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pt-3" aria-label="App">
        {label("Workspace")}
        <ul className="flex flex-col gap-0.5">{workspace.map(renderItem)}</ul>
        <div className="mt-6">{label("Account")}</div>
        <ul className="flex flex-col gap-0.5">
          {account.map(renderItem)}
          <li className="group relative">
            <NavLink
              to="/"
              aria-label={open ? undefined : "Back to site"}
              className="flex h-10 items-center gap-3 rounded-[10px] px-[13px] text-[14px] text-cream/72 transition-colors hover:bg-cream/[0.07] hover:text-cream"
            >
              <ArrowLeft size={18} strokeWidth={1.9} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-opacity ${open ? "opacity-100" : "opacity-0"}`}>Back to site</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="shrink-0 space-y-1 border-t border-cream/10 p-3">
        <div className={`flex gap-1 ${open ? "" : "flex-col items-center"}`}>
          <button
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg text-cream/70 hover:bg-cream/10 hover:text-cream"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={toggleSound}
            className="grid h-9 w-9 place-items-center rounded-lg text-cream/70 hover:bg-cream/10 hover:text-cream"
            aria-label={sound ? "Mute click sounds" : "Unmute click sounds"}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          {!mobile && (
            <button
              onClick={onToggle}
              className={`grid h-9 w-9 place-items-center rounded-lg text-cream/70 hover:bg-cream/10 hover:text-cream ${open ? "ml-auto" : ""}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              title="Toggle sidebar (Ctrl + B)"
            >
              <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                <ChevronsLeft size={17} />
              </motion.span>
            </button>
          )}
        </div>
        <NavLink
          to="/app/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-[10px] p-1.5 transition-colors hover:bg-cream/[0.07]"
          aria-label="Your profile"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[13px] font-semibold" style={{ background: hue.bg, color: hue.fg }}>
            {initials(ws.profile.name)}
          </span>
          <span className={`min-w-0 leading-tight transition-opacity ${open ? "opacity-100" : "opacity-0"}`}>
            <span className="block truncate text-[13.5px] font-medium">{ws.profile.name}</span>
            <span className="block truncate text-[12px] text-cream/55">{ws.profile.email}</span>
          </span>
        </NavLink>
      </div>
    </motion.aside>
  );
}
