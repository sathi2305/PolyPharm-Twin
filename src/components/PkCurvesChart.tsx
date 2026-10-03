import React, { useState } from 'react';
import { Medicine, PkTimePoint } from '../types';
import { TrendingUp, Activity, BarChart2, ShieldAlert } from 'lucide-react';

interface PkCurvesChartProps {
  timeSeries: PkTimePoint[];
  activeDrugs: Medicine[];
  currentTimeHours: number;
  drugDosages?: Record<string, number>;
}

export const PkCurvesChart: React.FC<PkCurvesChartProps> = ({
  timeSeries,
  activeDrugs,
  currentTimeHours,
  drugDosages,
}) => {
  const [metricTab, setMetricTab] = useState<'concentration' | 'enzymes' | 'adr_risk'>('concentration');
  const [hoveredPoint, setHoveredPoint] = useState<PkTimePoint | null>(null);

  if (!timeSeries || timeSeries.length === 0) return null;

  // Chart Dimensions
  const svgWidth = 760;
  const svgHeight = 260;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxTime = timeSeries[timeSeries.length - 1].timeHours || 48;

  // Color Palette for curves
  const DRUG_COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#fbbf24', '#34d399'];
  const ENZ_COLORS: Record<string, string> = {
    CYP3A4: '#38bdf8',
    CYP2D6: '#c084fc',
    CYP2C9: '#fb7185',
    CYP2C19: '#fbbf24',
    CYP1A2: '#34d399',
    UGT1A1: '#a78bfa',
    'P-gp (ABCB1)': '#2dd4bf',
  };
  const ADR_COLORS: Record<string, string> = {
    major_bleeding: '#f43f5e',
    hepatotoxicity: '#fb923c',
    qtc_prolongation: '#e879f9',
    serotonin_syndrome: '#a855f7',
    acute_renal_injury: '#ef4444',
    rhabdomyolysis: '#dc2626',
    cns_depression: '#6366f1',
    hypotension: '#3b82f6',
  };

  // 1. Concentration Max
  let maxConc = 1.0;
  timeSeries.forEach((pt) => {
    Object.values(pt.concentrations).forEach((c) => {
      if (c > maxConc) maxConc = c;
    });
  });
  maxConc = Math.ceil(maxConc * 1.15 * 10) / 10;

  // 2. Enzyme Max (normally 100%, up to 200% with induction)
  const maxEnzyme = 200;

  // Coordinate conversion helpers
  const getX = (t: number) => padding.left + (t / maxTime) * graphWidth;
  const getY = (val: number, maxVal: number) =>
    padding.top + graphHeight - (Math.max(0, val) / maxVal) * graphHeight;

  // Current simulation scrubber vertical line coordinate
  const currentScrubberX = getX(currentTimeHours);

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      {/* Header and Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-tight">
            Dynamic Pharmacokinetic & Metabolic Progression Curves
          </h3>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
          <button
            onClick={() => setMetricTab('concentration')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              metricTab === 'concentration' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Concentration $C(t)$
          </button>
          <button
            onClick={() => setMetricTab('enzymes')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              metricTab === 'enzymes' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            CYP Enzyme Flux %
          </button>
          <button
            onClick={() => setMetricTab('adr_risk')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              metricTab === 'adr_risk' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            ADR Risk Probability
          </button>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + pct * graphHeight;
            let label = '';
            if (metricTab === 'concentration') {
              label = `${((1 - pct) * maxConc).toFixed(1)} mg/L`;
            } else if (metricTab === 'enzymes') {
              label = `${Math.round((1 - pct) * maxEnzyme)}%`;
            } else {
              label = `${((1 - pct) * 1.0).toFixed(2)}`;
            }

            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + graphWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize={8}
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Vertical Time Grid lines */}
          {[0, 6, 12, 18, 24, 30, 36, 42, 48].map((t) => {
            const x = getX(t);
            return (
              <g key={t}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + graphHeight}
                  stroke="#1e293b"
                  strokeDasharray="2 4"
                />
                <text
                  x={x}
                  y={padding.top + graphHeight + 14}
                  fill="#64748b"
                  fontSize={8}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {t}h
                </text>
              </g>
            );
          })}

          {/* Current Simulation Scrubber Line */}
          <line
            x1={currentScrubberX}
            y1={padding.top}
            x2={currentScrubberX}
            y2={padding.top + graphHeight}
            stroke="#06b6d4"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <circle cx={currentScrubberX} cy={padding.top - 4} r={4} fill="#06b6d4" />

          {/* 1. Concentration Curves */}
          {metricTab === 'concentration' &&
            activeDrugs.map((drug, dIdx) => {
              const color = DRUG_COLORS[dIdx % DRUG_COLORS.length];
              const points = timeSeries
                .map((pt) => {
                  const val = pt.concentrations[drug.id] || 0;
                  return `${getX(pt.timeHours)},${getY(val, maxConc)}`;
                })
                .join(' ');

              return (
                <g key={drug.id}>
                  <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </g>
              );
            })}

          {/* 2. Enzyme Activity Curves */}
          {metricTab === 'enzymes' &&
            Object.entries(ENZ_COLORS).map(([enzName, color]) => {
              const points = timeSeries
                .map((pt) => {
                  const val = pt.enzymeActivities[enzName] || 100;
                  return `${getX(pt.timeHours)},${getY(val, maxEnzyme)}`;
                })
                .join(' ');

              return (
                <polyline
                  key={enzName}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              );
            })}

          {/* 3. ADR Risk Probability Curves */}
          {metricTab === 'adr_risk' &&
            Object.entries(ADR_COLORS).map(([riskKey, color]) => {
              const points = timeSeries
                .map((pt) => {
                  const val = pt.adrRiskScores[riskKey] || 0;
                  return `${getX(pt.timeHours)},${getY(val, 1.0)}`;
                })
                .join(' ');

              return (
                <polyline
                  key={riskKey}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              );
            })}
        </svg>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
        {metricTab === 'concentration' &&
          activeDrugs.map((drug, i) => {
            const dose = drugDosages?.[drug.id];
            return (
              <div key={drug.id} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-1 rounded"
                  style={{ backgroundColor: DRUG_COLORS[i % DRUG_COLORS.length] }}
                />
                <span className="text-slate-300 font-semibold">{drug.genericName}</span>
                {dose !== undefined && (
                  <span className="text-cyan-400 font-mono text-[10px]">[{dose} mg]</span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">
                  (Cmax: {(timeSeries.reduce((acc, p) => Math.max(acc, p.concentrations[drug.id] || 0), 0)).toFixed(2)} mg/L)
                </span>
              </div>
            );
          })}

        {metricTab === 'enzymes' &&
          Object.entries(ENZ_COLORS).map(([enz, color]) => (
            <div key={enz} className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded" style={{ backgroundColor: color }} />
              <span className="text-slate-300">{enz}</span>
            </div>
          ))}

        {metricTab === 'adr_risk' &&
          Object.entries(ADR_COLORS).map(([risk, color]) => (
            <div key={risk} className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded" style={{ backgroundColor: color }} />
              <span className="text-slate-300 capitalize">{risk.replace('_', ' ')}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
