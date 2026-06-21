import { useState, useRef, useEffect, useCallback, useMemo } from "react";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const P = {
  high: {
    gradient: "from-rose-400 via-red-400 to-orange-400",
    shadow: "shadow-rose-300",
    glow: "rgba(251,113,133,0.65)",
    lineColor: "#fda4af",
    badge: "bg-rose-100 text-rose-700",
    headerBg: "from-rose-500 to-orange-400",
  },
  medium: {
    gradient: "from-amber-400 via-yellow-400 to-orange-300",
    shadow: "shadow-amber-300",
    glow: "rgba(251,191,36,0.65)",
    lineColor: "#fcd34d",
    badge: "bg-amber-100 text-amber-700",
    headerBg: "from-amber-500 to-yellow-400",
  },
  low: {
    gradient: "from-emerald-400 via-teal-400 to-cyan-400",
    shadow: "shadow-emerald-300",
    glow: "rgba(52,211,153,0.65)",
    lineColor: "#6ee7b7",
    badge: "bg-emerald-100 text-emerald-700",
    headerBg: "from-emerald-500 to-teal-400",
  },
};

const ICON = { medical: "🏥", school: "🏫", therapy: "🎯", insurance: "📋", support: "🤝" };
const BUBBLE_R = 48;

function getP(priority) {
  return P[priority] || P.low;
}

// Deterministic pseudo-random Y offset per bubble index
function seededOffset(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * 120; // ±60 px
}

