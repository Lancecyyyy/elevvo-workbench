import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Clock, Loader2, Mail, MapPin, Paperclip, Phone, RotateCcw, X } from "lucide-react";
import { useWorkspace } from "../../lib/workspace/store";
import { useToast } from "../../lib/toast";
import { playChime } from "../../lib/sound";

type Topic = "sales" | "support" | "press" | "hello";
type Field = "name" | "email" | "subject" | "message" | "team";
interface Values {
  topic: Topic;
  name: string;
  email: string;
  subject: string;
  message: string;
  team: string;
}
type Errors = Partial<Record<Field | "file", string>>;

const TOPICS: { id: Topic; label: string; reply: string; to: string }[] = [
  { id: "sales", label: "Sales", reply: "within 4 hours", to: "TaskFlow Sales" },
  { id: "support", label: "Support", reply: "within 1 day", to: "TaskFlow Support" },
  { id: "press", label: "Press", reply: "within 2 days", to: "TaskFlow Press" },
  { id: "hello", label: "Just saying hi", reply: "when we can", to: "the TaskFlow team" },
];
const TEAM_SIZES = ["2–5", "6–15", "16–50", "50+"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_MSG = 1000;
const MAX_FILE = 5 * 1024 * 1024;
const DRAFT_KEY = "tf-contact-draft";

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Tell us who's writing.";
  else if (v.name.trim().length < 2) e.name = "That name looks a little short.";
  if (!v.email.trim()) e.email = "We need somewhere to reply.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "That doesn't look like an email address.";
  if (!v.subject.trim()) e.subject = "Add a subject line.";
  if (!v.message.trim()) e.message = "The message is empty.";
  else if (v.message.trim().length < 20) e.message = `A few more words, please (${20 - v.message.trim().length} to go).`;
  if (v.topic === "sales" && !v.team) e.team = "Pick a team size so we can quote properly.";
  return e;
}

/** Manila office hours: Mon–Fri, 9:00–18:00 GMT+8 */
function officeStatus(): { open: boolean; label: string } {
  const now = new Date();
  const manila = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
  const day = manila.getDay();
  const h = manila.getHours() + manila.getMinutes() / 60;
  const open = day >= 1 && day <= 5 && h >= 9 && h < 18;
  const time = manila.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return { open, label: open ? `Open now · ${time} in Manila` : `Closed · ${time} in Manila, back at 9am` };
}

