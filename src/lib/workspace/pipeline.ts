/* ---------------------------------------------------------------
 * Task 08 types: the gig pipeline (Kanban job tracker).
 * No `any` anywhere: Job, Column and Status are the source of truth.
 * ------------------------------------------------------------- */

export type Status = "applied" | "interviewing" | "offer" | "rejected";
export type JobSource = "Referral" | "LinkedIn" | "Upwork" | "Cold email" | "Website";
export type Priority = "low" | "medium" | "high";

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  status: Status;
  source: JobSource;
  priority: Priority;
  /** ISO timestamp the card was created */
  createdAt: string;
  /** ISO timestamp of the last stage change */
  movedAt: string;
  rate?: string;
  url?: string;
  notes?: string;
  /** set once an offer has been turned into a project */
  projectId?: string;
}

export interface Column {
  id: Status;
  title: string;
  hint: string;
  accent: string;
}

export type Board = Record<Status, Job[]>;

export type JobFormValues = Pick<Job, "company" | "role" | "location" | "status" | "source" | "priority"> & {
  rate: string;
  url: string;
  notes: string;
};

export interface Identifiable {
  id: string;
}

export const COLUMNS: readonly Column[] = [
  { id: "applied", title: "Applied", hint: "Pitched and waiting", accent: "var(--brand)" },
  { id: "interviewing", title: "Interviewing", hint: "In conversation", accent: "var(--hi)" },
  { id: "offer", title: "Offer", hint: "Ready to sign", accent: "var(--ok)" },
  { id: "rejected", title: "Rejected", hint: "Not this time", accent: "var(--bad)" },
];

export const STATUSES: readonly Status[] = COLUMNS.map((c) => c.id);
export const SOURCES: readonly JobSource[] = ["Referral", "LinkedIn", "Upwork", "Cold email", "Website"];
export const PRIORITIES: readonly Priority[] = ["low", "medium", "high"];

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

/* ---------- generic helpers (work for any Record<K, T[]>) ---------- */

export function findContainer<K extends string, T extends Identifiable>(groups: Record<K, T[]>, id: string): K | undefined {
  if (id in groups) return id as K;
  return (Object.keys(groups) as K[]).find((k) => groups[k].some((x) => x.id === id));
}

export function moveBetween<K extends string, T extends Identifiable>(
  groups: Record<K, T[]>,
  from: K,
  to: K,
  id: string,
  toIndex: number,
  patch: (item: T, to: K) => T = (item) => item,
): Record<K, T[]> {
  const item = groups[from].find((x) => x.id === id);
  if (!item) return groups;
  const source = groups[from].filter((x) => x.id !== id);
  const target = from === to ? source : [...groups[to]];
  target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, from === to ? item : patch(item, to));
  return { ...groups, [from]: source, [to]: target };
}

export function flatten<K extends string, T>(groups: Record<K, T[]>): T[] {
  return (Object.keys(groups) as K[]).flatMap((k) => groups[k]);
}

export const withStatus = (job: Job, status: Status): Job => ({ ...job, status, movedAt: new Date().toISOString() });

/* ---------- seed + runtime guard ---------- */

const ago = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

export const SEED_BOARD: Board = {
  applied: [
    { id: "j1", company: "Northwind Roasters", role: "Seasonal packaging", location: "Toronto · Remote", status: "applied", source: "Referral", priority: "high", createdAt: ago(1), movedAt: ago(1), rate: "$3,200" },
    { id: "j2", company: "Kilo Health", role: "Onboarding illustrations", location: "Vilnius · Remote", status: "applied", source: "LinkedIn", priority: "medium", createdAt: ago(3), movedAt: ago(3) },
    { id: "j3", company: "Sari Grocer", role: "App icon + store assets", location: "Manila · Hybrid", status: "applied", source: "Upwork", priority: "low", createdAt: ago(6), movedAt: ago(6), rate: "$900" },
  ],
  interviewing: [
    { id: "j4", company: "Elevvo", role: "Learning platform rebrand", location: "Cairo · Remote", status: "interviewing", source: "Website", priority: "high", createdAt: ago(9), movedAt: ago(2), rate: "$5,400", notes: "Second call Thursday, bring the moodboard." },
    { id: "j5", company: "Harbor & Pine", role: "Restaurant identity", location: "Melbourne · Remote", status: "interviewing", source: "Cold email", priority: "medium", createdAt: ago(12), movedAt: ago(4) },
  ],
  offer: [
    { id: "j6", company: "Fieldnote Audio", role: "Podcast cover system", location: "Berlin · Remote", status: "offer", source: "Referral", priority: "high", createdAt: ago(15), movedAt: ago(1), rate: "$2,800" },
  ],
  rejected: [
    { id: "j7", company: "Brightline Bank", role: "Annual report", location: "Singapore · Remote", status: "rejected", source: "LinkedIn", priority: "medium", createdAt: ago(20), movedAt: ago(8) },
  ],
};

function isJob(raw: unknown): raw is Job {
  if (typeof raw !== "object" || raw === null) return false;
  const j = raw as Record<string, unknown>;
  return (
    typeof j.id === "string" &&
    typeof j.company === "string" &&
    typeof j.role === "string" &&
    typeof j.location === "string" &&
    typeof j.createdAt === "string" &&
    typeof j.movedAt === "string" &&
    typeof j.source === "string" &&
    typeof j.priority === "string" &&
    isStatus(j.status)
  );
}

export function isBoard(raw: unknown): raw is Board {
  if (typeof raw !== "object" || raw === null) return false;
  const b = raw as Record<string, unknown>;
  return STATUSES.every((s) => Array.isArray(b[s]) && (b[s] as unknown[]).every(isJob));
}
