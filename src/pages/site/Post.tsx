import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, Bookmark, Link2 } from "lucide-react";
import PostImage from "./PostImage";
import { POSTS, fmtDate } from "./posts";
import { useSavedPosts } from "./saved";
import { PostCard } from "./Journal";
import { useToast } from "../../lib/toast";

export default function Post() {
  const { slug } = useParams();
  const post = POSTS.find((p) => p.slug === slug);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const { saved, toggle } = useSavedPosts();
  const toast = useToast();

  useEffect(() => {
    if (post) document.title = `${post.title} · TaskFlow Journal`;
  }, [post]);

  if (!post) return <Navigate to="/journal" replace />;

  const idx = POSTS.indexOf(post);
  const related = POSTS.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 3);
  const prev = POSTS[idx + 1];
  const next = POSTS[idx - 1];
  const isSaved = saved.includes(post.slug);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", body: "Paste it anywhere." });
    } catch {
      toast({ title: "Couldn't copy the link", tone: "info" });
    }
  };

  return (
    <article className="pb-24">
      <motion.div className="fixed inset-x-0 top-16 z-40 h-[3px] origin-left bg-brand" style={{ scaleX: progress }} aria-hidden="true" />

      <div className="mx-auto max-w-[760px] px-5 pt-10 sm:px-8">
        <Link to="/journal" className="inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
          <ArrowLeft size={15} /> All posts
        </Link>
        <p className="mt-8 text-[14px] text-muted">
          <Link to={`/journal?cat=${post.category}`} className="font-medium text-brand hover:underline">
            {post.category}
          </Link>{" "}
          · {fmtDate(post.date, true)} · {post.minutes} min read
        </p>
        <h1 className="mt-3 font-display text-[clamp(40px,6vw,72px)] leading-[0.95] tracking-[-0.01em]">{post.title}</h1>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-hi text-[13px] font-semibold text-on-hi">
              {post.author.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="leading-tight">
              <span className="block text-[14.5px] font-semibold">{post.author.name}</span>
              <span className="block text-[13px] text-muted">{post.author.role}, TaskFlow</span>
            </span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={share} className="grid h-10 w-10 place-items-center rounded-full border border-line-2 hover:border-ink" aria-label="Copy link">
              <Link2 size={16} />
            </button>
            <button
              onClick={() => {
                const on = toggle(post.slug);
                toast({ title: on ? "Saved for later" : "Removed from saved", tone: on ? "ok" : "info" });
              }}
              aria-pressed={isSaved}
              className={`grid h-10 w-10 place-items-center rounded-full border ${isSaved ? "border-hi bg-hi text-on-hi" : "border-line-2 hover:border-ink"}`}
              aria-label={isSaved ? "Remove from saved" : "Save for later"}
            >
              <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1040px] px-5 sm:px-8">
        <div className="aspect-[400/220] overflow-hidden rounded-3xl">
          <PostImage post={post} sizes="(min-width: 1040px) 1040px, 100vw" eager />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-[680px] space-y-6 px-5 text-[18px] leading-[1.75] text-ink-2 sm:px-8">
        <p className="text-[21px] leading-[1.6] text-ink">{post.excerpt}</p>
        {post.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <nav className="mx-auto mt-16 grid max-w-[680px] gap-3 px-5 sm:grid-cols-2 sm:px-8" aria-label="More posts">
        {prev ? (
          <Link to={`/journal/${prev.slug}`} className="rounded-2xl border border-line p-4 hover:border-line-2">
            <span className="text-[12.5px] text-muted">Older</span>
            <span className="mt-1 block text-[15px] font-semibold">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/journal/${next.slug}`} className="rounded-2xl border border-line p-4 text-right hover:border-line-2">
            <span className="text-[12.5px] text-muted">Newer</span>
            <span className="mt-1 block text-[15px] font-semibold">{next.title}</span>
          </Link>
        )}
      </nav>

      {related.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1200px] border-t border-line px-5 pt-12 sm:px-8">
          <h2 className="font-display text-[40px] leading-none">More in {post.category}</h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <PostCard key={p.slug} post={p} i={i} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
