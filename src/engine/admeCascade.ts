import { Medicine, PkTimePoint, EnzymeProfile, PatientContext } from '../types';
import { INITIAL_ENZYMES } from '../data/enzymesData';

export interface DrugDoseRange {
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultDose: number;
}

/**
 * Returns the clinical standard single dose in mg for an individual drug
 */
export function getDefaultDoseMg(drug: Medicine | { id: string }): number {
  const id = drug.id.toLowerCase();
  switch (id) {
    case 'fentanyl': return 0.05;
    case 'levothyroxine': return 0.1;
    case 'digoxin': return 0.25;
    case 'alprazolam': return 1;
    case 'risperidone': return 2;
    case 'tacrolimus': return 2;
    case 'warfarin': return 5;
    case 'amlodipine': return 5;
    case 'diazepam': return 10;
    case 'olanzapine': return 10;
    case 'aripiprazole': return 10;
    case 'escitalopram': return 10;
    case 'carvedilol': return 12.5;
    case 'methotrexate': return 15;
    case 'lisinopril': return 20;
    case 'omeprazole': return 20;
    case 'fluoxetine': return 20;
    case 'paroxetine': return 20;
    case 'citalopram': return 20;
    case 'hydrochlorothiazide': return 25;
    case 'spironolactone': return 25;
    case 'morphine': return 30;
    case 'simvastatin': return 40;
    case 'atorvastatin': return 40;
    case 'furosemide': return 40;
    case 'metoprolol': return 50;
    case 'losartan': return 50;
    case 'tramadol': return 50;
    case 'sertraline': return 50;
    case 'duloxetine': return 60;
    case 'clopidogrel': return 75;
    case 'venlafaxine': return 75;
    case 'aspirin': return 100;
    case 'cyclosporine': return 100;
    case 'doxycycline': return 100;
    case 'quetiapine': return 100;
    case 'diltiazem': return 120;
    case 'verapamil': return 120;
    case 'bupropion': return 150;
    case 'amiodarone': return 200;
    case 'fluconazole': return 200;
    case 'gabapentin': return 300;
    case 'ibuprofen': return 400;
    case 'clarithromycin': return 500;
    case 'ciprofloxacin': return 500;
    case 'levofloxacin': return 500;
    case 'azithromycin': return 500;
    case 'amoxicillin': return 500;
    case 'metformin': return 1000;
    default: return 100;
  }
}

/**
 * Returns recommended slider bounds, precision step, and unit for a drug
 */
export function getDrugDoseRange(drug: Medicine | { id: string }): DrugDoseRange {
  const def = getDefaultDoseMg(drug);
  let min = Math.max(0.1, parseFloat((def * 0.1).toFixed(2)));
  let max = parseFloat((def * 3.0).toFixed(2));
  let step = 1;

  if (def <= 0.1) {
    min = 0.01;
    max = 0.3;
    step = 0.01;
  } else if (def <= 1) {
    min = 0.1;
    max = 3.0;
    step = 0.1;
  } else if (def <= 5) {
    min = 0.5;
    max = 20.0;
    step = 0.5;
  } else if (def <= 25) {
    min = 2.5;
    max = 80.0;
    step = 2.5;
  } else if (def <= 100) {
    min = 10;
    max = 300;
    step = 5;
  } else if (def <= 500) {
    min = 50;
    max = 1500;
    step = 25;
  } else {
    min = 100;
    max = 3000;
    step = 50;
  }

  return {
    min,
    max,
    step,
    unit: 'mg',
    defaultDose: def,
  };
}

/**
 * Advanced ADME Pharmacokinetic & Metabolic Cascade Simulation Engine
 * Continuous-Time ODE / Numerical Kinetic Model with Real-Time Dosage Recalculation
 */
