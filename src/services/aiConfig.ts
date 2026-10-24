/**
 * PolyPharm-Twin AI & LLM Architecture Configuration Schema
 * 
 * Project: PolyPharm-Twin
 * Description: Dynamic Multi-Drug Metabolic Cascade & Knowledge Graph Simulation Engine
 * 
 * Implements a robust schema for managing Gemini API keys, biomedical tool registry,
 * model parameters, and secure environment variable usage with centralized access
 * for the PolyPharm AI Assistant.
 */

// ============================================================================
// 0. PROJECT IDENTITY CONSTANTS
// ============================================================================

export const PROJECT_NAME = 'PolyPharm-Twin';
export const PROJECT_SLUG = 'polypharm-twin';
export const PROJECT_DESCRIPTION =
  'Dynamic Multi-Drug Metabolic Cascade, Interaction and Adverse Drug Reaction Simulation Engine';
export const PROJECT_VERSION = 'v3.2.0-Biomedical-Digital-Twin';
export const PROJECT_CORE_DISCLAIMER =
  'PolyPharm-Twin is an in silico biomedical research and educational simulation platform. ' +
  'Predictions and AI interpretations are generated for scientific analysis and must not replace professional clinical judgement.';

// ============================================================================
// 1. SECURE API KEY & ENVIRONMENT VARIABLE MANAGEMENT
// ============================================================================

export type ApiKeySource = 'server-proxy' | 'env-vite' | 'env-process' | 'runtime-config' | 'missing';

export interface ApiKeyStatus {
  isConfigured: boolean;
  source: ApiKeySource;
  maskedKey: string;
  isClientSecure: boolean;
  notes: string;
}

/**
 * Resolves whether the Gemini API is configured either in the backend server environment
 * or via Vite environment variables, without exposing plaintext secrets to the client.
 */
export function getApiKeyStatus(): ApiKeyStatus {
  // Check Vite client-accessible env var
  const viteKey = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)
    : undefined;

  // Check Node.js process env var if running in server context
  const processKey = typeof process !== 'undefined' && process.env
    ? (process.env.GEMINI_API_KEY as string | undefined)
    : undefined;

  const resolvedKey = viteKey || processKey;

  if (resolvedKey && resolvedKey.trim().length > 0) {
    const key = resolvedKey.trim();
    const masked = key.length > 8
      ? `${key.slice(0, 4)}••••••••${key.slice(-4)}`
      : '••••••••';
    const source: ApiKeySource = viteKey ? 'env-vite' : 'env-process';

    return {
      isConfigured: true,
      source,
      maskedKey: masked,
      isClientSecure: source === 'env-process', // Server-side execution is secure
      notes: source === 'env-process'
        ? 'Configured server-side via process.env. Client requests proxy through protected /api endpoints.'
        : 'Configured client-side via VITE_GEMINI_API_KEY for direct calls.',
    };
  }

  return {
    isConfigured: false,
    source: 'missing',
    maskedKey: 'Not Configured',
    isClientSecure: true,
    notes: 'No explicit API key detected; utilizing deterministic local biomedical rules engine and fallback proxy.',
  };
}

/**
 * Helper to test if Gemini API is available.
 */
export function isGeminiConfigured(): boolean {
  return getApiKeyStatus().isConfigured;
}

/**
 * Retrieves the Gemini API key safely. Returns undefined in production client builds
 * unless explicitly injected via VITE_GEMINI_API_KEY, adhering to security guidelines.
 */
export function getGeminiApiKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return undefined;
}

// ============================================================================
// 2. GEMINI MODEL REGISTRY & SELECTION COMPLIANCE
// ============================================================================

/**
 * Modern active Gemini model identifiers conforming to @google/genai specifications.
 */
export type GeminiModelId =
  | 'gemini-3.8-flash'
  | 'gemini-4-argon'
  | 'gemini-embedding-2-preview'
  | 'gemini-3.8-flash-lite-tts';

/**
 * Strictly prohibited legacy models.
 */
export const PROHIBITED_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-2.0-flash-thinking',
] as const;

