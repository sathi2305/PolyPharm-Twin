import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Medicine, EnzymeProfile, PkTimePoint, PatientContext } from '../types';
import { calculatePairwiseMetabolicHazards } from '../engine/metabolicHazardEngine';
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  X,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  ArrowRight,
  Sparkles,
  Pill,
  Info,
  Clock,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Zap,
  Activity,
} from 'lucide-react';

export interface RealTimeDdiAlert {
  id: string;
  drugA: Medicine;
  drugB: Medicine;
  severity: 'contraindicated' | 'critical' | 'major';
  title: string;
  mechanism: string;
  clinicalRisk: string;
  suggestedAction: string;
  alternativeDrug?: string;
  primaryEnzyme?: string;
  concDrugA: number;
  concDrugB: number;
  hazardScore: number;
  isLiveConcentrationActive: boolean;
  timestampHours: number;
}

interface RealTimeInteractionAlertSystemProps {
  activeDrugs: Medicine[];
  enzymes: EnzymeProfile[];
  timeSeries: PkTimePoint[];
  currentTimeHours: number;
  patientContext?: PatientContext;
  onToggleActiveDrug: (drugId: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenReport?: () => void;
}

export const RealTimeInteractionAlertSystem: React.FC<RealTimeInteractionAlertSystemProps> = ({
  activeDrugs,
  enzymes,
  timeSeries,
  currentTimeHours,
  patientContext,
  onToggleActiveDrug,
  onNavigateTab,
  onOpenReport,
}) => {
  const [isToastOpen, setIsToastOpen] = useState<boolean>(true);
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState<boolean>(false);
  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [selectedAuditAlert, setSelectedAuditAlert] = useState<RealTimeDdiAlert | null>(null);

  // Audio synthesizer throttle
  const lastChimeTimeRef = useRef<number>(0);

  // 1. Find live concentration timepoint at current simulation time
  const currentPoint = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return null;
    return timeSeries.reduce((prev, curr) =>
      Math.abs(curr.timeHours - currentTimeHours) < Math.abs(prev.timeHours - currentTimeHours)
        ? curr
        : prev
    );
  }, [timeSeries, currentTimeHours]);

  // 2. Evaluate all active drug pairs for high-severity or contraindicated interactions
  const allAlerts: RealTimeDdiAlert[] = useMemo(() => {
    if (!activeDrugs || activeDrugs.length < 2) return [];

    const list: RealTimeDdiAlert[] = [];
    const evaluatedPairs = new Set<string>();

    // Step A: Run dynamic metabolic hazard engine (captures enzyme saturation, Ki, induction)
    const hazardSummary = calculatePairwiseMetabolicHazards(
      activeDrugs,
      enzymes,
      timeSeries,
      currentTimeHours,
      50, // capture high and critical interactions
      patientContext
    );

    // Map metabolic alerts
    hazardSummary.alerts.forEach((hazard) => {
      if (hazard.severity === 'critical' || hazard.severity === 'high' || hazard.hazardScore >= 55) {
        const pairKey = [hazard.drugA.id, hazard.drugB.id].sort().join('__');
        evaluatedPairs.add(pairKey);

        const concA = currentPoint?.concentrations?.[hazard.drugA.id] ?? 0;
        const concB = currentPoint?.concentrations?.[hazard.drugB.id] ?? 0;
        const isLiveActive = concA > 0.01 && concB > 0.01;

        list.push({
          id: pairKey,
          drugA: hazard.drugA,
          drugB: hazard.drugB,
          severity: hazard.hazardScore >= 80 ? 'contraindicated' : 'critical',
          title: `${hazard.drugA.genericName} + ${hazard.drugB.genericName}`,
          mechanism: hazard.mechanism,
          clinicalRisk: hazard.clinicalRisk,
          suggestedAction: hazard.recommendedAction,
          alternativeDrug: hazard.suggestedAlternative,
          primaryEnzyme: hazard.primaryEnzyme,
          concDrugA: concA,
          concDrugB: concB,
          hazardScore: hazard.hazardScore,
          isLiveConcentrationActive: isLiveActive,
          timestampHours: currentTimeHours,
        });
      }
    });

    // Step B: Check documented known interactions in drug definitions for contraindicated / major pairs
    for (let i = 0; i < activeDrugs.length; i++) {
      for (let j = i + 1; j < activeDrugs.length; j++) {
        const drugA = activeDrugs[i];
        const drugB = activeDrugs[j];
        const pairKey = [drugA.id, drugB.id].sort().join('__');

        // Check if already covered by metabolic engine
        if (evaluatedPairs.has(pairKey)) continue;

        // Check drugA known interactions targeting drugB
        const docInterA = drugA.knownInteractions?.find(
          (k) =>
            k.partnerDrug.toLowerCase() === drugB.genericName.toLowerCase() ||
            drugB.brandNames?.some((b) => b.toLowerCase() === k.partnerDrug.toLowerCase())
        );

        // Check drugB known interactions targeting drugA
        const docInterB = drugB.knownInteractions?.find(
          (k) =>
            k.partnerDrug.toLowerCase() === drugA.genericName.toLowerCase() ||
            drugA.brandNames?.some((b) => b.toLowerCase() === k.partnerDrug.toLowerCase())
        );

        const docInter = docInterA || docInterB;

        if (docInter && (docInter.severity === 'contraindicated' || docInter.severity === 'major')) {
          evaluatedPairs.add(pairKey);
          const concA = currentPoint?.concentrations?.[drugA.id] ?? 0;
          const concB = currentPoint?.concentrations?.[drugB.id] ?? 0;
          const isLiveActive = concA > 0.01 && concB > 0.01;

          list.push({
            id: pairKey,
            drugA,
            drugB,
            severity: docInter.severity === 'contraindicated' ? 'contraindicated' : 'critical',
            title: `${drugA.genericName} + ${drugB.genericName}`,
            mechanism: docInter.mechanism || 'Documented pharmacodynamic / pharmacokinetic synergy',
            clinicalRisk: docInter.clinicalRisk || 'Severe risk of adverse toxicity event',
            suggestedAction: `Consider replacing ${drugB.genericName} or staggering administration schedule.`,
            concDrugA: concA,
            concDrugB: concB,
            hazardScore: docInter.severity === 'contraindicated' ? 95 : 78,
            isLiveConcentrationActive: isLiveActive,
            timestampHours: currentTimeHours,
          });
        }
      }
    }

    // Sort: Contraindicated first, then by hazard score
    return list.sort((a, b) => {
      if (a.severity === 'contraindicated' && b.severity !== 'contraindicated') return -1;
      if (a.severity !== 'contraindicated' && b.severity === 'contraindicated') return 1;
      return b.hazardScore - a.hazardScore;
    });
  }, [activeDrugs, enzymes, timeSeries, currentTimeHours, patientContext, currentPoint]);

  // Filter out dismissed alerts for the floating toast
  const activeUnDismissedAlerts = useMemo(() => {
    return allAlerts.filter((a) => !dismissedAlertIds.has(a.id));
  }, [allAlerts, dismissedAlertIds]);

  // Audio alert chime
  useEffect(() => {
    if (isAudioMuted || activeUnDismissedAlerts.length === 0) return;

    const now = Date.now();
    if (now - lastChimeTimeRef.current > 7000) {
      lastChimeTimeRef.current = now;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // AudioContext blocked until user clicks
      }
    }
  }, [activeUnDismissedAlerts.length, isAudioMuted]);

  // Reset index if out of bounds
  useEffect(() => {
    if (activeAlertIndex >= activeUnDismissedAlerts.length) {
      setActiveAlertIndex(Math.max(0, activeUnDismissedAlerts.length - 1));
    }
  }, [activeUnDismissedAlerts.length, activeAlertIndex]);

  // Auto reopen toast when new severe alerts appear
  useEffect(() => {
    if (activeUnDismissedAlerts.length > 0) {
      setIsToastOpen(true);
    }
  }, [activeUnDismissedAlerts.length]);

  if (allAlerts.length === 0) {
    return null;
  }

  const currentAlert = activeUnDismissedAlerts[activeAlertIndex] || allAlerts[0];

  return (
    <>
      {/* 1. Real-Time Floating Pop-up Toast Notification */}
      {isToastOpen && currentAlert && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full sm:w-[420px] animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 rounded-2xl bg-slate-950/95 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/80 backdrop-blur-xl space-y-3 relative overflow-hidden">
            {/* Top Glowing Ambient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse" />

            {/* Header: Warning Title & Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/60 animate-bounce">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                      {currentAlert.severity === 'contraindicated' ? 'CONTRAINDICATED DDI' : 'CRITICAL INTERACTION'}
                    </span>
                    <span className="text-[10px] font-mono text-rose-300 font-bold">
                      {currentAlert.hazardScore}% Hazard
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-0.5">
                    Real-Time Pharmacological Alert
                  </h4>
                </div>
              </div>

              {/* Action Buttons: Sound, Pager, Close */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isAudioMuted
                      ? 'text-slate-500 border-slate-800 hover:text-slate-300'
                      : 'text-amber-400 border-amber-500/40 bg-amber-950/40'
                  }`}
                  title={isAudioMuted ? 'Unmute chime' : 'Mute chime'}
                >
                  {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setIsToastOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Dismiss pop-up notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Offending Drug Pair Banner */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span className="px-2 py-1 rounded-lg bg-rose-950 text-rose-200 border border-rose-500/40">
                  {currentAlert.drugA.genericName}
                </span>
                <span className="text-rose-400 font-mono">⇄</span>
                <span className="px-2 py-1 rounded-lg bg-rose-950 text-rose-200 border border-rose-500/40">
                  {currentAlert.drugB.genericName}
                </span>
              </div>

              <div className="text-right text-[10px] font-mono text-slate-400">
                <div>t = {currentTimeHours.toFixed(1)}h</div>
                {currentAlert.isLiveConcentrationActive ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    Concurrent Plasma Peak
                  </span>
                ) : (
                  <span className="text-amber-400">Regimen Co-Prescription</span>
                )}
              </div>
            </div>

            {/* Clinical Risk Summary */}
            <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
              <p className="font-semibold text-rose-200">
                {currentAlert.clinicalRisk}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                <strong>Mechanism:</strong> {currentAlert.mechanism}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onToggleActiveDrug(currentAlert.drugB.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-rose-950 transition-all flex items-center justify-center gap-1"
                title={`Remove ${currentAlert.drugB.genericName} from active regimen`}
              >
                <span>Remove {currentAlert.drugB.genericName}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedAuditAlert(currentAlert);
                  setIsAlertCenterOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors"
              >
                Inspect
              </button>
            </div>

            {/* Multiple Alerts Navigation Footer */}
            {activeUnDismissedAlerts.length > 1 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>
                  Alert {activeAlertIndex + 1} of {activeUnDismissedAlerts.length} high-severity hazards
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setActiveAlertIndex((prev) =>
                        prev > 0 ? prev - 1 : activeUnDismissedAlerts.length - 1
                      )
                    }
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveAlertIndex((prev) =>
                        prev < activeUnDismissedAlerts.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Floating High-Severity Alert Badge Center Launcher (when toast is minimized) */}
      {!isToastOpen && allAlerts.length > 0 && (
        <button
          onClick={() => setIsToastOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500 text-rose-200 font-bold text-xs shadow-2xl shadow-rose-950/80 hover:bg-rose-900 transition-all cursor-pointer animate-pulse"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>{allAlerts.length} Critical DDI Warning{allAlerts.length > 1 ? 's' : ''}</span>
        </button>
      )}

      {/* 3. Comprehensive High-Severity DDI Audit Modal */}
      {isAlertCenterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-950 border border-rose-500/50">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    High-Severity Drug Interaction Center
                  </h3>
                  <span className="text-xs text-slate-400">
                    {allAlerts.length} high-severity interaction pair(s) detected in current simulation
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAlertCenterOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* List of Alerts */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {allAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl bg-slate-950 border border-rose-500/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-600 text-white">
                        {alert.severity}
                      </span>
                      <span className="font-bold text-white text-sm">
                        {alert.drugA.genericName} ⇄ {alert.drugB.genericName}
                      </span>
                    </div>
                    <span className="font-mono text-rose-400 font-black text-sm">
                      {alert.hazardScore}% Hazard
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div>
                      <strong className="text-rose-300 block mb-0.5">Clinical Consequence:</strong>
                      <p className="text-slate-300">{alert.clinicalRisk}</p>
                    </div>
                    <div>
                      <strong className="text-slate-400 block mb-0.5">Mechanism of Action:</strong>
                      <p className="text-slate-400">{alert.mechanism}</p>
                    </div>
                    {alert.alternativeDrug && (
                      <div className="pt-1 border-t border-slate-800 text-cyan-300">
                        <strong>Suggested Safe Alternative:</strong> {alert.alternativeDrug}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <div className="text-[11px] font-mono text-slate-400">
                      Live C(t): {alert.drugA.genericName} ({alert.concDrugA.toFixed(2)} mg/L) · {alert.drugB.genericName} ({alert.concDrugB.toFixed(2)} mg/L)
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onToggleActiveDrug(alert.drugB.id);
                          setIsAlertCenterOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                      >
                        Remove {alert.drugB.genericName}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Detected by Continuous ODE Kinetic Cascade & Documented Clinical Pharmacology
              </span>
              <button
                onClick={() => setIsAlertCenterOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
