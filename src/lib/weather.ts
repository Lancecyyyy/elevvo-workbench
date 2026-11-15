import type { LucideIcon } from "lucide-react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";
import type { Place } from "./workspace/types";

export interface DayForecast {
  date: string;
  code: number;
  max: number;
  min: number;
  rain: number;
}

export interface HourPoint {
  hour: string;
  temp: number;
  rain: number;
}

export interface Weather {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  isDay: boolean;
  utcOffset: number;
  days: DayForecast[];
  hours: HourPoint[];
  fetchedAt: number;
}

interface ForecastResponse {
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: (number | null)[] };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

export async function fetchWeather(p: Pick<Place, "lat" | "lon">, signal?: AbortSignal): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(p.lat),
    longitude: String(p.lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    hourly: "temperature_2m,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "4",
  }).toString();
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const j = (await res.json()) as ForecastResponse;
  const nowIdx = Math.max(0, j.hourly.time.findIndex((t) => t >= j.current.time.slice(0, 13)));
  return {
    temp: j.current.temperature_2m,
    feels: j.current.apparent_temperature,
    humidity: j.current.relative_humidity_2m,
    wind: j.current.wind_speed_10m,
    code: j.current.weather_code,
    isDay: j.current.is_day === 1,
    utcOffset: j.utc_offset_seconds,
    days: j.daily.time.slice(1, 4).map((date, i) => ({
      date,
      code: j.daily.weather_code[i + 1],
      max: j.daily.temperature_2m_max[i + 1],
      min: j.daily.temperature_2m_min[i + 1],
      rain: j.daily.precipitation_probability_max[i + 1] ?? 0,
    })),
    hours: j.hourly.time.slice(nowIdx, nowIdx + 24).map((t, i) => ({
      hour: t.slice(11, 13),
      temp: j.hourly.temperature_2m[nowIdx + i],
      rain: j.hourly.precipitation_probability[nowIdx + i] ?? 0,
    })),
    fetchedAt: Date.now(),
  };
}

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export async function searchPlaces(q: string, signal: AbortSignal): Promise<Place[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`,
    { signal },
  );
  if (!res.ok) throw new Error("Search failed");
  const j = (await res.json()) as { results?: GeoResult[] };
  return (j.results ?? []).map((r) => ({
    id: `g${r.id}`,
    city: r.name,
    country: [r.admin1, r.country].filter(Boolean).join(", "),
    lat: r.latitude,
    lon: r.longitude,
  }));
}

export async function reverseName(lat: number, lon: number): Promise<{ city: string; country: string }> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    const j = (await res.json()) as { city?: string; locality?: string; countryName?: string };
    return { city: j.city || j.locality || "Your location", country: j.countryName ?? "" };
  } catch {
    return { city: "Your location", country: `${lat.toFixed(2)}, ${lon.toFixed(2)}` };
  }
}

export function describe(code: number, isDay = true): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear", Icon: isDay ? Sun : Moon };
  if (code <= 2) return { label: "Partly cloudy", Icon: isDay ? CloudSun : CloudMoon };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code <= 48) return { label: "Fog", Icon: CloudFog };
  if (code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code <= 77) return { label: "Snow", Icon: CloudSnow };
  if (code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code <= 86) return { label: "Snow showers", Icon: CloudSnow };
  return { label: "Thunderstorm", Icon: CloudLightning };
}

export type Unit = "C" | "F";
export const deg = (c: number, u: Unit) => Math.round(u === "C" ? c : c * 1.8 + 32);

/** Local wall-clock time at a place, from its UTC offset. */
export function localTime(utcOffsetSeconds: number, now = Date.now()): Date {
  const d = new Date(now + utcOffsetSeconds * 1000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
}
