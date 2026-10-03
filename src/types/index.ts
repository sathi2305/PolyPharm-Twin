/**
 * PolyPharm-Twin Core Type Definitions
 * Biomedical Digital-Twin, ADME Simulation & Multi-Drug Pharmacovigilance
 */

export type DrugClass =
  | 'Cardiovascular / Anticoagulant'
  | 'Cardiovascular / Statin'
  | 'Cardiovascular / Antihypertensive'
  | 'Cardiovascular / Antiarrhythmic'
  | 'CNS / Antidepressant (SSRI/SNRI)'
  | 'CNS / Antipsychotic'
  | 'CNS / Anticonvulsant'
  | 'CNS / Anxiolytic & Sedative'
  | 'Antimicrobial / Antibacterial'
  | 'Antimicrobial / Antifungal'
  | 'Antimicrobial / Antiviral'
  | 'Analgesic / NSAID'
  | 'Analgesic / Opioid'
  | 'Oncology / Chemotherapy'
  | 'Immunosuppressant'
  | 'Endocrine / Antidiabetic'
  | 'Endocrine / Corticosteroid'
  | 'Respiratory / Bronchodilator'
  | 'Gastrointestinal / PPI'
  | 'Other';

export interface AdmeParameters {
  bioavailability: number; // F % (0 - 100)
  proteinBinding: number; // % (0 - 100)
  halfLifeHours: number; // hours
  clearanceLitersPerHour: number; // L/h
  volumeDistributionLitersPerKg: number; // L/kg
  absorptionRateKa: number; // 1/h
}

export interface EnzymeRole {
  name: string; // e.g. 'CYP3A4', 'CYP2D6', 'CYP2C9', 'CYP2C19', 'CYP1A2', 'UGT1A1'
  role: 'substrate' | 'inhibitor_strong' | 'inhibitor_moderate' | 'inhibitor_weak' | 'inducer';
  inhibitionConstantKiUm?: number; // micro-molar
  inductionFactor?: number; // e.g. 1.5 - 3.0
}

export interface Metabolite {
  name: string;
  formula: string;
  activity: 'active' | 'inactive' | 'toxic';
  formationPathway: string;
}

export interface KnownInteraction {
  partnerDrug: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'minor';
  mechanism: string;
  clinicalRisk: string;
}

export interface Medicine {
  id: string;
  genericName: string;
  brandNames: string[];
  drugClass: DrugClass;
  smiles: string;
  molecularFormula: string;
  molecularWeight: number; // g/mol
  mechanismOfAction: string;
  targetProteins: string[];
  enzymes: EnzymeRole[];
  metabolites: Metabolite[];
  adme: AdmeParameters;
  knownInteractions: KnownInteraction[];
  knownAdrs: string[];
  contraindications: string[];
  evidenceSource: string; // e.g. 'DrugBank 5.1 / TwoSIDES / FDA'
  lastUpdated: string;
  isCustom?: boolean;
  isFavorite?: boolean;
}

export interface EnzymeProfile {
  id: string;
  name: string;
  family: string;
  baselineActivity: number; // 100%
  currentActivity: number; // dynamically computed (0 - 300%)
  inhibitionPercent: number; // (0 - 100%)
  inductionPercent: number; // (0 - 300%)
  affectedDrugs: string[];
  affectedMetabolites: string[];
  interactionStatus: 'OPTIMAL' | 'MILD_INHIBITION' | 'MODERATE_INHIBITION' | 'CRITICAL_INHIBITION' | 'INDUCED';
  confidence: number;
  evidenceLevel: 'Verified Clinical' | 'In Vitro Kinetic' | 'Simulated Dynamic';
}

export type KnowledgeNodeType =
  | 'drug'
  | 'protein'
  | 'enzyme'
  | 'metabolite'
  | 'pathway'
  | 'adr'
  | 'disease'
  | 'patient_factor';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: KnowledgeNodeType;
  data: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relation:
    | 'inhibits'
    | 'induces'
    | 'metabolized_by'
    | 'produces'
    | 'targets'
    | 'interacts_with'
    | 'triggers_adr'
    | 'modulates_pathway';
  weight: number;
  confidence: number;
  evidence: string;
}

export interface BiomedicalGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface PkTimePoint {
  timeHours: number;
  concentrations: Record<string, number>; // drugId -> plasma concentration mg/L
  metaboliteConcentrations: Record<string, number>;
  enzymeActivities: Record<string, number>; // enzymeName -> %
  adrRiskScores: Record<string, number>; // adrCategory -> probability (0 - 1)
}

export interface AdrPrediction {
  id: string;
  label: string;
  organSystem: string;
  probability: number; // 0.0 - 1.0
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  confidence: number;
  relatedDrugs: string[];
  relatedEnzymes: string[];
  affectedPathways: string[];
  causalExplanation: string[];
  evidenceLevel: 'Model Prediction' | 'Clinical Dataset' | 'In Vitro Kinetic';
}

export interface ExplainabilityRecord {
  interactionTitle: string;
  severity: 'Critical' | 'Major' | 'High' | 'Moderate' | 'Minor';
  steps: {
    order: number;
    title: string;
    description: string;
    nodeInvolved: string;
    importanceScore: number; // 0.0 - 1.0
  }[];
  contributingNodes: { name: string; type: string; weight: number }[];
  attentionWeights: { pair: string; weight: number }[];
  supportingEvidence: string;
  therapeuticWindowWarning?: string;
}

