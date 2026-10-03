import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Medicine, ClinicalInteractionNote, EnzymeProfile, PkTimePoint, PatientContext } from '../types';
import { storageService } from '../services/storageService';
import { calculatePairwiseMetabolicHazards, MetabolicHazardAlert } from '../engine/metabolicHazardEngine';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Search,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Tag,
  UserCheck,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ClinicalInteractionNotesPanelProps {
  activeDrugs: Medicine[];
  allMedicines: Medicine[];
  liveEnzymes: EnzymeProfile[];
  timeSeries: PkTimePoint[];
  currentTimeHours: number;
  patientContext?: PatientContext;
  onNotesChange?: () => void;
  targetPairToOpen?: { drugAId: string; drugBId: string } | null;
  onClearTargetPair?: () => void;
}

const COMMON_CLINICAL_TAGS = [
  'INR Monitoring',
  'Bleeding Hazard',
  'CYP2C9 Inhibition',
  'CYP3A4 Saturation',
  'Dose Reduction 30-50%',
  'Renal Elimination Delay',
  'QTc Prolongation',
  'Therapeutic Drug Monitoring',
  'Geriatric Vigilance',
  'Hospital Protocol',
  'Black Box Warning',
];

const NOTE_TEMPLATES = [
  {
    label: 'CYP2C9 Bleeding Hazard (Warfarin + Amiodarone)',
    note: 'Amiodarone non-competitively inhibits CYP2C9 and CYP3A4, markedly reducing S-warfarin clearance. Significant elevation in INR is anticipated within 3 to 7 days.',
    recommendation: 'Empirically decrease Warfarin dosage by 30% to 50% upon Amiodarone initiation. Monitor baseline INR every 48–72 hours until stable therapeutic window is re-established.',
    riskLevel: 'contraindicated' as const,
    tags: ['INR Monitoring', 'Bleeding Hazard', 'CYP2C9 Inhibition', 'Dose Reduction 30-50%'],
  },
  {
    label: 'CYP3A4 Myopathy / Rhabdomyolysis (Statin + Macrolide)',
    note: 'Potent CYP3A4 inhibition elevates systemic statin exposure up to 5-fold, dramatically increasing the risk of acute rhabdomyolysis and hepatic transaminase elevation.',
    recommendation: 'Temporarily withhold the statin during the antimicrobial course, or substitute with a non-CYP3A4 metabolized alternative such as Pravastatin or Rosuvastatin.',
    riskLevel: 'major' as const,
    tags: ['CYP3A4 Saturation', 'Black Box Warning', 'Hospital Protocol'],
  },
  {
    label: 'Triple Whammy Acute Kidney Injury (ACEi + Diuretic + NSAID)',
    note: 'Concurrent afferent arteriolar vasoconstriction (NSAID) and efferent arteriolar vasodilation (ACEi/ARB) in a volume-depleted patient (diuretic) precipitates catastrophic glomerular filtration failure.',
    recommendation: 'Avoid systemic NSAID co-administration. Discontinue NSAID immediately and monitor serum creatinine, eGFR, and electrolytes daily.',
    riskLevel: 'critical' as any,
    tags: ['Renal Elimination Delay', 'Hospital Protocol', 'Geriatric Vigilance'],
  },
  {
    label: 'Serotonin Syndrome Monitoring',
    note: 'Co-administration of serotonergic agents or MAO-inhibiting compounds creates additive 5-HT accumulation leading to neuromuscular hyperactivity and autonomic instability.',
    recommendation: 'Assess patient for clonus, tremor, diaphoresis, and hyperreflexia. Maintain washout periods between transitions.',
    riskLevel: 'major' as const,
    tags: ['Therapeutic Drug Monitoring', 'Black Box Warning'],
  },
];

