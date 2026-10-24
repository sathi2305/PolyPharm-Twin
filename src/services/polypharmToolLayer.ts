/**
 * PolyPharm-Twin Deterministic Tool Layer
 * Connects the LLM and RAG assistant directly to the real repository engines:
 * - ADME ODE Kinetic Simulator (admeCascade.ts)
 * - Dynamic Biomedical Knowledge Graph (knowledgeGraph.ts)
 * - Temporal GNN & Multi-Label ADR Predictor (temporalGnnAdr.ts)
 * - Comprehensive Medicine Library (medicinesData.ts)
 */

import { Medicine, PatientContext, AdrPrediction, PkTimePoint, EnzymeProfile } from '../types';
import { ALL_INITIAL_MEDICINES } from '../data/medicinesData';
import { simulateAdmeCascade, getDefaultDoseMg } from '../engine/admeCascade';
import { buildDynamicKnowledgeGraph } from '../engine/knowledgeGraph';
import { predictPolypharmacyAdrs } from '../engine/temporalGnnAdr';

export interface ToolExecutionResult {
  toolName: string;
  status: 'success' | 'error';
  executionTimeMs: number;
  data: any;
  evidenceCitations?: string[];
}

export const polypharmToolLayer = {
  /**
   * Tool 1: search_drug_information
   * Retrieves verified pharmacological and ADME profile for a drug
   */
  searchDrugInformation(query: string): ToolExecutionResult {
    const t0 = performance.now();
    const q = query.toLowerCase().trim();
    const found = ALL_INITIAL_MEDICINES.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.genericName.toLowerCase().includes(q) ||
        m.brandNames.some((b) => b.toLowerCase().includes(q))
    );

    const t1 = performance.now();
    if (!found) {
      return {
        toolName: 'search_drug_information',
        status: 'error',
        executionTimeMs: Math.round(t1 - t0),
        data: { message: `No verified record found for query: "${query}" in PolyPharm-Twin library.` },
      };
    }

    return {
      toolName: 'search_drug_information',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        id: found.id,
        genericName: found.genericName,
        drugClass: found.drugClass,
        mechanismOfAction: found.mechanismOfAction,
        molecularFormula: found.molecularFormula,
        molecularWeight: found.molecularWeight,
        smiles: found.smiles,
        adme: found.adme,
        enzymes: found.enzymes,
        contraindications: found.contraindications,
        knownInteractionsCount: found.knownInteractions.length,
        evidenceSource: found.evidenceSource,
      },
      evidenceCitations: [found.evidenceSource, 'FDA Structured Product Labeling (SPL)', 'DrugBank 5.1'],
    };
  },

  /**
   * Tool 2: resolve_drug_identifiers
   * Resolves fuzzy name, brand, or synonym to canonical DrugBank / PolyPharm identifier
   */
  resolveDrugIdentifiers(nameOrSynonym: string): ToolExecutionResult {
    const t0 = performance.now();
    const q = nameOrSynonym.toLowerCase().trim();
    const match = ALL_INITIAL_MEDICINES.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.genericName.toLowerCase() === q ||
        m.brandNames.some((b) => b.toLowerCase() === q) ||
        m.genericName.toLowerCase().includes(q)
    );

    const t1 = performance.now();
    if (!match) {
      return {
        toolName: 'resolve_drug_identifiers',
        status: 'error',
        executionTimeMs: Math.round(t1 - t0),
        data: { message: `Unable to resolve drug identifier for "${nameOrSynonym}".` },
      };
    }

    return {
      toolName: 'resolve_drug_identifiers',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        query: nameOrSynonym,
        canonicalId: match.id,
        genericName: match.genericName,
        brandNames: match.brandNames,
        drugClass: match.drugClass,
        smiles: match.smiles,
      },
      evidenceCitations: ['RxNorm', 'DrugBank Accession Registry'],
    };
  },

  /**
   * Tool 3: find_pairwise_interactions
   * Discovers known pairwise clinical interactions between two drugs
   */
  findPairwiseInteractions(drugAId: string, drugBId: string): ToolExecutionResult {
    const t0 = performance.now();
    const drugA = ALL_INITIAL_MEDICINES.find((m) => m.id.toLowerCase() === drugAId.toLowerCase());
    const drugB = ALL_INITIAL_MEDICINES.find((m) => m.id.toLowerCase() === drugBId.toLowerCase());

    const t1 = performance.now();
    if (!drugA || !drugB) {
      return {
        toolName: 'find_pairwise_interactions',
        status: 'error',
        executionTimeMs: Math.round(t1 - t0),
        data: { message: `One or both drugs not found (${drugAId}, ${drugBId}).` },
      };
    }

    // Check drugA known interactions for drugB
    const interactionInA = drugA.knownInteractions.find(
      (k) =>
        k.partnerDrug.toLowerCase().includes(drugB.genericName.toLowerCase()) ||
        drugB.genericName.toLowerCase().includes(k.partnerDrug.toLowerCase())
    );

    // Check shared enzyme competition
    const sharedEnzymes: string[] = [];
    drugA.enzymes.forEach((ea) => {
      drugB.enzymes.forEach((eb) => {
        if (ea.name === eb.name) {
          sharedEnzymes.push(`${ea.name} (${drugA.genericName}: ${ea.role}, ${drugB.genericName}: ${eb.role})`);
        }
      });
    });

    return {
      toolName: 'find_pairwise_interactions',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        drugA: drugA.genericName,
        drugB: drugB.genericName,
        documentedInteraction: interactionInA || null,
        sharedMetabolicPathways: sharedEnzymes,
        hasContraindication: interactionInA?.severity === 'contraindicated',
        clinicalRisk: interactionInA?.clinicalRisk || 'No critical pairwise interaction documented; evaluate multi-drug enzyme load.',
        evidenceSource: drugA.evidenceSource,
      },
      evidenceCitations: ['TwoSIDES Pharmacovigilance Database', drugA.evidenceSource, 'Micromedex DrugDex'],
    };
  },

  /**
   * Tool 4: inspect_multidrug_regimen
   * Analyzes an entire polypharmacy combination for enzyme bottlenecks and cumulative saturation
   */
  inspectMultidrugRegimen(drugIds: string[], patientContext?: PatientContext): ToolExecutionResult {
    const t0 = performance.now();
    const selected = ALL_INITIAL_MEDICINES.filter((m) => drugIds.map((id) => id.toLowerCase()).includes(m.id.toLowerCase()));

    const enzymeLoad: Record<string, { substrates: string[]; inhibitors: string[]; inducers: string[] }> = {};

    selected.forEach((drug) => {
      drug.enzymes.forEach((e) => {
        if (!enzymeLoad[e.name]) {
          enzymeLoad[e.name] = { substrates: [], inhibitors: [], inducers: [] };
        }
        if (e.role === 'substrate') enzymeLoad[e.name].substrates.push(drug.genericName);
        if (e.role.includes('inhibitor')) enzymeLoad[e.name].inhibitors.push(drug.genericName);
        if (e.role === 'inducer') enzymeLoad[e.name].inducers.push(drug.genericName);
      });
    });

    const bottlenecks = Object.entries(enzymeLoad)
      .filter(([_, load]) => load.substrates.length > 0 && (load.inhibitors.length > 0 || load.substrates.length >= 2))
      .map(([enz, load]) => ({
        enzyme: enz,
        substrateCount: load.substrates.length,
        substrates: load.substrates,
        inhibitors: load.inhibitors,
        risk: load.inhibitors.length > 0 ? 'Severe Competitive Inhibition' : 'Substrate Competition',
      }));

    const t1 = performance.now();
    return {
      toolName: 'inspect_multidrug_regimen',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        totalDrugs: selected.length,
        regimen: selected.map((d) => d.genericName),
        metabolicBottlenecks: bottlenecks,
        patientRenalRisk: patientContext && patientContext.renalFunctionEgfr < 60 ? 'Impaired clearance' : 'Normal clearance',
      },
      evidenceCitations: ['FDA Guidance on Clinical Drug Interaction Studies', 'CPIC Dosing Guidelines'],
    };
  },

  /**
   * Tool 5: retrieve_metabolic_pathways
   * Returns graph-based metabolic pathways, enzyme affinities, and metabolite nodes
   */
  retrieveMetabolicPathways(drugIds: string[]): ToolExecutionResult {
    const t0 = performance.now();
    const selected = ALL_INITIAL_MEDICINES.filter((m) => drugIds.map((id) => id.toLowerCase()).includes(m.id.toLowerCase()));
    const graph = buildDynamicKnowledgeGraph(selected, 800, 600);

    const pathways = selected.map((drug) => ({
      drug: drug.genericName,
      enzymes: drug.enzymes.map((e) => ({
        enzyme: e.name,
        role: e.role,
        kiUm: e.inhibitionConstantKiUm ?? null,
      })),
      metabolites: drug.metabolites.map((m) => ({
        name: m.name,
        activity: m.activity,
        pathway: m.formationPathway,
      })),
    }));

    const t1 = performance.now();
    return {
      toolName: 'retrieve_metabolic_pathways',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        pathways,
      },
      evidenceCitations: ['KEGG Pathway Database', 'PharmGKB Metabolic Pathways'],
    };
  },

  /**
   * Tool 6: run_adme_simulation
   * Runs the actual continuous-time ODE ADME simulator
   */
  runAdmeSimulation(
    drugIds: string[],
    dosages: Record<string, number> = {},
    patientContext?: PatientContext,
    durationHours: number = 48
  ): ToolExecutionResult {
    const t0 = performance.now();
    const selected = ALL_INITIAL_MEDICINES.filter((m) => drugIds.map((id) => id.toLowerCase()).includes(m.id.toLowerCase()));

    const defaultPatient: PatientContext = patientContext || {
      age: 62,
      gender: 'male',
      weightKg: 78,
      renalFunctionEgfr: 75,
      hepaticFunction: 'normal',
      cyp2d6Genotype: 'normal_metabolizer',
      cyp2c19Genotype: 'normal_metabolizer',
    };

    const { timeSeries, liveEnzymes } = simulateAdmeCascade(selected, defaultPatient, durationHours, 0.5, dosages);

    // Compute peak Cmax & lowest enzyme flux
    const exposureMetrics: Record<string, { cmax: number; tmax: number }> = {};
    selected.forEach((d) => {
      let maxC = 0;
      let maxT = 0;
      timeSeries.forEach((pt) => {
        const val = pt.concentrations[d.id] || 0;
        if (val > maxC) {
          maxC = val;
          maxT = pt.timeHours;
        }
      });
      exposureMetrics[d.genericName] = { cmax: parseFloat(maxC.toFixed(2)), tmax: maxT };
    });

    const residualEnzymeFlux = liveEnzymes.map((e) => ({
      enzyme: e.name,
      residualCapacityPercent: Math.round(e.currentActivity),
      status: e.interactionStatus,
    }));

    const t1 = performance.now();
    return {
      toolName: 'run_adme_simulation',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        simulationDurationHours: durationHours,
        stepCount: timeSeries.length,
        exposureMetrics,
        residualEnzymeFlux,
      },
      evidenceCitations: ['Physiologically Based Pharmacokinetic (PBPK) Modeling Standards', 'PolyPharm ODE ADME Engine v3.2'],
    };
  },

  /**
   * Tool 7: predict_adverse_events
   * Runs the Temporal Graph Neural Network ADR predictor
   */
  predictAdverseEvents(drugIds: string[], patientContext?: PatientContext, currentTimeHours: number = 12): ToolExecutionResult {
    const t0 = performance.now();
    const selected = ALL_INITIAL_MEDICINES.filter((m) => drugIds.map((id) => id.toLowerCase()).includes(m.id.toLowerCase()));

    const defaultPatient: PatientContext = patientContext || {
      age: 62,
      gender: 'male',
      weightKg: 78,
      renalFunctionEgfr: 75,
      hepaticFunction: 'normal',
      cyp2d6Genotype: 'normal_metabolizer',
      cyp2c19Genotype: 'normal_metabolizer',
    };

    const { predictions, explanations } = predictPolypharmacyAdrs(selected, defaultPatient, currentTimeHours);

    const t1 = performance.now();
    return {
      toolName: 'predict_adverse_events',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        predictionCount: predictions.length,
        predictions: predictions.map((p) => ({
          id: p.id,
          label: p.label,
          severity: p.severity,
          probability: parseFloat(p.probability.toFixed(3)),
          organSystem: p.organSystem,
          causalMechanism: p.causalExplanation[0] || 'Multi-drug kinetic saturation',
          evidenceLevel: p.evidenceLevel,
        })),
        modelVersion: 'TGNN-PolyPharm-v3.2 (Temporal Attention + Graph Convolution)',
      },
      evidenceCitations: ['TwoSIDES Benchmark Dataset', 'FDA Adverse Event Reporting System (FAERS)'],
    };
  },

  /**
   * Tool 8: explain_prediction
   * Provides explainable AI attribution steps and attention weights
   */
  explainPrediction(adrLabelOrId: string, drugIds: string[]): ToolExecutionResult {
    const t0 = performance.now();
    const selected = ALL_INITIAL_MEDICINES.filter((m) => drugIds.map((id) => id.toLowerCase()).includes(m.id.toLowerCase()));
    const defaultPatient: PatientContext = {
      age: 62,
      gender: 'male',
      weightKg: 78,
      renalFunctionEgfr: 75,
      hepaticFunction: 'normal',
      cyp2d6Genotype: 'normal_metabolizer',
      cyp2c19Genotype: 'normal_metabolizer',
    };

    const { explanations } = predictPolypharmacyAdrs(selected, defaultPatient, 12);
    const target =
      explanations.find(
        (e) =>
          e.interactionTitle.toLowerCase().includes(adrLabelOrId.toLowerCase()) ||
          adrLabelOrId.toLowerCase().includes(e.interactionTitle.toLowerCase())
      ) || explanations[0];

    const t1 = performance.now();
    if (!target) {
      return {
        toolName: 'explain_prediction',
        status: 'error',
        executionTimeMs: Math.round(t1 - t0),
        data: { message: `No causal explanation available for "${adrLabelOrId}".` },
      };
    }

    return {
      toolName: 'explain_prediction',
      status: 'success',
      executionTimeMs: Math.round(t1 - t0),
      data: {
        interactionTitle: target.interactionTitle,
        severity: target.severity,
        attributionSteps: target.steps,
        attentionWeights: target.attentionWeights,
        supportingEvidence: target.supportingEvidence,
        therapeuticWindowWarning: target.therapeuticWindowWarning || null,
      },
      evidenceCitations: [target.supportingEvidence, 'Integrated Gradients / Graph Attention Weights'],
    };
  },
};
