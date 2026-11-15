# TaskFlow: Elevvo Front-End Internship

My Elevvo Pathways front-end tasks, built as **one connected product** instead of separate demos.

TaskFlow is a fictional productivity suite for freelancers. It has a public website (landing page,
journal, contact) and a working demo app (dashboard, projects, gig pipeline, client weather). Every
screen reads and writes the same data store, so the tasks work together as one product:

- Turn an offer on the **Kanban pipeline** into a project, and it shows up on the **dashboard**.
- Send the **contact form** on the website, and the message lands in the app's activity feed and notification bell.
- Change your name in **Settings**, and the sidebar, greeting and breadcrumbs all update.
- Every client city in **Projects** gets a pin on the **3D weather globe**, with local time and a "good time to call?" check.
- The **landing page** shows live numbers taken from the demo workspace.

**Live demo:** [elevvo-workbench.vercel.app](https://elevvo-workbench.vercel.app)

## Tasks covered

| Task | Where | Required ✔ | Bonus ✔ | Extra |
| ---- | ----- | ---------- | ------- | ----- |
| **01** Collapsible sidebar | `/app` (app shell) | Logo slot, 6 icon links, toggle, smooth animation | Phone drawer (swipe to close) | Ctrl + B, remembered state, live badges, tooltips when collapsed |
| **02** Contact form | `/contact` | Name, email, subject, message, submit, responsive | JS validation (required + email) | Draft autosave/restore, topic switch with conditional team-size field, attachment with size check, 3D folding-envelope finish, pre-filled from pricing |
| **03** TaskFlow one-page site | `/` | Hero, 3 features, 3 reviews, 3 plans, footer with contacts and socials | Scroll-reveal animations | **Interactive 3D hero** (React Three Fiber), live feature demos, monthly/yearly pricing, FAQ |
| **04** Blog homepage | `/journal` | Title, cards (image, title, excerpt, date), Tech/Travel/Food filter, 6 per page | Title search | URL-synced filters, match highlighting, sorting, saved posts, full post pages with reading progress, real Unsplash photos with a generated-art fallback |
| **06** Freelance dashboard | `/app`, `/app/projects`, `/app/settings` | Summary cards, activity, stats, projects table, profile form with password field, shared sidebar + header, routing, Recharts, responsive | Notification dropdown (3 latest) | Project drawer (status, progress, deadline), new-project modal, Ctrl + K command palette, workspace reset |
| **07** Weather dashboard | `/app/weather` | Live weather for many cities, icons, 3-day forecast, search, loading states | Current location | **3D dotted globe** of client cities, local time, call-window check, 24h chart, °C/°F, retry on errors |
| **08** Kanban job tracker | `/app/pipeline` | dnd-kit drag across Applied/Interviewing/Offer/Rejected, strict TS (no `any`) with `Job`/`Column`/`Status`, React Hook Form modal | `usePersistentState` hook: localStorage with a 1s simulated delay and skeleton loader | Edit cards, delete with undo, offer → project, search and priority filter, keyboard dragging, 3D card tilt while dragging |

Tasks 05, 09 and 10 aren't included because they need their own toolchains (Next.js and Storybook).
Each screen has an **"Internship brief"** button in the corner that maps it back to the task list.

## Stack

React 19 · TypeScript (strict, zero `any`) · Vite · Tailwind CSS v4 · React Router 7 ·
React Three Fiber + drei · Framer Motion · Recharts · dnd-kit · React Hook Form · d3-geo + world-atlas

## Notes

- **Weather API.** The brief suggests OpenWeatherMap. This project uses [Open-Meteo](https://open-meteo.com),
  which needs no API key, so it runs right after cloning and no secret ships in the bundle. Reverse
  geocoding for "Use my location" uses BigDataCloud's free client endpoint.
- **3D.** The globe's continents are real 110m land shapes from `world-atlas`, rasterised once into a
  canvas and sampled into ~7,000 instanced dots. Both scenes skip real-time shadow maps and are
  lazy-loaded, so three.js only downloads on the pages that use it. They fall back to flat
  layouts if WebGL isn't available.
- **Persistence.** Everything lives in `localStorage`. The pipeline goes through the 1s-delay hook on
  purpose (Task 08 bonus). Settings → Reset demo puts everything back.
- **Accessibility.** Labelled controls, dialog roles, focus handling, keyboard drag and drop,
  `prefers-reduced-motion`, and visible focus rings.

## Run it

```bash
npm install
npm run dev
npm run build
```

## Layout

```
src/
  lib/workspace/   store.tsx (shared state), types.ts, pipeline.ts (Task 08 types + generic helpers), seed.ts
  lib/             usePersistentState, weather API, geo (globe dots), toasts, spec (brief mapping), sound
  components/      site/ (nav, footer), app/ (sidebar, header, command palette), three/ (LanesScene, Globe)
  pages/site/      Landing, Journal, Post, Contact
  pages/app/       Overview, Projects, Settings, Weather, pipeline/
```

## Deploy

`vercel.json` rewrites all paths to `index.html` so deep links work. Import the repo into Vercel and
keep the Vite defaults.

---

Designed and built by **Lance Camba** for the Elevvo Pathways front-end internship, November 2026.
