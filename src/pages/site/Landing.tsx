import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, AtSign, Calendar, Check, ChevronDown, FolderKanban, Globe2, Hash, Keyboard, Layers, Pause, Play, RotateCcw, SquareKanban, Timer } from "lucide-react";
import Reveal from "../../components/ui/Reveal";
import { usePrefs } from "../../lib/prefs";
import { useWorkspace } from "../../lib/workspace/store";

const LanesScene = lazy(() => import("../../components/three/LanesScene"));

/* WebGL can be unavailable (old devices, blocked GPU). Fall back to a flat drawing. */
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FlatLanes() {
  return (
    <div className="grid h-full grid-cols-3 items-center gap-4 px-6">
      {["Later", "Next", "Now"].map((l, i) => (
        <div key={l} className="rounded-2xl bg-sunk p-3">
          <p className="mb-3 text-[12px] font-medium text-muted">{l}</p>
          {Array.from({ length: 3 - (i === 2 ? 1 : 0) }).map((_, j) => (
            <div key={j} className={`mb-2 h-12 rounded-lg ${i === 2 && j === 0 ? "bg-brand" : "bg-surface shadow-sm"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------- feature demos ---------------- */

const DAYS = ["today", "tomorrow", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function CaptureDemo() {
  const [text, setText] = useState("Send invoice to @halcyon tomorrow #work");
  const tokens = useMemo(() => {
    const words = text.toLowerCase().split(/\s+/);
    return {
      date: words.find((w) => DAYS.includes(w)),
      tags: words.filter((w) => w.startsWith("#") && w.length > 1),
      people: words.filter((w) => w.startsWith("@") && w.length > 1),
    };
  }, [text]);
  const title = text.replace(/(^|\s)[#@]\S+/g, "").replace(new RegExp(`\\b(${DAYS.join("|")})\\b`, "i"), "").replace(/\s+/g, " ").trim();

  return (
    <div className="rounded-xl border border-line bg-bg p-3">
      <label className="flex items-center gap-2 rounded-lg border border-line-2 bg-surface px-3 focus-within:border-brand">
        <kbd className="rounded border border-line-2 px-1.5 text-[11px] text-faint">Q</kbd>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-10 w-full bg-transparent text-[14px] outline-none"
          aria-label="Try quick capture"
        />
      </label>
      <div className="mt-3 rounded-lg bg-surface p-3 shadow-sm">
        <p className="truncate text-[14px] font-medium">{title || "Untitled task"}</p>
        <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {tokens.date && (
              <motion.span key={tokens.date} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="inline-flex items-center gap-1 rounded-md bg-hi px-2 py-0.5 text-[12px] text-on-hi capitalize">
                <Calendar size={11} /> {tokens.date}
              </motion.span>
            )}
            {tokens.people.map((p) => (
              <motion.span key={p} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="inline-flex items-center gap-1 rounded-md bg-brand/12 px-2 py-0.5 text-[12px] text-brand">
                <AtSign size={11} /> {p.slice(1)}
              </motion.span>
            ))}
            {tokens.tags.map((t) => (
              <motion.span key={t} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="inline-flex items-center gap-1 rounded-md bg-sunk px-2 py-0.5 text-[12px] text-muted">
                <Hash size={11} /> {t.slice(1)}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const PILE = [
  { t: "Reply to Pocketbank", lane: 0 },
  { t: "Plan Q1 rates", lane: 2 },
  { t: "Export dielines", lane: 0 },
  { t: "Update portfolio", lane: 2 },
  { t: "Call Tala Snacks", lane: 1 },
];

function LanesDemo() {
  const [sorted, setSorted] = useState(false);
  const lanes = ["Now", "Next", "Later"];
  return (
    <div className="rounded-xl border border-line bg-bg p-3">
      <LayoutGroup>
        {sorted ? (
          <div className="grid grid-cols-3 gap-2">
            {lanes.map((l, li) => (
              <div key={l}>
                <p className="mb-1.5 text-[11.5px] font-medium text-muted">{l}</p>
                <div className="space-y-1.5">
                  {PILE.filter((p) => p.lane === li).map((p) => (
                    <motion.div layoutId={p.t} key={p.t} className="rounded-md bg-surface px-2 py-1.5 text-[12px] leading-tight shadow-sm">
                      {p.t}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {PILE.map((p) => (
              <motion.div layoutId={p.t} key={p.t} className="rounded-md bg-surface px-2.5 py-1.5 text-[13px] shadow-sm">
                {p.t}
              </motion.div>
            ))}
          </div>
        )}
      </LayoutGroup>
      <button
        onClick={() => setSorted((s) => !s)}
        className="mt-3 w-full rounded-lg border border-line-2 bg-surface py-2 text-[13px] font-medium transition-colors hover:border-ink"
      >
        {sorted ? "Back to the pile" : "Sort it into lanes"}
      </button>
    </div>
  );
}

function FocusDemo() {
  const TOTAL = 25 * 60;
  const [left, setLeft] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    // demo runs at 30× speed so you can watch it move
    const id = window.setInterval(() => setLeft((l) => (l <= 30 ? (setRunning(false), 0) : l - 30)), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const R = 34;
  const C = 2 * Math.PI * R;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-bg p-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
          <motion.circle cx="40" cy="40" r={R} fill="none" stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} animate={{ strokeDashoffset: C * (left / TOTAL) }} transition={{ duration: 0.6 }} />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[15px] font-semibold tabular">
          {mm}:{ss}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">Halcyon logo refinements</p>
        <p className="text-[12.5px] text-muted">{left === 0 ? "Done. Take a walk." : running ? "Notifications held" : "25 min session"}</p>
        <div className="mt-2 flex gap-1.5">
          <button onClick={() => setRunning((r) => !r)} disabled={left === 0} className="inline-flex items-center gap-1.5 rounded-md bg-ink px-2.5 py-1 text-[12.5px] font-medium text-bg disabled:opacity-40">
            {running ? <Pause size={12} /> : <Play size={12} />} {running ? "Pause" : "Start"}
          </button>
          <button onClick={() => { setRunning(false); setLeft(TOTAL); }} className="grid h-7 w-7 place-items-center rounded-md border border-line-2 text-muted" aria-label="Reset timer">
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- content ---------------- */

const features = [
  { icon: Keyboard, title: "Capture in one keystroke", body: "Press Q anywhere and type like you talk. Dates, tags and people are picked out for you.", demo: <CaptureDemo /> },
  { icon: Layers, title: "Lanes, not lists", body: "Everything lands in Now, Next or Later, so the next thing to do is always obvious.", demo: <LanesDemo /> },
  { icon: Timer, title: "Focus mode", body: "Hide everything except the task in front of you. A quiet timer, no pings.", demo: <FocusDemo /> },
];

const reviews = [
  { q: "I used to run my studio out of three apps and a notebook. Now the pipeline, the projects and my week are the same screen, and I actually close the laptop at six.", name: "Ana Reyes", role: "Brand designer, Makati", big: true },
  { q: "The lanes idea sounds small until you try it. Monday planning went from an hour to ten minutes.", name: "Omar Haddad", role: "Engineering lead, Cairo" },
  { q: "Seeing my clients' time zones next to their deadlines saved me from a 3am call. Twice.", name: "Priya Nair", role: "Illustrator, Bengaluru" },
];

const plans = [
  { name: "Free", monthly: 0, blurb: "For one person getting organised.", perks: ["Unlimited tasks", "Now / Next / Later lanes", "Web and mobile apps"], cta: "Open the demo", to: "/app" },
  { name: "Pro", monthly: 8, blurb: "For freelancers who live in their list.", perks: ["Everything in Free", "Projects + client dashboard", "Gig pipeline board", "Client weather and time zones", "Focus mode"], cta: "Try Pro in the demo", to: "/app", featured: true },
  { name: "Team", monthly: 14, blurb: "Per member. For small studios.", perks: ["Everything in Pro", "Shared boards", "Roles and permissions", "Priority support"], cta: "Talk to sales", to: "/contact?topic=sales&plan=team" },
];

const faqs = [
  { q: "Is TaskFlow real?", a: "No. It's a fictional product built as an internship project, but the demo workspace is fully working. Everything you change is saved in your browser." },
  { q: "Can I move my data out?", a: "In the story, yes: export to CSV or JSON any time. In this demo, your data lives in localStorage and you can reset it from Settings." },
  { q: "What happens when my trial ends?", a: "You drop to Free and keep everything. Pro features become read-only until you upgrade." },
  { q: "Do you offer student pricing?", a: "Pro is free for students and interns. Send a note through the contact page with your school email." },
  { q: "Where does the weather data come from?", a: "Open-Meteo, a free and open weather API. City search uses their geocoding service too." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((f, i) => (
        <div key={f.q}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-6 py-5 text-left">
            <span className="text-[17px] font-medium">{f.q}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }} className="shrink-0 text-muted">
              <ChevronDown size={18} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="max-w-[62ch] pb-5 text-[15px] text-muted">{f.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  const { theme } = usePrefs();
  const { ws, board, boardLoading } = useWorkspace();
  const [finished, setFinished] = useState(0);
  const onFinish = useCallback(() => setFinished((n) => n + 1), []);
  const [yearly, setYearly] = useState(false);

  const active = ws.projects.filter((p) => p.status !== "Completed").length;
  const pitches = boardLoading ? "…" : String(board.applied.length + board.interviewing.length);
  const cities = new Set(ws.projects.map((p) => p.place.id)).size;

  return (
    <>
      {/* hero */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-6 px-5 pt-8 pb-10 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-4 lg:pt-14">
        <div className="relative z-10">
          <Link to="/app/pipeline" className="group inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface py-1 pr-3 pl-1 text-[13px] text-muted transition-colors hover:text-ink">
            <span className="rounded-full bg-hi px-2 py-0.5 text-[11.5px] font-semibold text-on-hi">New</span>
            Offers turn into projects in one click
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <h1 className="mt-6 font-display text-[clamp(56px,8.4vw,112px)] leading-[0.86] tracking-[-0.02em]">
            Your week,
            <br />
            <span className="relative isolate inline-block">
              untangled.
              <svg className="absolute -bottom-[0.02em] left-0 -z-10 h-[0.32em] w-full text-hi" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
                <motion.path d="M3 12 C 60 2, 120 18, 180 8 S 270 6, 297 10" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.3, ease: "easeInOut" }} />
              </svg>
            </span>
          </h1>
          <p className="mt-6 max-w-[44ch] text-[18px] leading-relaxed text-muted">
            TaskFlow keeps your tasks, client projects and next gigs on one board. Monday starts with a plan instead of a pile.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/app" className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-on-brand transition-transform hover:-translate-y-0.5">
              Open the demo workspace <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#pricing" className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-ink hover:bg-sunk">
              See pricing
            </a>
          </div>
          <p className="mt-8 text-[13px] text-faint">Free for one person. No card, no install.</p>
        </div>

        <div className="relative -mx-5 sm:mx-0">
          <div className="h-[380px] sm:h-[480px] lg:h-[560px]">
            <SceneBoundary fallback={<FlatLanes />}>
              <Suspense fallback={<FlatLanes />}>
                <LanesScene dark={theme === "dark"} onFinish={onFinish} />
              </Suspense>
            </SceneBoundary>
          </div>
          <p className="-mt-6 text-center text-[13px] text-muted lg:-mt-10">
            Click a card to finish it.{" "}
            <AnimatePresence mode="wait">
              <motion.span key={finished} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block font-medium text-ink tabular">
                {finished} done
              </motion.span>
            </AnimatePresence>{" "}
            since you got here.
          </p>
        </div>
      </section>

      {/* clients strip */}
      <section className="border-y border-line">
        <div className="no-scrollbar mx-auto flex max-w-[1200px] items-center gap-10 overflow-x-auto px-5 py-6 text-faint sm:px-8">
          <span className="shrink-0 text-[13px]">Running the week for studios like</span>
          {["Halcyon Coffee", "Pocketbank", "Tala Snacks", "Lumen Ventures", "Fieldnote", "Bayanihan Fund"].map((n, i) => (
            <span key={n} className={`shrink-0 text-[19px] whitespace-nowrap ${i % 2 ? "font-display text-[22px]" : "font-semibold tracking-tight"}`}>
              {n}
            </span>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8">
        <Reveal className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
          <h2 className="max-w-[14ch] font-display text-[clamp(40px,5vw,64px)] leading-[0.95]">Three ideas, done properly.</h2>
          <p className="max-w-[46ch] text-[16px] text-muted md:justify-self-end">Every demo below is live. Type in the box, sort the pile, start the timer.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5">
                {f.demo}
                <div className="mt-5 flex items-start gap-3 px-1">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-hi text-on-hi">
                    <f.icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold">{f.title}</h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* connected workspace */}
      <section className="grain bg-cobalt text-cream dark:bg-[#130f55]">
        <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8">
          <Reveal className="max-w-[640px]">
            <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95]">One workspace for the three things freelancers juggle.</h2>
            <p className="mt-5 text-[16px] text-cream/70">These numbers are read live from the demo workspace. Change something in there and come back.</p>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { icon: FolderKanban, n: String(active), label: "active projects", body: "Deadlines, budgets and progress for every client, with a dashboard that writes itself.", to: "/app/projects", cta: "Open projects" },
              { icon: SquareKanban, n: pitches, label: "pitches in flight", body: "Drag gigs from applied to offer. When one lands, it becomes a project automatically.", to: "/app/pipeline", cta: "Open the pipeline" },
              { icon: Globe2, n: String(cities), label: "client cities", body: "Weather and local time for everyone you work with, so you call at a decent hour.", to: "/app/weather", cta: "Spin the globe" },
            ].map((c, i) => (
              <Reveal key={c.label} delay={i * 0.08}>
                <Link to={c.to} className="group flex h-full flex-col rounded-2xl bg-cream/[0.06] p-6 ring-1 ring-cream/10 transition-colors hover:bg-cream/[0.1]">
                  <c.icon size={22} className="text-butter" />
                  <p className="mt-8 font-display text-[64px] leading-none tabular">{c.n}</p>
                  <p className="text-[14px] text-cream/60">{c.label}</p>
                  <p className="mt-5 flex-1 text-[15px] leading-relaxed text-cream/80">{c.body}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-butter">
                    {c.cta} <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* reviews */}
      <section className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8">
        <Reveal>
          <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95]">People close the laptop earlier.</h2>
        </Reveal>
        <div className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-[1.4fr_1fr] md:grid-rows-2 md:overflow-visible md:px-0">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.08} className={`w-[86%] shrink-0 snap-start md:w-auto ${r.big ? "md:row-span-2" : ""}`}>
              <figure className={`flex h-full flex-col justify-between rounded-2xl p-7 ${r.big ? "bg-hi text-on-hi" : "border border-line bg-surface"}`}>
                <blockquote className={r.big ? "font-display text-[clamp(26px,2.8vw,38px)] leading-[1.08]" : "text-[17px] leading-relaxed"}>“{r.q}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold ${r.big ? "bg-cobalt-deep text-butter" : "bg-sunk text-ink"}`}>
                    {r.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold">{r.name}</span>
                    <span className={`block text-[13px] ${r.big ? "text-on-hi/70" : "text-muted"}`}>{r.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="border-t border-line bg-sunk/50">
        <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95]">Pick a pace.</h2>
              <p className="mt-3 text-[16px] text-muted">Start free. Upgrade when the clients pile up.</p>
            </div>
            <div className="flex rounded-full border border-line bg-surface p-1" role="radiogroup" aria-label="Billing period">
              {(["Monthly", "Yearly"] as const).map((label) => {
                const on = (label === "Yearly") === yearly;
                return (
                  <button key={label} role="radio" aria-checked={on} onClick={() => setYearly(label === "Yearly")} className={`relative rounded-full px-4 py-1.5 text-[14px] font-medium ${on ? "text-bg" : "text-muted"}`}>
                    {on && <motion.span layoutId="billing" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">
                      {label}
                      {label === "Yearly" && <span className={`ml-1.5 text-[12px] ${on ? "text-butter" : "text-ok"}`}>−20%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {plans.map((p, i) => {
              const price = yearly ? Math.round(p.monthly * 0.8) : p.monthly;
              return (
                <Reveal key={p.name} delay={i * 0.08}>
                  <div className={`relative flex h-full flex-col rounded-2xl p-7 ${p.featured ? "bg-ink text-bg shadow-lg" : "border border-line bg-surface"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-semibold">{p.name}</p>
                      {p.featured && <span className="rounded-full bg-hi px-2.5 py-0.5 text-[12px] font-semibold text-on-hi">Most freelancers pick this</span>}
                    </div>
                    <p className={`mt-1 text-[14px] ${p.featured ? "opacity-70" : "text-muted"}`}>{p.blurb}</p>
                    <p className="mt-8 flex items-baseline gap-1.5">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={price} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="font-display text-[60px] leading-none tabular">
                          ${price}
                        </motion.span>
                      </AnimatePresence>
                      <span className={`text-[13px] ${p.featured ? "opacity-60" : "text-faint"}`}>per month{yearly && p.monthly ? ", billed yearly" : ""}</span>
                    </p>
                    <ul className="mt-8 flex-1 space-y-3">
                      {p.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-2.5 text-[14.5px]">
                          <Check size={16} strokeWidth={2.6} className={p.featured ? "text-butter" : "text-brand"} />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <Link to={p.to} className={`mt-8 grid h-11 place-items-center rounded-full text-[14.5px] font-medium transition-transform hover:-translate-y-0.5 ${p.featured ? "bg-hi text-on-hi" : "border border-line-2 hover:border-ink"}`}>
                      {p.cta}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="mx-auto grid max-w-[1200px] gap-10 px-5 py-24 sm:px-8 md:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95]">Questions, answered.</h2>
          <p className="mt-4 text-[15px] text-muted">
            Something else? <Link to="/contact" className="font-medium text-brand underline-offset-4 hover:underline">Write to us</Link>.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <Faq />
        </Reveal>
      </section>

      {/* closing cta */}
      <section className="mx-auto max-w-[1200px] px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-hi px-8 py-12 text-on-hi md:flex-row md:items-center md:px-12">
            <h2 className="max-w-[16ch] font-display text-[clamp(36px,4.4vw,56px)] leading-[0.95]">Monday's coming either way.</h2>
            <Link to="/app" className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-cobalt-deep px-6 text-[15px] font-medium text-cream">
              Open the demo workspace <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
