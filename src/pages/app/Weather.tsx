import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Droplets, Loader2, LocateFixed, Phone, PhoneOff, Plus, RefreshCw, Search, Thermometer, Wind, X } from "lucide-react";
import { Skeleton } from "../../components/ui/Card";
import type { GlobePin } from "../../components/three/Globe";
import { usePrefs } from "../../lib/prefs";
import { useWorkspace } from "../../lib/workspace/store";
import type { Place } from "../../lib/workspace/types";
import { deg, describe, fetchWeather, localTime, reverseName, searchPlaces, type Unit, type Weather } from "../../lib/weather";

const Globe = lazy(() => import("../../components/three/Globe"));

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <div className="grid h-full place-items-center p-6 text-center text-[14px] text-muted">3D isn't available on this device, but everything else works.</div> : this.props.children;
  }
}

type Slot = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: Weather };

interface Spot {
  place: Place;
  kind: GlobePin["kind"];
  clients: string[];
}

/** Is it a sensible time to call: weekday working hours for them, and inside your own hours? */
function callWindow(w: Weather, myStart: number, myEnd: number): { ok: boolean; reason: string } {
  const theirs = localTime(w.utcOffset);
  const th = theirs.getHours();
  const weekend = theirs.getDay() === 0 || theirs.getDay() === 6;
  const mh = new Date().getHours();
  if (weekend) return { ok: false, reason: "It's the weekend there" };
  if (th < 9 || th >= 18) return { ok: false, reason: th < 9 ? "Too early there" : "They've finished for the day" };
  if (mh < myStart || mh >= myEnd) return { ok: false, reason: "Outside your working hours" };
  return { ok: true, reason: "Good time to call" };
}

