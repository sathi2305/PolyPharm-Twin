import React, { useState, useMemo } from 'react';
import { PatientContext, PatientProfilePreset, Medicine } from '../types';
import { storageService } from '../services/storageService';
import {
  User,
  Users,
  Dna,
  Activity,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit3,
  Copy,
  ArrowRight,
  ShieldAlert,
  Flame,
  FileText,
  Sparkles,
  Heart,
  Droplet,
  Zap,
  Info,
  Clock,
  ChevronRight,
  Check,
  X,
  Sliders,
} from 'lucide-react';

interface PatientProfileLibraryProps {
  currentPatient: PatientContext;
  onSelectPatient: (patient: PatientContext, presetId?: string) => void;
  onNavigateTab?: (tab: string) => void;
  activeDrugCount?: number;
  onLoadPresetRegimen?: (drugIds: string[]) => void;
}

export type CategoryFilter =
  | 'all'
  | 'geriatric'
  | 'pharmacogenomic'
  | 'renal'
  | 'hepatic'
  | 'pediatric'
  | 'critical_care'
  | 'custom';

export const PatientProfileLibrary: React.FC<PatientProfileLibraryProps> = ({
  currentPatient,
  onSelectPatient,
  onNavigateTab,
  activeDrugCount = 0,
  onLoadPresetRegimen,
}) => {
  const [presets, setPresets] = useState<PatientProfilePreset[]>(() =>
    storageService.getPatientPresets()
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedPresetForModal, setSelectedPresetForModal] = useState<PatientProfilePreset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    description: string;
    category: PatientProfilePreset['category'];
    clinicalScenario: string;
    age: number;
    gender: 'female' | 'male' | 'other';
    weightKg: number;
    renalFunctionEgfr: number;
    hepaticFunction: PatientContext['hepaticFunction'];
    cyp2d6Genotype: PatientContext['cyp2d6Genotype'];
    cyp2c19Genotype: PatientContext['cyp2c19Genotype'];
    cyp2c9Genotype: NonNullable<PatientContext['cyp2c9Genotype']>;
    slco1b1Genotype: NonNullable<PatientContext['slco1b1Genotype']>;
    vkorc1Genotype: NonNullable<PatientContext['vkorc1Genotype']>;
    smokingStatus: NonNullable<PatientContext['smokingStatus']>;
    serumAlbuminGDl: number;
    comorbiditiesText: string;
    riskHighlightsText: string;
  }>({
    id: '',
    name: '',
    description: '',
    category: 'custom',
    clinicalScenario: '',
    age: 60,
    gender: 'male',
    weightKg: 70,
    renalFunctionEgfr: 85,
    hepaticFunction: 'normal',
    cyp2d6Genotype: 'normal_metabolizer',
    cyp2c19Genotype: 'normal_metabolizer',
    cyp2c9Genotype: 'normal_metabolizer',
    slco1b1Genotype: 'normal_function',
    vkorc1Genotype: 'normal_sensitivity',
    smokingStatus: 'non_smoker',
    serumAlbuminGDl: 4.2,
    comorbiditiesText: 'Hypertension, Dyslipidemia',
    riskHighlightsText: 'Monitor renal clearance, Standard phase-I capacity',
  });

  // Check which preset is currently active
  const activePresetId = useMemo(() => {
    // Match by exact key fields
    const match = presets.find((p) => {
      const pc = p.patientContext;
      return (
        pc.age === currentPatient.age &&
        pc.gender === currentPatient.gender &&
        pc.weightKg === currentPatient.weightKg &&
        pc.renalFunctionEgfr === currentPatient.renalFunctionEgfr &&
        pc.hepaticFunction === currentPatient.hepaticFunction &&
        pc.cyp2d6Genotype === currentPatient.cyp2d6Genotype &&
        pc.cyp2c19Genotype === currentPatient.cyp2c19Genotype
      );
    });
    return match ? match.id : null;
  }, [presets, currentPatient]);

  // Filtered preset list
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.clinicalScenario?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)) ||
        p.patientContext.comorbidities?.some((c) => c.toLowerCase().includes(q)) ||
        p.patientContext.cyp2d6Genotype.toLowerCase().includes(q) ||
        p.patientContext.cyp2c19Genotype.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'custom' && p.isCustom) ||
        p.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [presets, searchQuery, categoryFilter]);

  // Handlers
  const handleApplyPreset = (preset: PatientProfilePreset) => {
    onSelectPatient(preset.patientContext, preset.id);
    setNotificationMsg(`Applied Profile: "${preset.name}" to simulation engine`);
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  const handleApplyAndLoadRegimen = (preset: PatientProfilePreset) => {
    onSelectPatient(preset.patientContext, preset.id);
    if (preset.recommendedRegimenIds && preset.recommendedRegimenIds.length > 0 && onLoadPresetRegimen) {
      onLoadPresetRegimen(preset.recommendedRegimenIds);
      setNotificationMsg(`Applied "${preset.name}" & loaded scenario regimen (${preset.recommendedRegimenIds.length} drugs)`);
    } else {
      setNotificationMsg(`Applied Profile: "${preset.name}"`);
    }
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = storageService.deleteCustomPatientPreset(id);
    setPresets(updated);
    setNotificationMsg('Custom profile deleted');
    setTimeout(() => setNotificationMsg(''), 2500);
  };

  const handleOpenCreateModal = (presetToClone?: PatientProfilePreset) => {
    if (presetToClone) {
      const pc = presetToClone.patientContext;
      setFormData({
        id: `custom_patient_${Date.now()}`,
        name: `${presetToClone.name} (Copy)`,
        description: presetToClone.description,
        category: 'custom',
        clinicalScenario: presetToClone.clinicalScenario || '',
        age: pc.age,
        gender: pc.gender,
        weightKg: pc.weightKg,
        renalFunctionEgfr: pc.renalFunctionEgfr,
        hepaticFunction: pc.hepaticFunction,
        cyp2d6Genotype: pc.cyp2d6Genotype,
        cyp2c19Genotype: pc.cyp2c19Genotype,
        cyp2c9Genotype: pc.cyp2c9Genotype || 'normal_metabolizer',
        slco1b1Genotype: pc.slco1b1Genotype || 'normal_function',
        vkorc1Genotype: pc.vkorc1Genotype || 'normal_sensitivity',
        smokingStatus: pc.smokingStatus || 'non_smoker',
        serumAlbuminGDl: pc.serumAlbuminGDl || 4.0,
        comorbiditiesText: pc.comorbidities?.join(', ') || '',
        riskHighlightsText: presetToClone.riskHighlights?.join(', ') || '',
      });
    } else {
      setFormData({
        id: `custom_patient_${Date.now()}`,
        name: 'New Custom Patient Profile',
        description: 'Custom clinical demographics & genetic diplotypes',
        category: 'custom',
        clinicalScenario: 'Patient undergoing personalized pharmacogenomic evaluation.',
        age: 62,
        gender: 'male',
        weightKg: 74,
        renalFunctionEgfr: 75,
        hepaticFunction: 'normal',
        cyp2d6Genotype: 'normal_metabolizer',
        cyp2c19Genotype: 'normal_metabolizer',
        cyp2c9Genotype: 'normal_metabolizer',
        slco1b1Genotype: 'normal_function',
        vkorc1Genotype: 'normal_sensitivity',
        smokingStatus: 'non_smoker',
        serumAlbuminGDl: 4.2,
        comorbiditiesText: 'Hypertension, Dyslipidemia',
        riskHighlightsText: 'Monitor narrow therapeutic index co-medications',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const comorbidities = formData.comorbiditiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const riskHighlights = formData.riskHighlightsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newPreset: PatientProfilePreset = {
      id: formData.id || `custom_${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || `${formData.age} yo ${formData.gender}, eGFR ${formData.renalFunctionEgfr} mL/min`,
      category: formData.category || 'custom',
      clinicalScenario: formData.clinicalScenario.trim(),
      riskHighlights: riskHighlights.length > 0 ? riskHighlights : ['Custom simulation scenario'],
      tags: ['Custom', `${formData.age}yo`, `eGFR ${formData.renalFunctionEgfr}`],
      isCustom: true,
      createdAt: new Date().toISOString(),
      patientContext: {
        age: Number(formData.age),
        gender: formData.gender,
        weightKg: Number(formData.weightKg),
        renalFunctionEgfr: Number(formData.renalFunctionEgfr),
        hepaticFunction: formData.hepaticFunction,
        cyp2d6Genotype: formData.cyp2d6Genotype,
        cyp2c19Genotype: formData.cyp2c19Genotype,
        cyp2c9Genotype: formData.cyp2c9Genotype,
        slco1b1Genotype: formData.slco1b1Genotype,
        vkorc1Genotype: formData.vkorc1Genotype,
        smokingStatus: formData.smokingStatus,
        serumAlbuminGDl: Number(formData.serumAlbuminGDl),
        comorbidities,
      },
    };

    const updated = storageService.saveCustomPatientPreset(newPreset);
    setPresets(updated);
    setIsModalOpen(false);

    // Apply immediately to current simulation
    onSelectPatient(newPreset.patientContext, newPreset.id);
    setNotificationMsg(`Saved & Applied Custom Profile: "${newPreset.name}"`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Helper for CKD stage
  const getCkdStage = (egfr: number) => {
    if (egfr >= 90) return { stage: 'Stage 1 (Normal / High)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
    if (egfr >= 60) return { stage: 'Stage 2 (Mild Decline)', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' };
    if (egfr >= 45) return { stage: 'Stage 3a (Mild-Mod CKD)', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
    if (egfr >= 30) return { stage: 'Stage 3b (Mod-Severe CKD)', color: 'text-amber-500 bg-amber-950/80 border-amber-500/60' };
    if (egfr >= 15) return { stage: 'Stage 4 (Severe CKD)', color: 'text-rose-400 bg-rose-950/80 border-rose-500/60' };
    return { stage: 'Stage 5 (Kidney Failure)', color: 'text-rose-500 bg-rose-950 border-rose-600 font-bold' };
  };

  // Helper for genotype badge colors
  const getGenotypeColor = (type: string) => {
    if (type.includes('poor')) return 'bg-rose-950 text-rose-300 border-rose-500/50';
    if (type.includes('ultra_rapid') || type.includes('rapid')) return 'bg-purple-950 text-purple-300 border-purple-500/50';
    if (type.includes('intermediate')) return 'bg-amber-950 text-amber-300 border-amber-500/50';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 shadow-lg text-cyan-200 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg('')}
            className="text-cyan-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-950 ring-1 ring-cyan-400/40">
              <Dna className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Patient Profile Library
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {presets.length} Scenarios
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Curated demographic digital-twins and pharmacogenomic (PGx) genetic diplotypes. Switch between physiological scenarios to evaluate clearance kinetics, dose accumulation, and ADR vulnerabilities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Patient Profile</span>
            </button>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('simulation')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                <span>Simulation Workbench</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            )}
          </div>
        </div>

        {/* Currently Loaded Scenario Highlight Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-300">
                Active Simulation Profile
              </span>
              <span className="text-xs text-slate-400">
                (Controlling real-time ADME ODE engine & ADR predictions)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activePresetId ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Preset: {presets.find((p) => p.id === activePresetId)?.name}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400">
                  Custom Parameter State
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Demographics</span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {currentPatient.age} yo · {currentPatient.gender.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400">{currentPatient.weightKg} kg</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Renal Function</span>
              <span className="text-sm font-bold text-cyan-300 block mt-0.5">
                {currentPatient.renalFunctionEgfr} mL/min
              </span>
              <span className="text-[10px] text-slate-400 truncate block">
                {getCkdStage(currentPatient.renalFunctionEgfr).stage.split('(')[0]}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Hepatic Capacity</span>
              <span className="text-sm font-bold text-teal-300 block mt-0.5 capitalize">
                {currentPatient.hepaticFunction.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-slate-400">CYP clearance scale</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">CYP2D6 Diplotype</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${getGenotypeColor(currentPatient.cyp2d6Genotype)}`}>
                {currentPatient.cyp2d6Genotype.replace('_metabolizer', '')}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">CYP2C19 Diplotype</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${getGenotypeColor(currentPatient.cyp2c19Genotype)}`}>
                {currentPatient.cyp2c19Genotype.replace('_metabolizer', '')}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">CYP2C9 & SLCO1B1</span>
              <span className="text-xs font-bold text-slate-300 block mt-0.5">
                {currentPatient.cyp2c9Genotype ? currentPatient.cyp2c9Genotype.replace('_metabolizer', '') : 'normal'}
              </span>
              <span className="text-[10px] text-slate-400">
                {currentPatient.smokingStatus === 'smoker' ? '🚬 Smoker (CYP1A2 ↑)' : 'Non-smoker'}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scenarios, genetics, CKD stages, or comorbidities..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'all'
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              All Scenarios ({presets.length})
            </button>
            <button
              onClick={() => setCategoryFilter('geriatric')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'geriatric'
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Geriatric
            </button>
            <button
              onClick={() => setCategoryFilter('pharmacogenomic')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'pharmacogenomic'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-purple-300'
              }`}
            >
              Pharmacogenomics (PGx)
            </button>
            <button
              onClick={() => setCategoryFilter('hepatic')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'hepatic'
                  ? 'bg-teal-600 text-white border-teal-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-teal-300'
              }`}
            >
              Hepatic Cirrhosis
            </button>
            <button
              onClick={() => setCategoryFilter('renal')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'renal'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-300'
              }`}
            >
              Renal Allograft / CKD
            </button>
            <button
              onClick={() => setCategoryFilter('custom')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'custom'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-indigo-300'
              }`}
            >
              Custom ({presets.filter((p) => p.isCustom).length})
            </button>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => {
          const isActive = activePresetId === preset.id;
          const ckd = getCkdStage(preset.patientContext.renalFunctionEgfr);
          const pc = preset.patientContext;

          return (
            <div
              key={preset.id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              {/* Card Top: Title, Category & Active Badge */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {preset.category}
                      </span>
                      {preset.isCustom && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Custom
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Active Scenario
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base mt-1.5 tracking-tight">
                      {preset.name}
                    </h3>
                  </div>

                  {preset.isCustom && (
                    <button
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete custom preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>
              </div>

              {/* Physiological & Genetic Parameters Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs font-mono">
                {/* Demographics Row */}
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 text-[11px]">Age / Sex / Wt:</span>
                  <span className="font-bold text-white">
                    {pc.age} yo · {pc.gender} · {pc.weightKg} kg
                  </span>
                </div>

                {/* Renal Row */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Renal eGFR:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${ckd.color}`}>
                    {pc.renalFunctionEgfr} mL/min
                  </span>
                </div>

                {/* Hepatic Row */}
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 text-[11px]">Hepatic Function:</span>
                  <span className="capitalize font-semibold text-teal-300">
                    {pc.hepaticFunction.replace('_', ' ')}
                  </span>
                </div>

                {/* Genetic Diplotypes Row */}
                <div className="pt-1 border-t border-slate-850 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase block tracking-wider">
                    Genetic Diplotypes:
                  </span>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded border ${getGenotypeColor(pc.cyp2d6Genotype)}`}>
                      2D6: {pc.cyp2d6Genotype.replace('_metabolizer', '')}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded border ${getGenotypeColor(pc.cyp2c19Genotype)}`}>
                      2C19: {pc.cyp2c19Genotype.replace('_metabolizer', '')}
                    </span>
                    {pc.cyp2c9Genotype && (
                      <span className={`px-1.5 py-0.5 rounded border ${getGenotypeColor(pc.cyp2c9Genotype)}`}>
                        2C9: {pc.cyp2c9Genotype.replace('_metabolizer', '')}
                      </span>
                    )}
                    {pc.slco1b1Genotype && pc.slco1b1Genotype !== 'normal_function' && (
                      <span className="px-1.5 py-0.5 rounded border bg-rose-950 text-rose-300 border-rose-800">
                        SLCO1B1: {pc.slco1b1Genotype.replace('_function', '')}
                      </span>
                    )}
                    {pc.vkorc1Genotype && pc.vkorc1Genotype !== 'normal_sensitivity' && (
                      <span className="px-1.5 py-0.5 rounded border bg-rose-950 text-rose-300 border-rose-800">
                        VKORC1 Sensitive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Narrative Scenario / Clinical Risk Bullet */}
              {preset.riskHighlights && preset.riskHighlights.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Scenario PK Vulnerabilities:
                  </span>
                  <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                    {preset.riskHighlights.slice(0, 2).map((risk, idx) => (
                      <li key={idx} className="line-clamp-1">
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950'
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Loaded in Twin</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Apply Scenario</span>
                    </>
                  )}
                </button>

                {preset.recommendedRegimenIds && preset.recommendedRegimenIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleApplyAndLoadRegimen(preset)}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                    title={`Apply profile and load scenario drugs (${preset.recommendedRegimenIds.join(', ')})`}
                  >
                    + Drugs
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(preset)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  title="Clone as Custom Profile"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPresets.length === 0 && (
        <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No Patient Scenarios Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No profile presets match your search query "{searchQuery}". Try clearing filters or create a new custom patient digital-twin.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Create / Edit Patient Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Create / Edit Patient Demographic & Genetic Profile
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Profile Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Profile Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Geriatric Post-PCI Patient"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Clinical Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="custom">Custom Clinical Profile</option>
                    <option value="geriatric">Geriatric / Frailty</option>
                    <option value="pharmacogenomic">Pharmacogenomics (PGx)</option>
                    <option value="renal">Renal Impairment / CKD</option>
                    <option value="hepatic">Hepatic Cirrhosis</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="critical_care">Critical Care / ICU</option>
                    <option value="standard">Standard Reference</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Scenario Summary</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 72 yo male with CKD Stage 3b and CYP2D6 intermediate metabolism"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Demographics Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-400 block">
                  Demographic Parameters
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Age (years)</label>
                    <input
                      type="number"
                      min={1}
                      max={110}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Weight (kg)</label>
                    <input
                      type="number"
                      min={10}
                      max={220}
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Organ Function Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-400 block">
                  Organ Function Baseline
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Renal eGFR</span>
                      <span className="font-mono text-cyan-300 font-bold">{formData.renalFunctionEgfr} mL/min</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={130}
                      value={formData.renalFunctionEgfr}
                      onChange={(e) => setFormData({ ...formData, renalFunctionEgfr: Number(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block truncate">
                      {getCkdStage(formData.renalFunctionEgfr).stage}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Hepatic Function</label>
                    <select
                      value={formData.hepaticFunction}
                      onChange={(e) => setFormData({ ...formData, hepaticFunction: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="normal">Normal Hepatic</option>
                      <option value="mild_impairment">Mild Impairment (Child-Pugh A)</option>
                      <option value="moderate_impairment">Moderate (Child-Pugh B)</option>
                      <option value="severe_impairment">Severe Cirrhosis (Child-Pugh C)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Serum Albumin (g/dL)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={1.5}
                      max={5.5}
                      value={formData.serumAlbuminGDl}
                      onChange={(e) => setFormData({ ...formData, serumAlbuminGDl: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    />
                    <span className="text-[10px] text-slate-500 block">Normal: 3.5 - 5.0 g/dL</span>
                  </div>
                </div>
              </div>

              {/* Genetic Markers & Diplotypes Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-purple-400 block">
                  Pharmacogenomic Genetic Markers (PGx)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">CYP2D6 Diplotype</label>
                    <select
                      value={formData.cyp2d6Genotype}
                      onChange={(e) => setFormData({ ...formData, cyp2d6Genotype: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="normal_metabolizer">Normal Metabolizer (*1/*1)</option>
                      <option value="intermediate_metabolizer">Intermediate (*1/*4)</option>
                      <option value="poor_metabolizer">Poor Metabolizer (*4/*4)</option>
                      <option value="ultra_rapid_metabolizer">Ultra-Rapid (*1xN)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">CYP2C19 Diplotype</label>
                    <select
                      value={formData.cyp2c19Genotype}
                      onChange={(e) => setFormData({ ...formData, cyp2c19Genotype: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="normal_metabolizer">Normal Metabolizer (*1/*1)</option>
                      <option value="intermediate_metabolizer">Intermediate (*1/*2)</option>
                      <option value="poor_metabolizer">Poor Metabolizer (*2/*2)</option>
                      <option value="rapid_metabolizer">Rapid (*1/*17 or *17/*17)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">CYP2C9 Diplotype</label>
                    <select
                      value={formData.cyp2c9Genotype}
                      onChange={(e) => setFormData({ ...formData, cyp2c9Genotype: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="normal_metabolizer">Normal Metabolizer (*1/*1)</option>
                      <option value="intermediate_metabolizer">Intermediate (*1/*3)</option>
                      <option value="poor_metabolizer">Poor Metabolizer (*3/*3)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">SLCO1B1 (Statin Uptake)</label>
                    <select
                      value={formData.slco1b1Genotype}
                      onChange={(e) => setFormData({ ...formData, slco1b1Genotype: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="normal_function">Normal Function</option>
                      <option value="decreased_function">Decreased Function (521T&gt;C)</option>
                      <option value="poor_function">Poor Function (High Myopathy)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">VKORC1 Sensitivity</label>
                    <select
                      value={formData.vkorc1Genotype}
                      onChange={(e) => setFormData({ ...formData, vkorc1Genotype: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="normal_sensitivity">Normal Sensitivity (G/G)</option>
                      <option value="high_warfarin_sensitivity">High Sensitivity (A/A)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Tobacco Smoking (CYP1A2)</label>
                    <select
                      value={formData.smokingStatus}
                      onChange={(e) => setFormData({ ...formData, smokingStatus: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="non_smoker">Non-Smoker (Normal CYP1A2)</option>
                      <option value="smoker">Active Smoker (CYP1A2 Induced ↑)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Comorbidities & Scenario Details */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Comorbidities (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.comorbiditiesText}
                  onChange={(e) => setFormData({ ...formData, comorbiditiesText: e.target.value })}
                  placeholder="e.g. Type 2 Diabetes, Atrial Fibrillation, CKD Stage 3b"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer shadow-md shadow-cyan-950"
                >
                  Save & Apply to Simulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
