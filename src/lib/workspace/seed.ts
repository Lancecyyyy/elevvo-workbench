import type { Place, Workspace } from "./types";

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

export const PLACES: Record<string, Place> = {
  melbourne: { id: "melbourne", city: "Melbourne", country: "Australia", lat: -37.814, lon: 144.9633 },
  singapore: { id: "singapore", city: "Singapore", country: "Singapore", lat: 1.2897, lon: 103.8501 },
  quezon: { id: "quezon", city: "Quezon City", country: "Philippines", lat: 14.676, lon: 121.0437 },
  cebu: { id: "cebu", city: "Cebu City", country: "Philippines", lat: 10.3157, lon: 123.8854 },
  berlin: { id: "berlin", city: "Berlin", country: "Germany", lat: 52.5244, lon: 13.4105 },
  toronto: { id: "toronto", city: "Toronto", country: "Canada", lat: 43.7001, lon: -79.4163 },
  cairo: { id: "cairo", city: "Cairo", country: "Egypt", lat: 30.0626, lon: 31.2497 },
  vilnius: { id: "vilnius", city: "Vilnius", country: "Lithuania", lat: 54.6892, lon: 25.2798 },
  manila: { id: "manila", city: "Manila", country: "Philippines", lat: 14.6042, lon: 120.9822 },
};

/** Best-effort match from a free-text "City · Remote" location to a known place. */
export function placeFromLocation(location: string): Place {
  const key = location.toLowerCase();
  const hit = Object.values(PLACES).find((p) => key.includes(p.city.toLowerCase()));
  return hit ?? PLACES.manila;
}

export const SEED: Workspace = {
  version: 2,
  profile: {
    name: "Mara Lim",
    email: "mara@maralim.studio",
    role: "Independent brand designer",
    location: "Quezon City, PH",
    bio: "I design identities for small food and finance brands. Mostly remote, mostly coffee.",
    hue: "butter",
    notifyEmail: true,
    notifyDigest: false,
    workStart: 9,
    workEnd: 18,
  },
  projects: [
    { id: "P-1042", name: "Halcyon rebrand", client: "Halcyon Coffee", place: PLACES.melbourne, status: "In progress", deadline: inDays(13), budget: 4800, progress: 64, createdAt: ago(60 * 24 * 40) },
    { id: "P-1039", name: "Onboarding illustrations", client: "Pocketbank", place: PLACES.singapore, status: "Review", deadline: inDays(5), budget: 2200, progress: 90, createdAt: ago(60 * 24 * 30) },
    { id: "P-1037", name: "Packaging system", client: "Tala Snacks", place: PLACES.quezon, status: "In progress", deadline: inDays(27), budget: 6100, progress: 38, createdAt: ago(60 * 24 * 25) },
    { id: "P-1031", name: "Annual report layout", client: "Bayanihan Fund", place: PLACES.cebu, status: "Completed", deadline: inDays(-16), budget: 3400, progress: 100, createdAt: ago(60 * 24 * 70) },
    { id: "P-1044", name: "App icon refresh", client: "Commute PH", place: PLACES.manila, status: "On hold", deadline: inDays(61), budget: 900, progress: 15, createdAt: ago(60 * 24 * 12) },
    { id: "P-1046", name: "Pitch deck template", client: "Lumen Ventures", place: PLACES.berlin, status: "In progress", deadline: inDays(18), budget: 1800, progress: 52, createdAt: ago(60 * 24 * 9) },
  ],
  activity: [
    { id: "a1", kind: "task", who: "Pocketbank", text: "approved the onboarding set", at: ago(12), link: "/app/projects?open=P-1039" },
    { id: "a2", kind: "payment", who: "Halcyon Coffee", text: "paid invoice #0231 · $1,600", at: ago(130), link: "/app/projects?open=P-1042" },
    { id: "a3", kind: "comment", who: "Tala Snacks", text: "left 3 comments on dieline v2", at: ago(300), link: "/app/projects?open=P-1037" },
    { id: "a4", kind: "file", who: "You", text: "uploaded Halcyon_logo_final.fig", at: ago(60 * 22) },
    { id: "a5", kind: "pipeline", who: "Fieldnote Audio", text: "sent an offer for the podcast covers", at: ago(60 * 26), link: "/app/pipeline" },
    { id: "a6", kind: "payment", who: "Bayanihan Fund", text: "paid invoice #0228 · $3,400", at: ago(60 * 24 * 3) },
  ],
  lastReadAt: ago(60 * 3),
  extraCities: [],
  earnings: [
    { month: "Dec", value: 2400 },
    { month: "Jan", value: 1900 },
    { month: "Feb", value: 2800 },
    { month: "Mar", value: 3300 },
    { month: "Apr", value: 2950 },
    { month: "May", value: 3600 },
    { month: "Jun", value: 3100 },
    { month: "Jul", value: 4200 },
    { month: "Aug", value: 3650 },
    { month: "Sep", value: 5200 },
    { month: "Oct", value: 4900 },
    { month: "Nov", value: 6300 },
  ],
};
