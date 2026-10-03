import { Medicine, EnzymeProfile, PkTimePoint, PatientContext } from '../types';

export interface MetabolicHazardAlert {
  id: string;
  drugA: Medicine;
  drugB: Medicine;
  hazardScore: number; // 0 - 100
  threshold: number; // e.g. 65
  exceedsThreshold: boolean;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  primaryEnzyme: string;
  enzymeActivityPct: number; // e.g. 18%
  inhibitionPct: number; // e.g. 82%
  isInduction: boolean;
  foldExposureIncrease: number; // e.g. 3.8x
  concDrugA: number; // live mg/L
  concDrugB: number; // live mg/L
  mechanism: string;
  clinicalRisk: string;
  recommendedAction: string;
  suggestedAlternative?: string;
  evidenceSource: string;
  timestampHours: number;
}

export interface MetabolicHazardSummary {
  alerts: MetabolicHazardAlert[];
  exceedingAlerts: MetabolicHazardAlert[];
  highestHazardScore: number;
  threshold: number;
  totalPairsEvaluated: number;
  systemStatus: 'CRITICAL_HAZARD' | 'HIGH_RISK' | 'MODERATE_MONITOR' | 'OPTIMAL_TOLERANCE';
}

export const DEFAULT_METABOLIC_HAZARD_THRESHOLD = 65;

/**
 * Calculates simulated metabolic interaction hazard between all active drug pairs
 * in real-time based on live ODE concentrations, CYP inhibition/induction flux,
 * pharmacogenomics, and documented clinical pharmacology interactions.
 */
export function calculatePairwiseMetabolicHazards(
  activeDrugs: Medicine[],
  enzymes: EnzymeProfile[],
  timeSeries: PkTimePoint[],
  currentTimeHours: number,
  threshold: number = DEFAULT_METABOLIC_HAZARD_THRESHOLD,
  patientContext?: PatientContext
): MetabolicHazardSummary {
  if (!activeDrugs || activeDrugs.length < 2) {
    return {
      alerts: [],
      exceedingAlerts: [],
      highestHazardScore: 0,
      threshold,
      totalPairsEvaluated: 0,
      systemStatus: 'OPTIMAL_TOLERANCE',
    };
  }

  // Find nearest timepoint in simulated timeSeries for live concentrations
  let livePoint: PkTimePoint | undefined = timeSeries[0];
  if (timeSeries && timeSeries.length > 0) {
    livePoint = timeSeries.reduce((prev, curr) =>
      Math.abs(curr.timeHours - currentTimeHours) < Math.abs(prev.timeHours - currentTimeHours)
        ? curr
        : prev
    );
  }

  // Create an enzyme activity lookup map
  const enzymeMap = new Map<string, EnzymeProfile>();
  enzymes.forEach((enz) => enzymeMap.set(enz.name, enz));

  const alerts: MetabolicHazardAlert[] = [];
  const evaluatedPairs = new Set<string>();

  for (let i = 0; i < activeDrugs.length; i++) {
    for (let j = i + 1; j < activeDrugs.length; j++) {
      const drugA = activeDrugs[i];
      const drugB = activeDrugs[j];

      const pairKey = [drugA.id, drugB.id].sort().join('__');
      if (evaluatedPairs.has(pairKey)) continue;
      evaluatedPairs.add(pairKey);

      const hazard = evaluateDrugPairMetabolicHazard(
        drugA,
        drugB,
        enzymeMap,
        livePoint,
        currentTimeHours,
        threshold,
        patientContext
      );

      alerts.push(hazard);
    }
  }

  // Sort descending by hazard score
  alerts.sort((a, b) => b.hazardScore - a.hazardScore);

  const exceedingAlerts = alerts.filter((a) => a.exceedsThreshold);
  const highestHazardScore = alerts.length > 0 ? alerts[0].hazardScore : 0;

  let systemStatus: MetabolicHazardSummary['systemStatus'] = 'OPTIMAL_TOLERANCE';
  if (exceedingAlerts.some((a) => a.severity === 'critical')) {
    systemStatus = 'CRITICAL_HAZARD';
  } else if (exceedingAlerts.length > 0) {
    systemStatus = 'HIGH_RISK';
  } else if (highestHazardScore >= 45) {
    systemStatus = 'MODERATE_MONITOR';
  }

  return {
    alerts,
    exceedingAlerts,
    highestHazardScore,
    threshold,
    totalPairsEvaluated: alerts.length,
    systemStatus,
  };
}

