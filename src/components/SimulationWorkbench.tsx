import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Medicine, PatientContext, PkTimePoint, EnzymeProfile, AdrPrediction, RegimenBaseline, PatientProfilePreset, ClinicalInteractionNote } from '../types';
import { LanguageInfo } from '../data/languagesData';
import { getTranslation } from '../data/translations';
import { storageService } from '../services/storageService';
import { getDefaultDoseMg, getDrugDoseRange, DrugDoseRange } from '../engine/admeCascade';
import { validateDosageSafety, DOSAGE_SAFETY_GUIDELINES, DosageValidationResult } from '../data/dosageSafetyGuidelines';
import { SimulationTimeline } from './SimulationTimeline';
import { PkCurvesChart } from './PkCurvesChart';
import { RegimenComparisonPanel } from './RegimenComparisonPanel';
import { ClinicalInteractionNotesPanel } from './ClinicalInteractionNotesPanel';
import {
  Activity,
  User,
  Sliders,
  Sparkles,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Flame,
  GitCompare,
  BookmarkCheck,
  Bookmark,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Check,
  Upload,
  FileJson,
  AlertCircle,
  Scale,
  TrendingDown,
  TrendingUp,
  Dna,
  Info,
} from 'lucide-react';

interface SimulationWorkbenchProps {
  medicines: Medicine[];
  activeDrugs: Medicine[];
  patientContext: PatientContext;
  setPatientContext: React.Dispatch<React.SetStateAction<PatientContext>>;
  currentTimeHours: number;
  durationHours: number;
  isPlaying: boolean;
  playbackSpeed: number;
  timeSeries: PkTimePoint[];
  liveEnzymes: EnzymeProfile[];
  predictions?: AdrPrediction[];
  currentLanguage?: LanguageInfo;
  drugDosages?: Record<string, number>;
  onUpdateDrugDose?: (drugId: string, doseMg: number) => void;
  onResetDrugDoses?: () => void;
  onPlayToggle: () => void;
  onReset: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleActiveDrug: (drugId: string) => void;
  onLoadPreset: (drugIds: string[]) => void;
  onClearRegimen: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SimulationWorkbench: React.FC<SimulationWorkbenchProps> = ({
  medicines,
  activeDrugs,
  patientContext,
  setPatientContext,
  currentTimeHours,
  durationHours,
  isPlaying,
  playbackSpeed,
  timeSeries,
  liveEnzymes,
  predictions = [],
  currentLanguage,
  drugDosages: externalDrugDosages,
  onUpdateDrugDose: externalOnUpdateDrugDose,
  onResetDrugDoses: externalOnResetDrugDoses,
  onPlayToggle,
  onReset,
  onSeek,
  onSpeedChange,
  onToggleActiveDrug,
  onLoadPreset,
  onClearRegimen,
  onNavigateTab,
}) => {
  const langCode = currentLanguage?.code || 'en';
  const t = getTranslation(langCode);

  const [workbenchView, setWorkbenchView] = useState<'single' | 'compare'>('single');
  const [baseline, setBaseline] = useState<RegimenBaseline | null>(null);
  const [selectedAddDrugId, setSelectedAddDrugId] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Individual Drug Dosages State (Fallback to localStorage if not supplied via props)
  const [internalDrugDosages, setInternalDrugDosages] = useState<Record<string, number>>(() => storageService.getDrugDosages());
  // Local string state to support smooth typing in numerical input fields
  const [localInputStrings, setLocalInputStrings] = useState<Record<string, string>>({});

  const activeDrugDosages = externalDrugDosages ?? internalDrugDosages;

  const handleDoseChange = (drugId: string, doseMg: number) => {
    const clampedDose = Math.max(0, doseMg);
    if (externalOnUpdateDrugDose) {
      externalOnUpdateDrugDose(drugId, clampedDose);
    } else {
      const updated = storageService.updateDrugDose(drugId, clampedDose);
      setInternalDrugDosages(updated);
    }
  };

  const handleResetAllDoses = () => {
    if (externalOnResetDrugDoses) {
      externalOnResetDrugDoses();
    } else {
      const updated = storageService.resetDrugDoses();
      setInternalDrugDosages(updated);
    }
  };

  const adjustedDosesCount = useMemo(() => {
    return activeDrugs.filter((drug) => {
      const def = getDefaultDoseMg(drug);
      const cur = activeDrugDosages[drug.id];
      return cur !== undefined && Math.abs(cur - def) > 0.001;
    }).length;
  }, [activeDrugs, activeDrugDosages]);

  // Dosage Safety Validations against Clinical Maximum Daily Guidelines
  const dosageValidationsMap = useMemo(() => {
    const map = new Map<string, { currentDose: number; range: DrugDoseRange; validation: DosageValidationResult }>();
    activeDrugs.forEach((drug) => {
      const range = getDrugDoseRange(drug);
      const currentDose = activeDrugDosages[drug.id] !== undefined ? activeDrugDosages[drug.id] : range.defaultDose;
      const validation = validateDosageSafety(drug, currentDose, patientContext);
      map.set(drug.id, { currentDose, range, validation });
    });
    return map;
  }, [activeDrugs, activeDrugDosages, patientContext]);

  const criticalDosagesList = useMemo(() => {
    return Array.from(dosageValidationsMap.entries())
      .filter(([_, data]) => data.validation.status === 'critical')
      .map(([drugId, data]) => {
        const drug = activeDrugs.find((d) => d.id === drugId);
        return { drug: drug!, ...data };
      });
  }, [dosageValidationsMap, activeDrugs]);

  const warningDosagesCount = useMemo(() => {
    return Array.from(dosageValidationsMap.values()).filter((d) => d.validation.status === 'warning').length;
  }, [dosageValidationsMap]);

  // Clinical Notes Synchronized State & Targeted Pair Editor
  const [clinicalNotesVersion, setClinicalNotesVersion] = useState<number>(0);
  const [targetPairToOpen, setTargetPairToOpen] = useState<{ drugAId: string; drugBId: string } | null>(null);

  // Patient Profile Presets State
  const [patientPresets, setPatientPresets] = useState<PatientProfilePreset[]>([]);
  const [activePatientPresetId, setActivePatientPresetId] = useState<string | null>(null);
  const [isCreatingPatientPreset, setIsCreatingPatientPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');
  const [patientPresetMsg, setPatientPresetMsg] = useState<string>('');
  const [presetMsgIsError, setPresetMsgIsError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cached clinical notes re-evaluated when version changes
  const clinicalNotes = useMemo(() => {
    return storageService.getClinicalNotes();
  }, [clinicalNotesVersion]);

  // Compute pairwise interaction combinations for active drugs
  const activeInteractionPairs = useMemo(() => {
    const pairs: {
      drugA: Medicine;
      drugB: Medicine;
      pairKey: string;
      hasNote: boolean;
      noteSnippet?: string;
      riskLevel?: string;
    }[] = [];

    for (let i = 0; i < activeDrugs.length; i++) {
      for (let j = i + 1; j < activeDrugs.length; j++) {
        const drugA = activeDrugs[i];
        const drugB = activeDrugs[j];
        const pairKey = [drugA.id.toLowerCase().trim(), drugB.id.toLowerCase().trim()].sort().join('--');
        const note = clinicalNotes[pairKey];
        pairs.push({
          drugA,
          drugB,
          pairKey,
          hasNote: Boolean(note),
          noteSnippet: note?.note ? (note.note.length > 55 ? note.note.slice(0, 52) + '...' : note.note) : undefined,
          riskLevel: note?.riskLevel,
        });
      }
    }
    return pairs;
  }, [activeDrugs, clinicalNotes]);

  const handleOpenPairNoteEditor = (drugAId: string, drugBId: string) => {
    setTargetPairToOpen({ drugAId, drugBId });
    const el = document.getElementById('clinical-interaction-notes-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Load baseline & patient presets on mount
  useEffect(() => {
    const loaded = storageService.getBaselineRegimen();
    if (loaded) {
      setBaseline(loaded);
    }

    const loadedPresets = storageService.getPatientPresets();
    setPatientPresets(loadedPresets);
  }, []);

  const handleApplyPatientPreset = (preset: PatientProfilePreset) => {
    setPatientContext({ ...preset.patientContext });
    setActivePatientPresetId(preset.id);
    setPresetMsgIsError(false);
    setPatientPresetMsg(`Applied: ${preset.name}`);
    setTimeout(() => setPatientPresetMsg(''), 3500);
  };

  const handleSavePatientPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: PatientProfilePreset = {
      id: `custom_preset_${Date.now()}`,
      name: newPresetName.trim(),
      description:
        newPresetDesc.trim() ||
        `${patientContext.age}yo, ${patientContext.weightKg}kg, eGFR ${patientContext.renalFunctionEgfr} mL/min, ${patientContext.hepaticFunction.replace('_', ' ')}`,
      category: 'custom',
      patientContext: { ...patientContext },
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updated = storageService.saveCustomPatientPreset(newPreset);
    setPatientPresets(updated);
    setActivePatientPresetId(newPreset.id);
    setNewPresetName('');
    setNewPresetDesc('');
    setIsCreatingPatientPreset(false);
    setPresetMsgIsError(false);
    setPatientPresetMsg(`Saved Custom Preset: "${newPreset.name}"`);
    setTimeout(() => setPatientPresetMsg(''), 3500);
  };

  const handleDeletePatientPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = storageService.deleteCustomPatientPreset(presetId);
    setPatientPresets(updated);
    if (activePatientPresetId === presetId) {
      setActivePatientPresetId(null);
    }
    setPresetMsgIsError(false);
    setPatientPresetMsg('Custom Preset Removed');
    setTimeout(() => setPatientPresetMsg(''), 2500);
  };

  // Import JSON File
  const handleImportPresetsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let incomingList: any[] = [];
      if (Array.isArray(parsed)) {
        incomingList = parsed;
      } else if (Array.isArray(parsed.presets)) {
        incomingList = parsed.presets;
      } else if (parsed.preset && typeof parsed.preset === 'object') {
        incomingList = [parsed.preset];
      } else if (parsed.patientContext && typeof parsed.patientContext === 'object') {
        incomingList = [parsed];
      } else if (typeof parsed.age === 'number' || typeof parsed.renalFunctionEgfr === 'number') {
        incomingList = [
          {
            name: file.name.replace(/\.json$/i, ''),
            description: 'Imported physiological demographics',
            patientContext: parsed,
          },
        ];
      } else {
        throw new Error('Unrecognized JSON schema for patient presets.');
      }

      if (incomingList.length === 0) {
        throw new Error('No presets found in JSON file.');
      }

      const validatedList: PatientProfilePreset[] = incomingList.map((item, idx) => {
        const ctx = item.patientContext || item;
        return {
          id: item.id || `imported_${Date.now()}_${idx}`,
          name: item.name || `Imported Profile ${idx + 1}`,
          description:
            item.description ||
            `Age ${ctx.age || 60}, ${ctx.weightKg || 70}kg, eGFR ${ctx.renalFunctionEgfr || 80}`,
          category: item.category || 'custom',
          isCustom: true,
          patientContext: {
            age: typeof ctx.age === 'number' ? Math.max(1, Math.min(100, ctx.age)) : 60,
            gender: ctx.gender === 'female' || ctx.gender === 'male' || ctx.gender === 'other' ? ctx.gender : 'male',
            weightKg: typeof ctx.weightKg === 'number' ? Math.max(10, Math.min(200, ctx.weightKg)) : 70,
            renalFunctionEgfr:
              typeof ctx.renalFunctionEgfr === 'number'
                ? Math.max(5, Math.min(150, ctx.renalFunctionEgfr))
                : 80,
            hepaticFunction:
              ctx.hepaticFunction === 'mild_impairment' ||
              ctx.hepaticFunction === 'moderate_impairment' ||
              ctx.hepaticFunction === 'severe_impairment'
                ? ctx.hepaticFunction
                : 'normal',
            cyp2d6Genotype:
              ctx.cyp2d6Genotype === 'poor_metabolizer' || ctx.cyp2d6Genotype === 'ultra_rapid_metabolizer'
                ? ctx.cyp2d6Genotype
                : 'normal_metabolizer',
            cyp2c19Genotype:
              ctx.cyp2c19Genotype === 'poor_metabolizer' || ctx.cyp2c19Genotype === 'rapid_metabolizer'
                ? ctx.cyp2c19Genotype
                : 'normal_metabolizer',
          },
          createdAt: item.createdAt || new Date().toISOString(),
        };
      });

      const updated = storageService.importPatientPresets(validatedList);
      setPatientPresets(updated);

      // Immediately activate the first imported preset
      if (validatedList[0]) {
        setPatientContext({ ...validatedList[0].patientContext });
        setActivePatientPresetId(validatedList[0].id);
      }

      setPresetMsgIsError(false);
      setPatientPresetMsg(`Imported ${validatedList.length} patient preset(s) successfully!`);
      setTimeout(() => setPatientPresetMsg(''), 4000);
    } catch (err: any) {
      console.error('Failed to import patient preset JSON:', err);
      setPresetMsgIsError(true);
      setPatientPresetMsg(err?.message || 'Invalid JSON format for patient presets.');
      setTimeout(() => setPatientPresetMsg(''), 4500);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveBaseline = () => {
    const snap: RegimenBaseline = {
      id: `baseline_${Date.now()}`,
      name: `Baseline Regimen (${activeDrugs.map((d) => d.genericName).join(', ') || 'Empty'})`,
      savedAt: new Date().toISOString(),
      drugs: [...activeDrugs],
      patientContext: { ...patientContext },
      timeSeries: [...timeSeries],
      liveEnzymes: [...liveEnzymes],
      predictions: [...predictions],
    };
    setBaseline(snap);
    storageService.saveBaselineRegimen(snap);
    setSaveSuccessMsg('Baseline Regimen A Saved!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleClearBaseline = () => {
    setBaseline(null);
    storageService.saveBaselineRegimen(null);
  };

  const handleRestoreBaseline = () => {
    if (!baseline) return;
    onLoadPreset(baseline.drugs.map((d) => d.id));
    setPatientContext({ ...baseline.patientContext });
  };

  const handleSwapRegimens = () => {
    if (!baseline) return;
    const currentSnapshot: RegimenBaseline = {
      id: `baseline_${Date.now()}`,
      name: `Baseline Regimen (${activeDrugs.map((d) => d.genericName).join(', ') || 'Empty'})`,
      savedAt: new Date().toISOString(),
      drugs: [...activeDrugs],
      patientContext: { ...patientContext },
      timeSeries: [...timeSeries],
      liveEnzymes: [...liveEnzymes],
      predictions: [...predictions],
    };
    // Activate baseline's drugs
    onLoadPreset(baseline.drugs.map((d) => d.id));
    setPatientContext({ ...baseline.patientContext });
    // Save current active as new baseline
    setBaseline(currentSnapshot);
    storageService.saveBaselineRegimen(currentSnapshot);
  };

  const PRESETS = [
    {
      name: 'Warfarin + Amiodarone',
      desc: 'Severe CYP2C9 inhibition & catastrophic bleeding',
      ids: ['warfarin', 'amiodarone'],
    },
    {
      name: 'Simvastatin + Clarithromycin',
      desc: 'Severe CYP3A4 inhibition & rhabdomyolysis',
      ids: ['simvastatin', 'clarithromycin'],
    },
    {
      name: 'Triple Whammy',
      desc: 'ACEi + Diuretic + NSAID acute renal shutdown',
      ids: ['lisinopril', 'furosemide', 'ibuprofen'],
    },
    {
      name: 'Serotonin Storm',
      desc: 'SSRI + Tramadol + Linezolid hyperthermia',
      ids: ['fluoxetine', 'tramadol', 'linezolid'],
    },
    {
      name: 'Cardio Toxicity',
      desc: 'Digoxin + Verapamil AV nodal block',
      ids: ['digoxin', 'verapamil'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workbench View Mode Switcher & Quick Baseline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setWorkbenchView('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              workbenchView === 'single'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Single Regimen</span>
          </button>

          <button
            onClick={() => setWorkbenchView('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              workbenchView === 'compare'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{t.wb_compare_toggle}</span>
            {baseline && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/40 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccessMsg}
            </span>
          )}

          <button
            onClick={handleSaveBaseline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
            title="Freeze current drug state as Baseline (A)"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{baseline ? 'Update Baseline (A)' : t.wb_save_baseline}</span>
          </button>

          {workbenchView === 'single' && (
            <button
              onClick={() => setWorkbenchView('compare')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-xs font-semibold cursor-pointer transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Side-by-Side</span>
            </button>
          )}
        </div>
      </div>

      {/* When Compare View is Active: Show Side-by-Side Regimen Comparison Panel */}
      {workbenchView === 'compare' ? (
        <div className="space-y-6">
          <RegimenComparisonPanel
            baseline={baseline}
            activeDrugs={activeDrugs}
            patientContext={patientContext}
            currentTimeHours={currentTimeHours}
            durationHours={durationHours}
            timeSeries={timeSeries}
            liveEnzymes={liveEnzymes}
            predictions={predictions}
            onSaveBaseline={handleSaveBaseline}
            onClearBaseline={handleClearBaseline}
            onRestoreBaseline={handleRestoreBaseline}
            onSwapRegimens={handleSwapRegimens}
            onToggleActiveDrug={onToggleActiveDrug}
            onLoadPreset={onLoadPreset}
            medicines={medicines}
            langCode={langCode}
          />

          {/* Kinetic Timeline Scrubber (Shared across both regimens) */}
          <SimulationTimeline
            currentTimeHours={currentTimeHours}
            durationHours={durationHours}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onPlayToggle={onPlayToggle}
            onReset={onReset}
            onSeek={onSeek}
            onSpeedChange={onSpeedChange}
          />

          {/* Pairwise Drug-Drug Interactions & Custom Clinical Notes Panel in Compare View */}
          <ClinicalInteractionNotesPanel
            activeDrugs={activeDrugs}
            allMedicines={medicines}
            liveEnzymes={liveEnzymes}
            timeSeries={timeSeries}
            currentTimeHours={currentTimeHours}
            patientContext={patientContext}
            onNotesChange={() => setClinicalNotesVersion((v) => v + 1)}
            targetPairToOpen={targetPairToOpen}
            onClearTargetPair={() => setTargetPairToOpen(null)}
          />
        </div>
      ) : (
        /* Regular Single Simulation View */
        <>
          {/* Top Section: Regimen Builder & Presets */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {t.wb_title}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.wb_subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClearRegimen}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 text-xs cursor-pointer border border-slate-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t.wb_clear_regimen}
                </button>
              </div>
            </div>

            {/* Clinical Interaction Presets */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> {t.wb_presets_title}
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onLoadPreset(p.ids)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
                  >
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 block">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[210px]">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Regimen Pills and Quick Add */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  {t.wb_active_regimen} ({activeDrugs.length} Compounds Co-Administered):
                </span>

                {/* Quick Add Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAddDrugId}
                    onChange={(e) => {
                      if (e.target.value) {
                        onToggleActiveDrug(e.target.value);
                        setSelectedAddDrugId('');
                      }
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">{t.wb_add_medicine}</option>
                    {medicines
                      .filter((m) => !activeDrugs.some((d) => d.id === m.id))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.genericName} ({m.drugClass.split('/')[0]})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 items-center">
                {activeDrugs.length === 0 ? (
                  <span className="text-xs text-slate-500 italic px-2">
                    {t.wb_no_drugs}
                  </span>
                ) : (
                  activeDrugs.map((d) => {
                    const pairNoteCount = (Object.values(clinicalNotes) as ClinicalInteractionNote[]).filter(
                      (n: ClinicalInteractionNote) => n.drugAId === d.id || n.drugBId === d.id
                    ).length;

                    return (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-semibold shadow-sm"
                      >
                        <span>{d.genericName}</span>
                        <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-900/60 px-1.5 py-0.2 rounded">
                          {d.molecularFormula}
                        </span>

                        {pairNoteCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const otherDrug = activeDrugs.find((other) => other.id !== d.id);
                              if (otherDrug) {
                                handleOpenPairNoteEditor(d.id, otherDrug.id);
                              } else {
                                const el = document.getElementById('clinical-interaction-notes-panel');
                                el?.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900/80 cursor-pointer transition-colors"
                            title={`${pairNoteCount} clinical note(s) for pairs with ${d.genericName}. Click to inspect or edit.`}
                          >
                            <Bookmark className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40" />
                            {pairNoteCount} {pairNoteCount === 1 ? 'note' : 'notes'}
                          </button>
                        ) : activeDrugs.length >= 2 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const otherDrug = activeDrugs.find((other) => other.id !== d.id);
                              if (otherDrug) {
                                handleOpenPairNoteEditor(d.id, otherDrug.id);
                              }
                            }}
                            className="flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors"
                            title={`Add custom clinical note for ${d.genericName} interaction`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Note</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => onToggleActiveDrug(d.id)}
                          className="hover:text-rose-400 p-0.5 rounded cursor-pointer"
                          title="Remove from regimen"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Active Pairwise Drug-Drug Interactions Quick Bar */}
              {activeInteractionPairs.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-slate-300">
                      <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                      Active Pairwise Interaction Notes ({activeInteractionPairs.length} Pairs):
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Click any pair to view or document clinical interaction notes
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeInteractionPairs.map((pair) => (
                      <button
                        key={pair.pairKey}
                        type="button"
                        onClick={() => handleOpenPairNoteEditor(pair.drugA.id, pair.drugB.id)}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-mono cursor-pointer transition-all border shadow-sm ${
                          pair.hasNote
                            ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200 hover:bg-cyan-900/90 hover:border-cyan-400 ring-1 ring-cyan-500/20'
                            : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                        title={
                          pair.hasNote
                            ? `Clinical Note: "${pair.noteSnippet || 'Attached'}" (Click to Edit)`
                            : `No note yet for ${pair.drugA.genericName} + ${pair.drugB.genericName}. Click to add.`
                        }
                      >
                        <span className="font-semibold text-slate-200">
                          {pair.drugA.genericName} + {pair.drugB.genericName}
                        </span>

                        {pair.hasNote ? (
                          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-950/90 text-amber-300 border border-amber-500/50 font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-amber-400" />
                            <span>Note Saved</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-900 text-cyan-400 border border-slate-700">
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add Note</span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Individual Drug Dosage Calibration & Metabolic Cascade Recalculation */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            {/* Header & Global Reset Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-sm">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-base tracking-tight">
                      Individual Drug Dosage Calibration & Metabolic Cascade
                    </h3>
                    {adjustedDosesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-600/50 font-semibold animate-fadeIn">
                        {adjustedDosesCount} Adjusted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Adjust individual compound doses via sliders or precision numeric inputs. Kinetic curves, CYP enzyme saturation, and metabolic cascades recalculate in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {adjustedDosesCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllDoses}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                    title="Reset all active compound doses to clinical standards"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reset to Standards</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Drug Dosage Sliders & Inputs */}
            {activeDrugs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-slate-300 font-semibold text-xs">No Active Drugs in Regimen</h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Add medicines to the regimen above or select a clinical preset to calibrate individual compound doses and observe dynamic metabolic cascade shifts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Regimen Dosage Safety Alert Banner when any drug exceeds max daily guidelines */}
                {criticalDosagesList.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-rose-200 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-900 border border-rose-500 flex items-center justify-center text-rose-300 shrink-0 animate-pulse">
                        <AlertOctagon className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>MAX DAILY DOSE EXCEEDED: {criticalDosagesList.length} {criticalDosagesList.length === 1 ? 'Medication Exceeds' : 'Medications Exceed'} FDA/Safety Guidelines</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-900 text-white border border-rose-500">
                            Safety Alert
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200/90 mt-0.5">
                          {criticalDosagesList
                            .map((v) => `${v.drug.genericName} (${v.currentDose} mg > max ${v.validation.maxRecommendedDoseMg} mg)`)
                            .join(' • ')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        criticalDosagesList.forEach((v) => {
                          handleDoseChange(v.drug.id, v.validation.maxRecommendedDoseMg);
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs cursor-pointer shrink-0 transition-colors shadow-md"
                      title="Clamp all exceeding drug dosages down to the maximum standard recommended safe limits"
                    >
                      Clamp All to Safe Max Doses
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeDrugs.map((drug) => {
                    const range = getDrugDoseRange(drug);
                    const currentDose =
                      activeDrugDosages[drug.id] !== undefined
                        ? activeDrugDosages[drug.id]
                        : range.defaultDose;
                    const diffRatio = currentDose / (range.defaultDose || 1);
                    const pctDiff = Math.round((diffRatio - 1) * 100);
                    const isModified = Math.abs(pctDiff) >= 1;

                    // Safety validation against standard max daily doses and patient-specific factors
                    const validation = validateDosageSafety(drug, currentDose, patientContext);

                    // Find primary enzymes
                    const enzymesList = drug.enzymes
                      .map((e) => `${e.name} (${e.role.replace('_', ' ')})`)
                      .slice(0, 3)
                      .join(', ');

                    return (
                      <div
                        key={drug.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 relative group ${
                          validation.status === 'critical'
                            ? 'bg-slate-950/95 border-rose-500/80 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/40'
                            : validation.status === 'warning'
                            ? 'bg-slate-950/95 border-amber-500/70 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/30'
                            : isModified
                            ? 'bg-slate-950/95 border-cyan-500/50 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Drug Header & Current Calibrated Dose */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm tracking-tight">
                                {drug.genericName}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                                {drug.molecularFormula || 'Compound'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {drug.drugClass}
                            </span>
                          </div>

                          {/* Current Dose Highlight & Status Badge */}
                          <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                              <span
                                className={`text-lg font-mono font-bold ${
                                  validation.status === 'critical'
                                    ? 'text-rose-400'
                                    : validation.status === 'warning'
                                    ? 'text-amber-400'
                                    : 'text-cyan-300'
                                }`}
                              >
                                {currentDose}
                              </span>
                              <span className="text-xs font-mono text-slate-400">{range.unit}</span>
                            </div>

                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                                validation.status === 'critical'
                                  ? 'bg-rose-950 text-rose-300 border-rose-500/80 animate-pulse font-bold'
                                  : validation.status === 'warning'
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/80 font-bold'
                                  : !isModified
                                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                  : pctDiff < 0
                                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                                  : 'bg-purple-950/70 border-purple-500/50 text-purple-300'
                              }`}
                            >
                              {validation.status === 'critical'
                                ? `⚠️ Exceeds Max Safe (${validation.maxRecommendedDoseMg} mg)`
                                : validation.status === 'warning'
                                ? `⚡ High Dose Warning`
                                : !isModified
                                ? `Std (${range.defaultDose} mg)`
                                : pctDiff < 0
                                ? `Reduced ${pctDiff}%`
                                : `Escalated +${pctDiff}%`}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Range Slider and Numeric Input Field with Safety Validation */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1 font-semibold">
                              <Scale className="w-3.5 h-3.5 text-cyan-400" />
                              Dose Calibration:
                            </label>

                            {/* Direct Numerical Input Field with Visual Validation Layer */}
                            <div className="flex items-center gap-1.5">
                              {validation.status === 'critical' && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600 flex items-center gap-1 shrink-0 animate-pulse"
                                  title={validation.warningMessage}
                                >
                                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                                  <span>Max: {validation.maxRecommendedDoseMg} {range.unit}</span>
                                </span>
                              )}

                              {validation.status === 'warning' && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1 shrink-0"
                                  title={validation.warningMessage}
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span>High Dose</span>
                                </span>
                              )}

                              {validation.status === 'subtherapeutic' && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-950 text-sky-300 border border-sky-600 flex items-center gap-1 shrink-0"
                                  title={validation.warningMessage}
                                >
                                  <Info className="w-3 h-3 text-sky-400" />
                                  <span>Subtherapeutic</span>
                                </span>
                              )}

                              <div className="relative">
                                <input
                                  type="number"
                                  min={range.min}
                                  max={Math.max(range.max, currentDose * 1.5)}
                                  step={range.step}
                                  value={
                                    localInputStrings[drug.id] !== undefined
                                      ? localInputStrings[drug.id]
                                      : currentDose.toString()
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    setLocalInputStrings((prev) => ({ ...prev, [drug.id]: raw }));
                                    const val = parseFloat(raw);
                                    if (!isNaN(val) && val >= 0) {
                                      handleDoseChange(drug.id, val);
                                    }
                                  }}
                                  onBlur={() => {
                                    setLocalInputStrings((prev) => {
                                      const next = { ...prev };
                                      delete next[drug.id];
                                      return next;
                                    });
                                  }}
                                  className={`w-24 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs focus:outline-none transition-all ${
                                    validation.status === 'critical'
                                      ? 'bg-rose-950/90 border-2 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-md shadow-rose-950/60 animate-pulse'
                                      : validation.status === 'warning'
                                      ? 'bg-amber-950/70 border-2 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                                      : validation.status === 'subtherapeutic'
                                      ? 'bg-sky-950/60 border border-sky-500/60 text-sky-200'
                                      : 'bg-slate-900 border border-slate-700 text-cyan-300 focus:border-cyan-400'
                                  }`}
                                />
                              </div>
                              <span className="text-slate-400 font-mono text-xs">{range.unit}</span>
                            </div>
                          </div>

                          {/* Slider Bar with Visual Safety Threshold Marker */}
                          {(() => {
                            const sliderMax = Math.max(range.max, currentDose * 1.25);
                            const maxSafePct = Math.min(
                              100,
                              Math.max(
                                0,
                                ((validation.maxRecommendedDoseMg - range.min) /
                                  Math.max(0.001, sliderMax - range.min)) *
                                  100
                              )
                            );
                            return (
                              <div className="relative pt-1.5 pb-1">
                                <input
                                  type="range"
                                  min={range.min}
                                  max={sliderMax}
                                  step={range.step}
                                  value={currentDose}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setLocalInputStrings((prev) => {
                                      const next = { ...prev };
                                      delete next[drug.id];
                                      return next;
                                    });
                                    handleDoseChange(drug.id, val);
                                  }}
                                  className={`w-full h-2 rounded-lg cursor-pointer transition-all ${
                                    validation.status === 'critical'
                                      ? 'accent-rose-500 bg-rose-950/60'
                                      : validation.status === 'warning'
                                      ? 'accent-amber-400 bg-amber-950/50'
                                      : 'accent-cyan-400 bg-slate-800'
                                  }`}
                                />

                                {/* Max Safe Safety Threshold Line on Slider */}
                                {validation.maxRecommendedDoseMg <= sliderMax && (
                                  <div
                                    className="absolute top-0 bottom-1 pointer-events-none flex flex-col items-center"
                                    style={{ left: `${maxSafePct}%`, transform: 'translateX(-50%)' }}
                                    title={`Max Safe Limit: ${validation.maxRecommendedDoseMg} ${range.unit}`}
                                  >
                                    <div className="w-0.5 h-3.5 bg-rose-500 shadow-sm shadow-rose-500" />
                                    <span className="text-[7.5px] font-mono font-bold text-rose-300 bg-rose-950/95 px-1 rounded border border-rose-500/70 -mt-0.5 select-none whitespace-nowrap">
                                      Max {validation.maxRecommendedDoseMg}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Slider Scale Ticks */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                            <span>Min: {range.min} {range.unit}</span>
                            <span
                              onClick={() => {
                                setLocalInputStrings((prev) => {
                                  const next = { ...prev };
                                  delete next[drug.id];
                                  return next;
                                });
                                handleDoseChange(drug.id, range.defaultDose);
                              }}
                              className="text-cyan-400/80 hover:text-cyan-300 cursor-pointer underline decoration-dotted"
                              title="Click to reset this drug to clinical standard dose"
                            >
                              Recommended: {range.defaultDose} {range.unit}
                            </span>
                            <span
                              className={
                                validation.status === 'critical'
                                  ? 'text-rose-400 font-bold'
                                  : validation.status === 'warning'
                                  ? 'text-amber-400 font-semibold'
                                  : 'text-slate-500'
                              }
                            >
                              Max Safe: {validation.maxRecommendedDoseMg} {range.unit}
                            </span>
                          </div>

                          {/* Dedicated Visual Warning Indicator Box when Max Safe Limit is Exceeded */}
                          {validation.status === 'critical' && (
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/95 to-slate-950 border border-rose-500/80 text-rose-200 text-xs space-y-2 shadow-lg shadow-rose-950/40 animate-fadeIn">
                              <div className="flex items-center justify-between gap-2 border-b border-rose-800/60 pb-1.5 flex-wrap">
                                <div className="flex items-center gap-1.5 font-bold text-rose-300 text-[11px] font-mono uppercase tracking-wide">
                                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                                  <span>Exceeds Standard Max Daily Safety Limit</span>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-white border border-rose-500 shrink-0">
                                  Max Safe: {validation.maxRecommendedDoseMg} {range.unit}
                                </span>
                              </div>

                              <p className="text-[11px] text-rose-100 leading-relaxed font-sans">
                                {validation.clinicalRisk || validation.warningMessage}
                              </p>

                              {validation.guidelineSource && (
                                <div className="text-[10px] font-mono text-rose-300/80">
                                  <span>Guideline Source: </span>
                                  <strong className="text-white">{validation.guidelineSource}</strong>
                                </div>
                              )}

                              {validation.toxicitySigns && validation.toxicitySigns.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono pt-0.5">
                                  <span className="text-rose-400 font-semibold">Toxicity Signs:</span>
                                  {validation.toxicitySigns.map((sign, sIdx) => (
                                    <span key={sIdx} className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/50">
                                      {sign}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-2 pt-1 border-t border-rose-900/60 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalInputStrings((prev) => {
                                      const next = { ...prev };
                                      delete next[drug.id];
                                      return next;
                                    });
                                    handleDoseChange(drug.id, validation.maxRecommendedDoseMg);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[10px] cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                                  title="Clamp dosage down to maximum standard recommended safe limit"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  Clamp to Safe Max ({validation.maxRecommendedDoseMg} {range.unit})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalInputStrings((prev) => {
                                      const next = { ...prev };
                                      delete next[drug.id];
                                      return next;
                                    });
                                    handleDoseChange(drug.id, validation.standardDoseMg);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer transition-colors border border-slate-700 flex items-center gap-1"
                                  title="Reset back to standard clinical baseline dose"
                                >
                                  Reset Standard ({validation.standardDoseMg} {range.unit})
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Elevated Dose Warning Indicator */}
                          {validation.status === 'warning' && (
                            <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-200 text-xs space-y-1.5 animate-fadeIn">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] font-mono">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>High Dose Advisory (Max Safe: {validation.maxRecommendedDoseMg} {range.unit})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalInputStrings((prev) => {
                                      const next = { ...prev };
                                      delete next[drug.id];
                                      return next;
                                    });
                                    handleDoseChange(drug.id, validation.standardDoseMg);
                                  }}
                                  className="text-[10px] text-amber-400 hover:text-white underline cursor-pointer font-mono"
                                >
                                  Reset Std ({validation.standardDoseMg}mg)
                                </button>
                              </div>
                              <p className="text-[11px] text-amber-200/90 leading-tight">
                                {validation.warningMessage}
                              </p>
                              {validation.clinicalRisk && (
                                <p className="text-[10px] text-amber-300/80 font-mono">
                                  Risk: {validation.clinicalRisk}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Subtherapeutic Dose Advisory */}
                          {validation.status === 'subtherapeutic' && (
                            <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs space-y-1 animate-fadeIn">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-bold text-sky-300 text-[11px] font-mono">
                                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <span>Subtherapeutic Dose Advisory</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalInputStrings((prev) => {
                                      const next = { ...prev };
                                      delete next[drug.id];
                                      return next;
                                    });
                                    handleDoseChange(drug.id, validation.standardDoseMg);
                                  }}
                                  className="text-[10px] text-sky-400 hover:text-white underline cursor-pointer font-mono"
                                >
                                  Reset Std ({validation.standardDoseMg}mg)
                                </button>
                              </div>
                              <p className="text-[11px] text-sky-200/90 leading-tight">
                                {validation.warningMessage}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Quick Clinical Titration Buttons */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 flex-wrap text-[10px] font-mono">
                          <span className="text-slate-500 text-[9px] uppercase tracking-wider">
                            Titration Presets:
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setLocalInputStrings((prev) => {
                                  const next = { ...prev };
                                  delete next[drug.id];
                                  return next;
                                });
                                handleDoseChange(drug.id, parseFloat((range.defaultDose * 0.5).toFixed(2)));
                              }}
                              className={`px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                                Math.abs(currentDose - range.defaultDose * 0.5) < 0.05
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/60 font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                              }`}
                              title="Empiric 50% dose reduction for severe CYP metabolic inhibition"
                            >
                              -50%
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setLocalInputStrings((prev) => {
                                  const next = { ...prev };
                                  delete next[drug.id];
                                  return next;
                                });
                                handleDoseChange(drug.id, parseFloat((range.defaultDose * 0.67).toFixed(2)));
                              }}
                              className={`px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                                Math.abs(currentDose - range.defaultDose * 0.67) < 0.05
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/60 font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                              }`}
                              title="33% dose reduction for moderate metabolic inhibition"
                            >
                              -33%
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setLocalInputStrings((prev) => {
                                  const next = { ...prev };
                                  delete next[drug.id];
                                  return next;
                                });
                                handleDoseChange(drug.id, range.defaultDose);
                              }}
                              className={`px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                                !isModified
                                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                              }`}
                              title="Reset to clinical reference baseline standard dose"
                            >
                              Std (100%)
                            </button>

                            {(() => {
                              const plus50Dose = parseFloat((range.defaultDose * 1.5).toFixed(2));
                              const exceedsMax = plus50Dose > validation.maxRecommendedDoseMg;
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalInputStrings((prev) => {
                                      const next = { ...prev };
                                      delete next[drug.id];
                                      return next;
                                    });
                                    handleDoseChange(drug.id, plus50Dose);
                                  }}
                                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                                    Math.abs(currentDose - plus50Dose) < 0.05
                                      ? exceedsMax
                                        ? 'bg-rose-950 text-rose-300 border-rose-500/80 font-bold'
                                        : 'bg-purple-950 text-purple-300 border-purple-500/60 font-bold'
                                      : exceedsMax
                                      ? 'bg-slate-900 text-rose-400/80 hover:text-rose-300 border-rose-900/60'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                  title={
                                    exceedsMax
                                      ? `Warning: +50% dose (${plus50Dose} ${range.unit}) exceeds max daily safe limit (${validation.maxRecommendedDoseMg} ${range.unit})`
                                      : '50% dose escalation for high CYP metabolic induction'
                                  }
                                >
                                  +50%{exceedsMax ? ' ⚠️' : ''}
                                </button>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Enzymes & Metabolic Impact Micro-summary */}
                        {enzymesList && (
                          <div className="text-[10px] font-mono text-slate-500 pt-1 flex items-center justify-between">
                            <span className="truncate max-w-[280px]">
                              CYP Pathways: <strong className="text-slate-400">{enzymesList}</strong>
                            </span>
                            <span className="text-cyan-400/80">Real-Time ODE Scaled</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Pairwise Drug-Drug Interactions & Custom Clinical Notes Panel */}
          <ClinicalInteractionNotesPanel
            activeDrugs={activeDrugs}
            allMedicines={medicines}
            liveEnzymes={liveEnzymes}
            timeSeries={timeSeries}
            currentTimeHours={currentTimeHours}
            patientContext={patientContext}
            onNotesChange={() => setClinicalNotesVersion((v) => v + 1)}
            targetPairToOpen={targetPairToOpen}
            onClearTargetPair={() => setTargetPairToOpen(null)}
          />

          {/* Patient Physiological Parameters & Profile Presets Drawer */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-4 shadow-xl">
            {/* Header & Preset Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Patient Profile Presets & Physiological Demographics
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Calibrate digital-twin demographics to simulate specialized clinical populations
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {patientPresetMsg && (
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1 animate-fadeIn ${
                      presetMsgIsError
                        ? 'text-rose-400 bg-rose-950/70 border border-rose-500/40'
                        : 'text-emerald-400 bg-emerald-950/70 border border-emerald-500/40'
                    }`}
                  >
                    {presetMsgIsError ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {patientPresetMsg}
                  </span>
                )}

                {/* Hidden File Input for Preset JSON Import */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleImportPresetsFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  title="Import patient profile presets from JSON file"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import JSON</span>
                </button>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('patients')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900/70 text-purple-300 border border-purple-500/40 text-xs font-semibold cursor-pointer transition-colors"
                    title="Open comprehensive Patient Profile Library"
                  >
                    <Dna className="w-3.5 h-3.5 text-purple-400" />
                    <span>Patient Library</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCreatingPatientPreset(!isCreatingPatientPreset)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingPatientPreset ? 'Cancel' : 'Save Demographic'}</span>
                </button>
              </div>
            </div>

            {/* Custom Preset Creation Form */}
            {isCreatingPatientPreset && (
              <form
                onSubmit={handleSavePatientPreset}
                className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-3 animate-fadeIn"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs font-mono">
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Current Demographics as a Reusable Profile Preset</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                      Preset Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Geriatric Post-Surgical CKD Stage 4"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                      Clinical Notes / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 78yo, high bleeding risk, renally dosed"
                      value={newPresetDesc}
                      onChange={(e) => setNewPresetDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Snapshot: Age {patientContext.age} | {patientContext.weightKg}kg | eGFR {patientContext.renalFunctionEgfr} | {patientContext.hepaticFunction}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPatientPreset(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
                    >
                      Save Preset
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Quick-Load Patient Profile Presets Bar */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Select Demographic Profile Preset:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {patientPresets.map((preset) => {
                  const isActive = activePatientPresetId === preset.id;
                  const ctx = preset.patientContext;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPatientPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative group flex flex-col justify-between ${
                        isActive
                          ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950 ring-1 ring-cyan-400/50'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 truncate">
                          {preset.name}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {preset.isCustom && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                              Custom
                            </span>
                          )}
                          {preset.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeletePatientPreset(preset.id, e)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                              title="Delete custom preset"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                        {preset.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-800/80">
                        <span className="text-slate-300">{ctx.age} yo</span>
                        <span>•</span>
                        <span className="text-slate-300">{ctx.weightKg} kg</span>
                        <span>•</span>
                        <span className={ctx.renalFunctionEgfr < 30 ? 'text-rose-400 font-bold' : 'text-cyan-300'}>
                          eGFR {ctx.renalFunctionEgfr}
                        </span>
                        <span>•</span>
                        <span className="truncate capitalize text-slate-400">
                          {ctx.hepaticFunction.split('_')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Physiological Parameter Sliders and Granular Controls */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 font-mono uppercase text-[11px]">
                  Manual Demographic Sliders & Pharmacogenomics:
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  eGFR: {patientContext.renalFunctionEgfr} mL/min | {patientContext.weightKg} kg | {patientContext.age} yo ({patientContext.gender})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-[11px]">
                {/* Age */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 block text-[10px]">Age</label>
                    <span className="text-cyan-300 font-bold text-xs">{patientContext.age} yo</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={patientContext.age}
                    onChange={(e) => {
                      setPatientContext((p) => ({ ...p, age: parseInt(e.target.value, 10) }));
                      setActivePatientPresetId(null);
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    {patientContext.age < 18 ? 'Pediatric' : patientContext.age >= 65 ? 'Geriatric' : 'Adult'}
                  </span>
                </div>

                {/* Body Weight */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 block text-[10px]">Weight</label>
                    <span className="text-cyan-300 font-bold text-xs">{patientContext.weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="160"
                    value={patientContext.weightKg}
                    onChange={(e) => {
                      setPatientContext((p) => ({ ...p, weightKg: parseInt(e.target.value, 10) }));
                      setActivePatientPresetId(null);
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 block">Vd Scaling Factor</span>
                </div>

                {/* Gender */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <label className="text-slate-400 block text-[10px]">Gender</label>
                  <select
                    value={patientContext.gender}
                    onChange={(e) => {
                      setPatientContext((p) => ({ ...p, gender: e.target.value as any }));
                      setActivePatientPresetId(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 cursor-pointer text-xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block">Endocrine Base</span>
                </div>

                {/* Renal Function (eGFR) */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 block text-[10px]">Renal eGFR</label>
                    <span
                      className={`font-bold text-xs ${
                        patientContext.renalFunctionEgfr < 30
                          ? 'text-rose-400'
                          : patientContext.renalFunctionEgfr < 60
                          ? 'text-amber-400'
                          : 'text-cyan-300'
                      }`}
                    >
                      {patientContext.renalFunctionEgfr}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="125"
                    value={patientContext.renalFunctionEgfr}
                    onChange={(e) => {
                      setPatientContext((p) => ({
                        ...p,
                        renalFunctionEgfr: parseInt(e.target.value, 10),
                      }));
                      setActivePatientPresetId(null);
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 block truncate">
                    {patientContext.renalFunctionEgfr < 15
                      ? 'Failure (<15)'
                      : patientContext.renalFunctionEgfr < 30
                      ? 'Severe (15-29)'
                      : patientContext.renalFunctionEgfr < 60
                      ? 'Mod. (30-59)'
                      : 'Normal (≥60)'}
                  </span>
                </div>

                {/* Hepatic Function */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <label className="text-slate-400 block text-[10px]">Hepatic Function</label>
                  <select
                    value={patientContext.hepaticFunction}
                    onChange={(e) => {
                      setPatientContext((p) => ({
                        ...p,
                        hepaticFunction: e.target.value as any,
                      }));
                      setActivePatientPresetId(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 cursor-pointer text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="mild_impairment">Mild (Child A)</option>
                    <option value="moderate_impairment">Mod (Child B)</option>
                    <option value="severe_impairment">Severe (Child C)</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block">CYP Clearance</span>
                </div>

                {/* CYP2D6 Genotype */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <label className="text-slate-400 block text-[10px]">CYP2D6 Genotype</label>
                  <select
                    value={patientContext.cyp2d6Genotype || 'normal_metabolizer'}
                    onChange={(e) => {
                      setPatientContext((p) => ({
                        ...p,
                        cyp2d6Genotype: e.target.value as any,
                      }));
                      setActivePatientPresetId(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 cursor-pointer text-xs"
                  >
                    <option value="normal_metabolizer">Normal (*1/*1)</option>
                    <option value="poor_metabolizer">Poor (*4/*4)</option>
                    <option value="ultra_rapid_metabolizer">Ultra-Rapid (*1xN)</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block">Metabolic Rate</span>
                </div>

                {/* CYP2C19 Genotype */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <label className="text-slate-400 block text-[10px]">CYP2C19 Genotype</label>
                  <select
                    value={patientContext.cyp2c19Genotype || 'normal_metabolizer'}
                    onChange={(e) => {
                      setPatientContext((p) => ({
                        ...p,
                        cyp2c19Genotype: e.target.value as any,
                      }));
                      setActivePatientPresetId(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 cursor-pointer text-xs"
                  >
                    <option value="normal_metabolizer">Normal (*1/*1)</option>
                    <option value="poor_metabolizer">Poor (*2/*2)</option>
                    <option value="rapid_metabolizer">Rapid (*17/*17)</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block">Pro-drug Activation</span>
                </div>
              </div>

              {/* Dynamic Vulnerability Flag Warnings */}
              {(patientContext.renalFunctionEgfr < 30 ||
                patientContext.hepaticFunction === 'severe_impairment' ||
                patientContext.age >= 80 ||
                patientContext.age <= 12) && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-amber-200">
                  <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-amber-300">Vulnerable Patient Demographics Active: </span>
                    {patientContext.renalFunctionEgfr < 30 && (
                      <span>
                        Severe renal impairment (eGFR {patientContext.renalFunctionEgfr} mL/min) markedly delays elimination of renally excreted medications.
                      </span>
                    )}
                    {patientContext.hepaticFunction === 'severe_impairment' && (
                      <span className="ml-1">
                        Severe hepatic compromise (Child-Pugh C) severely suppresses hepatic clearance across CYP3A4, CYP2C9, and CYP2D6 cascades.
                      </span>
                    )}
                    {patientContext.age <= 12 && (
                      <span className="ml-1">
                        Pediatric patient physiology requires precise body-weight scaled dosing and altered volume of distribution.
                      </span>
                    )}
                    {patientContext.age >= 80 && (
                      <span className="ml-1">
                        Advanced geriatric patient presents heightened polypharmacy susceptibility and heightened pharmacodynamic sensitivity.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kinetic Timeline Scrubber */}
          <SimulationTimeline
            currentTimeHours={currentTimeHours}
            durationHours={durationHours}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onPlayToggle={onPlayToggle}
            onReset={onReset}
            onSeek={onSeek}
            onSpeedChange={onSpeedChange}
          />

          {/* Interactive PK Curves */}
          <PkCurvesChart
            timeSeries={timeSeries}
            activeDrugs={activeDrugs}
            currentTimeHours={currentTimeHours}
            drugDosages={activeDrugDosages}
          />
        </>
      )}
    </div>
  );
};
