import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { SEED, placeFromLocation } from "./seed";
import type { Activity, ActivityKind, Place, Profile, Project, Workspace } from "./types";
import { SEED_BOARD, flatten, isBoard, type Board, type Job } from "./pipeline";
import { usePersistentState } from "../usePersistentState";

/* One store for the whole product. The marketing site writes to it too
 * (the contact form logs a message), so every screen shares one story. */

const KEY = "tf-workspace";

type Action =
  | { type: "profile"; patch: Partial<Profile> }
  | { type: "project/add"; project: Project }
  | { type: "project/update"; id: string; patch: Partial<Project> }
  | { type: "project/remove"; id: string }
  | { type: "log"; entry: Activity }
  | { type: "read" }
  | { type: "city/add"; place: Place }
  | { type: "city/remove"; id: string }
  | { type: "reset" };

function reducer(ws: Workspace, a: Action): Workspace {
  switch (a.type) {
    case "profile":
      return { ...ws, profile: { ...ws.profile, ...a.patch } };
    case "project/add":
      return { ...ws, projects: [a.project, ...ws.projects] };
    case "project/update":
      return { ...ws, projects: ws.projects.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) };
    case "project/remove":
      return { ...ws, projects: ws.projects.filter((p) => p.id !== a.id) };
    case "log":
      return { ...ws, activity: [a.entry, ...ws.activity].slice(0, 60) };
    case "read":
      return { ...ws, lastReadAt: new Date().toISOString() };
    case "city/add":
      return ws.extraCities.some((c) => c.id === a.place.id) ? ws : { ...ws, extraCities: [a.place, ...ws.extraCities].slice(0, 6) };
    case "city/remove":
      return { ...ws, extraCities: ws.extraCities.filter((c) => c.id !== a.id) };
    case "reset":
      return { ...SEED, lastReadAt: new Date(Date.now() - 3 * 3600_000).toISOString() };
  }
}

function load(): Workspace {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    return parsed.version === 2 && Array.isArray(parsed.projects) && parsed.profile ? (parsed as Workspace) : SEED;
  } catch {
    return SEED;
  }
}

interface Store {
  ws: Workspace;
  unread: number;
  log: (kind: ActivityKind, who: string, text: string, link?: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addProject: (p: Project) => void;
  updateProject: (id: string, patch: Partial<Project>, note?: string) => void;
  removeProject: (id: string) => void;
  markRead: () => void;
  addCity: (p: Place) => void;
  removeCity: (id: string) => void;
  reset: () => void;
  /** Task 08 board, loaded through the 1s simulated-network hook */
  board: Board;
  setBoard: Dispatch<SetStateAction<Board>>;
  boardLoading: boolean;
  allJobs: Job[];
  convertOffer: (job: Job) => Project;
}

const StoreContext = createContext<Store | null>(null);

const uid = () => (crypto.randomUUID?.() ?? String(Math.random())).slice(0, 8);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ws, dispatch] = useReducer(reducer, undefined, load);
  const { value: board, setValue: setBoard, loading: boardLoading } = usePersistentState<Board>("tf-pipeline", SEED_BOARD, isBoard, 1000);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ws));
    } catch {
      /* in-memory only */
    }
  }, [ws]);

  const log = useCallback((kind: ActivityKind, who: string, text: string, link?: string) => {
    dispatch({ type: "log", entry: { id: uid(), kind, who, text, link, at: new Date().toISOString() } });
  }, []);

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>, note?: string) => {
      dispatch({ type: "project/update", id, patch });
      if (note) log("project", "You", note, `/app/projects?open=${id}`);
    },
    [log],
  );

  const convertOffer = useCallback(
    (job: Job): Project => {
      const project: Project = {
        id: `P-${1050 + Math.floor(Math.random() * 900)}`,
        name: job.role,
        client: job.company,
        place: placeFromLocation(job.location),
        status: "In progress",
        deadline: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
        budget: Number((job.rate ?? "").replace(/[^\d.]/g, "")) || 1500,
        progress: 0,
        createdAt: new Date().toISOString(),
        fromJobId: job.id,
      };
      dispatch({ type: "project/add", project });
      setBoard((b) => ({ ...b, offer: b.offer.map((j) => (j.id === job.id ? { ...j, projectId: project.id } : j)) }));
      log("project", "You", `turned the ${job.company} offer into a project`, `/app/projects?open=${project.id}`);
      return project;
    },
    [log, setBoard],
  );

  const unread = useMemo(() => ws.activity.filter((a) => a.at > ws.lastReadAt).length, [ws.activity, ws.lastReadAt]);
  const allJobs = useMemo(() => flatten(board), [board]);

  const value: Store = {
    ws,
    unread,
    log,
    updateProfile: (patch) => {
      dispatch({ type: "profile", patch });
      log("profile", "You", "updated your profile");
    },
    addProject: (p) => {
      dispatch({ type: "project/add", project: p });
      log("project", "You", `created ${p.name}`, `/app/projects?open=${p.id}`);
    },
    updateProject,
    removeProject: (id) => dispatch({ type: "project/remove", id }),
    markRead: () => dispatch({ type: "read" }),
    addCity: (place) => dispatch({ type: "city/add", place }),
    removeCity: (id) => dispatch({ type: "city/remove", id }),
    reset: () => {
      dispatch({ type: "reset" });
      setBoard(SEED_BOARD);
    },
    board,
    setBoard,
    boardLoading,
    allJobs,
    convertOffer,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useWorkspace(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

/* ---------- small shared formatters ---------- */

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export function daysUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate + "T23:59:59").getTime() - Date.now()) / 864e5);
}

export const HUES: Record<string, { bg: string; fg: string }> = {
  butter: { bg: "#f7dd7d", fg: "#150f6e" },
  cobalt: { bg: "#261cc1", fg: "#fffdfb" },
  mint: { bg: "#5fd39c", fg: "#0b0930" },
  coral: { bg: "#ff9b85", fg: "#0b0930" },
  lilac: { bg: "#b9b3ff", fg: "#150f6e" },
};

export const initials = (name: string) =>
  name.trim().split(/\s+/).map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
