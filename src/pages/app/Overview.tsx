import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CalendarClock, FolderKanban, Info, SquareKanban, Wallet, X } from "lucide-react";
import { Card, CardHead, Segmented, Skeleton } from "../../components/ui/Card";
import { ACTIVITY_ICON } from "../../components/app/AppLayout";
import { COLUMNS } from "../../lib/workspace/pipeline";
import { daysUntil, money, timeAgo, useWorkspace } from "../../lib/workspace/store";
import type { ActivityKind, ProjectStatus } from "../../lib/workspace/types";
import { readStore, writeStore } from "../../lib/prefs";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  "In progress": "var(--brand)",
  Review: "var(--hi)",
  "On hold": "var(--line-2)",
  Completed: "var(--ok)",
};

const FEED_FILTERS: { id: "all" | ActivityKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "payment", label: "Payments" },
  { id: "pipeline", label: "Pipeline" },
  { id: "project", label: "Projects" },
  { id: "message", label: "Messages" },
];

interface TipPayload {
  value: number;
  payload: { month: string };
}
function EarnTip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-night px-3 py-2 text-cream shadow-lg">
      <p className="text-[12px] opacity-60">{payload[0].payload.month}</p>
      <p className="text-[15px] font-semibold tabular">{money(payload[0].value)}</p>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Overview() {
  const { ws, board, boardLoading } = useWorkspace();
  const navigate = useNavigate();
  const [range, setRange] = useState<"6" | "12">("6");
  const [feed, setFeed] = useState<"all" | ActivityKind>("all");
  const [feedLimit, setFeedLimit] = useState(7);
  const [banner, setBanner] = useState(() => readStore("tf-banner") !== "off");

  const active = ws.projects.filter((p) => p.status !== "Completed");
  const earnings = ws.earnings.slice(-Number(range));
  const total = earnings.reduce((s, e) => s + e.value, 0);
  const last = ws.earnings[ws.earnings.length - 1].value;
  const prev = ws.earnings[ws.earnings.length - 2].value;
  const delta = Math.round(((last - prev) / prev) * 100);
  const upcoming = useMemo(() => [...active].sort((a, b) => a.deadline.localeCompare(b.deadline)), [active]);
  const dueSoon = upcoming.filter((p) => daysUntil(p.deadline) <= 14).length;
  const openOffers = board.offer.filter((j) => !j.projectId);
  const pitches = board.applied.length + board.interviewing.length;

  const byStatus = useMemo(() => {
    const m = new Map<ProjectStatus, number>();
    ws.projects.forEach((p) => m.set(p.status, (m.get(p.status) ?? 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [ws.projects]);

  const feedItems = ws.activity.filter((a) => feed === "all" || a.kind === feed);

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {banner && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px]">
              <Info size={16} className="shrink-0 text-brand" />
              <p className="flex-1 text-muted">
                You're in a demo workspace. Everything you change is saved in this browser, and you can reset it from{" "}
                <Link to="/app/settings" className="font-medium text-ink underline-offset-2 hover:underline">Settings</Link>.
              </p>
              <button
                onClick={() => {
                  setBanner(false);
                  writeStore("tf-banner", "off");
                }}
                aria-label="Dismiss"
                className="text-faint hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <p className="text-[13.5px] text-muted">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 font-display text-[clamp(36px,4.4vw,52px)] leading-none">
            {greeting()}, {ws.profile.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {dueSoon} {dueSoon === 1 ? "deadline" : "deadlines"} in the next two weeks
            {!boardLoading && openOffers.length > 0 && (
              <>
                {" "}and{" "}
                <Link to="/app/pipeline" className="font-medium text-brand hover:underline">
                  {openOffers.length} {openOffers.length === 1 ? "offer" : "offers"} waiting
                </Link>
              </>
            )}
            .
          </p>
        </div>
        <Link to="/app/pipeline?new=1" className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[14px] font-medium text-bg">
          <SquareKanban size={16} /> Add a pitch
        </Link>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: FolderKanban, label: "Active projects", value: String(active.length), note: `${ws.projects.length} total`, to: "/app/projects" },
          { icon: Wallet, label: `Earned · ${range} months`, value: money(total), note: `${delta >= 0 ? "+" : ""}${delta}% vs last month`, hero: true },
          { icon: CalendarClock, label: "Due in 14 days", value: String(dueSoon), note: upcoming[0] ? `Next: ${upcoming[0].client}` : "Nothing due", to: "/app/projects" },
          { icon: SquareKanban, label: "Open pitches", value: boardLoading ? null : String(pitches), note: boardLoading ? null : `${openOffers.length} offers to review`, to: "/app/pipeline" },
        ].map((s) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <s.icon size={17} className={s.hero ? "text-butter" : "text-muted"} />
                {s.to && <ArrowUpRight size={15} className="text-faint opacity-0 transition-opacity group-hover:opacity-100" />}
              </div>
              <p className={`mt-6 text-[13px] ${s.hero ? "text-cream/65" : "text-muted"}`}>{s.label}</p>
              {s.value === null ? <Skeleton className="mt-1.5 h-8 w-16" /> : <p className="mt-0.5 text-[28px] leading-tight font-semibold tracking-[-0.02em] tabular">{s.value}</p>}
              {s.note === null ? <Skeleton className="mt-2 h-3.5 w-24" /> : <p className={`mt-0.5 truncate text-[13px] ${s.hero ? "text-butter" : "text-muted"}`}>{s.note}</p>}
            </>
          );
          const cls = `group block rounded-2xl p-4 transition-colors ${s.hero ? "grain bg-cobalt text-cream dark:bg-[#1c1780]" : "border border-line bg-surface hover:border-line-2"}`;
          return s.to ? (
            <Link key={s.label} to={s.to} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={s.label} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <Card>
          <CardHead
            title="Earnings"
            sub={`${money(total)} over the last ${range} months`}
            right={<Segmented id="range" label="Range" value={range} onChange={setRange} options={[{ id: "6", label: "6M" }, { id: "12", label: "12M" }]} />}
          />
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings} margin={{ top: 6, right: 0, left: -14, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--faint)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--faint)", fontSize: 12 }} tickFormatter={(v: number) => `${v / 1000}k`} />
                <Tooltip content={<EarnTip />} cursor={{ fill: "var(--sunk)", radius: 8 }} />
                <Bar dataKey="value" radius={[8, 8, 3, 3]} maxBarSize={44} animationDuration={600}>
                  {earnings.map((e, i) => (
                    <Cell key={e.month} fill={i === earnings.length - 1 ? "var(--brand)" : "var(--hi)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead title="Projects by status" sub={`${ws.projects.length} projects`} />
          <div className="flex items-center gap-5">
            <div className="relative h-[170px] w-[170px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" innerRadius={54} outerRadius={80} paddingAngle={3} stroke="none" cornerRadius={5} animationDuration={600}>
                    {byStatus.map((s) => (
                      <Cell key={s.name} fill={STATUS_COLOR[s.name]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-[26px] leading-none font-semibold tabular">{active.length}</p>
                  <p className="text-[12px] text-muted">active</p>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-2.5">
              {byStatus.map((s) => (
                <li key={s.name}>
                  <Link to={`/app/projects?status=${encodeURIComponent(s.name)}`} className="flex items-center gap-2.5 text-[14px] hover:text-brand">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: STATUS_COLOR[s.name] }} />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-muted tabular">{s.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.65fr]">
        <div className="space-y-5">
          <Card>
            <CardHead title="Coming up" right={<Link to="/app/projects" className="text-[13px] font-medium text-brand">All projects</Link>} />
            <ul className="-mx-2 space-y-0.5">
              {upcoming.slice(0, 4).map((p) => {
                const d = daysUntil(p.deadline);
                return (
                  <li key={p.id}>
                    <button onClick={() => navigate(`/app/projects?open=${p.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-sunk">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-center leading-none ${d <= 7 ? "bg-bad/10 text-bad" : "bg-sunk text-ink"}`}>
                        <span>
                          <span className="block text-[15px] font-semibold tabular">{d}</span>
                          <span className="text-[10px]">days</span>
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{p.name}</span>
                        <span className="block truncate text-[12.5px] text-muted">
                          {p.client} · {p.place.city}
                        </span>
                      </span>
                      <span className="w-14 shrink-0">
                        <span className="block h-1.5 overflow-hidden rounded-full bg-sunk">
                          <span className="block h-full rounded-full bg-brand" style={{ width: `${p.progress}%` }} />
                        </span>
                        <span className="mt-1 block text-right text-[11.5px] text-muted tabular">{p.progress}%</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHead title="Pipeline" right={<Link to="/app/pipeline" className="text-[13px] font-medium text-brand">Open board</Link>} />
            <div className="space-y-3">
              {COLUMNS.map((c) => {
                const n = board[c.id].length;
                const max = Math.max(1, ...COLUMNS.map((x) => board[x.id].length));
                return (
                  <div key={c.id} className="flex items-center gap-3 text-[13.5px]">
                    <span className="w-24 shrink-0 text-muted">{c.title}</span>
                    {boardLoading ? (
                      <Skeleton className="h-2.5 flex-1" />
                    ) : (
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunk">
                        <motion.span className="block h-full rounded-full" style={{ background: c.accent }} initial={{ width: 0 }} animate={{ width: `${(n / max) * 100}%` }} transition={{ duration: 0.6 }} />
                      </span>
                    )}
                    <span className="w-5 text-right font-medium tabular">{boardLoading ? "" : n}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card id="activity" className="scroll-mt-24">
          <CardHead title="Activity" sub="Everything that happens in the workspace, including messages sent from the website." />
          <div className="no-scrollbar -mx-1 mb-3 flex gap-1 overflow-x-auto px-1">
            {FEED_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFeed(f.id);
                  setFeedLimit(7);
                }}
                className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${feed === f.id ? "bg-ink text-bg" : "text-muted hover:bg-sunk hover:text-ink"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {feedItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-2 py-10 text-center text-[14px] text-muted">Nothing here yet.</p>
          ) : (
            <ol className="relative">
              <AnimatePresence initial={false}>
                {feedItems.slice(0, feedLimit).map((a) => {
                  const Icon = ACTIVITY_ICON[a.kind];
                  const isNew = a.at > ws.lastReadAt;
                  return (
                    <motion.li key={a.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative flex gap-3 pb-4 last:pb-0">
                      <span className="absolute top-9 bottom-0 left-[15px] w-px bg-line" aria-hidden="true" />
                      <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full ${isNew ? "bg-hi text-on-hi" : "bg-sunk text-muted"}`}>
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-[14px] leading-snug">
                          <span className="font-medium">{a.who}</span> <span className="text-muted">{a.text}</span>
                        </p>
                        <p className="text-[12.5px] text-faint">
                          {timeAgo(a.at)}
                          {a.link && (
                            <>
                              {" · "}
                              <Link to={a.link} className="font-medium text-brand hover:underline">
                                Open
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
          {feedItems.length > feedLimit && (
            <button onClick={() => setFeedLimit((n) => n + 7)} className="mt-4 w-full rounded-lg border border-line py-2 text-[13.5px] font-medium text-muted hover:text-ink">
              Show more
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