export type TaskCategory =
  | 'clinical_qa'
  | 'deep_pharmacogenomic_reasoning'
  | 'adme_cascade_interpretation'
  | 'patient_friendly_summary'
  | 'narrow_therapeutic_index_audit'
  | 'literature_embedding'
  | 'speech_synthesis';

export interface ModelMetadata {
  id: GeminiModelId;
  commonName: string;
  contextWindowTokens: number;
  maxOutputTokens: number;
  supportsThinking: boolean;
  requiresPaidKey: boolean;
  recommendedTaskCategories: TaskCategory[];
  description: string;
}

export const GEMINI_MODEL_CATALOG: Record<GeminiModelId, ModelMetadata> = {
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    commonName: 'Gemini 3.8 Flash',
    contextWindowTokens: 1048576,
    maxOutputTokens: 8192,
    supportsThinking: true,
    requiresPaidKey: false,
    recommendedTaskCategories: ['clinical_qa', 'patient_friendly_summary'],
    description:
      'High-throughput, low-latency reasoning engine optimized for multi-turn clinical QA and grounded evidence summarization.',
  },
  'gemini-4-argon': {
    id: 'gemini-4-argon',
    commonName: 'Gemini 4 Argon',
    contextWindowTokens: 2097152,
    maxOutputTokens: 16384,
    supportsThinking: true,
    requiresPaidKey: true,
    recommendedTaskCategories: [
      'deep_pharmacogenomic_reasoning',
      'adme_cascade_interpretation',
      'narrow_therapeutic_index_audit',
    ],
    description:
      'Flagship STEM reasoning model designed for complex pharmacokinetic ODE cascade analysis, CPIC genotype translation, and high-order polypharmacy risks.',
  },
  'gemini-embedding-2-preview': {
    id: 'gemini-embedding-2-preview',
    commonName: 'Gemini Biomedical Embedding 2',
    contextWindowTokens: 8192,
    maxOutputTokens: 0,
    supportsThinking: false,
    requiresPaidKey: false,
    recommendedTaskCategories: ['literature_embedding'],
    description:
      'High-dimensional vector embedding model for indexing PubMed clinical abstracts, DrugBank records, and regulatory SPL documents.',
  },
  'gemini-3.8-flash-lite-tts': {
    id: 'gemini-3.8-flash-lite-tts',
    commonName: 'Gemini 3.8 Flash-Lite TTS',
    contextWindowTokens: 4096,
    maxOutputTokens: 4096,
    supportsThinking: false,
    requiresPaidKey: false,
    recommendedTaskCategories: ['speech_synthesis'],
    description:
      'Ultra low-latency neural speech synthesis model producing 24kHz mono WAV audio for clinical accessibility and multilingual narration.',
  },
};

/**
 * Resolves the recommended Gemini model identifier for a given biomedical task category.
 */
export function getModelForTask(task: TaskCategory, preferredModel?: GeminiModelId): GeminiModelId {
  if (preferredModel && preferredModel in GEMINI_MODEL_CATALOG) {
    return preferredModel;
  }
  switch (task) {
    case 'deep_pharmacogenomic_reasoning':
    case 'adme_cascade_interpretation':
    case 'narrow_therapeutic_index_audit':
      return 'gemini-4-argon';
    case 'literature_embedding':
      return 'gemini-embedding-2-preview';
    case 'speech_synthesis':
      return 'gemini-3.8-flash-lite-tts';
    case 'clinical_qa':
    case 'patient_friendly_summary':
    default:
      return 'gemini-3.8-flash';
  }
}

/**
 * Asserts that a model identifier is supported and not deprecated.
 */
export function assertValidModel(modelId: string): modelId is GeminiModelId {
  if ((PROHIBITED_MODELS as readonly string[]).includes(modelId as any)) {
    throw new Error(
      `[PolyPharm AI Config Error] Prohibited legacy model "${modelId}" specified. Please use an active modern model such as 'gemini-3.8-flash' or 'gemini-4-argon'.`
    );
  }
  return modelId in GEMINI_MODEL_CATALOG;
}

