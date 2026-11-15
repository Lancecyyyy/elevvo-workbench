import { useMemo, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Search, X } from "lucide-react";
import PostImage from "./PostImage";
import { CATEGORIES, POSTS, fmtDate, type Filter, type Post } from "./posts";
import { useSavedPosts } from "./saved";
import { useToast } from "../../lib/toast";

const PER_PAGE = 6;
type Sort = "new" | "old" | "quick";
const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "Newest" },
  { id: "old", label: "Oldest" },
  { id: "quick", label: "Quickest read" },
];

/** Wraps the matched part of a title in <mark>. */
function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function SaveButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { saved, toggle } = useSavedPosts();
  const toast = useToast();
  const on = saved.includes(slug);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = toggle(slug);
        toast({ title: now ? "Saved for later" : "Removed from saved", tone: now ? "ok" : "info" });
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save for later"}
      className={`grid h-9 w-9 place-items-center rounded-full bg-[#fffdfb]/95 text-[#150f6e] shadow-sm transition-transform hover:scale-105 ${className}`}
    >
      <Bookmark size={16} fill={on ? "currentColor" : "none"} />
    </button>
  );
}

export function PostCard({ post, q = "", i = 0 }: { post: Post; q?: string; i?: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link to={`/journal/${post.slug}`} className="block">
        <div className="relative aspect-[400/260] overflow-hidden rounded-2xl">
          <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]">
            <PostImage post={post} />
          </div>
          <span className="absolute top-3 left-3 rounded-full bg-[#fffdfb]/95 px-2.5 py-1 text-[12px] font-medium text-[#150f6e]">{post.category}</span>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          <time dateTime={post.date}>{fmtDate(post.date)}</time> · {post.minutes} min read
        </p>
        <h3 className="mt-1.5 text-[19px] leading-snug font-semibold tracking-[-0.01em] transition-colors group-hover:text-brand">{highlight(post.title, q)}</h3>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{post.excerpt}</p>
      </Link>
      <SaveButton slug={post.slug} className="absolute top-3 right-3" />
    </motion.article>
  );
}