function Envelope({ stage }: { stage: "fold" | "fly" }) {
  return (
    <div className="relative mx-auto h-[190px] w-[270px]" style={{ perspective: 900 }}>
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        animate={stage === "fly" ? { x: 420, y: -260, rotate: -14, scale: 0.6, opacity: 0 } : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
        transition={stage === "fly" ? { duration: 0.75, ease: [0.55, 0, 0.75, 0.2] } : { duration: 0.3 }}
      >
        {/* back of envelope */}
        <div className="absolute inset-x-0 bottom-0 h-[150px] rounded-[10px] bg-[#e9cd62]" />
        {/* letter sliding in */}
        <motion.div
          className="absolute left-[18px] h-[150px] w-[234px] rounded-md bg-[#fffdfb] p-4 shadow-md"
          initial={{ y: -96 }}
          animate={{ y: 30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="h-2 w-24 rounded bg-[#150f6e]" />
          <div className="mt-3 h-1.5 w-full rounded bg-[#150f6e]/25" />
          <div className="mt-2 h-1.5 w-5/6 rounded bg-[#150f6e]/25" />
          <div className="mt-2 h-1.5 w-2/3 rounded bg-[#150f6e]/25" />
        </motion.div>
        {/* front pocket */}
        <div
          className="absolute inset-x-0 bottom-0 h-[150px] rounded-[10px] bg-[#f7dd7d]"
          style={{ clipPath: "polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)" }}
        />
        {/* flap folds down in 3D */}
        <motion.div
          className="absolute inset-x-0 top-[40px] h-[96px] origin-top"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateX: -178 }}
          animate={{ rotateX: 0 }}
          transition={{ delay: 0.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 bg-[#dcbd4e]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", backfaceVisibility: "hidden" }} />
        </motion.div>
        {/* wax seal */}
        <motion.div
          className="absolute top-[118px] left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-[#261cc1] text-[13px] font-bold text-[#f7dd7d] shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.05, type: "spring", stiffness: 400, damping: 14 }}
        >
          TF
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Contact() {
  const [params] = useSearchParams();
  const { log } = useWorkspace();
  const toast = useToast();
  const initialTopic = (TOPICS.find((t) => t.id === params.get("topic"))?.id ?? "hello") as Topic;
  const plan = params.get("plan");

  const blank: Values = useMemo(
    () => ({
      topic: initialTopic,
      name: "",
      email: "",
      subject: plan ? `${plan[0].toUpperCase()}${plan.slice(1)} plan for my studio` : "",
      message: "",
      team: "",
    }),
    [initialTopic, plan],
  );

  const [values, setValues] = useState<Values>(() => {
    if (plan) return blank;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...blank, ...(JSON.parse(raw) as Partial<Values>) } : blank;
    } catch {
      return blank;
    }
  });
  const [restored, setRestored] = useState(() => !plan && !!localStorage.getItem(DRAFT_KEY));
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "fold" | "fly" | "sent">("idle");
  const [ticket, setTicket] = useState("");
  const [office] = useState(officeStatus);
  const formRef = useRef<HTMLFormElement>(null);

  const errors = validate(values);
  const show = (f: Field) => (touched[f] ? errors[f] : undefined);
  const topic = TOPICS.find((t) => t.id === values.topic) ?? TOPICS[3];
  const required: Field[] = values.topic === "sales" ? ["name", "email", "subject", "message", "team"] : ["name", "email", "subject", "message"];
  const done = required.filter((f) => !errors[f]).length;

  // autosave the draft while typing
  useEffect(() => {
    if (status !== "idle") return;
    const id = window.setTimeout(() => {
      const empty = !values.name && !values.email && !values.message;
      try {
        if (empty) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [values, status]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: name === "message" ? value.slice(0, MAX_MSG) : value }));
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_FILE) {
      setFileError(`${f.name} is ${(f.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`);
      return;
    }
    setFileError(undefined);
    setFile(f);
  };

  const discard = () => {
    setValues(blank);
    setTouched({});
    setRestored(false);
    localStorage.removeItem(DRAFT_KEY);
  };

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    setTouched({ name: true, email: true, subject: true, message: true, team: true });
    const bad = required.find((f) => errors[f]);
    if (bad) {
      document.getElementById(`f-${bad}`)?.focus();
      return;
    }
    setStatus("sending");
    window.setTimeout(() => {
      const t = `TF-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicket(t);
      setStatus("fold");
      playChime();
      localStorage.removeItem(DRAFT_KEY);
      log("message", topic.to, `received your message “${values.subject.trim()}” · ${t}`, "/contact");
      window.setTimeout(() => setStatus("fly"), 1500);
      window.setTimeout(() => setStatus("sent"), 2250);
    }, 900);
  };

  const reset = () => {
    setValues(blank);
    setTouched({});
    setFile(null);
    setStatus("idle");
    setRestored(false);
  };

  const input = (f: Field) =>
    `h-12 w-full rounded-xl border bg-bg px-4 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-brand focus:bg-surface ${
      show(f) ? "border-bad" : touched[f] && !errors[f] ? "border-ok/60" : "border-line-2"
    }`;
  const label = "mb-1.5 block text-[13.5px] font-medium";

  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-24 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-display text-[clamp(52px,7vw,92px)] leading-[0.86] tracking-[-0.02em]">Talk to a human.</h1>
          <p className="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-muted">
            Questions about plans, a bug, or just a hello. Real people read every message, usually with coffee.
          </p>
          <p className={`mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13.5px] ${office.open ? "bg-ok/12 text-ok" : "bg-sunk text-muted"}`}>
            <span className={`h-2 w-2 rounded-full ${office.open ? "bg-ok" : "bg-faint"}`} />
            {office.label}
          </p>
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {[
              { icon: Mail, k: "Email", v: "hello@taskflow.app", href: "mailto:hello@taskflow.app" },
              { icon: Phone, k: "Phone", v: "+63 917 555 0142", href: "tel:+639175550142" },
              { icon: MapPin, k: "Office", v: "Bonifacio Global City, Taguig" },
              { icon: Clock, k: `${topic.label} replies`, v: topic.reply },
            ].map(({ icon: Icon, k, v, href }) => (
              <div key={k} className="flex items-center gap-4 py-4">
                <Icon size={17} className="shrink-0 text-muted" />
                <dt className="w-32 shrink-0 text-[14px] text-muted">{k}</dt>
                <dd className="text-[14.5px] font-medium">{href ? <a href={href} className="hover:text-brand">{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-[640px] rounded-3xl border border-line bg-surface p-6 shadow-md sm:p-9">
          <AnimatePresence mode="wait">
            {status === "idle" || status === "sending" ? (
              <motion.form
                key="form"
                ref={formRef}
                noValidate
                onSubmit={onSubmit}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onSubmit();
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col gap-6"
              >
                <AnimatePresence>
                  {restored && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-hi/60 px-4 py-2.5 text-[13.5px] text-on-hi">
                        <span>We kept your unsent draft.</span>
                        <span className="flex gap-3">
                          <button type="button" onClick={() => setRestored(false)} className="font-medium">Keep</button>
                          <button type="button" onClick={discard} className="font-medium underline underline-offset-2">Discard</button>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <fieldset>
                  <legend className={label}>What's this about?</legend>
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-sunk p-1 sm:grid-cols-4" role="radiogroup">
                    {TOPICS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={values.topic === t.id}
                        onClick={() => setValues((v) => ({ ...v, topic: t.id }))}
                        className={`relative rounded-lg px-2 py-2 text-[13.5px] font-medium transition-colors ${values.topic === t.id ? "text-ink" : "text-muted hover:text-ink"}`}
                      >
                        {values.topic === t.id && <motion.span layoutId="topic" className="absolute inset-0 rounded-lg bg-surface shadow-sm" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                        <span className="relative">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="f-name" className={label}>Full name</label>
                    <input id="f-name" name="name" autoComplete="name" placeholder="Juan dela Cruz" value={values.name} onChange={onChange} onBlur={() => setTouched((t) => ({ ...t, name: true }))} aria-invalid={!!show("name")} aria-describedby="e-name" className={input("name")} />
                    <ErrorLine id="e-name" msg={show("name")} />
                  </div>
                  <div>
                    <label htmlFor="f-email" className={label}>Email address</label>
                    <input id="f-email" name="email" type="email" autoComplete="email" placeholder="you@studio.com" value={values.email} onChange={onChange} onBlur={() => setTouched((t) => ({ ...t, email: true }))} aria-invalid={!!show("email")} aria-describedby="e-email" className={input("email")} />
                    <ErrorLine id="e-email" msg={show("email")} />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {values.topic === "sales" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <label htmlFor="f-team" className={label}>Team size</label>
                      <div id="f-team" tabIndex={-1} className="flex flex-wrap gap-2" role="radiogroup" aria-describedby="e-team">
                        {TEAM_SIZES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={values.team === s}
                            onClick={() => {
                              setValues((v) => ({ ...v, team: s }));
                              setTouched((t) => ({ ...t, team: true }));
                            }}
                            className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${values.team === s ? "border-ink bg-ink text-bg" : "border-line-2 hover:border-ink"}`}
                          >
                            {s} people
                          </button>
                        ))}
                      </div>
                      <ErrorLine id="e-team" msg={show("team")} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="f-subject" className={label}>Subject</label>
                  <input id="f-subject" name="subject" placeholder="What should we call this?" value={values.subject} onChange={onChange} onBlur={() => setTouched((t) => ({ ...t, subject: true }))} aria-invalid={!!show("subject")} aria-describedby="e-subject" className={input("subject")} />
                  <ErrorLine id="e-subject" msg={show("subject")} />
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="f-message" className={label}>Message</label>
                    <span className={`text-[12.5px] tabular ${values.message.length > MAX_MSG * 0.9 ? "text-warn" : "text-faint"}`}>
                      {values.message.length}/{MAX_MSG}
                    </span>
                  </div>
                  <textarea
                    id="f-message"
                    name="message"
                    rows={6}
                    placeholder="A little context helps us help you faster."
                    value={values.message}
                    onChange={onChange}
                    onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                    aria-invalid={!!show("message")}
                    aria-describedby="e-message"
                    className={`${input("message")} h-auto resize-y py-3 leading-relaxed`}
                  />
                  <ErrorLine id="e-message" msg={show("message")} />
                </div>

                <div>
                  {file ? (
                    <div className="flex items-center gap-3 rounded-xl border border-line-2 px-4 py-3 text-[14px]">
                      <Paperclip size={16} className="text-muted" />
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      <span className="text-faint tabular">{(file.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment" className="text-faint hover:text-ink">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        onFile(e.dataTransfer.files[0]);
                      }}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-2 px-4 py-4 text-[14px] text-muted transition-colors hover:border-ink hover:text-ink"
                    >
                      <Paperclip size={16} /> Attach a screenshot or brief <span className="text-faint">(optional, 5 MB max)</span>
                      <input type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
                    </label>
                  )}
                  <ErrorLine id="e-file" msg={fileError} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1" aria-hidden="true">
                      {required.map((f) => (
                        <span key={f} className={`h-1.5 w-6 rounded-full transition-colors ${errors[f] ? "bg-line-2" : "bg-ok"}`} />
                      ))}
                    </div>
                    <span className="text-[13px] text-muted">
                      {done === required.length ? "Ready to send" : `${done} of ${required.length} done`}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="group inline-flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-on-brand transition-transform hover:-translate-y-0.5 disabled:opacity-80"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending
                      </>
                    ) : (
                      <>
                        Send message <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
                <p className="-mt-3 text-right text-[12px] text-faint">Ctrl + Enter sends</p>
              </motion.form>
            ) : status === "fold" || status === "fly" ? (
              <motion.div key="env" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid min-h-[560px] place-items-center overflow-hidden">
                <Envelope stage={status} />
              </motion.div>
            ) : (
              <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[560px] flex-col items-center justify-center text-center">
                <p className="rounded-full bg-hi px-3 py-1 text-[13px] font-semibold text-on-hi tabular">Ticket {ticket}</p>
                <h2 className="mt-6 font-display text-[48px] leading-none">Sent. Thanks, {values.name.trim().split(" ")[0]}.</h2>
                <p className="mt-4 max-w-[40ch] text-[16px] text-muted">
                  {topic.to} will reply to <span className="font-medium text-ink">{values.email.trim()}</span> {topic.reply}.
                </p>
                <div className="mt-8 w-full max-w-[400px] rounded-2xl border border-line bg-bg p-4 text-left">
                  <p className="text-[13px] text-muted">It's in your demo workspace too</p>
                  <p className="mt-1 text-[14.5px]">Your message now shows up in the activity feed and notification bell.</p>
                  <Link to="/app#activity" className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand">
                    See it in the app <ArrowUpRight size={15} />
                  </Link>
                </div>
                <button
                  onClick={() => {
                    reset();
                    toast({ title: "Fresh page", tone: "info" });
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2 text-[14px] font-medium hover:border-ink"
                >
                  <RotateCcw size={15} /> Write another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ErrorLine({ id, msg }: { id: string; msg?: string }) {
  return (
    <AnimatePresence initial={false}>
      {msg && (
        <motion.p id={id} role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-1.5 text-[13.5px] text-bad">
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
