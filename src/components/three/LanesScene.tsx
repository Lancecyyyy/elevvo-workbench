import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Billboard, ContactShadows, RoundedBox } from "@react-three/drei";
import { CanvasTexture, MathUtils, SRGBColorSpace, type Group } from "three";

/* The TaskFlow idea in one object: three lanes (Later → Next → Now).
 * Cards drift forward on their own; click one to finish it. */

type Lane = 0 | 1 | 2;
interface CardState {
  id: number;
  lane: Lane;
  order: number;
  done: boolean;
  tag: string;
  w: number;
}

const LANE_X = [-2.45, 0, 2.45];
const LANE_NAMES = ["Later", "Next", "Now"];
const TAGS = ["#261cc1", "#f2b84b", "#5fd39c", "#ff9b85"];
const SLOT_Z = (i: number) => -1.18 + i * 0.8;
const TRAY_TOP = 0.09;

function initialCards(): CardState[] {
  const lanes: Lane[] = [0, 0, 0, 1, 1, 2, 2];
  return lanes.map((lane, i) => ({
    id: i,
    lane,
    order: i,
    done: i === 5,
    tag: TAGS[i % TAGS.length],
    w: 0.45 + ((i * 37) % 40) / 100,
  }));
}

interface Palette {
  tray: string;
  trayEdge: string;
  card: string;
  bar: string;
  doneCard: string;
  doneBar: string;
}

function Card({ c, slot, palette, onToggle }: { c: CardState; slot: number; palette: Palette; onToggle: (id: number) => void }) {
  const ref = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  const first = useRef(true);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const tx = LANE_X[c.lane];
    const tz = SLOT_Z(slot);
    if (first.current) {
      g.position.set(tx, TRAY_TOP + 0.05, tz);
      first.current = false;
    }
    const k = 5.2;
    g.position.x = MathUtils.damp(g.position.x, tx, k, dt);
    g.position.z = MathUtils.damp(g.position.z, tz, k, dt);
    // hop while travelling between lanes
    const travel = Math.min(1, Math.abs(tx - g.position.x) * 0.55);
    const ty = TRAY_TOP + 0.05 + travel * 0.9 + (hover ? 0.14 : 0);
    g.position.y = MathUtils.damp(g.position.y, ty, 9, dt);
    g.rotation.z = MathUtils.damp(g.rotation.z, (tx - g.position.x) * -0.18, 8, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, hover ? -0.08 : 0, 8, dt);
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onToggle(c.id);
  };

  const body = c.done ? palette.doneCard : palette.card;
  const bar = c.done ? palette.doneBar : palette.bar;

  return (
    <group
      ref={ref}
      onClick={click}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      <RoundedBox args={[1.78, 0.1, 0.64]} radius={0.045} smoothness={3}>
        <meshStandardMaterial color={body} roughness={0.55} />
      </RoundedBox>
      {/* "text" lines on the card face */}
      <mesh position={[-0.82 + (c.w * 1.6) / 2 + 0.12, 0.056, -0.11]}>
        <boxGeometry args={[c.w * 1.6, 0.012, 0.085]} />
        <meshStandardMaterial color={bar} />
      </mesh>
      <mesh position={[-0.82 + 0.42 + 0.12, 0.056, 0.08]}>
        <boxGeometry args={[0.84, 0.012, 0.06]} />
        <meshStandardMaterial color={bar} transparent opacity={0.45} />
      </mesh>
      {c.done ? (
        // check mark
        <group position={[0.62, 0.062, -0.01]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[-0.05, -0.03, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.13, 0.045, 0.012]} />
            <meshStandardMaterial color="#f7dd7d" />
          </mesh>
          <mesh position={[0.05, 0.02, 0]} rotation={[0, 0, -Math.PI / 3.2]}>
            <boxGeometry args={[0.24, 0.045, 0.012]} />
            <meshStandardMaterial color="#f7dd7d" />
          </mesh>
        </group>
      ) : (
        <mesh position={[0.66, 0.06, -0.11]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 24]} />
          <meshStandardMaterial color={c.tag} />
        </mesh>
      )}
    </group>
  );
}

