import React, { useMemo } from 'react';
import { Medicine, EnzymeProfile, AdrPrediction, BiomedicalGraph, PatientContext, PkTimePoint } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DashboardPkChart } from './DashboardPkChart';
import { MetabolicHazardNotification } from './MetabolicHazardNotification';
import { MetabolicIntensityHeatmap } from './MetabolicIntensityHeatmap';
import { RealTimeInteractionAlertSystem } from './RealTimeInteractionAlertSystem';
import { calculatePairwiseMetabolicHazards } from '../engine/metabolicHazardEngine';
import { validateDosageSafety } from '../data/dosageSafetyGuidelines';
import { getDefaultDoseMg } from '../engine/admeCascade';
import { RegimenStickyNotes } from './RegimenStickyNotes';
import {
  Activity,
  AlertTriangle,
  AlertOctagon,
  Pill,
  Sparkles,
  GitBranch,
  Radio,
  FileText,
  Clock,
  Mic,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Dna,
} from 'lucide-react';

interface DashboardProps {
  activeDrugs: Medicine[];
  enzymes: EnzymeProfile[];
  predictions: AdrPrediction[];
  graph: BiomedicalGraph;
  currentTimeHours: number;
  durationHours?: number;
  timeSeries: PkTimePoint[];
  isPlaying: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenReport: () => void;
  onToggleActiveDrug: (drugId: string) => void;
  onLoadPreset?: (drugIds: string[]) => void;
  patientContext?: PatientContext;
  drugDosages?: Record<string, number>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeDrugs,
  enzymes,
  predictions,
  graph,
  currentTimeHours,
  durationHours = 48,
  timeSeries,
  isPlaying,
  onNavigateTab,
  onOpenReport,
  onToggleActiveDrug,
  onLoadPreset,
  patientContext,
  drugDosages,
}) => {
  const { t, translate, currentLanguage } = useLanguage();

  // Aggregate system indicators
  const activeCount = activeDrugs.length;
  const interactionEdgesCount = graph.edges.filter((e) => e.relation === 'interacts_with' || e.relation === 'inhibits').length;
  const criticalAdrsCount = predictions.filter((p) => p.severity === 'Critical' || p.severity === 'High').length;

  // Average CYP enzyme activity
  const avgEnzymeActivity = Math.round(
    enzymes.reduce((sum, e) => sum + e.currentActivity, 0) / Math.max(1, enzymes.length)
  );

  // High-severity interacting drugs lookup for direct warning badges
  const highSeverityInteractingDrugIds = useMemo(() => {
    const set = new Set<string>();
    if (!activeDrugs || activeDrugs.length < 2) return set;

    const summary = calculatePairwiseMetabolicHazards(
      activeDrugs,
      enzymes,
      timeSeries,
      currentTimeHours,
      55,
      patientContext
    );

    summary.alerts.forEach((alert) => {
      if (alert.severity === 'critical' || alert.severity === 'high' || alert.hazardScore >= 55) {
        set.add(alert.drugA.id);
        set.add(alert.drugB.id);
      }
    });

    for (let i = 0; i < activeDrugs.length; i++) {
      for (let j = i + 1; j < activeDrugs.length; j++) {
        const dA = activeDrugs[i];
        const dB = activeDrugs[j];
        const hasKnown =
          dA.knownInteractions?.some(
            (k) =>
              (k.severity === 'contraindicated' || k.severity === 'major') &&
              (k.partnerDrug.toLowerCase() === dB.genericName.toLowerCase() ||
                dB.brandNames?.some((b) => b.toLowerCase() === k.partnerDrug.toLowerCase()))
          ) ||
          dB.knownInteractions?.some(
            (k) =>
              (k.severity === 'contraindicated' || k.severity === 'major') &&
              (k.partnerDrug.toLowerCase() === dA.genericName.toLowerCase() ||
                dA.brandNames?.some((b) => b.toLowerCase() === k.partnerDrug.toLowerCase()))
          );
        if (hasKnown) {
          set.add(dA.id);
          set.add(dB.id);
        }
      }
    }

    return set;
  }, [activeDrugs, enzymes, timeSeries, currentTimeHours, patientContext]);

  // Dosage Safety Validations against Clinical Maximum Daily Guidelines
  const dosageSafetyViolations = useMemo(() => {
    if (!activeDrugs || activeDrugs.length === 0) return [];
    return activeDrugs
      .map((drug) => {
        const currentDose =
          drugDosages?.[drug.id] !== undefined
            ? drugDosages[drug.id]
            : getDefaultDoseMg(drug);
        const validation = validateDosageSafety(drug, currentDose, patientContext);
        return { drug, currentDose, validation };
      })
      .filter((item) => item.validation.status === 'critical' || item.validation.status === 'warning');
  }, [activeDrugs, drugDosages, patientContext]);

  const criticalDosagesCount = dosageSafetyViolations.filter((v) => v.validation.status === 'critical').length;

  return (
    <div className="space-y-6">
      {/* High-Priority Dosage Safety Alert Banner when any drug exceeds max safe daily dose */}
      {criticalDosagesCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-rose-200 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-900 border border-rose-500 flex items-center justify-center text-rose-300 shrink-0 animate-pulse">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-2">
                <span>{translate('Dosage Safety Alert')}: {criticalDosagesCount} {criticalDosagesCount > 1 ? 'Medications Exceed' : 'Medication Exceeds'} Safety Guidelines</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-900 text-white border border-rose-500">
                  {translate('Dosage Safety Alert')}
                </span>
              </div>
              <p className="text-[11px] text-rose-200/90 mt-0.5">
                {dosageSafetyViolations
                  .filter((v) => v.validation.status === 'critical')
                  .map((v) => `${v.drug.genericName} (${v.currentDose} mg > max safe ${v.validation.maxRecommendedDoseMg} mg)`)
                  .join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('simulation')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs cursor-pointer shrink-0 transition-colors shadow-md flex items-center gap-1.5"
          >
            {translate('Adjust in Workbench')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real-Time KPI Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md cursor-help"
          title={t.tooltip_drugs_cached}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>{t.dash_active_drugs.toUpperCase()}</span>
            <Pill className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">{activeCount.toString().padStart(2, '0')}</div>
          <span className="text-[10px] text-slate-500 block truncate mt-1">Multi-drug Regimen</span>
        </div>

        <div
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md cursor-help"
          title={t.kg_subtitle}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>{t.dash_kg_interactions.toUpperCase()}</span>
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">{graph.edges.length.toString().padStart(2, '0')}</div>
          <span className="text-[10px] text-slate-500 block truncate mt-1">Active graph edges</span>
        </div>

        <div
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md cursor-help"
          title={t.adr_subtitle}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>{t.dash_critical_adrs.toUpperCase()}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400 font-mono">{criticalAdrsCount.toString().padStart(2, '0')}</div>
          <span className="text-[10px] text-rose-400/70 block truncate mt-1">
            {criticalAdrsCount > 0 ? 'High-risk flags active' : 'Optimal tolerance'}
          </span>
        </div>

        <div
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md cursor-help"
          title={t.enz_subtitle}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>{t.dash_cyp_activity.toUpperCase()}</span>
            <Radio className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">{avgEnzymeActivity}%</div>
          <span className="text-[10px] text-slate-500 block truncate mt-1">
            {avgEnzymeActivity < 70 ? 'Significant inhibition' : 'Normal capacity'}
          </span>
        </div>

        <div
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md col-span-2 sm:col-span-1 cursor-help"
          title={t.tooltip_time_scrubber}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>{t.dash_simulation_time.toUpperCase()}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">{currentTimeHours.toFixed(1)}h</div>
          <span className="text-[10px] text-slate-500 block truncate mt-1">
            {isPlaying ? '● Live ODE Engine' : 'Paused Scrubber'}
          </span>
        </div>
      </div>

      {/* Active Regimen & Patient Scenario Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Regimen Drugs */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
              {translate('Active Regimen:')}
            </span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {activeDrugs.length === 0 ? (
                <span className="text-slate-500 italic">{translate('No drugs selected for active simulation.')}</span>
              ) : (
                activeDrugs.map((d) => {
                  const hasHazard = highSeverityInteractingDrugIds.has(d.id);
                  const doseVal = dosageSafetyViolations.find((v) => v.drug.id === d.id);
                  const isDoseCritical = doseVal?.validation.status === 'critical';
                  const isDoseWarning = doseVal?.validation.status === 'warning';
                  return (
                    <span
                      key={d.id}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                        isDoseCritical
                          ? 'bg-rose-950 text-rose-200 border-2 border-rose-500 shadow-sm shadow-rose-950/60 ring-1 ring-rose-500/50'
                          : isDoseWarning
                          ? 'bg-amber-950 text-amber-200 border border-amber-500/80'
                          : hasHazard
                          ? 'bg-rose-950 text-rose-200 border-2 border-rose-500/80 shadow-sm shadow-rose-950/60'
                          : 'bg-cyan-950 text-cyan-200 border border-cyan-500/40'
                      }`}
                    >
                      {isDoseCritical ? (
                        <span
                          title={`Dose of ${doseVal?.currentDose}mg exceeds max recommended daily dose of ${doseVal?.validation.maxRecommendedDoseMg}mg!`}
                          className="flex items-center text-rose-400"
                        >
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        </span>
                      ) : isDoseWarning ? (
                        <span
                          title={`High dose warning: ${doseVal?.currentDose}mg is elevated`}
                          className="flex items-center text-amber-400"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      ) : hasHazard ? (
                        <span
                          title="Critical/high-severity drug interaction detected with partner drug in regimen"
                          className="flex items-center text-rose-400"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
                        </span>
                      ) : null}
                      <span>{d.genericName}</span>
                      {doseVal && (
                        <span className={`text-[10px] font-mono px-1 rounded ${isDoseCritical ? 'bg-rose-900 text-rose-200 font-bold' : 'bg-amber-900 text-amber-200'}`}>
                          {doseVal.currentDose}mg
                        </span>
                      )}
                      <button
                        onClick={() => onToggleActiveDrug(d.id)}
                        className="text-cyan-400 hover:text-rose-400 cursor-pointer ml-0.5"
                        title="Remove from simulation"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('simulation')}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 shrink-0 cursor-pointer text-xs"
          >
            {translate('Workbench')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Patient Profile Scenario */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300">
              <Dna className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">
                  {patientContext?.age || 60}yo {patientContext?.gender || 'male'} · {patientContext?.weightKg || 70}kg
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  eGFR {patientContext?.renalFunctionEgfr || 90}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                  2D6: {patientContext?.cyp2d6Genotype?.replace('_metabolizer', '') || 'normal'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                Hepatic: {patientContext?.hepaticFunction?.replace('_', ' ') || 'normal'} · 2C19: {patientContext?.cyp2c19Genotype?.replace('_metabolizer', '') || 'normal'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('patients')}
            className="text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-1 shrink-0 cursor-pointer text-xs"
          >
            {translate('Patient Library')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-Time Metabolic Hazard Notification System (Warning Card on Threshold Breach) */}
      <MetabolicHazardNotification
        activeDrugs={activeDrugs}
        enzymes={enzymes}
        timeSeries={timeSeries}
        currentTimeHours={currentTimeHours}
        patientContext={patientContext}
        onToggleActiveDrug={onToggleActiveDrug}
        onNavigateTab={onNavigateTab}
      />

      {/* Regimen Sticky Notes: Persistent Clinical Annotations for Current Regimen */}
      <RegimenStickyNotes
        activeDrugs={activeDrugs}
        onNavigateTab={onNavigateTab}
      />

      {/* Dynamic Multi-Drug Concentration-Time Curves (PK/PD via Recharts) */}
      <DashboardPkChart
        timeSeries={timeSeries}
        activeDrugs={activeDrugs}
        currentTimeHours={currentTimeHours}
        durationHours={durationHours}
        onNavigateToWorkbench={() => onNavigateTab('simulation')}
        onLoadPreset={onLoadPreset}
        onToggleActiveDrug={onToggleActiveDrug}
      />

      {/* Visual Metabolic Intensity Heatmap (Drug-Enzyme Kinetic Interactions at Current Time) */}
      <MetabolicIntensityHeatmap
        activeDrugs={activeDrugs}
        enzymes={enzymes}
        timeSeries={timeSeries}
        currentTimeHours={currentTimeHours}
        durationHours={durationHours}
        isPlaying={isPlaying}
        onNavigateTab={onNavigateTab}
        onToggleActiveDrug={onToggleActiveDrug}
        onLoadPreset={onLoadPreset}
      />

      {/* Main Split: Left Column (Graph + Enzymes) & Right Column (ADR Signals + AI Copilot) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Knowledge Graph Card Snapshot */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">{translate('Dynamic Biomedical Knowledge Graph Snapshot')}</h3>
              </div>
              <button
                onClick={() => onNavigateTab('knowledge_graph')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {translate('Full Graph Explorer')} <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Compact Graph Visualization Preview */}
            <div className="h-64 rounded-xl bg-slate-950 border border-slate-800/80 relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full">
                {/* Connecting Edges */}
                {graph.edges.slice(0, 20).map((edge, edgeIdx) => {
                  const s = graph.nodes.find((n) => n.id === edge.source);
                  const t = graph.nodes.find((n) => n.id === edge.target);
                  if (!s || !t || s.x === undefined || t.x === undefined || s.y === undefined || t.y === undefined) return null;
                  return (
                    <line
                      key={`dash_edge_${edge.id}_${edgeIdx}`}
                      x1={s.x * 0.8}
                      y1={s.y * 0.45}
                      x2={t.x * 0.8}
                      y2={t.y * 0.45}
                      stroke="#334155"
                      strokeWidth={1.2}
                    />
                  );
                })}

                {/* Nodes */}
                {graph.nodes.slice(0, 16).map((node, nodeIdx) => {
                  if (node.x === undefined || node.y === undefined) return null;
                  const isDrug = node.type === 'drug';
                  const isEnzyme = node.type === 'enzyme';
                  const fill = isDrug ? '#0891b2' : isEnzyme ? '#7c3aed' : '#059669';

                  return (
                    <g key={`dash_node_${node.id}_${nodeIdx}`} transform={`translate(${node.x * 0.8}, ${node.y * 0.45})`}>
                      <circle r={isDrug ? 14 : 10} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
                      <text y={isDrug ? 20 : 16} textAnchor="middle" fill="#cbd5e1" fontSize={8} fontWeight={600}>
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                {translate('Interactive Canvas Preview')}
              </div>
            </div>
          </div>

          {/* Enzyme Flux Grid Preview */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">{translate('Key Cytochrome P450 Metabolic Indicators')}</h3>
              </div>
              <button
                onClick={() => onNavigateTab('enzymes')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {translate('Full Monitoring Panel')} <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {enzymes.slice(0, 4).map((enz) => {
                const act = enz.currentActivity;
                let color = 'text-emerald-400';
                if (act < 30) color = 'text-rose-400';
                else if (act < 70) color = 'text-amber-400';

                return (
                  <div key={enz.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="font-bold text-slate-300 block">{enz.name}</span>
                    <span className={`text-xl font-black ${color}`}>{act}%</span>
                    <span className="text-[10px] text-slate-500 block truncate">{enz.interactionStatus}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: ADR Predictions & Voice AI Assistant Callout */}
        <div className="space-y-6">
          {/* Adverse Drug Reaction Alerts */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-sm">{translate('Predicted ADR Risk Signals')}</h3>
              </div>
              <button
                onClick={() => onNavigateTab('adr_xai')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer text-xs"
              >
                {translate('XAI Attribution')} <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {predictions.slice(0, 4).map((adr) => (
                <div key={adr.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{adr.label}</span>
                    <span className="font-mono text-rose-400 font-bold">{(adr.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${adr.probability * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block line-clamp-1">{adr.causalExplanation[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Voice / Assistant Callout Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/40 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">{t.chat_title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ask natural questions about drug-drug interactions, CYP enzyme inhibition, or tap the microphone for multilingual voice conversation in {currentLanguage.nativeName}.
            </p>

            <button
              onClick={() => onNavigateTab('ai_assistant')}
              title={t.tooltip_voice_mic}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-cyan-950 transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Launch {t.nav_ai_assistant} ({currentLanguage.nativeName})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Real-Time Pop-Up Notification & Floating Alert Center */}
      <RealTimeInteractionAlertSystem
        activeDrugs={activeDrugs}
        enzymes={enzymes}
        timeSeries={timeSeries}
        currentTimeHours={currentTimeHours}
        patientContext={patientContext}
        onToggleActiveDrug={onToggleActiveDrug}
        onNavigateTab={onNavigateTab}
        onOpenReport={onOpenReport}
      />
    </div>
  );
};
