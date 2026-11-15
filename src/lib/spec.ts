/** What each screen delivers against the Elevvo brief, shown in the "Brief" sheet. */

export interface Spec {
  task: number;
  level: "Level 1" | "Level 2" | "Level 3" | "Industry";
  title: string;
  where: string;
  required: string[];
  bonus: string[];
  extra: string[];
}

export const SPECS: Spec[] = [
  {
    task: 1,
    level: "Level 1",
    title: "Collapsible sidebar",
    where: "/app",
    required: ["Logo placeholder at the top", "4–5 links with icons (there are 6)", "Button that opens and closes it", "Smooth open/close animation"],
    bonus: ["Responsive: becomes a drawer on phones"],
    extra: ["Ctrl + B shortcut, state remembered", "Live badges for pipeline and unread", "Tooltips when collapsed", "Swipe the drawer to close it"],
  },
  {
    task: 2,
    level: "Level 1",
    title: "Contact form",
    where: "/contact",
    required: ["Full name, email, subject, message, submit", "Clean spacing, visible button", "Works on phones and desktops"],
    bonus: ["JavaScript validation: required fields + email format"],
    extra: ["Draft autosaves and restores", "Topic switch with a conditional team-size field", "Pre-filled from the pricing table", "Sent message shows up in the app's activity feed"],
  },
  {
    task: 3,
    level: "Level 2",
    title: "TaskFlow one-page website",
    where: "/",
    required: ["Hero with app name, message and button", "3 features with icons", "3 user reviews", "3 pricing plans (Free, Pro, Team)", "Footer with contact links and socials", "Responsive"],
    bonus: ["Sections animate in on scroll"],
    extra: ["Interactive 3D hero: click cards to finish them", "Monthly / yearly pricing", "FAQ accordion", "Leads straight into the working demo app"],
  },
  {
    task: 4,
    level: "Level 2",
    title: "Blog homepage",
    where: "/journal",
    required: ["Header with blog title", "Post cards: title, image, description, date", "Category filter (Tech, Travel, Food)", "Limited posts per page"],
    bonus: ["Search posts by title keyword"],
    extra: ["Filters live in the URL, so results are shareable", "Matches highlighted", "Sort by newest, oldest or quickest read", "Post pages with reading progress and saved posts"],
  },
  {
    task: 6,
    level: "Level 3",
    title: "Freelance client dashboard",
    where: "/app/overview",
    required: ["Overview: summary cards, recent activity, stats", "Projects: name, status, deadline", "Profile settings: name, email, password field", "Sidebar + header stay on every page", "Routing without page reloads", "Charts (Recharts)", "Responsive"],
    bonus: ["Notification dropdown with the 3 latest activities"],
    extra: ["Every change across the app feeds the activity log", "Project drawer with status and progress editing", "Profile edits update the sidebar and greeting", "Command palette (Ctrl + K)"],
  },
  {
    task: 7,
    level: "Level 3",
    title: "Real-time weather dashboard",
    where: "/app/weather",
    required: ["Live weather for several cities", "Temperature, icons and 3-day forecast", "City search", "Loading states", "Clean, minimal UI"],
    bonus: ["Current location, fetched automatically on request"],
    extra: ["3D globe of your client cities", "Local time + 'good time to call' for each client", "24-hour temperature chart", "°C / °F, retry on errors"],
  },
  {
    task: 8,
    level: "Industry",
    title: "Kanban job tracker",
    where: "/app/pipeline",
    required: ["Drag cards across Applied, Interviewing, Offer, Rejected", "TypeScript with no `any`: Job, Column, Status interfaces", "React Hook Form for the Add Job modal", "dnd-kit for drag and drop"],
    bonus: ["LocalStorage persistence in a custom hook with a 1s simulated delay and skeleton loader"],
    extra: ["Edit cards, delete with undo", "Turn an offer into a real dashboard project", "Search and priority filter", "Keyboard dragging"],
  },
];

export function specForPath(pathname: string): Spec | undefined {
  if (pathname === "/") return SPECS.find((s) => s.task === 3);
  if (pathname.startsWith("/journal")) return SPECS.find((s) => s.task === 4);
  if (pathname.startsWith("/contact")) return SPECS.find((s) => s.task === 2);
  if (pathname.startsWith("/app/pipeline")) return SPECS.find((s) => s.task === 8);
  if (pathname.startsWith("/app/weather")) return SPECS.find((s) => s.task === 7);
  if (pathname.startsWith("/app")) return SPECS.find((s) => s.task === 6);
  return undefined;
}