export default function RoadmapTab({ roadmap }) {
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });
  const [spawned, setSpawned] = useState(false);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);

  const wrapperRef = useRef(null);

  const sorted = useMemo(
    () =>
      [...(roadmap || [])].sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
      ),
    [roadmap]
  );

  const yOffsets = useMemo(() => sorted.map((_, i) => seededOffset(i)), [sorted.length]);

  // Measure container with ResizeObserver
  const measure = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setContainerW(el.offsetWidth);
    setContainerH(el.offsetHeight);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Reset + trigger spawn animation whenever roadmap changes
  useEffect(() => {
    setSpawned(false);
    const t = setTimeout(() => setSpawned(true), 80);
    return () => clearTimeout(t);
  }, [sorted.length]);

  // Compute bubble positions
  const positions = useMemo(() => {
    if (!containerW || !containerH || !sorted.length) return [];
    const n = sorted.length;
    const padX = 90;
    const cy = containerH / 2;
    return sorted.map((_, i) => ({
      x: n === 1 ? containerW / 2 : padX + (i * (containerW - 2 * padX)) / (n - 1),
      restY: cy + yOffsets[i],
    }));
  }, [containerW, containerH, sorted.length, yOffsets]);

  // SVG centers are always at rest positions
  const centers = useMemo(
    () => positions.map((p) => ({ x: p.x, y: p.restY })),
    [positions]
  );

  const onMouseMove = useCallback((e) => {
    const wr = wrapperRef.current?.getBoundingClientRect();
    if (!wr) return;
    setMouse({ x: e.clientX - wr.left, y: e.clientY - wr.top });
  }, []);

  const onMouseLeave = useCallback(() => setMouse({ x: -9999, y: -9999 }), []);

  function buildPath(a, b) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dist = Math.hypot(mouse.x - mx, mouse.y - my);
    const influence = Math.max(0, 1 - dist / 190) * 75;
    const dx = dist > 0 ? (mouse.x - mx) / dist : 0;
    const dy = dist > 0 ? (mouse.y - my) / dist : 0;
    return `M ${a.x} ${a.y} Q ${mx + dx * influence} ${my + dy * influence} ${b.x} ${b.y}`;
  }

  if (!sorted.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🗺️</p>
        <p>No roadmap steps yet. Complete the intake form to generate one.</p>
      </div>
    );
  }

  const expandedStep = expanded !== null ? sorted[expanded] : null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 290px)", minHeight: 440 }}>
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Your personalized action roadmap</h2>
        <p className="text-sm text-gray-500 mt-1">
          Left = most urgent · Right = least urgent. Hover to preview, click to expand.
        </p>
      </div>

      {/* Canvas — flex-1 so it fills remaining height, overflow visible for tooltips */}
      <div
        ref={wrapperRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="flex-1 relative rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50 border border-gray-100"
        style={{ overflow: "visible" }}
      >
        {/* SVG connecting lines */}
        {containerW > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", overflow: "visible", borderRadius: "1rem" }}
          >
            <defs>
              {sorted.slice(0, -1).map((step, i) => (
                <linearGradient
                  key={i}
                  id={`lg-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={centers[i]?.x ?? 0}
                  y1={centers[i]?.y ?? 0}
                  x2={centers[i + 1]?.x ?? 0}
                  y2={centers[i + 1]?.y ?? 0}
                >
                  <stop offset="0%" stopColor={getP(step.priority).lineColor} />
                  <stop offset="100%" stopColor={getP(sorted[i + 1]?.priority).lineColor} />
                </linearGradient>
              ))}
            </defs>

            {centers.slice(0, -1).map((a, i) => {
              const b = centers[i + 1];
              if (!a || !b) return null;
              const near = hovered === i || hovered === i + 1;
              const d = buildPath(a, b);
              return (
                <g key={i}>
                  {/* Glow */}
                  <path
                    d={d}
                    fill="none"
                    stroke={getP(sorted[i].priority).lineColor}
                    strokeWidth={near ? 12 : 6}
                    strokeLinecap="round"
                    opacity={near ? 0.22 : 0.08}
                    style={{ transition: "opacity 0.25s, stroke-width 0.25s" }}
                  />
                  {/* Line */}
                  <path
                    d={d}
                    fill="none"
                    stroke={`url(#lg-${i})`}
                    strokeWidth={near ? 3 : 2}
                    strokeLinecap="round"
                    strokeDasharray={near ? undefined : "7 4"}
                    opacity={near ? 1 : 0.5}
                    style={{ transition: "opacity 0.25s, stroke-width 0.25s" }}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Bubbles */}
        {positions.map((pos, i) => {
          const step = sorted[i];
          const ps = getP(step.priority);
          const isHov = hovered === i;
          const icon = ICON[step.category] || "📌";
          const shortTitle = step.title.length > 22 ? step.title.slice(0, 20) + "…" : step.title;

          // Tooltip flips below if bubble is in upper third of container
          const tooltipAbove = pos.restY > containerH * 0.35;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos.x - BUBBLE_R,
                top: pos.restY - BUBBLE_R,
                // Start offset from the center line, ease into rest position
                transform: spawned ? "translateY(0px)" : `translateY(${-yOffsets[i]}px)`,
                transition: spawned
                  ? `transform 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 65}ms`
                  : "none",
                zIndex: isHov ? 20 : 1,
              }}
            >
              {/* Bubble */}
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setExpanded(i)}
                className={`
                  cursor-pointer select-none rounded-full
                  flex flex-col items-center justify-center
                  bg-gradient-to-br ${ps.gradient}
                  ring-4 ring-white shadow-xl ${ps.shadow}
                  transition-transform duration-300 ease-out
                  ${isHov ? "scale-125" : "scale-100"}
                `}
                style={{
                  width: BUBBLE_R * 2,
                  height: BUBBLE_R * 2,
                  ...(isHov
                    ? { boxShadow: `0 0 0 6px rgba(255,255,255,0.8), 0 0 44px ${ps.glow}, 0 8px 32px rgba(0,0,0,0.12)` }
                    : {}),
                }}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <span className="text-white text-[10px] font-bold mt-1 text-center px-2 leading-tight">
                  {shortTitle}
                </span>
              </div>

              {/* Tooltip */}
              {isHov && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-56 bg-white rounded-2xl p-4 text-left pointer-events-none"
                  style={{
                    zIndex: 50,
                    boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
                    ...(tooltipAbove
                      ? { bottom: BUBBLE_R * 2 + 14 }
                      : { top: BUBBLE_R * 2 + 14 }),
                  }}
                >
                  {/* Arrow */}
                  {tooltipAbove ? (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rotate-45 border-b border-r border-gray-100" />
                  ) : (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 border-t border-l border-gray-100" />
                  )}

                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl shrink-0">{icon}</span>
                    <span className="font-bold text-gray-900 text-sm leading-snug">{step.title}</span>
                  </div>
                  <p
                    className="text-xs text-gray-500 leading-relaxed"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {step.description}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ps.badge}`}>
                      {step.priority}
                    </span>
                    <span className="text-[10px] text-gray-400">{step.timeline}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 shrink-0 flex gap-5 justify-center">
        {["high", "medium", "low"].map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getP(p).gradient}`} />
            <span className="text-xs text-gray-400 capitalize">{p} priority</span>
          </div>
        ))}
      </div>

      {/* Expanded modal */}
      {expandedStep && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setExpanded(null)}
        >
          <div
            className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden"
            style={{ maxHeight: "85vh", boxShadow: "0 40px 120px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div className={`bg-gradient-to-br ${getP(expandedStep.priority).headerBg} px-8 pt-8 pb-6`}>
              <button
                onClick={() => setExpanded(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl leading-none transition"
              >
                ×
              </button>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{ICON[expandedStep.category] || "📌"}</span>
                <div>
                  <h2 className="text-white font-extrabold text-2xl leading-tight">{expandedStep.title}</h2>
                  <p className="text-white/75 text-sm mt-0.5">{expandedStep.timeline}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                  {expandedStep.priority} priority
                </span>
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                  {expandedStep.category}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 200px)" }}>
              <p className="text-gray-700 text-base leading-relaxed">{expandedStep.description}</p>
            </div>

            {/* Footer nav */}
            <div className="px-8 pb-6 pt-2 flex items-center justify-between border-t border-gray-100">
              <button
                disabled={expanded === 0}
                onClick={() => setExpanded((n) => Math.max(0, n - 1))}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-400">
                {expanded + 1} / {sorted.length}
              </span>
              <button
                disabled={expanded === sorted.length - 1}
                onClick={() => setExpanded((n) => Math.min(sorted.length - 1, n + 1))}
                className="px-4 py-2 text-sm rounded-xl bg-compass-600 text-white hover:bg-compass-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