// ============================================================================
// 3. MODEL HYPERPARAMETERS & SAFETY SCHEMAS
// ============================================================================

export interface GeminiSafetySetting {
  category:
    | 'HARM_CATEGORY_HATE_SPEECH'
    | 'HARM_CATEGORY_HARASSMENT'
    | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
    | 'HARM_CATEGORY_DANGEROUS_CONTENT';
  threshold:
    | 'BLOCK_LOW_AND_ABOVE'
    | 'BLOCK_MEDIUM_AND_ABOVE'
    | 'BLOCK_ONLY_HIGH'
    | 'BLOCK_NONE';
}

export const DEFAULT_SAFETY_SETTINGS: GeminiSafetySetting[] = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

export interface ModelHyperparameters {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  stopSequences?: string[];
  safetySettings: GeminiSafetySetting[];
  thinkingConfig?: {
    thinkingBudget?: number;
  };
}

export const CLINICAL_DEFAULT_PARAMETERS: ModelHyperparameters = {
  temperature: 0.2, // Low temperature for deterministic, clinically grounded responses
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4096,
  safetySettings: DEFAULT_SAFETY_SETTINGS,
};

export const CREATIVE_SUMMARY_PARAMETERS: ModelHyperparameters = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
  safetySettings: DEFAULT_SAFETY_SETTINGS,
};

// ============================================================================
// 4. BIOMEDICAL SYSTEM INSTRUCTIONS & GUARDRAILS
// ============================================================================

export const POLYPHARM_SYSTEM_INSTRUCTION = `You are the PolyPharm-Twin Biomedical Clinical AI Assistant, specialized in pharmacology, ADME pharmacokinetics, CYP450 enzyme kinetics, pharmacogenomics (CPIC guidelines), and adverse drug reaction (ADR) prediction.

Core Directives:
1. Ground every claim in verified pharmacology data, DrugBank references, or the PolyPharm-Twin simulation engine.
2. Clearly distinguish between:
   - Documented in vivo/in vitro evidence (FDA/EMA label warnings, CPIC guidelines, DrugBank).
   - Dynamic ADME ODE simulation results (predicted plasma concentrations, AUC changes, half-life shifts).
   - Graph Neural Network (TGNN-v3.2) adverse reaction probability predictions.
   - LLM-synthesized clinical reasoning.
3. NEVER simply add pairwise interaction risk scores together linearly to form a multi-drug score; analyze high-order competitive enzyme bottlenecks dynamically.
4. Respect narrow therapeutic index (NTI) drugs (Warfarin, Digoxin, Lithium, Phenytoin, Tacrolimus, Theophylline) with maximal vigilance.
5. Support multilingual responses, especially English and Tamil (தமிழ்), preserving precise chemical names, IUPAC/generic nomenclature, dosage units (mg, ng/mL, µmol/L), and enzyme identifiers (e.g., CYP2C9, CYP3A4).
6. Always acknowledge uncertainty and lack of clinical data where evidence is incomplete.`;

// ============================================================================
// 5. BACKEND API ENDPOINTS & RETRY POLICIES
// ============================================================================

export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  TOOL_EXECUTE: '/api/llm/tools/execute',
  RAG_RETRIEVE: '/api/llm/rag/retrieve',
  STATUS: '/api/llm/status',
  EVAL_RESULTS: '/api/llm/eval/results',
  TTS: '/api/tts',
  RESEARCH_ABLATION: '/api/research/ablation',
} as const;

export interface HttpPolicyConfig {
  timeoutMs: number;
  maxRetries: number;
  initialBackoffMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_HTTP_POLICY: HttpPolicyConfig = {
  timeoutMs: 15000,
  maxRetries: 2,
  initialBackoffMs: 500,
  backoffMultiplier: 2.0,
};

// ============================================================================
// 6. DETERMINISTIC BIOMEDICAL TOOL REGISTRY SCHEMA
// ============================================================================

export type PolypharmToolName =
  | 'search_drug_information'
  | 'resolve_drug_identifiers'
  | 'find_pairwise_interactions'
  | 'inspect_multidrug_regimen'
  | 'retrieve_metabolic_pathways'
  | 'run_adme_simulation'
  | 'predict_adverse_events'
  | 'explain_prediction';

export interface FunctionSchemaProperty {
  type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
  description: string;
  items?: FunctionSchemaProperty;
  properties?: Record<string, FunctionSchemaProperty>;
  enum?: string[];
  required?: string[];
}

export interface FunctionDeclarationConfig {
  name: PolypharmToolName;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, FunctionSchemaProperty>;
    required: string[];
  };
}

