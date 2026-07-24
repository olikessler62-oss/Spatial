"use client";

import { useEffect } from "react";

type MarkerSpec = {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly opacity: number;
};

type CrosshairSpec = {
  readonly x: number;
  readonly y: number;
  readonly span: number;
  readonly opacity: number;
};

const MARKERS: readonly MarkerSpec[] = [
  { x: 120, y: 90, r: 1.8, opacity: 0.55 },
  { x: 280, y: 160, r: 1.4, opacity: 0.4 },
  { x: 460, y: 70, r: 2, opacity: 0.5 },
  { x: 640, y: 200, r: 1.5, opacity: 0.35 },
  { x: 820, y: 110, r: 1.7, opacity: 0.45 },
  { x: 980, y: 180, r: 1.3, opacity: 0.35 },
  { x: 160, y: 320, r: 1.6, opacity: 0.4 },
  { x: 360, y: 380, r: 2.1, opacity: 0.5 },
  { x: 560, y: 290, r: 1.4, opacity: 0.35 },
  { x: 760, y: 350, r: 1.8, opacity: 0.45 },
  { x: 1040, y: 300, r: 1.5, opacity: 0.35 },
  { x: 220, y: 520, r: 1.7, opacity: 0.4 },
  { x: 480, y: 560, r: 2, opacity: 0.45 },
  { x: 700, y: 480, r: 1.4, opacity: 0.35 },
  { x: 900, y: 540, r: 1.8, opacity: 0.4 },
  { x: 140, y: 720, r: 1.5, opacity: 0.35 },
  { x: 420, y: 780, r: 1.9, opacity: 0.45 },
  { x: 680, y: 700, r: 1.4, opacity: 0.35 },
  { x: 920, y: 760, r: 1.7, opacity: 0.4 },
  { x: 1100, y: 640, r: 1.5, opacity: 0.35 },
];

const CROSSHAIRS: readonly CrosshairSpec[] = [
  { x: 300, y: 180, span: 48, opacity: 0.28 },
  { x: 780, y: 260, span: 56, opacity: 0.32 },
  { x: 520, y: 480, span: 42, opacity: 0.24 },
  { x: 960, y: 560, span: 50, opacity: 0.3 },
  { x: 200, y: 640, span: 40, opacity: 0.22 },
];

/** Übersicht 1 theme: research backdrop + muted blue-cyan (gray-softened). */
export function Overview1Theme() {
  useEffect(() => {
    document.documentElement.classList.add("overview1-theme");
    return () => {
      document.documentElement.classList.remove("overview1-theme");
    };
  }, []);

  return (
    <div
      className="overview1-page-fx"
      aria-hidden
    >
      <div className="overview1-page-fx__glow" />
      <div className="overview1-page-fx__glow overview1-page-fx__glow--secondary" />
      <div className="overview1-page-fx__grid" />
      <div className="overview1-page-fx__scan" />
      <svg
        className="overview1-page-fx__lab"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient
            id="overview1-lab-axis"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor="rgba(45,212,191,0)"
            />
            <stop
              offset="50%"
              stopColor="rgba(94,234,212,0.55)"
            />
            <stop
              offset="100%"
              stopColor="rgba(45,212,191,0)"
            />
          </linearGradient>
        </defs>

        <line
          x1="60"
          y1="840"
          x2="1140"
          y2="840"
          stroke="url(#overview1-lab-axis)"
          strokeWidth="1"
        />
        <line
          x1="60"
          y1="60"
          x2="60"
          y2="840"
          stroke="rgba(45,212,191,0.28)"
          strokeWidth="1"
        />

        {Array.from({ length: 18 }, (_, i) => {
          const x = 60 + (i + 1) * 60;
          return (
            <line
              key={`tick-x-${i}`}
              x1={x}
              y1="840"
              x2={x}
              y2="848"
              stroke="rgba(94,234,212,0.35)"
              strokeWidth="1"
            />
          );
        })}

        {Array.from({ length: 12 }, (_, i) => {
          const y = 840 - (i + 1) * 60;
          return (
            <line
              key={`tick-y-${i}`}
              x1="52"
              y1={y}
              x2="60"
              y2={y}
              stroke="rgba(94,234,212,0.35)"
              strokeWidth="1"
            />
          );
        })}

        <polyline
          points="120,720 220,640 320,680 420,520 520,560 620,400 720,460 820,300 920,360 1020,240"
          fill="none"
          stroke="rgba(45,212,191,0.22)"
          strokeWidth="1.25"
          strokeDasharray="4 6"
        />

        {CROSSHAIRS.map((mark, index) => {
          const half = mark.span / 2;
          return (
            <g
              key={`cross-${index}`}
              opacity={mark.opacity}
              className="overview1-page-fx__crosshair"
              style={{ animationDelay: `${(index % 5) * 0.8}s` }}
            >
              <line
                x1={mark.x - half}
                y1={mark.y}
                x2={mark.x + half}
                y2={mark.y}
                stroke="rgba(94,234,212,0.7)"
                strokeWidth="0.8"
              />
              <line
                x1={mark.x}
                y1={mark.y - half}
                x2={mark.x}
                y2={mark.y + half}
                stroke="rgba(94,234,212,0.7)"
                strokeWidth="0.8"
              />
              <circle
                cx={mark.x}
                cy={mark.y}
                r={3.2}
                fill="none"
                stroke="rgba(45,212,191,0.55)"
                strokeWidth="0.9"
              />
            </g>
          );
        })}

        {MARKERS.map((marker, index) => (
          <circle
            key={`marker-${index}`}
            cx={marker.x}
            cy={marker.y}
            r={marker.r}
            fill="rgba(153,246,228,0.85)"
            opacity={marker.opacity}
            className="overview1-page-fx__marker"
            style={{ animationDelay: `${(index % 7) * 0.45}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