export default function WeatherPage() {
  const { theme } = usePrefs();
  const { ws, addCity, removeCity } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [unit, setUnit] = useState<Unit>("C");
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const [updated, setUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const spots = useMemo<Spot[]>(() => {
    const map = new Map<string, Spot>();
    ws.extraCities.filter((c) => c.id === "here").forEach((c) => map.set(c.id, { place: c, kind: "you", clients: [] }));
    ws.projects
      .filter((p) => p.status !== "Completed")
      .forEach((p) => {
        const s = map.get(p.place.id) ?? { place: p.place, kind: "client" as const, clients: [] };
        s.clients.push(p.client);
        map.set(p.place.id, s);
      });
    ws.extraCities.filter((c) => c.id !== "here").forEach((c) => !map.has(c.id) && map.set(c.id, { place: c, kind: "pinned", clients: [] }));
    return [...map.values()];
  }, [ws.projects, ws.extraCities]);

  const selectedId = params.get("city") && spots.some((s) => s.place.id === params.get("city")) ? (params.get("city") as string) : spots[0]?.place.id ?? null;
  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("city", id);
    setParams(next, { replace: true });
  };
  const selected = spots.find((s) => s.place.id === selectedId);

  const load = useCallback(async (places: Place[]) => {
    setSlots((s) => {
      const next = { ...s };
      places.forEach((p) => (next[p.id] = { state: "loading" }));
      return next;
    });
    await Promise.all(
      places.map(async (p) => {
        try {
          const data = await fetchWeather(p);
          setSlots((s) => ({ ...s, [p.id]: { state: "ready", data } }));
        } catch (e) {
          setSlots((s) => ({ ...s, [p.id]: { state: "error", message: e instanceof Error ? e.message : "Network error" } }));
        }
      }),
    );
    setUpdated(new Date());
  }, []);

  // fetch anything we don't have yet
  const missing = spots.filter((s) => !slots[s.place.id]).map((s) => s.place);
  const missingKey = missing.map((m) => m.id).join(",");
  useEffect(() => {
    if (missing.length) load(missing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, load]);

  // refresh every 10 minutes, tick the clocks every 30s
  useEffect(() => {
    const r = window.setInterval(() => load(spots.map((s) => s.place)), 10 * 60_000);
    const t = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      window.clearInterval(r);
      window.clearInterval(t);
    };
  }, [load, spots]);

  // debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const id = window.setTimeout(() => {
      searchPlaces(q, ctrl.signal)
        .then(setResults)
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 280);
    return () => {
      ctrl.abort();
      window.clearTimeout(id);
    };
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => searchRef.current && !searchRef.current.contains(e.target as Node) && setSearchOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pin = (p: Place) => {
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    if (!spots.some((s) => s.place.id === p.id)) addCity(p);
    select(p.id);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return setGeoError("Your browser doesn't support location.");
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const { city, country } = await reverseName(lat, lon);
        removeCity("here");
        const here: Place = { id: "here", city, country: country || "Your location", lat, lon };
        addCity(here);
        setSlots((s) => {
          const n = { ...s };
          delete n.here;
          return n;
        });
        select("here");
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoError(err.code === err.PERMISSION_DENIED ? "Location permission was denied. You can still search for your city." : "Couldn't get your location.");
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const pins: GlobePin[] = spots.map((s) => {
    const slot = slots[s.place.id];
    return { id: s.place.id, label: s.place.city, detail: slot?.state === "ready" ? `${deg(slot.data.temp, unit)}°` : undefined, lat: s.place.lat, lon: s.place.lon, kind: s.kind };
  });

  const sel = selected ? slots[selected.place.id] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[44px] leading-none">Client weather</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Live conditions and local time wherever your clients are.{" "}
            {updated && <span className="text-faint">Updated {updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-sunk p-0.5" role="radiogroup" aria-label="Units">
            {(["C", "F"] as const).map((u) => (
              <button key={u} role="radio" aria-checked={unit === u} onClick={() => setUnit(u)} className={`relative h-8 w-10 rounded-md text-[13px] font-medium ${unit === u ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
                °{u}
              </button>
            ))}
          </div>
          <button onClick={() => load(spots.map((s) => s.place))} aria-label="Refresh weather" className="grid h-9 w-9 place-items-center rounded-lg border border-line-2 bg-surface hover:border-ink">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* search + locate */}
      <div className="relative z-20 mt-5 flex flex-col gap-2 sm:flex-row">
        <div ref={searchRef} className="relative flex-1">
          <label className="flex h-11 items-center rounded-lg border border-line-2 bg-surface px-3 focus-within:border-brand">
            {searching ? <Loader2 size={16} className="animate-spin text-brand" /> : <Search size={16} className="text-faint" />}
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && results[0] && pin(results[0])}
              placeholder="Pin another city, like Dubai or São Paulo"
              aria-label="Search for a city"
              className="h-full w-full bg-transparent px-2.5 text-[14.5px] outline-none placeholder:text-faint"
            />
          </label>
          <AnimatePresence>
            {searchOpen && query.trim().length >= 2 && (
              <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute inset-x-0 top-[50px] overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
                {results.length === 0 && !searching && <li className="px-4 py-3 text-[14px] text-muted">No matching cities.</li>}
                {results.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => pin(r)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-sunk">
                      <span>
                        <span className="font-medium">{r.city}</span> <span className="text-muted">{r.country}</span>
                      </span>
                      <Plus size={15} className="shrink-0 text-brand" />
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <button onClick={locate} disabled={locating} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-hi px-4 text-[14px] font-medium text-on-hi disabled:opacity-70">
          {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />} Use my location
        </button>
      </div>
      {geoError && <p className="mt-2 text-[13.5px] text-bad">{geoError}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* globe */}
        <div className="relative h-[360px] overflow-hidden rounded-2xl border border-line bg-surface sm:h-[460px] lg:h-auto lg:min-h-[540px]">
          <GlobeBoundary>
            <Suspense fallback={<div className="grid h-full place-items-center"><Loader2 className="animate-spin text-faint" /></div>}>
              <Globe pins={pins} selectedId={selectedId} onSelect={select} dark={theme === "dark"} />
            </Suspense>
          </GlobeBoundary>
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-surface/90 px-3 py-2 text-[12px] text-muted backdrop-blur">
            {([["#f7dd7d", "Clients"], ["#5fd39c", "You"], ["#ff9b85", "Pinned"]] as const).map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full ring-1 ring-cobalt-deep/40" style={{ background: c }} /> {l}
              </span>
            ))}
          </div>
          <p className="pointer-events-none absolute top-3 right-3 rounded-lg bg-surface/90 px-2.5 py-1 text-[12px] text-faint backdrop-blur">Drag to spin · click a pin</p>
        </div>

        {/* detail */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          {!selected ? (
            <p className="py-20 text-center text-muted">Add a project or pin a city to get started.</p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selected.place.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-muted">{selected.kind === "you" ? "You are here" : selected.kind === "client" ? selected.clients.join(", ") : "Pinned city"}</p>
                    <h2 className="mt-0.5 text-[26px] leading-tight font-semibold tracking-[-0.01em]">{selected.place.city}</h2>
                    <p className="text-[13.5px] text-muted">{selected.place.country}</p>
                  </div>
                  {sel?.state === "ready" && (
                    <div className="text-right">
                      <p className="text-[24px] font-semibold tabular">{localTime(sel.data.utcOffset).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                      <p className="text-[12.5px] text-muted">{localTime(sel.data.utcOffset).toLocaleDateString(undefined, { weekday: "long" })}</p>
                    </div>
                  )}
                </div>

                {sel?.state === "loading" || !sel ? (
                  <div className="mt-6 space-y-3">
                    <Skeleton className="h-16 w-40" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : sel.state === "error" ? (
                  <div className="mt-8 rounded-xl bg-bad/8 p-4 text-[14px]">
                    <p className="font-medium text-bad">Couldn't load the weather.</p>
                    <p className="text-muted">{sel.message}</p>
                    <button onClick={() => load([selected.place])} className="mt-3 rounded-lg border border-line-2 px-3 py-1.5 text-[13.5px] font-medium">Try again</button>
                  </div>
                ) : (
                  (() => {
                    const w = sel.data;
                    const d = describe(w.code, w.isDay);
                    const call = callWindow(w, ws.profile.workStart, ws.profile.workEnd);
                    return (
                      <>
                        {selected.kind !== "you" && (
                          <p className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium ${call.ok ? "bg-ok/12 text-ok" : "bg-sunk text-muted"}`}>
                            {call.ok ? <Phone size={13} /> : <PhoneOff size={13} />} {call.reason}
                          </p>
                        )}
                        <div className="mt-5 flex items-center gap-5">
                          <d.Icon size={64} strokeWidth={1.3} className="text-brand" />
                          <div>
                            <p className="text-[56px] leading-none font-semibold tracking-[-0.03em] tabular">{deg(w.temp, unit)}°</p>
                            <p className="text-[14px] text-muted">{d.label}</p>
                          </div>
                        </div>
                        <dl className="mt-5 grid grid-cols-3 gap-2">
                          {[
                            { Icon: Thermometer, k: "Feels like", v: `${deg(w.feels, unit)}°` },
                            { Icon: Droplets, k: "Humidity", v: `${w.humidity}%` },
                            { Icon: Wind, k: "Wind", v: `${Math.round(w.wind)} km/h` },
                          ].map(({ Icon, k, v }) => (
                            <div key={k} className="rounded-xl bg-sunk px-3 py-2.5">
                              <dt className="flex items-center gap-1.5 text-[12px] text-muted"><Icon size={12} /> {k}</dt>
                              <dd className="mt-0.5 text-[15px] font-semibold tabular">{v}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-5">
                          <p className="text-[13px] font-medium">Next 24 hours</p>
                          <div className="mt-1 h-[90px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={w.hours.map((h) => ({ ...h, t: deg(h.temp, unit) }))} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} interval={5} tick={{ fill: "var(--faint)", fontSize: 11 }} tickFormatter={(h: string) => `${h}:00`} />
                                <Tooltip
                                  cursor={{ stroke: "var(--line-2)" }}
                                  content={({ active, payload }) =>
                                    active && payload?.length ? (
                                      <div className="rounded-md bg-night px-2 py-1 text-[12px] text-cream">
                                        {String(payload[0].payload.hour)}:00 · {String(payload[0].value)}° · {String(payload[0].payload.rain)}% rain
                                      </div>
                                    ) : null
                                  }
                                />
                                <Area type="monotone" dataKey="t" stroke="var(--brand)" strokeWidth={2} fill="url(#tempFill)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {w.days.map((day) => {
                            const dd = describe(day.code);
                            return (
                              <div key={day.date} className="rounded-xl border border-line p-3">
                                <p className="text-[12.5px] text-muted">{new Date(day.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })}</p>
                                <dd.Icon size={22} strokeWidth={1.6} className="mt-1.5 text-brand" aria-label={dd.label} />
                                <p className="mt-1.5 text-[15px] font-semibold tabular">
                                  {deg(day.max, unit)}° <span className="font-normal text-faint">{deg(day.min, unit)}°</span>
                                </p>
                                <p className="text-[11.5px] text-muted">{day.rain}% rain</p>
                              </div>
                            );
                          })}
                        </div>
                        {selected.kind === "client" && (
                          <p className="mt-4 text-[13px] text-muted">
                            Projects here:{" "}
                            {ws.projects
                              .filter((p) => p.place.id === selected.place.id && p.status !== "Completed")
                              .map((p, i) => (
                                <span key={p.id}>
                                  {i > 0 && ", "}
                                  <Link to={`/app/projects?open=${p.id}`} className="font-medium text-brand hover:underline">{p.name}</Link>
                                </span>
                              ))}
                          </p>
                        )}
                      </>
                    );
                  })()
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* all cities */}
      <h2 className="mt-8 mb-3 text-[15px] font-semibold">All cities <span className="font-normal text-muted">{spots.length}</span></h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {spots.map((s) => {
            const slot = slots[s.place.id];
            const on = s.place.id === selectedId;
            return (
              <motion.div key={s.place.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative">
                <button onClick={() => select(s.place.id)} aria-pressed={on} className={`w-full rounded-xl border bg-surface p-4 text-left transition-colors ${on ? "border-brand ring-2 ring-brand/20" : "border-line hover:border-line-2"}`}>
                  <div className="flex items-start justify-between gap-2 pr-5">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{s.place.city}</p>
                      <p className="truncate text-[12.5px] text-muted">{s.kind === "you" ? "You" : s.kind === "client" ? s.clients.join(", ") : "Pinned"}</p>
                    </div>
                  </div>
                  {!slot || slot.state === "loading" ? (
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ) : slot.state === "error" ? (
                    <p className="mt-4 text-[13px] text-bad">Couldn't load · tap to select and retry</p>
                  ) : (
                    (() => {
                      const d = describe(slot.data.code, slot.data.isDay);
                      const call = callWindow(slot.data, ws.profile.workStart, ws.profile.workEnd);
                      return (
                        <div className="mt-3 flex items-end justify-between">
                          <div>
                            <p className="text-[30px] leading-none font-semibold tracking-[-0.02em] tabular">{deg(slot.data.temp, unit)}°</p>
                            <p className="mt-1 text-[12.5px] text-muted">
                              {localTime(slot.data.utcOffset).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {d.label}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <d.Icon size={30} strokeWidth={1.5} className="text-brand" />
                            {s.kind !== "you" && <span className={`h-1.5 w-1.5 rounded-full ${call.ok ? "bg-ok" : "bg-line-2"}`} title={call.reason} />}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </button>
                {s.kind !== "client" && (
                  <button
                    onClick={() => {
                      removeCity(s.place.id);
                      if (on) setParams({}, { replace: true });
                    }}
                    aria-label={`Remove ${s.place.city}`}
                    className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-sunk hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
