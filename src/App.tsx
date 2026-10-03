import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Medicine, PatientContext, SevereInteractionToastAlert } from './types';
import { SUPPORTED_LANGUAGES, LanguageInfo } from './data/languagesData';
import { storageService } from './services/storageService';
import { simulateAdmeCascade } from './engine/admeCascade';
import { buildDynamicKnowledgeGraph } from './engine/knowledgeGraph';
import { predictPolypharmacyAdrs } from './engine/temporalGnnAdr';
import { detectSevereInteractionsOnAdd } from './engine/interactionAlertDetector';

import { TopNav, NavTab } from './components/TopNav';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Dashboard } from './components/Dashboard';
import { MedicineLibrary } from './components/MedicineLibrary';
import { PatientProfileLibrary } from './components/PatientProfileLibrary';
import { SimulationWorkbench } from './components/SimulationWorkbench';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { EnzymeMonitoringPanel } from './components/EnzymeMonitoringPanel';
import { AdrPredictionPanel } from './components/AdrPredictionPanel';
import { ExplainableAiPanel } from './components/ExplainableAiPanel';
import { PolyPharmAiAssistant } from './components/PolyPharmAiAssistant';
import { ResearchModePanel } from './components/ResearchModePanel';
import { ReportModal } from './components/ReportModal';
import { InteractionToastNotification } from './components/InteractionToastNotification';

