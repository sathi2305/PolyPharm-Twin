import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Globe,
  Moon,
  Sun,
  Layers,
  GitBranch,
  Pill,
  Sparkles,
  BarChart3,
  FileText,
  Radio,
  Wifi,
  WifiOff,
  Check,
  ChevronDown,
  Search,
  Dna,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Sliders,
  Sparkle
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../data/languagesData';
import { getTranslation } from '../data/translations';
import { PROJECT_NAME } from '../services/aiConfig';

export type NavTab =
  | 'dashboard'
  | 'medicines'
  | 'patients'
  | 'simulation'
  | 'knowledge_graph'
  | 'enzymes'
  | 'adr_xai'
  | 'ai_assistant'
  | 'research'
  | 'reports';

export interface SidebarNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeDrugCount: number;
  totalMedicinesCount: number;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  currentLanguage: LanguageInfo;
  setCurrentLanguage: (lang: LanguageInfo) => void;
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  onOpenReport: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  activeDrugCount,
  totalMedicinesCount,
  isOnline,
  setIsOnline,
  currentLanguage,
  setCurrentLanguage,
  theme,
  setTheme,
  onOpenReport,
}) => {
  const t = getTranslation(currentLanguage.code);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [autoCloseOnTask, setAutoCloseOnTask] = useState<boolean>(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsLangMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when sidebar is open on small viewports
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // User requested: when user completes task/selects navigation, sidebar will close
    if (autoCloseOnTask) {
      setIsOpen(false);
    }
  };

  const handleOpenReportFromNav = () => {
    onOpenReport();
    if (autoCloseOnTask) {
      setIsOpen(false);
    }
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const NAV_ITEMS: {
    id: NavTab;
    pageNum: number;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      pageNum: 1,
      label: t.nav_dashboard,
      sublabel: 'Overview, active regimen & key telemetry',
      icon: Layers,
    },
    {
      id: 'medicines',
      pageNum: 2,
      label: t.nav_medicines,
      sublabel: '150+ drug library with PK/PD properties',
      icon: Pill,
      badge: totalMedicinesCount,
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800/60',
    },
    {
      id: 'patients',
      pageNum: 3,
      label: 'Patient Profiles',
      sublabel: 'Renal/hepatic clearance & pharmacogenomics',
      icon: Dna,
    },
    {
      id: 'simulation',
      pageNum: 4,
      label: t.nav_simulation,
      sublabel: '48h ADME concentration & timeline cascade',
      icon: Activity,
      badge: activeDrugCount > 0 ? activeDrugCount : undefined,
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
    },
    {
      id: 'knowledge_graph',
      pageNum: 5,
      label: t.nav_knowledge_graph,
      sublabel: 'Interactive multi-drug pathway network',
      icon: GitBranch,
    },
    {
      id: 'enzymes',
      pageNum: 6,
      label: t.nav_enzymes,
      sublabel: 'CYP450 saturation, inhibition & induction',
      icon: Radio,
    },
    {
      id: 'adr_xai',
      pageNum: 7,
      label: t.nav_adr_xai,
      sublabel: 'Temporal GNN ADR predictions & explanations',
      icon: Sparkles,
    },
    {
      id: 'ai_assistant',
      pageNum: 8,
      label: t.nav_ai_assistant,
      sublabel: 'Domain-adapted LLM reasoning & evidence',
      icon: Cpu,
    },
    {
      id: 'research',
      pageNum: 9,
      label: t.nav_research,
      sublabel: 'Literature synthesis & multi-regimen trial data',
      icon: BarChart3,
    },
  ];

  const currentActiveItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <>
      {/* Sleek Minimalist Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left: Sidebar Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 transition-all shadow-md shadow-cyan-950/30 cursor-pointer group"
              title={isOpen ? 'Close Navigation Sidebar (Esc)' : 'Open Navigation Sidebar'}
              aria-label="Toggle Sidebar"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
              ) : (
                <Menu className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
              )}
              <span className="hidden sm:inline font-semibold text-xs tracking-tight text-slate-100">
                Menu
              </span>
            </button>

            {/* Brand Logo & Project Name (Persistent across all tabs) */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              onClick={() => handleSelectTab('dashboard')}
              title={`${PROJECT_NAME} - Return to Dashboard`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400/40 group-hover:ring-cyan-300 transition-all shrink-0">
                <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-lg lg:text-xl tracking-tight bg-gradient-to-r from-cyan-200 via-teal-100 to-emerald-300 bg-clip-text text-transparent drop-shadow-xs whitespace-nowrap">
                    {PROJECT_NAME}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/90 font-bold tracking-wider hidden xs:inline-block">
                    v3.2
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight leading-none mt-0.5 hidden sm:inline-block">
                  Biomedical Digital-Twin Engine
                </span>
              </div>
            </div>

            {/* Active View / Breadcrumb (Clearly shows active tab alongside PolyPharm-Twin) */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
              <span className="text-slate-500 font-mono text-xs select-none">/</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-semibold border border-slate-700/60">
                P{currentActiveItem.pageNum}
              </span>
              <span className="text-xs font-semibold text-slate-200 tracking-wide">
                {currentActiveItem.label}
              </span>
            </div>
          </div>

          {/* Center/Right: Live System Indicators */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-950 cursor-help"
              title={t.tooltip_live_simulation}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold tracking-wider text-[11px]">{t.status_live}</span>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 cursor-help"
              title={t.tooltip_ai_engine}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium text-[11px]">{t.status_ai_active}</span>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 cursor-help"
              title="Active drug count in current regimen"
            >
              <Pill className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium text-[11px]">{activeDrugCount} Active</span>
            </div>

            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] cursor-pointer transition-all ${
                isOnline
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
              }`}
              title={t.tooltip_network_mode}
            >
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
              <span>{isOnline ? t.status_online : t.status_offline}</span>
            </button>
          </div>

          {/* Right: Quick Controls (Language, Theme, Report) */}
          <div className="flex items-center gap-2">
            {/* Quick Language Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/40 hover:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs text-cyan-200 cursor-pointer transition-all shadow-sm group"
                title={t.tooltip_language_switcher}
                aria-expanded={isLangMenuOpen}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline font-semibold text-xs tracking-tight">{currentLanguage.nativeName}</span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  {currentLanguage.code}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Language Menu Popover */}
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 max-h-96 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 p-2 z-50 flex flex-col space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-slate-800">
                    <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Select Language (18)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {currentLanguage.name} Active
                    </span>
                  </div>

                  {/* Filter Search */}
                  <div className="relative px-1">
                    <Search className="w-3 h-3 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      placeholder="Search language or script..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto max-h-64 space-y-1 pr-1 custom-scrollbar">
                    {filteredLanguages.map((lang) => {
                      const isSelected = lang.code === currentLanguage.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setCurrentLanguage(lang);
                            setIsLangMenuOpen(false);
                            setLangSearch('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 font-bold shadow-sm'
                              : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                              {lang.code}
                            </span>
                            <div>
                              <span className="block font-medium leading-none text-slate-100">
                                {lang.nativeName}
                              </span>
                              <span className="text-[10px] text-slate-400 leading-none">
                                {lang.name}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle theme"
              title={t.tooltip_theme_toggle}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Export Clinical Report Quick Button */}
            <button
              onClick={onOpenReport}
              title={t.tooltip_dossier_report}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.report_button}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop Overlay (closes sidebar when clicked) */}
      <div
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      {/* Sliding Navigation Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        aria-label="Navigation Drawer"
        className={`fixed top-0 left-0 bottom-0 w-84 max-w-[88vw] bg-slate-900 border-r border-cyan-500/30 z-50 flex flex-col shadow-2xl shadow-cyan-950/90 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-900/40 ring-1 ring-cyan-400/40">
              <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  {PROJECT_NAME}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                  v3.2
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Dynamic Metabolic Cascade Engine
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            title="Close sidebar (Esc)"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Live Regimen & System Quick Banner */}
        <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold text-[11px]">{t.status_live}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px]">
              {activeDrugCount} drugs in regimen
            </span>
          </div>
        </div>

        {/* Auto-Close Behavior Indicator / Toggle */}
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Auto-close on task select
          </span>
          <button
            type="button"
            onClick={() => setAutoCloseOnTask(!autoCloseOnTask)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer transition-colors ${
              autoCloseOnTask
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Toggle whether sidebar closes automatically when a task/tab is chosen"
          >
            {autoCloseOnTask ? 'Enabled' : 'Keep Open'}
          </button>
        </div>

        {/* Task & Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 font-bold">
            Clinical Workflow & Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full group flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/90 to-teal-950/70 border border-cyan-500/60 text-cyan-200 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-500/30'
                    : 'hover:bg-slate-800/70 text-slate-300 hover:text-white border border-transparent'
                }`}
                title={`Open Page ${item.pageNum}: ${item.label}`}
              >
                {/* Page Badge + Icon */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold transition-colors ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    P{item.pageNum}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-semibold text-xs tracking-tight truncate ${
                        isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border font-bold shrink-0 ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.sublabel}
                  </p>
                </div>

                <ChevronRight
                  className={`w-4 h-4 self-center transition-transform shrink-0 ${
                    isActive
                      ? 'text-cyan-400 translate-x-0.5'
                      : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Quick Actions */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/60 space-y-2">
          {/* Clinical Report Launch Button */}
          <button
            type="button"
            onClick={handleOpenReportFromNav}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/50 cursor-pointer transition-all active:scale-[0.98]"
          >
            <FileText className="w-4 h-4" />
            <span>{t.report_button}</span>
          </button>

          {/* Quick status & info */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-mono">
            <span>Catalog: {totalMedicinesCount} Drugs</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <ShieldCheck className="w-3 h-3" /> BioTwin Verified
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
