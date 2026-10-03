import React, { useState } from 'react';
import { EnzymeProfile, Medicine } from '../types';
import { Radio, AlertOctagon, CheckCircle2, TrendingUp, TrendingDown, Info, ShieldAlert, Sparkles } from 'lucide-react';

interface EnzymeMonitoringPanelProps {
  enzymes: EnzymeProfile[];
  activeDrugs: Medicine[];
  currentTimeHours: number;
  isPlaying: boolean;
}

export const EnzymeMonitoringPanel: React.FC<EnzymeMonitoringPanelProps> = ({
  enzymes,
  activeDrugs,
  currentTimeHours,
  isPlaying,
}) => {
  const [selectedEnzyme, setSelectedEnzyme] = useState<EnzymeProfile | null>(null);

  // Status badge styling helper
  const getStatusBadge = (status: EnzymeProfile['interactionStatus']) => {
    switch (status) {
      case 'CRITICAL_INHIBITION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertOctagon className="w-3 h-3 text-rose-400" /> CRITICAL INHIBITION
          </span>
        );
      case 'MODERATE_INHIBITION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <TrendingDown className="w-3 h-3 text-amber-400" /> MODERATE INHIBITION
          </span>
        );
      case 'MILD_INHIBITION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <TrendingDown className="w-3 h-3 text-yellow-400" /> MILD INHIBITION
          </span>
        );
      case 'INDUCED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <TrendingUp className="w-3 h-3 text-purple-400" /> INDUCED (EXPRESSION +)
          </span>
        );
      case 'OPTIMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> OPTIMAL FLUX
          </span>
        );
    }
  };

  // SVG Circular Gauge calculation
  const renderCircularGauge = (activity: number, status: EnzymeProfile['interactionStatus']) => {
    const size = 110;
    const strokeWidth = 9;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Activity can be 0% to 200% (induction)
    const normalizedActivity = Math.min(200, Math.max(0, activity));
    const strokeDashoffset = circumference - (Math.min(100, normalizedActivity) / 100) * circumference;

    let strokeColor = '#10b981'; // emerald
    if (activity < 30) strokeColor = '#f43f5e'; // rose
    else if (activity < 65) strokeColor = '#f59e0b'; // amber
    else if (activity < 85) strokeColor = '#eab308'; // yellow
    else if (activity > 120) strokeColor = '#a855f7'; // purple

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800"
            fill="transparent"
          />
          {/* Animated active stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            fill="transparent"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            {activity}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Activity
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Real-Time Cytochrome P450 & Phase II Enzyme Flux
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              SIMULATED KINETIC ODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Continuously monitors metabolic bottlenecking, competitive inhibition ($K_i$), and transcriptional PXR/CAR induction
            across active polypharmacy combinations.
          </p>
        </div>

        {/* Live Simulation Clock Badge */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Simulation Time</span>
            <span className="text-lg font-mono font-bold text-cyan-300">
              {currentTimeHours.toFixed(1)}h / 48.0h
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-xs font-mono font-semibold text-slate-200">
              {isPlaying ? 'ACTIVE FLUX' : 'PAUSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Enzyme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {enzymes.map((enz) => {
          const isAffected = enz.affectedDrugs.length > 0;
          return (
            <div
              key={enz.id}
              onClick={() => setSelectedEnzyme(enz)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                enz.interactionStatus === 'CRITICAL_INHIBITION'
                  ? 'bg-rose-950/20 border-rose-600/50 hover:border-rose-500 shadow-lg shadow-rose-950/20'
                  : enz.interactionStatus === 'MODERATE_INHIBITION'
                  ? 'bg-amber-950/20 border-amber-600/50 hover:border-amber-500 shadow-lg shadow-amber-950/20'
                  : enz.interactionStatus === 'INDUCED'
                  ? 'bg-purple-950/20 border-purple-600/50 hover:border-purple-500'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Name and Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold font-mono text-white tracking-wide">
                      {enz.name}
                    </span>
                    {isAffected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="Modulated by active regimen" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                    {enz.family}
                  </span>
                </div>
                {getStatusBadge(enz.interactionStatus)}
              </div>

              {/* Gauge and Kinetic Indicators */}
              <div className="flex items-center justify-between my-2">
                {renderCircularGauge(enz.currentActivity, enz.interactionStatus)}

                <div className="flex flex-col gap-1.5 text-right font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Baseline</span>
                    <span className="text-slate-200 font-semibold">{enz.baselineActivity}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block">Inhibition</span>
                    <span className="text-rose-300 font-bold">{enz.inhibitionPercent}%</span>
                  </div>
                  {enz.inductionPercent > 0 && (
                    <div>
                      <span className="text-[10px] text-purple-400 block">Induction</span>
                      <span className="text-purple-300 font-bold">+{enz.inductionPercent}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Affected Drugs Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Modulating Regimen:</span>
                  <span className="font-semibold text-slate-300 font-mono">
                    {enz.affectedDrugs.length} drugs
                  </span>
                </div>
                {enz.affectedDrugs.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {enz.affectedDrugs.slice(0, 3).map((dName, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] border border-slate-700 truncate max-w-[110px]"
                      >
                        {dName}
                      </span>
                    ))}
                    {enz.affectedDrugs.length > 3 && (
                      <span className="px-1 py-0.5 text-[9px] text-slate-400 font-mono">
                        +{enz.affectedDrugs.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No direct substrate/inhibitor active</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enzyme Detail Drawer / Modal when clicked */}
      {selectedEnzyme && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl relative">
          <button
            onClick={() => setSelectedEnzyme(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 text-xs font-mono cursor-pointer"
          >
            ✕ Close
          </button>

          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold text-white font-mono">{selectedEnzyme.name} Pharmacokinetic Profile</h3>
            {getStatusBadge(selectedEnzyme.interactionStatus)}
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Evidence: {selectedEnzyme.evidenceLevel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Substrates in Active Regimen:</span>
              <ul className="space-y-1 text-slate-300">
                {activeDrugs
                  .filter((d) => d.enzymes.some((e) => e.name === selectedEnzyme.name && e.role === 'substrate'))
                  .map((d) => (
                    <li key={d.id} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="font-semibold text-cyan-200">{d.genericName}</span>
                      <span className="text-[10px] text-slate-400">({d.drugClass.split('/')[1] || d.drugClass})</span>
                    </li>
                  ))}
                {activeDrugs.filter((d) => d.enzymes.some((e) => e.name === selectedEnzyme.name && e.role === 'substrate')).length === 0 && (
                  <span className="text-slate-500 italic">No substrate drugs selected.</span>
                )}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Inhibitors in Active Regimen:</span>
              <ul className="space-y-1 text-slate-300">
                {activeDrugs
                  .filter((d) => d.enzymes.some((e) => e.name === selectedEnzyme.name && e.role.includes('inhibitor')))
                  .map((d) => {
                    const role = d.enzymes.find((e) => e.name === selectedEnzyme.name)?.role;
                    return (
                      <li key={d.id} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span className="font-semibold text-rose-200">{d.genericName}</span>
                        <span className="text-[10px] text-rose-300/80 font-mono">({role?.replace('_', ' ')})</span>
                      </li>
                    );
                  })}
                {activeDrugs.filter((d) => d.enzymes.some((e) => e.name === selectedEnzyme.name && e.role.includes('inhibitor'))).length === 0 && (
                  <span className="text-slate-500 italic">No inhibitor drugs selected.</span>
                )}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Clinical Consequence Summary:</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {selectedEnzyme.currentActivity < 50
                  ? `Substrate clearance through ${selectedEnzyme.name} is severely compromised. Expect a 2x-4x increase in systemic drug exposure and elevated risk of dose-dependent adverse reactions.`
                  : selectedEnzyme.currentActivity > 120
                  ? `Enzyme expression is induced by pregnane X receptor / constitutive androstane receptor activation. Clearance is accelerated, risking subtherapeutic therapeutic failure.`
                  : `Enzyme clearance flux is currently within normal operating physiological margins.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
