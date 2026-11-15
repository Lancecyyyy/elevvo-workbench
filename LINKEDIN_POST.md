For my front-end internship at Elevvo, I didn't want to submit six unrelated demos. So I built one product and made every task a part of it.

It's called TaskFlow, a fictional workspace for freelancers.

The public site covers three tasks: the landing page, the blog and the contact form. Open the demo and you're in the app, which covers the rest: a collapsible sidebar, a client dashboard, a drag-and-drop gig tracker and a weather view.

The part I'm proudest of is that the tasks talk to each other:
→ Drag a gig to "Offer", click once, and it becomes a project on the dashboard
→ Send the contact form on the website and it shows up in the app's notification bell
→ Every client city gets a pin on a 3D globe, with live weather, local time and a "good time to call?" check
→ Change your name in settings and the whole app updates

There's more 3D too. The landing hero is a little board of task lanes you can click to finish cards, and the globe is drawn from real map data as thousands of dots.

Under the hood: React 19, strict TypeScript (no `any` anywhere), Tailwind v4, React Three Fiber, dnd-kit, React Hook Form, Recharts and Framer Motion.

Live demo: [your Vercel link]
Code: [your GitHub link]

Thank you Elevvo for the briefs. Building them as one story taught me more than building them separately would have.

#frontend #react #typescript #threejs #webdevelopment #internship

---
Before posting:
1. Type "@Elevvo" in LinkedIn and pick the page from the list, in the first line and in the thank-you line.
2. Replace the two links.
3. Attach a 30–40s screen recording in this order: click a card in the 3D hero → open the demo → drag a gig to Offer → "Make it a project" → spin the globe and click a pin → switch to dark mode. That sequence shows the connected story better than the text does.
