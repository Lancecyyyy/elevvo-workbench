import { Suspense, useEffect, useState } from "react";
import { Link, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import Logo, { Mark } from "../ui/Logo";
import { usePrefs } from "../../lib/prefs";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "../BrandIcons";

const links = [
  { to: "/#features", label: "Product" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/journal", label: "Journal" },
  { to: "/contact", label: "Contact" },
];

function ThemeButton() {
  const { theme, toggleTheme } = usePrefs();
  return (
    <button
      onClick={toggleTheme}
      className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-sunk hover:text-ink"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname, hash]);

  const isActive = (to: string) => (to.startsWith("/#") ? false : pathname.startsWith(to));

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open ? "border-b border-line bg-bg/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-full px-3.5 py-1.5 text-[14px] transition-colors ${
                isActive(l.to) ? "bg-sunk text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeButton />
          <Link
            to="/app"
            className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-bg transition-transform hover:-translate-y-px sm:inline-flex"
          >
            Open the demo <ArrowUpRight size={15} />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-5 pt-1 pb-5">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="rounded-xl px-3 py-3 text-[17px] hover:bg-sunk">
                  {l.label}
                </Link>
              ))}
              <Link to="/app" className="mt-2 rounded-xl bg-ink px-3 py-3 text-center text-[16px] font-medium text-bg">
                Open the demo
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="grain overflow-hidden bg-cobalt-deep text-cream dark:bg-[#07051f]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pt-16 pb-10 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Mark inverted />
            <span className="font-display text-[23px] leading-none">TaskFlow</span>
          </div>
          <p className="mt-4 max-w-[30ch] text-[14px] text-cream/60">
            Plan the week, run the projects, chase the next gig. All in one place.
          </p>
        </div>
        <div>
          <p className="text-[12px] font-medium text-cream/45">Product</p>
          <ul className="mt-3 space-y-2 text-[14px] text-cream/80">
            <li><Link to="/#features" className="hover:text-butter">Features</Link></li>
            <li><Link to="/#pricing" className="hover:text-butter">Pricing</Link></li>
            <li><Link to="/app" className="hover:text-butter">Demo workspace</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-medium text-cream/45">Company</p>
          <ul className="mt-3 space-y-2 text-[14px] text-cream/80">
            <li><Link to="/journal" className="hover:text-butter">Journal</Link></li>
            <li><Link to="/contact" className="hover:text-butter">Contact</Link></li>
            <li><a href="mailto:hello@taskflow.app" className="hover:text-butter">hello@taskflow.app</a></li>
            <li className="text-cream/55">BGC, Taguig · +63 917 555 0142</li>
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-medium text-cream/45">Follow</p>
          <div className="mt-3 flex gap-2">
            {[
              { Icon: GithubIcon, label: "GitHub" },
              { Icon: LinkedinIcon, label: "LinkedIn" },
              { Icon: InstagramIcon, label: "Instagram" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/75 transition-colors hover:border-butter hover:text-butter"
              >
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <p
          aria-hidden="true"
          className="font-display text-[clamp(90px,21vw,290px)] leading-[0.72] tracking-[-0.03em] text-cream/[0.07] select-none"
        >
          TaskFlow
        </p>
      </div>
      <div className="border-t border-cream/10">
        <p className="mx-auto max-w-[1200px] px-5 py-5 text-[12.5px] text-cream/45 sm:px-8">
          TaskFlow is a fictional product. Designed and built by Lance Camba for the Elevvo front-end internship.
        </p>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const outlet = useOutlet();
  const { pathname, hash } = useLocation();

  // anchor links like /#pricing scroll after the page mounts
  useEffect(() => {
    if (hash) {
      const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 60);
      return () => window.clearTimeout(id);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-bg">
      <SiteNav />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Suspense fallback={<div className="min-h-screen" />}>{outlet}</Suspense>
        </motion.main>
      </AnimatePresence>
      <SiteFooter />
    </div>
  );
}

