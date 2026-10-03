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
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../data/languagesData';
import { getTranslation } from '../data/translations';

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

interface TopNavProps {
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

export const TopNav: React.FC<TopNavProps> = ({
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
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const NAV_ITEMS: { id: NavTab; pageNum: number; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', pageNum: 1, label: t.nav_dashboard, icon: Layers },
    { id: 'medicines', pageNum: 2, label: t.nav_medicines, icon: Pill, badge: totalMedicinesCount },
    { id: 'patients', pageNum: 3, label: 'Patient Profiles', icon: Dna },
    { id: 'simulation', pageNum: 4, label: t.nav_simulation, icon: Activity },
    { id: 'knowledge_graph', pageNum: 5, label: t.nav_knowledge_graph, icon: GitBranch },
    { id: 'enzymes', pageNum: 6, label: t.nav_enzymes, icon: Radio },
    { id: 'adr_xai', pageNum: 7, label: t.nav_adr_xai, icon: Sparkles },
    { id: 'ai_assistant', pageNum: 8, label: t.nav_ai_assistant, icon: Cpu },
    { id: 'research', pageNum: 9, label: t.nav_research, icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 transition-colors">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-900/30 ring-1 ring-cyan-400/40">
            <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                PolyPharm-Twin
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                v3.2 BioTwin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-sm font-medium">
              Multi-Drug Metabolic Cascade & ADR Simulation Platform
            </p>
          </div>
        </div>

        {/* Live System Indicators */}
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
            title={t.tooltip_drugs_cached}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-[11px]">{totalMedicinesCount} {t.status_cached}</span>
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

        {/* Global Controls: Language, Theme, Reports */}
        <div className="flex items-center gap-2">
          {/* Interactive Language Selector Popover */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/40 hover:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs text-cyan-200 cursor-pointer transition-all shadow-sm group"
              title={t.tooltip_language_switcher}
              aria-expanded={isLangMenuOpen}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold text-xs tracking-tight">{currentLanguage.nativeName}</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                {currentLanguage.code}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Language Menu */}
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

                {/* Quick Search Filter */}
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

                {/* Languages List */}
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

          {/* Export Report Quick Trigger */}
          <button
            onClick={onOpenReport}
            title={t.tooltip_dossier_report}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.report_button}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar with Clear Page-by-Page Progress */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar border-t border-slate-800/80">
        <nav className="flex space-x-1.5 py-2" aria-label="Pages Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer group ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title={`Navigate to Page ${item.pageNum}: ${item.label}`}
              >
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  P{item.pageNum}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span className="font-semibold">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
