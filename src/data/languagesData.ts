/**
 * Multilingual Configuration for PolyPharm-Twin
 * Supports all 18 specified languages with native names and sample greetings
 */

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  speechVoiceLang: string; // BCP 47 language tag for Web Speech API
  greeting: string;
  sampleQuestion: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechVoiceLang: 'en-US',
    greeting: 'Hi! How can I assist you with your polypharmacy simulation today?',
    sampleQuestion: 'Explain the interaction between Warfarin and Amiodarone.',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechVoiceLang: 'ta-IN',
    greeting: 'வணக்கம்! PolyPharm AI-க்கு வரவேற்கிறேன். நான் உங்களுக்கு எப்படி உதவலாம்?',
    sampleQuestion: 'வார்ஃபரின் மற்றும் அமியோடரோன் இடையேயான எதிர்வினையை விளக்குங்கள்.',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechVoiceLang: 'hi-IN',
    greeting: 'नमस्ते! PolyPharm AI में आपका स्वागत है। मैं आपकी क्या सहायता कर सकता हूँ?',
    sampleQuestion: 'वारफेरिन और एमियोडैरोन के बीच परस्पर क्रिया समझाइए।',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechVoiceLang: 'te-IN',
    greeting: 'నమస్కారం! PolyPharm AI కి స్వాగతం. నేను మీకు ఎలా సహాయపడగలను?',
    sampleQuestion: 'వార్ఫరిన్ మరియు అమియోడారోన్ మధ్య పరస్పర చర్యను వివరించండి.',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    speechVoiceLang: 'ml-IN',
    greeting: 'നമസ്കാരം! PolyPharm AI-ലേക്ക് സ്വാഗതം. എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?',
    sampleQuestion: 'വാർഫറിനും അമിയോഡറോണും തമ്മിലുള്ള പ്രതിപ്രവർത്തനം വിശദീകരിക്കുക.',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechVoiceLang: 'kn-IN',
    greeting: 'ನಮಸ್ಕಾರ! PolyPharm AI ಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    sampleQuestion: 'ವಾರ್ಫರಿನ್ ಮತ್ತು ಅಮಿಯೊಡಾರೊನ್ ನಡುವಿನ ಪರಸ್ಪರ ಕ್ರಿಯೆಯನ್ನು ವಿವರಿಸಿ.',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechVoiceLang: 'bn-IN',
    greeting: 'নমস্কার! PolyPharm AI-তে স্বাগতম। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    sampleQuestion: 'ওয়ারফারিন এবং অ্যামিওডারোনের মধ্যে মিথস্ক্রিয়া ব্যাখ্যা করুন।',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechVoiceLang: 'mr-IN',
    greeting: 'नमस्कार! PolyPharm AI मध्ये आपले स्वागत आहे. मी तुम्हाला कशी मदत करू शकतो?',
    sampleQuestion: 'वॉर्फरिन आणि अमियोडारोनमधील परस्परसंवाद स्पष्ट करा.',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechVoiceLang: 'gu-IN',
    greeting: 'નમસ્તે! PolyPharm AI માં આપનું સ્વાગત છે. હું તમારી શું મદદ કરી શકું?',
    sampleQuestion: 'વોરફેરિન અને એમિઓડેરોન વચ્ચેની ક્રિયાપ્રતિક્રિયા સમજાવો.',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechVoiceLang: 'pa-IN',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! PolyPharm AI ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
    sampleQuestion: 'ਵਾਰਫਰੀਨ ਅਤੇ ਐਮੀਓਡਾਰੋਨ ਵਿਚਕਾਰ ਆਪਸੀ ਪ੍ਰਭਾਵ ਦੀ ਵਿਆਖਿਆ ਕਰੋ।',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    speechVoiceLang: 'ur-PK',
    greeting: 'السلام علیکم! PolyPharm AI میں خوش آمدید۔ میں آپ کی کیا مدد کر سکتا ہوں؟',
    sampleQuestion: 'وارفرین اور امیڈارون کے درمیان تعامل کی وضاحت کریں۔',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    speechVoiceLang: 'es-ES',
    greeting: '¡Hola! Bienvenido a PolyPharm AI. ¿Cómo puedo ayudarte hoy con tu simulación?',
    sampleQuestion: 'Explica la interacción entre warfarina y amiodarona.',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    speechVoiceLang: 'fr-FR',
    greeting: 'Bonjour ! Bienvenue sur PolyPharm AI. Comment puis-je vous aider aujourd’hui ?',
    sampleQuestion: 'Expliquez l’interaction entre la warfarine et l’amiodarone.',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    speechVoiceLang: 'de-DE',
    greeting: 'Guten Tag! Willkommen bei PolyPharm AI. Wie kann ich Ihnen heute helfen?',
    sampleQuestion: 'Erklären Sie die Wechselwirkung zwischen Warfarin und Amiodaron.',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    speechVoiceLang: 'ar-SA',
    greeting: 'مرحبًا! أهلاً بك في PolyPharm AI. كيف يمكنني مساعدتك في محاكاة التفاعلات الدوائية؟',
    sampleQuestion: 'اشرح التفاعل بين الوارفارين والأميودارون.',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文 (简体)',
    speechVoiceLang: 'zh-CN',
    greeting: '您好！欢迎使用 PolyPharm AI。今天有什么多药相互作用模拟可以帮您？',
    sampleQuestion: '请解释华法林与胺碘酮之间的代谢酶抑制和出血风险。',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    speechVoiceLang: 'ja-JP',
    greeting: 'こんにちは！PolyPharm AIへようこそ。どのような薬物相互作用シミュレーションをお手伝いしましょうか？',
    sampleQuestion: 'ワルファリンとアミオダロンの相互作用機序を説明してください。',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    speechVoiceLang: 'ko-KR',
    greeting: '안녕하세요! PolyPharm AI에 오신 것을 환영합니다. 다제약물 상호작용 시뮬레이션을 어떻게 도와드릴까요?',
    sampleQuestion: '와파린과 아미오다론 간의 대사 효소 억제 및 상호작용을 설명해 주세요.',
  },
];