/**
 * Evaluates a single pairwise metabolic interaction
 */
function evaluateDrugPairMetabolicHazard(
  drugA: Medicine,
  drugB: Medicine,
  enzymeMap: Map<string, EnzymeProfile>,
  livePoint: PkTimePoint | undefined,
  currentTimeHours: number,
  threshold: number,
  patientContext?: PatientContext
): MetabolicHazardAlert {
  const concA = livePoint?.concentrations?.[drugA.id] ?? 0.5;
  const concB = livePoint?.concentrations?.[drugB.id] ?? 0.5;

  let baseScore = 0;
  let primaryEnzyme = 'CYP3A4';
  let primaryMechanism = '';
  let clinicalRisk = '';
  let recommendedAction = '';
  let suggestedAlternative = '';
  let foldExposure = 1.0;
  let isInduction = false;
  let evidenceSource = 'CPIC / DrugBank 5.1 Metabolic DDI Model';

  // 1. Check direct documented interactions in both directions
  const directInterAB = drugA.knownInteractions?.find(
    (k) =>
      k.partnerDrug.toLowerCase().includes(drugB.genericName.toLowerCase()) ||
      drugB.genericName.toLowerCase().includes(k.partnerDrug.toLowerCase()) ||
      drugB.brandNames.some((b) => k.partnerDrug.toLowerCase().includes(b.toLowerCase()))
  );
  const directInterBA = drugB.knownInteractions?.find(
    (k) =>
      k.partnerDrug.toLowerCase().includes(drugA.genericName.toLowerCase()) ||
      drugA.genericName.toLowerCase().includes(k.partnerDrug.toLowerCase()) ||
      drugA.brandNames.some((b) => k.partnerDrug.toLowerCase().includes(b.toLowerCase()))
  );

  const directInter = directInterAB || directInterBA;
  if (directInter) {
    if (directInter.severity === 'contraindicated') {
      baseScore += 55;
    } else if (directInter.severity === 'major') {
      baseScore += 42;
    } else if (directInter.severity === 'moderate') {
      baseScore += 26;
    } else {
      baseScore += 14;
    }
    primaryMechanism = directInter.mechanism;
    clinicalRisk = directInter.clinicalRisk;
  }

  // 2. Identify shared CYP metabolic enzymes & kinetic inhibition/induction
  let maxEnzymeHazard = 0;
  let topEnzymeName = 'CYP3A4';
  let topEnzymeActivity = 100;
  let topEnzymeInhibition = 0;

  // Test Drug A as inhibitor/inducer and Drug B as substrate
  drugA.enzymes?.forEach((roleA) => {
    drugB.enzymes?.forEach((roleB) => {
      if (roleA.name === roleB.name) {
        const enzProfile = enzymeMap.get(roleA.name);
        const currentAct = enzProfile?.currentActivity ?? 100;
        const currentInhib = enzProfile?.inhibitionPercent ?? Math.max(0, 100 - currentAct);

        // A inhibits B
        if (roleA.role.includes('inhibitor') && roleB.role === 'substrate') {
          let potency = 25;
          let foldSurge = 1.8;
          if (roleA.role === 'inhibitor_strong') {
            potency = 48;
            foldSurge = 3.8;
          } else if (roleA.role === 'inhibitor_moderate') {
            potency = 34;
            foldSurge = 2.4;
          } else if (roleA.role === 'inhibitor_weak') {
            potency = 18;
            foldSurge = 1.4;
          }

          // Scale by enzyme inhibition depth
          const depthMultiplier = currentAct < 35 ? 1.35 : currentAct < 65 ? 1.15 : 1.0;
          const enzScore = potency * depthMultiplier;

          if (enzScore > maxEnzymeHazard) {
            maxEnzymeHazard = enzScore;
            topEnzymeName = roleA.name;
            topEnzymeActivity = currentAct;
            topEnzymeInhibition = currentInhib;
            foldExposure = foldSurge;
            primaryMechanism = `${drugA.genericName} acts as a potent ${roleA.role.replace('_', ' ')} of ${roleA.name}, severely blunting the hepatic metabolic clearance of ${drugB.genericName}.`;
            clinicalRisk = `Elevated systemic plasma concentrations of ${drugB.genericName} (estimated ~${foldSurge.toFixed(1)}x exposure surge) leading to heightened toxicity and organ stress.`;
            recommendedAction = `Consider reducing ${drugB.genericName} dosage by 50% or replace with an alternative agent that does not depend on ${roleA.name} clearance.`;
          }
        }

        // B inhibits A
        if (roleB.role.includes('inhibitor') && roleA.role === 'substrate') {
          let potency = 25;
          let foldSurge = 1.8;
          if (roleB.role === 'inhibitor_strong') {
            potency = 48;
            foldSurge = 3.8;
          } else if (roleB.role === 'inhibitor_moderate') {
            potency = 34;
            foldSurge = 2.4;
          } else if (roleB.role === 'inhibitor_weak') {
            potency = 18;
            foldSurge = 1.4;
          }

          const depthMultiplier = currentAct < 35 ? 1.35 : currentAct < 65 ? 1.15 : 1.0;
          const enzScore = potency * depthMultiplier;

          if (enzScore > maxEnzymeHazard) {
            maxEnzymeHazard = enzScore;
            topEnzymeName = roleB.name;
            topEnzymeActivity = currentAct;
            topEnzymeInhibition = currentInhib;
            foldExposure = foldSurge;
            primaryMechanism = `${drugB.genericName} exerts competitive/mechanism-based inhibition on ${roleB.name}, reducing the baseline elimination capacity of ${drugA.genericName}.`;
            clinicalRisk = `Rapid accumulation of ${drugA.genericName} plasma exposure (estimated ~${foldSurge.toFixed(1)}x AUC), exceeding narrow therapeutic margins.`;
            recommendedAction = `Titrate ${drugA.genericName} downward or monitor plasma drug levels and biomarker response frequently.`;
          }
        }

        // Induction interaction
        if (roleA.role === 'inducer' && roleB.role === 'substrate') {
          isInduction = true;
          const enzScore = 32;
          if (enzScore > maxEnzymeHazard) {
            maxEnzymeHazard = enzScore;
            topEnzymeName = roleA.name;
            topEnzymeActivity = currentAct;
            topEnzymeInhibition = 0;
            foldExposure = 0.4;
            primaryMechanism = `${drugA.genericName} induces transcriptional expression of ${roleA.name}, markedly accelerating the metabolic breakdown of ${drugB.genericName}.`;
            clinicalRisk = `Loss of therapeutic efficacy for ${drugB.genericName} due to profound subtherapeutic circulating concentrations (~60% clearance surge).`;
            recommendedAction = `Evaluate therapeutic monitoring; increase ${drugB.genericName} dose or select a non-inducible therapeutic alternative.`;
          }
        }
      }
    });
  });

  // 3. Known high-hazard drug pairings from clinical pharmacology
  const pairIds = [drugA.id, drugB.id].sort();
  const idKey = pairIds.join('__');

  const HIGH_HAZARD_PAIRS: Record<
    string,
    {
      extraHazard: number;
      enzyme: string;
      mechanism: string;
      risk: string;
      action: string;
      alternative: string;
      fold: number;
    }
  > = {
    'amiodarone__simvastatin': {
      extraHazard: 45,
      enzyme: 'CYP3A4',
      mechanism:
        'Amiodarone is a potent inhibitor of CYP3A4 and P-glycoprotein, drastically suppressing simvastatin lactone hydrolysis and beta-hydroxyacid clearance.',
      risk:
        'Severe risk of statin-induced Rhabdomyolysis, marked creatine kinase (CK) elevation, and acute tubular necrosis renal failure.',
      action:
        'FDA warning: Simvastatin dose must NOT exceed 20 mg/day with amiodarone, or preferably substitute with Rosuvastatin or Pravastatin.',
      alternative: 'Pravastatin (CYP3A4-independent) or Rosuvastatin',
      fold: 4.5,
    },
    'amiodarone__warfarin': {
      extraHazard: 48,
      enzyme: 'CYP2C9',
      mechanism:
        'Amiodarone inhibits CYP2C9 and CYP1A2, which are the rate-limiting pathways for clearance of the potent (S)-warfarin enantiomer.',
      risk:
        'Major coagulopathic bleeding, intracranial hemorrhage, and supratherapeutic INR elevation (> 5.0).',
      action:
        'Empirically reduce warfarin dose by 33% to 50% upon initiating amiodarone, and monitor INR every 48-72 hours.',
      alternative: 'Apixaban with close anti-Xa monitoring or LMWH bridging',
      fold: 3.2,
    },
    'fluconazole__warfarin': {
      extraHazard: 46,
      enzyme: 'CYP2C9',
      mechanism:
        'Fluconazole strongly inhibits CYP2C9 in a dose-dependent manner, blocking S-warfarin 7-hydroxylation.',
      risk:
        'Catastrophic gastrointestinal hemorrhage or subdural hematoma; prolonged prothrombin time.',
      action:
        'Reduce warfarin dose by 50% and perform urgent INR reassessment within 3 days.',
      alternative: 'Echinocandin (e.g. Caspofungin) or non-CYP2C9 antifungal',
      fold: 3.6,
    },
    'amiodarone__atorvastatin': {
      extraHazard: 38,
      enzyme: 'CYP3A4',
      mechanism:
        'CYP3A4 inhibition by amiodarone leads to heightened systemic atorvastatin acid accumulation.',
      risk:
        'Myalgia, myopathy, and potential liver enzyme transaminase elevations.',
      action:
        'Limit atorvastatin dose to 20 mg daily and monitor patient for muscle tenderness and CK.',
      alternative: 'Pravastatin or Pitavastatin',
      fold: 2.8,
    },
    'clarithromycin__simvastatin': {
      extraHazard: 52,
      enzyme: 'CYP3A4',
      mechanism:
        'Clarithromycin forms a metabolite-intermediate complex that quasi-irreversibly inactivates CYP3A4.',
      risk:
        'CONTRAINDICATED: Up to 10-fold surge in simvastatin plasma AUC; extreme risk of rhabdomyolysis and fatal renal failure.',
      action:
        'Contraindicated combination. Temporarily withhold simvastatin during macrolide therapy or switch to Azithromycin.',
      alternative: 'Azithromycin (minimal CYP3A4 inhibition)',
      fold: 8.5,
    },
    'aspirin__warfarin': {
      extraHazard: 40,
      enzyme: 'Platelet COX-1 / VKORC1',
      mechanism:
        'Dual pharmacodynamic antithrombotic synergy: irreversible platelet COX-1 inhibition combined with vitamin K clotting factor synthesis blockade.',
      risk:
        'Severe upper gastrointestinal ulceration and major systemic hemorrhagic diathesis.',
      action:
        'Co-prescribe proton pump inhibitor (PPI) gastroprotection; avoid concurrent NSAID therapy.',
      alternative: 'Add PPI gastroprotection (e.g., Pantoprazole)',
      fold: 2.5,
    },
    'ibuprofen__lisinopril': {
      extraHazard: 36,
      enzyme: 'Renal Hemodynamics',
      mechanism:
        'NSAID inhibits afferent arteriolar vasodilatory prostaglandins while ACE inhibitor blocks efferent arteriolar vasoconstriction.',
      risk:
        'Precipitous drop in glomerular filtration pressure leading to Acute Kidney Injury (AKI) and hyperkalemia.',
      action:
        'Avoid chronic NSAID combination; use Acetaminophen for analgesia and monitor serum creatinine & potassium.',
      alternative: 'Acetaminophen (Paracetamol) or topical NSAID',
      fold: 2.2,
    },
    'ibuprofen__losartan': {
      extraHazard: 35,
      enzyme: 'Renal Hemodynamics',
      mechanism:
        'Prostaglandin synthesis inhibition opposing ARB-mediated efferent arteriolar tone regulation.',
      risk:
        'Blunted antihypertensive efficacy, renal hypoperfusion, and acute functional renal impairment.',
      action:
        'Switch analgesia to Acetaminophen; verify hydration status and check eGFR within 1-2 weeks.',
      alternative: 'Acetaminophen',
      fold: 2.0,
    },
    'fluoxetine__tramadol': {
      extraHazard: 44,
      enzyme: 'CYP2D6 & Serotonergic',
      mechanism:
        'Fluoxetine strongly inhibits CYP2D6 (preventing tramadol conversion to active M1 analgesic) and produces synergistic central 5-HT reuptake inhibition.',
      risk:
        'Serotonin Syndrome (hyperthermia, clonus, autonomic instability) and paradoxical loss of analgesia.',
      action:
        'Contraindicated or strongly cautioned. Avoid co-administration; use alternative non-serotonergic analgesic.',
      alternative: 'Acetaminophen / Codeine alternative or non-SSRI regimen',
      fold: 3.4,
    },
    'amiodarone__digoxin': {
      extraHazard: 46,
      enzyme: 'P-glycoprotein (ABCB1)',
      mechanism:
        'Amiodarone inhibits P-glycoprotein-mediated renal tubular secretion and biliary clearance of digoxin.',
      risk:
        'Life-threatening digitalis toxicity: fatal ventricular arrhythmias, complete heart block, nausea, and xanthopsia.',
      action:
        'Reduce digoxin dose by 50% immediately upon amiodarone initiation and check serum digoxin levels weekly.',
      alternative: 'Beta-blocker rate control under telemetry',
      fold: 2.9,
    },
  };

  const curatedDdi = HIGH_HAZARD_PAIRS[idKey];
  if (curatedDdi) {
    baseScore += curatedDdi.extraHazard;
    topEnzymeName = curatedDdi.enzyme;
    primaryMechanism = curatedDdi.mechanism;
    clinicalRisk = curatedDdi.risk;
    recommendedAction = curatedDdi.action;
    suggestedAlternative = curatedDdi.alternative;
    foldExposure = Math.max(foldExposure, curatedDdi.fold);
    evidenceSource = 'FDA Black Box Warning / CPIC Guidelines / TwoSIDES';
  } else {
    // Add enzyme hazard if not a specifically hardcoded pair
    baseScore += maxEnzymeHazard;
  }

  // 4. Live Pharmacokinetic Concentration Dynamic Factor
  // If both drugs are present in the plasma compartment at the current simulation time,
  // the metabolic bottleneck actively manifests!
  const hasLiveConcentration = concA > 0.02 && concB > 0.02;
  let dynamicTimeMultiplier = 1.0;

  if (hasLiveConcentration) {
    // Both active: interaction is currently in progress
    const combinedExposure = Math.min(2.5, (concA + concB) / 2.0);
    dynamicTimeMultiplier = 0.95 + combinedExposure * 0.15;
  } else if (concA < 0.005 || concB < 0.005) {
    // Drug has cleared or not yet absorbed: lower instantaneous hazard slightly
    dynamicTimeMultiplier = 0.75;
  }

  // 5. Patient Vulnerability Multiplier (Kidney/Liver impairment or CYP genotype)
  let patientMultiplier = 1.0;
  if (patientContext) {
    if (patientContext.renalFunctionEgfr < 30) {
      patientMultiplier += 0.22; // severe renal impairment boosts hazard
    } else if (patientContext.renalFunctionEgfr < 60) {
      patientMultiplier += 0.10;
    }

    if (patientContext.hepaticFunction === 'severe_impairment') {
      patientMultiplier += 0.30;
    } else if (patientContext.hepaticFunction === 'moderate_impairment') {
      patientMultiplier += 0.18;
    }

    if (patientContext.age >= 75) {
      patientMultiplier += 0.08;
    }

    // Genotype vulnerability
    if (
      (topEnzymeName === 'CYP2D6' && patientContext.cyp2d6Genotype === 'poor_metabolizer') ||
      (topEnzymeName === 'CYP2C19' && patientContext.cyp2c19Genotype === 'poor_metabolizer')
    ) {
      patientMultiplier += 0.25;
    }
  }

  // Calculate Final Composite Hazard Score (0 - 100)
  let totalScore = Math.round(baseScore * dynamicTimeMultiplier * patientMultiplier);
  totalScore = Math.max(5, Math.min(100, totalScore));

  let severity: MetabolicHazardAlert['severity'] = 'low';
  if (totalScore >= 80) {
    severity = 'critical';
  } else if (totalScore >= 60) {
    severity = 'high';
  } else if (totalScore >= 40) {
    severity = 'moderate';
  }

  // Defaults if mechanism was unspecified
  if (!primaryMechanism) {
    primaryMechanism = `Competitive hepatic microsomal metabolism or co-clearance pathway interaction between ${drugA.genericName} and ${drugB.genericName}.`;
    clinicalRisk = `Moderate potential for elevated plasma retention and altered pharmacological therapeutic response.`;
    recommendedAction = `Monitor clinical signs, check renal/hepatic panels, and observe for adverse symptom onset.`;
  }

  return {
    id: `hazard_${pairIds[0]}_${pairIds[1]}`,
    drugA,
    drugB,
    hazardScore: totalScore,
    threshold,
    exceedsThreshold: totalScore >= threshold,
    severity,
    primaryEnzyme: topEnzymeName,
    enzymeActivityPct: Math.round(topEnzymeActivity),
    inhibitionPct: Math.round(topEnzymeInhibition),
    isInduction,
    foldExposureIncrease: parseFloat(foldExposure.toFixed(1)),
    concDrugA: concA,
    concDrugB: concB,
    mechanism: primaryMechanism,
    clinicalRisk,
    recommendedAction,
    suggestedAlternative,
    evidenceSource,
    timestampHours: currentTimeHours,
  };
}
