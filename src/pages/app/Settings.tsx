import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Check, Eye, EyeOff, RotateCcw } from "lucide-react";
import { HUES, initials, useWorkspace } from "../../lib/workspace/store";
import type { AvatarHue, Profile } from "../../lib/workspace/types";
import { useToast } from "../../lib/toast";

type ProfileForm = Omit<Profile, "workStart" | "workEnd"> & { workStart: string; workEnd: string };

const toForm = (p: Profile): ProfileForm => ({ ...p, workStart: String(p.workStart), workEnd: String(p.workEnd) });
const hours = Array.from({ length: 24 }, (_, h) => ({ v: String(h), label: new Date(2026, 0, 1, h).toLocaleTimeString([], { hour: "numeric" }) }));

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-b border-line py-8 first:pt-2 md:grid-cols-[260px_1fr] md:gap-10">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <p className="mt-1 text-[13.5px] text-muted">{sub}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-line-2"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ${checked ? "right-0.5" : "left-0.5"}`} />
    </button>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length);
  const mismatch = confirm.length > 0 && confirm !== pw;
  const input = "h-11 w-full rounded-lg border border-line-2 bg-bg px-3 text-[14.5px] outline-none focus:border-brand";
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="pw-current" className="mb-1.5 block text-[13px] font-medium">Current password</label>
        <input id="pw-current" type="password" autoComplete="current-password" placeholder="••••••••" className={input} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pw-new" className="mb-1.5 block text-[13px] font-medium">New password</label>
          <div className="relative">
            <input id="pw-new" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${input} pr-10`} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-1/2 right-3 -translate-y-1/2 text-faint hover:text-ink">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < strength ? ["var(--bad)", "var(--warn)", "var(--hi)", "var(--ok)"][strength - 1] : "var(--line)" }} />
            ))}
          </div>
          <p className="mt-1 text-[12px] text-muted">{pw ? ["Too weak", "Weak", "Okay", "Good", "Strong"][strength] : "8+ characters, mix in caps, numbers and symbols"}</p>
        </div>
        <div>
          <label htmlFor="pw-confirm" className="mb-1.5 block text-[13px] font-medium">Confirm new password</label>
          <input id="pw-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${input} ${mismatch ? "border-bad" : ""}`} />
          {mismatch && <p className="mt-1 text-[12.5px] text-bad">Doesn't match yet.</p>}
        </div>
      </div>
      <button
        type="button"
        disabled={strength < 3 || confirm !== pw}
        onClick={() => {
          setPw("");
          setConfirm("");
          toast({ title: "Password updated", body: "Demo only: nothing was stored." });
        }}
        className="h-10 rounded-lg border border-line-2 px-4 text-[14px] font-medium transition-colors hover:border-ink disabled:opacity-40"
      >
        Update password
      </button>
    </div>
  );
}