export interface PatientContext {
  age: number;
  gender: 'female' | 'male' | 'other';
  weightKg: number;
  renalFunctionEgfr: number; // mL/min/1.73m2 (e.g. 90 normal, <30 severe)
  hepaticFunction: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  cyp2d6Genotype: 'normal_metabolizer' | 'poor_metabolizer' | 'ultra_rapid_metabolizer' | 'intermediate_metabolizer';
  cyp2c19Genotype: 'normal_metabolizer' | 'poor_metabolizer' | 'rapid_metabolizer' | 'intermediate_metabolizer';
  cyp2c9Genotype?: 'normal_metabolizer' | 'intermediate_metabolizer' | 'poor_metabolizer';
  slco1b1Genotype?: 'normal_function' | 'decreased_function' | 'poor_function';
  vkorc1Genotype?: 'normal_sensitivity' | 'high_warfarin_sensitivity';
  smokingStatus?: 'non_smoker' | 'smoker';
  serumAlbuminGDl?: number; // normal 3.5 - 5.0 g/dL
  clinicalNotes?: string;
  comorbidities?: string[];
}

export interface SimulationState {
  activeDrugIds: string[];
  simulationDurationHours: number; // default 48h
  currentTimeHours: number; // scrubber position
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, 5x, 10x
  patientContext: PatientContext;
  timeSeries: PkTimePoint[];
  liveEnzymes: EnzymeProfile[];
  predictedAdrs: AdrPrediction[];
  explanations: ExplainabilityRecord[];
  isOnline: boolean;
}

export type LlmReasoningMode =
  | 'clinical_reasoning'
  | 'concise_summary'
  | 'patient_friendly'
  | 'tdm_narrow_range'
  | 'pharmacogenomic_cpic'
  | 'deep_mechanistic_cascade';

export type LlmKnowledgeScope = 'focused_tdm' | 'standard_pk' | 'comprehensive_pgx' | 'deep_mechanistic';

export interface LlmTrainingProfile {
  id: string;
  name: string;
  badge: string;
  description: string;
  llmMode: LlmReasoningMode;
  temperature: number; // 0.1 to 1.0
  knowledgeScope: LlmKnowledgeScope;
  therapeuticVigilanceLevel: 'strict_nti' | 'moderate' | 'relaxed';
  thinkingBudget: 'minimal' | 'low' | 'medium' | 'high';
  customDirectives?: string;
  isPretrained?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: string;
  audioPlayed?: boolean;
  actionTriggered?: string;
  source?: 'gemini-3.8-flash' | 'offline-rule-engine' | 'local-fallback' | string;
  trainedRangeBadge?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  messages: ChatMessage[];
  contextDrugNames: string[];
}

export interface AblationModelResult {
  id: string;
  name: string;
  components: string[];
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  aucRoc: number;
  auprc: number;
  specificity: number;
  sensitivity: number;
  inferenceLatencyMs: number;
  trainingHours: number;
}

export interface RegimenBaseline {
  id: string;
  name: string;
  savedAt: string;
  drugs: Medicine[];
  patientContext: PatientContext;
  timeSeries: PkTimePoint[];
  liveEnzymes: EnzymeProfile[];
  predictions: AdrPrediction[];
}

export interface PatientProfilePreset {
  id: string;
  name: string;
  description: string;
  category?: 'geriatric' | 'pediatric' | 'hepatic' | 'renal' | 'pharmacogenomic' | 'oncology' | 'critical_care' | 'custom' | 'standard';
  patientContext: PatientContext;
  clinicalScenario?: string;
  recommendedRegimenIds?: string[];
  riskHighlights?: string[];
  tags?: string[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface ClinicalInteractionNote {
  id: string;
  pairKey: string; // Normalized sorted key: e.g. 'amiodarone--warfarin'
  drugAId: string;
  drugAName: string;
  drugBId: string;
  drugBName: string;
  note: string;
  recommendation?: string;
  riskLevel?: 'contraindicated' | 'major' | 'moderate' | 'minor' | 'safe';
  tags?: string[];
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SevereInteractionToastAlert {
  id: string;
  addedDrug: Medicine;
  regimenDrug: Medicine;
  severity: 'contraindicated' | 'major';
  title: string;
  headline: string;
  mechanism: string;
  clinicalRisk: string;
  recommendedAction?: string;
  suggestedAlternative?: string;
  evidenceSource?: string;
  timestamp: number;
}

export type StickyNoteColor = 'yellow' | 'teal' | 'rose' | 'purple' | 'blue';

export type AnnotationCategory =
  | 'dosing_strategy'
  | 'lab_monitoring'
  | 'contraindication'
  | 'pharmacist_memo'
  | 'patient_counseling'
  | 'general';

export interface RegimenAnnotation {
  id: string;
  regimenFingerprint: string; // e.g. sorted drug ids, or 'global'
  drugIds: string[];
  drugNames: string[];
  title: string;
  content: string;
  category: AnnotationCategory;
  color: StickyNoteColor;
  isPinned?: boolean;
  author?: string;
  createdAt: string;
  updatedAt: string;
}