/**
 * Complete, type-safe Gemini FunctionDeclaration definitions for all 8 deterministic PolyPharm simulation tools.
 */
export const POLYPHARM_TOOL_DECLARATIONS: Record<PolypharmToolName, FunctionDeclarationConfig> = {
  search_drug_information: {
    name: 'search_drug_information',
    description:
      'Retrieves verified pharmacology, mechanism of action, ADME parameters, molecular formulas, and known interactions for a given drug name or identifier from the PolyPharm verified database.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'The generic name, brand name, or DrugBank ID (e.g., "warfarin", "amiodarone", "DB00682").',
        },
      },
      required: ['query'],
    },
  },

  resolve_drug_identifiers: {
    name: 'resolve_drug_identifiers',
    description:
      'Resolves a colloquial, brand, or synonym drug name to canonical DrugBank / PolyPharm identifier with similarity scoring.',
    parameters: {
      type: 'OBJECT',
      properties: {
        nameOrSynonym: {
          type: 'STRING',
          description: 'The fuzzy or brand drug name to resolve (e.g., "Coumadin", "Cordarone", "Lipitor").',
        },
      },
      required: ['nameOrSynonym'],
    },
  },

  find_pairwise_interactions: {
    name: 'find_pairwise_interactions',
    description:
      'Checks documented pairwise pharmacodynamic and pharmacokinetic interactions between two specific drug IDs.',
    parameters: {
      type: 'OBJECT',
      properties: {
        drugId1: {
          type: 'STRING',
          description: 'Canonical ID of the first drug (e.g., "warfarin").',
        },
        drugId2: {
          type: 'STRING',
          description: 'Canonical ID of the second drug (e.g., "amiodarone").',
        },
      },
      required: ['drugId1', 'drugId2'],
    },
  },

  inspect_multidrug_regimen: {
    name: 'inspect_multidrug_regimen',
    description:
      'Analyzes a multi-drug regimen (3+ drugs) for shared CYP enzyme clearance bottlenecks, competitive inhibition clusters, and cumulative interaction severity.',
    parameters: {
      type: 'OBJECT',
      properties: {
        drugIds: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            description: 'Canonical drug ID.',
          },
          description: 'List of canonical drug IDs in the patient regimen (e.g., ["warfarin", "amiodarone", "omeprazole"]).',
        },
      },
      required: ['drugIds'],
    },
  },

  retrieve_metabolic_pathways: {
    name: 'retrieve_metabolic_pathways',
    description:
      'Queries active cytochrome P450 (CYP) and phase II metabolic enzyme pathways, listing substrates, competitive inhibitors (with Ki in µM), and inducers.',
    parameters: {
      type: 'OBJECT',
      properties: {
        enzymeName: {
          type: 'STRING',
          description: 'Optional enzyme name filter (e.g., "CYP2C9", "CYP3A4", "CYP2D6"). If omitted, returns all major hepatic pathways.',
        },
      },
      required: [],
    },
  },

  run_adme_simulation: {
    name: 'run_adme_simulation',
    description:
      'Executes a 48-hour continuous ordinary differential equation (ODE) pharmacokinetic simulation computing dynamic plasma concentrations (Cmax, AUC, t1/2) and CYP enzyme activity under competitive/mechanism-based inhibition.',
    parameters: {
      type: 'OBJECT',
      properties: {
        drugIds: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            description: 'Canonical drug ID.',
          },
          description: 'List of drug IDs to co-simulate.',
        },
        durationHours: {
          type: 'NUMBER',
          description: 'Simulation timeline duration in hours (typically 24 to 72, default 48).',
        },
        patientEgfr: {
          type: 'NUMBER',
          description: 'Patient renal filtration rate eGFR in mL/min/1.73m² (e.g., 90 for normal, 25 for severe renal impairment).',
        },
        cyp2d6Genotype: {
          type: 'STRING',
          description: 'CYP2D6 metabolizer status (e.g., "poor_metabolizer", "normal_metabolizer", "ultra_rapid_metabolizer").',
        },
        cyp2c19Genotype: {
          type: 'STRING',
          description: 'CYP2C19 metabolizer status (e.g., "poor_metabolizer", "normal_metabolizer", "rapid_metabolizer").',
        },
      },
      required: ['drugIds'],
    },
  },

  predict_adverse_events: {
    name: 'predict_adverse_events',
    description:
      'Executes the temporal graph neural network (TGNN-v3.2) multi-label adverse drug reaction predictor across active drug structures and kinetic state.',
    parameters: {
      type: 'OBJECT',
      properties: {
        drugIds: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            description: 'Canonical drug ID.',
          },
          description: 'List of canonical drug IDs in the active regimen.',
        },
        patientAge: {
          type: 'NUMBER',
          description: 'Patient age in years.',
        },
        patientEgfr: {
          type: 'NUMBER',
          description: 'Patient renal filtration rate eGFR in mL/min/1.73m².',
        },
      },
      required: ['drugIds'],
    },
  },

  explain_prediction: {
    name: 'explain_prediction',
    description:
      'Extracts explainable AI attribution steps, graph attention weights, and supporting clinical literature citations for a predicted adverse drug event.',
    parameters: {
      type: 'OBJECT',
      properties: {
        adrLabelOrId: {
          type: 'STRING',
          description: 'The title or label of the adverse event (e.g., "Severe Gastrointestinal Bleeding / Hemorrhage").',
        },
        drugIds: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            description: 'Canonical drug ID.',
          },
          description: 'List of active drug IDs implicated in the adverse event.',
        },
      },
      required: ['adrLabelOrId', 'drugIds'],
    },
  },
};

