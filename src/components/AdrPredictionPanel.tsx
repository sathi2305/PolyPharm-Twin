import React from 'react';
import { AdrPrediction } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, ExternalLink, Activity } from 'lucide-react';

interface AdrPredictionPanelProps {
  predictions: AdrPrediction[];
  onSelectAdr?: (adr: AdrPrediction) => void;
}

export const AdrPredictionPanel: React.FC<AdrPredictionPanelProps> = ({ predictions, onSelectAdr }) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-slate-100 text-base tracking-tight">
              Multi-Label Adverse Drug Reaction (ADR) Signals
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/60">
              TGNN PREDICTION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated probabilistic risk stratification across organ system toxicities.
          </p>
        </div>

        {/* Evidence Disclaimer Tag */}
        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          Dataset: TwoSIDES / FAERS / FDA
        </span>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          Select one or more medicines in the simulator to evaluate ADR risk.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {predictions.map((adr) => {
            const pct = Math.round(adr.probability * 100);
            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800/40';
            if (adr.severity === 'Critical') {
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-950 text-rose-300 border-rose-700/60';
            } else if (adr.severity === 'High') {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-950 text-amber-300 border-amber-700/60';
            } else if (adr.severity === 'Moderate') {
              barColor = 'bg-yellow-500';
              badgeBg = 'bg-yellow-950 text-yellow-300 border-yellow-700/60';
            }

            return (
              <div
                key={adr.id}
                onClick={() => onSelectAdr?.(adr)}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm tracking-tight">{adr.label}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Organ System: {adr.organSystem}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${badgeBg}`}>
                    {adr.severity.toUpperCase()} ({pct}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Calibrated Probability: {adr.probability.toFixed(2)}</span>
                    <span>Confidence: {(adr.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Causal explanation bullet summary */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <span className="font-semibold text-cyan-300 text-[10px] uppercase font-mono block">
                    Metabolic / Pharmacodynamic Mechanism:
                  </span>
                  <p className="line-clamp-2 leading-relaxed text-slate-300/90">
                    {adr.causalExplanation[0] || 'Pharmacological synergy observed.'}
                  </p>
                </div>

                {/* Source & Evidence label */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-850">
                  <span>Classification: <strong className="text-slate-400">{adr.evidenceLevel}</strong></span>
                  <span className="text-cyan-400 hover:underline">Inspect XAI Evidence →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
