import { useId } from 'react';

/** Tiny decorative area chart (no axes). Uses currentColor, so set the color on a parent. */
export default function Sparkline({ values, className = '' }) {
  const id = useId();
  if (!values || values.length < 2 || !values.some((v) => v > 0)) return null;

  const w = 200;
  const h = 60;
  // Square-root scale so one big day (e.g. rent) doesn't flatten everything else.
  const scaled = values.map((v) => Math.sqrt(Math.max(v, 0)));
  const max = Math.max(...scaled);
  const step = w / (values.length - 1);
  const pts = scaled.map((v, i) => [i * step, h - 4 - (v / max) * (h - 8)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${w},${h}L0,${h}Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
