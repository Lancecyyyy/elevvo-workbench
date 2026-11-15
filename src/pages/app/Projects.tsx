import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { ArrowDownUp, CalendarDays, Globe2, LayoutList, MapPin, Plus, Search, SquareKanban, Table2, Trash2, X } from "lucide-react";
import { daysUntil, money, timeAgo, useWorkspace } from "../../lib/workspace/store";
import { PLACES } from "../../lib/workspace/seed";
import { STATUS_ORDER, type Project, type ProjectStatus } from "../../lib/workspace/types";
import { useToast } from "../../lib/toast";

export const STATUS_STYLE: Record<ProjectStatus, string> = {
  "In progress": "bg-brand/12 text-brand",
  Review: "bg-hi text-on-hi",
  Completed: "bg-ok/14 text-ok",
  "On hold": "bg-sunk text-muted",
};

type SortKey = "deadline" | "budget" | "progress";

function Deadline({ iso, done }: { iso: string; done: boolean }) {
  const d = daysUntil(iso);
  const date = new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="text-[14px]">{date}</span>
      <span className={`text-[12px] ${!done && d >= 0 && d <= 7 ? "text-bad" : "text-faint"}`}>{done ? "Delivered" : d < 0 ? `${-d}d overdue` : `${d}d left`}</span>
    </span>
  );
}

