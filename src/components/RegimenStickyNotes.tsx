import React, { useState, useMemo, useEffect } from 'react';
import { Medicine, RegimenAnnotation, StickyNoteColor, AnnotationCategory } from '../types';
import { storageService } from '../services/storageService';
import { useLanguage } from '../context/LanguageContext';
import {
  Pin,
  Plus,
  StickyNote,
  Trash2,
  Edit2,
  Copy,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Activity,
  Pill,
  FileText,
  UserCheck,
  Bookmark,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';

interface RegimenStickyNotesProps {
  activeDrugs: Medicine[];
  onNavigateTab?: (tab: any) => void;
  className?: string;
}

const COLOR_CONFIG: Record<
  StickyNoteColor,
  {
    name: string;
    border: string;
    bg: string;
    text: string;
    accent: string;
    chipBg: string;
    chipText: string;
    dotColor: string;
  }
> = {
  yellow: {
    name: 'Canary Yellow',
    border: 'border-amber-400/50 hover:border-amber-300',
    bg: 'bg-amber-950/35 hover:bg-amber-950/45',
    text: 'text-amber-100',
    accent: 'text-amber-300',
    chipBg: 'bg-amber-900/60 border border-amber-500/40',
    chipText: 'text-amber-200',
    dotColor: 'bg-amber-400',
  },
  teal: {
    name: 'Mint Teal',
    border: 'border-teal-400/50 hover:border-teal-300',
    bg: 'bg-teal-950/35 hover:bg-teal-950/45',
    text: 'text-teal-100',
    accent: 'text-teal-300',
    chipBg: 'bg-teal-900/60 border border-teal-500/40',
    chipText: 'text-teal-200',
    dotColor: 'bg-teal-400',
  },
  rose: {
    name: 'Urgent Rose',
    border: 'border-rose-400/50 hover:border-rose-300',
    bg: 'bg-rose-950/35 hover:bg-rose-950/45',
    text: 'text-rose-100',
    accent: 'text-rose-300',
    chipBg: 'bg-rose-900/60 border border-rose-500/40',
    chipText: 'text-rose-200',
    dotColor: 'bg-rose-400',
  },
  purple: {
    name: 'Genomics Purple',
    border: 'border-purple-400/50 hover:border-purple-300',
    bg: 'bg-purple-950/35 hover:bg-purple-950/45',
    text: 'text-purple-100',
    accent: 'text-purple-300',
    chipBg: 'bg-purple-900/60 border border-purple-500/40',
    chipText: 'text-purple-200',
    dotColor: 'bg-purple-400',
  },
  blue: {
    name: 'Clinical Blue',
    border: 'border-sky-400/50 hover:border-sky-300',
    bg: 'bg-sky-950/35 hover:bg-sky-950/45',
    text: 'text-sky-100',
    accent: 'text-sky-300',
    chipBg: 'bg-sky-900/60 border border-sky-500/40',
    chipText: 'text-sky-200',
    dotColor: 'bg-sky-400',
  },
};

const CATEGORY_META: Record<
  AnnotationCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  dosing_strategy: { label: 'Dosing Strategy', icon: Pill },
  lab_monitoring: { label: 'Lab Monitoring', icon: Activity },
  contraindication: { label: 'Contraindication', icon: AlertOctagon },
  pharmacist_memo: { label: 'Pharmacist Memo', icon: FileText },
  patient_counseling: { label: 'Patient Counseling', icon: UserCheck },
  general: { label: 'General Note', icon: Bookmark },
};

const CLINICAL_NOTE_TEMPLATES: {
  title: string;
  category: AnnotationCategory;
  color: StickyNoteColor;
  content: string;
}[] = [
  {
    title: 'INR & Coagulation Titration',
    category: 'dosing_strategy',
    color: 'yellow',
    content:
      'Check baseline INR and empirically decrease maintenance dose by 30–50% upon partner drug introduction. Repeat INR in 72h until target INR 2.0–3.0 is reached.',
  },
  {
    title: 'QTc Prolongation Surveillance',
    category: 'lab_monitoring',
    color: 'rose',
    content:
      'Baseline 12-lead ECG obtained. Check repeat ECG at day 7. Maintain serum potassium > 4.0 mEq/L and magnesium > 2.0 mg/dL.',
  },
  {
    title: 'Renal Clearance & eGFR Monitoring',
    category: 'lab_monitoring',
    color: 'purple',
    content:
      'Schedule follow-up BMP with serum creatinine and eGFR at 2 weeks. Advise patient to maintain adequate oral hydration.',
  },
  {
    title: 'Discharge Bleeding Precaution Counseling',
    category: 'patient_counseling',
    color: 'teal',
    content:
      'Counseled patient and caregiver on signs of microvascular bleeding, dark tarry stools, and hematuria. Avoid OTC NSAIDs or aspirin without pharmacy clearance.',
  },
  {
    title: 'Therapeutic Drug Monitoring (TDM)',
    category: 'pharmacist_memo',
    color: 'blue',
    content:
      'Draw trough blood concentration 30 minutes prior to morning dose. Verify steady-state timing (at least 4–5 half-lives).',
  },
];

