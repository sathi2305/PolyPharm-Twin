import { Medicine, ChatSession, RegimenBaseline, PatientProfilePreset, ClinicalInteractionNote, LlmTrainingProfile, RegimenAnnotation } from '../types';
import { ALL_INITIAL_MEDICINES } from '../data/medicinesData';
import { DEFAULT_PATIENT_PRESETS } from '../data/patientPresetsData';
import { DEFAULT_CLINICAL_INTERACTION_NOTES } from '../data/defaultClinicalNotesData';
import { DEFAULT_LLM_TRAINING_PROFILES } from '../data/llmTrainingProfilesData';
import { DEFAULT_REGIMEN_ANNOTATIONS } from '../data/defaultRegimenAnnotationsData';

const STORAGE_KEYS = {
  MEDICINES: 'polypharm_medicines_v3',
  FAVORITES: 'polypharm_favorites_v3',
  RECENTS: 'polypharm_recents_v3',
  ACTIVE_DRUGS: 'polypharm_active_drugs_v3',
  THEME: 'polypharm_theme_v3',
  LANGUAGE: 'polypharm_language_v3',
  CHAT_SESSIONS: 'polypharm_chat_sessions_v3',
  BASELINE_REGIMEN: 'polypharm_baseline_regimen_v3',
  PATIENT_PRESETS: 'polypharm_patient_presets_v3',
  CLINICAL_NOTES: 'polypharm_clinical_notes_v3',
  DRUG_DOSAGES: 'polypharm_drug_dosages_v3',
  LLM_TRAINING_PROFILE: 'polypharm_llm_training_profile_v3',
  CUSTOM_LLM_PROFILES: 'polypharm_custom_llm_profiles_v3',
  REGIMEN_ANNOTATIONS: 'polypharm_regimen_annotations_v1',
};

