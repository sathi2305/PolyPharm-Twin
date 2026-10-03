import React, { useState, useEffect, useRef } from 'react';
import { SevereInteractionToastAlert } from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
  ShieldAlert,
  Pill,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface InteractionToastNotificationProps {
  alerts: SevereInteractionToastAlert[];
  onDismiss: (alertId?: string) => void;
  onRemoveDrug: (drugId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const InteractionToastNotification: React.FC<InteractionToastNotificationProps> = ({
  alerts,
  onDismiss,
  onRemoveDrug,
  onNavigateTab,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(10000);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('polypharm_toast_mute') === 'true';
    } catch {
      return false;
    }
  });

  const TOTAL_DURATION_MS = 10000;
  const timerRef = useRef<any>(null);

  // Play auditory alert chime on new alerts
  useEffect(() => {
    if (alerts.length > 0 && !isMuted) {
      const topAlert = alerts[0];
      playChime(topAlert.severity);
    }
    // Reset timer on new alert set
    setTimeLeftMs(TOTAL_DURATION_MS);
    setCurrentIndex(0);
  }, [alerts]);

  // Countdown timer loop
  useEffect(() => {
    if (alerts.length === 0) return;

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 100) {
          clearInterval(timerRef.current);
          onDismiss();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [alerts, isPaused, onDismiss]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      localStorage.setItem('polypharm_toast_mute', String(next));
    } catch {}
  };

  const playChime = (severity: 'contraindicated' | 'major') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (severity === 'contraindicated') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.setValueAtTime(860, now + 0.12);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.1);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio autoplay restrictions catch
    }
  };

  if (!alerts || alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex] || alerts[0];
  const isContraindicated = currentAlert.severity === 'contraindicated';
  const progressPercent = (timeLeftMs / TOTAL_DURATION_MS) * 100;

  return (
    <aside
      role="region"
      aria-label="Drug interaction notifications"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] max-w-[440px] w-full px-3 sm:px-0 pointer-events-auto select-none"
    >
      <div
        role="alert"
        aria-live="assertive"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`rounded-2xl border-2 backdrop-blur-xl shadow-2xl transition-all duration-300 relative overflow-hidden transform animate-in slide-in-from-right-4 fade-in ${
          isContraindicated
            ? 'bg-slate-950/95 border-rose-500 shadow-rose-950/80 ring-2 ring-rose-500/40 text-rose-100'
            : 'bg-slate-950/95 border-amber-500 shadow-amber-950/80 ring-2 ring-amber-500/40 text-amber-100'
        }`}
      >
        {/* Animated Progress Timer Bar at Top */}
        <div className="h-1.5 w-full bg-slate-900/80 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              isContraindicated
                ? 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-300'
                : 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-4 space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${
                  isContraindicated
                    ? 'bg-rose-900/60 border-rose-500/80 text-rose-300 animate-pulse'
                    : 'bg-amber-900/60 border-amber-500/80 text-amber-300'
                }`}
              >
                {isContraindicated ? (
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                      isContraindicated
                        ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                        : 'bg-amber-950 text-amber-300 border-amber-600'
                    }`}
                  >
                    {isContraindicated ? 'Contraindicated Interaction' : 'Major Severe Interaction'}
                  </span>
                  {alerts.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                      {currentIndex + 1} of {alerts.length} Conflicts
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white tracking-tight mt-1 flex items-center gap-1">
                  <span>New Drug Added Conflicts with Regimen</span>
                </h4>
              </div>
            </div>

            {/* Mute and Close Buttons */}
            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <button
                onClick={toggleMute}
                className="p-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute alert chimes' : 'Mute alert chimes'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onDismiss(currentAlert.id)}
                className="p-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Dismiss this alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drug Clash Banner */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-1 rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-500/50 font-bold flex items-center gap-1">
                <Pill className="w-3 h-3 text-cyan-400" />
                {currentAlert.addedDrug.genericName}
                <span className="text-[9px] text-cyan-400/80 font-normal block sm:inline"> (Added)</span>
              </span>

              <span className="text-rose-400 font-bold text-sm">⚡</span>

              <span className="px-2 py-1 rounded-lg bg-purple-950 text-purple-200 border border-purple-500/50 font-bold">
                {currentAlert.regimenDrug.genericName}
                <span className="text-[9px] text-purple-400/80 font-normal block sm:inline"> (In Regimen)</span>
              </span>
            </div>

            {alerts.length > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : alerts.length - 1))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Previous conflicting drug"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev < alerts.length - 1 ? prev + 1 : 0))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Next conflicting drug"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Clinical Mechanism & Risk Details */}
          <div className="space-y-1.5 text-xs">
            <div className="text-[11px] leading-relaxed text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1 font-sans">
              <div>
                <span className="font-semibold text-white">Mechanism: </span>
                <span className="text-slate-300">{currentAlert.mechanism}</span>
              </div>
              <div className="pt-1 border-t border-slate-800/60">
                <span
                  className={`font-semibold ${isContraindicated ? 'text-rose-400' : 'text-amber-400'}`}
                >
                  Clinical Risk:{' '}
                </span>
                <span className="text-slate-200 font-medium">{currentAlert.clinicalRisk}</span>
              </div>
            </div>

            {currentAlert.recommendedAction && (
              <p className="text-[10px] text-slate-400 font-mono italic px-1">
                <strong>Recommended Action:</strong> {currentAlert.recommendedAction}
              </p>
            )}
          </div>

          {/* Direct Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
            {/* Primary One-Click Undo Button */}
            <button
              onClick={() => {
                onRemoveDrug(currentAlert.addedDrug.id);
                onDismiss(currentAlert.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs cursor-pointer transition-colors shadow-lg shadow-rose-950/50 flex items-center gap-1.5 shrink-0"
              title={`Instantly remove ${currentAlert.addedDrug.genericName} from the current regimen`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo / Remove {currentAlert.addedDrug.genericName}</span>
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              {onNavigateTab && (
                <button
                  onClick={() => {
                    onNavigateTab('simulation');
                    onDismiss(currentAlert.id);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white font-mono text-xs cursor-pointer transition-colors border border-slate-700 flex items-center gap-1"
                  title="Navigate to Simulation Workbench to inspect full PK curves"
                >
                  <span>Workbench</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => onDismiss(currentAlert.id)}
                className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-mono underline cursor-pointer"
                title="Acknowledge warning and keep medication in regimen"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
