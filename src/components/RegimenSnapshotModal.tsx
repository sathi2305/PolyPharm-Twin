import React, { useState, useEffect } from 'react';
import { Medicine, PatientContext, RegimenSnapshot } from '../types';
import { storageService } from '../services/storageService';
import { useLanguage } from '../context/LanguageContext';
import {
  Camera,
  RotateCcw,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Download,
  Upload,
  Check,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  GitCompare,
  Plus,
  Clock,
  Pill,
} from 'lucide-react';

interface RegimenSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: Medicine[];
  currentDosages: Record<string, number>;
  patientContext: PatientContext;
  onRestoreSnapshot: (snapshot: RegimenSnapshot) => void;
}

export const RegimenSnapshotModal: React.FC<RegimenSnapshotModalProps> = ({
  isOpen,
  onClose,
  activeDrugs,
  currentDosages,
  patientContext,
  onRestoreSnapshot,
}) => {
  const { translate } = useLanguage();
  const [snapshots, setSnapshots] = useState<RegimenSnapshot[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load snapshots from storage on open
  useEffect(() => {
    if (isOpen) {
      setSnapshots(storageService.getRegimenSnapshots());
      // Pre-fill sensible default name
      const drugListStr = activeDrugs.map((d) => d.genericName).join(' + ') || 'Empty Regimen';
      setSnapshotName(`${drugListStr} (${activeDrugs.length} drugs)`);
      setSnapshotDescription(`Saved at ${new Date().toLocaleTimeString()} with active dosages and patient state.`);
    }
  }, [isOpen, activeDrugs]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotName.trim()) return;

    const newSnapshot: RegimenSnapshot = {
      id: `snapshot_${Date.now()}`,
      name: snapshotName.trim(),
      description: snapshotDescription.trim(),
      timestamp: new Date().toISOString(),
      drugIds: activeDrugs.map((d) => d.id),
      drugNames: activeDrugs.map((d) => d.genericName),
      dosages: { ...currentDosages },
      patientContext: { ...patientContext },
      tags: activeDrugs.map((d) => d.drugClass.split('/')[1]?.trim() || d.drugClass),
      isFavorite: false,
    };

    const updated = storageService.createRegimenSnapshot(newSnapshot);
    setSnapshots(updated);
    setIsCreatingNew(false);
    showNotification(translate('Snapshot saved successfully!'));
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    const updated = storageService.deleteRegimenSnapshot(id);
    setSnapshots(updated);
    showNotification(`Deleted snapshot: ${name}`);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = storageService.toggleFavoriteSnapshot(id);
    setSnapshots(updated);
  };

  const handleRestore = (snapshot: RegimenSnapshot) => {
    onRestoreSnapshot(snapshot);
    showNotification(`Restored: ${snapshot.name}`);
    setTimeout(() => onClose(), 600);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshots, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `polypharm_snapshots_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Exported snapshots as JSON');
  };

  const filteredSnapshots = snapshots.filter(
    (s) =>
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.drugNames.some((d) => d.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{translate('Regimen Snapshots')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  {snapshots.length} {translate('Saved')}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {translate('Switch between saved drug regimens and dosages')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export all snapshots to JSON file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {successToast && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-300 text-xs py-2 px-6 flex items-center gap-2 animate-in slide-in-from-top-1">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="p-4 px-6 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder={translate('Filter saved configurations...')}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
          >
            {isCreatingNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isCreatingNew ? translate('Cancel') : translate('Take Snapshot')}</span>
          </button>
        </div>

        {/* Create Snapshot Form Drawer */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreateSnapshot}
            className="p-4 px-6 bg-slate-950/90 border-b border-cyan-900/40 space-y-3 animate-in slide-in-from-top-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {translate('Save Current Regimen & Dosage Settings')}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {activeDrugs.length} drugs active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  {translate('Snapshot Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  {translate('Clinical Context / Description')}
                </label>
                <input
                  type="text"
                  value={snapshotDescription}
                  onChange={(e) => setSnapshotDescription(e.target.value)}
                  placeholder="e.g. Challenging CYP2C9 inhibition case"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Preview of what will be captured */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-slate-400">Captured Dosages:</span>
              {activeDrugs.map((d) => (
                <span key={d.id} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">
                  {d.genericName}: {currentDosages[d.id] ?? 'default'} mg
                </span>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {translate('Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{translate('Save Snapshot')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Snapshot Cards List */}
        <div className="flex-1 overflow-y-auto p-4 px-6 space-y-3">
          {filteredSnapshots.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              <p>{translate('No snapshots found.')}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Click &ldquo;Take Snapshot&rdquo; to save the current drug combination and dosage profile.
              </p>
            </div>
          ) : (
            filteredSnapshots.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md group space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">{item.name}</h4>
                      {item.isFavorite && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                          ★ Starred
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Favorite"
                    >
                      {item.isFavorite ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteSnapshot(item.id, item.name)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Drugs & Dosages Badge Row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1 mr-1">
                    <Pill className="w-3 h-3 text-cyan-400" />
                    Regimen ({item.drugNames.length}):
                  </span>
                  {item.drugNames.map((name, idx) => {
                    const drugId = item.drugIds[idx];
                    const dose = item.dosages[drugId];
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300 text-[11px] font-mono flex items-center gap-1"
                      >
                        <span className="font-semibold text-slate-200">{name}</span>
                        {dose !== undefined && (
                          <span className="text-[10px] text-cyan-400 font-bold">({dose}mg)</span>
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Bottom Metadata & Restore CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>Patient: {item.patientContext.age}yo {item.patientContext.gender} (eGFR {item.patientContext.renalFunctionEgfr})</span>
                  </div>

                  <button
                    onClick={() => handleRestore(item)}
                    className="px-3 py-1 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-950/40 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{translate('Restore Regimen')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
