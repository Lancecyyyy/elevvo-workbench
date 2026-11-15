import type { ReactNode } from "react";

export function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      {children}
    </section>
  );
}

export function CardHead({ title, right, sub }: { title: string; right?: ReactNode; sub?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded-md bg-line-2/70 ${className}`} />;
}

export function Segmented<T extends string>({ value, options, onChange, label, id }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string; id: string }) {
  return (
    <div className="flex rounded-lg bg-sunk p-0.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`relative rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ${value === o.id ? "text-ink" : "text-muted hover:text-ink"}`}
        >
          {value === o.id && <span className="absolute inset-0 rounded-md bg-surface shadow-sm" data-seg={id} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
