import React from 'react';

export default function AnimatedLineGraph() {
  return (
    <svg
      viewBox="0 0 1600 260"
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="heroLineGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="10%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
          <stop offset="90%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>

        <filter id="heroLineGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.3" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              0 0 0 0 0
              0 1 0 0 0
              0 0 0.7 0 0
              0 0 0 0.9 0
            "
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* layered line for more realistic trading motion + subtle animation */}
      <g filter="url(#heroLineGlow)">
        {/* subtle, wide glow */}
        <path
          d="M0 212 L60 168 L120 178 L180 148 L240 165 L300 158 L360 132 L420 195 L480 168 L540 178 L600 152 L660 168 L720 160 L780 170 L840 188 L880 110 L920 222 L980 162 L1040 182 L1100 144 L1160 208 L1220 132 L1280 218 L1340 148 L1400 200 L1460 180 L1520 230 L1600 210"
          fill="none"
          stroke="url(#heroLineGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.12"
        >
          <animate attributeName="stroke-dashoffset" from="2600" to="0" dur="28s" repeatCount="indefinite" />
        </path>

        {/* main visible line — slow draw + gentle bob to feel alive */}
        <path
          d="M0 210 L70 165 L140 175 L210 145 L280 160 L350 155 L420 130 L490 190 L560 170 L630 180 L700 150 L770 165 L840 185 L880 110 L920 220 L990 160 L1060 180 L1130 140 L1200 210 L1270 130 L1340 215 L1410 150 L1480 235 L1600 210"
          fill="none"
          stroke="url(#heroLineGradient)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-line-dash"
          strokeDasharray="2200"
          strokeDashoffset="2200"
        >
          {/* animate the slow drawing of the line */}
          <animate attributeName="stroke-dashoffset" from="2200" to="0" dur="20s" repeatCount="indefinite" />
          {/* tiny vertical bob to simulate live movement */}
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -6; 0 0" dur="6s" repeatCount="indefinite" />
        </path>

        {/* thin jitter overlay with slightly different timing for micro-fluctuations */}
        <path
          d="M0 210 L60 170 L130 176 L195 150 L265 162 L330 157 L395 133 L460 188 L530 169 L610 181 L680 153 L750 167 L820 186 L860 115 L900 218 L970 158 L1035 179 L1105 142 L1175 210 L1235 134 L1295 220 L1355 152 L1415 201 L1475 176 L1535 232 L1600 208"
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.18"
        >
          <animate attributeName="stroke-dashoffset" from="2100" to="-400" dur="12s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 3; 0 0" dur="3.6s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );

}
