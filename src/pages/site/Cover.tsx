import type { Post } from "./posts";

/* Generated cover art. Each category has its own visual grammar, seeded by the slug
 * so a post always gets the same picture. */

function rng(seedStr: string) {
  let t = 0;
  for (const ch of seedStr) t = (t * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 400;
const H = 260;

export default function Cover({ post, className = "" }: { post: Post; className?: string }) {
  const r = rng(post.slug);
  const common = { viewBox: `0 0 ${W} ${H}`, className: `h-full w-full ${className}`, preserveAspectRatio: "xMidYMid slice", "aria-hidden": true } as const;

  if (post.category === "Tech") {
    const cells = Array.from({ length: 60 }, (_, i) => ({ x: (i % 10) * 40, y: Math.floor(i / 10) * 44, on: r() > 0.66 }));
    const bx = 40 + Math.floor(r() * 6) * 40;
    const by = 52 + Math.floor(r() * 2) * 44;
    return (
      <svg {...common}>
        <rect width={W} height={H} fill="#261cc1" />
        {cells.map((c, i) => (
          <rect key={i} x={c.x + 8} y={c.y + 8} width="24" height="28" rx="5" fill={c.on ? "#f7dd7d" : "#3329d2"} />
        ))}
        <rect x={bx} y={by} width="120" height="80" rx="10" fill="#fffdfb" />
        <rect x={bx + 16} y={by + 20} width="56" height="8" rx="4" fill="#150f6e" />
        <rect x={bx + 16} y={by + 36} width="86" height="8" rx="4" fill="#150f6e" opacity="0.35" />
        <rect x={bx + 16} y={by + 52} width="40" height="8" rx="4" fill="#261cc1" />
      </svg>
    );
  }
  if (post.category === "Travel") {
    const sunX = 70 + r() * 260;
    const sunY = 70 + r() * 50;
    return (
      <svg {...common}>
        <rect width={W} height={H} fill="#fbeab4" />
        <circle cx={sunX} cy={sunY} r={48 + r() * 18} fill="#f2b84b" />
        {[0, 1, 2, 3].map((i) => {
          const y = 140 + i * 30;
          const a = 10 + r() * 26;
          return (
            <path
              key={i}
              d={`M0 ${y} C ${W * 0.25} ${y - a}, ${W * 0.5} ${y + a}, ${W * 0.75} ${y - a / 2} S ${W} ${y}, ${W} ${y} V ${H} H 0 Z`}
              fill={["#8f87ff", "#4a3fe0", "#261cc1", "#150f6e"][i]}
            />
          );
        })}
      </svg>
    );
  }
  const toppings = Array.from({ length: 10 }, () => {
    const a = r() * Math.PI * 2;
    const d = 18 + r() * 52;
    return { x: W / 2 + Math.cos(a) * d, y: H / 2 + Math.sin(a) * d, rr: 6 + r() * 9, c: ["#261cc1", "#c0283c", "#1f8a5b", "#f2b84b"][Math.floor(r() * 4)] };
  });
  const tilt = -32 + r() * 22;
  return (
    <svg {...common}>
      <rect width={W} height={H} fill="#f7dd7d" />
      <circle cx={W / 2 + 8} cy={H / 2 + 10} r="100" fill="#dcbd4e" />
      <circle cx={W / 2} cy={H / 2} r="100" fill="#fffdfb" />
      <circle cx={W / 2} cy={H / 2} r="78" fill="#f4efe3" />
      {toppings.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={t.rr} fill={t.c} />
      ))}
      <g transform={`rotate(${tilt} ${W / 2} ${H / 2})`}>
        <rect x={W / 2 - 150} y={H / 2 + 72} width="300" height="9" rx="4.5" fill="#150f6e" />
        <rect x={W / 2 - 150} y={H / 2 + 90} width="300" height="9" rx="4.5" fill="#150f6e" />
      </g>
    </svg>
  );
}
