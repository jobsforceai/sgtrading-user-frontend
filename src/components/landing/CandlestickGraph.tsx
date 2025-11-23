import React from 'react';

// small deterministic PRNG so visuals stay the same across reloads
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function CandlestickGraph() {
  const candleWidth = 16;
  const gap = 6;
  const count = Math.floor(1600 / (candleWidth + gap));
  const baseline = 140;

  // deterministic random generator
  const rand = mulberry32(123456);

  const candles = Array.from({ length: count }).map((_, i) => {
    const wave = Math.sin(i / 3.2) * 48 + Math.cos(i / 5.7) * 22;
    const jitter = (rand() - 0.5) * 40;
    const open = Math.max(8, Math.min(240, baseline + wave + jitter));
    const change = (rand() - 0.48) * 140;
    const close = Math.max(4, Math.min(252, open + change));
    const high = Math.max(open, close) + rand() * 18 + 6;
    const low = Math.min(open, close) - rand() * 18 - 6;
    const x = 8 + i * (candleWidth + gap);
    return { x, open, close, high: Math.min(258, high), low: Math.max(2, low) };
  });

  return (
    <svg viewBox="0 0 1600 260" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="candleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* baseline for reference */}
      <line x1={0} x2={1600} y1={160} y2={160} stroke="#0f172a" strokeWidth={1} strokeOpacity={0.06} />

      <g>
        {candles.map((c, idx) => {
          const isBull = c.close >= c.open;
          const bodyY = Math.min(c.open, c.close);
          const bodyH = Math.max(1, Math.abs(c.close - c.open));
          const wickX = c.x + candleWidth / 2;
          const fill = isBull ? '#10b981' : '#ef4444';
          const stroke = isBull ? '#065f46' : '#991b1b';

          // appearance timing: one-by-one
          const appearBegin = `${(idx * 0.04).toFixed(2)}s`;
          // bob/flicker begin slightly after appear
          const bobBegin = `${(idx * 0.04 + 0.28).toFixed(2)}s`;
          const dur = `${3 + (idx % 5) * 0.6}s`;

          return (
            <g key={idx}>
              {/* upper wick */}
              <line
                x1={wickX}
                x2={wickX}
                y1={c.high}
                y2={Math.max(c.open, c.close)}
                stroke={stroke}
                strokeWidth={1}
                strokeLinecap="round"
                strokeOpacity={0}
              >
                <animate attributeName="stroke-opacity" from="0" to="0.9" dur="0.18s" begin={appearBegin} fill="freeze" />
              </line>

              {/* lower wick */}
              <line
                x1={wickX}
                x2={wickX}
                y1={Math.min(c.open, c.close)}
                y2={c.low}
                stroke={stroke}
                strokeWidth={1}
                strokeLinecap="round"
                strokeOpacity={0}
              >
                <animate attributeName="stroke-opacity" from="0" to="0.9" dur="0.18s" begin={appearBegin} fill="freeze" />
              </line>

              {/* candle body */}
              <rect
                x={c.x}
                y={bodyY}
                width={candleWidth}
                height={bodyH}
                fill={fill}
                stroke={stroke}
                strokeWidth={0.9}
                rx={2}
                ry={2}
                opacity={0}
              >
                {/* appear */}
                <animate attributeName="opacity" from="0" to="0.95" dur="0.32s" begin={appearBegin} fill="freeze" />
                {/* subtle bob */}
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 0 -8; 0 0"
                  dur={dur}
                  begin={bobBegin}
                  repeatCount="indefinite"
                />
                {/* light flicker after appear */}
                <animate attributeName="opacity" values="0.95;0.7;0.95" dur={dur} begin={bobBegin} repeatCount="indefinite" />
              </rect>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
