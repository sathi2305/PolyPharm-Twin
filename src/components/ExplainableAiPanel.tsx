import React from 'react';
import { ExplainabilityRecord } from '../types';
import { Sparkles, ArrowRight, ShieldAlert, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface ExplainableAiPanelProps {
  explanations: ExplainabilityRecord[];
}

export const ExplainableAiPanel: React.FC<ExplainableAiPanelProps> = ({ explanations }) => {
  if (!explanations || explanations.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
        No high-risk interaction flags active. Select two or more interacting medicines to inspect the XAI reasoning trace.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-base tracking-tight">
            Explainable AI (XAI) Causal Attribution & Mechanistic Chains
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
            TRANSPARENT REASONING
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Deconstructs the Temporal Graph Neural Network’s prediction into biochemical causality, enzyme flux changes,
          attention weights, and clinical evidence.
        </p>
      </div>

      {/* Explanation Cards */}
      {explanations.map((exp, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <h4 className="font-bold text-white text-base tracking-tight">{exp.interactionTitle}</h4>
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono border self-start sm:self-auto ${
                exp.severity === 'Critical'
                  ? 'bg-rose-950 text-rose-300 border-rose-700/60'
                  : exp.severity === 'Major'
                  ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                  : 'bg-yellow-950 text-yellow-300 border-yellow-700/60'
              }`}
            >
              SEVERITY: {exp.severity.toUpperCase()}
            </span>
          </div>

          {/* Causal Step-by-Step Chain */}
          <div>
            <span className="text-[11px] font-bold text-cyan-300 uppercase font-mono tracking-wider block mb-3">
              Why was this interaction flagged? (Causal Chain)
            </span>

            <div className="relative pl-6 space-y-4 border-l-2 border-slate-800">
              {exp.steps.map((step) => (
                <div key={step.order} className="relative group">
                  {/* Step circle marker */}
                  <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-cyan-500 text-cyan-300 flex items-center justify-center font-mono font-bold text-[11px]">
                    {step.order}
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h5 className="font-bold text-slate-100 text-xs">{step.title}</h5>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                        Node: {step.nodeInvolved} (Attn: {(step.importanceScore * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300/90 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attention Weights & Contributing Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
            {/* Contributing Nodes */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Contributing Biomedical Nodes</span>
              </div>
              <div className="space-y-1.5">
                {exp.contributingNodes.map((n, i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-300">{n.name} ({n.type})</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-500"
                          style={{ width: `${n.weight * 100}%` }}
                        />
                      </div>
                      <span className="text-cyan-300 font-bold">{(n.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TGNN Attention Weights */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>GNN Self-Supervised Attention Weights</span>
              </div>
              <div className="space-y-1.5">
                {exp.attentionWeights.map((att, i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-300 truncate max-w-[170px]">{att.pair}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${att.weight * 100}%` }}
                        />
                      </div>
                      <span className="text-amber-300 font-bold">{att.weight.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Therapeutic Window Alert & Supporting Evidence */}
          {exp.therapeuticWindowWarning && (
            <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-800/40 flex items-start gap-2.5 text-xs text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300 font-bold">Therapeutic Window Alert:</strong>{' '}
                {exp.therapeuticWindowWarning}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Literature Evidence: {exp.supportingEvidence}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
