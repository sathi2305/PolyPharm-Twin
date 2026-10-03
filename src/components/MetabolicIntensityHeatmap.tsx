import React, { useState, useMemo } from 'react';
import { Medicine, EnzymeProfile, PkTimePoint } from '../types';
import {
  Flame,
  Activity,
  AlertTriangle,
  Info,
  Clock,
  Filter,
  Layers,
  ListOrdered,
  Grid3X3,
  ShieldAlert,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface MetabolicIntensityHeatmapProps {
  activeDrugs: Medicine[];
  enzymes: EnzymeProfile[];
  timeSeries: PkTimePoint[];
  currentTimeHours: number;
  durationHours?: number;
  isPlaying?: boolean;
  onNavigateTab?: (tab: string) => void;
  onToggleActiveDrug?: (drugId: string) => void;
  onLoadPreset?: (drugIds: string[]) => void;
}

export type HeatmapFilterMode = 'all' | 'high_intensity' | 'substrates' | 'inhibitors' | 'inducers';
export type HeatmapViewMode = 'grid' | 'ranking';

export interface InteractionCellData {
  drugId: string;
  drugName: string;
  drugClass: string;
  enzymeId: string;
  enzymeName: string;
  role: 'substrate' | 'inhibitor_strong' | 'inhibitor_moderate' | 'inhibitor_weak' | 'inducer' | 'none';
  intensity: number; // 0 - 100
  currentConc: number; // mg/L
  cMax: number; // mg/L
  enzymeActivityPct: number; // %
  isBottleneck: boolean;
  clinicalImpact: string;
  ki?: number;
  inductionFactor?: number;
}

export const MetabolicIntensityHeatmap: React.FC<MetabolicIntensityHeatmapProps> = ({
  activeDrugs,
  enzymes,
  timeSeries,
  currentTimeHours,
  durationHours = 48,
  isPlaying = false,
  onNavigateTab,
  onToggleActiveDrug,
  onLoadPreset,
}) => {
  const [filterMode, setFilterMode] = useState<HeatmapFilterMode>('all');
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('grid');
  const [selectedCell, setSelectedCell] = useState<InteractionCellData | null>(null);

  // 1. Identify canonical enzymes to display in columns
  const standardEnzymeNames = useMemo(() => {
    const list = ['CYP3A4', 'CYP2D6', 'CYP2C9', 'CYP2C19', 'CYP1A2', 'CYP2E1', 'UGT1A1'];
    // Add any non-standard enzyme that an active drug targets
    activeDrugs.forEach((d) => {
      d.enzymes?.forEach((e) => {
        if (!list.some((std) => std.toLowerCase() === e.name.toLowerCase())) {
          list.push(e.name);
        }
      });
    });
    return list;
  }, [activeDrugs]);

  // 2. Find closest timepoint in timeSeries for the current simulation scrubber
  const currentPoint = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return null;
    let closest = timeSeries[0];
    let minDiff = Math.abs(closest.timeHours - currentTimeHours);

    for (let i = 1; i < timeSeries.length; i++) {
      const diff = Math.abs(timeSeries[i].timeHours - currentTimeHours);
      if (diff < minDiff) {
        minDiff = diff;
        closest = timeSeries[i];
      }
    }
    return closest;
  }, [timeSeries, currentTimeHours]);

  // 3. Compute Cmax for each active drug across all time points for normalization
  const drugCMaxMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeDrugs.forEach((drug) => {
      let maxVal = 0.01;
      if (timeSeries && timeSeries.length > 0) {
        timeSeries.forEach((tp) => {
          const val = tp.concentrations?.[drug.id] || 0;
          if (val > maxVal) maxVal = val;
        });
      }
      map[drug.id] = maxVal;
    });
    return map;
  }, [activeDrugs, timeSeries]);

  // 4. Calculate metabolic intensity matrix for every (drug, enzyme) pair at current time
  const matrixData = useMemo(() => {
    const cells: InteractionCellData[] = [];

    activeDrugs.forEach((drug) => {
      const cMax = drugCMaxMap[drug.id] || 1.0;
      const currentConc = currentPoint?.concentrations?.[drug.id] || 0;

      standardEnzymeNames.forEach((enzName) => {
        // Find if drug interacts with this enzyme
        const roleEntry = drug.enzymes?.find(
          (e) =>
            e.name.toLowerCase() === enzName.toLowerCase() ||
            enzName.toLowerCase().includes(e.name.toLowerCase()) ||
            e.name.toLowerCase().includes(enzName.toLowerCase())
        );

        // Enzyme residual activity at current time
        const enzActivity =
          currentPoint?.enzymeActivities?.[enzName] ??
          enzymes.find((e) => e.name.toLowerCase() === enzName.toLowerCase())?.currentActivity ??
          100;

        let role: InteractionCellData['role'] = 'none';
        let intensity = 0;
        let isBottleneck = false;
        let clinicalImpact = 'No direct metabolic interaction annotated.';

        if (roleEntry) {
          role = roleEntry.role;
          const conc = currentConc;

          if (conc > 0.0001) {
            if (role === 'inhibitor_strong') {
              const ki = roleEntry.inhibitionConstantKiUm || 0.4;
              // Competitive inhibition occupancy equation
              intensity = Math.min(100, Math.round(((conc * 3.0) / (ki + conc * 3.0)) * 100));
              clinicalImpact = `${drug.genericName} exerts potent competitive blockade of ${enzName} (Ki=${ki} µM) at plasma concentration ${conc.toFixed(3)} mg/L, suppressing metabolic clearance of co-administered substrates.`;
            } else if (role === 'inhibitor_moderate') {
              const ki = roleEntry.inhibitionConstantKiUm || 1.5;
              intensity = Math.min(100, Math.round(((conc * 1.5) / (ki + conc * 1.5)) * 100));
              clinicalImpact = `${drug.genericName} causes moderate competitive inhibition on ${enzName} (Ki=${ki} µM), creating risk of elevated partner drug exposure.`;
            } else if (role === 'inhibitor_weak') {
              intensity = Math.min(100, Math.round((conc / (5.0 + conc)) * 100));
              clinicalImpact = `${drug.genericName} exhibits mild allosteric/competitive inhibition on ${enzName}.`;
            } else if (role === 'inducer') {
              const lag = Math.min(1.0, Math.pow(currentTimeHours / 18, 2));
              intensity = Math.min(100, Math.round((conc / (2.0 + conc)) * lag * 100));
              clinicalImpact = `${drug.genericName} upregulates mRNA expression of ${enzName} via nuclear receptor induction, accelerating substrate degradation.`;
            } else if (role === 'substrate') {
              const normRatio = Math.min(1.0, conc / Math.max(0.01, cMax));
              const turnoverActivity = Math.min(1.2, enzActivity / 100);
              intensity = Math.min(100, Math.round(normRatio * 100 * turnoverActivity));

              // Detect clearance bottleneck: high substrate load but depressed enzyme activity
              if (conc > 0.25 * cMax && enzActivity < 65) {
                isBottleneck = true;
                clinicalImpact = `CRITICAL BOTTLENECK: ${drug.genericName} is accumulating because its primary clearing enzyme ${enzName} is currently operating at only ${enzActivity}% activity due to concurrent inhibition.`;
              } else {
                clinicalImpact = `${drug.genericName} is undergoing active phase-I/II enzymatic turnover by ${enzName} with current flux rate of ${intensity}% capacity.`;
              }
            }
          } else {
            intensity = 0;
            clinicalImpact = `${drug.genericName} is an annotated ${role.replace('_', ' ')} of ${enzName}, but plasma concentration is currently negligible at t=${currentTimeHours.toFixed(1)}h.`;
          }
        }

        cells.push({
          drugId: drug.id,
          drugName: drug.genericName,
          drugClass: drug.drugClass,
          enzymeId: enzName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          enzymeName: enzName,
          role,
          intensity,
          currentConc,
          cMax,
          enzymeActivityPct: enzActivity,
          isBottleneck,
          clinicalImpact,
          ki: roleEntry?.inhibitionConstantKiUm,
          inductionFactor: roleEntry?.inductionFactor,
        });
      });
    });

    return cells;
  }, [activeDrugs, standardEnzymeNames, currentPoint, drugCMaxMap, currentTimeHours, enzymes]);

  // 5. Filtered interactions
  const filteredInteractions = useMemo(() => {
    return matrixData.filter((item) => {
      if (filterMode === 'high_intensity') {
        return item.intensity >= 40 || item.isBottleneck;
      }
      if (filterMode === 'substrates') {
        return item.role === 'substrate';
      }
      if (filterMode === 'inhibitors') {
        return item.role.includes('inhibitor');
      }
      if (filterMode === 'inducers') {
        return item.role === 'inducer';
      }
      return true;
    });
  }, [matrixData, filterMode]);

  // 6. Ranked active interactions (highest to lowest intensity)
  const rankedInteractions = useMemo(() => {
    return [...matrixData]
      .filter((i) => i.role !== 'none' && i.intensity > 0)
      .sort((a, b) => {
        // Bottlenecks first, then by intensity
        if (a.isBottleneck && !b.isBottleneck) return -1;
        if (!a.isBottleneck && b.isBottleneck) return 1;
        return b.intensity - a.intensity;
      });
  }, [matrixData]);

  // 7. Aggregate summary statistics at current simulation time
  const summaryStats = useMemo(() => {
    const activePairs = matrixData.filter((i) => i.role !== 'none' && i.intensity > 0);
    const peakPair = [...activePairs].sort((a, b) => b.intensity - a.intensity)[0] || null;
    const bottleneckCount = matrixData.filter((i) => i.isBottleneck).length;
    const avgLoad =
      activePairs.length > 0
        ? Math.round(activePairs.reduce((s, i) => s + i.intensity, 0) / activePairs.length)
        : 0;

    return {
      activePairsCount: activePairs.length,
      peakPair,
      bottleneckCount,
      avgLoad,
    };
  }, [matrixData]);

  // Heatmap Color scale helper
  const getIntensityColor = (intensity: number, role: InteractionCellData['role'], isBottleneck: boolean) => {
    if (role === 'none') {
      return {
        bg: 'bg-slate-900/40 hover:bg-slate-900/80',
        border: 'border-slate-800/40',
        text: 'text-slate-600',
        badge: 'bg-slate-800/50 text-slate-500',
      };
    }

    if (intensity === 0) {
      return {
        bg: 'bg-slate-900/60 hover:bg-slate-850',
        border: 'border-slate-800/70',
        text: 'text-slate-500',
        badge: 'bg-slate-800 text-slate-400',
      };
    }

    if (isBottleneck) {
      return {
        bg: 'bg-rose-950/80 hover:bg-rose-900/90 shadow-md shadow-rose-950/60 animate-pulse',
        border: 'border-rose-500/80',
        text: 'text-rose-200 font-bold',
        badge: 'bg-rose-600 text-white font-bold',
      };
    }

    if (intensity >= 80) {
      return {
        bg: 'bg-rose-950/70 hover:bg-rose-900/80 shadow-sm shadow-rose-950/40',
        border: 'border-rose-500/70',
        text: 'text-rose-200 font-bold',
        badge: 'bg-rose-500 text-white',
      };
    }

    if (intensity >= 55) {
      return {
        bg: 'bg-amber-950/60 hover:bg-amber-900/70',
        border: 'border-amber-500/60',
        text: 'text-amber-200 font-semibold',
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      };
    }

    if (intensity >= 25) {
      return {
        bg: 'bg-cyan-950/50 hover:bg-cyan-900/60',
        border: 'border-cyan-500/50',
        text: 'text-cyan-200',
        badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
      };
    }

    return {
      bg: 'bg-emerald-950/40 hover:bg-emerald-900/50',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    };
  };

  const formatRoleLabel = (role: InteractionCellData['role']) => {
    switch (role) {
      case 'substrate':
        return 'Substrate';
      case 'inhibitor_strong':
        return 'Strong Inh';
      case 'inhibitor_moderate':
        return 'Mod Inh';
      case 'inhibitor_weak':
        return 'Weak Inh';
      case 'inducer':
        return 'Inducer';
      default:
        return 'None';
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-cyan-500/20 border border-amber-500/30">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Metabolic Intensity Heatmap
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-500/40">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Live t = {currentTimeHours.toFixed(1)}h
                </span>
                {isPlaying && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ODE Flux
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time drug-enzyme kinetic flux, competitive CYP inhibition saturation, and metabolic clearance bottlenecks at the current simulation time.
              </p>
            </div>
          </div>
        </div>

        {/* View & Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode (Grid vs Ranking) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="2D Drug x Enzyme Heatmap Matrix"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('ranking')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'ranking'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ranked Active Interactions by Intensity"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Ranked ({rankedInteractions.length})</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('high_intensity')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                filterMode === 'high_intensity'
                  ? 'bg-rose-950 text-rose-300 border-rose-500/60'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-rose-300'
              }`}
            >
              High Intensity &gt;40%
            </button>
            <button
              onClick={() => setFilterMode('substrates')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                filterMode === 'substrates'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-cyan-300'
              }`}
            >
              Substrates
            </button>
            <button
              onClick={() => setFilterMode('inhibitors')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                filterMode === 'inhibitors'
                  ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-amber-300'
              }`}
            >
              Inhibitors
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metabolic Ribbon at Current Time */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Active Kinetic Pairs
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-cyan-300">
              {summaryStats.activePairsCount}
            </span>
            <span className="text-[10px] text-slate-500">at t={currentTimeHours.toFixed(1)}h</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Clearance Bottlenecks
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold font-mono ${
                summaryStats.bottleneckCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summaryStats.bottleneckCount}
            </span>
            <span className="text-[10px] text-slate-500">
              {summaryStats.bottleneckCount > 0 ? 'Impaired pathway' : 'Free clearance'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Peak Intensity Pair
          </span>
          <div className="mt-1 truncate">
            {summaryStats.peakPair ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold font-mono text-amber-300 truncate">
                  {summaryStats.peakPair.drugName} → {summaryStats.peakPair.enzymeName}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-500/30">
                  {summaryStats.peakPair.intensity}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">None active</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Mean Metabolic Burden
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {summaryStats.avgLoad}%
            </span>
            <span className="text-[10px] text-slate-500">system capacity load</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Content */}
      {activeDrugs.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
          <Activity className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No Active Drugs Selected for Simulation</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select medications from the library or load a clinical polypharmacy preset to generate live drug-enzyme metabolic intensity mappings.
          </p>
          {onLoadPreset && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => onLoadPreset(['warfarin', 'amiodarone', 'simvastatin'])}
                className="px-3 py-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/50 text-xs font-medium cursor-pointer"
              >
                Load Warfarin + Amiodarone + Statin
              </button>
              <button
                onClick={() => onLoadPreset(['fluconazole', 'warfarin', 'omeprazole'])}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              >
                Load Fluconazole + Warfarin
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* 2D Heatmap Matrix View */
        <div className="space-y-3">
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-2.5 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono w-44">
                    Active Drug
                  </th>
                  {standardEnzymeNames.map((enzName) => {
                    const enz = enzymes.find((e) => e.name.toLowerCase() === enzName.toLowerCase());
                    const act = currentPoint?.enzymeActivities?.[enzName] ?? enz?.currentActivity ?? 100;
                    let actColor = 'text-emerald-400';
                    if (act < 40) actColor = 'text-rose-400';
                    else if (act < 70) actColor = 'text-amber-400';

                    return (
                      <th key={enzName} className="py-2.5 px-2 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-200 font-mono">
                            {enzName}
                          </span>
                          <span className={`text-[10px] font-mono ${actColor}`}>
                            {act}% act
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeDrugs.map((drug) => {
                  const conc = currentPoint?.concentrations?.[drug.id] || 0;
                  const cMax = drugCMaxMap[drug.id] || 1.0;
                  const concPct = Math.min(100, Math.round((conc / cMax) * 100));

                  return (
                    <tr key={drug.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Drug Row Header */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {drug.genericName}
                            </span>
                            {onToggleActiveDrug && (
                              <button
                                onClick={() => onToggleActiveDrug(drug.id)}
                                className="text-slate-500 hover:text-rose-400 text-[10px] cursor-pointer"
                                title="Remove drug from simulation"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                            {drug.drugClass.split('/')[1] || drug.drugClass}
                          </span>
                          <div className="flex items-center gap-1 pt-0.5">
                            <span className="text-[10px] font-mono text-cyan-400">
                              {conc.toFixed(3)} mg/L
                            </span>
                            <span className="text-[9px] text-slate-500">
                              ({concPct}% Cmax)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Enzyme Interaction Matrix Cells */}
                      {standardEnzymeNames.map((enzName) => {
                        const cell = matrixData.find(
                          (c) => c.drugId === drug.id && c.enzymeName === enzName
                        );
                        if (!cell) {
                          return <td key={enzName} className="p-1 text-center">-</td>;
                        }

                        const color = getIntensityColor(cell.intensity, cell.role, cell.isBottleneck);
                        const isSelected =
                          selectedCell?.drugId === cell.drugId && selectedCell?.enzymeName === cell.enzymeName;

                        return (
                          <td key={enzName} className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedCell(isSelected ? null : cell)}
                              className={`w-full h-14 rounded-xl border p-1.5 flex flex-col items-center justify-between transition-all cursor-pointer relative group ${
                                color.bg
                              } ${color.border} ${
                                isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950 scale-[1.03]' : ''
                              }`}
                              title={`${drug.genericName} × ${enzName}: ${cell.role.replace('_', ' ')} (${cell.intensity}% intensity)`}
                            >
                              {/* Top Role Badge */}
                              <div className="w-full flex items-center justify-between gap-1 text-[9px] font-mono">
                                <span className={`px-1 py-0.2 rounded truncate ${color.badge}`}>
                                  {formatRoleLabel(cell.role)}
                                </span>
                                {cell.isBottleneck && (
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 animate-bounce" />
                                )}
                              </div>

                              {/* Center Intensity Value */}
                              <div className="flex items-baseline gap-0.5">
                                <span className={`text-sm font-black font-mono ${color.text}`}>
                                  {cell.intensity > 0 ? `${cell.intensity}%` : '—'}
                                </span>
                              </div>

                              {/* Mini Intensity Bar at bottom */}
                              <div className="w-full h-1 rounded-full bg-slate-800/80 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    cell.isBottleneck
                                      ? 'bg-rose-500'
                                      : cell.intensity > 70
                                      ? 'bg-rose-400'
                                      : cell.intensity > 40
                                      ? 'bg-amber-400'
                                      : 'bg-cyan-400'
                                  }`}
                                  style={{ width: `${cell.intensity}%` }}
                                />
                              </div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Color Scale Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Metabolic Intensity Scale:</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
                  0% Inactive
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  1-25% Low
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                  26-55% Mod
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                  56-80% High
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 font-bold">
                  &gt;80% Peak
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white font-bold animate-pulse">
                  ⚠ Bottleneck
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">Click any cell for clinical kinetic audit</span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('enzymes')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Full Enzyme Kinetics Panel <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Ranked Active Interactions View */
        <div className="space-y-2.5">
          {rankedInteractions.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
              No active kinetic interactions with intensity &gt; 0% at current time t={currentTimeHours.toFixed(1)}h.
            </div>
          ) : (
            rankedInteractions.map((item, index) => {
              const color = getIntensityColor(item.intensity, item.role, item.isBottleneck);
              const isSelected =
                selectedCell?.drugId === item.drugId && selectedCell?.enzymeName === item.enzymeName;

              return (
                <div
                  key={`${item.drugId}-${item.enzymeName}`}
                  onClick={() => setSelectedCell(isSelected ? null : item)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    color.bg
                  } ${color.border} ${
                    isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-850 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {item.drugName}
                          </span>
                          <span className="text-slate-500 font-mono text-xs">→</span>
                          <span className="font-bold text-cyan-300 text-xs sm:text-sm font-mono">
                            {item.enzymeName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${color.badge}`}>
                            {formatRoleLabel(item.role)}
                          </span>
                          {item.isBottleneck && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold font-mono animate-pulse">
                              BOTTLENECK
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {item.clinicalImpact}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={`text-lg font-black font-mono ${color.text}`}>
                          {item.intensity}%
                        </span>
                        <span className="text-[10px] text-slate-500">intensity</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        C(t): {item.currentConc.toFixed(3)} mg/L
                      </span>
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="mt-2 w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isBottleneck
                          ? 'bg-rose-500'
                          : item.intensity > 70
                          ? 'bg-rose-400'
                          : item.intensity > 40
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`}
                      style={{ width: `${item.intensity}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Interaction Inspector Detail Card */}
      {selectedCell && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Pharmacokinetic Interaction Audit: {selectedCell.drugName} × {selectedCell.enzymeName}
              </h4>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-0.5 rounded hover:bg-slate-800"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Drug Profile</span>
              <span className="font-bold text-white text-sm block">{selectedCell.drugName}</span>
              <span className="text-[11px] text-cyan-300 block">{selectedCell.drugClass}</span>
              <div className="pt-1 text-[10px] font-mono text-slate-400 space-y-0.5">
                <div>Plasma Level: <strong className="text-white">{selectedCell.currentConc.toFixed(3)} mg/L</strong></div>
                <div>Relative Cmax: <strong className="text-white">{Math.round((selectedCell.currentConc / Math.max(0.01, selectedCell.cMax)) * 100)}%</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Enzyme Status</span>
              <span className="font-bold text-cyan-300 text-sm font-mono block">{selectedCell.enzymeName}</span>
              <span className="text-[11px] text-slate-300 block">
                Residual Activity: <strong className="text-white font-mono">{selectedCell.enzymeActivityPct}%</strong>
              </span>
              <div className="pt-1 text-[10px] font-mono text-slate-400 space-y-0.5">
                <div>Role: <strong className="text-cyan-300 uppercase">{selectedCell.role.replace('_', ' ')}</strong></div>
                {selectedCell.ki && <div>Affinity (Ki): <strong className="text-white">{selectedCell.ki} µM</strong></div>}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Intensity Rating</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-amber-300">
                  {selectedCell.intensity}%
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedCell.isBottleneck
                    ? 'Clearance Bottleneck'
                    : selectedCell.intensity > 70
                    ? 'Peak Saturation'
                    : selectedCell.intensity > 30
                    ? 'Active Turnover'
                    : 'Low/Sub-therapeutic'}
                </span>
              </div>
              <div className="pt-1">
                {selectedCell.isBottleneck ? (
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50 text-[10px] font-bold block">
                    Severe clearance delay detected
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 block">
                    Metabolic capacity within manageable range
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white block mb-1">Clinical Evaluation at t={currentTimeHours.toFixed(1)}h:</span>
            {selectedCell.clinicalImpact}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 text-xs">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('simulation')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer text-xs"
              >
                Adjust Dosage in Workbench
              </button>
            )}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('enzymes')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium cursor-pointer text-xs"
              >
                Monitor CYP Enzyme Flux
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
