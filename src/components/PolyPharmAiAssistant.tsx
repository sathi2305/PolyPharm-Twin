import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Search,
  Download,
  Sparkles,
  Bot,
  User,
  Radio,
  FileText,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Sliders,
  Play,
  Square,
  HelpCircle,
  Brain,
  SlidersHorizontal,
  Flame,
  Dna,
} from 'lucide-react';
import { ChatMessage, ChatSession, Medicine, EnzymeProfile, AdrPrediction, PatientContext, LlmTrainingProfile, LlmReasoningMode } from '../types';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../data/languagesData';
import { getTranslation } from '../data/translations';
import { sendChatMessage } from '../services/chatService';
import { voiceAssistant, VoiceState } from '../services/voiceService';
import { storageService } from '../services/storageService';
import { LlmTrainingRangeModal } from './LlmTrainingRangeModal';
import { checkTherapeuticRangeStatus } from '../data/therapeuticRangesData';
import { getDefaultDoseMg } from '../engine/admeCascade';

import { useLanguage } from '../context/LanguageContext';

interface PolyPharmAiAssistantProps {
  activeDrugs: Medicine[];
  enzymes: EnzymeProfile[];
  predictions: AdrPrediction[];
  patientContext?: PatientContext;
  currentTimeHours?: number;
  currentLanguage?: LanguageInfo;
  onLanguageChange?: (lang: LanguageInfo) => void;
  onSimulateDrugs?: (drugIds: string[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const PolyPharmAiAssistant: React.FC<PolyPharmAiAssistantProps> = ({
  activeDrugs,
  enzymes,
  predictions,
  patientContext,
  currentTimeHours = 0,
  currentLanguage: propLanguage,
  onLanguageChange,
  onSimulateDrugs,
  onNavigateTab,
}) => {
  const langContext = useLanguage();
  const currentLanguage = propLanguage || langContext.currentLanguage;
  const t = langContext.t || getTranslation(currentLanguage.code);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [refetchBanner, setRefetchBanner] = useState<string | null>(null);

  // LLM Reasoning Range & RAG Training State
  const [trainingProfile, setTrainingProfile] = useState<LlmTrainingProfile>(() =>
    storageService.getActiveLlmTrainingProfile()
  );
  const [showTrainingModal, setShowTrainingModal] = useState<boolean>(false);

  // Compute active drug concentrations at current simulation time
  const activeConcentrations = activeDrugs.map((d) => {
    const dose = getDefaultDoseMg(d);
    const f = (d.adme.bioavailability || 70) / 100;
    const vdTotal = (d.adme.volumeDistributionLitersPerKg || 0.7) * (patientContext?.weightKg || 70);
    const cl = d.adme.clearanceLitersPerHour || 5;
    const ka = d.adme.absorptionRateKa || 1.2;
    const ke = Math.max(0.01, cl / Math.max(1, vdTotal));
    const t = Math.max(0.1, currentTimeHours);
    let conc = 0;
    if (Math.abs(ka - ke) > 0.001) {
      conc = ((dose * f * ka) / (Math.max(1, vdTotal) * (ka - ke))) * (Math.exp(-ke * t) - Math.exp(-ka * t));
    } else {
      conc = ((dose * f) / Math.max(1, vdTotal)) * ka * t * Math.exp(-ke * t);
    }
    return {
      drugId: d.id,
      genericName: d.genericName,
      concMgL: Math.max(0, conc),
    };
  });

  // Check which active drugs are breaching their Therapeutic Windows
  const tdmBreaches = activeConcentrations
    .map((c) => ({
      ...c,
      eval: checkTherapeuticRangeStatus(c.drugId, c.concMgL),
    }))
    .filter((c) => c.eval.status === 'toxic' || c.eval.status === 'supratherapeutic');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLanguageCodeRef = useRef<string>(currentLanguage.code);

  // Initialize or load chat sessions
  useEffect(() => {
    const loaded = storageService.getChatSessions();
    if (loaded && loaded.length > 0) {
      setSessions(loaded);
      setCurrentSessionId(loaded[0].id);
    } else {
      createNewSession();
    }
  }, []);

  // Global state listener for language change: automatically refetches assistant responses in the new language
  useEffect(() => {
    if (prevLanguageCodeRef.current === currentLanguage.code) return;
    prevLanguageCodeRef.current = currentLanguage.code;

    setRefetchBanner(`Auto-refetching consultation in ${currentLanguage.nativeName} (${currentLanguage.name})...`);

    const autoRefetchInLanguage = async () => {
      setIsLoading(true);
      try {
        const drugNames = activeDrugs.map((d) => d.genericName);
        const autoPrompt = drugNames.length > 0
          ? `Provide an updated clinical evaluation of the current drug regimen (${drugNames.join(', ')}) with CYP enzyme inhibition analysis and ADR safety recommendations in ${currentLanguage.name}.`
          : currentLanguage.sampleQuestion;

        const reply = await sendChatMessage({
          message: autoPrompt,
          activeDrugs: drugNames,
          enzymeStatus: enzymes.map((e) => ({
            name: e.name,
            activity: e.currentActivity,
            status: e.interactionStatus,
          })),
          adrRisks: predictions.map((p) => ({
            label: p.label,
            probability: p.probability,
            severity: p.severity,
          })),
          language: currentLanguage.name,
          history: [],
        });

        const newAssistantMsg: ChatMessage = {
          id: `refetched_${Date.now()}`,
          sender: 'assistant',
          text: `🌐 [${currentLanguage.nativeName} - ${currentLanguage.name}]\n\n${reply.text}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: reply.source as any,
          language: currentLanguage.name,
        };

        setSessions((prev) => {
          const updated = prev.map((s) => {
            if (s.id === currentSessionId || (!currentSessionId && s === prev[0])) {
              return {
                ...s,
                language: currentLanguage.name,
                messages: [...s.messages, newAssistantMsg],
                updatedAt: new Date().toISOString(),
              };
            }
            return s;
          });
          storageService.saveChatSessions(updated);
          return updated;
        });

        setRefetchBanner(`Consultation response auto-refetched in ${currentLanguage.nativeName} (${currentLanguage.name})`);
        setTimeout(() => setRefetchBanner(null), 3500);

        // Stop any previous speech so only one voice can ever be active
        voiceAssistant.stopSpeaking();
        setSpeakingMessageId(null);
      } catch (err) {
        console.warn('Auto-refetch in new language failed:', err);
        setRefetchBanner(null);
      } finally {
        setIsLoading(false);
      }
    };

    autoRefetchInLanguage();
  }, [currentLanguage.code, activeDrugs, currentSessionId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isLoading, interimTranscript]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: `${currentLanguage.name} Consultation ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language: currentLanguage.name,
      contextDrugNames: activeDrugs.map((d) => d.genericName),
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: currentLanguage.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'offline-rule-engine',
        },
      ],
    };
    const nextSessions = [newSession, ...sessions];
    setSessions(nextSessions);
    setCurrentSessionId(newSession.id);
    storageService.saveChatSessions(nextSessions);
  };

  const deleteCurrentSession = () => {
    if (sessions.length <= 1) {
      createNewSession();
      return;
    }
    const nextSessions = sessions.filter((s) => s.id !== currentSessionId);
    setSessions(nextSessions);
    setCurrentSessionId(nextSessions[0].id);
    storageService.saveChatSessions(nextSessions);
  };

  // Safe structured action trigger
  const checkAndExecuteCommands = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('compare') || lower.includes('baseline') || lower.includes('regimen') || lower.includes('ஒப்பீடு') || lower.includes('तुलना')) {
      onNavigateTab?.('simulation');
    } else if (lower.includes('enzyme') || lower.includes('cyp') || lower.includes('என்சைம்')) {
      onNavigateTab?.('enzymes');
    } else if (lower.includes('graph') || lower.includes('knowledge') || lower.includes('வரைபடம்')) {
      onNavigateTab?.('knowledge_graph');
    } else if (lower.includes('adr') || lower.includes('risk') || lower.includes('ஆபத்து')) {
      onNavigateTab?.('adr_xai');
    } else if (lower.includes('report') || lower.includes('dossier') || lower.includes('அறிக்கை')) {
      onNavigateTab?.('reports');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    setInputValue('');
    setInterimTranscript('');
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: currentLanguage.name,
    };

    const updatedMessages = [...(currentSession?.messages || []), userMsg];
    updateCurrentSessionMessages(updatedMessages);
    setIsLoading(true);

    checkAndExecuteCommands(query);

    try {
      const activeEnzymes = enzymes.map((e) => ({
        name: e.name,
        activity: e.currentActivity,
        status: e.interactionStatus,
      }));
      const activeAdrs = predictions.map((p) => ({
        label: p.label,
        probability: p.probability,
        severity: p.severity,
      }));

      const activeDrugDetails = activeDrugs.map((d) => ({
        id: d.id,
        genericName: d.genericName,
        drugClass: d.drugClass,
        mechanismOfAction: d.mechanismOfAction,
        enzymes: d.enzymes,
        adme: {
          halfLifeHours: d.adme.halfLifeHours,
          clearanceLitersPerHour: d.adme.clearanceLitersPerHour,
          proteinBinding: d.adme.proteinBinding,
          bioavailability: d.adme.bioavailability,
        },
        knownInteractions: d.knownInteractions,
        knownAdrs: d.knownAdrs,
        contraindications: d.contraindications,
      }));

      const reply = await sendChatMessage({
        message: query,
        activeDrugs: activeDrugs.map((d) => d.genericName),
        activeDrugDetails,
        patientContext,
        currentTimeHours,
        activeConcentrations,
        enzymeStatus: activeEnzymes,
        adrRisks: activeAdrs,
        language: currentLanguage.name,
        llmMode: trainingProfile.llmMode,
        temperature: trainingProfile.temperature,
        knowledgeScope: trainingProfile.knowledgeScope,
        therapeuticVigilanceLevel: trainingProfile.therapeuticVigilanceLevel,
        thinkingBudget: trainingProfile.thinkingBudget,
        customDirectives: trainingProfile.customDirectives,
        history: updatedMessages,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: reply.source as any,
        trainedRangeBadge: trainingProfile.badge,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      updateCurrentSessionMessages(finalMessages);

      // Auto-speak response if not muted
      if (!isMuted) {
        speakSpecificMessage(assistantMsg.id, reply.text);
      }
    } catch (e: any) {
      console.warn('Chat assistant error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentSessionMessages = (msgs: ChatMessage[]) => {
    const nextSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return { ...s, messages: msgs, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSessions(nextSessions);
    storageService.saveChatSessions(nextSessions);
  };

  // Speak a specific message aloud in the designated language
  const speakSpecificMessage = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      voiceAssistant.stopSpeaking();
      setSpeakingMessageId(null);
      setVoiceState('idle');
      return;
    }

    voiceAssistant.stopSpeaking();
    setSpeakingMessageId(msgId);
    setVoiceState('speaking');

    voiceAssistant.speak(
      text,
      currentLanguage.speechVoiceLang,
      () => {
        setSpeakingMessageId(msgId);
        setVoiceState('speaking');
      },
      () => {
        setSpeakingMessageId(null);
        setVoiceState('idle');
      }
    );
  };

  // Voice Microphone Toggle
  const handleMicToggle = () => {
    if (voiceState === 'listening') {
      voiceAssistant.stopListening();
      setVoiceState('idle');
      setInterimTranscript('');
    } else if (voiceState === 'speaking') {
      voiceAssistant.stopSpeaking();
      setSpeakingMessageId(null);
      setVoiceState('idle');
    } else {
      setVoiceState('listening');
      setInterimTranscript('');

      voiceAssistant.startListening(
        currentLanguage.speechVoiceLang,
        (transcript, isFinal) => {
          if (isFinal) {
            setVoiceState('processing');
            setInterimTranscript('');
            handleSendMessage(transcript);
          } else {
            setInterimTranscript(transcript);
          }
        },
        (error) => {
          console.warn('Voice recognition error:', error);
          setVoiceState('idle');
          setInterimTranscript('');
        },
        () => {
          setVoiceState((current) => (current === 'listening' ? 'idle' : current));
        }
      );
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleExportChat = () => {
    if (!currentSession) return;
    const transcript = currentSession.messages
      .map((m) => `[${m.timestamp}] ${m.sender.toUpperCase()} (${m.language || currentLanguage.name}):\n${m.text}\n`)
      .join('\n---\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PolyPharm_Consultation_${currentSession.id}.txt`;
    a.click();
  };

  // Localized suggested prompt chips for all 18 languages
  const getLocalizedSuggestions = () => {
    switch (currentLanguage.code) {
      case 'ta':
        return [
          'வார்ஃபரின் மற்றும் அமியோடரோன் எதிர்வினையை விளக்குங்கள்',
          'மருந்து முறைகளை (Compare Regimens) எவ்வாறு ஒப்பிடுவது?',
          'CYP2C9 என்சைம் தடுப்பு எவ்வாறு செயல்படுகிறது?',
          'கடுமையான இரத்தப்போக்கு அபாயத்தை எவ்வாறு குறைப்பது?',
        ];
      case 'hi':
        return [
          'वारफेरिन और एमियोडैरोन परस्पर क्रिया समझाइए',
          'दवा व्यवस्था की तुलना (Compare Regimens) कैसे करें?',
          'CYP2C9 एंजाइम निषेध क्या है?',
          'रक्तस्राव के जोखिम को कैसे कम करें?',
        ];
      case 'es':
        return [
          'Explica la interacción Warfarina + Amiodarona',
          '¿Cómo comparar regímenes en el simulador?',
          '¿Cómo funciona la inhibición de CYP2C9?',
          'Predecir riesgos de hemorragia y QTc',
        ];
      case 'fr':
        return [
          'Expliquez l’interaction Warfarine et Amiodarone',
          'Comment comparer deux régimes thérapeutiques ?',
          'Quel est le rôle du CYP2C9 et du CYP3A4 ?',
          'Analyser les risques hémorragiques',
        ];
      case 'de':
        return [
          'Interaktion Warfarin und Amiodaron erklären',
          'Wie vergleicht man zwei Therapieschemata?',
          'Mechanismus der CYP2C9-Inhibition',
          'Blutungsrisiko und QTc-Verlängerung prüfen',
        ];
      case 'te':
        return [
          'వార్ఫరిన్ మరియు అమియోడారోన్ పరస్పర చర్య వివరించండి',
          'రెజిమెంట్‌లను ఎలా సరిపోల్చాలి (Compare Regimens)?',
          'CYP2C9 ఎంజైమ్ నిరోధం ఎలా పనిచేస్తుంది?',
          'రక్తస్రావం ప్రమాదాన్ని ఎలా తగ్గించాలి?',
        ];
      case 'ar':
        return [
          'اشرح التفاعل بين الوارفارين والأميودارون',
          'كيف يمكن مقارنة الأنظمة الدوائية جنبًا إلى جنب؟',
          'ما هي آلية تثبيط إنزيم CYP2C9؟',
          'توقع مخاطر النزيف الحاد وإطالة QTc',
        ];
      case 'zh':
        return [
          '解释华法林与胺碘酮的代谢相互作用',
          '如何使用工作台对比用药方案？',
          'CYP2C9 代谢酶抑制机制是什么？',
          '预测大出血及心律失常风险',
        ];
      case 'ja':
        return [
          'ワルファリンとアミオダロンの相互作用機序',
          '処方レジメンの並列比較機能の使い方',
          'CYP2C9阻害による血中濃度上昇について',
          '出血リスクとQT延長の予測',
        ];
      case 'ko':
        return [
          '와파린과 아미오다론 간의 상호작용 설명',
          '처방 비교 (Compare Regimens) 기능 활용법',
          'CYP2C9 효소 억제 메커니즘',
          '출혈 및 QTc 연장 위험 분석',
        ];
      default:
        return [
          'Explain Warfarin + Amiodarone interaction',
          'How to compare baseline vs candidate regimens?',
          'What is the mechanism of CYP2C9 inhibition?',
          'Predict acute bleeding and QTc risk scores',
        ];
    }
  };

  const suggestions = getLocalizedSuggestions();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[720px]">
      {/* Left Column: Chat Sessions History */}
      <div className="hidden lg:flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> {t.chat_title}
          </span>
          <button
            onClick={createNewSession}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/40 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" /> {t.chat_new}
          </button>
        </div>

        {/* Search Chats */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search consultations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {sessions
            .filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition-colors text-xs space-y-1 ${
                  s.id === currentSessionId
                    ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="font-semibold text-slate-200 truncate">{s.title}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  <span>{s.messages.length} msgs</span>
                </div>
              </div>
            ))}
        </div>

        {/* Actions bottom */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleExportChat}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer transition-colors"
            title="Download Transcript"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          <button
            onClick={deleteCurrentSession}
            className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
            title="Delete current consultation"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Chat Top Banner with Voice & In-Chat Language Selector */}
        <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight">{t.chat_title}</span>
                {/* Active Language Selector */}
                <div className="relative inline-flex items-center">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 mr-1.5 shrink-0" />
                  <select
                    aria-label="Change assistant language"
                    value={currentLanguage.code}
                    onChange={(e) => {
                      const target = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                      if (target && onLanguageChange) onLanguageChange(target);
                    }}
                    className="bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-700/60 rounded-lg px-2 py-0.5 text-[11px] font-mono font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-900 text-slate-100">
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                Active Regimen:{' '}
                <strong className="text-cyan-300">
                  {activeDrugs.length > 0 ? activeDrugs.map((d) => d.genericName).join(', ') : 'None selected'}
                </strong>
              </span>
            </div>
          </div>

          {/* Voice Indicator, Range Calibration, and Mute Button */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {/* LLM Range Training & Calibration Button */}
            <button
              onClick={() => setShowTrainingModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-[11px] font-mono cursor-pointer transition-colors shadow-sm"
              title="Calibrate AI Assistant LLM Range, TDM Windows & CPIC Directives"
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">Range:</span>
              <span className="text-cyan-300 font-bold">{trainingProfile.badge}</span>
              <span className="text-slate-400 text-[10px]">(T={trainingProfile.temperature.toFixed(2)})</span>
              <Sliders className="w-3 h-3 text-cyan-400 ml-0.5" />
            </button>

            {voiceState !== 'idle' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 animate-pulse">
                <Radio className="w-3 h-3" />
                <span className="uppercase text-[10px] font-bold">
                  {voiceState === 'listening' ? t.chat_listening : voiceState === 'speaking' ? t.chat_speaking : 'Processing...'}
                </span>
              </div>
            )}

            <button
              onClick={() => {
                if (speakingMessageId) {
                  voiceAssistant.stopSpeaking();
                  setSpeakingMessageId(null);
                  setVoiceState('idle');
                } else {
                  speakSpecificMessage('test_greeting', currentLanguage.greeting);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] cursor-pointer transition-colors"
              title={`Test Voice Speech in ${currentLanguage.name} (${currentLanguage.nativeName})`}
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Test ({currentLanguage.nativeName})</span>
            </button>

            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted) {
                  voiceAssistant.stopSpeaking();
                  setSpeakingMessageId(null);
                }
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Voice Unmute' : 'Voice Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Range Switcher & TDM Alert Bar */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[10px]">
            <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              Range:
            </span>

            <button
              onClick={() => {
                const next: LlmTrainingProfile = {
                  ...trainingProfile,
                  llmMode: 'tdm_narrow_range',
                  badge: 'TDM Strict (NTI)',
                  temperature: 0.15,
                  knowledgeScope: 'focused_tdm',
                  therapeuticVigilanceLevel: 'strict_nti',
                };
                setTrainingProfile(next);
                storageService.saveActiveLlmTrainingProfile(next);
              }}
              className={`px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer shrink-0 ${
                trainingProfile.llmMode === 'tdm_narrow_range'
                  ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🎯 TDM Strict (NTI)
            </button>

            <button
              onClick={() => {
                const next: LlmTrainingProfile = {
                  ...trainingProfile,
                  llmMode: 'pharmacogenomic_cpic',
                  badge: 'CPIC PGx Reasoner',
                  temperature: 0.35,
                  knowledgeScope: 'comprehensive_pgx',
                  therapeuticVigilanceLevel: 'strict_nti',
                };
                setTrainingProfile(next);
                storageService.saveActiveLlmTrainingProfile(next);
              }}
              className={`px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer shrink-0 ${
                trainingProfile.llmMode === 'pharmacogenomic_cpic'
                  ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🧬 CPIC PGx
            </button>

            <button
              onClick={() => {
                const next: LlmTrainingProfile = {
                  ...trainingProfile,
                  llmMode: 'deep_mechanistic_cascade',
                  badge: 'Dynamic PK/PD',
                  temperature: 0.55,
                  knowledgeScope: 'deep_mechanistic',
                  therapeuticVigilanceLevel: 'moderate',
                };
                setTrainingProfile(next);
                storageService.saveActiveLlmTrainingProfile(next);
              }}
              className={`px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer shrink-0 ${
                trainingProfile.llmMode === 'deep_mechanistic_cascade'
                  ? 'bg-teal-600 text-white border-teal-400 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              ⚡ Dynamic PK/PD
            </button>

            <button
              onClick={() => {
                const next: LlmTrainingProfile = {
                  ...trainingProfile,
                  llmMode: 'concise_summary',
                  badge: 'Point-of-Care',
                  temperature: 0.20,
                  knowledgeScope: 'standard_pk',
                  therapeuticVigilanceLevel: 'strict_nti',
                };
                setTrainingProfile(next);
                storageService.saveActiveLlmTrainingProfile(next);
              }}
              className={`px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer shrink-0 ${
                trainingProfile.llmMode === 'concise_summary'
                  ? 'bg-amber-600 text-white border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              📋 Rapid Triage
            </button>

            <button
              onClick={() => {
                const next: LlmTrainingProfile = {
                  ...trainingProfile,
                  llmMode: 'patient_friendly',
                  badge: 'Patient Counseling',
                  temperature: 0.60,
                  knowledgeScope: 'standard_pk',
                  therapeuticVigilanceLevel: 'moderate',
                };
                setTrainingProfile(next);
                storageService.saveActiveLlmTrainingProfile(next);
              }}
              className={`px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer shrink-0 ${
                trainingProfile.llmMode === 'patient_friendly'
                  ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              💬 Patient Counseling
            </button>
          </div>

          {/* Real-time TDM Breaches Notification Pill */}
          {tdmBreaches.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[11px] font-mono animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>
                TDM Alert: {tdmBreaches.map((b) => b.genericName).join(', ')} exceeds target!
              </span>
              <button
                onClick={() =>
                  handleSendMessage(
                    `Perform an urgent TDM analysis for ${tdmBreaches
                      .map((b) => b.genericName)
                      .join(', ')} comparing simulated plasma levels against therapeutic windows, toxic manifestations, and dosage adjustments.`
                  )
                }
                className="underline hover:text-white font-bold cursor-pointer ml-1"
              >
                Audit TDM
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Language Refetch Notice */}
        {refetchBanner && (
          <div className="bg-cyan-950/80 border-b border-cyan-500/40 text-cyan-200 px-4 py-2 text-xs flex items-center justify-between gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{refetchBanner}</span>
            </div>
            <button
              onClick={() => setRefetchBanner(null)}
              className="text-cyan-400 hover:text-white cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentSession?.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-800 border border-cyan-500/30 text-cyan-300'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 relative group ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none shadow-md shadow-cyan-950/30'
                      : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {msg.trainedRangeBadge && !isUser && (
                    <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-slate-800/80 text-[10px] font-mono text-cyan-300">
                      <Brain className="w-3 h-3 text-cyan-400" />
                      <span className="text-slate-400">Trained Range:</span>
                      <span className="font-bold text-cyan-300">{msg.trainedRangeBadge}</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Contextual Action Buttons inside Assistant Message */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      {/* Read Aloud / Stop Audio Speech Button */}
                      <button
                        onClick={() => speakSpecificMessage(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          isSpeakingThis
                            ? 'bg-cyan-600 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                        }`}
                        title={isSpeakingThis ? t.chat_stop_listen : t.chat_listen}
                      >
                        {isSpeakingThis ? (
                          <>
                            <Square className="w-3 h-3 text-white fill-white" />
                            <span>{t.chat_stop_listen}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>{t.chat_listen} ({currentLanguage.nativeName})</span>
                          </>
                        )}
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Shortcut to Compare Regimens if relevant */}
                      {(msg.text.toLowerCase().includes('compare') ||
                        msg.text.toLowerCase().includes('baseline') ||
                        msg.text.toLowerCase().includes('ஒப்பீடு') ||
                        msg.text.toLowerCase().includes('तुलना') ||
                        msg.text.toLowerCase().includes('regimen')) && (
                        <button
                          onClick={() => onNavigateTab?.('simulation')}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 hover:bg-amber-900 border border-amber-600/50 text-amber-300 cursor-pointer transition-colors"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Compare in Workbench</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Message Timestamp */}
                  <div className="flex items-center justify-between text-[9px] opacity-70 font-mono pt-0.5">
                    <span>{msg.timestamp}</span>
                    {msg.source && <span className="uppercase">{msg.source}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Live speech transcription interim bubble */}
          {voiceState === 'listening' && interimTranscript && (
            <div className="flex gap-3 max-w-md ml-auto flex-row-reverse">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 font-mono shadow-lg">
                <span className="text-[10px] text-rose-400 block mb-1 uppercase font-bold">
                  Listening ({currentLanguage.nativeName})...
                </span>
                <span>"{interimTranscript}"</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 max-w-md">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-cyan-500/30 text-cyan-300 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Simulating polypharmacy cascade in {currentLanguage.nativeName}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Localized Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-slate-500 font-mono text-[10px] shrink-0 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            {t.chat_suggestions_label}:
          </span>
          {suggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700/80 shrink-0 cursor-pointer transition-colors text-[10px] font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input & Voice Trigger Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          {/* Main Voice Button */}
          <button
            onClick={handleMicToggle}
            className={`p-3 rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center shrink-0 ${
              voiceState === 'listening'
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-950 ring-2 ring-rose-400'
                : voiceState === 'speaking'
                ? 'bg-amber-600 text-white shadow-amber-950'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/40 active:scale-95'
            }`}
            title={
              voiceState === 'listening'
                ? 'Stop listening'
                : voiceState === 'speaking'
                ? 'Stop voice playback'
                : `Click to speak in ${currentLanguage.name} (${currentLanguage.nativeName})`
            }
          >
            {voiceState === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={
              voiceState === 'listening'
                ? `Listening in ${currentLanguage.nativeName}... speak now`
                : `${t.chat_placeholder} (${currentLanguage.nativeName})`
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
            title={t.chat_send}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Assistant LLM Range & Cognitive Calibration Modal */}
      <LlmTrainingRangeModal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        activeProfile={trainingProfile}
        onApplyProfile={(newProfile) => {
          setTrainingProfile(newProfile);
        }}
        currentLanguageName={currentLanguage.name}
      />
    </div>
  );
};