/** Lane label drawn into a canvas texture, so it lives inside the 3D scene. */
function LaneChip({ text, count, dot, dark }: { text: string; count: number; dot: string; dark: boolean }) {
  const texture = useMemo(() => {
    const W = 360;
    const H = 112;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = dark ? "#13104a" : "#ffffff";
      ctx.strokeStyle = dark ? "rgba(246,243,234,0.18)" : "rgba(20,17,107,0.14)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(4, 4, W - 8, H - 8, (H - 8) / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = dot;
      ctx.beginPath();
      ctx.arc(52, H / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 44px Geist, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillStyle = dark ? "#f6f3ea" : "#14116b";
      ctx.fillText(text, 84, H / 2 + 2);
      const w = ctx.measureText(text).width;
      ctx.fillStyle = dark ? "rgba(246,243,234,0.45)" : "rgba(20,17,107,0.42)";
      ctx.fillText(String(count), 84 + w + 18, H / 2 + 2);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text, count, dot, dark]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <Billboard>
      <mesh>
        <planeGeometry args={[1.05, 0.33]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

function Board({ dark, onFinish }: { dark: boolean; onFinish: () => void }) {
  const group = useRef<Group>(null);
  const [cards, setCards] = useState<CardState[]>(initialCards);
  const orderSeq = useRef(100);
  const pausedUntil = useRef(0);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const palette: Palette = dark
    ? { tray: "#1b175f", trayEdge: "#231e73", card: "#f6f3ea", bar: "#150f6e", doneCard: "#3a30d6", doneBar: "#fffdfb" }
    : { tray: "#efe6d2", trayEdge: "#e0d7c2", card: "#ffffff", bar: "#14116b", doneCard: "#261cc1", doneBar: "#fffdfb" };

  // the slow automatic flow
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const cs = cardsRef.current;
      const lane = (l: Lane) => cs.filter((c) => c.lane === l).sort((a, b) => a.order - b.order);
      const undone = lane(2).find((c) => !c.done);
      if (undone) {
        onFinish();
        setCards(cs.map((c) => (c.id === undone.id ? { ...c, done: true } : c)));
        return;
      }
      let next = cs;
      const now = lane(2);
      if (now.length >= 2) {
        const oldest = now[0];
        next = next.map((c) => (c.id === oldest.id ? { ...c, lane: 0, done: false, order: orderSeq.current++ } : c));
      }
      const nxt = next.filter((c) => c.lane === 1).sort((a, b) => a.order - b.order)[0];
      if (nxt) next = next.map((c) => (c.id === nxt.id ? { ...c, lane: 2, order: orderSeq.current++ } : c));
      const later = next.filter((c) => c.lane === 0).sort((a, b) => a.order - b.order)[0];
      if (later) next = next.map((c) => (c.id === later.id ? { ...c, lane: 1, order: orderSeq.current++ } : c));
      setCards(next);
    }, 2300);
    return () => window.clearInterval(id);
  }, [onFinish]);

  const toggle = (id: number) => {
    pausedUntil.current = Date.now() + 4000;
    const target = cardsRef.current.find((c) => c.id === id);
    if (!target) return;
    if (!target.done) onFinish();
    // finishing a card pulls it into "Now"
    setCards(
      cardsRef.current.map((c) =>
        c.id !== id ? c : c.done ? { ...c, done: false } : { ...c, done: true, lane: 2, order: orderSeq.current++ },
      ),
    );
  };

  const slots = useMemo(() => {
    const m = new Map<number, number>();
    ([0, 1, 2] as Lane[]).forEach((l) =>
      cards
        .filter((c) => c.lane === l)
        .sort((a, b) => a.order - b.order)
        .forEach((c, i) => m.set(c.id, i)),
    );
    return m;
  }, [cards]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = MathUtils.damp(g.rotation.y, state.pointer.x * 0.14, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, -state.pointer.y * 0.06, 3, dt);
  });

  return (
    <group ref={group}>
      {LANE_X.map((x, i) => {
        const count = cards.filter((c) => c.lane === i).length;
        return (
          <group key={i} position={[x, 0, 0]}>
            <RoundedBox args={[2.12, 0.14, 3.55]} radius={0.07} smoothness={3} position={[0, 0, 0]}>
              <meshStandardMaterial color={palette.tray} roughness={0.9} />
            </RoundedBox>
            <group position={[0, 0.32, -2.15]}>
              <LaneChip text={LANE_NAMES[i]} count={count} dot={["#b9b3ff", "#f7dd7d", "#5fd39c"][i]} dark={dark} />
            </group>
          </group>
        );
      })}
      {cards.map((c) => (
        <Card key={c.id} c={c} slot={slots.get(c.id) ?? 0} palette={palette} onToggle={toggle} />
      ))}
    </group>
  );
}

export default function LanesScene({ dark, onFinish }: { dark: boolean; onFinish: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [6.1, 7.0, 8.7], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera }) => camera.lookAt(0.95, 0.15, 0.55)}
      onPointerMissed={() => (document.body.style.cursor = "")}
    >
      <ambientLight intensity={dark ? 0.7 : 1.05} />
      <directionalLight position={[4, 9, 5]} intensity={dark ? 1.1 : 1.5} />
      <directionalLight position={[-6, 4, -2]} intensity={0.35} color="#b9b3ff" />
      <Board dark={dark} onFinish={onFinish} />
      <ContactShadows position={[0, -0.08, 0]} opacity={dark ? 0.6 : 0.32} scale={12} blur={2.4} far={3} resolution={512} color="#150f6e" />
    </Canvas>
  );
}
