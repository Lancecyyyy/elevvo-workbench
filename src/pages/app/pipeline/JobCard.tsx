import { useEffect, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, ExternalLink, FolderKanban, StickyNote, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { timeAgo } from "../../../lib/workspace/store";
import type { Job, Priority } from "../../../lib/workspace/pipeline";

const PRIORITY: Record<Priority, { label: string; color: string }> = {
  high: { label: "High", color: "var(--bad)" },
  medium: { label: "Medium", color: "var(--warn)" },
  low: { label: "Low", color: "var(--faint)" },
};

const SWATCHES = [
  { bg: "#261cc1", fg: "#fffdfb" },
  { bg: "#f7dd7d", fg: "#150f6e" },
  { bg: "#150f6e", fg: "#f7dd7d" },
  { bg: "#5fd39c", fg: "#0b0930" },
  { bg: "#ff9b85", fg: "#0b0930" },
  { bg: "#b9b3ff", fg: "#150f6e" },
];
export function swatch(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SWATCHES[h % SWATCHES.length];
}

interface BodyProps {
  job: Job;
  overlay?: boolean;
  dimmed?: boolean;
  focused?: boolean;
  onEdit?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onConvert?: (job: Job) => void;
}

export function CardBody({ job, overlay = false, dimmed = false, focused = false, onEdit, onDelete, onConvert }: BodyProps) {
  const s = swatch(job.company);
  const p = PRIORITY[job.priority];
  const stop = (e: RPointerEvent | RKeyboardEvent) => e.stopPropagation();

  return (
    <div
      className={`group relative rounded-xl border bg-surface p-3.5 transition-[opacity,box-shadow,border-color] ${
        overlay ? "border-brand shadow-lg" : focused ? "border-brand ring-4 ring-brand/15" : "border-line shadow-sm hover:border-line-2"
      } ${dimmed ? "opacity-35" : ""}`}
    >
      <button type="button" onClick={() => onEdit?.(job)} onPointerDown={(e) => e.button !== 0 && stop(e)} className="block w-full text-left" tabIndex={-1}>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[14px] font-semibold" style={{ background: s.bg, color: s.fg }}>
            {job.company.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] leading-snug font-semibold">{job.role}</p>
            <p className="truncate text-[13px] text-muted">{job.company}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="inline-flex items-center gap-1 text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            {p.label}
          </span>
          <span className="text-faint">·</span>
          <span className="truncate text-muted">{job.location}</span>
          {job.rate && <span className="ml-auto rounded-md bg-sunk px-1.5 py-0.5 font-medium tabular">{job.rate}</span>}
        </div>
      </button>

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5 text-[12px] text-faint">
        <span>{job.source}</span>
        <span>·</span>
        <span>moved {timeAgo(job.movedAt)}</span>
        {job.notes && <StickyNote size={12} className="text-muted" aria-label="Has notes" />}
        <span className="ml-auto flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {job.url && (
            <a href={job.url} target="_blank" rel="noreferrer" onPointerDown={stop} aria-label="Open posting" className="grid h-6 w-6 place-items-center rounded-md hover:bg-sunk hover:text-ink">
              <ExternalLink size={13} />
            </a>
          )}
          {onDelete && (
            <button type="button" onPointerDown={stop} onKeyDown={stop} onClick={() => onDelete(job)} aria-label={`Delete ${job.role}`} className="grid h-6 w-6 place-items-center rounded-md hover:bg-sunk hover:text-bad">
              <Trash2 size={13} />
            </button>
          )}
        </span>
      </div>

      {job.status === "offer" &&
        (job.projectId ? (
          <Link to={`/app/projects?open=${job.projectId}`} onPointerDown={stop} className="mt-2.5 flex items-center justify-between rounded-lg bg-ok/12 px-3 py-2 text-[12.5px] font-medium text-ok">
            <span className="inline-flex items-center gap-1.5"><FolderKanban size={13} /> Project {job.projectId}</span>
            <ArrowUpRight size={13} />
          </Link>
        ) : (
          onConvert && (
            <button type="button" onPointerDown={stop} onKeyDown={stop} onClick={() => onConvert(job)} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink py-2 text-[12.5px] font-medium text-bg transition-transform hover:-translate-y-px">
              <FolderKanban size={13} /> Make it a project
            </button>
          )
        ))}
    </div>
  );
}

export default function JobCard(props: Omit<BodyProps, "overlay">) {
  const { job } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });
  return (
    <li
      id={`job-${job.id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`touch-manipulation list-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand ${isDragging ? "opacity-30" : ""}`}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable job card"
      aria-label={`${job.role} at ${job.company}, ${job.status}`}
    >
      <CardBody {...props} />
    </li>
  );
}

/** The lifted card that follows the cursor. Tilts in 3D with drag velocity. */
export function DragCard({ job }: { job: Job }) {
  const vx = useMotionValue(0);
  const vy = useMotionValue(0);
  const rotY = useSpring(useTransform(vx, [-30, 30], [-14, 14]), { stiffness: 260, damping: 18 });
  const rotX = useSpring(useTransform(vy, [-30, 30], [12, -12]), { stiffness: 260, damping: 18 });
  useEffect(() => {
    let t = 0;
    const move = (e: PointerEvent) => {
      vx.set(Math.max(-30, Math.min(30, e.movementX * 3)));
      vy.set(Math.max(-30, Math.min(30, e.movementY * 3)));
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        vx.set(0);
        vy.set(0);
      }, 80);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      window.clearTimeout(t);
    };
  }, [vx, vy]);
  return (
    <div style={{ perspective: 800 }}>
      <motion.div style={{ rotateX: rotX, rotateY: rotY, rotateZ: 2 }} initial={{ scale: 1 }} animate={{ scale: 1.04 }}>
        <CardBody job={job} overlay />
      </motion.div>
    </div>
  );
}
