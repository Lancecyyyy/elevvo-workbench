import { useState } from "react";
import Cover from "./Cover";
import { photoUrl, type Post } from "./posts";

/** Real photo from Unsplash, with the generated cover as a fallback if it can't load. */
export default function PostImage({ post, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", eager = false }: { post: Post; sizes?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed) return <Cover post={post} />;
  return (
    <span className="relative block h-full w-full bg-sunk">
      {!loaded && <span className="absolute inset-0 animate-pulse bg-line-2/50" aria-hidden="true" />}
      <img
        src={photoUrl(post.photo, 800)}
        srcSet={[480, 800, 1200, 1600].map((w) => `${photoUrl(post.photo, w)} ${w}w`).join(", ")}
        sizes={sizes}
        alt={post.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