export default function Settings() {
  const { ws, updateProfile, reset } = useWorkspace();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const { register, handleSubmit, watch, setValue, reset: resetForm, formState: { errors, isDirty } } = useForm<ProfileForm>({ defaultValues: toForm(ws.profile) });

  // keep the form in step if the profile changes elsewhere (e.g. workspace reset)
  useEffect(() => resetForm(toForm(ws.profile)), [ws.profile, resetForm]);

  const v = watch();
  const hue = HUES[v.hue] ?? HUES.butter;

  const save = (f: ProfileForm) => {
    updateProfile({ ...f, name: f.name.trim(), workStart: Number(f.workStart), workEnd: Number(f.workEnd) });
    toast({ title: "Profile saved", body: "Your sidebar and greeting now use the new details." });
  };

  const input = (bad?: boolean) => `h-11 w-full rounded-lg border bg-bg px-3 text-[14.5px] outline-none focus:border-brand ${bad ? "border-bad" : "border-line-2"}`;
  const label = "mb-1.5 block text-[13px] font-medium";

  return (
    <div className="pb-16">
      <h1 className="font-display text-[44px] leading-none">Settings</h1>
      <p className="mt-1.5 text-[14px] text-muted">Changes here show up across the whole workspace.</p>

      <form onSubmit={handleSubmit(save)} noValidate className="mt-6">
        <Section title="Profile" sub="How clients see you, and what the app calls you.">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl text-[22px] font-semibold" style={{ background: hue.bg, color: hue.fg }}>
              {initials(v.name)}
            </span>
            <div>
              <p className="mb-2 text-[13px] font-medium">Avatar colour</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Avatar colour">
                {(Object.keys(HUES) as AvatarHue[]).map((h) => (
                  <button
                    key={h}
                    type="button"
                    role="radio"
                    aria-checked={v.hue === h}
                    aria-label={h}
                    onClick={() => setValue("hue", h, { shouldDirty: true })}
                    className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition-shadow ${v.hue === h ? "ring-2 ring-ink" : ""}`}
                    style={{ background: HUES[h].bg }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-name" className={label}>Full name</label>
              <input id="s-name" className={input(!!errors.name)} {...register("name", { required: "Your name can't be empty", minLength: { value: 2, message: "At least 2 characters" } })} />
              {errors.name && <p className="mt-1 text-[12.5px] text-bad">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="s-email" className={label}>Email</label>
              <input id="s-email" type="email" className={input(!!errors.email)} {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: "That doesn't look like an email" } })} />
              {errors.email && <p className="mt-1 text-[12.5px] text-bad">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="s-role" className={label}>Headline</label>
              <input id="s-role" className={input()} {...register("role")} />
            </div>
            <div>
              <label htmlFor="s-loc" className={label}>Location</label>
              <input id="s-loc" className={input()} {...register("location")} />
            </div>
            <div className="sm:col-span-2">
              <div className="flex justify-between">
                <label htmlFor="s-bio" className={label}>Short bio</label>
                <span className="text-[12px] text-faint tabular">{v.bio?.length ?? 0}/160</span>
              </div>
              <textarea id="s-bio" rows={3} maxLength={160} className={`${input()} h-auto resize-none py-2.5`} {...register("bio")} />
            </div>
          </div>
        </Section>

        <Section title="Working hours" sub="Used on Client weather to tell you whether a call fits both your days.">
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Start of day" className="h-11 w-36 rounded-lg border border-line-2 bg-bg px-3 text-[14.5px] outline-none focus:border-brand" {...register("workStart")}>
              {hours.map((h) => <option key={h.v} value={h.v}>{h.label}</option>)}
            </select>
            <span className="text-muted">to</span>
            <select aria-label="End of day" className="h-11 w-36 rounded-lg border border-line-2 bg-bg px-3 text-[14.5px] outline-none focus:border-brand" {...register("workEnd")}>
              {hours.map((h) => <option key={h.v} value={h.v}>{h.label}</option>)}
            </select>
          </div>
        </Section>

        <Section title="Notifications" sub="What lands in your inbox.">
          <div className="divide-y divide-line rounded-xl border border-line">
            {([
              ["notifyEmail", "Email me when a client pays or comments"],
              ["notifyDigest", "Send a Monday digest of the week ahead"],
            ] as const).map(([k, text]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-[14px]">{text}</span>
                <Toggle checked={v[k]} onChange={(val) => setValue(k, val, { shouldDirty: true })} label={text} />
              </div>
            ))}
          </div>
        </Section>

        <AnimatePresence>
          {isDirty && (
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-0 bottom-4 z-[65] flex justify-center px-4">
              <div className="flex w-full max-w-[520px] items-center gap-3 rounded-xl bg-night px-4 py-3 text-cream shadow-lg dark:bg-cream dark:text-night">
                <span className="flex-1 text-[14px]">You have unsaved changes</span>
                <button type="button" onClick={() => resetForm(toForm(ws.profile))} className="rounded-md px-3 py-1.5 text-[13.5px] font-medium opacity-75 hover:opacity-100">Discard</button>
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-butter px-3 py-1.5 text-[13.5px] font-semibold text-cobalt-deep">
                  <Check size={14} /> Save
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <Section title="Password" sub="Placeholder fields for the brief. Nothing is sent or stored.">
        <PasswordCard />
      </Section>

      <Section title="Reset demo" sub="Put every project, pitch and setting back to how the demo started.">
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-bad/40 px-4 text-[14px] font-medium text-bad hover:bg-bad/5">
            <RotateCcw size={15} /> Reset workspace
          </button>
        ) : (
          <div className="rounded-xl border border-bad/40 p-4">
            <label htmlFor="reset-confirm" className="text-[14px]">
              Type <span className="font-semibold">reset</span> to confirm. This can't be undone.
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <input id="reset-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} className="h-11 w-40 rounded-lg border border-line-2 bg-bg px-3 text-[14.5px] outline-none focus:border-brand" autoFocus />
              <button
                disabled={typed.trim().toLowerCase() !== "reset"}
                onClick={() => {
                  reset();
                  setConfirming(false);
                  setTyped("");
                  toast({ title: "Workspace reset", body: "Back to day one." });
                }}
                className="h-11 rounded-lg bg-bad px-4 text-[14px] font-medium text-white disabled:opacity-40"
              >
                Reset everything
              </button>
              <button onClick={() => { setConfirming(false); setTyped(""); }} className="h-11 rounded-lg px-4 text-[14px] font-medium hover:bg-sunk">Cancel</button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
