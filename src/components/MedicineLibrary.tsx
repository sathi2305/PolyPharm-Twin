import React, { useState } from 'react';
import { Medicine, DrugClass } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  Search,
  Plus,
  Filter,
  Star,
  Upload,
  Trash2,
  Edit3,
  ExternalLink,
  Pill,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  Database,
} from 'lucide-react';

interface MedicineLibraryProps {
  medicines: Medicine[];
  activeDrugIds: string[];
  favorites: string[];
  onToggleActiveDrug: (drugId: string) => void;
  onToggleFavorite: (drugId: string) => void;
  onAddMedicine: (med: Medicine) => void;
  onDeleteMedicine: (id: string) => void;
}

export const MedicineLibrary: React.FC<MedicineLibraryProps> = ({
  medicines,
  activeDrugIds,
  favorites,
  onToggleActiveDrug,
  onToggleFavorite,
  onAddMedicine,
  onDeleteMedicine,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedEnzyme, setSelectedEnzyme] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [inspectedDrug, setInspectedDrug] = useState<Medicine | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State for Adding New Custom Medicine
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedBrands, setNewMedBrands] = useState<string>('');
  const [newMedClass, setNewMedClass] = useState<DrugClass>('Cardiovascular / Anticoagulant');
  const [newMedSmiles, setNewMedSmiles] = useState<string>('');
  const [newMedFormula, setNewMedFormula] = useState<string>('');
  const [newMedMw, setNewMedMw] = useState<number>(300);
  const [newMedMechanism, setNewMedMechanism] = useState<string>('');
  const [newMedTargets, setNewMedTargets] = useState<string>('');

  // Extract all drug classes
  const allClasses = Array.from(new Set(medicines.map((m) => m.drugClass))).sort();

  // Filtered List
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.brandNames.some((b) => b.toLowerCase().includes(searchTerm.toLowerCase())) ||
      med.smiles.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.targetProteins.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClass = selectedClass === 'all' || med.drugClass === selectedClass;
    const matchesEnzyme =
      selectedEnzyme === 'all' || med.enzymes.some((e) => e.name === selectedEnzyme);
    const matchesFav = !showFavoritesOnly || favorites.includes(med.id);

    return matchesSearch && matchesClass && matchesEnzyme && matchesFav;
  });

  const handleExportCsv = () => {
    const headers = ['ID', 'GenericName', 'DrugClass', 'MolecularFormula', 'MolecularWeight', 'SMILES', 'HalfLifeH', 'Clearance'];
    const rows = medicines.map((m) => [
      m.id,
      `"${m.genericName}"`,
      `"${m.drugClass}"`,
      m.molecularFormula,
      m.molecularWeight,
      `"${m.smiles}"`,
      m.adme.halfLifeHours,
      m.adme.clearanceLitersPerHour,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PolyPharm_Medicines_${medicines.length}.csv`;
    a.click();
  };

  const handleCreateMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed: Medicine = {
      id: `custom_${newMedName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      genericName: newMedName.trim(),
      brandNames: newMedBrands ? newMedBrands.split(',').map((s) => s.trim()) : [newMedName.trim()],
      drugClass: newMedClass,
      smiles: newMedSmiles.trim() || 'CC(=O)NC1=CC=C(O)C=C1',
      molecularFormula: newMedFormula.trim() || 'C10H15NO',
      molecularWeight: newMedMw || 250,
      mechanismOfAction: newMedMechanism.trim() || 'Custom pharmacological compound.',
      targetProteins: newMedTargets ? newMedTargets.split(',').map((s) => s.trim()) : ['Target Receptor'],
      enzymes: [{ name: 'CYP3A4', role: 'substrate' }],
      metabolites: [],
      adme: {
        bioavailability: 70,
        proteinBinding: 50,
        halfLifeHours: 8,
        clearanceLitersPerHour: 15,
        volumeDistributionLitersPerKg: 1.0,
        absorptionRateKa: 1.2,
      },
      knownInteractions: [],
      knownAdrs: ['Mild headache', 'Nausea'],
      contraindications: ['Known hypersensitivity'],
      evidenceSource: 'User Custom Formulation',
      lastUpdated: new Date().toISOString().split('T')[0],
      isCustom: true,
    };

    onAddMedicine(newMed);
    setIsAddModalOpen(false);
    // Reset Form
    setNewMedName('');
    setNewMedBrands('');
    setNewMedSmiles('');
    setNewMedFormula('');
    setNewMedMechanism('');
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Curated Medicine & Prescription Library
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {medicines.length} Medicines Loaded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive chemical, ADME pharmacokinetic, enzymatic, and adverse event profiles for clinical simulation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-950/40 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medicine</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 cursor-pointer font-mono"
              title="Export CSV"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search generic, brand, SMILES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Drug Classes ({medicines.length})</option>
            {allClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Enzyme Filter */}
          <select
            value={selectedEnzyme}
            onChange={(e) => setSelectedEnzyme(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Enzymes / Pathways</option>
            {['CYP3A4', 'CYP2D6', 'CYP2C9', 'CYP2C19', 'CYP1A2', 'CYP2E1', 'UGT1A1', 'P-gp (ABCB1)'].map((enz) => (
              <option key={enz} value={enz}>
                {enz}
              </option>
            ))}
          </select>

          {/* Favorites Filter */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
              showFavoritesOnly
                ? 'bg-amber-950 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites Only ({favorites.length})</span>
          </button>
        </div>
      </div>

      {/* Medicines Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredMedicines.map((med) => {
          const isActive = activeDrugIds.includes(med.id);
          const isFav = favorites.includes(med.id);

          return (
            <div
              key={med.id}
              className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleFavorite(med.id)}
                      className="text-slate-500 hover:text-amber-400 cursor-pointer transition-colors"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <div>
                      <h4 className="font-bold text-white text-sm tracking-tight">{med.genericName}</h4>
                      <span className="text-[10px] text-slate-400 truncate block max-w-[170px]">
                        {med.brandNames.join(', ')}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono">
                    {med.molecularFormula}
                  </span>
                </div>

                {/* Class & Mechanism */}
                <div className="mt-2.5 space-y-1 text-xs">
                  <span className="inline-block text-[10px] font-semibold text-teal-300/90 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                    {med.drugClass}
                  </span>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {med.mechanismOfAction}
                  </p>
                </div>

                {/* ADME Snapshot */}
                <div className="grid grid-cols-3 gap-1.5 my-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-center">
                  <div>
                    <span className="text-slate-500 block">t1/2</span>
                    <span className="text-slate-200 font-bold">{med.adme.halfLifeHours}h</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Clearance</span>
                    <span className="text-slate-200 font-bold">{med.adme.clearanceLitersPerHour} L/h</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prot. Bind</span>
                    <span className="text-slate-200 font-bold">{med.adme.proteinBinding}%</span>
                  </div>
                </div>

                {/* Enzymes involved */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {med.enzymes.map((e, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.5 rounded font-mono ${
                        e.role.includes('inhibitor')
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          : e.role === 'inducer'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {e.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => setInspectedDrug(med)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" /> Details
                </button>

                <div className="flex items-center gap-1.5">
                  {med.isCustom && (
                    <button
                      onClick={() => onDeleteMedicine(med.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                      title="Delete Custom Drug"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onToggleActiveDrug(med.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      isActive
                        ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/30'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-3 h-3" /> In Simulation
                      </>
                    ) : (
                      <>+ Simulate</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drug Details Inspection Modal */}
      {inspectedDrug && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{inspectedDrug.genericName}</h3>
                <span className="text-slate-400 text-xs">Brand Names: {inspectedDrug.brandNames.join(', ')}</span>
              </div>
              <button
                onClick={() => setInspectedDrug(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* SMILES chemical notation */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SMILES String</span>
              <p className="text-cyan-300 break-all">{inspectedDrug.smiles}</p>
            </div>

            {/* Molecular specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Formula</span>
                <span className="text-white font-bold">{inspectedDrug.molecularFormula}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Mol. Weight</span>
                <span className="text-white font-bold">{inspectedDrug.molecularWeight} g/mol</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Half-Life</span>
                <span className="text-white font-bold">{inspectedDrug.adme.halfLifeHours} h</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Bioavailability</span>
                <span className="text-white font-bold">{inspectedDrug.adme.bioavailability}%</span>
              </div>
            </div>

            {/* Pharmacological Targets & Mechanism */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300 text-xs">Mechanism of Action</h4>
              <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {inspectedDrug.mechanismOfAction}
              </p>
            </div>

            {/* Target Proteins and Known Interactions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-cyan-300 block mb-1">Target Proteins & Receptors:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  {inspectedDrug.targetProteins.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-1">Primary Metabolites:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  {inspectedDrug.metabolites.map((m, idx) => (
                    <li key={idx}>
                      {m.name} ({m.activity})
                    </li>
                  ))}
                  {inspectedDrug.metabolites.length === 0 && (
                    <span className="text-slate-500 italic">No major toxic metabolites documented.</span>
                  )}
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">Source: {inspectedDrug.evidenceSource}</span>
              <button
                onClick={() => {
                  onToggleActiveDrug(inspectedDrug.id);
                  setInspectedDrug(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
              >
                {activeDrugIds.includes(inspectedDrug.id) ? 'Remove from Simulation' : 'Add to Simulation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMedicine}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add Custom Pharmaceutical Compound</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Generic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Novel Kinase Inhibitor"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Brand Names (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Novakin, Kinestat"
                  value={newMedBrands}
                  onChange={(e) => setNewMedBrands(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Drug Class</label>
                <select
                  value={newMedClass}
                  onChange={(e) => setNewMedClass(e.target.value as DrugClass)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {allClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SMILES String</label>
                <input
                  type="text"
                  placeholder="e.g. CC(=O)NC1=CC=C(O)C=C1"
                  value={newMedSmiles}
                  onChange={(e) => setNewMedSmiles(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Mechanism of Action</label>
                <textarea
                  rows={2}
                  placeholder="Describe molecular target and pathway action..."
                  value={newMedMechanism}
                  onChange={(e) => setNewMedMechanism(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
              >
                Save & Index
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