export default function Journal() {
  const [params, setParams] = useSearchParams();
  const { saved } = useSavedPosts();

  const cat = (CATEGORIES as readonly string[]).includes(params.get("cat") ?? "") ? (params.get("cat") as Filter) : "All";
  const q = params.get("q") ?? "";
  const sort = (SORTS.find((s) => s.id === params.get("sort"))?.id ?? "new") as Sort;
  const onlySaved = params.get("saved") === "1";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const update = (patch: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === null || v === "" ? next.delete(k) : next.set(k, v)));
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = POSTS.filter(
      (p) => (cat === "All" || p.category === cat) && (!s || p.title.toLowerCase().includes(s)) && (!onlySaved || saved.includes(p.slug)),
    );
    return [...list].sort((a, b) => (sort === "quick" ? a.minutes - b.minutes : sort === "old" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  }, [cat, q, sort, onlySaved, saved]);

  const showFeatured = cat === "All" && !q && !onlySaved && sort === "new" && page === 1;
  const featured = showFeatured ? filtered[0] : undefined;
  const pool = featured ? filtered.slice(1) : filtered;
  const pages = Math.max(1, Math.ceil(pool.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = pool.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const count = (f: Filter) => (f === "All" ? POSTS.length : POSTS.filter((p) => p.category === f).length);

  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-24 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="text-[14px] text-muted">The TaskFlow Journal</p>
          <h1 className="mt-2 font-display text-[clamp(56px,9vw,120px)] leading-[0.82] tracking-[-0.02em]">Notes from a remote team.</h1>
        </div>
        <p className="max-w-[34ch] text-[15px] text-muted">How we build the product, where we work from, and what we eat on team lunch day.</p>
      </header>

      {/* toolbar */}
      <div className="sticky top-16 z-30 -mx-5 mt-6 flex flex-col gap-3 bg-bg/90 px-5 py-3 backdrop-blur-lg sm:-mx-8 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c && !onlySaved}
              onClick={() => update({ cat: c === "All" ? null : c, saved: null })}
              className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors ${cat === c && !onlySaved ? "text-bg" : "text-muted hover:text-ink"}`}
            >
              {cat === c && !onlySaved && <motion.span layoutId="j-cat" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">
                {c} <span className="opacity-55 tabular">{count(c)}</span>
              </span>
            </button>
          ))}
          <button
            onClick={() => update({ saved: onlySaved ? null : "1", cat: null })}
            aria-pressed={onlySaved}
            className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors ${onlySaved ? "bg-hi text-on-hi" : "text-muted hover:text-ink"}`}
          >
            <Bookmark size={14} fill={onlySaved ? "currentColor" : "none"} /> Saved <span className="opacity-55 tabular">{saved.length}</span>
          </button>
        </div>
        <div className="flex gap-2">
          <label className="flex h-10 flex-1 items-center rounded-full border border-line-2 bg-surface px-3.5 focus-within:border-brand md:w-[260px] md:flex-none">
            <Search size={15} className="shrink-0 text-faint" />
            <input value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search titles" aria-label="Search posts by title" className="h-full w-full bg-transparent px-2.5 text-[14px] outline-none placeholder:text-faint" />
            {q && (
              <button onClick={() => update({ q: null })} aria-label="Clear search" className="text-faint hover:text-ink">
                <X size={15} />
              </button>
            )}
          </label>
          <select value={sort} onChange={(e) => update({ sort: e.target.value === "new" ? null : e.target.value })} aria-label="Sort posts" className="h-10 rounded-full border border-line-2 bg-surface px-3.5 text-[14px] outline-none focus:border-brand">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(q || cat !== "All" || onlySaved) && (
        <p className="mt-4 text-[14px] text-muted">
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          {q && <> matching “{q}”</>}
          {cat !== "All" && <> in {cat}</>}
          {onlySaved && <> you saved</>}
        </p>
      )}

      {/* featured */}
      {featured && (
        <Link to={`/journal/${featured.slug}`} className="group mt-8 grid gap-6 rounded-3xl border border-line bg-surface p-4 md:grid-cols-[1.25fr_1fr] md:items-center md:p-5">
          <div className="aspect-[400/260] overflow-hidden rounded-2xl">
            <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]">
              <PostImage post={featured} sizes="(min-width: 768px) 55vw, 100vw" eager />
            </div>
          </div>
          <div className="px-2 pb-3 md:px-4">
            <p className="text-[13px] text-muted">
              Latest · {featured.category} · {fmtDate(featured.date)}
            </p>
            <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,48px)] leading-[0.98]">{featured.title}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">{featured.excerpt}</p>
            <p className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-brand">
              Read the story <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
          </div>
        </Link>
      )}

      {/* grid */}
      <div className="mt-10 min-h-[320px]">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid place-items-center rounded-3xl border border-dashed border-line-2 py-20 text-center">
              <p className="text-[18px] font-semibold">{onlySaved ? "Nothing saved yet." : "No posts match that."}</p>
              <p className="mt-1 text-[14px] text-muted">{onlySaved ? "Tap the bookmark on any post to keep it here." : "Try a different word or category."}</p>
              <button onClick={() => setParams({}, { replace: true })} className="mt-4 rounded-full border border-line-2 px-4 py-2 text-[14px] font-medium hover:border-ink">
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div key={`${cat}-${q}-${sort}-${current}-${onlySaved}`} className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p, i) => (
                <PostCard key={p.slug} post={p} q={q.trim()} i={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {pages > 1 && (
        <nav className="mt-16 flex items-center justify-between border-t border-line pt-6" aria-label="Pagination">
          <button disabled={current === 1} onClick={() => update({ page: String(current - 1) }, false)} className="inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2 text-[14px] font-medium disabled:opacity-35">
            <ArrowLeft size={15} /> Newer
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => update({ page: n === 1 ? null : String(n) }, false)}
                aria-current={n === current ? "page" : undefined}
                className={`h-9 min-w-9 rounded-full px-2 text-[14px] font-medium tabular transition-colors ${n === current ? "bg-ink text-bg" : "text-muted hover:bg-sunk"}`}
              >
                {n}
              </button>
            ))}
            <span className="ml-2 hidden text-[13px] text-faint sm:inline">
              of {pages} · {PER_PAGE} per page
            </span>
          </div>
          <button disabled={current === pages} onClick={() => update({ page: String(current + 1) }, false)} className="inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2 text-[14px] font-medium disabled:opacity-35">
            Older <ArrowRight size={15} />
          </button>
        </nav>
      )}

      <p className="mt-12 text-center text-[12.5px] text-faint">
        Photos from{" "}
        <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-muted hover:underline">
          Unsplash
        </a>
        , used under the Unsplash License.
      </p>
    </div>
  );
}
