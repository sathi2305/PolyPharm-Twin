/**
 * Comprehensive Multilingual Localization for PolyPharm-Twin
 * Supports all 18 specified languages with native terminology
 */

export interface Translations {
  // Navigation Tabs
  nav_dashboard: string;
  nav_medicines: string;
  nav_simulation: string;
  nav_knowledge_graph: string;
  nav_enzymes: string;
  nav_adr_xai: string;
  nav_ai_assistant: string;
  nav_research: string;
  nav_reports: string;

  // Header Status
  status_live: string;
  status_ai_active: string;
  status_cached: string;
  status_online: string;
  status_offline: string;
  report_button: string;

  // Simulation Workbench & Compare Regimens
  wb_title: string;
  wb_subtitle: string;
  wb_compare_toggle: string;
  wb_compare_side_by_side: string;
  wb_compare_overlay: string;
  wb_save_baseline: string;
  wb_baseline_saved: string;
  wb_baseline_badge: string;
  wb_modified_badge: string;
  wb_clear_baseline: string;
  wb_restore_baseline: string;
  wb_swap_regimens: string;
  wb_active_regimen: string;
  wb_clear_regimen: string;
  wb_presets_title: string;
  wb_patient_twin: string;
  wb_delta_insights: string;
  wb_peak_conc_delta: string;
  wb_cyp_recovery: string;
  wb_adr_reduction: string;
  wb_add_medicine: string;
  wb_no_drugs: string;

  // PK & Metrics
  pk_title: string;
  pk_concentration: string;
  pk_enzymes: string;
  pk_adr_risk: string;
  time_scrubber: string;
  play: string;
  pause: string;
  reset: string;
  speed: string;

  // Assistant & Voice
  chat_title: string;
  chat_new: string;
  chat_placeholder: string;
  chat_send: string;
  chat_listening: string;
  chat_speaking: string;
  chat_listen: string;
  chat_stop_listen: string;
  chat_suggestions_label: string;
  chat_copied: string;
  chat_language_select: string;

  // Common
  disclaimer_badge: string;
  disclaimer_text: string;

  // Dashboard Module
  dash_active_drugs: string;
  dash_critical_adrs: string;
  dash_cyp_activity: string;
  dash_kg_interactions: string;
  dash_simulation_time: string;
  dash_quick_actions: string;
  dash_inspect_graph: string;
  dash_run_workbench: string;
  dash_browse_library: string;
  dash_open_dossier: string;
  dash_critical_alerts: string;
  dash_no_critical: string;
  dash_optimal_flux: string;

  // Medicine Library Module
  med_search_placeholder: string;
  med_all_classes: string;
  med_all_enzymes: string;
  med_add_custom: string;
  med_favorites_only: string;
  med_generic_name: string;
  med_drug_class: string;
  med_target_protein: string;
  med_metabolism_cyp: string;
  med_half_life: string;
  med_actions: string;
  med_inspect_details: string;
  med_active_in_twin: string;
  med_add_to_twin: string;

  // Knowledge Graph Module
  kg_title: string;
  kg_subtitle: string;
  kg_filter_nodes: string;
  kg_search_nodes: string;
  kg_all_types: string;
  kg_drugs: string;
  kg_enzymes: string;
  kg_proteins: string;
  kg_adrs: string;
  kg_node_inspector: string;
  kg_click_node: string;

  // Enzyme Monitoring Module
  enz_title: string;
  enz_subtitle: string;
  enz_critical_inhibition: string;
  enz_moderate_inhibition: string;
  enz_mild_inhibition: string;
  enz_induced: string;
  enz_optimal: string;
  enz_current_flux: string;
  enz_affected_substrates: string;

  // ADR & XAI Module
  adr_title: string;
  adr_subtitle: string;
  adr_risk_signals: string;
  adr_tgnn_badge: string;
  adr_no_predictions: string;
  xai_title: string;
  xai_subtitle: string;
  xai_causal_chain: string;
  xai_counterfactual: string;
  xai_evidence: string;

  // Research Mode Module
  res_title: string;
  res_subtitle: string;
  res_ablation_title: string;
  res_run_experiment: string;
  res_hyperparameters: string;

  // Report Modal
  rep_title: string;
  rep_subtitle: string;
  rep_print: string;
  rep_download: string;
  rep_close: string;
  rep_patient_summary: string;
  rep_active_regimen_table: string;
  rep_metabolic_impact: string;
  rep_adr_assessment: string;

  // Comprehensive Tooltips Across All Modules
  tooltip_live_simulation: string;
  tooltip_ai_engine: string;
  tooltip_drugs_cached: string;
  tooltip_network_mode: string;
  tooltip_language_switcher: string;
  tooltip_theme_toggle: string;
  tooltip_dossier_report: string;
  tooltip_compare_regimens: string;
  tooltip_save_baseline: string;
  tooltip_restore_baseline: string;
  tooltip_swap_regimens: string;
  tooltip_clear_regimen: string;
  tooltip_time_scrubber: string;
  tooltip_voice_mic: string;
  tooltip_voice_speak: string;
  tooltip_chat_export: string;
  tooltip_chat_clear: string;
  tooltip_kg_zoom_in: string;
  tooltip_kg_zoom_out: string;
  tooltip_kg_reset_view: string;
  tooltip_filter_class: string;
  tooltip_filter_enzyme: string;
  tooltip_add_custom_medicine: string;
  tooltip_patient_egfr: string;
  tooltip_patient_hepatic: string;
  tooltip_patient_age: string;
  tooltip_patient_weight: string;

  // Refetch Notice
  refetch_notice: string;
}