/**
 * Array version of clinical tool declarations suitable for direct injection into Gemini SDK `tools` config.
 */
export const CLINICAL_AI_TOOLS = Object.values(POLYPHARM_TOOL_DECLARATIONS);

/**
 * Validates tool call parameters prior to dispatch.
 */
export function validateToolArguments(
  toolName: PolypharmToolName,
  args: Record<string, any>
): { valid: boolean; error?: string } {
  const decl = POLYPHARM_TOOL_DECLARATIONS[toolName];
  if (!decl) {
    return { valid: false, error: `Unregistered tool: ${toolName}` };
  }
  for (const req of decl.parameters.required) {
    if (args[req] === undefined || args[req] === null || args[req] === '') {
      return { valid: false, error: `Missing required parameter "${req}" for tool "${toolName}"` };
    }
  }
  return { valid: true };
}

// ============================================================================
// 7. SYSTEM CONFIGURATION & FACTORY
// ============================================================================

export interface AiSystemConfig {
  projectName: string;
  defaultModel: GeminiModelId;
  advancedModel: GeminiModelId;
  embeddingModel: GeminiModelId;
  speechModel: GeminiModelId;
  endpoints: typeof API_ENDPOINTS;
  httpPolicy: HttpPolicyConfig;
  defaultParameters: ModelHyperparameters;
  systemInstruction: string;
  tools: Record<PolypharmToolName, FunctionDeclarationConfig>;
  version: string;
}

export function getAiConfig(): AiSystemConfig {
  return {
    projectName: PROJECT_NAME,
    defaultModel: 'gemini-3.8-flash',
    advancedModel: 'gemini-4-argon',
    embeddingModel: 'gemini-embedding-2-preview',
    speechModel: 'gemini-3.8-flash-lite-tts',
    endpoints: API_ENDPOINTS,
    httpPolicy: DEFAULT_HTTP_POLICY,
    defaultParameters: CLINICAL_DEFAULT_PARAMETERS,
    systemInstruction: POLYPHARM_SYSTEM_INSTRUCTION,
    tools: POLYPHARM_TOOL_DECLARATIONS,
    version: PROJECT_VERSION,
  };
}

