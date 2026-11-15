import { useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { COLUMNS, PRIORITIES, SOURCES, type Job, type JobFormValues, type Status } from "../../../lib/workspace/pipeline";

interface JobModalProps {
  initialStatus: Status;
  job?: Job;
  onClose: () => void;
  onSubmit: (values: JobFormValues) => void;
}

export default function JobModal({ initialStatus, job, onClose, onSubmit }: JobModalProps) {
  const { register, handleSubmit, setFocus, watch, formState: { errors, isSubmitting } } = useForm<JobFormValues>({
    defaultValues: job
      ? { company: job.company, role: job.role, location: job.location, status: job.status, source: job.source, priority: job.priority, rate: job.rate ?? "", url: job.url ?? "", notes: job.notes ?? "" }
      : { company: "", role: "", location: "", status: initialStatus, source: "Referral", priority: "medium", rate: "", url: "", notes: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    setFocus("company");
  }, [setFocus]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const notes = watch("notes");
  const input = (bad: boolean) => `h-11 w-full rounded-lg border bg-bg px-3 text-[14.5px] outline-none transition-colors focus:border-brand ${bad ? "border-bad" : "border-line-2"}`;
  const label = "mb-1.5 block text-[13px] font-medium";
  const Err = ({ msg }: { msg?: string }) => (msg ? <p className="mt-1 text-[12.5px] text-bad">{msg}</p> : null);

  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-end bg-night/50 backdrop-blur-[2px] sm:place-items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-lg sm:max-w-[580px] sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="job-modal-title" className="text-[19px] font-semibold">{job ? "Edit pitch" : "Track a new pitch"}</h2>
            <p className="text-[13.5px] text-muted">{job ? `Added ${new Date(job.createdAt).toLocaleDateString()}` : "Anything you've applied for or pitched to."}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-sunk">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="j-company" className={label}>Company</label>
            <input id="j-company" className={input(!!errors.company)} placeholder="Northwind Roasters" {...register("company", { required: "Company is required", maxLength: { value: 40, message: "Keep it under 40 characters" } })} />
            <Err msg={errors.company?.message} />
          </div>
          <div>
            <label htmlFor="j-role" className={label}>Role or gig</label>
            <input id="j-role" className={input(!!errors.role)} placeholder="Packaging design" {...register("role", { required: "What's the gig?" })} />
            <Err msg={errors.role?.message} />
          </div>
          <div>
            <label htmlFor="j-location" className={label}>Location</label>
            <input id="j-location" className={input(!!errors.location)} placeholder="Toronto · Remote" {...register("location", { required: "Where is it based?" })} />
            <Err msg={errors.location?.message} />
          </div>
          <div>
            <label htmlFor="j-rate" className={label}>Rate <span className="font-normal text-faint">optional</span></label>
            <input id="j-rate" className={input(!!errors.rate)} placeholder="$2,400" {...register("rate", { pattern: { value: /^[$₱€£]?\s?[\d,.]+(k)?(\s?\/\s?\w+)?$/i, message: "Try something like $2,400 or ₱45k/mo" } })} />
            <Err msg={errors.rate?.message} />
          </div>
          <div>
            <label htmlFor="j-status" className={label}>Stage</label>
            <select id="j-status" className={input(false)} {...register("status")}>
              {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="j-source" className={label}>Source</label>
            <select id="j-source" className={input(false)} {...register("source")}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <fieldset className="sm:col-span-2">
            <legend className={label}>Priority</legend>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <label key={p} className="cursor-pointer">
                  <input type="radio" value={p} className="peer sr-only" {...register("priority")} />
                  <span className="block rounded-lg border border-line-2 py-2 text-center text-[13.5px] font-medium capitalize transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-bg peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                    {p}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <label htmlFor="j-url" className={label}>Posting link <span className="font-normal text-faint">optional</span></label>
            <input id="j-url" className={input(!!errors.url)} placeholder="https://…" {...register("url", { pattern: { value: /^(https?:\/\/)[^\s]+\.[^\s]+$/i, message: "Use a full http(s) link" } })} />
            <Err msg={errors.url?.message} />
          </div>
          <div className="sm:col-span-2">
            <div className="flex justify-between">
              <label htmlFor="j-notes" className={label}>Notes <span className="font-normal text-faint">optional</span></label>
              <span className="text-[12px] text-faint tabular">{notes.length}/280</span>
            </div>
            <textarea id="j-notes" rows={3} maxLength={280} placeholder="Who you spoke to, what's next…" className={`${input(false)} h-auto resize-none py-2.5`} {...register("notes")} />
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-[14px] font-medium hover:bg-sunk">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="h-10 rounded-lg bg-brand px-5 text-[14px] font-medium text-on-brand">
            {job ? "Save changes" : "Add to board"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