export const TRANSLATIONS: Record<string, Partial<Translations>> = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_medicines: 'Medicine Library',
    nav_simulation: 'Simulation Workbench',
    nav_knowledge_graph: 'Knowledge Graph',
    nav_enzymes: 'Enzyme Monitor',
    nav_adr_xai: 'ADR Risk & XAI',
    nav_ai_assistant: 'AI Assistant',
    nav_research: 'Research Mode',
    nav_reports: 'Clinical Dossier',

    status_live: 'LIVE SIMULATION',
    status_ai_active: 'AI ENGINE ACTIVE',
    status_cached: 'DRUGS CACHED',
    status_online: 'ONLINE',
    status_offline: 'OFFLINE MODE',
    report_button: 'Dossier Report',

    wb_title: 'Multi-Drug Polypharmacy Simulation Workbench',
    wb_subtitle: 'Assemble multi-drug regimens, model competitive CYP flux, and simulate 48-hour pharmacokinetic disposition.',
    wb_compare_toggle: 'Compare Regimens',
    wb_compare_side_by_side: 'Side-by-Side Comparison',
    wb_compare_overlay: 'Overlay Comparison',
    wb_save_baseline: 'Save as Baseline (Regimen A)',
    wb_baseline_saved: 'Baseline Regimen A Saved',
    wb_baseline_badge: 'Regimen A (Baseline)',
    wb_modified_badge: 'Regimen B (Modified / Candidate)',
    wb_clear_baseline: 'Clear Baseline',
    wb_restore_baseline: 'Restore Baseline as Active',
    wb_swap_regimens: 'Swap Regimen A & B',
    wb_active_regimen: 'Active Regimen',
    wb_clear_regimen: 'Clear Regimen',
    wb_presets_title: 'Benchmark Polypharmacy Presets',
    wb_patient_twin: 'Virtual Patient Twin Demographics & Pharmacogenomics',
    wb_delta_insights: 'Pharmacokinetic & Safety Deltas (A vs B)',
    wb_peak_conc_delta: 'Peak Concentration Delta (ΔCmax)',
    wb_cyp_recovery: 'CYP Enzyme Activity Recovery',
    wb_adr_reduction: 'Max ADR Risk Delta',
    wb_add_medicine: '+ Add medicine from library...',
    wb_no_drugs: 'No active drugs in current regimen. Pick medicines above or click a preset.',

    pk_title: 'Dynamic Pharmacokinetic & Metabolic Progression Curves',
    pk_concentration: 'Concentration C(t)',
    pk_enzymes: 'CYP Enzyme Flux %',
    pk_adr_risk: 'ADR Risk Probability',
    time_scrubber: 'Timeline Scrubber',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    speed: 'Speed',

    chat_title: 'PolyPharm AI Assistant',
    chat_new: 'New Chat',
    chat_placeholder: 'Ask about drug interactions, CYP inhibition, ADR risks, or compare regimens...',
    chat_send: 'Send',
    chat_listening: 'Listening... speak now',
    chat_speaking: 'Speaking response...',
    chat_listen: 'Listen',
    chat_stop_listen: 'Stop',
    chat_suggestions_label: 'Suggested Inquiries',
    chat_copied: 'Copied to clipboard!',
    chat_language_select: 'Conversation Language',

    disclaimer_badge: 'Clinical Research Disclaimer',
    disclaimer_text: 'PolyPharm-Twin models in-silico pharmacokinetics and ADR predictions for research and educational purposes. Not an autonomous clinical diagnostic system.',

    // Dashboard Module
    dash_active_drugs: 'Active Compounds',
    dash_critical_adrs: 'High-Risk ADR Signals',
    dash_cyp_activity: 'Mean CYP Metabolic Flux',
    dash_kg_interactions: 'Graph Interaction Edges',
    dash_simulation_time: 'Simulation Timeline',
    dash_quick_actions: 'Quick Navigation & Actions',
    dash_inspect_graph: 'Explore Knowledge Graph',
    dash_run_workbench: 'Open Simulation Workbench',
    dash_browse_library: 'Browse Medicine Library',
    dash_open_dossier: 'Export Clinical Dossier',
    dash_critical_alerts: 'Active Critical Pharmacological Alerts',
    dash_no_critical: 'No critical interaction warnings detected in the active regimen.',
    dash_optimal_flux: 'All monitored Cytochrome P450 enzymes operating in optimal therapeutic ranges.',

    // Medicine Library Module
    med_search_placeholder: 'Search 150+ drugs by generic name, brand, SMILES, target...',
    med_all_classes: 'All Drug Classes',
    med_all_enzymes: 'All CYP Enzymes',
    med_add_custom: '+ Add New Medicine',
    med_favorites_only: 'Favorites Only',
    med_generic_name: 'Generic Compound',
    med_drug_class: 'Class & Category',
    med_target_protein: 'Primary Target',
    med_metabolism_cyp: 'Metabolizing CYP',
    med_half_life: 'Half-Life (t1/2)',
    med_actions: 'Actions',
    med_inspect_details: 'Inspect Compound Details',
    med_active_in_twin: 'Active in Twin',
    med_add_to_twin: '+ Add to Regimen',

    // Knowledge Graph Module
    kg_title: 'Biomedical Polypharmacy Knowledge Graph',
    kg_subtitle: 'Interactive multi-relational network connecting drugs, CYP enzymes, target proteins, and adverse outcomes.',
    kg_filter_nodes: 'Filter Entities',
    kg_search_nodes: 'Search entities...',
    kg_all_types: 'All Entity Types',
    kg_drugs: 'Drugs',
    kg_enzymes: 'CYP Enzymes',
    kg_proteins: 'Target Proteins',
    kg_adrs: 'Adverse Reactions',
    kg_node_inspector: 'Entity Inspector',
    kg_click_node: 'Click any node in the canvas to inspect its molecular, metabolic, and interaction properties.',

    // Enzyme Monitoring Module
    enz_title: 'Cytochrome P450 Enzyme Flux & Metabolic Cascade Monitor',
    enz_subtitle: 'Real-time competitive inhibition and induction tracking based on active drug affinities.',
    enz_critical_inhibition: 'CRITICAL INHIBITION',
    enz_moderate_inhibition: 'MODERATE INHIBITION',
    enz_mild_inhibition: 'MILD INHIBITION',
    enz_induced: 'INDUCED (EXPRESSION +)',
    enz_optimal: 'OPTIMAL FLUX',
    enz_current_flux: 'Current Activity Flux',
    enz_affected_substrates: 'Affected Substrates',

    // ADR & XAI Module
    adr_title: 'Multi-Label Adverse Drug Reaction (ADR) Signals',
    adr_subtitle: 'Calibrated probabilistic risk stratification across organ system toxicities.',
    adr_tgnn_badge: 'TGNN PREDICTION',
    adr_no_predictions: 'Select one or more medicines in the simulator to evaluate ADR risk.',
    xai_title: 'Explainable AI (XAI) Causal Attribution & Mechanistic Chains',
    xai_subtitle: 'Deconstructs the Temporal Graph Neural Network’s prediction into biochemical causality, enzyme flux drops, attention weights, and clinical evidence.',
    xai_causal_chain: 'Step-by-Step Mechanistic Molecular Cascade',
    xai_counterfactual: 'Counterfactual Deprescribing & Safety Recommendations',
    xai_evidence: 'Indexed Clinical References & Literature Evidence',

    // Research Mode Module
    res_title: 'Scientific Ablation & Model Architecture Benchmark',
    res_subtitle: 'Ablation evaluation of Temporal GNN against baseline architectures, dynamic KG integration, and ADME cascades.',
    res_ablation_title: 'Model Architecture Ablation Comparison',
    res_run_experiment: 'Run Model Ablation Benchmark',
    res_hyperparameters: 'Model Hyperparameters & Latent Dimensions',

    // Report Modal
    rep_title: 'PolyPharm-Twin Pharmacovigilance Simulation Dossier',
    rep_subtitle: 'Validated in-silico multi-drug interaction, ADME disposition, and ADR safety profile.',
    rep_print: 'Print Clinical Dossier',
    rep_download: 'Download JSON Dossier',
    rep_close: 'Close',
    rep_patient_summary: 'Virtual Patient Twin Profile',
    rep_active_regimen_table: 'Co-Administered Drug Regimen',
    rep_metabolic_impact: 'Cytochrome P450 Metabolic Flux Matrix',
    rep_adr_assessment: 'Calibrated ADR Toxicological Risk Assessment',

    // Comprehensive Tooltips Across All Modules
    tooltip_live_simulation: 'Simulation engine active: computing continuous ODE pharmacokinetic curves and metabolic flux',
    tooltip_ai_engine: 'Gemini AI reasoning & Temporal Graph Neural Network prediction engine online',
    tooltip_drugs_cached: 'Comprehensive pharmaceutical library cached in local memory with molecular descriptors',
    tooltip_network_mode: 'Toggle between live server cloud computation and local offline rule engine',
    tooltip_language_switcher: 'Switch language globally across all app modules, charts, tooltips, and AI assistant',
    tooltip_theme_toggle: 'Toggle between dark and light color themes',
    tooltip_dossier_report: 'Generate and export comprehensive clinical pharmacovigilance dossier',
    tooltip_compare_regimens: 'Open side-by-side time-series dual-twin comparing baseline vs candidate regimen',
    tooltip_save_baseline: 'Freeze current co-administered drugs as baseline Regimen A',
    tooltip_restore_baseline: 'Restore baseline Regimen A as the active simulation regimen',
    tooltip_swap_regimens: 'Swap Regimen A (baseline) and Regimen B (candidate)',
    tooltip_clear_regimen: 'Clear all active drugs from the simulation workbench',
    tooltip_time_scrubber: 'Drag or click to inspect drug concentrations, CYP flux, and ADR risks at any hour',
    tooltip_voice_mic: 'Click to speak in your selected language via browser speech recognition',
    tooltip_voice_speak: 'Listen to the assistant explanation spoken aloud in your selected language',
    tooltip_chat_export: 'Download full consultation conversation transcript as a text file',
    tooltip_chat_clear: 'Clear current consultation and start fresh session',
    tooltip_kg_zoom_in: 'Zoom in on biomedical knowledge graph network',
    tooltip_kg_zoom_out: 'Zoom out of biomedical knowledge graph network',
    tooltip_kg_reset_view: 'Reset graph zoom and center active drug cluster',
    tooltip_filter_class: 'Filter pharmaceutical library by therapeutic drug class',
    tooltip_filter_enzyme: 'Filter pharmaceutical library by primary metabolizing CYP enzyme',
    tooltip_add_custom_medicine: 'Create and add custom chemical compound or experimental drug entity',
    tooltip_patient_egfr: 'Estimated glomerular filtration rate: modulates renal clearance of polar metabolites',
    tooltip_patient_hepatic: 'Hepatic impairment status: modulates CYP metabolic capacity and liver clearance',
    tooltip_patient_age: 'Patient chronological age: factors into renal decline and distribution volume',
    tooltip_patient_weight: 'Body mass in kilograms: directly scales pharmacokinetic volume of distribution (Vd)',

    // Refetch Notice
    refetch_notice: 'Language updated — all localized labels, tooltips, and AI assistant responses refetched',
  },

  ta: {
    nav_dashboard: 'டாஷ்போர்டு',
    nav_medicines: 'மருந்து நூலகம்',
    nav_simulation: 'உருவகப்படுத்துதல் பணித்தளம்',
    nav_knowledge_graph: 'அறிவு வரைபடம்',
    nav_enzymes: 'என்சைம் கண்காணிப்பு',
    nav_adr_xai: 'ADR ஆபத்து & XAI',
    nav_ai_assistant: 'AI உதவியாளர்',
    nav_research: 'ஆராய்ச்சி முறை',
    nav_reports: 'மருத்துவ அறிக்கை',

    status_live: 'நேரலை உருவகப்படுத்துதல்',
    status_ai_active: 'AI என்ஜின் செயலில் உள்ளது',
    status_cached: 'மருந்துகள் சேமிக்கப்பட்டுள்ளன',
    status_online: 'இணைப்பில் உள்ளது',
    status_offline: 'ஆஃப்லைன் முறை',
    report_button: 'அறிக்கை பதிவிறக்கு',

    wb_title: 'பல்வேறு மருந்து உருவகப்படுத்துதல் பணித்தளம்',
    wb_subtitle: 'பல மருந்துகளை இணைத்து CYP என்சைம் மற்றும் 48 மணிநேர மருந்து இயக்கவியலை உருவகப்படுத்துங்கள்.',
    wb_compare_toggle: 'மருந்து முறைகளை ஒப்பிடுக',
    wb_compare_side_by_side: 'பக்கவாட்டு ஒப்பீட்டு வரைபடம்',
    wb_compare_overlay: 'மேலடுக்கு ஒப்பீடு',
    wb_save_baseline: 'அடிப்படை முறையாக சேமி (முறை A)',
    wb_baseline_saved: 'அடிப்படை முறை A சேமிக்கப்பட்டது',
    wb_baseline_badge: 'முறை A (அடிப்படை)',
    wb_modified_badge: 'முறை B (மாற்றியமைக்கப்பட்ட முறை)',
    wb_clear_baseline: 'அடிப்படையை நீக்கு',
    wb_restore_baseline: 'அடிப்படை முறையை மீட்டமை',
    wb_swap_regimens: 'A & B இடமாற்றம் செய்',
    wb_active_regimen: 'செயலில் உள்ள மருந்துகள்',
    wb_clear_regimen: 'அனைத்தையும் நீக்கு',
    wb_presets_title: 'மாதிரி மருந்து சேர்க்கைகள்',
    wb_patient_twin: 'நோயாளியின் மெய்நிகர் மரபணு மற்றும் உடல் பண்புகள்',
    wb_delta_insights: 'மருந்து இயக்கவியல் & பாதுகாப்பு ஒப்பீட்டு வேறுபாடுகள் (A vs B)',
    wb_peak_conc_delta: 'அதிகபட்ச செறிவு வேறுபாடு (ΔCmax)',
    wb_cyp_recovery: 'CYP என்சைம் மீட்பு சதவீதம்',
    wb_adr_reduction: 'ADR ஆபத்து குறைப்பு',
    wb_add_medicine: '+ நூலகத்திலிருந்து மருந்து சேர்க்கவும்...',
    wb_no_drugs: 'மருந்துகள் எதுவும் தேர்ந்தெடுக்கப்படவில்லை. மேலே உள்ளவற்றிலிருந்து தேர்ந்தெடுக்கவும்.',

    pk_title: 'மருந்தியல் மற்றும் வளர்சிதை மாற்ற வரைபடம்',
    pk_concentration: 'மருந்து செறிவு C(t)',
    pk_enzymes: 'CYP என்சைம் இயக்கம் %',
    pk_adr_risk: 'ADR ஆபத்து நிகழ்தகவு',
    time_scrubber: 'நேரக் கட்டுப்பாடு',
    play: 'இயக்கு',
    pause: 'நிறுத்து',
    reset: 'மீட்டமை',
    speed: 'வேகம்',

    chat_title: 'PolyPharm AI உதவியாளர்',
    chat_new: 'புதிய உரையாடல்',
    chat_placeholder: 'மருந்து தொடர்புகள், CYP என்சைம்கள், ADR அபாயங்கள் குறித்து கேளுங்கள்...',
    chat_send: 'அனுப்பு',
    chat_listening: 'கேட்கிறது... பேசுங்கள்',
    chat_speaking: 'பேசுகிறது...',
    chat_listen: 'கேட்க',
    chat_stop_listen: 'நிறுத்து',
    chat_suggestions_label: 'பரிந்துரைக்கப்பட்ட கேள்விகள்',
    chat_copied: 'நகலெடுக்கப்பட்டது!',
    chat_language_select: 'உரையாடல் மொழி',

    disclaimer_badge: 'மருத்துவ ஆராய்ச்சி எச்சரிக்கை',
    disclaimer_text: 'PolyPharm-Twin என்பது ஆராய்ச்சி மற்றும் கல்விக்கான உருவகப்படுத்துதல் கருவியாகும். இது சுயமாக நோய் கண்டறியும் அமைப்பு அல்ல.',
  },

  hi: {
    nav_dashboard: 'डैशबोर्ड',
    nav_medicines: 'दवा लाइब्रेरी',
    nav_simulation: 'सिमुलेशन वर्कबेंच',
    nav_knowledge_graph: 'नॉलेज ग्राफ',
    nav_enzymes: 'एंजाइम मॉनिटर',
    nav_adr_xai: 'ADR जोखिम और XAI',
    nav_ai_assistant: 'AI सहायक',
    nav_research: 'अनुसंधान मोड',
    nav_reports: 'क्लिनिकल डोजियर',

    status_live: 'लाइव सिमुलेशन',
    status_ai_active: 'AI इंजन सक्रिय',
    status_cached: 'दवाएं कैश्ड',
    status_online: 'ऑनलाइन',
    status_offline: 'ऑफलाइन मोड',
    report_button: 'डोजियर रिपोर्ट',

    wb_title: 'बहु-दवा पॉलीफार्मेसी सिमुलेशन वर्कबेंच',
    wb_subtitle: 'कई दवाओं के मिश्रण, CYP एंजाइम प्रवाह और 48-घंटे के फार्माकोकाइनेटिक्स का सिमुलेशन करें।',
    wb_compare_toggle: 'दवा व्यवस्था की तुलना करें',
    wb_compare_side_by_side: 'साथ-साथ तुलनात्मक चार्ट',
    wb_compare_overlay: 'ओवरले तुलना',
    wb_save_baseline: 'बेसलाइन के रूप में सहेजें (व्यवस्था A)',
    wb_baseline_saved: 'बेसलाइन व्यवस्था A सहेजी गई',
    wb_baseline_badge: 'व्यवस्था A (बेसलाइन)',
    wb_modified_badge: 'व्यवस्था B (संशोधित व्यवस्था)',
    wb_clear_baseline: 'बेसलाइन हटाएं',
    wb_restore_baseline: 'बेसलाइन को सक्रिय करें',
    wb_swap_regimens: 'A और B को बदलें',
    wb_active_regimen: 'सक्रिय दवाएं',
    wb_clear_regimen: 'सभी हटाएं',
    wb_presets_title: 'मानक पॉलीफार्मेसी प्रीसेट',
    wb_patient_twin: 'वर्चुअल रोगी डेमोग्राफिक्स और फार्माकोजेनॉमिक्स',
    wb_delta_insights: 'फार्माकोकाइनेटिक और सुरक्षा अंतर (A बनाम B)',
    wb_peak_conc_delta: 'शिखर सांद्रता अंतर (ΔCmax)',
    wb_cyp_recovery: 'CYP एंजाइम गतिविधि सुधार',
    wb_adr_reduction: 'ADR जोखिम में कमी',
    wb_add_medicine: '+ लाइब्रेरी से दवा जोड़ें...',
    wb_no_drugs: 'वर्तमान व्यवस्था में कोई दवा नहीं है। ऊपर से चुनें या प्रीसेट क्लिक करें।',

    pk_title: 'फार्माकोकाइनेटिक और मेटाबॉलिक प्रोग्रेशन कर्व्स',
    pk_concentration: 'प्लाज्मा सांद्रता C(t)',
    pk_enzymes: 'CYP एंजाइम गतिविधि %',
    pk_adr_risk: 'ADR जोखिम संभावना',
    time_scrubber: 'समय नियंत्रण',
    play: 'चलाएं',
    pause: 'रोकें',
    reset: 'रीसेट',
    speed: 'गति',

    chat_title: 'PolyPharm AI सहायक',
    chat_new: 'नई बातचीत',
    chat_placeholder: 'दवा परस्पर क्रिया, CYP निषेध या ADR जोखिम के बारे में पूछें...',
    chat_send: 'भेजें',
    chat_listening: 'सुन रहा है... बोलिए',
    chat_speaking: 'बोल रहा है...',
    chat_listen: 'सुनें',
    chat_stop_listen: 'रोकें',
    chat_suggestions_label: 'सुझाए गए प्रश्न',
    chat_copied: 'कॉपी किया गया!',
    chat_language_select: 'बातचीत की भाषा',

    disclaimer_badge: 'क्लिनिकल रिसर्च अस्वीकरण',
    disclaimer_text: 'PolyPharm-Twin अनुसंधान और शैक्षिक उद्देश्यों के लिए एक सिमुलेशन प्लेटफॉर्म है। यह प्रत्यक्ष चिकित्सा निदान उपकरण नहीं है।',
  },

  te: {
    nav_dashboard: 'డాష్‌బోర్డ్',
    nav_medicines: 'ఔషధ లైబ్రరీ',
    nav_simulation: 'సిమ్యులేషన్ వర్క్‌బెంచ్',
    nav_knowledge_graph: 'నాలెడ్జ్ గ్రాఫ్',
    nav_enzymes: 'ఎంజైమ్ మానిటర్',
    nav_adr_xai: 'ADR రిస్క్ & XAI',
    nav_ai_assistant: 'AI అసిస్టెంట్',
    nav_research: 'పరిశోధన మోడ్',
    nav_reports: 'క్లినికల్ నివేదిక',

    status_live: 'ప్రత్యక్ష సిమ్యులేషన్',
    status_ai_active: 'AI ఇంజిన్ యాక్టివ్',
    status_cached: 'మందులు కాష్ చేయబడ్డాయి',
    status_online: 'ఆన్‌లైన్',
    status_offline: 'ఆఫ్‌లైన్ మోడ్',
    report_button: 'రిపోర్ట్ డౌన్‌లోడ్',

    wb_title: 'బహుళ ఔషధ పాలీఫార్మసీ సిమ్యులేషన్ వర్క్‌బెంచ్',
    wb_subtitle: 'బహుళ ఔషధాలను కలపండి, CYP ఎంజైమ్ ప్రవాహం మరియు 48 గంటల ఫార్మకోకైనటిక్స్ మోడల్ చేయండి.',
    wb_compare_toggle: 'రెజిమెంట్‌లను సరిపోల్చండి',
    wb_compare_side_by_side: 'పక్కపక్కన చార్టులు',
    wb_compare_overlay: 'ఓవర్‌లే పోలిక',
    wb_save_baseline: 'బేస్‌లైన్‌గా సేవ్ చేయండి (రెజిమెంట్ A)',
    wb_baseline_saved: 'బేస్‌లైన్ రెజిమెంట్ A సేవ్ చేయబడింది',
    wb_baseline_badge: 'రెజిమెంట్ A (బేస్‌లైన్)',
    wb_modified_badge: 'రెజిమెంట్ B (సవరించినది)',
    wb_clear_baseline: 'బేస్‌లైన్ తీసివేయి',
    wb_restore_baseline: 'బేస్‌లైన్‌ను పునరుద్ధరించు',
    wb_swap_regimens: 'A & B మార్చు',
    wb_active_regimen: 'యాక్టివ్ మందులు',
    wb_clear_regimen: 'అన్నీ తొలగించు',
    wb_presets_title: 'స్టాండర్డ్ పాలీఫార్మసీ ప్రిసెట్లు',
    wb_patient_twin: 'వర్చువల్ పేషెంట్ డెమోగ్రాఫిక్స్ & ఫార్మకోజెనోమిక్స్',
    wb_delta_insights: 'ఫార్మకోకైనటిక్ & రిస్క్ తేడాలు (A vs B)',
    wb_peak_conc_delta: 'గరిష్ట సాంద్రత తేడా (ΔCmax)',
    wb_cyp_recovery: 'CYP ఎంజైమ్ రికవరీ',
    wb_adr_reduction: 'ADR రిస్క్ తగ్గింపు',
    wb_add_medicine: '+ లైబ్రరీ నుండి ఔషధాన్ని జోడించండి...',
    wb_no_drugs: 'ఏ ఔషధాలూ ఎంపిక చేయబడలేదు. ఎగువన ఎంచుకోండి లేదా ప్రిసెట్ క్లిక్ చేయండి.',

    pk_title: 'ఫార్మకోకైనటిక్ & మెటబాలిక్ కర్వ్స్',
    pk_concentration: 'సాంద్రత C(t)',
    pk_enzymes: 'CYP ఎంజైమ్ %',
    pk_adr_risk: 'ADR రిస్క్ సంభావ్యత',
    time_scrubber: 'టైమ్‌లైన్',
    play: 'ప్లే',
    pause: 'పాజ్',
    reset: 'రీసెట్',
    speed: 'స్పీడ్',

    chat_title: 'PolyPharm AI అసిస్టెంట్',
    chat_new: 'కొత్త చాట్',
    chat_placeholder: 'ఔషధ పరస్పర చర్యలు, CYP ఎంజైమ్‌లు లేదా ADR ప్రమాదాల గురించి అడగండి...',
    chat_send: 'పంపు',
    chat_listening: 'వింటోంది... మాట్లాడండి',
    chat_speaking: 'మాట్లాడుతోంది...',
    chat_listen: 'వినండి',
    chat_stop_listen: 'ఆపండి',
    chat_suggestions_label: 'సూచించిన ప్రశ్నలు',
    chat_copied: 'కాపీ చేయబడింది!',
    chat_language_select: 'సంభాషణ భాష',

    disclaimer_badge: 'క్లినికల్ పరిశోధన నిరాకరణ',
    disclaimer_text: 'PolyPharm-Twin అనేది పరిశోధన మరియు విద్యా ప్రయోజనాల కోసం రూపొందించబడిన సిమ్యులేషన్ ప్లాట్‌ఫారమ్.',
  },

  ml: {
    nav_dashboard: 'ഡാഷ്‌ബോർഡ്',
    nav_medicines: 'മരുന്ന് ശേഖരം',
    nav_simulation: 'സിമുലേഷൻ വർക്ക്ബെഞ്ച്',
    nav_knowledge_graph: 'വിജ്ഞാന ഗ്രാഫ്',
    nav_enzymes: 'എൻസൈം മോണിറ്റർ',
    nav_adr_xai: 'ADR റിസ്ക് & XAI',
    nav_ai_assistant: 'AI സഹായി',
    nav_research: 'ഗവേഷണ മോഡ്',
    nav_reports: 'ക്ലിനിക്കൽ റിപ്പോർട്ട്',

    status_live: 'തത്സമയ സിമുലേഷൻ',
    status_ai_active: 'AI എൻജിൻ സജീവം',
    status_cached: 'മരുന്നുകൾ ലഭ്യമാണ്',
    status_online: 'ഓൺലൈൻ',
    status_offline: 'ഓഫ്‌ലൈൻ മോഡ്',
    report_button: 'റിപ്പോർട്ട് ഡൗൺലോഡ്',

    wb_title: 'പോളിഫാർമസി സിമുലേഷൻ വർക്ക്ബെഞ്ച്',
    wb_subtitle: 'ഒന്നിലധികം മരുന്നുകൾ സംയോജിപ്പിച്ച് 48 മണിക്കൂർ ഫാർമക്കോകൈനറ്റിക്സ് നിരീക്ഷിക്കുക.',
    wb_compare_toggle: 'മരുന്നുകൾ താരതമ്യം ചെയ്യുക',
    wb_compare_side_by_side: 'സൈഡ്-ബൈ-സൈഡ് ചാർട്ടുകൾ',
    wb_compare_overlay: 'ഓവർലേ താരതമ്യം',
    wb_save_baseline: 'ബേസ്‌ലൈൻ ആയി സൂക്ഷിക്കുക (റെജിമെൻ A)',
    wb_baseline_saved: 'ബേസ്‌ലൈൻ റെജിമെൻ A സൂക്ഷിച്ചു',
    wb_baseline_badge: 'റെജിമെൻ A (ബേസ്‌ലൈൻ)',
    wb_modified_badge: 'റെജിമെൻ B (മാറ്റങ്ങൾ വരുത്തിയത്)',
    wb_clear_baseline: 'ബേസ്‌ലൈൻ നീക്കുക',
    wb_restore_baseline: 'ബേസ്‌ലൈൻ തിരികെ നൽകുക',
    wb_swap_regimens: 'A & B മാറ്റുക',
    wb_active_regimen: 'സജീവ മരുന്നുകൾ',
    wb_clear_regimen: 'എല്ലാം നീക്കുക',
    wb_presets_title: 'സ്റ്റാൻഡേർഡ് പ്രിസെറ്റുകൾ',
    wb_patient_twin: 'രോഗിയുടെ ജനിതക-ശാരീരിക അവസ്ഥ',
    wb_delta_insights: 'ഫാർമക്കോകൈനറ്റിക് വ്യത്യാസങ്ങൾ (A vs B)',
    wb_peak_conc_delta: 'സാന്ദ്രത വ്യത്യാസം (ΔCmax)',
    wb_cyp_recovery: 'CYP എൻസൈം പുനഃസ്ഥാപനം',
    wb_adr_reduction: 'ADR റിസ്ക് കുറവ്',
    wb_add_medicine: '+ മരുന്ന് ചേർക്കുക...',
    wb_no_drugs: 'മരുന്നുകളൊന്നും തിരഞ്ഞെടുത്തിട്ടില്ല.',

    pk_title: 'ഫാർമക്കോകൈനറ്റിക് പുരോഗതി ഗ്രാഫ്',
    pk_concentration: 'സാന്ദ്രത C(t)',
    pk_enzymes: 'CYP എൻസൈം %',
    pk_adr_risk: 'ADR റിസ്ക് സാധ്യത',
    time_scrubber: 'ടൈംലൈൻ',
    play: 'തുടങ്ങുക',
    pause: 'നിർത്തുക',
    reset: 'റീസെറ്റ്',
    speed: 'വേഗത',

    chat_title: 'PolyPharm AI സഹായി',
    chat_new: 'പുതിയ ചാറ്റ്',
    chat_placeholder: 'മരുന്നുകളുടെ പ്രതിപ്രവർത്തനങ്ങളെക്കുറിച്ച് ചോദിക്കൂ...',
    chat_send: 'അയക്കുക',
    chat_listening: 'കേൾക്കുന്നു... സംസാരിക്കൂ',
    chat_speaking: 'സംസാരിക്കുന്നു...',
    chat_listen: 'കേൾക്കുക',
    chat_stop_listen: 'നിർത്തുക',
    chat_suggestions_label: 'നിർദ്ദേശിച്ച ചോദ്യങ്ങൾ',
    chat_copied: 'പകർത്തി!',
    chat_language_select: 'സംഭാഷണ ഭാഷ',

    disclaimer_badge: 'ഗവേഷണ മുന്നറിയിപ്പ്',
    disclaimer_text: 'PolyPharm-Twin ഗവേഷണ ആവശ്യങ്ങൾക്കായുള്ള സിമുലേഷൻ പ്ലാറ്റ്‌ഫോമാണ്.',
  },

  kn: {
    nav_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    nav_medicines: 'ಔಷಧಿ ಗ್ರಂಥಾಲಯ',
    nav_simulation: 'ಸಿಮ್ಯುಲೇಶನ್ ವರ್ಕ್‌ಬೆಂಚ್',
    nav_knowledge_graph: 'ಜ್ಞಾನ ನಕ್ಷೆ',
    nav_enzymes: 'ಕಿಣ್ವ ಮಾನಿಟರ್',
    nav_adr_xai: 'ADR ಅಪಾಯ & XAI',
    nav_ai_assistant: 'AI ಸಹಾಯಕ',
    nav_research: 'ಸಂಶೋಧನಾ ಮೋಡ್',
    nav_reports: 'ಕ್ಲಿನಿಕಲ್ ವರದಿ',

    status_live: 'ಲೈವ್ ಸಿಮ್ಯುಲೇಶನ್',
    status_ai_active: 'AI ಎಂಜಿನ್ ಸಕ್ರಿಯ',
    status_cached: 'ಔಷಧಿಗಳು ಲಭ್ಯ',
    status_online: 'ಆನ್‌ಲೈನ್',
    status_offline: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್',
    report_button: 'ವರದಿ ಡೌನ್‌ಲೋಡ್',

    wb_title: 'ಪಾಲಿಫಾರ್ಮಸಿ ಸಿಮ್ಯುಲೇಶನ್ ವರ್ಕ್‌ಬೆಂಚ್',
    wb_subtitle: 'ಹಲವು ಔಷಧಿಗಳನ್ನು ಸಂಯೋಜಿಸಿ 48 ಗಂಟೆಗಳ ಫಾರ್ಮಾಕೊಕೈನೆಟಿಕ್ಸ್ ವೀಕ್ಷಿಸಿ.',
    wb_compare_toggle: 'ರೆಜಿಮನ್‌ಗಳನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ',
    wb_compare_side_by_side: 'ಪಕ್ಕ-ಪಕ್ಕದ ಚಾರ್ಟ್‌ಗಳು',
    wb_compare_overlay: 'ಓವರ್‌ಲೇ ಹೋಲಿಕೆ',
    wb_save_baseline: 'ಬೇಸ್‌ಲೈನ್‌ ಆಗಿ ಉಳಿಸಿ (ರೆಜಿಮನ್ A)',
    wb_baseline_saved: 'ಬೇಸ್‌ಲೈನ್ ರೆಜಿಮನ್ A ಉಳಿಸಲಾಗಿದೆ',
    wb_baseline_badge: 'ರೆಜಿಮನ್ A (ಬೇಸ್‌ಲೈನ್)',
    wb_modified_badge: 'ರೆಜಿಮನ್ B (ಮಾರ್ಪಡಿಸಿದ ರೆಜಿಮನ್)',
    wb_clear_baseline: 'ಬೇಸ್‌ಲೈನ್ ತೆರವುಗೊಳಿಸಿ',
    wb_restore_baseline: 'ಬೇಸ್‌ಲೈನ್ ಮರುಸ್ಥಾಪಿಸಿ',
    wb_swap_regimens: 'A & B ಅದಲು ಬದಲು ಮಾಡಿ',
    wb_active_regimen: 'ಸಕ್ರಿಯ ಔಷಧಿಗಳು',
    wb_clear_regimen: 'ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ',
    wb_presets_title: 'ಪ್ರಮಾಣಿತ ಪ್ರಿಸೆಟ್‌ಗಳು',
    wb_patient_twin: 'ರೋಗಿಯ ವಂಶವಾಹಿ ಮತ್ತು ದೈಹಿಕ ಲಕ್ಷಣಗಳು',
    wb_delta_insights: 'ಫಾರ್ಮಾಕೊಕೈನೆಟಿಕ್ ವ್ಯತ್ಯಾಸಗಳು (A vs B)',
    wb_peak_conc_delta: 'ಗರಿಷ್ಠ ಸಾಂದ್ರತೆ ವ್ಯತ್ಯಾಸ (ΔCmax)',
    wb_cyp_recovery: 'CYP ಕಿಣ್ವ ಚೇತರಿಕೆ',
    wb_adr_reduction: 'ADR ಅಪಾಯ ಕಡಿತ',
    wb_add_medicine: '+ ಗ್ರಂಥಾಲಯದಿಂದ ಔಷಧಿ ಸೇರಿಸಿ...',
    wb_no_drugs: 'ಯಾವುದೇ ಔಷಧಿಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿಲ್ಲ.',

    pk_title: 'ಫಾರ್ಮಾಕೊಕೈನೆಟಿಕ್ ಮತ್ತು ಚಯಾಪಚಯ ರೇಖೆಗಳು',
    pk_concentration: 'ಸಾಂದ್ರತೆ C(t)',
    pk_enzymes: 'CYP ಕಿಣ್ವ %',
    pk_adr_risk: 'ADR ಅಪಾಯ ಸಂಭವನೀಯತೆ',
    time_scrubber: 'ಟೈಮ್‌ಲೈನ್',
    play: 'ಪ್ಲೇ',
    pause: 'ವಿರಾಮ',
    reset: 'ಮರುಹೊಂದಿಸಿ',
    speed: 'ವೇಗ',

    chat_title: 'PolyPharm AI ಸಹಾಯಕ',
    chat_new: 'ಹೊಸ ಚಾಟ್',
    chat_placeholder: 'ಔಷಧ ಪರಸ್ಪರ ಕ್ರಿಯೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ...',
    chat_send: 'ಕಳುಹಿಸಿ',
    chat_listening: 'ಆಲಿಸುತ್ತಿದೆ... ಮಾತನಾಡಿ',
    chat_speaking: 'ಮಾತನಾಡುತ್ತಿದೆ...',
    chat_listen: 'ಆಲಿಸಿ',
    chat_stop_listen: 'ನಿಲ್ಲಿಸಿ',
    chat_suggestions_label: 'ಸೂಚಿಸಿದ ಪ್ರಶ್ನೆಗಳು',
    chat_copied: 'ನಕಲಿಸಲಾಗಿದೆ!',
    chat_language_select: 'ಸಂಭಾಷಣೆ ಭಾಷೆ',

    disclaimer_badge: 'ಸಂಶೋಧನಾ ಹಕ್ಕುತ್ಯಾಗ',
    disclaimer_text: 'PolyPharm-Twin ಸಂಶೋಧನಾ ಉದ್ದೇಶಗಳಿಗಾಗಿ ಮಾತ್ರ ಬಳಸುವ ಸಿಮ್ಯುಲೇಶನ್ ವೇದಿಕೆಯಾಗಿದೆ.',
  },

  bn: {
    nav_dashboard: 'ড্যাশবোর্ড',
    nav_medicines: 'ওষুধের লাইব্রেরি',
    nav_simulation: 'সিমুলেশন ওয়ার্কবেঞ্চ',
    nav_knowledge_graph: 'নলেজ গ্রাফ',
    nav_enzymes: 'এনজাইম মনিটর',
    nav_adr_xai: 'ADR ঝুঁকি ও XAI',
    nav_ai_assistant: 'AI সহকারী',
    nav_research: 'গবেষণা মোড',
    nav_reports: 'ক্লিনিকাল রিপোর্ট',

    status_live: 'লাইভ সিমুলেশন',
    status_ai_active: 'AI ইঞ্জিন সক্রিয়',
    status_cached: 'ওষুধ সংরক্ষিত',
    status_online: 'অনলাইন',
    status_offline: 'অফলাইন মোড',
    report_button: 'রিপোর্ট ডাউনলোড',

    wb_title: 'পলিফার্মেসি সিমুলেশন ওয়ার্কবেঞ্চ',
    wb_subtitle: 'একাধিক ওষুধের সংমিশ্রণ ও ৪৮ ঘণ্টার ফার্মাকোকাইনেটিক্স পর্যবেক্ষণ করুন।',
    wb_compare_toggle: 'ওষুধের রেজিমেন তুলনা করুন',
    wb_compare_side_by_side: 'পাশাপাশি তুলনামূলক চার্ট',
    wb_compare_overlay: 'ওভারলে তুলনা',
    wb_save_baseline: 'বেসলাইন হিসেবে সংরক্ষণ করুন (রেজিমেন A)',
    wb_baseline_saved: 'বেসলাইন রেজিমেন A সংরক্ষিত',
    wb_baseline_badge: 'রেজিমেন A (বেসলাইন)',
    wb_modified_badge: 'রেজিমেন B (সংশোধিত)',
    wb_clear_baseline: 'বেসলাইন মুছুন',
    wb_restore_baseline: 'বেসলাইন সক্রিয় করুন',
    wb_swap_regimens: 'A ও B অদলবদল করুন',
    wb_active_regimen: 'সক্রিয় ওষুধসমূহ',
    wb_clear_regimen: 'সব মুছুন',
    wb_presets_title: 'স্ট্যান্ডার্ড প্রিসেট',
    wb_patient_twin: 'রোগীর জেনেটিক ও শারীরবৃত্তীয় ডেটা',
    wb_delta_insights: 'ফার্মাকোকাইনেটিক পার্থক্য (A বনাম B)',
    wb_peak_conc_delta: 'সর্বোচ্চ ঘনত্বের পার্থক্য (ΔCmax)',
    wb_cyp_recovery: 'CYP এনজাইম পুনরুদ্ধার',
    wb_adr_reduction: 'ADR ঝুঁকি হ্রাস',
    wb_add_medicine: '+ লাইব্রেরি থেকে ওষুধ যোগ করুন...',
    wb_no_drugs: 'কোনো ওষুধ নির্বাচন করা হয়নি।',

    pk_title: 'ফার্মাকোকাইনেটিক কার্ভ',
    pk_concentration: 'ঘনত্ব C(t)',
    pk_enzymes: 'CYP এনজাইম %',
    pk_adr_risk: 'ADR ঝুঁকির সম্ভাবনা',
    time_scrubber: 'টাইমলাইন',
    play: 'শুরু',
    pause: 'বিরতি',
    reset: 'রিসেট',
    speed: 'গতি',

    chat_title: 'PolyPharm AI সহকারী',
    chat_new: 'নতুন চ্যাট',
    chat_placeholder: 'ওষুধের মিথস্ক্রিয়া বা ঝুঁকি সম্পর্কে জিজ্ঞাসা করুন...',
    chat_send: 'পাঠান',
    chat_listening: 'শুনছে... বলুন',
    chat_speaking: 'বলছে...',
    chat_listen: 'শুনুন',
    chat_stop_listen: 'থামুন',
    chat_suggestions_label: 'প্রস্তাবিত প্রশ্নাবলী',
    chat_copied: 'কপি করা হয়েছে!',
    chat_language_select: 'কথোপকথনের ভাষা',

    disclaimer_badge: 'ক্লিনিকাল গবেষণা দাবিত্যাগ',
    disclaimer_text: 'PolyPharm-Twin একটি গবেষণাভিত্তিক সিমুলেশন প্ল্যাটফর্ম। এটি স্বয়ংক্রিয় চিকিৎসা নির্ণয় ব্যবস্থা নয়।',
  },

  es: {
    nav_dashboard: 'Panel de Control',
    nav_medicines: 'Biblioteca de Medicamentos',
    nav_simulation: 'Banco de Simulación',
    nav_knowledge_graph: 'Grafo de Conocimiento',
    nav_enzymes: 'Monitor de Enzimas',
    nav_adr_xai: 'Riesgo ADR & XAI',
    nav_ai_assistant: 'Asistente IA',
    nav_research: 'Modo Investigación',
    nav_reports: 'Dossier Clínico',

    status_live: 'SIMULACIÓN EN VIVO',
    status_ai_active: 'MOTOR IA ACTIVO',
    status_cached: 'FÁRMACOS EN MEMORIA',
    status_online: 'EN LÍNEA',
    status_offline: 'MODO SIN CONEXIÓN',
    report_button: 'Informe Clínico',

    wb_title: 'Banco de Simulación Polifarmacéutica',
    wb_subtitle: 'Combine múltiples fármacos, modele el flujo enzimático CYP y simule la cinética en 48 horas.',
    wb_compare_toggle: 'Comparar Regímenes',
    wb_compare_side_by_side: 'Gráficos Comparativos Paralelos',
    wb_compare_overlay: 'Superposición de Curvas',
    wb_save_baseline: 'Guardar como Línea Base (Régimen A)',
    wb_baseline_saved: 'Régimen A guardado como Línea Base',
    wb_baseline_badge: 'Régimen A (Línea Base)',
    wb_modified_badge: 'Régimen B (Modificado)',
    wb_clear_baseline: 'Borrar Línea Base',
    wb_restore_baseline: 'Restaurar Línea Base a Activo',
    wb_swap_regimens: 'Intercambiar Régimen A y B',
    wb_active_regimen: 'Régimen Activo',
    wb_clear_regimen: 'Limpiar Régimen',
    wb_presets_title: 'Preajustes Polifarmacéuticos Estándar',
    wb_patient_twin: 'Demografía y Farmacogenómica del Gemelo Virtual',
    wb_delta_insights: 'Deltas Farmacocinéticos y de Seguridad (A vs B)',
    wb_peak_conc_delta: 'Delta de Concentración Pico (ΔCmax)',
    wb_cyp_recovery: 'Recuperación de Actividad Enzimática CYP',
    wb_adr_reduction: 'Reducción de Riesgo ADR Máximo',
    wb_add_medicine: '+ Agregar medicamento de biblioteca...',
    wb_no_drugs: 'No hay fármacos en el régimen activo. Seleccione medicamentos arriba.',

    pk_title: 'Curvas de Progresión Farmacocinética y Metabólica',
    pk_concentration: 'Concentración Plasmática C(t)',
    pk_enzymes: 'Flujo Enzimático CYP %',
    pk_adr_risk: 'Probabilidad de Riesgo ADR',
    time_scrubber: 'Línea de Tiempo',
    play: 'Reproducir',
    pause: 'Pausar',
    reset: 'Reiniciar',
    speed: 'Velocidad',

    chat_title: 'Asistente IA PolyPharm',
    chat_new: 'Nueva Consulta',
    chat_placeholder: 'Pregunte sobre interacciones, inhibición CYP, riesgos ADR o compare regímenes...',
    chat_send: 'Enviar',
    chat_listening: 'Escuchando... hable ahora',
    chat_speaking: 'Hablando respuesta...',
    chat_listen: 'Escuchar',
    chat_stop_listen: 'Detener',
    chat_suggestions_label: 'Consultas Sugeridas',
    chat_copied: '¡Copiado al portapapeles!',
    chat_language_select: 'Idioma de Conversación',

    disclaimer_badge: 'Aviso de Investigación Clínica',
    disclaimer_text: 'PolyPharm-Twin es una plataforma in-silico para investigación y apoyo a la decisión clínica.',
  },

  fr: {
    nav_dashboard: 'Tableau de Bord',
    nav_medicines: 'Bibliothèque de Médicaments',
    nav_simulation: 'Atelier de Simulation',
    nav_knowledge_graph: 'Graphe de Connaissances',
    nav_enzymes: 'Moniteur d’Enzymes',
    nav_adr_xai: 'Risque d’EI & XAI',
    nav_ai_assistant: 'Assistant IA',
    nav_research: 'Mode Recherche',
    nav_reports: 'Dossier Clinique',

    status_live: 'SIMULATION EN DIRECT',
    status_ai_active: 'MOTEUR IA ACTIF',
    status_cached: 'MÉDICAMENTS EN MÉMOIRE',
    status_online: 'EN LIGNE',
    status_offline: 'MODE HORS LIGNE',
    report_button: 'Dossier Clinique',

    wb_title: 'Atelier de Simulation Polythérapeutique',
    wb_subtitle: 'Modélisez les flux enzymatiques CYP et simulez la cinétique sur 48 heures.',
    wb_compare_toggle: 'Comparer les Régimes',
    wb_compare_side_by_side: 'Graphiques Côte-à-Côte',
    wb_compare_overlay: 'Superposition des Courbes',
    wb_save_baseline: 'Enregistrer comme Base (Régime A)',
    wb_baseline_saved: 'Régime de Base A enregistré',
    wb_baseline_badge: 'Régime A (Base)',
    wb_modified_badge: 'Régime B (Modifié)',
    wb_clear_baseline: 'Effacer la Base',
    wb_restore_baseline: 'Restaurer la Base',
    wb_swap_regimens: 'Inverser Régime A et B',
    wb_active_regimen: 'Régime Actif',
    wb_clear_regimen: 'Effacer Régime',
    wb_presets_title: 'Profils Polythérapeutiques de Référence',
    wb_patient_twin: 'Profil Pharmacogénomique du Patient Virtuel',
    wb_delta_insights: 'Deltas Pharmacocinétiques & Sécurité (A vs B)',
    wb_peak_conc_delta: 'Delta de Concentration Pic (ΔCmax)',
    wb_cyp_recovery: 'Récupération Enzyatique CYP',
    wb_adr_reduction: 'Réduction du Risque d’Effet Indésirable',
    wb_add_medicine: '+ Ajouter un médicament...',
    wb_no_drugs: 'Aucun médicament sélectionné.',

    pk_title: 'Courbes Pharmacocinétiques et Métaboliques',
    pk_concentration: 'Concentration Plasmatique C(t)',
    pk_enzymes: 'Activité Enzymatique CYP %',
    pk_adr_risk: 'Probabilité de Risque d’EI',
    time_scrubber: 'Chronologie',
    play: 'Lecture',
    pause: 'Pause',
    reset: 'Réinitialiser',
    speed: 'Vitesse',

    chat_title: 'Assistant PolyPharm IA',
    chat_new: 'Nouveau Chat',
    chat_placeholder: 'Posez une question sur les interactions, le CYP ou comparez les régimes...',
    chat_send: 'Envoyer',
    chat_listening: 'Écoute en cours... parlez',
    chat_speaking: 'Lecture vocale...',
    chat_listen: 'Écouter',
    chat_stop_listen: 'Arrêter',
    chat_suggestions_label: 'Questions Suggérées',
    chat_copied: 'Copié !',
    chat_language_select: 'Langue de Discussion',

    disclaimer_badge: 'Avertissement de Recherche',
    disclaimer_text: 'PolyPharm-Twin est un outil de simulation in-silico destiné à la recherche et à l’enseignement.',
  },

  de: {
    nav_dashboard: 'Dashboard',
    nav_medicines: 'Arzneimittelbibliothek',
    nav_simulation: 'Simulations-Workbench',
    nav_knowledge_graph: 'Wissensgraph',
    nav_enzymes: 'Enzym-Monitor',
    nav_adr_xai: 'UAW-Risiko & XAI',
    nav_ai_assistant: 'KI-Assistent',
    nav_research: 'Forschungsmodus',
    nav_reports: 'Klinisches Dossier',

    status_live: 'LIVE-SIMULATION',
    status_ai_active: 'KI-ENGINE AKTIV',
    status_cached: 'ARZNEIMITTEL GELADEN',
    status_online: 'ONLINE',
    status_offline: 'OFFLINE-MODUS',
    report_button: 'Dossier-Bericht',

    wb_title: 'Polypharmazie-Simulations-Workbench',
    wb_subtitle: 'Kombinieren Sie Wirkstoffe, modellieren Sie CYP-Flüsse und simulieren Sie 48-Stunden-Kinetiken.',
    wb_compare_toggle: 'Therapien vergleichen',
    wb_compare_side_by_side: 'Nebeneinander-Vergleich',
    wb_compare_overlay: 'Überlagerter Vergleich',
    wb_save_baseline: 'Als Baseline speichern (Regime A)',
    wb_baseline_saved: 'Baseline-Regime A gespeichert',
    wb_baseline_badge: 'Regime A (Baseline)',
    wb_modified_badge: 'Regime B (Modifiziert)',
    wb_clear_baseline: 'Baseline löschen',
    wb_restore_baseline: 'Baseline wiederherstellen',
    wb_swap_regimens: 'Regime A & B tauschen',
    wb_active_regimen: 'Aktive Medikation',
    wb_clear_regimen: 'Medikation leeren',
    wb_presets_title: 'Standard-Polypharmazie-Voreinstellungen',
    wb_patient_twin: 'Virtueller Patient: Demografie & Pharmakogenomik',
    wb_delta_insights: 'Pharmakokinetische & Sicherheits-Deltas (A vs B)',
    wb_peak_conc_delta: 'Spitzenkonzentrations-Delta (ΔCmax)',
    wb_cyp_recovery: 'CYP-Enzymaktivitäts-Erholung',
    wb_adr_reduction: 'Max. UAW-Risikoreduktion',
    wb_add_medicine: '+ Medikament hinzufügen...',
    wb_no_drugs: 'Keine aktiven Medikamente ausgewählt.',

    pk_title: 'Pharmakokinetische & Metabolische Kurven',
    pk_concentration: 'Plasmakonzentration C(t)',
    pk_enzymes: 'CYP-Enzymfluss %',
    pk_adr_risk: 'UAW-Risikowahrscheinlichkeit',
    time_scrubber: 'Zeitleiste',
    play: 'Abspielen',
    pause: 'Pause',
    reset: 'Zurücksetzen',
    speed: 'Geschwindigkeit',

    chat_title: 'PolyPharm KI-Assistent',
    chat_new: 'Neuer Chat',
    chat_placeholder: 'Fragen Sie nach Wechselwirkungen, CYP-Hemmung oder vergleichen Sie Schemata...',
    chat_send: 'Senden',
    chat_listening: 'Hört zu... sprechen Sie',
    chat_speaking: 'Sprachausgabe...',
    chat_listen: 'Anhören',
    chat_stop_listen: 'Stopp',
    chat_suggestions_label: 'Vorgeschlagene Fragen',
    chat_copied: 'In die Zwischenablage kopiert!',
    chat_language_select: 'Gesprächssprache',

    disclaimer_badge: 'Klinischer Forschungshinweis',
    disclaimer_text: 'PolyPharm-Twin ist eine Simulationsplattform für Forschungs- und Bildungszwecke.',
  },

  ar: {
    nav_dashboard: 'لوحة التحكم',
    nav_medicines: 'مكتبة الأدوية',
    nav_simulation: 'منصة المحاكاة',
    nav_knowledge_graph: 'رسم المعرفة البيولوجية',
    nav_enzymes: 'مراقبة الإنزيمات',
    nav_adr_xai: 'مخاطر التفاعلات العكسية والذكاء الشارح',
    nav_ai_assistant: 'المساعد الذكي',
    nav_research: 'وضع البحث العلمي',
    nav_reports: 'التقرير السريري',

    status_live: 'محاكاة حية',
    status_ai_active: 'محرك الذكاء نشط',
    status_cached: 'الأدوية المحملة',
    status_online: 'متصل',
    status_offline: 'وضع غير متصل',
    report_button: 'تحميل التقرير',

    wb_title: 'منصة محاكاة تعدد الأدوية والتفاعلات الدوائية',
    wb_subtitle: 'نمذجة التنافس الإنزيمي وتأثير الحركية الدوائية خلال 48 ساعة.',
    wb_compare_toggle: 'مقارنة الأنظمة الدوائية',
    wb_compare_side_by_side: 'مخططات المقارنة جنبًا إلى جنب',
    wb_compare_overlay: 'مقارنة متراكبة',
    wb_save_baseline: 'حفظ كنظام أساسي (النظام أ)',
    wb_baseline_saved: 'تم حفظ النظام الأساسي أ بنجاح',
    wb_baseline_badge: 'النظام أ (الأساسي)',
    wb_modified_badge: 'النظام ب (المعدل)',
    wb_clear_baseline: 'مسح النظام الأساسي',
    wb_restore_baseline: 'استعادة النظام الأساسي',
    wb_swap_regimens: 'تبديل أ وب',
    wb_active_regimen: 'الأدوية النشطة',
    wb_clear_regimen: 'مسح الكل',
    wb_presets_title: 'تركيبات دوائية نموذجية',
    wb_patient_twin: 'الخصائص الجينية والفسيولوجية للمريض الافتراضي',
    wb_delta_insights: 'الفروق الحركية الدوائية والسلامة (أ مقابل ب)',
    wb_peak_conc_delta: 'فرق التركيز الأقصى (ΔCmax)',
    wb_cyp_recovery: 'نسبة تعافي إنزيمات CYP',
    wb_adr_reduction: 'انخفاض خطر الآثار العكسية',
    wb_add_medicine: '+ إضافة دواء من المكتبة...',
    wb_no_drugs: 'لا توجد أدوية نشطة حاليًا.',

    pk_title: 'منحنيات الحركية الدوائية والاستقلاب',
    pk_concentration: 'التركيز في البلازما C(t)',
    pk_enzymes: 'نشاط الإنزيمات %',
    pk_adr_risk: 'احتمالية التفاعلات العكسية',
    time_scrubber: 'مؤشر الوقت',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    reset: 'إعادة ضبط',
    speed: 'السرعة',

    chat_title: 'مساعد PolyPharm الذكي',
    chat_new: 'محادثة جديدة',
    chat_placeholder: 'اسأل عن التفاعلات الدوائية، تثبيط الإنزيمات، أو قارن الأنظمة...',
    chat_send: 'إرسال',
    chat_listening: 'يستمع الآن... تحدث',
    chat_speaking: 'يتحدث الآن...',
    chat_listen: 'استمع',
    chat_stop_listen: 'إيقاف',
    chat_suggestions_label: 'أسئلة مقترحة',
    chat_copied: 'تم النسخ!',
    chat_language_select: 'لغة المحادثة',

    disclaimer_badge: 'إخلاء مسؤولية البحث السريري',
    disclaimer_text: 'PolyPharm-Twin منصة محاكاة للأغراض البحثية والتعليمية فقط وليست نظام تشخيص طبي مستقل.',
  },

  zh: {
    nav_dashboard: '控制面板',
    nav_medicines: '药品知识库',
    nav_simulation: '多药模拟工作台',
    nav_knowledge_graph: '生物医学知识图谱',
    nav_enzymes: 'CYP代谢酶监测',
    nav_adr_xai: '不良反应风险与可解释性',
    nav_ai_assistant: 'AI 临床助手',
    nav_research: '科研消融模式',
    nav_reports: '临床报告',

    status_live: '实时模拟中',
    status_ai_active: 'AI 引擎已启动',
    status_cached: '药物已缓存',
    status_online: '在线',
    status_offline: '离线模式',
    report_button: '导出临床报告',

    wb_title: '多药联用动力学与不良反应模拟工作台',
    wb_subtitle: '构建多药方案，模拟CYP竞争性代谢抑制与48小时体内药物浓度曲线。',
    wb_compare_toggle: '对比用药方案',
    wb_compare_side_by_side: '并排时序图对比',
    wb_compare_overlay: '曲线重叠对比',
    wb_save_baseline: '保存为基准方案 (方案 A)',
    wb_baseline_saved: '基准方案 A 已保存',
    wb_baseline_badge: '方案 A (基准方案)',
    wb_modified_badge: '方案 B (调整/候选方案)',
    wb_clear_baseline: '清除基准',
    wb_restore_baseline: '恢复基准为当前方案',
    wb_swap_regimens: '互换方案 A 与 B',
    wb_active_regimen: '当前联合用药方案',
    wb_clear_regimen: '清空方案',
    wb_presets_title: '经典多药联用预设',
    wb_patient_twin: '虚拟患者数字孪生体质与药物基因组',
    wb_delta_insights: '药代动力学与安全性差异分析 (A 对比 B)',
    wb_peak_conc_delta: '峰值血药浓度差异 (ΔCmax)',
    wb_cyp_recovery: 'CYP 代谢酶活性恢复度',
    wb_adr_reduction: '严重 ADR 风险降幅',
    wb_add_medicine: '+ 从药品库添加药物...',
    wb_no_drugs: '当前方案未添加药物，请在上方添加或选择预设。',

    pk_title: '动态药代动力学 (PK) 与代谢转化曲线',
    pk_concentration: '血浆药物浓度 C(t)',
    pk_enzymes: 'CYP 代谢酶通量 %',
    pk_adr_risk: 'ADR 发生概率',
    time_scrubber: '时间轴控制器',
    play: '播放',
    pause: '暂停',
    reset: '重置',
    speed: '倍速',

    chat_title: 'PolyPharm AI 助手',
    chat_new: '新建对话',
    chat_placeholder: '询问药物相互作用、CYP 酶抑制、ADR 风险或方案对比...',
    chat_send: '发送',
    chat_listening: '正在倾听... 请说话',
    chat_speaking: '正在朗读回答...',
    chat_listen: '朗读',
    chat_stop_listen: '停止',
    chat_suggestions_label: '推荐提问',
    chat_copied: '已复制到剪贴板！',
    chat_language_select: '对话语言',

    disclaimer_badge: '临床科研免责声明',
    disclaimer_text: 'PolyPharm-Twin 为科研与辅助决策模拟系统，不可直接替代独立临床诊断。',
  },

  ja: {
    nav_dashboard: 'ダッシュボード',
    nav_medicines: '医薬品ライブラリ',
    nav_simulation: 'シミュレーションワークベンチ',
    nav_knowledge_graph: '知識グラフ',
    nav_enzymes: '代謝酵素モニター',
    nav_adr_xai: 'ADRリスク & XAI',
    nav_ai_assistant: 'AIアシスタント',
    nav_research: '研究モード',
    nav_reports: '臨床レポート',

    status_live: 'リアルタイム実行中',
    status_ai_active: 'AIエンジン稼働中',
    status_cached: '薬剤キャッシュ済',
    status_online: 'オンライン',
    status_offline: 'オフラインモード',
    report_button: '臨床レポート出力',

    wb_title: '多剤併用薬物動態シミュレーションワークベンチ',
    wb_subtitle: '複数薬物の併用、CYP酵素阻害競合、48時間薬物動態をリアルタイム解析。',
    wb_compare_toggle: '処方レジメンの比較',
    wb_compare_side_by_side: '並列時系列比較チャート',
    wb_compare_overlay: '曲線オーバーレイ比較',
    wb_save_baseline: 'ベースラインとして保存 (レジメン A)',
    wb_baseline_saved: 'ベースライン レジメン A を保存しました',
    wb_baseline_badge: 'レジメン A (ベースライン)',
    wb_modified_badge: 'レジメン B (変更・候補レジメン)',
    wb_clear_baseline: 'ベースライン消去',
    wb_restore_baseline: 'ベースラインを復元',
    wb_swap_regimens: 'レジメン A と B を入れ替え',
    wb_active_regimen: '現在併用中の薬剤',
    wb_clear_regimen: '処方をクリア',
    wb_presets_title: '主要な多剤併用相互作用プリセット',
    wb_patient_twin: '仮想患者ツインの身体特性および薬理遺伝学',
    wb_delta_insights: '薬物動態・安全性デルタ比較 (A vs B)',
    wb_peak_conc_delta: '最高血中濃度変化 (ΔCmax)',
    wb_cyp_recovery: 'CYP酵素活性の回復率',
    wb_adr_reduction: '最大ADRリスク低下量',
    wb_add_medicine: '+ ライブラリから医薬品を追加...',
    wb_no_drugs: '併用薬剤が選択されていません。上から追加してください。',

    pk_title: '動的薬物動態 (PK) および代謝曲線',
    pk_concentration: '血漿中薬物濃度 C(t)',
    pk_enzymes: 'CYP酵素活性 %',
    pk_adr_risk: '有害事象 (ADR) リスク確率',
    time_scrubber: 'タイムラインシーク',
    play: '再生',
    pause: '一時停止',
    reset: 'リセット',
    speed: '再生速度',

    chat_title: 'PolyPharm AIアシスタント',
    chat_new: '新規チャット',
    chat_placeholder: '薬物相互作用、CYP阻害、ADRリスクまたは処方比較について質問...',
    chat_send: '送信',
    chat_listening: '音声を認識中... お話しください',
    chat_speaking: '回答を音声出力中...',
    chat_listen: '音声再生',
    chat_stop_listen: '停止',
    chat_suggestions_label: 'おすすめの質問',
    chat_copied: 'クリップボードにコピーしました！',
    chat_language_select: '会話言語',

    disclaimer_badge: '臨床研究免責事項',
    disclaimer_text: 'PolyPharm-Twinは研究・教育支援用のシミュレーション環境です。独立した医療診断装置ではありません。',
  },

  ko: {
    nav_dashboard: '대시보드',
    nav_medicines: '의약품 라이브러리',
    nav_simulation: '시뮬레이션 워크벤치',
    nav_knowledge_graph: '지식 그래프',
    nav_enzymes: 'CYP 효소 모니터',
    nav_adr_xai: '부작용 위험 & XAI',
    nav_ai_assistant: 'AI 어시스턴트',
    nav_research: '연구 모드',
    nav_reports: '임상 리포트',

    status_live: '실시간 시뮬레이션',
    status_ai_active: 'AI 엔진 활성',
    status_cached: '약물 캐시됨',
    status_online: '온라인',
    status_offline: '오프라인 모드',
    report_button: '임상 리포트',

    wb_title: '다제병용 약동학 시뮬레이션 워크벤치',
    wb_subtitle: '복합 약물 처방을 구성하고 CYP 효소 상호작용 및 48시간 약동학을 모델링합니다.',
    wb_compare_toggle: '처방 비교 (Compare Regimens)',
    wb_compare_side_by_side: '병렬 시계열 비교 차트',
    wb_compare_overlay: '오버레이 곡선 비교',
    wb_save_baseline: '기준 처방으로 저장 (처방 A)',
    wb_baseline_saved: '기준 처방 A가 저장되었습니다',
    wb_baseline_badge: '처방 A (기준 처방)',
    wb_modified_badge: '처방 B (수정/후보 처방)',
    wb_clear_baseline: '기준 처방 초기화',
    wb_restore_baseline: '기준 처방으로 복원',
    wb_swap_regimens: '처방 A와 B 교환',
    wb_active_regimen: '활성 처방 약물',
    wb_clear_regimen: '처방 비우기',
    wb_presets_title: '표준 다제약물 상호작용 프리셋',
    wb_patient_twin: '가상 환자 트윈 생체 정보 및 약물유전체',
    wb_delta_insights: '약동학 및 안전성 비교 분석 (A vs B)',
    wb_peak_conc_delta: '최고 농도 변화 (ΔCmax)',
    wb_cyp_recovery: 'CYP 효소 활성 회복도',
    wb_adr_reduction: '부작용 위험 감소율',
    wb_add_medicine: '+ 라이브러리에서 약물 추가...',
    wb_no_drugs: '현재 처방에 약물이 없습니다.',

    pk_title: '동적 약동학(PK) 및 대사 곡선',
    pk_concentration: '혈중 농도 C(t)',
    pk_enzymes: 'CYP 효소 활성도 %',
    pk_adr_risk: '부작용 발생 확률',
    time_scrubber: '시간 조절',
    play: '재생',
    pause: '일시정지',
    reset: '초기화',
    speed: '배속',

    chat_title: 'PolyPharm AI 어시스턴트',
    chat_new: '새 대화',
    chat_placeholder: '약물 상호작용, CYP 대사 효소 억제, 부작용 위험 또는 처방 비교 문의...',
    chat_send: '전송',
    chat_listening: '듣고 있습니다... 말씀하세요',
    chat_speaking: '음성 출력 중...',
    chat_listen: '듣기',
    chat_stop_listen: '정지',
    chat_suggestions_label: '추천 질문',
    chat_copied: '복사되었습니다!',
    chat_language_select: '대화 언어',

    disclaimer_badge: '임상 연구 면책 조항',
    disclaimer_text: 'PolyPharm-Twin은 연구 및 교육 목적의 인실리코 시뮬레이션 시스템입니다.',
  },

  // Fallback defaults for remaining languages (Marathi, Gujarati, Punjabi, Urdu)
  mr: {
    nav_dashboard: 'डॅशबोर्ड',
    nav_medicines: 'औषध ग्रंथालय',
    nav_simulation: 'सिम्युलेशन वर्कबेंच',
    nav_knowledge_graph: 'नॉलेज ग्राफ',
    nav_enzymes: 'एन्झाईम मॉनिटर',
    nav_adr_xai: 'ADR जोखीम & XAI',
    nav_ai_assistant: 'AI सहाय्यक',
    nav_research: 'संशोधन मोड',
    nav_reports: 'क्लिनिकल अहवाल',

    status_live: 'थेट सिम्युलेशन',
    status_ai_active: 'AI इंजिन सक्रिय',
    status_cached: 'औषधे कॅश केली',
    status_online: 'ऑनलाइन',
    status_offline: 'ऑफलाइन मोड',
    report_button: 'अहवाल डाउनलोड करा',

    wb_title: 'पॉलीफार्मसी सिम्युलेशन वर्कबेंच',
    wb_subtitle: 'अनेक औषधांचे संयोजन आणि 48-तासांच्या फार्माकोकिनेटिक्सचे मॉडेल तयार करा.',
    wb_compare_toggle: 'औषध पथ्ये तुलना करा',
    wb_compare_side_by_side: 'शेजारी-शेजारी तक्ते',
    wb_compare_overlay: 'ओव्हरले तुलना',
    wb_save_baseline: 'बेसलाइन म्हणून जतन करा (पथ्य A)',
    wb_baseline_saved: 'बेसलाइन पथ्य A जतन केले',
    wb_baseline_badge: 'पथ्य A (बेसलाइन)',
    wb_modified_badge: 'पथ्य B (बदललेले पथ्य)',
    wb_clear_baseline: 'बेसलाइन हटवा',
    wb_restore_baseline: 'बेसलाइन पुनर्संचयित करा',
    wb_swap_regimens: 'A आणि B बदला',
    wb_active_regimen: 'सक्रिय औषधे',
    wb_clear_regimen: 'सर्व काढा',
    wb_presets_title: 'मानक पॉलीफार्मसी प्रीसेट',
    wb_patient_twin: 'व्हर्च्युअल पेशंट डेमोग्राफिक्स आणि फार्माकोजेनॉमिक्स',
    wb_delta_insights: 'फार्माकोकिनेटिक फरक (A विरुद्ध B)',
    wb_peak_conc_delta: 'शिखर एकाग्रता फरक (ΔCmax)',
    wb_cyp_recovery: 'CYP एन्झाईम पुनर्प्राप्ती',
    wb_adr_reduction: 'ADR जोखीम घट',
    wb_add_medicine: '+ औषध जोडा...',
    wb_no_drugs: 'औषध निवडलेले नाही.',

    pk_title: 'फार्माकोकिनेटिक वक्र',
    pk_concentration: 'एकाग्रता C(t)',
    pk_enzymes: 'CYP एन्झाईम %',
    pk_adr_risk: 'ADR जोखीम संभाव्यता',
    time_scrubber: 'टाइमलाइन',
    play: 'सुरू करा',
    pause: 'थांबवा',
    reset: 'रीसेट',
    speed: 'गती',

    chat_title: 'PolyPharm AI सहाय्यक',
    chat_new: 'नवीन संभाषण',
    chat_placeholder: 'औषध परस्परसंवादाबद्दल विचारा...',
    chat_send: 'पाठवा',
    chat_listening: 'ऐकत आहे... बोला',
    chat_speaking: 'बोलत आहे...',
    chat_listen: 'ऐका',
    chat_stop_listen: 'थांबवा',
    chat_suggestions_label: 'सुचवलेले प्रश्न',
    chat_copied: 'कॉपी केले!',
    chat_language_select: 'संभाषणाची भाषा',

    disclaimer_badge: 'क्लिनिकल संशोधन अस्वीकरण',
    disclaimer_text: 'PolyPharm-Twin संशोधन आणि शैक्षणिक हेतूंसाठी सिम्युलेशन प्लॅटफॉर्म आहे.',
  },

  gu: {
    nav_dashboard: 'ડેશબોર્ડ',
    nav_medicines: 'દવા પુસ્તકાલય',
    nav_simulation: 'સિમ્યુલેશન વર્કબેન્ચ',
    nav_knowledge_graph: 'નોલેજ ગ્રાફ',
    nav_enzymes: 'એન્ઝાઇમ મોનિટર',
    nav_adr_xai: 'ADR જોખમ અને XAI',
    nav_ai_assistant: 'AI સહાયક',
    nav_research: 'સંશોધન મોડ',
    nav_reports: 'ક્લિનિકલ રિપોર્ટ',

    status_live: 'લાઇવ સિમ્યુલેશન',
    status_ai_active: 'AI એન્જિન સક્રિય',
    status_cached: 'દવાઓ કેશ થઈ',
    status_online: 'ઓનલાઇન',
    status_offline: 'ઓફલાઇન મોડ',
    report_button: 'રિપોર્ટ ડાઉનલોડ',

    wb_title: 'પોલીફાર્મસી સિમ્યુલેશન વર્કબેન્ચ',
    wb_subtitle: 'બહુવિધ દવાઓ અને 48-કલાકના ફાર્માકોકાઇનેટિક્સનું સિમ્યુલેશન કરો.',
    wb_compare_toggle: 'દવા પદ્ધતિઓની સરખામણી કરો',
    wb_compare_side_by_side: 'સમાંતર ચાર્ટ્સ',
    wb_compare_overlay: 'ઓવરલે સરખામણી',
    wb_save_baseline: 'બેઝલાઇન તરીકે સાચવો (પદ્ધતિ A)',
    wb_baseline_saved: 'બેઝલાઇન પદ્ધતિ A સાચવી',
    wb_baseline_badge: 'પદ્ધતિ A (બેઝલાઇન)',
    wb_modified_badge: 'પદ્ધતિ B (સંશોધિત પદ્ધતિ)',
    wb_clear_baseline: 'બેઝલાઇન સાફ કરો',
    wb_restore_baseline: 'બેઝલાઇન પુનઃસ્થાપિત કરો',
    wb_swap_regimens: 'A અને B અદલાબદલી કરો',
    wb_active_regimen: 'સક્રિય દવાઓ',
    wb_clear_regimen: 'બધું સાફ કરો',
    wb_presets_title: 'સ્ટાન્ડર્ડ પ્રીસેટ્સ',
    wb_patient_twin: 'વર્ચ્યુઅલ દર્દી ફાર્માકોજેનોમિક્સ',
    wb_delta_insights: 'ફાર્માકોકાઇનેટિક તફાવતો (A વિ B)',
    wb_peak_conc_delta: 'પીક સાંદ્રતા તફાવત (ΔCmax)',
    wb_cyp_recovery: 'CYP એન્ઝાઇમ પુનઃપ્રાપ્તિ',
    wb_adr_reduction: 'ADR જોખમ ઘટાડો',
    wb_add_medicine: '+ દવા ઉમેરો...',
    wb_no_drugs: 'કોઈ દવા પસંદ કરેલ નથી.',

    pk_title: 'ફાર્માકોકાઇનેટિક કર્વ્સ',
    pk_concentration: 'સાંદ્રતા C(t)',
    pk_enzymes: 'CYP એન્ઝાઇમ %',
    pk_adr_risk: 'ADR જોખમ સંભાવના',
    time_scrubber: 'સમયરેખા',
    play: 'શરૂ કરો',
    pause: 'વિરામ',
    reset: 'રીસેટ',
    speed: 'ઝડપ',

    chat_title: 'PolyPharm AI સહાયક',
    chat_new: 'નવી વાતચીત',
    chat_placeholder: 'દવાઓ વચ્ચેની ક્રિયાપ્રતિક્રિયા વિશે પૂછો...',
    chat_send: 'મોકલો',
    chat_listening: 'સાંભળી રહ્યું છે... બોલો',
    chat_speaking: 'બોલી રહ્યું છે...',
    chat_listen: 'સાંભળો',
    chat_stop_listen: 'બંધ કરો',
    chat_suggestions_label: 'સૂચવેલા પ્રશ્નો',
    chat_copied: 'કૉપિ થઈ ગયું!',
    chat_language_select: 'વાતચીતની ભાષા',

    disclaimer_badge: 'ક્લિનિકલ સંશોધન અસ્વીકરણ',
    disclaimer_text: 'PolyPharm-Twin સંશોધન અને શૈક્ષણિક હેતુઓ માટે એક સિમ્યુલેશન પ્લેટફોર્મ છે.',
  },

  pa: {
    nav_dashboard: 'ਡੈਸ਼ਬੋਰਡ',
    nav_medicines: 'ਦਵਾਈ ਲਾਇਬ੍ਰੇਰੀ',
    nav_simulation: 'ਸਿਮੂਲੇਸ਼ਨ ਵਰਕਬੈਂਚ',
    nav_knowledge_graph: 'ਨਾਲੇਜ ਗ੍ਰਾਫ',
    nav_enzymes: 'ਐਨਜ਼ਾਈਮ ਮਾਨੀਟਰ',
    nav_adr_xai: 'ADR ਜੋਖਮ & XAI',
    nav_ai_assistant: 'AI ਸਹਾਇਕ',
    nav_research: 'ਖੋਜ ਮੋਡ',
    nav_reports: 'ਕਲੀਨਿਕਲ ਰਿਪੋਰਟ',

    status_live: 'ਲਾਈਵ ਸਿਮੂਲੇਸ਼ਨ',
    status_ai_active: 'AI ਇੰਜਨ ਸਰਗਰਮ',
    status_cached: 'ਦਵਾਈਆਂ ਕੈਸ਼ ਕੀਤੀਆਂ',
    status_online: 'ਆਨਲਾਈਨ',
    status_offline: 'ਆਫਲਾਈਨ ਮੋਡ',
    report_button: 'ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ',

    wb_title: 'ਪੋਲੀਫਾਰਮੇਸੀ ਸਿਮੂਲੇਸ਼ਨ ਵਰਕਬੈਂਚ',
    wb_subtitle: 'ਕਈ ਦਵਾਈਆਂ ਦੇ ਪ੍ਰਭਾਵ ਅਤੇ 48 ਘੰਟਿਆਂ ਦੇ ਫਾਰਮਾਕੋਕਾਇਨੇਟਿਕਸ ਦਾ ਅਧਿਐਨ ਕਰੋ।',
    wb_compare_toggle: 'ਦਵਾਈਆਂ ਦੇ ਸੁਮੇਲ ਦੀ ਤੁਲਨਾ ਕਰੋ',
    wb_compare_side_by_side: 'ਨਾਲ-ਨਾਲ ਤੁਲਨਾ ਚਾਰਟ',
    wb_compare_overlay: 'ਓਵਰਲੇਅ ਤੁਲਨਾ',
    wb_save_baseline: 'ਬੇਸਲਾਈਨ ਵਜੋਂ ਸੁਰੱਖਿਅਤ ਕਰੋ (ਸੁਮੇਲ A)',
    wb_baseline_saved: 'ਬੇਸਲਾਈਨ ਸੁਮੇਲ A ਸੁਰੱਖਿਅਤ ਹੋਇਆ',
    wb_baseline_badge: 'ਸੁਮੇਲ A (ਬੇਸਲਾਈਨ)',
    wb_modified_badge: 'ਸੁਮੇਲ B (ਸੋਧਿਆ ਸੁਮੇਲ)',
    wb_clear_baseline: 'ਬੇਸਲਾਈਨ ਹਟਾਓ',
    wb_restore_baseline: 'ਬੇਸਲਾਈਨ ਮੁੜ ਲਾਗੂ ਕਰੋ',
    wb_swap_regimens: 'A ਅਤੇ B ਬਦਲੋ',
    wb_active_regimen: 'ਸਰਗਰਮ ਦਵਾਈਆਂ',
    wb_clear_regimen: 'ਸਭ ਹਟਾਓ',
    wb_presets_title: 'ਸਟੈਂਡਰਡ ਪ੍ਰੀਸੈਟਸ',
    wb_patient_twin: 'ਵਰਚੁਅਲ ਮਰੀਜ਼ ਫਾਰਮਾਕੋਜੀਨੋਮਿਕਸ',
    wb_delta_insights: 'ਫਾਰਮਾਕੋਕਾਇਨੇਟਿਕ ਅੰਤਰ (A ਬਨਾਮ B)',
    wb_peak_conc_delta: 'ਉੱਚ ਇਕਾਗਰਤਾ ਅੰਤਰ (ΔCmax)',
    wb_cyp_recovery: 'CYP ਐਨਜ਼ਾਈਮ ਰਿਕਵਰੀ',
    wb_adr_reduction: 'ADR ਜੋਖਮ ਘਟਾਓ',
    wb_add_medicine: '+ ਦਵਾਈ ਸ਼ਾਮਲ ਕਰੋ...',
    wb_no_drugs: 'ਕੋਈ ਦਵਾਈ ਚੁਣੀ ਨਹੀਂ ਗਈ।',

    pk_title: 'ਫਾਰਮਾਕੋਕਾਇਨੇਟਿਕ ਕਰਵ',
    pk_concentration: 'ਇਕਾਗਰਤਾ C(t)',
    pk_enzymes: 'CYP ਐਨਜ਼ਾਈਮ %',
    pk_adr_risk: 'ADR ਜੋਖਮ ਸੰਭਾਵਨਾ',
    time_scrubber: 'ਸਮਾਂਰੇਖਾ',
    play: 'ਚਲਾਓ',
    pause: 'ਰੋਕੋ',
    reset: 'ਰੀਸੈਟ',
    speed: 'ਗਤੀ',

    chat_title: 'PolyPharm AI ਸਹਾਇਕ',
    chat_new: 'ਨਵੀਂ ਗੱਲਬਾਤ',
    chat_placeholder: 'ਦਵਾਈਆਂ ਦੇ ਪਰਸਪਰ ਪ੍ਰਭਾਵ ਬਾਰੇ ਪੁੱਛੋ...',
    chat_send: 'ਭੇਜੋ',
    chat_listening: 'ਸੁਣ ਰਿਹਾ ਹੈ... ਬੋਲੋ',
    chat_speaking: 'ਬੋਲ ਰਿਹਾ ਹੈ...',
    chat_listen: 'ਸੁਣੋ',
    chat_stop_listen: 'ਰੋਕੋ',
    chat_suggestions_label: 'ਸੁਝਾਏ ਗਏ ਸਵਾਲ',
    chat_copied: 'ਕਾਪੀ ਕੀਤਾ ਗਿਆ!',
    chat_language_select: 'ਗੱਲਬਾਤ ਦੀ ਭਾਸ਼ਾ',

    disclaimer_badge: 'ਕਲੀਨਿਕਲ ਖੋਜ ਬੇਦਾਅਵਾ',
    disclaimer_text: 'PolyPharm-Twin ਸਿਰਫ਼ ਖੋਜ ਅਤੇ ਵਿਦਿਅਕ ਉਦੇਸ਼ਾਂ ਲਈ ਇੱਕ ਸਿਮੂਲੇਸ਼ਨ ਪਲੇਟਫਾਰਮ ਹੈ।',
  },

  ur: {
    nav_dashboard: 'ڈیش بورڈ',
    nav_medicines: 'ادویات کی لائبریری',
    nav_simulation: 'سمولیشن ورک بینچ',
    nav_knowledge_graph: 'نالج گراف',
    nav_enzymes: 'انزائم مانیٹر',
    nav_adr_xai: 'منفی اثرات (ADR) اور XAI',
    nav_ai_assistant: 'AI اسسٹنٹ',
    nav_research: 'تحقیقی موڈ',
    nav_reports: 'طبی رپورٹ',

    status_live: 'براہ راست سمولیشن',
    status_ai_active: 'AI انجن فعال',
    status_cached: 'ادویات محفوظ ہیں',
    status_online: 'آن لائن',
    status_offline: 'آف لائن موڈ',
    report_button: 'رپورٹ ڈاؤن لوڈ',

    wb_title: 'کثیر ادویاتی سمولیشن ورک بینچ',
    wb_subtitle: 'مختلف ادویات کے ملاپ اور 48 گھنٹے کی فارماکوکائنیٹکس کا تجزیہ کریں۔',
    wb_compare_toggle: 'ادویاتی طریقہ کار کا موازنہ',
    wb_compare_side_by_side: 'پہلو بہ پہلو چارٹس',
    wb_compare_overlay: 'اوورلے موازنہ',
    wb_save_baseline: 'بنیادی طور پر محفوظ کریں (طریقہ کار A)',
    wb_baseline_saved: 'بنیادی طریقہ کار A محفوظ کر لیا گیا',
    wb_baseline_badge: 'طریقہ کار A (بنیادی)',
    wb_modified_badge: 'طریقہ کار B (تبدیل شدہ)',
    wb_clear_baseline: 'بنیاد ختم کریں',
    wb_restore_baseline: 'بنیادی طریقہ کار بحال کریں',
    wb_swap_regimens: 'A اور B کو تبدیل کریں',
    wb_active_regimen: 'فعال ادویات',
    wb_clear_regimen: 'تمام ختم کریں',
    wb_presets_title: 'معیاری مجموعے',
    wb_patient_twin: 'ورچوئل مریض کے جینیاتی و جسمانی کوائف',
    wb_delta_insights: 'حركیات ادویات کا موازنہ (A بمقابلہ B)',
    wb_peak_conc_delta: 'انتہائی ارتکاز کا فرق (ΔCmax)',
    wb_cyp_recovery: 'CYP انزائم کی بحالی',
    wb_adr_reduction: 'منفی اثرات کے خطرے میں کمی',
    wb_add_medicine: '+ لائبریری سے دوا شامل کریں...',
    wb_no_drugs: 'کوئی دوا منتخب نہیں کی گئی۔',

    pk_title: 'فارماکوکائنیٹک اور میٹابولک کروز',
    pk_concentration: 'ارتکاز C(t)',
    pk_enzymes: 'CYP انزائم %',
    pk_adr_risk: 'ADR خطرے کا امکان',
    time_scrubber: 'ٹائم لائن',
    play: 'شروع',
    pause: 'وقفہ',
    reset: 'دوبارہ ترتیب دیں',
    speed: 'رفتار',

    chat_title: 'PolyPharm AI اسسٹنٹ',
    chat_new: 'نئی گفتگو',
    chat_placeholder: 'ادویات کے باہمی اثرات، انزائمز یا خطرات کے بارے میں پوچھیں...',
    chat_send: 'ارسال',
    chat_listening: 'سن رہا ہے... بولیں',
    chat_speaking: 'بول رہا ہے...',
    chat_listen: 'سنیں',
    chat_stop_listen: 'روکیں',
    chat_suggestions_label: 'تجویز کردہ سوالات',
    chat_copied: 'کاپی ہو گیا!',
    chat_language_select: 'گفتگو کی زبان',

    disclaimer_badge: 'طبی تحقیق کی وضاحت',
    disclaimer_text: 'PolyPharm-Twin صرف تحقیق اور تعلیمی مقاصد کے لیے سمولیشن پلیٹ فارم ہے۔',
  },
};

/**
 * Get translation for key, falling back safely to English
 */
export function getTranslation(langCode: string = 'en'): Translations {
  const base = TRANSLATIONS['en'] as Translations;
  const target = TRANSLATIONS[langCode];
  if (!target) return base;
  return { ...base, ...target } as Translations;
}
