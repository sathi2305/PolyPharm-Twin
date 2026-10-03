import React, { useState, useMemo } from 'react';
import { Medicine, PatientContext, PkTimePoint, EnzymeProfile, AdrPrediction, RegimenBaseline } from '../types';
import { getTranslation } from '../data/translations';
import {
  GitCompare,
  BookmarkCheck,
  RotateCcw,
  ArrowRightLeft,
  Trash2,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Activity,
  Plus,
  X,
  Sparkles,
  Columns,
  CheckCircle2,
} from 'lucide-react';

interface RegimenComparisonPanelProps {
  baseline: RegimenBaseline | null;
  activeDrugs: Medicine[];
  patientContext: PatientContext;
  currentTimeHours: number;
  durationHours: number;
  timeSeries: PkTimePoint[];
  liveEnzymes: EnzymeProfile[];
  predictions: AdrPrediction[];
  onSaveBaseline: () => void;
  onClearBaseline: () => void;
  onRestoreBaseline: () => void;
  onSwapRegimens: () => void;
  onToggleActiveDrug: (drugId: string) => void;
  onLoadPreset: (drugIds: string[]) => void;
  medicines: Medicine[];
  langCode?: string;
}

export const RegimenComparisonPanel: React.FC<RegimenComparisonPanelProps> = ({
  baseline,
  activeDrugs,
  patientContext,
  currentTimeHours,
  durationHours,
  timeSeries,
  liveEnzymes,
  predictions,
  onSaveBaseline,
  onClearBaseline,
  onRestoreBaseline,
  onSwapRegimens,
  onToggleActiveDrug,
  onLoadPreset,
  medicines,
  langCode = 'en',
}) => {
  const t = getTranslation(langCode);
  const [metricTab, setMetricTab] = useState<'concentration' | 'enzymes' | 'adr_risk'>('concentration');
  const [viewMode, setViewMode] = useState<'side_by_side' | 'overlay'>('side_by_side');
  const [selectedAddDrugId, setSelectedAddDrugId] = useState<string>('');

  // Dimensions for charts
  const svgWidth = 520;
  const svgHeight = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;
  const maxTime = durationHours || 48;

  // Color Palettes
  const DRUG_COLORS_A = ['#f59e0b', '#fb923c', '#fbbf24', '#f87171', '#e879f9'];
  const DRUG_COLORS_B = ['#06b6d4', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
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

  // Compute maximums across both series for consistent scaling
  const { maxConc, maxEnzyme } = useMemo(() => {
    let conc = 1.0;
    // Series A
    if (baseline?.timeSeries) {
      baseline.timeSeries.forEach((pt) => {
        Object.values(pt.concentrations).forEach((c) => {
          if (c > conc) conc = c;
        });
      });
    }
    // Series B
    timeSeries.forEach((pt) => {
      Object.values(pt.concentrations).forEach((c) => {
        if (c > conc) conc = c;
      });
    });
    return {
      maxConc: Math.ceil(conc * 1.2 * 10) / 10,
      maxEnzyme: 200,
    };
  }, [baseline, timeSeries]);

  // Coordinate conversion helpers
  const getX = (time: number) => padding.left + (time / maxTime) * graphWidth;
  const getY = (val: number, maxVal: number) =>
    padding.top + graphHeight - (Math.max(0, val) / maxVal) * graphHeight;
  const currentScrubberX = getX(currentTimeHours);

  // Delta calculations between Baseline (A) and Modified (B)
  const deltas = useMemo(() => {
    if (!baseline) return null;

    // Peak concentrations
    const peakA: Record<string, number> = {};
    baseline.timeSeries.forEach((pt) => {
      Object.entries(pt.concentrations).forEach(([id, val]) => {
        peakA[id] = Math.max(peakA[id] || 0, val);
      });
    });

    const peakB: Record<string, number> = {};
    timeSeries.forEach((pt) => {
      Object.entries(pt.concentrations).forEach(([id, val]) => {
        peakB[id] = Math.max(peakB[id] || 0, val);
      });
    });

    // ADR Max Risk comparison
    const maxAdrA = baseline.predictions.reduce(
      (acc, p) => (p.probability > acc.probability ? p : acc),
      baseline.predictions[0] || { label: 'None', probability: 0 }
    );
    const maxAdrB = predictions.reduce(
      (acc, p) => (p.probability > acc.probability ? p : acc),
      predictions[0] || { label: 'None', probability: 0 }
    );

    const adrDeltaPct = Math.round((maxAdrB.probability - maxAdrA.probability) * 100);

    // CYP lowest activity comparison
    const lowestEnzA = baseline.liveEnzymes.reduce(
      (acc, e) => (e.currentActivity < acc.currentActivity ? e : acc),
      baseline.liveEnzymes[0] || { name: 'CYP3A4', currentActivity: 100 }
    );
    const lowestEnzB = liveEnzymes.reduce(
      (acc, e) => (e.currentActivity < acc.currentActivity ? e : acc),
      liveEnzymes[0] || { name: 'CYP3A4', currentActivity: 100 }
    );
    const enzymeRecovery = Math.round(lowestEnzB.currentActivity - lowestEnzA.currentActivity);

    return {
      peakA,
      peakB,
      maxAdrA,
      maxAdrB,
      adrDeltaPct,
      lowestEnzA,
      lowestEnzB,
      enzymeRecovery,
      drugCountA: baseline.drugs.length,
      drugCountB: activeDrugs.length,
    };
  }, [baseline, timeSeries, liveEnzymes, predictions, activeDrugs]);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{t.wb_compare_toggle}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Side-by-Side Dual Twin
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Save a baseline multi-drug state (A) and observe real-time pharmacokinetic and risk deltas against an edited regimen (B).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!baseline ? (
            <button
              onClick={onSaveBaseline}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 cursor-pointer transition-all active:scale-95"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{t.wb_save_baseline}</span>
            </button>
          ) : (
            <>
              <button
                onClick={onSaveBaseline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-600/50 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                title="Update baseline with current regimen"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Update Baseline (A)</span>
              </button>

              <button
                onClick={onSwapRegimens}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                title="Swap Regimen A and B"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.wb_swap_regimens}</span>
              </button>

              <button
                onClick={onRestoreBaseline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                title="Replace current active drugs with baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.wb_restore_baseline}</span>
              </button>

              <button
                onClick={onClearBaseline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 text-xs cursor-pointer transition-colors"
                title="Clear saved baseline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.wb_clear_baseline}</span>
              </button>
            </>
          )}

          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setMetricTab('concentration')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                metricTab === 'concentration' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.pk_concentration}
            </button>
            <button
              onClick={() => setMetricTab('enzymes')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                metricTab === 'enzymes' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.pk_enzymes}
            </button>
            <button
              onClick={() => setMetricTab('adr_risk')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                metricTab === 'adr_risk' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.pk_adr_risk}
            </button>
          </div>
        </div>
      </div>

      {/* Baseline Status / Empty Prompt */}
      {!baseline ? (
        <div className="p-8 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-dashed border-amber-600/40 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-200">No Baseline Regimen Saved Yet</h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Click <strong>"{t.wb_save_baseline}"</strong> above to freeze your current {activeDrugs.length} active drugs as reference state <strong>Regimen A</strong>. You can then add, remove, or modify drugs in <strong>Regimen B</strong> to see side-by-side time-series comparison curves and safety deltas!
          </p>
          <button
            onClick={onSaveBaseline}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/50 cursor-pointer transition-all"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Save Current Drugs as Baseline A ({activeDrugs.map((d) => d.genericName).join(', ') || 'None'})</span>
          </button>
        </div>
      ) : (
        <>
          {/* Comparative Delta Cards */}
          {deltas && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: ADR Risk Delta */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  deltas.adrDeltaPct < 0
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : deltas.adrDeltaPct > 0
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    {t.wb_adr_reduction}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {deltas.adrDeltaPct < 0 ? (
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                    ) : deltas.adrDeltaPct > 0 ? (
                      <TrendingUp className="w-4 h-4 text-rose-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-lg font-extrabold tracking-tight font-mono">
                      {deltas.adrDeltaPct > 0 ? `+${deltas.adrDeltaPct}%` : `${deltas.adrDeltaPct}%`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                    {deltas.maxAdrA.label}: {(deltas.maxAdrA.probability * 100).toFixed(0)}% → {(deltas.maxAdrB.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {deltas.adrDeltaPct < 0 ? 'RISK REDUCED' : deltas.adrDeltaPct > 0 ? 'RISK INCREASED' : 'EQUAL RISK'}
                  </span>
                </div>
              </div>

              {/* Card 2: CYP Activity Recovery */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  deltas.enzymeRecovery > 0
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                    : deltas.enzymeRecovery < 0
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    {t.wb_cyp_recovery}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {deltas.enzymeRecovery > 0 ? (
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-lg font-extrabold tracking-tight font-mono">
                      {deltas.enzymeRecovery > 0 ? `+${deltas.enzymeRecovery}%` : `${deltas.enzymeRecovery}%`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {deltas.lowestEnzA.name}: {deltas.lowestEnzA.currentActivity}% → {deltas.lowestEnzB.currentActivity}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {deltas.enzymeRecovery > 0 ? 'FLUX RECOVERED' : 'UNALTERED'}
                  </span>
                </div>
              </div>

              {/* Card 3: Regimen Scale Difference */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    Co-Administered Compounds
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-bold font-mono text-amber-400">
                      A: {deltas.drugCountA}
                    </span>
                    <span className="text-slate-500 font-mono">vs</span>
                    <span className="text-base font-bold font-mono text-cyan-400">
                      B: {deltas.drugCountB}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {deltas.drugCountB < deltas.drugCountA
                      ? `${deltas.drugCountA - deltas.drugCountB} fewer drugs (Deprescribing)`
                      : deltas.drugCountB > deltas.drugCountA
                      ? `+${deltas.drugCountB - deltas.drugCountA} added compounds`
                      : 'Equal number of compounds'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    Δ: {deltas.drugCountB - deltas.drugCountA}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Time-Series Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* COLUMN 1: Regimen A (Baseline) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-600/30 shadow-inner space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/20" />
                  <h4 className="font-bold text-amber-300 text-xs tracking-tight uppercase font-mono">
                    {t.wb_baseline_badge}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">({baseline.drugs.length} drugs)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Saved: {new Date(baseline.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Baseline Drugs Pills */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {baseline.drugs.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic">No drugs in baseline</span>
                ) : (
                  baseline.drugs.map((d, i) => (
                    <span
                      key={d.id}
                      className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DRUG_COLORS_A[i % DRUG_COLORS_A.length] }} />
                      <span>{d.genericName}</span>
                    </span>
                  ))
                )}
              </div>

              {/* SVG Chart for A */}
              <div className="relative overflow-x-auto">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-52 select-none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = padding.top + pct * graphHeight;
                    let label = '';
                    if (metricTab === 'concentration') label = `${((1 - pct) * maxConc).toFixed(1)}`;
                    else if (metricTab === 'enzymes') label = `${Math.round((1 - pct) * maxEnzyme)}%`;
                    else label = `${((1 - pct) * 1.0).toFixed(2)}`;

                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#1e293b" strokeDasharray="2 3" />
                        <text x={padding.left - 5} y={y + 3} fill="#64748b" fontSize={7} fontFamily="monospace" textAnchor="end">
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Time Grid */}
                  {[0, 12, 24, 36, 48].map((tm) => (
                    <g key={tm}>
                      <line x1={getX(tm)} y1={padding.top} x2={getX(tm)} y2={padding.top + graphHeight} stroke="#1e293b" strokeDasharray="2 3" />
                      <text x={getX(tm)} y={padding.top + graphHeight + 12} fill="#64748b" fontSize={7} fontFamily="monospace" textAnchor="middle">
                        {tm}h
                      </text>
                    </g>
                  ))}

                  {/* Scrubber Line */}
                  <line x1={currentScrubberX} y1={padding.top} x2={currentScrubberX} y2={padding.top + graphHeight} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 2" />

                  {/* 1. Concentration Curves A */}
                  {metricTab === 'concentration' &&
                    baseline.drugs.map((drug, dIdx) => {
                      const color = DRUG_COLORS_A[dIdx % DRUG_COLORS_A.length];
                      const points = baseline.timeSeries
                        .map((pt) => `${getX(pt.timeHours)},${getY(pt.concentrations[drug.id] || 0, maxConc)}`)
                        .join(' ');
                      return (
                        <polyline key={drug.id} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" points={points} />
                      );
                    })}

                  {/* 2. Enzyme Curves A */}
                  {metricTab === 'enzymes' &&
                    Object.entries(ENZ_COLORS).map(([enzName, color]) => {
                      const points = baseline.timeSeries
                        .map((pt) => `${getX(pt.timeHours)},${getY(pt.enzymeActivities[enzName] || 100, maxEnzyme)}`)
                        .join(' ');
                      return (
                        <polyline key={enzName} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" points={points} />
                      );
                    })}

                  {/* 3. ADR Risk Curves A */}
                  {metricTab === 'adr_risk' &&
                    Object.entries(ADR_COLORS).map(([riskKey, color]) => {
                      const points = baseline.timeSeries
                        .map((pt) => `${getX(pt.timeHours)},${getY(pt.adrRiskScores[riskKey] || 0, 1.0)}`)
                        .join(' ');
                      return (
                        <polyline key={riskKey} fill="none" stroke={color} strokeWidth={2.0} strokeLinecap="round" strokeLinejoin="round" points={points} />
                      );
                    })}
                </svg>
              </div>

              {/* Legend Summary A */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                {metricTab === 'concentration' &&
                  baseline.drugs.map((d, i) => (
                    <span key={d.id} className="flex items-center gap-1">
                      <span className="w-2 h-1 rounded" style={{ backgroundColor: DRUG_COLORS_A[i % DRUG_COLORS_A.length] }} />
                      <span className="text-slate-300">{d.genericName}</span>
                      <span className="text-[10px] text-slate-500">
                        ({(baseline.timeSeries.reduce((acc, p) => Math.max(acc, p.concentrations[d.id] || 0), 0)).toFixed(2)} mg/L)
                      </span>
                    </span>
                  ))}
              </div>
            </div>

            {/* COLUMN 2: Regimen B (Modified / Active) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-inner space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/20" />
                  <h4 className="font-bold text-cyan-300 text-xs tracking-tight uppercase font-mono">
                    {t.wb_modified_badge}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">({activeDrugs.length} drugs)</span>
                </div>

                {/* Quick Add for B */}
                <select
                  value={selectedAddDrugId}
                  onChange={(e) => {
                    if (e.target.value) {
                      onToggleActiveDrug(e.target.value);
                      setSelectedAddDrugId('');
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">+ Add to Regimen B...</option>
                  {medicines
                    .filter((m) => !activeDrugs.some((d) => d.id === m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.genericName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Modified Drugs Pills with quick delete */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {activeDrugs.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic">No drugs in Regimen B. Add medicines above.</span>
                ) : (
                  activeDrugs.map((d, i) => (
                    <span
                      key={d.id}
                      className="px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DRUG_COLORS_B[i % DRUG_COLORS_B.length] }} />
                      <span>{d.genericName}</span>
                      <button
                        onClick={() => onToggleActiveDrug(d.id)}
                        className="hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                        title="Remove drug from Regimen B"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* SVG Chart for B */}
              <div className="relative overflow-x-auto">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-52 select-none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = padding.top + pct * graphHeight;
                    let label = '';
                    if (metricTab === 'concentration') label = `${((1 - pct) * maxConc).toFixed(1)}`;
                    else if (metricTab === 'enzymes') label = `${Math.round((1 - pct) * maxEnzyme)}%`;
                    else label = `${((1 - pct) * 1.0).toFixed(2)}`;

                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#1e293b" strokeDasharray="2 3" />
                        <text x={padding.left - 5} y={y + 3} fill="#64748b" fontSize={7} fontFamily="monospace" textAnchor="end">
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Time Grid */}
                  {[0, 12, 24, 36, 48].map((tm) => (
                    <g key={tm}>
                      <line x1={getX(tm)} y1={padding.top} x2={getX(tm)} y2={padding.top + graphHeight} stroke="#1e293b" strokeDasharray="2 3" />
                      <text x={getX(tm)} y={padding.top + graphHeight + 12} fill="#64748b" fontSize={7} fontFamily="monospace" textAnchor="middle">
                        {tm}h
                      </text>
                    </g>
                  ))}

                  {/* Scrubber Line */}
                  <line x1={currentScrubberX} y1={padding.top} x2={currentScrubberX} y2={padding.top + graphHeight} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3 2" />

                  {/* 1. Concentration Curves B */}
                  {metricTab === 'concentration' &&
                    activeDrugs.map((drug, dIdx) => {
                      const color = DRUG_COLORS_B[dIdx % DRUG_COLORS_B.length];
                      const points = timeSeries
                        .map((pt) => `${getX(pt.timeHours)},${getY(pt.concentrations[drug.id] || 0, maxConc)}`)
                        .join(' ');
                      return (
                        <polyline key={drug.id} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" points={points} />
                      );
                    })}

                  {/* 2. Enzyme Curves B */}
                  {metricTab === 'enzymes' &&
                    Object.entries(ENZ_COLORS).map(([enzName, color]) => {
                      const points = timeSeries
                        .map((pt) => `${getX(pt.timeHours)},${getY(pt.enzymeActivities[enzName] || 100, maxEnzyme)}`)
                        .join(' ');
                      return (
                        <polyline key={enzName} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" points={points} />
                      );
                    })}

                  {/* 3. ADR Risk Curves B */}
                  {metricTab === 'adr_risk' &&
                    Object.entries(ADR_COLORS).map(([riskKey, color]) => {
                      const points = timeSeries
                        .map((pt) => `${getX(pt.timeHours)},${getY(pt.adrRiskScores[riskKey] || 0, 1.0)}`)
                        .join(' ');
                      return (
                        <polyline key={riskKey} fill="none" stroke={color} strokeWidth={2.0} strokeLinecap="round" strokeLinejoin="round" points={points} />
                      );
                    })}
                </svg>
              </div>

              {/* Legend Summary B */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                {metricTab === 'concentration' &&
                  activeDrugs.map((d, i) => (
                    <span key={d.id} className="flex items-center gap-1">
                      <span className="w-2 h-1 rounded" style={{ backgroundColor: DRUG_COLORS_B[i % DRUG_COLORS_B.length] }} />
                      <span className="text-slate-300">{d.genericName}</span>
                      <span className="text-[10px] text-slate-500">
                        ({(timeSeries.reduce((acc, p) => Math.max(acc, p.concentrations[d.id] || 0), 0)).toFixed(2)} mg/L)
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
