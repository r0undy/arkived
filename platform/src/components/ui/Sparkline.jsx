/**
 * Minimal inline sparkline (Frontend Roadmap F6 — KPI cards with sparklines).
 * Pure SVG, no chart dependency. Renders nothing when there isn't enough data.
 */
export default function Sparkline({ data = [], width = 96, height = 28, className = '', strokeClass = 'text-brand-400' }) {
  const points = (data || []).map((value) => Number(value) || 0);
  if (points.length < 2) return null;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return [x, y];
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`${strokeClass} ${className}`}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d={area} fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2" fill="currentColor" />
    </svg>
  );
}