export function simulateAdmeCascade(
  activeDrugs: Medicine[],
  patient: PatientContext,
  durationHours: number = 48,
  stepSizeHours: number = 0.5,
  drugDosages?: Record<string, number>
): { timeSeries: PkTimePoint[]; liveEnzymes: EnzymeProfile[] } {
  if (!activeDrugs || activeDrugs.length === 0) {
    const defaultTimePoints: PkTimePoint[] = [];
    for (let t = 0; t <= durationHours; t += stepSizeHours) {
      defaultTimePoints.push({
        timeHours: t,
        concentrations: {},
        metaboliteConcentrations: {},
        enzymeActivities: INITIAL_ENZYMES.reduce((acc, enz) => {
          acc[enz.name] = 100;
          return acc;
        }, {} as Record<string, number>),
        adrRiskScores: {},
      });
    }
    return {
      timeSeries: defaultTimePoints,
      liveEnzymes: INITIAL_ENZYMES.map((e) => ({ ...e })),
    };
  }

  // Weight and organ scaling factors
  const weight = patient.weightKg || 70;
  const renalFactor = Math.max(0.2, Math.min(1.4, patient.renalFunctionEgfr / 90));
  let hepaticFactor = 1.0;
  if (patient.hepaticFunction === 'mild_impairment') hepaticFactor = 0.75;
  if (patient.hepaticFunction === 'moderate_impairment') hepaticFactor = 0.50;
  if (patient.hepaticFunction === 'severe_impairment') hepaticFactor = 0.25;

  // Track state for each drug with customized dosage
  const timePoints: PkTimePoint[] = [];
  const drugStates = activeDrugs.map((drug) => {
    const defaultDose = getDefaultDoseMg(drug);
    const customDose = drugDosages?.[drug.id];
    const doseMg = typeof customDose === 'number' && customDose >= 0 ? customDose : defaultDose;

    const vdTotal = Math.max(5, drug.adme.volumeDistributionLitersPerKg * weight);
    const baselineCl = drug.adme.clearanceLitersPerHour * hepaticFactor;
    const ka = drug.adme.absorptionRateKa || 1.2;
    const f = (drug.adme.bioavailability || 70) / 100;

    return {
      drug,
      doseMg,
      defaultDose,
      f,
      vdTotal,
      baselineCl,
      ka,
      currentConc: 0,
      metaboliteConc: 0,
    };
  });

  // Iterate time steps
  for (let t = 0; t <= durationHours; t += stepSizeHours) {
    // 1. Calculate enzyme inhibition and induction from current drug concentrations
    const currentEnzymeActivities: Record<string, number> = {};

    INITIAL_ENZYMES.forEach((enz) => {
      let inhibitionSum = 0;
      let inductionFactor = 1.0;

      // Genotype baseline capacity
      let geneticBaselinePct = 100;
      if (enz.name === 'CYP2D6') {
        if (patient.cyp2d6Genotype === 'poor_metabolizer') geneticBaselinePct = 15;
        else if (patient.cyp2d6Genotype === 'intermediate_metabolizer') geneticBaselinePct = 55;
        else if (patient.cyp2d6Genotype === 'ultra_rapid_metabolizer') geneticBaselinePct = 220;
      } else if (enz.name === 'CYP2C19') {
        if (patient.cyp2c19Genotype === 'poor_metabolizer') geneticBaselinePct = 18;
        else if (patient.cyp2c19Genotype === 'intermediate_metabolizer') geneticBaselinePct = 60;
        else if (patient.cyp2c19Genotype === 'rapid_metabolizer') geneticBaselinePct = 175;
      } else if (enz.name === 'CYP2C9') {
        if (patient.cyp2c9Genotype === 'poor_metabolizer') geneticBaselinePct = 20;
        else if (patient.cyp2c9Genotype === 'intermediate_metabolizer') geneticBaselinePct = 60;
      } else if (enz.name === 'CYP1A2') {
        if (patient.smokingStatus === 'smoker') geneticBaselinePct = 165;
      }

      drugStates.forEach((state) => {
        const conc = state.currentConc; // mg/L
        state.drug.enzymes.forEach((role) => {
          if (role.name === enz.name) {
            if (role.role === 'inhibitor_strong') {
              const ki = role.inhibitionConstantKiUm || 0.4;
              inhibitionSum += (conc * 3) / (ki + conc * 3);
            } else if (role.role === 'inhibitor_moderate') {
              const ki = role.inhibitionConstantKiUm || 1.5;
              inhibitionSum += (conc * 1.5) / (ki + conc * 1.5);
            } else if (role.role === 'inhibitor_weak') {
              inhibitionSum += conc / (5.0 + conc);
            } else if (role.role === 'inducer') {
              const indMax = role.inductionFactor || 2.5;
              // Enzyme induction has a delay in biological expression (sigmoid over 12-24h)
              const timeInductionLag = Math.min(1.0, Math.pow(t / 18, 2));
              inductionFactor += (indMax - 1.0) * (conc / (2.0 + conc)) * timeInductionLag;
            }
          }
        });
      });

      // Bound enzyme inhibition to [5%, 350%] factoring genetic baseline capacity
      const effectiveActivityPct = Math.max(
        5,
        Math.min(350, geneticBaselinePct * (1 - Math.min(0.92, inhibitionSum)) * inductionFactor)
      );
      currentEnzymeActivities[enz.name] = effectiveActivityPct;
    });

    // 2. Solve pharmacokinetic concentration for each drug
    const stepConcentrations: Record<string, number> = {};
    const stepMetaboliteConcentrations: Record<string, number> = {};

    drugStates.forEach((state) => {
      // Modulate clearance by primary metabolizing enzymes
      let metabolicModulator = 1.0;
      let relevantCount = 0;

      state.drug.enzymes.forEach((role) => {
        if (role.role === 'substrate' && currentEnzymeActivities[role.name] !== undefined) {
          metabolicModulator += currentEnzymeActivities[role.name] / 100;
          relevantCount++;
        }
      });

      if (relevantCount > 0) {
        metabolicModulator = metabolicModulator / (relevantCount + 1);
      }

      // Renal clearance component (approx 30% for typical small molecules unless purely hepatic)
      const effectiveCl = Math.max(
        0.1,
        state.baselineCl * (0.3 * renalFactor + 0.7 * metabolicModulator)
      );
      const ke = Math.max(0.005, effectiveCl / state.vdTotal);

      // Analytical 1-compartment Bateman function with modulated elimination rate
      let conc = 0;
      if (Math.abs(state.ka - ke) > 0.001) {
        conc =
          ((state.doseMg * state.f * state.ka) /
            (state.vdTotal * (state.ka - ke))) *
          (Math.exp(-ke * t) - Math.exp(-state.ka * t));
      } else {
        conc =
          ((state.doseMg * state.f * state.ka) / state.vdTotal) *
          t *
          Math.exp(-ke * t);
      }
      conc = Math.max(0, conc);
      state.currentConc = conc;
      stepConcentrations[state.drug.id] = parseFloat(conc.toFixed(3));

      // Metabolite formation kinetics
      const kMet = ke * 0.45;
      const kMetElim = ke * 0.8;
      const metaboliteConc = Math.max(
        0,
        (conc * kMet * (1 - Math.exp(-kMetElim * t))) / (kMetElim + 0.05)
      );
      state.metaboliteConc = metaboliteConc;
      stepMetaboliteConcentrations[state.drug.id] = parseFloat(metaboliteConc.toFixed(3));
    });

    // Helper for relative dosage factor
    const getDoseFactor = (drugId: string): number => {
      const state = drugStates.find((s) => s.drug.id === drugId);
      if (!state) return 1.0;
      return Math.min(3.0, Math.max(0.05, state.doseMg / (state.defaultDose || 1)));
    };

    // 3. Time-dependent Adverse Drug Reaction Risk Estimation
    const stepAdrRisks: Record<string, number> = {
      hepatotoxicity: 0.05,
      major_bleeding: 0.04,
      qtc_prolongation: 0.03,
      serotonin_syndrome: 0.02,
      acute_renal_injury: 0.04,
      cns_depression: 0.03,
      rhabdomyolysis: 0.02,
      hypotension: 0.04,
    };

    // Evaluate synergistic toxicities
    const activeIds = activeDrugs.map((d) => d.id);

    // Bleeding risk (Warfarin + Amiodarone / NSAID / Antiplatelet / Fluconazole)
    if (activeIds.includes('warfarin')) {
      const wDose = getDoseFactor('warfarin');
      stepAdrRisks.major_bleeding += 0.25 * wDose;
      if (activeIds.includes('amiodarone')) {
        stepAdrRisks.major_bleeding += 0.45 * Math.sqrt(wDose * getDoseFactor('amiodarone'));
      }
      if (activeIds.includes('fluconazole')) {
        stepAdrRisks.major_bleeding += 0.50 * Math.sqrt(wDose * getDoseFactor('fluconazole'));
      }
      if (activeIds.includes('aspirin') || activeIds.includes('clopidogrel')) {
        stepAdrRisks.major_bleeding += 0.35 * wDose;
      }
    }
    if (activeIds.includes('rivaroxaban') || activeIds.includes('apixaban') || activeIds.includes('dabigatran')) {
      const doacId = activeIds.find((id) => ['rivaroxaban', 'apixaban', 'dabigatran'].includes(id)) || 'rivaroxaban';
      const doacDose = getDoseFactor(doacId);
      stepAdrRisks.major_bleeding += 0.20 * doacDose;
      if (activeIds.includes('clarithromycin') || activeIds.includes('ketoconazole')) {
        stepAdrRisks.major_bleeding += 0.55 * doacDose;
      }
    }

    // Rhabdomyolysis (Statin + CYP3A4 inhibitor / Fibrate)
    if (activeIds.includes('simvastatin') || activeIds.includes('atorvastatin')) {
      const statinId = activeIds.includes('simvastatin') ? 'simvastatin' : 'atorvastatin';
      const statinDose = getDoseFactor(statinId);
      if (activeIds.includes('clarithromycin') || activeIds.includes('amiodarone') || activeIds.includes('ketoconazole')) {
        stepAdrRisks.rhabdomyolysis += 0.65 * statinDose;
        stepAdrRisks.acute_renal_injury += 0.30 * statinDose;
      }
      if (activeIds.includes('gemfibrozil')) {
        stepAdrRisks.rhabdomyolysis += 0.70 * statinDose;
      }
    }

    // Serotonin Syndrome (SSRI + Tramadol / Linezolid / MAOI)
    const ssriPresent = activeIds.some((id) =>
      ['fluoxetine', 'sertraline', 'escitalopram', 'paroxetine', 'citalopram', 'duloxetine', 'venlafaxine'].includes(id)
    );
    if (ssriPresent) {
      if (activeIds.includes('tramadol')) stepAdrRisks.serotonin_syndrome += 0.65 * getDoseFactor('tramadol');
      if (activeIds.includes('linezolid')) stepAdrRisks.serotonin_syndrome += 0.85;
      if (activeIds.includes('phenelzine')) stepAdrRisks.serotonin_syndrome += 0.95;
    }

    // Acute Renal Injury / Triple Whammy (ACEi/ARB + Diuretic + NSAID)
    const raasPresent = activeIds.some((id) =>
      ['lisinopril', 'losartan', 'ramipril', 'valsartan', 'candesartan', 'enalapril'].includes(id)
    );
    const diureticPresent = activeIds.some((id) =>
      ['furosemide', 'hydrochlorothiazide', 'spironolactone', 'chlorthalidone', 'torsemide'].includes(id)
    );
    const nsaidDrug = activeDrugs.find((d) => d.drugClass.includes('NSAID') || ['ibuprofen', 'naproxen', 'celecoxib'].includes(d.id));
    if (raasPresent && diureticPresent && nsaidDrug) {
      stepAdrRisks.acute_renal_injury += 0.75 * getDoseFactor(nsaidDrug.id);
    } else if (raasPresent && nsaidDrug) {
      stepAdrRisks.acute_renal_injury += 0.35 * getDoseFactor(nsaidDrug.id);
    }

    // QTc Prolongation
    let qtcTriggers = 0;
    ['amiodarone', 'haloperidol', 'methadone', 'clarithromycin', 'citalopram', 'flecainide', 'azithromycin'].forEach((id) => {
      if (activeIds.includes(id)) qtcTriggers += getDoseFactor(id);
    });
    if (qtcTriggers >= 2) stepAdrRisks.qtc_prolongation += 0.40 * (qtcTriggers / 2);
    else if (qtcTriggers > 0) stepAdrRisks.qtc_prolongation += 0.20 * qtcTriggers;

    // CNS / Respiratory Depression (Opioid + Benzodiazepine / Gabapentinoid)
    const opioidPresent = activeIds.some((id) =>
      ['morphine', 'fentanyl', 'oxycodone', 'methadone', 'tramadol'].includes(id)
    );
    const benzoPresent = activeIds.some((id) =>
      ['alprazolam', 'diazepam', 'clonazepam', 'lorazepam', 'zolpidem'].includes(id)
    );
    const gabaPresent = activeIds.some((id) =>
      ['gabapentin', 'pregabalin'].includes(id)
    );
    if (opioidPresent && benzoPresent) {
      stepAdrRisks.cns_depression += 0.80;
    }
    if (opioidPresent && gabaPresent) {
      stepAdrRisks.cns_depression += 0.45;
    }

    // Clamp all ADR scores to [0.0, 0.99]
    Object.keys(stepAdrRisks).forEach((k) => {
      stepAdrRisks[k] = Math.min(0.99, parseFloat(stepAdrRisks[k].toFixed(3)));
    });

    timePoints.push({
      timeHours: parseFloat(t.toFixed(1)),
      concentrations: stepConcentrations,
      metaboliteConcentrations: stepMetaboliteConcentrations,
      enzymeActivities: currentEnzymeActivities,
      adrRiskScores: stepAdrRisks,
    });
  }

  // Compile final live enzyme status
  const finalTimePoint = timePoints[Math.floor(timePoints.length / 2)] || timePoints[0];
  const liveEnzymes: EnzymeProfile[] = INITIAL_ENZYMES.map((enz) => {
    const activity = finalTimePoint.enzymeActivities[enz.name] || 100;
    const inhibitionPct = activity < 100 ? 100 - activity : 0;
    const inductionPct = activity > 100 ? activity - 100 : 0;

    let status: EnzymeProfile['interactionStatus'] = 'OPTIMAL';
    if (activity < 30) status = 'CRITICAL_INHIBITION';
    else if (activity < 65) status = 'MODERATE_INHIBITION';
    else if (activity < 85) status = 'MILD_INHIBITION';
    else if (activity > 120) status = 'INDUCED';

    // Find affected drugs
    const affected = activeDrugs
      .filter((d) => d.enzymes.some((r) => r.name === enz.name))
      .map((d) => d.genericName);

    const affectedMets = activeDrugs
      .filter((d) => d.enzymes.some((r) => r.name === enz.name && r.role === 'substrate'))
      .flatMap((d) => d.metabolites.map((m) => m.name));

    return {
      ...enz,
      currentActivity: Math.round(activity),
      inhibitionPercent: Math.round(inhibitionPct),
      inductionPercent: Math.round(inductionPct),
      affectedDrugs: affected,
      affectedMetabolites: affectedMets,
      interactionStatus: status,
    };
  });

  return { timeSeries: timePoints, liveEnzymes };
}
