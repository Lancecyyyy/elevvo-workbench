import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BackSide, Color, Object3D, Vector3, type InstancedMesh, type Group, type Mesh } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { landDots, toVec } from "../../lib/geo";

export interface GlobePin {
  id: string;
  label: string;
  detail?: string;
  lat: number;
  lon: number;
  kind: "client" | "you" | "pinned";
}

const R = 1.5;
const PIN_COLOR: Record<GlobePin["kind"], string> = { client: "#f7dd7d", you: "#5fd39c", pinned: "#ff9b85" };

function Land({ color }: { color: string }) {
  const ref = useRef<InstancedMesh>(null);
  const dots = useMemo(() => landDots(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    dots.forEach((d, i) => {
      const [x, y, z] = toVec(d.lat, d.lon, R + 0.003);
      o.position.set(x, y, z);
      o.lookAt(x * 2, y * 2, z * 2);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dots]);

  useEffect(() => {
    if (!ref.current) return;
    (ref.current.material as { color?: Color }).color?.set(color);
  }, [color]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, dots.length]}>
      <circleGeometry args={[0.0088, 6]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
}

function Pin({ pin, selected, onSelect, onHover }: { pin: GlobePin; selected: boolean; onSelect: (id: string) => void; onHover: (id: string | null) => void }) {
  const pos = useMemo(() => new Vector3(...toVec(pin.lat, pin.lon, R)), [pin.lat, pin.lon]);
  const ring = useRef<Mesh>(null);
  const group = useRef<Group>(null);
  const [hover, setHover] = useState(false);

  useLayoutEffect(() => {
    group.current?.lookAt(pos.clone().multiplyScalar(2));
  }, [pos]);

  useFrame(({ clock }) => {
    if (ring.current) {
      const s = 1 + ((clock.elapsedTime * 0.9) % 1) * 1.6;
      ring.current.scale.setScalar(s);
      const m = ring.current.material as { opacity: number };
      m.opacity = 0.85 * (1 - ((clock.elapsedTime * 0.9) % 1));
    }
  });

  return (
    <group position={pos}>
      <group ref={group}>
        <mesh
          position={[0, 0, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pin.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            onHover(pin.id);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover(false);
            onHover(null);
            document.body.style.cursor = "";
          }}
        >
          <sphereGeometry args={[selected || hover ? 0.05 : 0.038, 16, 16]} />
          <meshBasicMaterial color={PIN_COLOR[pin.kind]} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <ringGeometry args={[0.055, 0.07, 32]} />
          <meshBasicMaterial color="#150f6e" transparent opacity={0.55} />
        </mesh>
        {selected && (
          <mesh ref={ring} position={[0, 0, 0.01]}>
            <ringGeometry args={[0.06, 0.075, 40]} />
            <meshBasicMaterial color={PIN_COLOR[pin.kind]} transparent />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** Projects the labelled pin to screen space and moves a plain DOM label there. */
function LabelTracker({ pin, labelRef }: { pin: GlobePin | null; labelRef: RefObject<HTMLDivElement | null> }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const el = labelRef.current;
    if (!el) return;
    if (!pin) {
      el.style.opacity = "0";
      return;
    }
    const [x, y, z] = toVec(pin.lat, pin.lon, R + 0.02);
    v.set(x, y, z);
    const facing = v.clone().normalize().dot(camera.position.clone().normalize());
    v.project(camera);
    const sx = (v.x * 0.5 + 0.5) * size.width;
    const sy = (-v.y * 0.5 + 0.5) * size.height;
    el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, calc(-100% - 14px))`;
    el.style.opacity = facing > 0.2 ? "1" : "0";
  });
  return null;
}

function Rig({ focus }: { focus: { lat: number; lon: number } | null }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const target = useRef<Vector3 | null>(null);
  const idleSince = useRef(Date.now());

  useEffect(() => {
    if (!focus) return;
    const dir = new Vector3(...toVec(focus.lat, focus.lon, 1)).normalize();
    // look at the city from slightly above so it sits in the upper-middle
    dir.y += 0.18;
    target.current = dir.normalize();
    idleSince.current = Date.now();
  }, [focus]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (target.current) {
      const dist = camera.position.length();
      const cur = camera.position.clone().normalize();
      cur.lerp(target.current, 1 - Math.exp(-3.5 * dt)).normalize();
      camera.position.copy(cur.multiplyScalar(dist));
      if (cur.angleTo(target.current) < 0.004) target.current = null;
    }
    c.autoRotate = !target.current && Date.now() - idleSince.current > 7000;
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom
      minDistance={4.2}
      maxDistance={8}
      rotateSpeed={0.55}
      autoRotateSpeed={0.45}
      enableDamping
      onStart={() => {
        target.current = null;
        idleSince.current = Date.now();
      }}
      onEnd={() => (idleSince.current = Date.now())}
    />
  );
}

export default function Globe({
  pins,
  selectedId,
  onSelect,
  dark,
}: {
  pins: GlobePin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  dark: boolean;
}) {
  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const focus = useMemo(() => (selected ? { lat: selected.lat, lon: selected.lon } : null), [selected?.lat, selected?.lon]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const labelled = pins.find((p) => p.id === (hoverId ?? selectedId)) ?? null;
  const labelRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative h-full w-full">
    <Canvas dpr={[1, 1.8]} camera={{ position: [0, 1.4, 5.9], fov: 36 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={dark ? 0.55 : 0.95} />
      <directionalLight position={[-4, 3, 5]} intensity={dark ? 0.9 : 0.6} />
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial color={dark ? "#15114f" : "#fffdfb"} emissive={dark ? "#0b0930" : "#f3eee2"} emissiveIntensity={dark ? 0.4 : 0.75} roughness={1} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[R, 48, 48]} />
        <meshBasicMaterial color={dark ? "#8f87ff" : "#261cc1"} transparent opacity={dark ? 0.08 : 0.05} side={BackSide} />
      </mesh>
      <Land color={dark ? "#8f87ff" : "#261cc1"} />
      {pins.map((p) => (
        <Pin key={p.id} pin={p} selected={p.id === selectedId} onSelect={onSelect} onHover={setHoverId} />
      ))}
      <Rig focus={focus} />
      <LabelTracker pin={labelled} labelRef={labelRef} />
    </Canvas>
      <div
        ref={labelRef}
        className="pointer-events-none absolute top-0 left-0 rounded-lg bg-night px-2.5 py-1.5 text-[12px] whitespace-nowrap text-cream opacity-0 shadow-lg transition-opacity duration-150 dark:bg-cream dark:text-night"
      >
        {labelled && (
          <>
            <span className="font-medium">{labelled.label}</span>
            {labelled.detail && <span className="ml-1.5 text-butter dark:text-cobalt">{labelled.detail}</span>}
          </>
        )}
      </div>
    </div>
  );
}