export const ClinicalInteractionNotesPanel: React.FC<ClinicalInteractionNotesPanelProps> = ({
  activeDrugs,
  allMedicines,
  liveEnzymes,
  timeSeries,
  currentTimeHours,
  patientContext,
  onNotesChange,
  targetPairToOpen,
  onClearTargetPair,
}) => {
  // Local state for persisted clinical notes
  const [notes, setNotes] = useState<Record<string, ClinicalInteractionNote>>(() =>
    storageService.getClinicalNotes()
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'with_notes' | 'high_hazard'>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // In-UI Deletion Confirmation State (replaces window.confirm)
  const [deleteConfirmPairKey, setDeleteConfirmPairKey] = useState<string | null>(null);

  // Editor Modal State
  const [editingPair, setEditingPair] = useState<{
    drugA: Medicine;
    drugB: Medicine;
    hazardAlert?: MetabolicHazardAlert;
    existingNote?: ClinicalInteractionNote;
  } | null>(null);

  const [formNote, setFormNote] = useState<string>('');
  const [formRecommendation, setFormRecommendation] = useState<string>('');
  const [formRiskLevel, setFormRiskLevel] = useState<ClinicalInteractionNote['riskLevel']>('major');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formCustomTag, setFormCustomTag] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('Clinical Specialist');

  // Custom pair selector (for pairs not currently active)
  const [isAddingArbitraryPair, setIsAddingArbitraryPair] = useState<boolean>(false);
  const [arbitraryDrugAId, setArbitraryDrugAId] = useState<string>('');
  const [arbitraryDrugBId, setArbitraryDrugBId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate live pairwise metabolic hazards for the active regimen
  const hazardSummary = useMemo(() => {
    return calculatePairwiseMetabolicHazards(
      activeDrugs,
      liveEnzymes,
      timeSeries,
      currentTimeHours,
      60,
      patientContext
    );
  }, [activeDrugs, liveEnzymes, timeSeries, currentTimeHours, patientContext]);

  // Compute all active drug pairs
  const activePairs = useMemo(() => {
    const list: {
      drugA: Medicine;
      drugB: Medicine;
      pairKey: string;
      hazardAlert?: MetabolicHazardAlert;
      note?: ClinicalInteractionNote;
    }[] = [];

    for (let i = 0; i < activeDrugs.length; i++) {
      for (let j = i + 1; j < activeDrugs.length; j++) {
        const drugA = activeDrugs[i];
        const drugB = activeDrugs[j];
        const pairKey = [drugA.id.toLowerCase().trim(), drugB.id.toLowerCase().trim()].sort().join('--');
        const alert = hazardSummary.alerts.find(
          (a) =>
            (a.drugA.id === drugA.id && a.drugB.id === drugB.id) ||
            (a.drugA.id === drugB.id && a.drugB.id === drugA.id)
        );
        const existingNote = notes[pairKey];
        list.push({
          drugA,
          drugB,
          pairKey,
          hazardAlert: alert,
          note: existingNote,
        });
      }
    }
    return list;
  }, [activeDrugs, hazardSummary, notes]);

  // Also include any notes for pairs not currently in the active regimen
  const inactiveAnnotatedPairs = useMemo(() => {
    const activePairKeys = new Set(activePairs.map((p) => p.pairKey));
    const extraList: {
      drugA: Medicine;
      drugB: Medicine;
      pairKey: string;
      hazardAlert?: MetabolicHazardAlert;
      note: ClinicalInteractionNote;
    }[] = [];

    Object.values(notes).forEach((note) => {
      if (!activePairKeys.has(note.pairKey)) {
        const drugA = allMedicines.find((m) => m.id === note.drugAId) || {
          id: note.drugAId,
          genericName: note.drugAName,
          brandNames: [],
          drugClass: 'Other' as const,
          smiles: '',
          molecularFormula: '',
          molecularWeight: 0,
          mechanismOfAction: '',
          targetProteins: [],
          enzymes: [],
          metabolites: [],
          adme: { bioavailability: 0, proteinBinding: 0, halfLifeHours: 0, clearanceLitersPerHour: 0, volumeDistributionLitersPerKg: 0, absorptionRateKa: 0 },
          knownInteractions: [],
          knownAdrs: [],
          contraindications: [],
          evidenceSource: '',
          lastUpdated: '',
        };
        const drugB = allMedicines.find((m) => m.id === note.drugBId) || {
          id: note.drugBId,
          genericName: note.drugBName,
          brandNames: [],
          drugClass: 'Other' as const,
          smiles: '',
          molecularFormula: '',
          molecularWeight: 0,
          mechanismOfAction: '',
          targetProteins: [],
          enzymes: [],
          metabolites: [],
          adme: { bioavailability: 0, proteinBinding: 0, halfLifeHours: 0, clearanceLitersPerHour: 0, volumeDistributionLitersPerKg: 0, absorptionRateKa: 0 },
          knownInteractions: [],
          knownAdrs: [],
          contraindications: [],
          evidenceSource: '',
          lastUpdated: '',
        };

        extraList.push({
          drugA,
          drugB,
          pairKey: note.pairKey,
          note,
        });
      }
    });

    return extraList;
  }, [activePairs, notes, allMedicines]);

  // Combined pairs with filtering
  const filteredDisplayPairs = useMemo(() => {
    const all = [...activePairs, ...inactiveAnnotatedPairs];

    return all.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.drugA.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.drugB.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.note?.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.note?.recommendation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.note?.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterMode === 'with_notes') {
        return Boolean(item.note);
      }
      if (filterMode === 'high_hazard') {
        return (item.hazardAlert?.hazardScore || 0) >= 60 || item.note?.riskLevel === 'contraindicated' || item.note?.riskLevel === 'major';
      }
      return true;
    });
  }, [activePairs, inactiveAnnotatedPairs, searchQuery, filterMode]);

  // Open Editor Modal for a specific pair
  const handleOpenEditor = (
    drugA: Medicine,
    drugB: Medicine,
    hazardAlert?: MetabolicHazardAlert,
    existingNote?: ClinicalInteractionNote
  ) => {
    const pairKey = [drugA.id.toLowerCase().trim(), drugB.id.toLowerCase().trim()].sort().join('--');
    const note = existingNote || notes[pairKey];

    setEditingPair({ drugA, drugB, hazardAlert, existingNote: note });
    if (note) {
      setFormNote(note.note);
      setFormRecommendation(note.recommendation || '');
      setFormRiskLevel(note.riskLevel || 'major');
      setFormTags(note.tags || []);
      setFormAuthor(note.author || 'Clinical Specialist');
    } else {
      setFormNote('');
      setFormRecommendation(hazardAlert?.recommendedAction || '');
      setFormRiskLevel(
        hazardAlert?.severity === 'critical'
          ? 'contraindicated'
          : hazardAlert?.severity === 'high'
          ? 'major'
          : 'moderate'
      );
      setFormTags(
        hazardAlert?.primaryEnzyme
          ? [`${hazardAlert.primaryEnzyme} Pathway`, 'Clinical Pharmacovigilance']
          : ['Clinical Review']
      );
      setFormAuthor('Clinical Specialist');
    }
  };

  // Open editor automatically if targetPairToOpen was requested from outside
  useEffect(() => {
    if (targetPairToOpen?.drugAId && targetPairToOpen?.drugBId) {
      const drugA = allMedicines.find((m) => m.id === targetPairToOpen.drugAId);
      const drugB = allMedicines.find((m) => m.id === targetPairToOpen.drugBId);
      if (drugA && drugB) {
        const pairKey = [drugA.id.toLowerCase().trim(), drugB.id.toLowerCase().trim()].sort().join('--');
        const alert = hazardSummary.alerts.find(
          (a) =>
            (a.drugA.id === drugA.id && a.drugB.id === drugB.id) ||
            (a.drugA.id === drugB.id && a.drugB.id === drugA.id)
        );
        handleOpenEditor(drugA, drugB, alert, notes[pairKey]);
        onClearTargetPair?.();
      }
    }
  }, [targetPairToOpen, allMedicines, hazardSummary, notes, onClearTargetPair]);

  const handleCloseEditor = () => {
    setEditingPair(null);
    setFormNote('');
    setFormRecommendation('');
    setFormTags([]);
    setFormCustomTag('');
  };

  const handleApplyTemplate = (tmpl: (typeof NOTE_TEMPLATES)[0]) => {
    setFormNote(tmpl.note);
    setFormRecommendation(tmpl.recommendation);
    setFormRiskLevel(tmpl.riskLevel as any);
    setFormTags(Array.from(new Set([...formTags, ...tmpl.tags])));
  };

  const handleToggleTag = (tag: string) => {
    if (formTags.includes(tag)) {
      setFormTags(formTags.filter((t) => t !== tag));
    } else {
      setFormTags([...formTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (!formCustomTag.trim()) return;
    const tag = formCustomTag.trim();
    if (!formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
    }
    setFormCustomTag('');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPair || !formNote.trim()) return;

    const pairKey = [
      editingPair.drugA.id.toLowerCase().trim(),
      editingPair.drugB.id.toLowerCase().trim(),
    ].sort().join('--');

    const newNote: ClinicalInteractionNote = {
      id: editingPair.existingNote?.id || `note_${Date.now()}`,
      pairKey,
      drugAId: editingPair.drugA.id,
      drugAName: editingPair.drugA.genericName,
      drugBId: editingPair.drugB.id,
      drugBName: editingPair.drugB.genericName,
      note: formNote.trim(),
      recommendation: formRecommendation.trim() || undefined,
      riskLevel: formRiskLevel,
      tags: formTags,
      author: formAuthor.trim() || 'Clinical Specialist',
      createdAt: editingPair.existingNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = storageService.saveClinicalNote(newNote);
    setNotes(updated);
    handleCloseEditor();
    onNotesChange?.();

    setStatusMessage(`Saved clinical note for ${newNote.drugAName} + ${newNote.drugBName} to local storage!`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const requestDeleteNote = (pairKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteConfirmPairKey(pairKey);
  };

  const confirmDeleteNote = () => {
    if (!deleteConfirmPairKey) return;
    const pairKey = deleteConfirmPairKey;
    const updated = storageService.deleteClinicalNote(pairKey);
    setNotes(updated);
    setDeleteConfirmPairKey(null);
    if (editingPair && editingPair.existingNote?.pairKey === pairKey) {
      handleCloseEditor();
    }
    onNotesChange?.();
    setStatusMessage('Clinical note removed from local storage.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const cancelDeleteNote = () => {
    setDeleteConfirmPairKey(null);
  };

  // Import Notes JSON
  const handleImportNotesFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let incoming: any[] = [];
      if (Array.isArray(parsed)) {
        incoming = parsed;
      } else if (Array.isArray(parsed.notes)) {
        incoming = parsed.notes;
      } else if (parsed.notes && typeof parsed.notes === 'object') {
        incoming = Object.values(parsed.notes);
      } else {
        throw new Error('Unrecognized clinical notes JSON format.');
      }

      const updated = storageService.importClinicalNotes(incoming);
      setNotes(updated);
      onNotesChange?.();
      setStatusMessage(`Successfully imported ${incoming.length} clinical note(s)!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to import clinical notes JSON:', err);
      setStatusMessage(`Error: ${err?.message || 'Invalid JSON file'}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Arbitrary pair adder
  const handleStartArbitraryPair = () => {
    if (!arbitraryDrugAId || !arbitraryDrugBId || arbitraryDrugAId === arbitraryDrugBId) return;
    const drugA = allMedicines.find((m) => m.id === arbitraryDrugAId);
    const drugB = allMedicines.find((m) => m.id === arbitraryDrugBId);
    if (drugA && drugB) {
      handleOpenEditor(drugA, drugB);
      setIsAddingArbitraryPair(false);
      setArbitraryDrugAId('');
      setArbitraryDrugBId('');
    }
  };

  const totalNotesCount = Object.keys(notes).length;

  return (
    <div id="clinical-interaction-notes-panel" className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      {/* Top Banner: Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base tracking-tight">
              Pairwise Drug-Drug Interactions & Custom Clinical Notes
            </h3>
            {totalNotesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                {totalNotesCount} Note{totalNotesCount === 1 ? '' : 's'} Persisted
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Attach persistent clinical documentation, dosage adjustments, and patient-specific guidelines to drug pairs
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {statusMessage && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-500/40 flex items-center gap-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              {statusMessage}
            </span>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleImportNotesFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            title="Import notes from JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingArbitraryPair(!isAddingArbitraryPair)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingArbitraryPair ? 'Cancel' : 'Annotate Any Pair'}</span>
          </button>
        </div>
      </div>

      {/* Arbitrary Drug Pair Selector Drawer */}
      {isAddingArbitraryPair && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs font-mono">
            <Plus className="w-3.5 h-3.5" />
            <span>Select Any Two Drugs from Library to Create a Custom Clinical Note</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Primary Drug (A)</label>
              <select
                value={arbitraryDrugAId}
                onChange={(e) => setArbitraryDrugAId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">Select Drug A...</option>
                {allMedicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.genericName} ({m.drugClass.split('/')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Interacting Drug (B)</label>
              <select
                value={arbitraryDrugBId}
                onChange={(e) => setArbitraryDrugBId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">Select Drug B...</option>
                {allMedicines
                  .filter((m) => m.id !== arbitraryDrugAId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.genericName} ({m.drugClass.split('/')[0]})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingArbitraryPair(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!arbitraryDrugAId || !arbitraryDrugBId || arbitraryDrugAId === arbitraryDrugBId}
              onClick={handleStartArbitraryPair}
              className="px-3.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
            >
              Open Note Editor
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search interaction pairs by drug name, note content, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
              filterMode === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            All Pairs ({activePairs.length})
          </button>

          <button
            onClick={() => setFilterMode('with_notes')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
              filterMode === 'with_notes'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Annotated ({totalNotesCount})
          </button>

          <button
            onClick={() => setFilterMode('high_hazard')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
              filterMode === 'high_hazard'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            High Risk
          </button>
        </div>
      </div>

      {/* Pairs Grid / List */}
      {filteredDisplayPairs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-slate-300 font-semibold text-xs">
            {activeDrugs.length < 2
              ? 'No Multi-Drug Interaction Pairs in Current Regimen'
              : 'No Interaction Pairs Match Filter Criteria'}
          </h4>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            {activeDrugs.length < 2
              ? 'Select at least two drugs in the regimen above, or use the "Annotate Any Pair" button to document clinical notes between any two compounds.'
              : 'Try clearing your search query or switching to "All Pairs".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredDisplayPairs.map(({ drugA, drugB, pairKey, hazardAlert, note }) => {
            const hasNote = Boolean(note);
            const severity = note?.riskLevel || hazardAlert?.severity || 'moderate';

            const severityBadgeStyle =
              severity === 'contraindicated' || severity === 'critical'
                ? 'bg-rose-950/80 border-rose-600/70 text-rose-300'
                : severity === 'major' || severity === 'high'
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : severity === 'moderate'
                ? 'bg-yellow-950/60 border-yellow-500/50 text-yellow-300'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300';

            return (
              <div
                key={pairKey}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative group ${
                  hasNote
                    ? 'bg-slate-950/95 border-cyan-500/50 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Drug Pair Names & Severity Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs tracking-tight">
                        {drugA.genericName}
                      </span>
                      <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-bold text-white text-xs tracking-tight">
                        {drugB.genericName}
                      </span>

                      {/* Chemical formulas */}
                      <span className="text-[10px] font-mono text-slate-500">
                        [{drugA.molecularFormula || 'Compound'} + {drugB.molecularFormula || 'Compound'}]
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shrink-0 ${severityBadgeStyle}`}
                    >
                      {severity}
                    </span>
                  </div>

                  {/* Biological Mechanism / Enzyme Indicator */}
                  {hazardAlert && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-2">
                      <span className="text-cyan-400 font-semibold">
                        CYP: {hazardAlert.primaryEnzyme || 'Metabolic Competition'}
                      </span>
                      <span>•</span>
                      <span>
                        Hazard: <strong className="text-amber-300">{hazardAlert.hazardScore}%</strong>
                      </span>
                      {hazardAlert.foldExposureIncrease > 1 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-400 font-bold">
                            {hazardAlert.foldExposureIncrease}x AUC exposure
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Clinical Consequence from Engine / Evidence */}
                  {hazardAlert?.clinicalRisk && (
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-2 italic">
                      "{hazardAlert.clinicalRisk}"
                    </p>
                  )}
                </div>

                {/* Custom Note Body if Attached */}
                {hasNote && note && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-700/40 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-semibold border-b border-cyan-800/40 pb-1">
                      <span className="flex items-center gap-1.5">
                        <Bookmark className="w-3 h-3 text-cyan-400 fill-cyan-400/40" />
                        Clinical Annotation
                      </span>
                      <span className="text-slate-400">
                        By {note.author || 'Clinical Specialist'} • {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Note Content */}
                    <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {note.note}
                    </p>

                    {/* Recommendation Callout */}
                    {note.recommendation && (
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-cyan-300">Action Plan: </span>
                          {note.recommendation}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {note.tags.map((tg, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-900/60 text-cyan-300 border border-cyan-700/50"
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions Bottom Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[10px] font-mono text-slate-500">
                    {hasNote ? 'Note saved in localStorage' : 'No clinical note attached'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {hasNote ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditor(drugA, drugB, hazardAlert, note)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Note</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => requestDeleteNote(pairKey, e)}
                          className="flex items-center gap-1 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 text-[11px] cursor-pointer transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(drugA, drugB, hazardAlert)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Clinical Note</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clinical Note Editor Modal */}
      {editingPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-sm">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Clinical Interaction Note: {editingPair.drugA.genericName} + {editingPair.drugB.genericName}
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Pair Key: {editingPair.existingNote?.pairKey || [editingPair.drugA.id, editingPair.drugB.id].sort().join('--')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseEditor}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveNote} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Context Summary Box */}
              {editingPair.hazardAlert && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                  <span className="font-bold text-cyan-400 font-mono text-[10px] block uppercase">
                    Pharmacokinetic Interaction Context:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    {editingPair.hazardAlert.mechanism}
                  </p>
                </div>
              )}

              {/* Quick Clinical Templates */}
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Quick-Fill Clinical Templates:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {NOTE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-600/50 text-[10px] text-slate-300 cursor-pointer transition-colors"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Content Textarea */}
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">
                  Clinical Observation & Mechanism Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Describe observed drug-drug interaction consequences, metabolic competition, patient vulnerability, and pharmacokinetic shifts..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans leading-relaxed"
                />
              </div>

              {/* Clinical Recommendation & Action Plan */}
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">
                  Actionable Clinical Recommendation / Protocol Directive
                </label>
                <input
                  type="text"
                  value={formRecommendation}
                  onChange={(e) => setFormRecommendation(e.target.value)}
                  placeholder="e.g. Reduce Warfarin by 40%, monitor INR every 72 hours, order baseline LFTs"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Risk Level & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Clinical Severity Classification
                  </label>
                  <select
                    value={formRiskLevel}
                    onChange={(e) => setFormRiskLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="contraindicated">Contraindicated (Absolute Avoidance)</option>
                    <option value="major">Major (High Hazard / Close Monitoring)</option>
                    <option value="moderate">Moderate (Dose Adjustment Needed)</option>
                    <option value="minor">Minor (Low Hazard / Informational)</option>
                    <option value="safe">Safe Under Supervised Protocol</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Author / Clinician Identity
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. Dr. Sarah Chen, PharmD"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Clinical Tags */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-300 font-bold block">
                  Clinical Classification Tags:
                </label>

                {/* Predefined Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CLINICAL_TAGS.map((tag) => {
                    const isSelected = formTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-cyan-900 text-cyan-200 border-cyan-500 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Tag Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={formCustomTag}
                    onChange={(e) => setFormCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Add custom tag (e.g. ICU-Alert, Dialysis)..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold cursor-pointer"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  {editingPair.existingNote && (
                    <button
                      type="button"
                      onClick={() => requestDeleteNote(editingPair.existingNote!.pairKey)}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Note</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseEditor}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-cyan-950/40 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Local Storage</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-UI Deletion Confirmation Modal */}
      {deleteConfirmPairKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/60 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <h4 className="font-bold text-white text-sm">Delete Clinical Interaction Note?</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to remove the custom clinical note for interaction pair{' '}
              <span className="font-mono text-cyan-300 font-semibold">{deleteConfirmPairKey}</span>? This will permanently erase the custom documentation from your local storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={cancelDeleteNote}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-md shadow-rose-950/50"
              >
                Yes, Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