import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Medicine Library State (150+ drugs)
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [activeDrugIds, setActiveDrugIds] = useState<string[]>(['warfarin', 'amiodarone']);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Simulation State
  const [durationHours] = useState<number>(48);
  const [currentTimeHours, setCurrentTimeHours] = useState<number>(12);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Patient Context
  const [patientContext, setPatientContext] = useState<PatientContext>({
    age: 62,
    gender: 'male',
    weightKg: 78,
    renalFunctionEgfr: 75,
    hepaticFunction: 'normal',
    cyp2d6Genotype: 'normal_metabolizer',
    cyp2c19Genotype: 'normal_metabolizer',
  });

  // Load Initial Data from Storage
  useEffect(() => {
    const loadedMeds = storageService.getMedicines();
    setMedicines(loadedMeds);

    const savedActive = storageService.getActiveDrugIds();
    if (savedActive.length > 0) setActiveDrugIds(savedActive);

    const savedFavs = storageService.getFavorites();
    setFavorites(savedFavs);

    const savedTheme = storageService.getTheme();
    setTheme(savedTheme);

    // Network status listener
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
    }
  }, []);

  // Update Theme in DOM
  useEffect(() => {
    storageService.saveTheme(theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
    }
  }, [theme]);

  // Active Medicines list
  const activeDrugs = useMemo(() => {
    return medicines.filter((m) => activeDrugIds.includes(m.id));
  }, [medicines, activeDrugIds]);

  // Drug Dosages State (mg per individual drug)
  const [drugDosages, setDrugDosages] = useState<Record<string, number>>(() => storageService.getDrugDosages());

  const handleUpdateDrugDose = (drugId: string, doseMg: number) => {
    setDrugDosages((prev) => {
      const next = { ...prev, [drugId]: doseMg };
      storageService.saveDrugDosages(next);
      return next;
    });
  };

  const handleResetDrugDoses = () => {
    storageService.resetDrugDoses();
    setDrugDosages({});
  };

  // Run Real-Time ADME & Metabolic Simulation Engine with Dynamic Dosage Recalculation
  const { timeSeries, liveEnzymes } = useMemo(() => {
    return simulateAdmeCascade(activeDrugs, patientContext, durationHours, 0.5, drugDosages);
  }, [activeDrugs, patientContext, durationHours, drugDosages]);

  // Run Dynamic Biomedical Knowledge Graph Construction
  const graph = useMemo(() => {
    return buildDynamicKnowledgeGraph(activeDrugs, 820, 540);
  }, [activeDrugs]);

  // Run Temporal GNN & Multi-Label ADR Prediction Engine
  const { predictions, explanations } = useMemo(() => {
    return predictPolypharmacyAdrs(activeDrugs, patientContext, currentTimeHours);
  }, [activeDrugs, patientContext, currentTimeHours]);

  // Simulation Clock Animation Loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeHours((prev) => {
          if (prev >= durationHours) {
            setIsPlaying(false);
            return 0;
          }
          return parseFloat((prev + 0.5).toFixed(1));
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, durationHours]);

  // Automated Severe Drug Interaction Notification Toast System State
  const [interactionToasts, setInteractionToasts] = useState<SevereInteractionToastAlert[]>([]);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (medicines.length > 0 && isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [medicines]);

  // Handlers
  const handleToggleActiveDrug = (drugId: string) => {
    const isAdding = !activeDrugIds.includes(drugId);
    const next = isAdding
      ? [...activeDrugIds, drugId]
      : activeDrugIds.filter((id) => id !== drugId);

    if (isAdding) {
      const addedMed = medicines.find((m) => m.id === drugId);
      if (addedMed) {
        const activeMeds = medicines.filter((m) => activeDrugIds.includes(m.id));
        const severeAlerts = detectSevereInteractionsOnAdd(addedMed, activeMeds, patientContext);
        if (severeAlerts.length > 0) {
          setInteractionToasts((prev) => {
            // Keep fresh alerts, deduping any identical drug pairs
            const filtered = prev.filter(
              (p) =>
                !(
                  p.addedDrug.id === addedMed.id &&
                  severeAlerts.some((a) => a.regimenDrug.id === p.regimenDrug.id)
                )
            );
            return [...severeAlerts, ...filtered];
          });
        }
      }
    } else {
      // If removing a drug, dismiss any alerts involving this drug
      setInteractionToasts((prev) =>
        prev.filter((a) => a.addedDrug.id !== drugId && a.regimenDrug.id !== drugId)
      );
    }

    setActiveDrugIds(next);
    storageService.saveActiveDrugIds(next);
  };

  const handleDismissToast = (alertId?: string) => {
    if (alertId) {
      setInteractionToasts((prev) => prev.filter((a) => a.id !== alertId));
    } else {
      setInteractionToasts([]);
    }
  };

  const handleToggleFavorite = (drugId: string) => {
    const next = storageService.toggleFavorite(drugId);
    setFavorites(next);
  };

  const handleAddMedicine = (newMed: Medicine) => {
    const updated = storageService.addMedicine(newMed);
    setMedicines(updated);
  };

  const handleDeleteMedicine = (id: string) => {
    const updated = storageService.deleteMedicine(id);
    setMedicines(updated);
    if (activeDrugIds.includes(id)) {
      handleToggleActiveDrug(id);
    }
  };

  const handleLoadPreset = (drugIds: string[]) => {
    setActiveDrugIds(drugIds);
    storageService.saveActiveDrugIds(drugIds);

    // If user loads a preset and it contains severe interactions, alert them
    if (!isInitialMount.current) {
      const presetMeds = medicines.filter((m) => drugIds.includes(m.id));
      const allAlerts: SevereInteractionToastAlert[] = [];
      for (let i = 0; i < presetMeds.length; i++) {
        const added = presetMeds[i];
        const others = presetMeds.slice(i + 1);
        const alerts = detectSevereInteractionsOnAdd(added, others, patientContext);
        allAlerts.push(...alerts);
      }
      if (allAlerts.length > 0) {
        setInteractionToasts(allAlerts);
      } else {
        setInteractionToasts([]);
      }
    }
  };

  const handleClearRegimen = () => {
    setActiveDrugIds([]);
    storageService.saveActiveDrugIds([]);
    setInteractionToasts([]);
  };

  const handleLanguageChange = (lang: LanguageInfo) => {
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors bg-slate-950 text-slate-100">
      {/* Medical Safety Disclaimer Banner */}
      <DisclaimerBanner langCode={currentLanguage.code} />

      {/* Top Navigation & System Status Indicators */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDrugCount={activeDrugs.length}
        totalMedicinesCount={medicines.length}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        currentLanguage={currentLanguage}
        setCurrentLanguage={handleLanguageChange}
        theme={theme}
        setTheme={setTheme}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            activeDrugs={activeDrugs}
            enzymes={liveEnzymes}
            predictions={predictions}
            graph={graph}
            currentTimeHours={currentTimeHours}
            durationHours={durationHours}
            timeSeries={timeSeries}
            isPlaying={isPlaying}
            patientContext={patientContext}
            onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
            onOpenReport={() => setIsReportOpen(true)}
            onToggleActiveDrug={handleToggleActiveDrug}
            onLoadPreset={handleLoadPreset}
            drugDosages={drugDosages}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicineLibrary
            medicines={medicines}
            activeDrugIds={activeDrugIds}
            favorites={favorites}
            onToggleActiveDrug={handleToggleActiveDrug}
            onToggleFavorite={handleToggleFavorite}
            onAddMedicine={handleAddMedicine}
            onDeleteMedicine={handleDeleteMedicine}
          />
        )}

        {activeTab === 'patients' && (
          <PatientProfileLibrary
            currentPatient={patientContext}
            onSelectPatient={(newPatient) => {
              setPatientContext(newPatient);
            }}
            onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
            activeDrugCount={activeDrugs.length}
            onLoadPresetRegimen={handleLoadPreset}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationWorkbench
            medicines={medicines}
            activeDrugs={activeDrugs}
            patientContext={patientContext}
            setPatientContext={setPatientContext}
            currentTimeHours={currentTimeHours}
            durationHours={durationHours}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            timeSeries={timeSeries}
            liveEnzymes={liveEnzymes}
            predictions={predictions}
            currentLanguage={currentLanguage}
            drugDosages={drugDosages}
            onUpdateDrugDose={handleUpdateDrugDose}
            onResetDrugDoses={handleResetDrugDoses}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onReset={() => {
              setIsPlaying(false);
              setCurrentTimeHours(0);
            }}
            onSeek={setCurrentTimeHours}
            onSpeedChange={setPlaybackSpeed}
            onToggleActiveDrug={handleToggleActiveDrug}
            onLoadPreset={handleLoadPreset}
            onClearRegimen={handleClearRegimen}
            onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
          />
        )}

        {activeTab === 'knowledge_graph' && (
          <KnowledgeGraphView graph={graph} activeDrugs={activeDrugs} />
        )}

        {activeTab === 'enzymes' && (
          <EnzymeMonitoringPanel
            enzymes={liveEnzymes}
            activeDrugs={activeDrugs}
            currentTimeHours={currentTimeHours}
            isPlaying={isPlaying}
          />
        )}

        {activeTab === 'adr_xai' && (
          <div className="space-y-6">
            <AdrPredictionPanel predictions={predictions} />
            <ExplainableAiPanel explanations={explanations} />
          </div>
        )}

        {activeTab === 'ai_assistant' && (
          <PolyPharmAiAssistant
            activeDrugs={activeDrugs}
            enzymes={liveEnzymes}
            predictions={predictions}
            patientContext={patientContext}
            currentTimeHours={currentTimeHours}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            onSimulateDrugs={handleLoadPreset}
            onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
          />
        )}

        {activeTab === 'research' && <ResearchModePanel />}
      </main>

      {/* Clinical Dossier Report Modal */}
      <ReportModal
        isOpen={isReportOpen || activeTab === 'reports'}
        onClose={() => {
          setIsReportOpen(false);
          if (activeTab === 'reports') setActiveTab('dashboard');
        }}
        activeDrugs={activeDrugs}
        enzymes={liveEnzymes}
        predictions={predictions}
        explanations={explanations}
        patientContext={patientContext}
        simulationTimeHours={currentTimeHours}
      />

      {/* Automated Severe Drug Interaction Notification Toast System */}
      <InteractionToastNotification
        alerts={interactionToasts}
        onDismiss={handleDismissToast}
        onRemoveDrug={handleToggleActiveDrug}
        onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
