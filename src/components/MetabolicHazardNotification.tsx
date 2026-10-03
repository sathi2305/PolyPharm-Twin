import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Medicine, EnzymeProfile, PkTimePoint, PatientContext } from '../types';
import {
  calculatePairwiseMetabolicHazards,
  MetabolicHazardAlert,
  DEFAULT_METABOLIC_HAZARD_THRESHOLD,
} from '../engine/metabolicHazardEngine';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Sliders,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  ArrowRight,
  RefreshCw,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Pill,
  Flame,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

interface MetabolicHazardNotificationProps {
  activeDrugs: Medicine[];
  enzymes: EnzymeProfile[];
  timeSeries: PkTimePoint[];
  currentTimeHours: number;
  patientContext?: PatientContext;
  onToggleActiveDrug: (drugId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const MetabolicHazardNotification: React.FC<MetabolicHazardNotificationProps> = ({
  activeDrugs,
  enzymes,
  timeSeries,
  currentTimeHours,
  patientContext,
  onToggleActiveDrug,
  onNavigateTab,
}) => {
  // Configurable hazard threshold state
  const [threshold, setThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('polypharm_metabolic_hazard_threshold');
      return saved ? parseInt(saved, 10) : DEFAULT_METABOLIC_HAZARD_THRESHOLD;
    } catch {
      return DEFAULT_METABOLIC_HAZARD_THRESHOLD;
    }
  });

  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);
  const [isThresholdControlOpen, setIsThresholdControlOpen] = useState<boolean>(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isNotificationCollapsed, setIsNotificationCollapsed] = useState<boolean>(false);

  // Audio synthesizer ref to prevent duplicate beeps
  const lastAlertTimeRef = useRef<number>(0);

  // Save threshold changes
  const handleThresholdChange = (val: number) => {
    const clamped = Math.max(20, Math.min(95, val));
    setThreshold(clamped);
    try {
      localStorage.setItem('polypharm_metabolic_hazard_threshold', clamped.toString());
    } catch {
      // ignore
    }
  };

  // Run dynamic metabolic hazard engine
  const summary = useMemo(() => {
    return calculatePairwiseMetabolicHazards(
      activeDrugs,
      enzymes,
      timeSeries,
      currentTimeHours,
      threshold,
      patientContext
    );
  }, [activeDrugs, enzymes, timeSeries, currentTimeHours, threshold, patientContext]);

  // Active un-dismissed exceeding alerts
  const activeExceedingAlerts = useMemo(() => {
    return summary.exceedingAlerts.filter((a) => !dismissedAlertIds.has(a.id));
  }, [summary.exceedingAlerts, dismissedAlertIds]);

  // Play subtle warning audio chime when a new threshold breach happens
  useEffect(() => {
    if (!isAudioEnabled || activeExceedingAlerts.length === 0) return;

    const now = Date.now();
    // Throttle sound to at most once per 6 seconds
    if (now - lastAlertTimeRef.current > 6000) {
      lastAlertTimeRef.current = now;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // AudioContext might be blocked until user interaction
      }
    }
  }, [activeExceedingAlerts.length, isAudioEnabled]);

  // Reset active index if bounds change
  useEffect(() => {
    if (activeAlertIndex >= activeExceedingAlerts.length) {
      setActiveAlertIndex(Math.max(0, activeExceedingAlerts.length - 1));
    }
  }, [activeExceedingAlerts.length, activeAlertIndex]);

  // If fewer than 2 active drugs, we don't have interactions
  if (activeDrugs.length < 2) {
    return null;
  }

  const currentAlert: MetabolicHazardAlert | undefined = activeExceedingAlerts[activeAlertIndex];

  const handleDismissCurrentAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, alertId]));
  };

  const handleResetDismissed = () => {
    setDismissedAlertIds(new Set());
  };

  return (
    <div className="space-y-3">
      {/* Real-Time Notification & Hazard Threshold Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs shadow-md">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl flex items-center justify-center ${
              activeExceedingAlerts.length > 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {activeExceedingAlerts.length > 0 ? (
              <Flame className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
                Real-Time Metabolic Hazard Monitor
              </span>
              {activeExceedingAlerts.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                  {activeExceedingAlerts.length} Hazard Breach{activeExceedingAlerts.length > 1 ? 'es' : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
                  All Pairs Safe (&lt;{threshold}%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Continuous pairwise DDI clearance monitoring • Current highest hazard:{' '}
              <span
                className={`font-mono font-bold ${
                  summary.highestHazardScore >= threshold
                    ? 'text-rose-400'
                    : summary.highestHazardScore >= 45
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {summary.highestHazardScore}%
              </span>{' '}
              vs threshold ({threshold}%)
            </p>
          </div>
        </div>

        {/* Action Controls & Threshold Toggle */}
        <div className="flex items-center gap-2">
          {dismissedAlertIds.size > 0 && (
            <button
              onClick={handleResetDismissed}
              className="text-[10px] text-slate-400 hover:text-cyan-300 underline cursor-pointer"
              title="Show previously dismissed hazard warnings"
            >
              Restore Dismissed ({dismissedAlertIds.size})
            </button>
          )}

          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              isAudioEnabled
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={isAudioEnabled ? 'Mute alert chime' : 'Enable audio chime on threshold breach'}
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsThresholdControlOpen(!isThresholdControlOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
              isThresholdControlOpen
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hazard Threshold: {threshold}%</span>
          </button>

          {activeExceedingAlerts.length > 0 && (
            <button
              onClick={() => setIsNotificationCollapsed(!isNotificationCollapsed)}
              className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs cursor-pointer"
              title={isNotificationCollapsed ? 'Expand warning card' : 'Collapse warning card'}
            >
              {isNotificationCollapsed ? 'Show Warning Card' : 'Hide Card'}
            </button>
          )}
        </div>
      </div>

      {/* Threshold Configuration Drawer */}
      {isThresholdControlOpen && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl space-y-3 animate-fadeIn text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">
                Metabolic Hazard Threshold Calibration
              </span>
            </div>
            <button
              onClick={() => setIsThresholdControlOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">
            The warning card triggers in real-time whenever the pairwise metabolic hazard score
            between any two active drugs exceeds this threshold. Lower thresholds increase sensitivity for fragile patients.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-mono">
              <span>Threshold Sensitivity:</span>
              <span className="font-bold text-cyan-300 text-sm">{threshold}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="90"
              step="5"
              value={threshold}
              onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30% (Strict Vigilance)</span>
              <span>65% (Clinical Default)</span>
              <span>90% (Catastrophic Only)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 self-center">Presets:</span>
            <button
              onClick={() => handleThresholdChange(50)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                threshold === 50
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              High Sensitivity (50%)
            </button>
            <button
              onClick={() => handleThresholdChange(65)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                threshold === 65
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Standard Clinical (65%)
            </button>
            <button
              onClick={() => handleThresholdChange(80)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                threshold === 80
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Critical Only (80%)
            </button>
          </div>
        </div>
      )}

      {/* Real-Time WARNING CARD (Rendered when simulated interaction exceeds threshold) */}
      {activeExceedingAlerts.length > 0 && !isNotificationCollapsed && currentAlert && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/90 via-slate-900 to-slate-900 border-2 border-rose-500/80 shadow-2xl p-5 text-xs space-y-4 animate-fadeIn">
          {/* Subtle background warning glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Banner & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-inner">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white tracking-wide uppercase">
                    Metabolic Hazard Warning Card
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                    {currentAlert.severity} Hazard
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-rose-200/80">
                  <span>Simulation Clock: t = {currentTimeHours.toFixed(1)}h</span>
                  <span>•</span>
                  <span>
                    Hazard Score:{' '}
                    <strong className="text-rose-300 font-mono font-bold text-xs">
                      {currentAlert.hazardScore}%
                    </strong>{' '}
                    (Exceeds {threshold}% Threshold by +{currentAlert.hazardScore - threshold}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Pagination between multiple hazard cards + dismiss button */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {activeExceedingAlerts.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                  <button
                    onClick={() =>
                      setActiveAlertIndex((prev) =>
                        prev === 0 ? activeExceedingAlerts.length - 1 : prev - 1
                      )
                    }
                    className="p-1 hover:text-white cursor-pointer"
                    title="Previous warning"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold px-1 text-rose-400">
                    {activeAlertIndex + 1} of {activeExceedingAlerts.length}
                  </span>
                  <button
                    onClick={() =>
                      setActiveAlertIndex((prev) =>
                        prev === activeExceedingAlerts.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="p-1 hover:text-white cursor-pointer"
                    title="Next warning"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={() => handleDismissCurrentAlert(currentAlert.id)}
                className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-rose-950 text-slate-400 hover:text-rose-200 border border-slate-800 text-[11px] font-semibold cursor-pointer transition-colors"
                title="Snooze this warning for current session"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Interacting Drug Pair Display Bar */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center bg-slate-950/90 p-4 rounded-xl border border-rose-500/30">
            {/* Drug A */}
            <div className="md:col-span-3 p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Compound 1
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                  {currentAlert.concDrugA > 0
                    ? `C(t) = ${currentAlert.concDrugA.toFixed(2)} mg/L`
                    : 'Clearance Phase'}
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{currentAlert.drugA.genericName}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentAlert.drugA.drugClass}
              </div>
            </div>

            {/* Interaction Connector / Hazard Gauge */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center py-1">
              <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center font-bold font-mono text-xs text-rose-300 shadow-lg">
                ⇄
              </div>
              <span className="text-[9px] uppercase font-mono font-bold text-rose-400 mt-1">
                {currentAlert.foldExposureIncrease > 1.0
                  ? `+${((currentAlert.foldExposureIncrease - 1) * 100).toFixed(0)}% AUC`
                  : 'Metabolic Clash'}
              </span>
            </div>

            {/* Drug B */}
            <div className="md:col-span-3 p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Compound 2
                </span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">
                  {currentAlert.concDrugB > 0
                    ? `C(t) = ${currentAlert.concDrugB.toFixed(2)} mg/L`
                    : 'Clearance Phase'}
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{currentAlert.drugB.genericName}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentAlert.drugB.drugClass}
              </div>
            </div>
          </div>

          {/* Hazard Mechanism & Kinetic Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Mechanistic Biology */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-semibold text-xs border-b border-slate-800/80 pb-1.5">
                <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5" /> Enzymatic Bottleneck ({currentAlert.primaryEnzyme})
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  Residual Activity: {currentAlert.enzymeActivityPct}%
                </span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {currentAlert.mechanism}
              </p>
              {currentAlert.foldExposureIncrease > 1.0 && (
                <div className="text-[11px] text-amber-300/90 font-mono bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                  Estimated Plasma Exposure Surge: ~<strong>{currentAlert.foldExposureIncrease}x baseline AUC</strong>.
                </div>
              )}
            </div>

            {/* Clinical Risk & Organ Toxicity */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-semibold text-xs border-b border-slate-800/80 pb-1.5">
                <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" /> Clinical Toxicity Risk
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentAlert.evidenceSource.split('/')[0]}
                </span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {currentAlert.clinicalRisk}
              </p>
              <div className="text-[11px] text-cyan-300 font-medium bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/30">
                <strong>Recommended Action:</strong> {currentAlert.recommendedAction}
              </div>
            </div>
          </div>

          {/* Quick Mitigation Toolbar (Interactive Action Buttons) */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold">
                Quick Mitigation:
              </span>
              <button
                onClick={() => onToggleActiveDrug(currentAlert.drugA.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
                title={`Remove ${currentAlert.drugA.genericName} to resolve metabolic bottleneck`}
              >
                <span>Remove {currentAlert.drugA.genericName}</span>
                <X className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onToggleActiveDrug(currentAlert.drugB.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
                title={`Remove ${currentAlert.drugB.genericName} to resolve metabolic bottleneck`}
              >
                <span>Remove {currentAlert.drugB.genericName}</span>
                <X className="w-3.5 h-3.5" />
              </button>

              {currentAlert.suggestedAlternative && (
                <span className="text-[11px] text-slate-400 italic">
                  Alternative: <span className="text-emerald-400 font-medium">{currentAlert.suggestedAlternative}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('knowledge_graph')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <span>Inspect in Knowledge Graph</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                onClick={() => onNavigateTab('adr_xai')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <span>XAI Attribution</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Pairs Safe Banner (when no interactions exceed threshold) */}
      {activeExceedingAlerts.length === 0 && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-emerald-300 font-bold">
                Metabolic Safety Within Acceptable Limits
              </span>
              <p className="text-[11px] text-slate-400">
                All {summary.totalPairsEvaluated} simulated active drug pairings remain below the{' '}
                {threshold}% metabolic hazard threshold. Peak simulated hazard is {summary.highestHazardScore}%.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleThresholdChange(Math.max(30, summary.highestHazardScore - 5))}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline shrink-0"
            title="Test warning card by lowering threshold to match current pairs"
          >
            Test Warning Card (Lower Threshold)
          </button>
        </div>
      )}
    </div>
  );
};
