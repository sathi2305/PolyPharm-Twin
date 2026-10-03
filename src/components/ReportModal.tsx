import React from 'react';
import { Medicine, EnzymeProfile, AdrPrediction, ExplainabilityRecord, PatientContext } from '../types';
import { storageService } from '../services/storageService';
import { Printer, X, FileText, CheckCircle2, ShieldAlert, Activity, Bookmark, StickyNote, Pin } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: Medicine[];
  enzymes: EnzymeProfile[];
  predictions: AdrPrediction[];
  explanations: ExplainabilityRecord[];
  patientContext: PatientContext;
  simulationTimeHours: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  activeDrugs,
  enzymes,
  predictions,
  explanations,
  patientContext,
  simulationTimeHours,
}) => {
  if (!isOpen) return null;

  const allNotes = storageService.getClinicalNotes();
  const activePairNotes = Object.values(allNotes).filter((note) =>
    activeDrugs.some((d) => d.id === note.drugAId) &&
    activeDrugs.some((d) => d.id === note.drugBId)
  );

  const regimenAnnotations = storageService.getAnnotationsForRegimen(activeDrugs.map((d) => d.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Polypharmacy Clinical Simulation Dossier Report
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer text-xs font-bold shadow-md shadow-cyan-950/40"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900 text-slate-200" id="printable-report">
          {/* Top Metadata */}
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xl font-black tracking-tight text-white block">
                PolyPharm-Twin Pharmacovigilance Report
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Scenario ID: PPT-{Date.now().toString().slice(-6)} | Software v3.2 Core
              </span>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Simulated Duration: {simulationTimeHours}h / 48h</div>
            </div>
          </div>

          {/* Patient Context Profile */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-cyan-300 font-mono text-[11px] uppercase tracking-wider block">
              Patient Physiological Parameters
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div>
                <span className="text-slate-500 block">Age / Gender:</span>
                <span className="text-white font-semibold">{patientContext.age} yo / {patientContext.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Weight:</span>
                <span className="text-white font-semibold">{patientContext.weightKg} kg</span>
              </div>
              <div>
                <span className="text-slate-500 block">Renal Function (eGFR):</span>
                <span className="text-white font-semibold">{patientContext.renalFunctionEgfr} mL/min</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hepatic Function:</span>
                <span className="text-white font-semibold capitalize">{patientContext.hepaticFunction.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Active Drug Regimen */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block">
              Active Polypharmacy Regimen ({activeDrugs.length} Medicines)
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-slate-800 rounded-lg">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2">Generic Name</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Formula</th>
                    <th className="p-2">t1/2</th>
                    <th className="p-2">Clearance</th>
                    <th className="p-2">Primary Enzymes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeDrugs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-850">
                      <td className="p-2 font-bold text-cyan-300">{d.genericName}</td>
                      <td className="p-2 text-slate-300 font-sans text-[11px]">{d.drugClass}</td>
                      <td className="p-2 text-slate-400">{d.molecularFormula}</td>
                      <td className="p-2">{d.adme.halfLifeHours} h</td>
                      <td className="p-2">{d.adme.clearanceLitersPerHour} L/h</td>
                      <td className="p-2 text-slate-300">{d.enzymes.map((e) => e.name).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Clinical Interaction Notes */}
          {activePairNotes.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                Custom Clinical Interaction Notes ({activePairNotes.length})
              </span>
              <div className="space-y-2">
                {activePairNotes.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg bg-slate-950 border border-cyan-800/50 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-cyan-300">
                        {n.drugAName} + {n.drugBName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        By {n.author || 'Clinical Specialist'} • {new Date(n.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{n.note}</p>
                    {n.recommendation && (
                      <div className="text-[11px] text-cyan-300 font-sans">
                        <strong>Action Plan:</strong> {n.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Regimen Sticky Note Annotations */}
          {regimenAnnotations.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                Clinical Regimen Annotations & Protocols ({regimenAnnotations.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {regimenAnnotations.map((ann) => (
                  <div key={ann.id} className="p-3 rounded-lg bg-slate-950 border border-amber-600/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        {ann.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-current" />}
                        {ann.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {ann.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{ann.content}</p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                      <span>{ann.author || 'Clinical Specialist'}</span>
                      <span className="font-mono text-[9px]">
                        {new Date(ann.updatedAt || ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enzyme Activity Matrix */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block">Enzymatic Flux & Modulation Matrix</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {enzymes.map((e) => (
                <div key={e.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-cyan-300">{e.name}</span>
                    <span className="font-bold text-white">{e.currentActivity}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{e.interactionStatus}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ADR Risk Predictions */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block">Predicted Adverse Drug Reactions</span>
            <div className="space-y-2">
              {predictions.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-white">{p.label}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.causalExplanation[0]}</p>
                  </div>
                  <span className="font-mono font-bold text-xs text-rose-300 shrink-0">
                    P = {p.probability.toFixed(2)} ({p.severity})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Causal Reasoning Trace */}
          {explanations.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-white text-xs block">Explainable AI (XAI) Causal Step Chain</span>
              <div className="space-y-3">
                {explanations.map((exp, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <h5 className="font-semibold text-cyan-200">{exp.interactionTitle}</h5>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px]">
                      {exp.steps.map((s) => (
                        <li key={s.order}>
                          <strong>{s.title}:</strong> {s.description}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical Disclaimer Footer */}
          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
            <strong>Medical Notice:</strong> PolyPharm-Twin is an in-silico biomedical digital-twin and research decision-support platform.
            Its predictions, kinetic curves, and knowledge graphs do not constitute a clinical diagnosis, certified prescription, or medical advice.
          </div>
        </div>
      </div>
    </div>
  );
};