export interface ToolExecutionResponse<T = any> {
  success: boolean;
  toolName: string;
  executionTimeMs: number;
  data: T;
  evidenceCitations?: string[];
  executionEngine: 'server-proxy' | 'local-engine-fallback';
  error?: string;
}

/**
 * Dispatches a tool call via the backend proxy (/api/llm/tools/execute) with client validation
 * and resilient local deterministic engine fallback when network is unavailable.
 */
export async function dispatchPolypharmTool<T = any>(
  toolName: PolypharmToolName,
  args: Record<string, any>
): Promise<ToolExecutionResponse<T>> {
  const validation = validateToolArguments(toolName, args);
  if (!validation.valid) {
    return {
      success: false,
      toolName,
      executionTimeMs: 0,
      data: null as any,
      executionEngine: 'server-proxy',
      error: validation.error,
    };
  }

  const t0 = performance.now();
  try {
    const res = await fetch(API_ENDPOINTS.TOOL_EXECUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, args }),
    });

    if (res.ok) {
      const json = await res.json();
      const t1 = performance.now();
      return {
        success: json.success ?? true,
        toolName,
        executionTimeMs: Math.round(t1 - t0),
        data: json.data,
        evidenceCitations: json.evidenceCitations || [],
        executionEngine: 'server-proxy',
      };
    }
  } catch (err) {
    console.warn(`[PolyPharm Tool Layer] Network tool dispatch for ${toolName} failed, falling back to local engine:`, err);
  }

  // Resilient fallback to local deterministic polypharmToolLayer
  try {
    const { polypharmToolLayer } = await import('./polypharmToolLayer');
    let localResult: any;

    switch (toolName) {
      case 'search_drug_information':
        localResult = polypharmToolLayer.searchDrugInformation(args.query || '');
        break;
      case 'resolve_drug_identifiers':
        localResult = polypharmToolLayer.resolveDrugIdentifiers(args.nameOrSynonym || '');
        break;
      case 'find_pairwise_interactions':
        localResult = polypharmToolLayer.findPairwiseInteractions(
          args.drugId1 || args.drugAId || '',
          args.drugId2 || args.drugBId || ''
        );
        break;
      case 'inspect_multidrug_regimen':
        localResult = polypharmToolLayer.inspectMultidrugRegimen(args.drugIds || [], args.patientContext);
        break;
      case 'retrieve_metabolic_pathways':
        localResult = polypharmToolLayer.retrieveMetabolicPathways(args.drugIds || []);
        break;
      case 'run_adme_simulation':
        localResult = polypharmToolLayer.runAdmeSimulation(
          args.drugIds || [],
          args.dosages || {},
          args.patientContext,
          args.durationHours || 48
        );
        break;
      case 'predict_adverse_events':
        localResult = polypharmToolLayer.predictAdverseEvents(
          args.drugIds || [],
          args.patientContext,
          args.currentTimeHours || 12
        );
        break;
      case 'explain_prediction':
        localResult = polypharmToolLayer.explainPrediction(args.adrLabelOrId || '', args.drugIds || []);
        break;
      default:
        throw new Error(`Unsupported tool: ${toolName}`);
    }

    const t1 = performance.now();
    return {
      success: localResult.status === 'success',
      toolName,
      executionTimeMs: Math.round(t1 - t0),
      data: localResult.data,
      evidenceCitations: localResult.evidenceCitations,
      executionEngine: 'local-engine-fallback',
    };
  } catch (fallbackErr: any) {
    const t1 = performance.now();
    return {
      success: false,
      toolName,
      executionTimeMs: Math.round(t1 - t0),
      data: null as any,
      executionEngine: 'local-engine-fallback',
      error: fallbackErr.message || 'Execution failed across proxy and fallback.',
    };
  }
}
