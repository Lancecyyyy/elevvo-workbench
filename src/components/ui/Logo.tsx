import { Link } from "react-router-dom";

/** TaskFlow mark: three lanes, the top one finished (the butter dot). */
export function Mark({ size = 28, inverted = false }: { size?: number; inverted?: boolean }) {
  const tile = inverted ? "#f7dd7d" : "var(--brand)";
  const bar = inverted ? "#150f6e" : "var(--on-brand)";
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
      <rect width="28" height="28" rx="8" fill={tile} />
      <rect x="7" y="7.5" width="14" height="3" rx="1.5" fill={bar} />
      <rect x="7" y="12.5" width="10" height="3" rx="1.5" fill={bar} opacity="0.75" />
      <rect x="7" y="17.5" width="6" height="3" rx="1.5" fill={bar} opacity="0.5" />
      <circle cx="20" cy="19" r="2.6" fill={inverted ? "#261cc1" : "#f7dd7d"} />
    </svg>
  );
}

export default function Logo({ to = "/", inverted = false, label = "TaskFlow" }: { to?: string; inverted?: boolean; label?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label={`${label} home`}>
      <Mark inverted={inverted} />
      <span className="font-display text-[23px] leading-none tracking-[-0.01em]">{label}</span>
    </Link>
  );
}