export const storageService = {
  // Medicines
  getMedicines(): Medicine[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEDICINES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 100) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read medicines from localStorage:', e);
    }
    // Fallback to initial comprehensive database
    return ALL_INITIAL_MEDICINES;
  },

  saveMedicines(medicines: Medicine[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } catch (e) {
      console.warn('Failed to save medicines to localStorage:', e);
    }
  },

  addMedicine(newMed: Medicine): Medicine[] {
    const list = this.getMedicines();
    const updated = [newMed, ...list.filter((m) => m.id !== newMed.id)];
    this.saveMedicines(updated);
    return updated;
  },

  deleteMedicine(id: string): Medicine[] {
    const list = this.getMedicines();
    const updated = list.filter((m) => m.id !== id);
    this.saveMedicines(updated);
    return updated;
  },

  // Favorites
  getFavorites(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return stored ? JSON.parse(stored) : ['warfarin', 'amiodarone', 'simvastatin', 'clarithromycin', 'lisinopril'];
    } catch (e) {
      return ['warfarin', 'amiodarone'];
    }
  },

  toggleFavorite(id: string): string[] {
    const favs = this.getFavorites();
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next));
    } catch (e) {}
    return next;
  },

  // Active Drugs
  getActiveDrugIds(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRUGS);
      return stored ? JSON.parse(stored) : ['warfarin', 'amiodarone'];
    } catch (e) {
      return ['warfarin', 'amiodarone'];
    }
  },

  saveActiveDrugIds(ids: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DRUGS, JSON.stringify(ids));
    } catch (e) {}
  },

  // Theme
  getTheme(): 'dark' | 'light' | 'system' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      return (stored as any) || 'dark';
    } catch (e) {
      return 'dark';
    }
  },

  saveTheme(theme: 'dark' | 'light' | 'system'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {}
  },

  // Chat Sessions
  getChatSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  saveChatSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    } catch (e) {}
  },

  // Language Code
  getLanguageCode(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
    } catch (e) {
      return 'en';
    }
  },

  saveLanguageCode(code: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, code);
    } catch (e) {}
  },

  // Baseline Regimen for Comparison
  getBaselineRegimen(): RegimenBaseline | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BASELINE_REGIMEN);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  saveBaselineRegimen(baseline: RegimenBaseline | null): void {
    try {
      if (baseline) {
        localStorage.setItem(STORAGE_KEYS.BASELINE_REGIMEN, JSON.stringify(baseline));
      } else {
        localStorage.removeItem(STORAGE_KEYS.BASELINE_REGIMEN);
      }
    } catch (e) {}
  },

  // Patient Profile Presets
  getPatientPresets(): PatientProfilePreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PATIENT_PRESETS);
      if (stored) {
        const customPresets: PatientProfilePreset[] = JSON.parse(stored);
        if (Array.isArray(customPresets)) {
          // Merge defaults with custom user-saved presets
          return [...DEFAULT_PATIENT_PRESETS, ...customPresets];
        }
      }
    } catch (e) {
      console.warn('Failed to load patient presets from storage:', e);
    }
    return DEFAULT_PATIENT_PRESETS;
  },

  saveCustomPatientPreset(preset: PatientProfilePreset): PatientProfilePreset[] {
    try {
      const currentStored = localStorage.getItem(STORAGE_KEYS.PATIENT_PRESETS);
      const existingCustom: PatientProfilePreset[] = currentStored ? JSON.parse(currentStored) : [];
      const updated = [preset, ...existingCustom.filter((p) => p.id !== preset.id)];
      localStorage.setItem(STORAGE_KEYS.PATIENT_PRESETS, JSON.stringify(updated));
      return [...DEFAULT_PATIENT_PRESETS, ...updated];
    } catch (e) {
      console.warn('Failed to save patient preset:', e);
      return DEFAULT_PATIENT_PRESETS;
    }
  },

  deleteCustomPatientPreset(presetId: string): PatientProfilePreset[] {
    try {
      const currentStored = localStorage.getItem(STORAGE_KEYS.PATIENT_PRESETS);
      const existingCustom: PatientProfilePreset[] = currentStored ? JSON.parse(currentStored) : [];
      const updated = existingCustom.filter((p) => p.id !== presetId);
      localStorage.setItem(STORAGE_KEYS.PATIENT_PRESETS, JSON.stringify(updated));
      return [...DEFAULT_PATIENT_PRESETS, ...updated];
    } catch (e) {
      console.warn('Failed to delete custom patient preset:', e);
      return DEFAULT_PATIENT_PRESETS;
    }
  },

  getCustomPatientPresets(): PatientProfilePreset[] {
    try {
      const currentStored = localStorage.getItem(STORAGE_KEYS.PATIENT_PRESETS);
      return currentStored ? JSON.parse(currentStored) : [];
    } catch (e) {
      return [];
    }
  },

  importPatientPresets(incomingPresets: PatientProfilePreset[]): PatientProfilePreset[] {
    try {
      const currentStored = localStorage.getItem(STORAGE_KEYS.PATIENT_PRESETS);
      const existingCustom: PatientProfilePreset[] = currentStored ? JSON.parse(currentStored) : [];

      const map = new Map<string, PatientProfilePreset>();
      existingCustom.forEach((p) => map.set(p.name.trim().toLowerCase(), p));

      incomingPresets.forEach((p, idx) => {
        const validated: PatientProfilePreset = {
          id: p.id || `imported_preset_${Date.now()}_${idx}`,
          name: p.name || `Imported Patient Preset ${idx + 1}`,
          description: p.description || 'Imported clinical demographics',
          category: p.category || 'custom',
          clinicalScenario: p.clinicalScenario || '',
          riskHighlights: p.riskHighlights || [],
          tags: p.tags || [],
          isCustom: true,
          patientContext: {
            age: typeof p.patientContext?.age === 'number' ? p.patientContext.age : 60,
            gender: p.patientContext?.gender || 'male',
            weightKg: typeof p.patientContext?.weightKg === 'number' ? p.patientContext.weightKg : 70,
            renalFunctionEgfr:
              typeof p.patientContext?.renalFunctionEgfr === 'number'
                ? p.patientContext.renalFunctionEgfr
                : 80,
            hepaticFunction: p.patientContext?.hepaticFunction || 'normal',
            cyp2d6Genotype: p.patientContext?.cyp2d6Genotype || 'normal_metabolizer',
            cyp2c19Genotype: p.patientContext?.cyp2c19Genotype || 'normal_metabolizer',
            cyp2c9Genotype: p.patientContext?.cyp2c9Genotype || 'normal_metabolizer',
            slco1b1Genotype: p.patientContext?.slco1b1Genotype || 'normal_function',
            vkorc1Genotype: p.patientContext?.vkorc1Genotype || 'normal_sensitivity',
            smokingStatus: p.patientContext?.smokingStatus || 'non_smoker',
            serumAlbuminGDl: p.patientContext?.serumAlbuminGDl || 4.2,
            comorbidities: p.patientContext?.comorbidities || [],
          },
          createdAt: p.createdAt || new Date().toISOString(),
        };
        map.set(validated.name.trim().toLowerCase(), validated);
      });

      const updated = Array.from(map.values());
      localStorage.setItem(STORAGE_KEYS.PATIENT_PRESETS, JSON.stringify(updated));
      return [...DEFAULT_PATIENT_PRESETS, ...updated];
    } catch (e) {
      console.warn('Failed to import patient presets:', e);
      return this.getPatientPresets();
    }
  },

  // Clinical Interaction Notes (Custom Notes on Drug-Drug Interaction Pairs)
  getClinicalNotes(): Record<string, ClinicalInteractionNote> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLINICAL_NOTES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } else {
        // Initialize with default clinical notes if first time
        localStorage.setItem(STORAGE_KEYS.CLINICAL_NOTES, JSON.stringify(DEFAULT_CLINICAL_INTERACTION_NOTES));
        return { ...DEFAULT_CLINICAL_INTERACTION_NOTES };
      }
    } catch (e) {
      console.warn('Failed to load clinical interaction notes from storage:', e);
    }
    return { ...DEFAULT_CLINICAL_INTERACTION_NOTES };
  },

  getClinicalNoteForPair(drugAId: string, drugBId: string): ClinicalInteractionNote | null {
    const pairKey = [drugAId.toLowerCase().trim(), drugBId.toLowerCase().trim()].sort().join('--');
    const notes = this.getClinicalNotes();
    return notes[pairKey] || null;
  },

  saveClinicalNote(note: ClinicalInteractionNote): Record<string, ClinicalInteractionNote> {
    try {
      const notes = this.getClinicalNotes();
      const pairKey = note.pairKey || [note.drugAId.toLowerCase().trim(), note.drugBId.toLowerCase().trim()].sort().join('--');
      const updatedNote: ClinicalInteractionNote = {
        ...note,
        pairKey,
        updatedAt: new Date().toISOString(),
      };
      notes[pairKey] = updatedNote;
      localStorage.setItem(STORAGE_KEYS.CLINICAL_NOTES, JSON.stringify(notes));
      return { ...notes };
    } catch (e) {
      console.warn('Failed to save clinical interaction note:', e);
      return this.getClinicalNotes();
    }
  },

  deleteClinicalNote(pairKey: string): Record<string, ClinicalInteractionNote> {
    try {
      const notes = this.getClinicalNotes();
      delete notes[pairKey];
      localStorage.setItem(STORAGE_KEYS.CLINICAL_NOTES, JSON.stringify(notes));
      return { ...notes };
    } catch (e) {
      console.warn('Failed to delete clinical interaction note:', e);
      return this.getClinicalNotes();
    }
  },

  importClinicalNotes(incomingNotes: ClinicalInteractionNote[]): Record<string, ClinicalInteractionNote> {
    try {
      const current = this.getClinicalNotes();
      if (Array.isArray(incomingNotes)) {
        incomingNotes.forEach((n) => {
          if (n && n.drugAId && n.drugBId && n.note) {
            const pairKey = n.pairKey || [n.drugAId.toLowerCase().trim(), n.drugBId.toLowerCase().trim()].sort().join('--');
            current[pairKey] = {
              id: n.id || `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              pairKey,
              drugAId: n.drugAId,
              drugAName: n.drugAName || n.drugAId,
              drugBId: n.drugBId,
              drugBName: n.drugBName || n.drugBId,
              note: n.note,
              recommendation: n.recommendation || '',
              riskLevel: n.riskLevel || 'major',
              tags: Array.isArray(n.tags) ? n.tags : [],
              author: n.author || 'Clinical Specialist',
              createdAt: n.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
        });
      } else if (incomingNotes && typeof incomingNotes === 'object') {
        Object.values(incomingNotes as Record<string, ClinicalInteractionNote>).forEach((n) => {
          if (n && n.drugAId && n.drugBId && n.note) {
            const pairKey = n.pairKey || [n.drugAId.toLowerCase().trim(), n.drugBId.toLowerCase().trim()].sort().join('--');
            current[pairKey] = {
              ...n,
              pairKey,
              updatedAt: new Date().toISOString(),
            };
          }
        });
      }
      localStorage.setItem(STORAGE_KEYS.CLINICAL_NOTES, JSON.stringify(current));
      return { ...current };
    } catch (e) {
      console.warn('Failed to import clinical interaction notes:', e);
      return this.getClinicalNotes();
    }
  },

  // Drug Dosages (mg)
  getDrugDosages(): Record<string, number> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DRUG_DOSAGES);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  saveDrugDosages(dosages: Record<string, number>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DRUG_DOSAGES, JSON.stringify(dosages));
    } catch (e) {}
  },

  updateDrugDose(drugId: string, doseMg: number): Record<string, number> {
    const current = this.getDrugDosages();
    current[drugId] = doseMg;
    this.saveDrugDosages(current);
    return { ...current };
  },

  resetDrugDoses(): Record<string, number> {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRUG_DOSAGES);
    } catch (e) {}
    return {};
  },

  // LLM Reasoning Range & Training Profiles
  getActiveLlmTrainingProfile(): LlmTrainingProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LLM_TRAINING_PROFILE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return DEFAULT_LLM_TRAINING_PROFILES[0]; // tdm_strict default
  },

  saveActiveLlmTrainingProfile(profile: LlmTrainingProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LLM_TRAINING_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save active LLM training profile:', e);
    }
  },

  getAllLlmTrainingProfiles(): LlmTrainingProfile[] {
    try {
      const storedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_LLM_PROFILES);
      const custom: LlmTrainingProfile[] = storedCustom ? JSON.parse(storedCustom) : [];
      return [...DEFAULT_LLM_TRAINING_PROFILES, ...custom];
    } catch (e) {
      return DEFAULT_LLM_TRAINING_PROFILES;
    }
  },

  saveCustomLlmProfile(profile: LlmTrainingProfile): LlmTrainingProfile[] {
    try {
      const storedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_LLM_PROFILES);
      const custom: LlmTrainingProfile[] = storedCustom ? JSON.parse(storedCustom) : [];
      const filtered = custom.filter((p) => p.id !== profile.id);
      filtered.push({ ...profile, isPretrained: false });
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LLM_PROFILES, JSON.stringify(filtered));
      return [...DEFAULT_LLM_TRAINING_PROFILES, ...filtered];
    } catch (e) {
      console.warn('Failed to save custom LLM profile:', e);
      return DEFAULT_LLM_TRAINING_PROFILES;
    }
  },

  deleteCustomLlmProfile(profileId: string): LlmTrainingProfile[] {
    try {
      const storedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_LLM_PROFILES);
      const custom: LlmTrainingProfile[] = storedCustom ? JSON.parse(storedCustom) : [];
      const updated = custom.filter((p) => p.id !== profileId);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LLM_PROFILES, JSON.stringify(updated));
      return [...DEFAULT_LLM_TRAINING_PROFILES, ...updated];
    } catch (e) {
      return DEFAULT_LLM_TRAINING_PROFILES;
    }
  },

  // Regimen Clinical Annotations (Sticky Notes on Regimen Combinations)
  getRegimenFingerprint(drugIds: string[]): string {
    if (!drugIds || drugIds.length === 0) return 'empty_regimen';
    return [...drugIds].map((d) => d.trim().toLowerCase()).sort().join('+');
  },

  getRegimenAnnotations(): RegimenAnnotation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGIMEN_ANNOTATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.REGIMEN_ANNOTATIONS, JSON.stringify(DEFAULT_REGIMEN_ANNOTATIONS));
        return [...DEFAULT_REGIMEN_ANNOTATIONS];
      }
    } catch (e) {
      console.warn('Failed to load regimen annotations:', e);
    }
    return [...DEFAULT_REGIMEN_ANNOTATIONS];
  },

  getAnnotationsForRegimen(drugIds: string[]): RegimenAnnotation[] {
    const all = this.getRegimenAnnotations();
    const currentFingerprint = this.getRegimenFingerprint(drugIds);
    const drugIdSet = new Set(drugIds.map((d) => d.toLowerCase().trim()));

    return all.filter((ann) => {
      // 1. Matches exact fingerprint
      if (ann.regimenFingerprint === currentFingerprint) return true;
      // 2. Global note
      if (ann.regimenFingerprint === 'global' || !ann.drugIds || ann.drugIds.length === 0) return true;
      // 3. Note is tied to a subset of the currently active drugs
      if (ann.drugIds.length > 0 && ann.drugIds.every((id) => drugIdSet.has(id.toLowerCase().trim()))) {
        return true;
      }
      return false;
    });
  },

  saveRegimenAnnotation(annotation: RegimenAnnotation): RegimenAnnotation[] {
    try {
      const all = this.getRegimenAnnotations();
      const existingIdx = all.findIndex((a) => a.id === annotation.id);
      let updated: RegimenAnnotation[];
      const withTimestamp: RegimenAnnotation = {
        ...annotation,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        updated = [...all];
        updated[existingIdx] = withTimestamp;
      } else {
        updated = [withTimestamp, ...all];
      }

      localStorage.setItem(STORAGE_KEYS.REGIMEN_ANNOTATIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to save regimen annotation:', e);
      return this.getRegimenAnnotations();
    }
  },

  updateRegimenAnnotation(id: string, updates: Partial<RegimenAnnotation>): RegimenAnnotation[] {
    try {
      const all = this.getRegimenAnnotations();
      const updated = all.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEYS.REGIMEN_ANNOTATIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to update regimen annotation:', e);
      return this.getRegimenAnnotations();
    }
  },

  deleteRegimenAnnotation(id: string): RegimenAnnotation[] {
    try {
      const all = this.getRegimenAnnotations();
      const updated = all.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.REGIMEN_ANNOTATIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to delete regimen annotation:', e);
      return this.getRegimenAnnotations();
    }
  },

  togglePinRegimenAnnotation(id: string): RegimenAnnotation[] {
    try {
      const all = this.getRegimenAnnotations();
      const updated = all.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            isPinned: !a.isPinned,
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEYS.REGIMEN_ANNOTATIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to toggle pin on regimen annotation:', e);
      return this.getRegimenAnnotations();
    }
  },
};
