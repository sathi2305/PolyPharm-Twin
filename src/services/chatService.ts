import { ChatMessage, PatientContext, LlmReasoningMode, LlmKnowledgeScope } from '../types';

export interface ChatRequestPayload {
  message: string;
  activeDrugs: string[];
  activeDrugDetails?: {
    id: string;
    genericName: string;
    drugClass: string;
    mechanismOfAction: string;
    enzymes: { name: string; role: string; ki?: number; ind?: number }[];
    adme: { halfLifeHours: number; clearanceLitersPerHour: number; proteinBinding: number; bioavailability: number };
    knownInteractions: { partnerDrug: string; severity: string; mechanism: string; clinicalRisk: string }[];
    knownAdrs: string[];
    contraindications: string[];
  }[];
  patientContext?: PatientContext;
  currentTimeHours?: number;
  activeConcentrations?: { drugId: string; genericName: string; concMgL: number }[];
  enzymeStatus: { name: string; activity: number; status: string }[];
  adrRisks: { label: string; probability: number; severity: string }[];
  language: string;
  llmMode?: LlmReasoningMode;
  temperature?: number;
  knowledgeScope?: LlmKnowledgeScope;
  therapeuticVigilanceLevel?: 'strict_nti' | 'moderate' | 'relaxed';
  thinkingBudget?: 'minimal' | 'low' | 'medium' | 'high';
  customDirectives?: string;
  history: ChatMessage[];
}

export async function sendChatMessage(payload: ChatRequestPayload): Promise<{ text: string; source: string }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    return { text: data.text, source: data.source || 'gemini-3.8-flash' };
  } catch (err) {
    console.warn('[PolyPharm AI] Network chat request failed, generating multilingual client fallback response:', err);
    return {
      text: generateClientFallbackResponse(payload.message, payload.language, payload.activeDrugs),
      source: 'offline-rule-engine',
    };
  }
}

