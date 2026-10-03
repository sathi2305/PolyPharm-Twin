import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sliders,
  Sparkles,
  ShieldAlert,
  Dna,
  Activity,
  Check,
  RotateCcw,
  Save,
  BookOpen,
  Info,
  Layers,
  Thermometer,
  Zap,
  Target,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import { LlmTrainingProfile, LlmReasoningMode, LlmKnowledgeScope } from '../types';
import { DEFAULT_LLM_TRAINING_PROFILES } from '../data/llmTrainingProfilesData';
import { storageService } from '../services/storageService';

interface LlmTrainingRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: LlmTrainingProfile;
  onApplyProfile: (profile: LlmTrainingProfile) => void;
  currentLanguageName?: string;
}

export const LlmTrainingRangeModal: React.FC<LlmTrainingRangeModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onApplyProfile,
  currentLanguageName = 'English',
}) => {
  const [profiles, setProfiles] = useState<LlmTrainingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeProfile.id);

  // Editable parameters
  const [name, setName] = useState<string>(activeProfile.name);
  const [badge, setBadge] = useState<string>(activeProfile.badge);
  const [description, setDescription] = useState<string>(activeProfile.description);
  const [llmMode, setLlmMode] = useState<LlmReasoningMode>(activeProfile.llmMode);
  const [temperature, setTemperature] = useState<number>(activeProfile.temperature);
  const [knowledgeScope, setKnowledgeScope] = useState<LlmKnowledgeScope>(activeProfile.knowledgeScope);
  const [therapeuticVigilanceLevel, setTherapeuticVigilanceLevel] = useState<'strict_nti' | 'moderate' | 'relaxed'>(
    activeProfile.therapeuticVigilanceLevel
  );
  const [thinkingBudget, setThinkingBudget] = useState<'minimal' | 'low' | 'medium' | 'high'>(
    activeProfile.thinkingBudget || 'medium'
  );
  const [customDirectives, setCustomDirectives] = useState<string>(activeProfile.customDirectives || '');

  // Training convergence animation state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingStep, setTrainingStep] = useState<string>('');
  const [trainingSuccess, setTrainingSuccess] = useState<boolean>(false);
  const [testSampleQuery, setTestSampleQuery] = useState<string>('warfarin_amiodarone');

  useEffect(() => {
    if (isOpen) {
      const all = storageService.getAllLlmTrainingProfiles();
      setProfiles(all);
      loadProfileData(activeProfile);
      setTrainingSuccess(false);
    }
  }, [isOpen, activeProfile]);

  const loadProfileData = (p: LlmTrainingProfile) => {
    setSelectedProfileId(p.id);
    setName(p.name);
    setBadge(p.badge);
    setDescription(p.description);
    setLlmMode(p.llmMode);
    setTemperature(p.temperature);
    setKnowledgeScope(p.knowledgeScope);
    setTherapeuticVigilanceLevel(p.therapeuticVigilanceLevel);
    setThinkingBudget(p.thinkingBudget || 'medium');
    setCustomDirectives(p.customDirectives || '');
    setTrainingSuccess(false);
  };

  if (!isOpen) return null;

  const handleSelectPreset = (p: LlmTrainingProfile) => {
    loadProfileData(p);
  };

  const handleTrainAndApply = () => {
    setIsTraining(true);
    setTrainingSuccess(false);
    setTrainingStep('Grounding Therapeutic Drug Monitoring (TDM) reference windows...');

    setTimeout(() => {
      setTrainingStep('Injecting CPIC pharmacogenomic diplotype decision algorithms...');
    }, 400);

    setTimeout(() => {
      setTrainingStep('Calibrating LLM reasoning temperature and continuous ODE constraints...');
    }, 800);

    setTimeout(() => {
      const updatedProfile: LlmTrainingProfile = {
        id: selectedProfileId,
        name,
        badge,
        description,
        llmMode,
        temperature,
        knowledgeScope,
        therapeuticVigilanceLevel,
        thinkingBudget,
        customDirectives,
      };

      storageService.saveActiveLlmTrainingProfile(updatedProfile);
      onApplyProfile(updatedProfile);

      setIsTraining(false);
      setTrainingSuccess(true);
      setTrainingStep('AI Assistant successfully trained and calibrated to selected range!');
    }, 1200);
  };

  const handleSaveAsCustom = () => {
    const customId = `custom_range_${Date.now()}`;
    const newProfile: LlmTrainingProfile = {
      id: customId,
      name: `${name} (Custom)`,
      badge: badge || 'Custom Range',
      description,
      llmMode,
      temperature,
      knowledgeScope,
      therapeuticVigilanceLevel,
      thinkingBudget,
      customDirectives,
      isPretrained: false,
    };
    const updated = storageService.saveCustomLlmProfile(newProfile);
    setProfiles(updated);
    setSelectedProfileId(customId);
    handleTrainAndApply();
  };

  const handleResetDefaults = () => {
    const defaultProfile = DEFAULT_LLM_TRAINING_PROFILES[0];
    loadProfileData(defaultProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">AI Assistant LLM Range & Training Console</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  v3.2 Digital Twin RAG
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibrate the reasoning range, therapeutic drug monitoring (TDM) vigilance, CPIC guidelines, and continuous ODE constraints.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Archetypes Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Select Pre-Trained Range Archetype
              </span>
              <span className="text-[11px] text-slate-400">
                {profiles.length} Available Archetypes
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {profiles.map((p) => {
                const isSelected = p.id === selectedProfileId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-bold text-xs text-white truncate">{p.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>T = {p.temperature.toFixed(2)}</span>
                      <span className="capitalize">{p.llmMode.replace(/_/g, ' ')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calibrate Active Profile Details */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                  Range Calibration Parameters: <span className="text-cyan-300">{name}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Active Language:</span>
                <span className="text-white font-bold">{currentLanguageName}</span>
              </div>
            </div>

            {/* Grid of Sliders and Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Temperature Slider */}
              <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    LLM Temperature Range (Stochasticity)
                  </label>
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-cyan-400">0.10: Strict TDM Math</span>
                  <span className="text-emerald-400">0.40: CPIC Guidelines</span>
                  <span className="text-amber-400">0.80: Exploratory Discovery</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {temperature <= 0.25
                    ? 'Deterministic mathematical mode: zero hallucination, strict adherence to therapeutic concentration boundaries.'
                    : temperature <= 0.55
                    ? 'Balanced clinical reasoning: adheres strictly to CPIC guidelines and published pharmacological studies.'
                    : 'Exploratory mode: broad hypothesis generation across non-standard metabolic and transporter pathways.'}
                </p>
              </div>

              {/* Reasoning Mode Range Selector */}
              <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Reasoning Mode Range
                </label>
                <select
                  value={llmMode}
                  onChange={(e) => setLlmMode(e.target.value as LlmReasoningMode)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="tdm_narrow_range">🎯 TDM Narrow Range (Therapeutic Drug Monitoring)</option>
                  <option value="pharmacogenomic_cpic">🧬 CPIC Pharmacogenomics & Diplotypes</option>
                  <option value="deep_mechanistic_cascade">⚡ Continuous ODE ADME Kinetic Cascade</option>
                  <option value="clinical_reasoning">🔬 Comprehensive Clinical Pharmacokinetics</option>
                  <option value="concise_summary">📋 Point-of-Care Rapid Triage (Concise)</option>
                  <option value="patient_friendly">💬 Patient Counseling & Clear Language</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Directs the chain-of-thought strategy and algorithmic depth PolyPharm AI applies to drug interactions.
                </p>
              </div>

              {/* Knowledge Scope / RAG Range Depth */}
              <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  RAG Knowledge Retrieval Scope
                </label>
                <select
                  value={knowledgeScope}
                  onChange={(e) => setKnowledgeScope(e.target.value as LlmKnowledgeScope)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="focused_tdm">Focused TDM (Therapeutic Windows & Toxic Ceilings)</option>
                  <option value="standard_pk">Standard PK (Bioavailability, t1/2, Protein Binding)</option>
                  <option value="comprehensive_pgx">Comprehensive PGx (Full Patient Twin, Diplotypes, eGFR)</option>
                  <option value="deep_mechanistic">Deep Mechanistic (Enzyme Ki, Induction, Active Metabolites)</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Determines the breadth of clinical metadata embedded into the system prompt context.
                </p>
              </div>

              {/* Therapeutic Index Vigilance Level */}
              <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Therapeutic Index (NTI) Vigilance
                </label>
                <select
                  value={therapeuticVigilanceLevel}
                  onChange={(e) => setTherapeuticVigilanceLevel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="strict_nti">Strict NTI Vigilance (Hard alerts on Warfarin, Digoxin, Lithium, Phenytoin)</option>
                  <option value="moderate">Moderate Vigilance (Standard Clinical Windows)</option>
                  <option value="relaxed">Relaxed / Academic Research</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Triggers immediate priority overrides when simulated plasma levels cross safety thresholds.
                </p>
              </div>
            </div>

            {/* Custom Directives Tuning */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                  Custom System Directives (Prompt Fine-Tuning)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Appended to LLM System Prompt</span>
              </label>
              <textarea
                rows={2}
                value={customDirectives}
                onChange={(e) => setCustomDirectives(e.target.value)}
                placeholder="e.g. Always evaluate renal dose adjustments for CKD Stage 3, and mention CPIC Level A recommendations explicitly."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Training Convergence Status */}
          {isTraining && (
            <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
              <div className="space-y-0.5 text-xs font-mono">
                <div className="font-bold text-cyan-300">Training AI Assistant Cognitive Parameters...</div>
                <div className="text-cyan-400/90">{trainingStep}</div>
              </div>
            </div>
          )}

          {trainingSuccess && !isTraining && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center gap-3 animate-fadeIn">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                ✓
              </div>
              <div className="space-y-0.5 text-xs font-mono">
                <div className="font-bold text-emerald-300">Assistant Successfully Calibrated!</div>
                <div className="text-emerald-400/90">{trainingStep}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={handleSaveAsCustom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 text-xs font-medium cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save As Custom
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleTrainAndApply}
              disabled={isTraining}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-950/40 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Train & Calibrate Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
