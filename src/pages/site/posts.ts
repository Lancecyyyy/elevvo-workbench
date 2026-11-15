export type Category = "Tech" | "Travel" | "Food";

export interface Author {
  name: string;
  role: string;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date
  category: Category;
  minutes: number;
  author: Author;
  body: string[];
  /** Unsplash photo id (free to use under the Unsplash License) */
  photo: string;
  alt: string;
}

const LANCE: Author = { name: "Lance Camba", role: "Front-end" };
const ANA: Author = { name: "Ana Reyes", role: "Design" };
const OMAR: Author = { name: "Omar Haddad", role: "Engineering" };
const JO: Author = { name: "Jo Santos", role: "Support" };

const p = (...paras: string[]) => paras;

export const POSTS: Post[] = [
  {
    slug: "building-the-3d-lanes",
    photo: "photo-1702471896913-97a7e7f59745",
    alt: "A desk with a computer and a lamp",
    title: "How we built the 3D lanes on our homepage",
    excerpt: "Seven rounded boxes, one damped spring per card, and why we skipped real-time shadows.",
    date: "2026-11-10",
    category: "Tech",
    minutes: 7,
    author: LANCE,
    body: p(
      "The homepage needed one picture that explained TaskFlow without a paragraph. Lanes were the obvious idea, but a flat illustration felt like every other productivity site. So we built the lanes as an object you can touch.",
      "It's React Three Fiber underneath. Each lane is a rounded box, and each card is a smaller rounded box with two thin bars standing in for text. A card only knows its target lane and slot. Every frame it eases toward that position with a damped spring, and it hops while it travels so the motion reads as moving between lanes rather than sliding through them.",
      "We left out real-time shadow maps on purpose. A single baked contact shadow under the board looks almost the same and costs a fraction of the GPU time, which matters on the mid-range Android phones a lot of our users carry.",
      "The part we like most is that you can click a card to finish it. It's a small thing, but people who touch the hero scroll further down the page.",
    ),
  },
  {
    slug: "batanes-without-signal",
    photo: "photo-1597926616299-c049c838a431",
    alt: "White and red lighthouse on a green hill",
    title: "Three days in Batanes with no signal",
    excerpt: "Rolling hills, stone houses, and what happens to a to-do list when nothing can sync.",
    date: "2026-11-02",
    category: "Travel",
    minutes: 5,
    author: ANA,
    body: p(
      "I flew to Basco with a laptop, a sketchbook and a plan to keep working. The plan lasted about four hours.",
      "There was signal in town, sort of. Out at Marlboro Country there was none at all, and after the first panic it was the best thing that happened all month. I wrote tasks on paper and typed them in when we got back to the guesthouse.",
      "Offline mode got a lot of attention from our team after that trip. Everything you capture without a connection now waits quietly and syncs when you're back, and nothing gets lost in between.",
    ),
  },
  {
    slug: "adobo-argument",
    photo: "photo-1537495988501-f9cd94a78f3e",
    alt: "Filipino dishes laid out on a banana leaf",
    title: "The adobo argument: vinegar first or soy?",
    excerpt: "We cooked it six ways for the team lunch. The office is still divided.",
    date: "2026-10-27",
    category: "Food",
    minutes: 4,
    author: JO,
    body: p(
      "Every remote team needs a ritual. Ours is the monthly lunch, where whoever's in Manila cooks and everyone else watches on a call and argues.",
      "This month was adobo, six ways. Vinegar first and simmered without stirring won the blind taste test by one vote. Soy first won the argument afterwards, because Omar refused to concede.",
      "The recipe card lives in a shared TaskFlow board now, with every variation as its own card. Somebody added a seventh with coconut milk. We are not discussing it.",
    ),
  },
  {
    slug: "typescript-without-any",
    photo: "photo-1515879218367-8466d910aaa4",
    alt: "A computer screen full of code",
    title: "TypeScript without any: how we keep strict mode painless",
    excerpt: "Unions, generics and runtime guards for data that comes back out of storage.",
    date: "2026-10-20",
    category: "Tech",
    minutes: 9,
    author: OMAR,
    body: p(
      "Our codebase has zero uses of the any type, and nobody on the team finds it annoying. That took some habits.",
      "Status values are string unions, not loose strings. A job can only be applied, interviewing, offer or rejected, and the compiler tells you when you forget one in a switch.",
      "Board helpers are generic over Record<K, T[]>, so the same move-between-columns function works for the pipeline and for any other board we add later.",
      "Anything that comes back from localStorage goes through a type guard first. JSON.parse returns unknown in our code, never any, and the guard decides whether to trust it or fall back to defaults.",
    ),
  },
  {
    slug: "taipei-night-markets",
    photo: "photo-1535898331935-2d274aff0fbc",
    alt: "People eating at a street food stall at night",
    title: "Night markets of Taipei, ranked by a first-timer",
    excerpt: "Shilin is famous, Raohe is better, and the pepper buns are worth any queue.",
    date: "2026-10-08",
    category: "Travel",
    minutes: 6,
    author: LANCE,
    body: p(
      "I had a week in Taipei between projects and decided to eat my way through as many night markets as my stomach allowed.",
      "Raohe wins. It's one long street, so you can't get lost, and the pepper buns at the entrance justify the whole trip. Shilin is bigger and louder, and better if you want to shop.",
      "I kept a TaskFlow list of stalls to try and ticked them off as I went. Thirty-one done. I regret nothing.",
    ),
  },
  {
    slug: "sourdough-thermometer",
    photo: "photo-1590301157172-7ba48dd1c2b2",
    alt: "A loaf of bread on a wooden table",
    title: "My sourdough failed until I bought a thermometer",
    excerpt: "It wasn't the starter. It was a kitchen running five degrees too warm.",
    date: "2026-09-30",
    category: "Food",
    minutes: 5,
    author: ANA,
    body: p(
      "Six flat loaves in a row. I blamed the flour, then the starter, then myself.",
      "A twelve-dollar thermometer solved it. My kitchen in Quezon City sits around 31°C in the afternoon, and every recipe I followed assumed 24°C. Shorter proofs, colder water, done.",
      "Lesson for work too: measure before you change everything.",
    ),
  },
  {
    slug: "offline-first-sync",
    photo: "photo-1605362814200-8efc2d015560",
    alt: "A glass of coffee on a laptop in a cafe",
    title: "Designing offline-first sync for flaky connections",
    excerpt: "Queues, conflict rules and the one bug that ate a client's Tuesday.",
    date: "2026-09-18",
    category: "Tech",
    minutes: 8,
    author: OMAR,
    body: p(
      "A lot of our users work from cafés and co-working spaces with unreliable Wi-Fi. Sync has to assume the connection will drop mid-request.",
      "Every change goes into a local queue first and is replayed in order once we're back online. Conflicts are resolved per field, so editing a task's title on your phone and its due date on your laptop both survive.",
      "The bug that taught us the most was a clock-skew issue that reordered a whole day of edits. Now the server assigns the order, not the device.",
    ),
  },
  {
    slug: "siargao-off-season",
    photo: "photo-1565565978731-f9e8cd35a317",
    alt: "Coconut trees under a blue sky",
    title: "Siargao in the off-season: worth it?",
    excerpt: "Fewer crowds, cheaper rooms, more rain, and a surprisingly good work week.",
    date: "2026-09-05",
    category: "Travel",
    minutes: 4,
    author: JO,
    body: p(
      "September in Siargao means rain most afternoons. It also means half-price rooms and an empty Cloud 9.",
      "I worked mornings, surfed badly at lunch and worked again once the rain started. The Client weather view in TaskFlow was weirdly useful: I could see when my Melbourne clients were starting their day.",
      "Would go again. Would pack a better umbrella.",
    ),
  },
  {
    slug: "ten-minute-sinigang",
    photo: "photo-1665593998976-d957f2827fe7",
    alt: "A bowl of soup with a spoon",
    title: "A ten-minute sinigang for busy weeknights",
    excerpt: "Tamarind paste, pork belly and whatever greens are in the fridge.",
    date: "2026-08-28",
    category: "Food",
    minutes: 3,
    author: LANCE,
    body: p(
      "This isn't Lola's sinigang. It's the one you make at 8pm after a deadline.",
      "Pressure-cook the pork for eight minutes, add tamarind paste, tomatoes and radish, then throw in kangkong right before serving. Fish sauce to taste.",
      "Pair with rice and an early night.",
    ),
  },
  {
    slug: "web-audio-clicks",
    photo: "photo-1618384887929-16ec33fab9ef",
    alt: "A black and orange mechanical keyboard",
    title: "Making keyboard clicks with the Web Audio API",
    excerpt: "A filtered noise burst plus a square-wave tick. No audio files, about forty lines.",
    date: "2026-08-19",
    category: "Tech",
    minutes: 6,
    author: LANCE,
    body: p(
      "Every click in the TaskFlow demo makes a soft mechanical-keyboard sound. There isn't a single audio file in the bundle.",
      "Each click is two parts. A short burst of random noise, run through a band-pass filter around 1.5 kHz, gives the clack. A tiny square-wave blip that drops in pitch gives the switch.",
      "A little random jitter on the frequency keeps repeated clicks from sounding robotic. You can mute it from the sidebar, and we won't be offended.",
    ),
  },
  {
    slug: "kyoto-student-budget",
    photo: "photo-1545569341-9eb8b30979d9",
    alt: "A pagoda surrounded by trees in Kyoto",
    title: "Kyoto on a student budget",
    excerpt: "Temples at opening time, konbini breakfasts and a rail pass that paid for itself.",
    date: "2026-08-02",
    category: "Travel",
    minutes: 7,
    author: ANA,
    body: p(
      "Kyoto is expensive if you do it like a postcard. It's very doable if you get up early.",
      "Fushimi Inari at 6am is quiet and free. Konbini egg sandwiches are genuinely excellent. A regional rail pass covered day trips to Nara and Osaka.",
      "I planned each day as three lanes: must see, nice to see, and if there's time. Most days, there wasn't time.",
    ),
  },
  {
    slug: "ube-taste-test",
    photo: "photo-1640839954789-ca0049648b18",
    alt: "A slice of purple ube cake on a plate",
    title: "Ube everything: an office taste test",
    excerpt: "Halaya, pandesal, ice cream, and one ube latte that should not exist.",
    date: "2026-07-21",
    category: "Food",
    minutes: 4,
    author: JO,
    body: p(
      "We bought every ube product within walking distance of the BGC co-working space and ranked them.",
      "Ube halaya from a Good Shepherd box won easily. Ube cheese pandesal came second. The ube latte came last, and the less said the better.",
      "Results are pinned to the team board, where they will be ignored the next time someone buys the latte.",
    ),
  },
  {
    slug: "first-internship-advice",
    photo: "photo-1541807084-5c52b6b3adef",
    alt: "An open laptop on a wooden desk",
    title: "What I'd tell myself before my first internship",
    excerpt: "Ask early, ship small, and write down why you decided something.",
    date: "2026-07-09",
    category: "Tech",
    minutes: 5,
    author: LANCE,
    body: p(
      "A year ago I was nervous about asking questions in case they sounded basic. Every one I held back cost me more time than asking would have.",
      "Ship small pieces. A working sidebar on day two beats a perfect dashboard on day ten.",
      "Write down why you made a decision, not just what you did. Future you, and your reviewer, will thank you.",
    ),
  },
  {
    slug: "laguna-waterfalls",
    photo: "photo-1586263426392-3b3e0748f618",
    alt: "A waterfall in the middle of a forest",
    title: "Chasing waterfalls in Laguna",
    excerpt: "Three falls, one very muddy trail, and the best halo-halo of the year.",
    date: "2026-06-27",
    category: "Travel",
    minutes: 5,
    author: OMAR,
    body: p(
      "My first trip outside Manila since moving here. Ana planned it, which is why it ran on time.",
      "Hulugan Falls was the highlight, though the trail down after rain is more slide than walk. Bring shoes you don't love.",
      "The halo-halo stand at the jump-off point deserves its own post.",
    ),
  },
];

export const CATEGORIES = ["All", "Tech", "Travel", "Food"] as const;
export type Filter = (typeof CATEGORIES)[number];

export const fmtDate = (iso: string, long = false) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, long ? { month: "long", day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" });

/** Unsplash CDN url, resized and compressed on their side. */
export const photoUrl = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`;
