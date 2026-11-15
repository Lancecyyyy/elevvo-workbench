import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Search, X } from "lucide-react";
import JobCard, { DragCard } from "./JobCard";
import JobModal from "./JobModal";
import { Skeleton } from "../../../components/ui/Card";
import { useWorkspace } from "../../../lib/workspace/store";
import { useToast } from "../../../lib/toast";
import {
  COLUMNS, PRIORITIES, findContainer, moveBetween, withStatus,
  type Column, type Job, type JobFormValues, type Priority, type Status,
} from "../../../lib/workspace/pipeline";

interface ColumnProps {
  column: Column;
  jobs: Job[];
  matches: (j: Job) => boolean;
  focusId: string | null;
  onAdd: (s: Status) => void;
  onEdit: (j: Job) => void;
  onDelete: (j: Job) => void;
  onConvert: (j: Job) => void;
}

function ColumnView({ column, jobs, matches, focusId, onAdd, onEdit, onDelete, onConvert }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section
      aria-label={column.title}
      className={`flex w-[82vw] max-w-[330px] shrink-0 snap-start flex-col rounded-2xl p-2.5 transition-colors sm:w-[300px] lg:w-auto lg:max-w-none ${isOver ? "bg-brand/8 ring-2 ring-brand/40" : "bg-sunk/80"}`}
    >
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-3">
        <span className="h-2 w-2 rounded-full" style={{ background: column.accent }} />
        <h2 className="text-[14px] font-semibold">{column.title}</h2>
        <span className="text-[13px] text-muted tabular">{jobs.length}</span>
        <button onClick={() => onAdd(column.id)} aria-label={`Add to ${column.title}`} className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink">
          <Plus size={15} />
        </button>
      </header>
      <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-[160px] flex-1 flex-col gap-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} dimmed={!matches(j)} focused={focusId === j.id} onEdit={onEdit} onDelete={onDelete} onConvert={onConvert} />
          ))}
          {jobs.length === 0 && (
            <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-line-2 px-4 py-8 text-center text-[13px] text-faint">
              {column.hint}.<br />Drop a card here.
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}

function BoardSkeleton() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0" aria-busy="true" aria-label="Loading board">
      {COLUMNS.map((c, ci) => (
        <div key={c.id} className="w-[82vw] max-w-[330px] shrink-0 rounded-2xl bg-sunk/80 p-2.5 sm:w-[300px] lg:w-auto lg:max-w-none">
          <div className="flex items-center gap-2 px-1.5 pt-1 pb-3">
            <span className="h-2 w-2 rounded-full" style={{ background: c.accent }} />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 - (ci % 2) }).map((_, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-3.5">
                <div className="flex gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Skeleton className="h-3.5 w-4/5" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Pipeline() {
  const { board, setBoard, boardLoading, allJobs, log, convertOffer } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ status: Status; job?: Job } | null>(null);
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState<"all" | Priority>("all");
  const startStatus = useRef<Status | null>(null);
  const lastDrag = useRef(0);
  const focusId = params.get("focus");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // deep links from the command palette and overview
  useEffect(() => {
    if (params.get("new") === "1") {
      setModal({ status: "applied" });
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);
  useEffect(() => {
    if (!focusId || boardLoading) return;
    const t = window.setTimeout(() => document.getElementById(`job-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }), 200);
    const clear = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      next.delete("focus");
      setParams(next, { replace: true });
    }, 3200);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(clear);
    };
  }, [focusId, boardLoading, params, setParams]);

  const activeJob = activeId ? allJobs.find((j) => j.id === activeId) : undefined;
  const matches = useCallback(
    (j: Job) => {
      const s = q.trim().toLowerCase();
      return (!s || `${j.company} ${j.role} ${j.location}`.toLowerCase().includes(s)) && (prio === "all" || j.priority === prio);
    },
    [q, prio],
  );
  const matchCount = useMemo(() => allJobs.filter(matches).length, [allJobs, matches]);

  const total = allJobs.length;
  const responded = board.interviewing.length + board.offer.length + board.rejected.length;
  const value = [...board.interviewing, ...board.offer].reduce((n, j) => n + (Number((j.rate ?? "").replace(/[^\d.]/g, "")) || 0), 0);

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    setActiveId(id);
    startStatus.current = findContainer(board, id) ?? null;
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const a = String(active.id);
    const o = String(over.id);
    setBoard((b) => {
      const from = findContainer(b, a);
      const to = findContainer(b, o);
      if (!from || !to || from === to) return b;
      const overIndex = b[to].findIndex((j) => j.id === o);
      return moveBetween(b, from, to, a, overIndex === -1 ? b[to].length : overIndex, withStatus);
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const a = String(active.id);
    setActiveId(null);
    lastDrag.current = Date.now();
    if (over) {
      const o = String(over.id);
      setBoard((b) => {
        const col = findContainer(b, a);
        if (!col || col !== findContainer(b, o)) return b;
        const to = b[col].findIndex((j) => j.id === o);
        const from = b[col].findIndex((j) => j.id === a);
        if (to === -1 || to === from) return b;
        return moveBetween(b, col, col, a, to);
      });
    }
    const job = allJobs.find((j) => j.id === a);
    const now = findContainer(board, a);
    if (job && now && startStatus.current && now !== startStatus.current) {
      const title = COLUMNS.find((c) => c.id === now)?.title ?? now;
      log("pipeline", "You", `moved ${job.company} to ${title}`, `/app/pipeline?focus=${job.id}`);
      if (now === "offer") toast({ title: `${job.company} sent an offer`, body: "Turn it into a project when you're ready." });
    }
    startStatus.current = null;
  };

  const save = useCallback(
    (v: JobFormValues) => {
      const clean = {
        company: v.company.trim(),
        role: v.role.trim(),
        location: v.location.trim(),
        source: v.source,
        priority: v.priority,
        rate: v.rate.trim() || undefined,
        url: v.url.trim() || undefined,
        notes: v.notes.trim() || undefined,
      };
      const editing = modal?.job;
      if (editing) {
        setBoard((b) => {
          const col = findContainer(b, editing.id);
          if (!col) return b;
          const updated: Job = { ...editing, ...clean, status: v.status, movedAt: v.status !== editing.status ? new Date().toISOString() : editing.movedAt };
          const without = { ...b, [col]: b[col].filter((j) => j.id !== editing.id) };
          return col === v.status ? { ...b, [col]: b[col].map((j) => (j.id === editing.id ? updated : j)) } : { ...without, [v.status]: [updated, ...without[v.status]] };
        });
        toast({ title: "Pitch updated" });
      } else {
        const now = new Date().toISOString();
        const job: Job = { id: crypto.randomUUID(), ...clean, status: v.status, createdAt: now, movedAt: now };
        setBoard((b) => ({ ...b, [job.status]: [job, ...b[job.status]] }));
        log("pipeline", "You", `added a pitch for ${job.company}`, `/app/pipeline?focus=${job.id}`);
        toast({ title: "Added to the board", body: `${job.role} · ${job.company}` });
      }
      setModal(null);
    },
    [modal, setBoard, log, toast],
  );

  const remove = (job: Job) => {
    const col = findContainer(board, job.id);
    if (!col) return;
    const index = board[col].findIndex((j) => j.id === job.id);
    setBoard((b) => ({ ...b, [col]: b[col].filter((j) => j.id !== job.id) }));
    toast({
      title: "Pitch deleted",
      body: `${job.role} · ${job.company}`,
      action: {
        label: "Undo",
        run: () =>
          setBoard((b) => {
            const list = [...b[col]];
            list.splice(index, 0, job);
            return { ...b, [col]: list };
          }),
      },
    });
  };

  const convert = (job: Job) => {
    const project = convertOffer(job);
    toast({ title: "Project created", body: `${project.name} is now on your dashboard.`, action: { label: "Open", run: () => navigate(`/app/projects?open=${project.id}`) } });
  };

  const closeModal = useCallback(() => setModal(null), []);
  const filtering = q.trim() !== "" || prio !== "all";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[44px] leading-none">Pipeline</h1>
          <p className="mt-1.5 max-w-[56ch] text-[14px] text-muted">Every gig you've pitched. Drag cards between stages, or press space on a card and use the arrow keys.</p>
        </div>
        <button onClick={() => setModal({ status: "applied" })} disabled={boardLoading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[14px] font-medium text-bg disabled:opacity-50">
          <Plus size={16} /> Add pitch
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { k: "Tracked", v: String(total) },
          { k: "Response rate", v: total ? `${Math.round((responded / total) * 100)}%` : "–" },
          { k: "Offers", v: String(board.offer.length) },
          { k: "Value in play", v: `$${value.toLocaleString()}` },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-[12.5px] text-muted">{s.k}</p>
            {boardLoading ? <Skeleton className="mt-1.5 h-6 w-14" /> : <p className="text-[22px] font-semibold tracking-[-0.02em] tabular">{s.v}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label className="flex h-9 w-full items-center rounded-lg border border-line-2 bg-surface px-3 focus-within:border-brand sm:w-64">
          <Search size={15} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a company or role" aria-label="Search pitches" className="h-full w-full bg-transparent px-2 text-[14px] outline-none" />
          {q && <button onClick={() => setQ("")} aria-label="Clear search" className="text-faint hover:text-ink"><X size={14} /></button>}
        </label>
        <div className="flex gap-1">
          {(["all", ...PRIORITIES] as const).map((p) => (
            <button key={p} onClick={() => setPrio(p)} className={`rounded-full px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${prio === p ? "bg-ink text-bg" : "text-muted hover:bg-sunk hover:text-ink"}`}>
              {p === "all" ? "Any priority" : p}
            </button>
          ))}
        </div>
        {filtering && <span className="text-[13px] text-muted">{matchCount} of {total} match · others are dimmed, still draggable</span>}
      </div>

      <div className="mt-5">
        {boardLoading ? (
          <BoardSkeleton />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible lg:px-0">
              {COLUMNS.map((c) => (
                <ColumnView
                  key={c.id}
                  column={c}
                  jobs={board[c.id]}
                  matches={matches}
                  focusId={focusId}
                  onAdd={(s) => setModal({ status: s })}
                  onEdit={(j) => Date.now() - lastDrag.current > 300 && setModal({ status: j.status, job: j })}
                  onDelete={remove}
                  onConvert={convert}
                />
              ))}
            </motion.div>
            <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(.22,1,.36,1)" }}>{activeJob ? <DragCard job={activeJob} /> : null}</DragOverlay>
          </DndContext>
        )}
      </div>

      <AnimatePresence>{modal && <JobModal key={modal.job?.id ?? "new"} initialStatus={modal.status} job={modal.job} onClose={closeModal} onSubmit={save} />}</AnimatePresence>
    </div>
  );
}