export const RegimenStickyNotes: React.FC<RegimenStickyNotesProps> = ({
  activeDrugs,
  className = '',
}) => {
  const { translate } = useLanguage();
  // Load persistent annotations
  const [annotations, setAnnotations] = useState<RegimenAnnotation[]>(() =>
    storageService.getRegimenAnnotations()
  );

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'current_regimen' | 'all'>('current_regimen');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editor Modal / Card State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<AnnotationCategory>('dosing_strategy');
  const [formColor, setFormColor] = useState<StickyNoteColor>('yellow');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formAuthor, setFormAuthor] = useState('Clinical Specialist');
  const [formScope, setFormScope] = useState<'current' | 'global'>('current');

  // Compute active regimen fingerprint
  const currentFingerprint = useMemo(() => {
    return storageService.getRegimenFingerprint(activeDrugs.map((d) => d.id));
  }, [activeDrugs]);

  const activeDrugNames = useMemo(() => {
    return activeDrugs.map((d) => d.genericName);
  }, [activeDrugs]);

  // Sync annotations when localStorage changes
  const reloadAnnotations = () => {
    setAnnotations(storageService.getRegimenAnnotations());
  };

  // Filtered annotations
  const displayedAnnotations = useMemo(() => {
    let list = annotations;
    if (filterMode === 'current_regimen') {
      const activeIds = activeDrugs.map((d) => d.id.toLowerCase().trim());
      const activeIdSet = new Set(activeIds);

      list = annotations.filter((ann) => {
        // Matches exact fingerprint
        if (ann.regimenFingerprint === currentFingerprint) return true;
        // Global annotation
        if (ann.regimenFingerprint === 'global' || !ann.drugIds || ann.drugIds.length === 0)
          return true;
        // Or covers a subset of active drugs (e.g. note written for warfarin + amiodarone, when regimen has those two)
        if (
          ann.drugIds.length > 0 &&
          ann.drugIds.every((id) => activeIdSet.has(id.toLowerCase().trim()))
        ) {
          return true;
        }
        return false;
      });
    }

    // Sort: pinned first, then newest updatedAt
    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [annotations, filterMode, currentFingerprint, activeDrugs]);

  // Open Editor for New Note
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('dosing_strategy');
    setFormColor('yellow');
    setFormIsPinned(false);
    setFormAuthor(localStorage.getItem('polypharm_last_author') || 'Clinical Pharmacist');
    setFormScope('current');
    setIsEditorOpen(true);
  };

  // Open Editor to Edit Note
  const handleOpenEdit = (ann: RegimenAnnotation) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormCategory(ann.category);
    setFormColor(ann.color);
    setFormIsPinned(!!ann.isPinned);
    setFormAuthor(ann.author || 'Clinical Specialist');
    setFormScope(ann.regimenFingerprint === 'global' ? 'global' : 'current');
    setIsEditorOpen(true);
  };

  // Apply Quick Template to Form
  const handleApplyTemplate = (tpl: typeof CLINICAL_NOTE_TEMPLATES[0]) => {
    setFormTitle(tpl.title);
    setFormCategory(tpl.category);
    setFormColor(tpl.color);
    setFormContent(tpl.content);
  };

  // Save Note
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    try {
      localStorage.setItem('polypharm_last_author', formAuthor);
    } catch {}

    const now = new Date().toISOString();
    const isGlobal = formScope === 'global';

    const newNote: RegimenAnnotation = {
      id: editingId || `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      regimenFingerprint: isGlobal ? 'global' : currentFingerprint,
      drugIds: isGlobal ? [] : activeDrugs.map((d) => d.id),
      drugNames: isGlobal ? [] : activeDrugNames,
      title: formTitle.trim() || 'Clinical Annotation',
      content: formContent.trim(),
      category: formCategory,
      color: formColor,
      isPinned: formIsPinned,
      author: formAuthor.trim() || 'Clinical Specialist',
      createdAt: editingId
        ? annotations.find((a) => a.id === editingId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    const updated = storageService.saveRegimenAnnotation(newNote);
    setAnnotations(updated);
    setIsEditorOpen(false);
    setEditingId(null);
  };

  // Delete Note
  const handleDeleteNote = (id: string) => {
    const updated = storageService.deleteRegimenAnnotation(id);
    setAnnotations(updated);
  };

  // Pin Toggle
  const handleTogglePin = (id: string) => {
    const updated = storageService.togglePinRegimenAnnotation(id);
    setAnnotations(updated);
  };

  // Copy Note to Clipboard
  const handleCopyNote = (ann: RegimenAnnotation) => {
    const drugsText =
      ann.drugNames && ann.drugNames.length > 0
        ? `Regimen: ${ann.drugNames.join(' + ')}\n`
        : 'Regimen: Global\n';
    const textToCopy = `[CLINICAL NOTE: ${ann.title.toUpperCase()}]\n${drugsText}Category: ${
      CATEGORY_META[ann.category]?.label || ann.category
    }\nAuthor: ${ann.author || 'Clinical Specialist'}\n\n${ann.content}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(ann.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const currentCount = useMemo(() => {
    const activeIds = activeDrugs.map((d) => d.id.toLowerCase().trim());
    const activeIdSet = new Set(activeIds);
    return annotations.filter((ann) => {
      if (ann.regimenFingerprint === currentFingerprint) return true;
      if (ann.regimenFingerprint === 'global' || !ann.drugIds || ann.drugIds.length === 0)
        return true;
      if (
        ann.drugIds.length > 0 &&
        ann.drugIds.every((id) => activeIdSet.has(id.toLowerCase().trim()))
      )
        return true;
      return false;
    }).length;
  }, [annotations, currentFingerprint, activeDrugs]);

  return (
    <div
      className={`rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
            <StickyNote className="w-4 h-4 transform -rotate-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                {translate('Clinical Regimen Notes')}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600/40">
                  {currentCount} note{currentCount === 1 ? '' : 's'}
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span>{translate('Attached to:')}</span>
              {activeDrugNames.length > 0 ? (
                <span className="font-mono text-cyan-300 font-medium truncate max-w-xs sm:max-w-md">
                  {activeDrugNames.join(' + ')}
                </span>
              ) : (
                <span className="text-slate-500 italic">{translate('No active drugs in regimen')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilterMode('current_regimen')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === 'current_regimen'
                  ? 'bg-slate-800 text-cyan-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {translate('Current Regimen')} ({currentCount})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-cyan-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {translate('All')} ({annotations.length})
            </button>
          </div>

          {/* New Note Button */}
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-950/40 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{translate('Add Sticky Note')}</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sticky Notes' : 'Collapse Sticky Notes'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Notes Grid */}
          {displayedAnnotations.length === 0 ? (
            /* Empty State */
            <div className="p-8 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto transform -rotate-3">
                <StickyNote className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {filterMode === 'current_regimen'
                    ? 'No Clinical Annotations for this Regimen'
                    : 'No Clinical Annotations Found'}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {filterMode === 'current_regimen'
                    ? `Pin persistent clinical observations, lab check protocols, or dosing guidance for ${
                        activeDrugNames.length > 0 ? activeDrugNames.join(' + ') : 'the current regimen'
                      }.`
                    : 'Keep persistent sticky-note memos across polypharmacy combinations.'}
                </p>
              </div>

              {/* 1-Click Quick Template Starters */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleOpenCreate}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Write First Note</span>
                </button>
              </div>

              {/* Quick Prompt Cards */}
              <div className="pt-3 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-left">
                {CLINICAL_NOTE_TEMPLATES.slice(0, 3).map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleOpenCreate();
                      handleApplyTemplate(tpl);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 group-hover:text-amber-300">
                      <span>{tpl.title}</span>
                      <Plus className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                      {tpl.content}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Sticky Notes Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedAnnotations.map((ann) => {
                const colors = COLOR_CONFIG[ann.color] || COLOR_CONFIG.yellow;
                const CategoryIcon = CATEGORY_META[ann.category]?.icon || Bookmark;
                const categoryLabel = CATEGORY_META[ann.category]?.label || ann.category;
                const isCurrentCombo = ann.regimenFingerprint === currentFingerprint;
                const isGlobal = ann.regimenFingerprint === 'global';

                return (
                  <div
                    key={ann.id}
                    className={`relative rounded-2xl border p-4 transition-all duration-200 shadow-md flex flex-col justify-between group ${colors.bg} ${colors.border}`}
                  >
                    {/* Realistic Sticky Tape / Thumbtack Accent */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-white/10 backdrop-blur-xs rounded-sm border-t border-white/20 shadow-xs pointer-events-none transform -rotate-1" />

                    <div>
                      {/* Top Bar: Category Pill & Pin/Edit/Delete Controls */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${colors.chipBg} ${colors.chipText}`}
                          >
                            <CategoryIcon className="w-3 h-3 shrink-0" />
                            <span>{categoryLabel}</span>
                          </span>

                          {ann.isPinned && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-slate-950 flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5 fill-current" />
                              <span>PINNED</span>
                            </span>
                          )}
                        </div>

                        {/* Note Action Buttons */}
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTogglePin(ann.id)}
                            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                              ann.isPinned
                                ? 'text-amber-400 bg-amber-950/60'
                                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
                            }`}
                            title={ann.isPinned ? 'Unpin note' : 'Pin note to top'}
                          >
                            <Pin className={`w-3.5 h-3.5 ${ann.isPinned ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleCopyNote(ann)}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                            title="Copy annotation to clipboard"
                          >
                            {copiedId === ann.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(ann)}
                            className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                            title="Edit annotation"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteNote(ann.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                            title="Delete annotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Note Title */}
                      <h4 className={`font-bold text-xs sm:text-sm tracking-tight mb-1.5 ${colors.accent}`}>
                        {ann.title}
                      </h4>

                      {/* Note Content */}
                      <p
                        className={`text-xs leading-relaxed whitespace-pre-wrap font-sans select-text ${colors.text} opacity-95`}
                      >
                        {ann.content}
                      </p>
                    </div>

                    {/* Footer Info: Attached Regimen & Author Timestamp */}
                    <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-col gap-1.5 text-[10px]">
                      {/* Attached Regimen Chip */}
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Layers className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {isGlobal ? (
                            <span className="italic text-slate-400">Global Regimen Memo</span>
                          ) : ann.drugNames && ann.drugNames.length > 0 ? (
                            <span className="font-mono font-medium text-slate-200">
                              {ann.drugNames.join(' + ')}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400">Custom Combo</span>
                          )}
                        </span>
                        {isCurrentCombo && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 ml-auto shrink-0">
                            Active Combo
                          </span>
                        )}
                      </div>

                      {/* Author & Timestamp */}
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="truncate">{ann.author || 'Clinical Specialist'}</span>
                        <span className="font-mono text-[9px] shrink-0 text-slate-400">
                          {new Date(ann.updatedAt || ann.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Editor Modal for Adding / Editing Sticky Note */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingId ? 'Edit Clinical Sticky Note' : 'Add Clinical Regimen Note'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Persistent clinical guidance and monitoring reminders for this regimen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Clinical Templates (1-Click Fill)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CLINICAL_NOTE_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-[11px] text-slate-300 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNote} className="space-y-4">
              {/* Scope Selector */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormScope('current')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formScope === 'current'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-[11px]">Tie to Current Regimen</div>
                  <div className="text-[10px] truncate text-slate-400 mt-0.5">
                    {activeDrugNames.length > 0 ? activeDrugNames.join(' + ') : 'Active Drugs'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormScope('global')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formScope === 'global'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-[11px]">Global General Note</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Visible across all regimens</div>
                </button>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Note Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. CYP2C9 Titration / Baseline QTc Surveillance"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Category & Sticky Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AnnotationCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  >
                    <option value="dosing_strategy">Dosing Strategy</option>
                    <option value="lab_monitoring">Lab Monitoring</option>
                    <option value="contraindication">Contraindication</option>
                    <option value="pharmacist_memo">Pharmacist Memo</option>
                    <option value="patient_counseling">Patient Counseling</option>
                    <option value="general">General Note</option>
                  </select>
                </div>

                {/* Color Swatch Picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Sticky Note Color</label>
                  <div className="flex items-center gap-2 pt-1">
                    {(Object.keys(COLOR_CONFIG) as StickyNoteColor[]).map((colorKey) => {
                      const cfg = COLOR_CONFIG[colorKey];
                      const isSelected = formColor === colorKey;
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setFormColor(colorKey)}
                          title={cfg.name}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${cfg.dotColor} ${
                            isSelected
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-md'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Content Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Annotation Content</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Enter clinical rationale, dose reduction recommendations, scheduled lab dates, or patient counseling highlights..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Author & Pin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Clinician / Author</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. Dr. Chen, PharmD"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3 sm:pt-4">
                  <input
                    type="checkbox"
                    id="pinNoteCheckbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="pinNoteCheckbox" className="text-xs text-slate-200 cursor-pointer select-none">
                    Pin note to top of regimen board
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-amber-950/40"
                >
                  {editingId ? 'Save Changes' : 'Post Sticky Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
