import { useRef, useState } from 'react';

/* ---- HSL ↔ HEX ---- */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** 원형 색상환(각도=색상, 중심거리=채도) + 아래 명도 바. */
export default function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const { h, s, l } = hexToHsl(value);
  const [hue, setHue] = useState(h);
  const [sat, setSat] = useState(s || 60);
  const [light, setLight] = useState(l || 50);
  const ref = useRef<HTMLDivElement>(null);

  const emit = (hh: number, ss: number, ll: number) => onChange(hslToHex(hh, ss, ll));

  const pick = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // 0 = 위쪽
    const nh = (ang + 360) % 360;
    const dist = Math.min(1, Math.hypot(dx, dy) / (r.width / 2));
    const ns = Math.round(dist * 100);
    setHue(nh); setSat(ns);
    emit(nh, ns, light);
  };

  const dotR = (sat / 100) * 50; // % from center
  const dotAngle = ((hue - 90) * Math.PI) / 180;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); pick(e); }}
        onPointerMove={(e) => { if (e.buttons === 1) pick(e); }}
        className="relative h-32 w-32 cursor-pointer touch-none rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, #fff, rgba(255,255,255,0) 70%),' +
            'conic-gradient(from 0deg, hsl(0 90% 55%), hsl(60 90% 55%), hsl(120 90% 55%), hsl(180 90% 55%), hsl(240 90% 55%), hsl(300 90% 55%), hsl(360 90% 55%))',
        }}
      >
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{
            left: `${50 + Math.cos(dotAngle) * dotR}%`,
            top: `${50 + Math.sin(dotAngle) * dotR}%`,
            background: value,
          }}
        />
      </div>

      <div className="flex w-full items-center gap-2">
        <span className="h-6 w-6 shrink-0 rounded-md border border-white/20" style={{ background: value }} />
        <input
          type="range"
          min={12}
          max={92}
          value={Math.round(light)}
          onChange={(e) => { const nl = Number(e.target.value); setLight(nl); emit(hue, sat, nl); }}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
          style={{ background: `linear-gradient(90deg, ${hslToHex(hue, sat, 12)}, ${hslToHex(hue, sat, 52)}, ${hslToHex(hue, sat, 92)})` }}
        />
        <span className="w-14 shrink-0 text-right text-[10px] tabular-nums text-slate-500">{value}</span>
      </div>
    </div>
  );
}