interface NewProjectForm {
  name: string;
  client: string;
  placeId: string;
  deadline: string;
  budget: number;
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { addProject } = useWorkspace();
  const toast = useToast();
  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<NewProjectForm>({
    defaultValues: { name: "", client: "", placeId: "manila", deadline: new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10), budget: 1500 },
  });
  useEffect(() => {
    setFocus("name");
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [setFocus, onClose]);

  const submit = (v: NewProjectForm) => {
    const p: Project = {
      id: `P-${1100 + Math.floor(Math.random() * 800)}`,
      name: v.name.trim(),
      client: v.client.trim(),
      place: PLACES[v.placeId] ?? PLACES.manila,
      status: "In progress",
      deadline: v.deadline,
      budget: Number(v.budget),
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    addProject(p);
    toast({ title: "Project created", body: `${p.name} for ${p.client}` });
    onClose();
  };
  const input = (bad: boolean) => `h-11 w-full rounded-lg border bg-bg px-3 text-[14.5px] outline-none focus:border-brand ${bad ? "border-bad" : "border-line-2"}`;
  const label = "mb-1.5 block text-[13px] font-medium";

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-end bg-night/50 sm:place-items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label="New project"
        onSubmit={handleSubmit(submit)}
        noValidate
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
        className="w-full rounded-t-2xl bg-surface p-6 shadow-lg sm:max-w-[480px] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">New project</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-sunk">
            <X size={17} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="np-name" className={label}>Project name</label>
            <input id="np-name" className={input(!!errors.name)} placeholder="Spring menu refresh" {...register("name", { required: "Give it a name" })} />
            {errors.name && <p className="mt-1 text-[13px] text-bad">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="np-client" className={label}>Client</label>
            <input id="np-client" className={input(!!errors.client)} placeholder="Kusina Uno" {...register("client", { required: "Who's it for?" })} />
            {errors.client && <p className="mt-1 text-[13px] text-bad">{errors.client.message}</p>}
          </div>
          <div>
            <label htmlFor="np-place" className={label}>Client city</label>
            <select id="np-place" className={input(false)} {...register("placeId")}>
              {Object.values(PLACES).map((p) => (
                <option key={p.id} value={p.id}>{p.city}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="np-deadline" className={label}>Deadline</label>
            <input id="np-deadline" type="date" className={input(!!errors.deadline)} {...register("deadline", { required: "Pick a date" })} />
          </div>
          <div>
            <label htmlFor="np-budget" className={label}>Budget (USD)</label>
            <input id="np-budget" type="number" min={0} className={input(!!errors.budget)} {...register("budget", { valueAsNumber: true, min: { value: 1, message: "Must be above 0" } })} />
            {errors.budget && <p className="mt-1 text-[13px] text-bad">{errors.budget.message}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-[14px] font-medium hover:bg-sunk">Cancel</button>
          <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-[14px] font-medium text-on-brand">Create project</button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ProjectDrawer({ project, onClose }: { project: Project; onClose: () => void }) {
  const { ws, updateProject, removeProject, addProject } = useWorkspace();
  const toast = useToast();
  const [progress, setProgress] = useState(project.progress);
  useEffect(() => setProgress(project.progress), [project.progress, project.id]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const history = ws.activity.filter((a) => a.link?.includes(project.id)).slice(0, 5);

  const setStatus = (s: ProjectStatus) => {
    if (s === project.status) return;
    updateProject(project.id, { status: s, progress: s === "Completed" ? 100 : project.progress }, `moved ${project.name} to ${s}`);
    toast({ title: `Moved to ${s}` });
  };

  const commitProgress = () => {
    if (progress === project.progress) return;
    updateProject(project.id, { progress, status: progress === 100 ? "Completed" : project.status === "Completed" ? "In progress" : project.status }, `set ${project.name} to ${progress}%`);
  };

  const remove = () => {
    const snapshot = project;
    removeProject(project.id);
    onClose();
    toast({ title: "Project deleted", body: snapshot.name, action: { label: "Undo", run: () => addProject(snapshot) } });
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-[55] bg-night/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={project.name}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-[460px] flex-col overflow-y-auto bg-surface shadow-lg"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div className="min-w-0">
            <p className="text-[12.5px] text-muted">{project.id} · {project.client}</p>
            <h2 className="mt-1 text-[22px] leading-tight font-semibold tracking-[-0.01em]">{project.name}</h2>
            {project.fromJobId && (
              <Link to="/app/pipeline" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ok/12 px-2.5 py-0.5 text-[12px] font-medium text-ok">
                <SquareKanban size={12} /> Won from the pipeline
              </Link>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-sunk">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-7 p-6">
          <div>
            <p className="mb-2 text-[13px] font-medium">Status</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_ORDER.map((s) => (
                <button key={s} onClick={() => setStatus(s)} aria-pressed={project.status === s} className={`rounded-lg border px-3 py-2 text-left text-[13.5px] font-medium transition-colors ${project.status === s ? "border-ink bg-ink text-bg" : "border-line-2 hover:border-ink"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="pd-progress" className="text-[13px] font-medium">Progress</label>
              <span className="text-[20px] font-semibold tabular">{progress}%</span>
            </div>
            <input
              id="pd-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              onPointerUp={commitProgress}
              onKeyUp={commitProgress}
              onBlur={commitProgress}
              className="w-full accent-[var(--brand)]"
            />
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-sunk p-3">
              <dt className="text-[12.5px] text-muted">Budget</dt>
              <dd className="mt-0.5 text-[18px] font-semibold tabular">{money(project.budget)}</dd>
            </div>
            <div className="rounded-xl bg-sunk p-3">
              <dt className="text-[12.5px] text-muted">Deadline</dt>
              <dd className="mt-0.5">
                <label className="sr-only" htmlFor="pd-deadline">Deadline</label>
                <input
                  id="pd-deadline"
                  type="date"
                  value={project.deadline}
                  onChange={(e) => e.target.value && updateProject(project.id, { deadline: e.target.value })}
                  onBlur={(e) => e.target.value !== project.deadline && updateProject(project.id, { deadline: e.target.value }, `moved the ${project.name} deadline`)}
                  className="w-full bg-transparent text-[15px] font-semibold outline-none"
                />
              </dd>
            </div>
          </dl>

          <Link to={`/app/weather?city=${project.place.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-line-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-hi text-on-hi">
              <MapPin size={17} />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium">{project.place.city}, {project.place.country}</span>
              <span className="block text-[12.5px] text-muted">See weather and local time before you call</span>
            </span>
            <Globe2 size={17} className="text-faint" />
          </Link>

          <div>
            <p className="mb-2 text-[13px] font-medium">History</p>
            {history.length === 0 ? (
              <p className="text-[13.5px] text-muted">No changes yet. Edits you make here show up in the activity feed.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="text-[13.5px]">
                    <span className="font-medium">{h.who}</span> <span className="text-muted">{h.text}</span> <span className="text-faint">· {timeAgo(h.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-line p-6">
          <button onClick={remove} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-bad">
            <Trash2 size={15} /> Delete project
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export default function Projects() {
  const { ws } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("deadline");
  const [view, setView] = useState<"table" | "cards">("table");
  const [creating, setCreating] = useState(false);

  const statusParam = params.get("status");
  const filter: "All" | ProjectStatus = (STATUS_ORDER as readonly string[]).includes(statusParam ?? "") ? (statusParam as ProjectStatus) : "All";
  const openId = params.get("open");
  const open = ws.projects.find((p) => p.id === openId);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: k === "status" });
  };

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ws.projects
      .filter((p) => (filter === "All" || p.status === filter) && (!s || `${p.name} ${p.client} ${p.place.city}`.toLowerCase().includes(s)))
      .sort((a, b) => (sort === "deadline" ? a.deadline.localeCompare(b.deadline) : sort === "budget" ? b.budget - a.budget : b.progress - a.progress));
  }, [ws.projects, filter, q, sort]);

  const count = (s: "All" | ProjectStatus) => (s === "All" ? ws.projects.length : ws.projects.filter((p) => p.status === s).length);
  const totalBudget = rows.reduce((n, p) => n + p.budget, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[44px] leading-none">Projects</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {rows.length} shown · {money(totalBudget)} in budgets
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[14px] font-medium text-bg">
          <Plus size={16} /> New project
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {(["All", ...STATUS_ORDER] as const).map((s) => (
            <button key={s} onClick={() => setParam("status", s === "All" ? null : s)} className={`shrink-0 rounded-full px-3 py-1.5 text-[13.5px] font-medium transition-colors ${filter === s ? "bg-ink text-bg" : "text-muted hover:bg-sunk hover:text-ink"}`}>
              {s} <span className="opacity-55 tabular">{count(s)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="flex h-9 flex-1 items-center rounded-lg border border-line-2 bg-surface px-3 focus-within:border-brand lg:w-56 lg:flex-none">
            <Search size={15} className="text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" aria-label="Search projects" className="h-full w-full bg-transparent px-2 text-[14px] outline-none" />
          </label>
          <label className="relative flex h-9 items-center gap-1.5 rounded-lg border border-line-2 bg-surface pl-2.5 text-[13.5px]">
            <ArrowDownUp size={14} className="text-faint" />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort projects" className="h-full bg-transparent pr-2 outline-none">
              <option value="deadline">Deadline</option>
              <option value="budget">Budget</option>
              <option value="progress">Progress</option>
            </select>
          </label>
          <div className="hidden rounded-lg border border-line-2 bg-surface p-0.5 md:flex">
            {([["table", Table2], ["cards", LayoutList]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} aria-label={`${v} view`} className={`grid h-7 w-8 place-items-center rounded-md ${view === v ? "bg-sunk text-ink" : "text-faint"}`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-line-2 py-16 text-center">
          <p className="text-[16px] font-semibold">No projects here.</p>
          <p className="mt-1 text-[14px] text-muted">Try another filter, or win one from the pipeline.</p>
          <Link to="/app/pipeline" className="mt-4 rounded-lg border border-line-2 px-3.5 py-2 text-[14px] font-medium hover:border-ink">Open the pipeline</Link>
        </div>
      ) : (
        <>
          <div className={`mt-5 overflow-hidden rounded-2xl border border-line bg-surface ${view === "table" ? "hidden md:block" : "hidden"}`}>
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-line text-[12.5px] text-muted">
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Progress</th>
                  <th className="px-3 py-3 font-medium">Deadline</th>
                  <th className="px-3 py-3 font-medium">City</th>
                  <th className="px-5 py-3 text-right font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <motion.tr key={p.id} layout onClick={() => setParam("open", p.id)} className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-sunk/60">
                    <td className="px-5 py-3.5">
                      <button className="text-left font-medium hover:text-brand" onClick={(e) => { e.stopPropagation(); setParam("open", p.id); }}>
                        {p.name}
                      </button>
                      <p className="text-[12.5px] text-muted">{p.client}{p.fromJobId ? " · from pipeline" : ""}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-sunk">
                          <div className={`h-full rounded-full ${p.progress === 100 ? "bg-ok" : "bg-brand"}`} style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[12.5px] text-muted tabular">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5"><Deadline iso={p.deadline} done={p.status === "Completed"} /></td>
                    <td className="px-3 py-3.5 text-muted">{p.place.city}</td>
                    <td className="px-5 py-3.5 text-right font-medium tabular">{money(p.budget)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${view === "table" ? "md:hidden" : ""}`}>
            {rows.map((p) => (
              <button key={p.id} onClick={() => setParam("open", p.id)} className="rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-line-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{p.name}</p>
                    <p className="truncate text-[13px] text-muted">{p.client}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sunk">
                  <div className={`h-full rounded-full ${p.progress === 100 ? "bg-ok" : "bg-brand"}`} style={{ width: `${p.progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-muted">
                  <span className="inline-flex items-center gap-2"><CalendarDays size={14} /><Deadline iso={p.deadline} done={p.status === "Completed"} /></span>
                  <span className="text-[14px] font-medium text-ink tabular">{money(p.budget)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>{open && <ProjectDrawer key={open.id} project={open} onClose={() => setParam("open", null)} />}</AnimatePresence>
      <AnimatePresence>{creating && <NewProjectModal onClose={() => setCreating(false)} />}</AnimatePresence>
    </div>
  );
}