function generateClientFallbackResponse(query: string, lang: string, activeDrugs: string[]): string {
  const q = query.toLowerCase();
  const drugsStr = activeDrugs.length > 0 ? activeDrugs.join(' + ') : 'None selected';

  const l = (lang || 'English').toLowerCase();
  const isTamil = l.includes('tamil') || l.includes('தமிழ்');
  const isHindi = l.includes('hindi') || l.includes('हिन्दी');
  const isTelugu = l.includes('telugu') || l.includes('తెలుగు');
  const isMalayalam = l.includes('malayalam') || l.includes('മലയാളം');
  const isKannada = l.includes('kannada') || l.includes('ಕನ್ನಡ');
  const isBengali = l.includes('bengali') || l.includes('বাংলা');
  const isMarathi = l.includes('marathi') || l.includes('मराठी');
  const isGujarati = l.includes('gujarati') || l.includes('ગુજરાતી');
  const isPunjabi = l.includes('punjabi') || l.includes('ਪੰਜਾਬੀ');
  const isUrdu = l.includes('urdu') || l.includes('اردو');
  const isSpanish = l.includes('spanish') || l.includes('español');
  const isFrench = l.includes('french') || l.includes('français');
  const isGerman = l.includes('german') || l.includes('deutsch');
  const isArabic = l.includes('arabic') || l.includes('عربي');
  const isChinese = l.includes('chinese') || l.includes('中文');
  const isJapanese = l.includes('japanese') || l.includes('日本語');
  const isKorean = l.includes('korean') || l.includes('한국어');

  // Compare Regimens query
  if (q.includes('compare') || q.includes('baseline') || q.includes('regimen') || q.includes('ஒப்பீடு') || q.includes('तुलना') || q.includes('comparar')) {
    if (isTamil) {
      return `### மருந்து முறைகளை ஒப்பிடுதல் (Compare Regimens):\n\n1. **அடிப்படை முறை (Baseline A)**: நீங்கள் தற்போதைய மருந்துகளை 'Save as Baseline' பட்டன் மூலம் சேமிக்கலாம்.\n2. **மாற்றியமைக்கப்பட்ட முறை (Modified B)**: மருந்துகளின் அளவை மாற்றலாம் அல்லது புதிய மருந்துகளை சேர்த்து பக்கவாட்டு வரைபடத்தில் விளைவுகளை ஒப்பிடலாம்.\n3. **விளைவுகள்**: $\\Delta C_{max}$ உச்ச செறிவு மற்றும் CYP என்சைம் மீட்பு அளவுகளை உடனடியாகக் காணலாம்.`;
    }
    if (isHindi) {
      return `### दवा व्यवस्था की तुलना (Compare Regimens):\n\n1. **बेसलाइन (व्यवस्था A)**: 'Save as Baseline' बटन पर क्लिक करके अपनी वर्तमान दवा स्थिति को सुरक्षित करें।\n2. **संशोधित व्यवस्था (व्यवस्था B)**: किसी दवा को हटाकर या जोड़कर प्रभाव देखें।\n3. **तुलनात्मक विश्लेषण**: दोनों व्यवस्थाओं के प्लाज्मा स्तर और ADR जोखिमों को साथ-साथ देखें।`;
    }
    if (isSpanish) {
      return `### Comparación de Regímenes en el Banco de Simulación:\n\n1. **Línea Base (Régimen A)**: Congele su combinación actual de fármacos.\n2. **Candidato (Régimen B)**: Añada alternativas seguras y observe las curvas simultáneas.\n3. **Efectos Clínicos**: Visualice la reducción del riesgo de reacciones adversas y la cinética enzimática.`;
    }
    if (isTelugu) {
      return `### రెజిమెంట్‌లను సరిపోల్చడం (Compare Regimens):\n\n1. **బేస్‌లైన్ (Regimen A)**: ప్రస్తుత మందులను 'Save as Baseline' ద్వారా భద్రపరచండి.\n2. **సవరించిన రెజిమెంట్ (Regimen B)**: కొత్త మందులను జోడించి లేదా తొలగించి ఫలితాలను పోల్చండి.`;
    }
    return `### Compare Regimens Feature in Workbench:\n\n1. **Save Baseline (Regimen A)**: Click the "Save as Baseline (Regimen A)" button in the Simulation Workbench to freeze your reference multi-drug regimen.\n2. **Modify Candidate (Regimen B)**: Add or remove drugs (e.g. withdraw Amiodarone or switch to an alternative) and adjust patient parameters.\n3. **Side-by-Side Charts**: Observe synchronized time-series curves comparing plasma exposure ($C_{max}$), CYP enzyme activity recovery, and ADR risk reductions.`;
  }

  // Greetings
  if (q.includes('hi') || q.includes('hello') || q.includes('வணக்கம்') || q.includes('नमस्ते') || q.includes('hola') || q.includes('bonjour') || q.includes('hallo') || q.includes('مرحبا') || q.includes('你好') || q.includes('こんにちは') || q.includes('안녕하세요') || q.includes('నమస్కారం')) {
    if (isTamil) {
      return `வணக்கம்! 👋 நான் PolyPharm AI.\n\nமருந்து தொடர்புகள் (Drug Interactions), ADME இயக்கவியல், சைட்டோக்ரோம் P450 என்சைம்கள் மற்றும் பக்கவாட்டு மருந்து முறை ஒப்பீடு குறித்து நான் உங்களுக்கு உதவ முடியும்.\n\nசெயலில் உள்ள மருந்துகள்: ${drugsStr}.`;
    }
    if (isHindi) {
      return `नमस्ते! 👋 मैं PolyPharm AI हूँ।\n\nदवा परस्पर क्रिया (Drug Interactions), एंजाइम निषेध (CYP450), ADME सिमुलेशन और साइड-बाय-साइड व्यवस्था तुलना के बारे में पूछ सकते हैं।\n\nसक्रिय दवाएं: ${drugsStr}.`;
    }
    if (isTelugu) {
      return `నమస్కారం! 👋 నేను PolyPharm AI.\n\nమందుల పరస్పర చర్యలు, CYP ఎంజైమ్‌లు, ADME సిమ్యులేషన్ మరియు రెజిమెంట్ పోలికల గురించి మీకు సహాయపడగలను.\n\nయాక్టివ్ మందులు: ${drugsStr}.`;
    }
    if (isMalayalam) {
      return `നമസ്കാരം! 👋 ഞാൻ PolyPharm AI.\n\nമരുന്നുകളുടെ പരസ്പരപ്രവർത്തനം, CYP എൻസൈമുകൾ, ADME സിമുലേഷൻ എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.\n\nസജീവ മരുന്നുകൾ: ${drugsStr}.`;
    }
    if (isKannada) {
      return `ನಮಸ್ಕಾರ! 👋 ನಾನು PolyPharm AI.\n\nಔಷಧಿ ಪರಸ್ಪರ ಕ್ರಿಯೆಗಳು, CYP ಕಿಣ್ವಗಳು ಮತ್ತು ADME ಮಾದರಿಗಳ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.\n\nಸಕ್ರಿಯ ಔಷಧಿಗಳು: ${drugsStr}.`;
    }
    if (isBengali) {
      return `নমস্কার! 👋 আমি PolyPharm AI।\n\nওষুধের পারস্পরিক ক্রিয়া, CYP450 এনজাইম এবং ADME সিমুলেশন সংক্রান্ত বিশ্লেষণে আমি সাহায্য করতে পারি।\n\nবর্তমান ওষুধ: ${drugsStr}।`;
    }
    if (isMarathi) {
      return `नमस्कार! 👋 मी PolyPharm AI आहे.\n\nऔषधांमधील परस्परसंवाद, CYP450 एन्झाईम क्रिया आणि ADME विश्लेषणाबाबत मी मदत करू शकतो.\n\nसक्रिय औषधे: ${drugsStr}.`;
    }
    if (isGujarati) {
      return `નમસ્તે! 👋 હું PolyPharm AI છું.\n\nદવાઓની આંતરક્રિયા, CYP450 એન્ઝાઇમ અને ADME સિમ્યુલેશન વિશે હું તમને મદદ કરી શકું છું.\n\nસક્રિય દવાઓ: ${drugsStr}.`;
    }
    if (isPunjabi) {
      return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 👋 ਮੈਂ PolyPharm AI ਹਾਂ।\n\nਦਵਾਈਆਂ ਦੇ ਆਪਸੀ ਪ੍ਰਭਾਵ, CYP ਐਂਜ਼ਾਈਮ ਅਤੇ ADME ਸਿਮੂਲੇਸ਼ਨ ਬਾਰੇ ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।\n\nਮੌਜੂਦਾ ਦਵਾਈਆਂ: ${drugsStr}।`;
    }
    if (isUrdu) {
      return `السلام علیکم! 👋 میں PolyPharm AI ہوں۔\n\nدوائیوں کے باہمی تعامل، انزائم کائینیٹکس اور ADME ماڈلنگ کے بارے میں میں آپ کی رہنمائی کر سکتا ہوں۔\n\nموجودہ ادویات: ${drugsStr}۔`;
    }
    if (isSpanish) {
      return `¡Hola! 👋 Soy PolyPharm AI.\n\nPuedo ayudarte con interacciones fármaco-fármaco, cinética ADME, enzimas CYP450, predicción de reacciones adversas y comparación de regímenes terapéuticos.\n\nFármacos activos: ${drugsStr}.`;
    }
    if (isFrench) {
      return `Bonjour ! 👋 Je suis PolyPharm AI.\n\nJe peux analyser les interactions médicamenteuses, les enzymes CYP450, la cinétique ADME et comparer vos régimes thérapeutiques côte-à-côte.\n\nMédicaments actifs : ${drugsStr}.`;
    }
    if (isGerman) {
      return `Guten Tag! 👋 Ich bin PolyPharm AI.\n\nIch unterstütze Sie bei Arzneimittelwechselwirkungen, CYP450-Enzymflüssen, ADME-Kinetiken und dem direkten Vergleich von Therapieschemata.\n\nAktive Medikation: ${drugsStr}.`;
    }
    if (isArabic) {
      return `مرحبًا! 👋 أنا مساعد PolyPharm AI.\n\nيمكنني مساعدتك في تحليل التفاعلات الدوائية وحركية ADME ومقارنة الأنظمة الدوائية جنبًا إلى جنب.\n\nالأدوية النشطة حاليًا: ${drugsStr}.`;
    }
    if (isChinese) {
      return `您好！👋 我是 PolyPharm AI。\n\n我可以协助您分析多药相互作用、CYP450代谢酶通量、ADME动力学以及用药方案并排对比。\n\n当前方案药物: ${drugsStr}。`;
    }
    if (isJapanese) {
      return `こんにちは！👋 PolyPharm AIです。\n\n薬物相互作用、CYP450酵素動態、ADMEシミュレーションおよび処方レジメンの並列比較をサポートします。\n\n現在選択中の薬剤: ${drugsStr}。`;
    }
    if (isKorean) {
      return `안녕하세요! 👋 PolyPharm AI 어시스턴트입니다.\n\n다제병용 약물 상호작용, CYP 효소 대사, ADME 시뮬레이션 및 처방 비교 분석을 지원합니다.\n\n현재 활성 처방: ${drugsStr}.`;
    }

    return `Hi! 👋 I'm PolyPharm AI.\nHow can I help you today with your polypharmacy simulation?\n\nYou can ask me about:\n• Drug-Drug interactions in your active regimen (${drugsStr})\n• Side-by-side regimen comparisons (Baseline vs Alternative)\n• CYP450 enzyme inhibition / induction (CYP3A4, CYP2D6, CYP2C9)\n• ADME concentration-time curves & half-life shifts\n• Multi-label Adverse Drug Reaction (ADR) risk prediction`;
  }

  // ADME query
  if (q.includes('adme') || q.includes('absorption') || q.includes('clearance') || q.includes('இயக்கவியல்')) {
    if (isTamil) {
      return `### ADME மருந்து இயக்கவியல் விவரம்:\n\n1. **உறிஞ்சுதல் (Absorption - $k_a, F$)**: மருந்து இரத்த ஓட்டத்தில் நுழையும் விகிதம்.\n2. **பரவுதல் (Distribution - $V_d$)**: திசுக்களுக்கும் பிளாஸ்மாவிற்கும் இடையே பரவுதல்.\n3. **வளர்சிதை மாற்றம் (Metabolism - CYP450)**: கல்லீரல் என்சைம்கள் மூலம் மாற்றம்.\n4. **வெளியேற்றம் (Excretion - $CL, t_{1/2}$)**: சிறுநீரகம் மற்றும் கல்லீரல் மூலம் வெளியேற்றம்.\n\nஒன்றிற்கு மேற்பட்ட மருந்துகள் எடுத்துக் கொள்ளும்போது, என்சைம் போட்டியால் மருந்து வெளியேற்றம் குறைகிறது.`;
    }
    if (isHindi) {
      return `### ADME फार्माकोकाइनेटिक्स:\n\n1. **अवशोषण (Absorption)**: प्रणालीगत परिसंचरण में प्रवेश की दर।\n2. **वितरण (Distribution)**: ऊतक और प्लाज्मा वितरण ($V_d$)।\n3. **चयापचय (Metabolism)**: CYP450 यकृत एंजाइमों द्वारा रूपांतरण।\n4. **उत्सर्जन (Excretion)**: रीनल एवं हेपेटिक निकासी ($CL$, $t_{1/2}$)।`;
    }
    if (isSpanish) {
      return `### Cinética ADME:\n\n1. **Absorción**: Biodisponibilidad y tasa de absorción plasmática.\n2. **Distribución**: Volumen aparente y unión a proteínas plasmáticas.\n3. **Metabolismo**: Biotransformación hepática vía citocromo P450.\n4. **Excreción**: Aclaramiento renal y biliar con vida media de eliminación.`;
    }
    return `### ADME Simulation in PolyPharm-Twin\n\nADME models the physiological disposition of pharmaceuticals:\n\n1. **Absorption ($k_a$, $F$)**: Rate and fraction of active drug entering systemic circulation.\n2. **Distribution ($V_d$, Protein Binding)**: Dispersion into tissue compartments vs. plasma.\n3. **Metabolism (CYP450 / UGT)**: Hepatic Phase I and Phase II conversion into active/inactive metabolites.\n4. **Excretion ($CL$, $t_{1/2}$)**: Renal and biliary clearance pathways.\n\nCo-administered drugs dynamically modulate mutual clearance rates ($CL_{effective}$) based on competitive enzyme kinetics.`;
  }

  // CYP Enzymes
  if (q.includes('enzyme') || q.includes('cyp') || q.includes('என்சைம்') || q.includes('एंजाइम')) {
    if (isTamil) {
      return `### CYP450 கல்லீரல் என்சைம்கள்:\n\n• **CYP3A4**: 50% க்கும் மேற்பட்ட மருந்துகளை மாற்றுகிறது (Statins, Macrolides, CCBs).\n• **CYP2C9**: வார்ஃபரின் (Warfarin) போன்ற இரத்த உறைதல் தடுப்பு மருந்துகளை நீக்குகிறது. அமியோடரோன் (Amiodarone) இதை தடுப்பதால் கடுமையான இரத்தப்போக்கு அபாயம் ஏற்படும்.\n• **CYP2D6**: பீட்டா-பிளாக்கர்கள் மற்றும் ஆண்டிடிரப்ரஸன்ட்களை வெளியேற்றுகிறது.`;
    }
    if (isHindi) {
      return `### साइटोक्रोम P450 एंजाइम:\n\n• **CYP3A4**: अधिकांश प्रमुख दवाओं का चयापचय करता है।\n• **CYP2C9**: वारफेरिन की निकासी करता है। एमियोडैरोन द्वारा इसका निषेध रक्तस्राव का बड़ा कारण बनता है।\n• **CYP2D6**: बीटा-ब्लॉकर्स और एंटीडिप्रेसेंट्स को संसाधित करता है।`;
    }
    return `### Cytochrome P450 Enzyme Dynamics\n\nThe CYP superfamily accounts for over 70% of hepatic phase I drug metabolism:\n\n• **CYP3A4**: Clears statins, calcium channel blockers, macrolides, and direct oral anticoagulants.\n• **CYP2D6**: Highly polymorphic; metabolizes beta-blockers, SSRIs, codeine, and antiarrhythmics.\n• **CYP2C9**: Clears S-warfarin and NSAIDs. Amiodarone strongly inhibits CYP2C9, raising INR and bleeding hazards.\n• **CYP2C19**: Bioactivates clopidogrel into its antiplatelet thiol metabolite.`;
  }

  // Active Drugs Interaction Analysis
  if (activeDrugs.length > 0) {
    if (isTamil) {
      return `### தேர்ந்தெடுக்கப்பட்ட மருந்துகளின் ஆய்வு: ${drugsStr}\n\n• **என்சைம் போட்டி**: ஒரே என்சைமைப் பயன்படுத்தும் போது வெளியேற்றம் குறைந்து இரத்தத்தில் செறிவு அதிகரிக்கிறது.\n• **ADR அபாய எச்சரிக்கை**: நிகழ்நேர ADR மதிப்பீட்டு பேனலில் அபாய மதிப்பெண்களைப் பார்க்கவும்.\n• **ஒப்பீடு**: 'Compare Regimens' மூலம் மாற்று மருந்துகளை சோதித்துப் பார்க்கலாம்.`;
    }
    if (isHindi) {
      return `### सक्रिय व्यवस्था का विश्लेषण: ${drugsStr}\n\n• **एंजाइम प्रतिस्पर्धा**: सह-प्रशासन के कारण निकासी धीमी हो सकती है और प्लाज्मा सांद्रता बढ़ सकती है।\n• **ADR जोखिम**: संभावित दुष्प्रभावों के लिए वास्तविक समय ADR पैनल देखें।\n• **तुलना**: सुरक्षित विकल्पों के साथ प्रभाव की तुलना करें।`;
    }
    if (isSpanish) {
      return `### Evaluación Clínica del Régimen: ${drugsStr}\n\n• **Competición Enzimática**: Menor aclaramiento efectivo y prolongación de la vida media de eliminación.\n• **Exposición Plasmática**: Niveles elevados sobre la ventana terapéutica segura.\n• **Comparación**: Pruebe alternativas en el simulador para mitigar la toxicidad.`;
    }
    return `### Clinical Evaluation of Active Regimen: ${drugsStr}\n\n• **Enzyme Competition**: Substrates competing for shared hepatic enzymes experience decreased clearance and prolonged elimination half-lives.\n• **Exposure Area ($AUC_{0-48}$)**: Simulated plasma levels show potential accumulation above safe therapeutic windows.\n• **Regimen Comparison**: Use the "Compare Regimens" feature in the Simulation Workbench to evaluate baseline exposure against safer alternatives.`;
  }

  if (isTamil) {
    return `PolyPharm AI உங்களது வினவலை பகுப்பாய்வு செய்துள்ளது: "${query}".\n\nவிளைவுகளைக் காண பணிமனையில் மருந்துகளைத் தேர்ந்தெடுக்கவும்.`;
  }
  if (isHindi) {
    return `PolyPharm AI ने आपके प्रश्न का विश्लेषण किया: "${query}"।\n\nगतिशील परिणाम देखने के लिए वर्कबेंच में दवाएं चुनें।`;
  }
  return `PolyPharm AI has analyzed: "${query}".\n\nTo observe pharmacokinetic changes, choose medicines in the workbench or load a preset, then test the Compare Regimens feature.`;
}
