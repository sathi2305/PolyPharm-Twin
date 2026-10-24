import React, { useState, useMemo } from 'react';
import { Medicine, PkTimePoint, EnzymeProfile, AdrPrediction, PatientContext, SimulationEvent } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';

interface SimulationEventTimelineProps {
  timeSeries: PkTimePoint[];
  activeDrugs: Medicine[];
  liveEnzymes: EnzymeProfile[];
  currentTimeHours: number;
  durationHours: number;
  onSeek: (time: number) => void;
  predictions?: AdrPrediction[];
  drugDosages?: Record<string, number>;
  patientContext?: PatientContext;
}

export const SimulationEventTimeline: React.FC<SimulationEventTimelineProps> = ({
  timeSeries,
  activeDrugs,
  liveEnzymes,
  currentTimeHours,
  durationHours,
  onSeek,
  predictions = [],
  drugDosages = {},
  patientContext,
}) => {
  const { translate } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredEvent, setHoveredEvent] = useState<SimulationEvent | null>(null);
  const [pinnedEventId, setPinnedEventId] = useState<string | null>(null);

  // Dynamically compute significant clinical & metabolic events along the 48-hour cascade
  const events = useMemo<SimulationEvent[]>(() => {
    if (!timeSeries || timeSeries.length === 0 || activeDrugs.length === 0) {
      return [];
    }

    const calculatedEvents: SimulationEvent[] = [];

    // 1. Cmax Peaks per Active Drug
    activeDrugs.forEach((drug) => {
      let maxConc = 0;
      let maxTime = 0;

      timeSeries.forEach((pt) => {
        const val = pt.concentrations[drug.id] || 0;
        if (val > maxConc) {
          maxConc = val;
          maxTime = pt.timeHours;
        }
      });

      if (maxConc > 0.001) {
        calculatedEvents.push({
          id: `cmax_${drug.id}`,
          timeHours: maxTime,
          type: 'cmax_peak',
          title: `${drug.genericName} Cmax Peak`,
          description: `Peak plasma concentration reached at ${maxConc.toFixed(2)} mg/L (t=${maxTime.toFixed(1)}h). Absorption phase completes.`,
          severity: 'info',
          drugId: drug.id,
          drugName: drug.genericName,
          value: maxConc,
          unit: 'mg/L',
          recommendation: `Monitor therapeutic range and peak-associated adverse reactions.`,
        });
      }
    });

    // 2. Enzyme Depletion / Severe Saturation Windows (CYP450 residual flux drops)
    const trackedEnzymes = ['CYP3A4', 'CYP2D6', 'CYP2C9', 'CYP2C19', 'CYP1A2'];
    trackedEnzymes.forEach((enzName) => {
      let minActivity = 100;
      let minTime = 0;

      timeSeries.forEach((pt) => {
        const act = pt.enzymeActivities[enzName];
        if (act !== undefined && act < minActivity) {
          minActivity = act;
          minTime = pt.timeHours;
        }
      });

      // If enzyme activity dropped by more than 40% (activity < 60%)
      if (minActivity < 60) {
        const isCritical = minActivity < 30;
        calculatedEvents.push({
          id: `enz_depletion_${enzName}`,
          timeHours: minTime,
          type: 'enzyme_depletion',
          title: `${enzName} Maximal Saturation (${minActivity.toFixed(0)}% Residual)`,
          description: `Severe metabolic bottleneck reached at t=${minTime.toFixed(1)}h with ${minActivity.toFixed(0)}% residual metabolic flux due to competitive inhibition.`,
          severity: isCritical ? 'critical' : 'warning',
          enzymeName: enzName,
          value: minActivity,
          unit: '%',
          recommendation: isCritical
            ? `High accumulation hazard for partner substrates metabolized by ${enzName}. Consider dose reduction or temporal spacing.`
            : `Moderate flux reduction; monitor drug exposure.`,
        });
      }
    });

    // 3. ADR Risk Trigger Windows
    predictions.forEach((adr, idx) => {
      // Find peak risk timepoint from timeSeries if available, or anchor to earliest trigger window
      let peakRisk = 0;
      let peakRiskTime = 6 + idx * 3; // sensible physiological baseline offset

      timeSeries.forEach((pt) => {
        const score = pt.adrRiskScores?.[adr.label] || pt.adrRiskScores?.[adr.id];
        if (score !== undefined && score > peakRisk) {
          peakRisk = score;
          peakRiskTime = pt.timeHours;
        }
      });

      if (adr.severity === 'Critical' || adr.severity === 'High') {
        calculatedEvents.push({
          id: `adr_${adr.id}`,
          timeHours: Math.min(peakRiskTime, durationHours),
          type: 'adr_trigger',
          title: `ADR Trigger Window: ${adr.label}`,
          description: `${adr.causalExplanation?.[0] || 'High risk interaction threshold crossed.'} Predicted Probability: ${(adr.probability * 100).toFixed(0)}%.`,
          severity: adr.severity === 'Critical' ? 'critical' : 'warning',
          value: adr.probability,
          unit: 'prob',
          recommendation: `Assess patient vitals, ECG, or coagulation biomarkers. Have remedial countermeasures ready.`,
        });
      }
    });

    // 4. Metabolite Surge
    timeSeries.forEach((pt) => {
      if (pt.timeHours === 12 || pt.timeHours === 24) {
        const metaboliteSum = Object.values(pt.metaboliteConcentrations || {}).reduce((a, b) => a + b, 0);
        if (metaboliteSum > 0.05) {
          calculatedEvents.push({
            id: `metabolite_${pt.timeHours}`,
            timeHours: pt.timeHours,
            type: 'metabolite_surge',
            title: `Secondary Metabolite Accumulation Milestone`,
            description: `Cumulative circulating active/reactive metabolites reached ${metaboliteSum.toFixed(2)} mg/L at t=${pt.timeHours}h.`,
            severity: 'info',
            value: metaboliteSum,
            unit: 'mg/L',
            recommendation: `Check renal and hepatic clearance markers.`,
          });
        }
      }
    });

    // Sort chronologically
    return calculatedEvents.sort((a, b) => a.timeHours - b.timeHours);
  }, [timeSeries, activeDrugs, predictions, durationHours]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter((e) => e.type === selectedCategory);
  }, [events, selectedCategory]);

  // Currently active or closest event
  const activeEvent = useMemo(() => {
    if (pinnedEventId) {
      const found = events.find((e) => e.id === pinnedEventId);
      if (found) return found;
    }
    if (hoveredEvent) return hoveredEvent;
    if (filteredEvents.length === 0) return null;

    // Find event closest to current scrubber
    let closest = filteredEvents[0];
    let minDiff = Math.abs(closest.timeHours - currentTimeHours);

    for (const ev of filteredEvents) {
      const diff = Math.abs(ev.timeHours - currentTimeHours);
      if (diff < minDiff) {
        minDiff = diff;
        closest = ev;
      }
    }
    return closest;
  }, [pinnedEventId, hoveredEvent, filteredEvents, events, currentTimeHours]);

  // Jump Next / Prev Event
  const handleJumpPrev = () => {
    const prevs = events.filter((e) => e.timeHours < currentTimeHours - 0.2);
    if (prevs.length > 0) {
      const target = prevs[prevs.length - 1];
      onSeek(target.timeHours);
      setPinnedEventId(target.id);
    } else if (events.length > 0) {
      onSeek(events[0].timeHours);
      setPinnedEventId(events[0].id);
    }
  };

  const handleJumpNext = () => {
    const nexts = events.filter((e) => e.timeHours > currentTimeHours + 0.2);
    if (nexts.length > 0) {
      const target = nexts[0];
      onSeek(target.timeHours);
      setPinnedEventId(target.id);
    } else if (events.length > 0) {
      onSeek(events[events.length - 1].timeHours);
      setPinnedEventId(events[events.length - 1].id);
    }
  };

  const getEventBadge = (type: SimulationEvent['type'], severity: SimulationEvent['severity']) => {
    switch (type) {
      case 'cmax_peak':
        return {
          icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]',
          label: 'Cmax Peak',
        };
      case 'enzyme_depletion':
        return {
          icon: severity === 'critical' ? <Flame className="w-3.5 h-3.5 text-rose-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          color: severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: severity === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
          label: 'Enzyme Saturation',
        };
      case 'adr_trigger':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
          color: 'bg-red-500/20 text-red-300 border-red-500/50',
          dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse',
          label: 'ADR Trigger',
        };
      case 'metabolite_surge':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-purple-400" />,
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.7)]',
          label: 'Metabolite Surge',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          label: 'Milestone',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl backdrop-blur-md space-y-3.5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>{translate('Simulation Event Timeline')}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                {events.length} {translate('Events Detected')}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {translate('Significant Metabolic & Clinical Events (0–48h)')}
            </p>
          </div>
        </div>

        {/* Category Filters & Jump Buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {translate('All')} ({events.length})
            </button>
            <button
              onClick={() => setSelectedCategory('cmax_peak')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'cmax_peak' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {translate('Cmax Peak')}
            </button>
            <button
              onClick={() => setSelectedCategory('enzyme_depletion')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'enzyme_depletion' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {translate('Enzyme Depletion')}
            </button>
            <button
              onClick={() => setSelectedCategory('adr_trigger')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'adr_trigger' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {translate('ADR Trigger')}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleJumpPrev}
              disabled={events.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
              title={translate('Prev Event')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleJumpNext}
              disabled={events.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
              title={translate('Next Event')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 48-Hour Event Track */}
      <div className="relative pt-6 pb-4 select-none">
        {/* Background Track Line */}
        <div className="relative h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-visible">
          {/* Progress fill up to current time */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-400 rounded-full opacity-60"
            style={{ width: `${Math.min(100, (currentTimeHours / durationHours) * 100)}%` }}
          />

          {/* Current Time Scrubber Indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-75"
            style={{ left: `${(currentTimeHours / durationHours) * 100}%` }}
          >
            <div className="w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.9)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
            </div>
            {/* Scrubber Label Tooltip */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-cyan-600 text-white font-mono text-[9px] font-bold shadow-md">
              {currentTimeHours.toFixed(1)}h
            </div>
          </div>

          {/* Event Markers along Timeline */}
          {filteredEvents.map((ev) => {
            const pct = Math.max(0, Math.min(100, (ev.timeHours / durationHours) * 100));
            const badge = getEventBadge(ev.type, ev.severity);
            const isHovered = hoveredEvent?.id === ev.id;
            const isPinned = pinnedEventId === ev.id;
            const isNearby = Math.abs(currentTimeHours - ev.timeHours) <= 1.0;

            return (
              <div
                key={ev.id}
                onClick={() => {
                  onSeek(ev.timeHours);
                  setPinnedEventId(ev.id);
                }}
                onMouseEnter={() => setHoveredEvent(ev)}
                onMouseLeave={() => setHoveredEvent(null)}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 group transition-transform ${
                  isHovered || isPinned ? 'scale-125 z-30' : 'hover:scale-125'
                }`}
                style={{ left: `${pct}%` }}
              >
                {/* Visual Marker Pip */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border border-slate-900 ${badge.dot} ${
                    isNearby ? 'ring-2 ring-white/60' : ''
                  }`}
                />

                {/* Popover Pill on Hover or Pin */}
                {(isHovered || isPinned) && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-white text-[10px] font-mono shadow-xl z-40 pointer-events-none flex items-center gap-1.5">
                    {badge.icon}
                    <span className="font-semibold">{ev.title}</span>
                    <span className="text-cyan-400 font-bold">({ev.timeHours.toFixed(1)}h)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scale labels (0h, 12h, 24h, 36h, 48h) */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-3 pt-1">
          <span>0h (Dosing)</span>
          <span>12h</span>
          <span>24h (Steady-State Flux)</span>
          <span>36h</span>
          <span>48h (Clearance Horizon)</span>
        </div>
      </div>

      {/* Selected / Active Event Inspection Card */}
      {activeEvent && (
        <div
          className={`p-3.5 rounded-xl border backdrop-blur-sm transition-all ${
            activeEvent.severity === 'critical'
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
              : activeEvent.severity === 'warning'
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-md border text-xs font-mono font-bold flex items-center gap-1.5 ${getEventBadge(activeEvent.type, activeEvent.severity).color}`}>
                {getEventBadge(activeEvent.type, activeEvent.severity).icon}
                <span>{getEventBadge(activeEvent.type, activeEvent.severity).label}</span>
              </span>
              <span className="text-xs font-mono font-bold text-white tracking-wide">
                t = {activeEvent.timeHours.toFixed(1)} hours
              </span>
            </div>

            <button
              onClick={() => onSeek(activeEvent.timeHours)}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{translate('Jump to Hour')}</span>
              <Clock className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-2 space-y-1.5 text-xs">
            <h4 className="font-bold text-white tracking-tight">{activeEvent.title}</h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">{activeEvent.description}</p>
            {activeEvent.recommendation && (
              <div className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-emerald-300 font-semibold uppercase text-[10px] tracking-wider block">
                    Clinical Action:
                  </strong>
                  {activeEvent.recommendation}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
