import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import landTopo from "world-atlas/land-110m.json";

export interface LatLon {
  lat: number;
  lon: number;
}

/** lat/lon (degrees) → point on a sphere, matching three.js axes (y up). */
export function toVec(lat: number, lon: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

let cache: LatLon[] | null = null;

/**
 * Evenly spaced dots that sit on land. The land shapes are rasterised once
 * into an off-screen canvas and sampled, which is far cheaper than running
 * point-in-polygon tests for thousands of points.
 */
export function landDots(count = 26000): LatLon[] {
  if (cache) return cache;
  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  const projection = geoEquirectangular().translate([W / 2, H / 2]).scale(W / (2 * Math.PI));
  ctx.fillStyle = "#000";
  ctx.beginPath();
  geoPath(projection, ctx)(land);
  ctx.fill();
  const pixels = ctx.getImageData(0, 0, W, H).data;

  const out: LatLon[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = ((((i * golden * 180) / Math.PI) % 360) + 360) % 360 - 180;
    const px = Math.floor(((lon + 180) / 360) * W);
    const py = Math.floor(((90 - lat) / 180) * H);
    if (pixels[(py * W + px) * 4 + 3] > 128) out.push({ lat, lon });
  }
  cache = out;
  return out;
}
