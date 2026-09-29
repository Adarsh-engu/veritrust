"use client";

import React from "react";

export const CleanRateChart: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-lg border border-outline-dim p-7 md:p-8 shadow-xs mb-14">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-surface-dim mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-[11px] font-semibold text-on-surface uppercase tracking-wider">
            First-pass clean rate
          </h2>
        </div>
      </div>

      {/* Chart Visual Container */}
      <div className="w-full relative">
        <svg
          className="w-full h-60 overflow-visible"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 1000 240"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fd6b36" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fd6b36" stopOpacity="0.0" />
            </linearGradient>
            <pattern height="40" id="gridLines" patternUnits="userSpaceOnUse" width="1000">
              <line
                stroke="#f4ede2"
                strokeDasharray="2 3"
                strokeWidth="1"
                x1="0"
                x2="1000"
                y1="40"
                y2="40"
              />
            </pattern>
          </defs>

          {/* Horizontal Background Grid */}
          <rect fill="url(#gridLines)" height="200" width="1000" />
          <line stroke="#e0d9ce" strokeWidth="1" x1="0" x2="1000" y1="200" y2="200" />

          {/* Area Gradient Fill under Curve */}
          <path
            d="M 40 56 
               C 120 62, 160 88, 220 92 
               C 270 96, 320 118, 380 126 
               C 410 130, 440 68, 480 48 
               C 540 24, 600 46, 660 52 
               C 720 58, 770 42, 820 40 
               C 880 38, 930 35, 960 38 
               L 960 200 L 40 200 Z"
            fill="url(#curveGradient)"
          />

          {/* Main Trend Line */}
          <path
            d="M 40 56 
               C 120 62, 160 88, 220 92 
               C 270 96, 320 118, 380 126 
               C 410 130, 440 68, 480 48 
               C 540 24, 600 46, 660 52 
               C 720 58, 770 42, 820 40 
               C 880 38, 930 35, 960 38"
            fill="none"
            stroke="#1e1b15"
            strokeLinecap="round"
            strokeWidth="2"
          />

          {/* Plotted Reference Points */}
          <circle cx="40" cy="56" fill="#ffffff" r="3.5" stroke="#1e1b15" strokeWidth="1.5" />
          <circle cx="220" cy="92" fill="#ffffff" r="3.5" stroke="#1e1b15" strokeWidth="1.5" />
          <circle cx="380" cy="126" fill="#ffffff" r="3.5" stroke="#ba1a1a" strokeWidth="1.5" />
          <circle cx="480" cy="48" fill="#ffffff" r="3.5" stroke="#1e1b15" strokeWidth="1.5" />
          <circle cx="660" cy="52" fill="#ffffff" r="3.5" stroke="#1e1b15" strokeWidth="1.5" />
          <circle cx="820" cy="40" fill="#ffffff" r="3.5" stroke="#1e1b15" strokeWidth="1.5" />

          {/* Live Current Head Dot with Pulse effect */}
          <g>
            <circle
              className="animate-ping"
              cx="960"
              cy="38"
              fill="#ac3400"
              fillOpacity="0.2"
              r="6"
              style={{ transformOrigin: "960px 38px" }}
            />
            <circle cx="960" cy="38" fill="#ac3400" r="4" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Y-Axis Labels Overlay */}
        <div className="absolute left-0 top-0 h-[200px] -translate-x-1 sm:-translate-x-3 pointer-events-none flex flex-col justify-between font-mono text-[10px] text-outline">
          <span>100%</span>
          <span>80%</span>
          <span>60%</span>
          <span>40%</span>
          <span>20%</span>
          <span>0%</span>
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="w-full flex items-center justify-between pt-3 font-mono text-[11px] text-on-surface-variant px-1 border-t border-surface-dim">
        <span>Run #8890</span>
        <span className="hidden sm:inline">Run #8930</span>
        <span>Run #8970</span>
        <span className="hidden sm:inline">Run #9010</span>
        <span className="font-semibold text-accent-ochre">Run #9042</span>
      </div>
    </div>
  );
};
