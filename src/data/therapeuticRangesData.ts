/**
 * PolyPharm-Twin Therapeutic Drug Monitoring (TDM) & Clinical Reference Ranges
 * Grounding database for LLM Reasoning Range, CPIC Guidelines, and Therapeutic Index Safety
 */

export interface DrugTherapeuticRange {
  drugId: string;
  genericName: string;
  therapeuticWindow: {
    minConc: number; // Minimum Effective Concentration (MEC)
    maxConc: number; // Minimum Toxic Concentration (MTC)
    unit: 'mg/L' | 'ng/mL' | 'µg/mL' | 'mEq/L' | 'INR';
    targetDescription: string;
  };
  isNarrowTherapeuticIndex: boolean; // NTI flag
  primaryClearanceOrgan: 'renal' | 'hepatic' | 'mixed';
  majorCypEnzymes: string[];
  pharmacogenomicVulnerabilities: {
    gene: 'CYP2D6' | 'CYP2C19' | 'CYP2C9' | 'SLCO1B1' | 'VKORC1';
    phenotype: string;
    clinicalConsequence: string;
    cpicRecommendation: string;
  }[];
  toxicitySigns: string[];
  subtherapeuticRisks: string[];
  monitoringFrequency: string;
}

export const DRUG_THERAPEUTIC_RANGES: Record<string, DrugTherapeuticRange> = {
  warfarin: {
    drugId: 'warfarin',
    genericName: 'Warfarin',
    therapeuticWindow: {
      minConc: 2.0,
      maxConc: 3.0,
      unit: 'INR',
      targetDescription: 'Target INR 2.0 - 3.0 (Target 2.5) for AFib/VTE; 2.5 - 3.5 for mechanical valves',
    },
    isNarrowTherapeuticIndex: true,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP2C9', 'CYP3A4', 'CYP1A2'],
    pharmacogenomicVulnerabilities: [
      {
        gene: 'CYP2C9',
        phenotype: 'poor_metabolizer',
        clinicalConsequence: 'Marked S-warfarin clearance reduction (up to 70-80%), catastrophic bleeding risk',
        cpicRecommendation: 'Reduce initial dose by 50-80% or select alternative direct oral anticoagulant (DOAC)',
      },
      {
        gene: 'VKORC1',
        phenotype: 'high_sensitivity',
        clinicalConsequence: 'Hyper-sensitivity to vitamin K epoxide reductase inhibition, rapid INR elevation',
        cpicRecommendation: 'Initiate with reduced starting dose (e.g. 2.5-3 mg/day) and frequent INR checks',
      },
    ],
    toxicitySigns: ['Spontaneous hematuria', 'GI bleeding', 'Elevated INR > 4.5', 'Severe bruising'],
    subtherapeuticRisks: ['Ischemic stroke', 'Deep vein thrombosis', 'Pulmonary embolism'],
    monitoringFrequency: 'Daily until stable, then weekly to monthly INR checks',
  },
  digoxin: {
    drugId: 'digoxin',
    genericName: 'Digoxin',
    therapeuticWindow: {
      minConc: 0.5,
      maxConc: 0.9,
      unit: 'ng/mL',
      targetDescription: 'Heart Failure: 0.5 - 0.9 ng/mL; Atrial Fibrillation rate control: 0.8 - 1.5 ng/mL (Toxicity > 2.0 ng/mL)',
    },
    isNarrowTherapeuticIndex: true,
    primaryClearanceOrgan: 'renal',
    majorCypEnzymes: [], // P-glycoprotein efflux substrate
    pharmacogenomicVulnerabilities: [],
    toxicitySigns: ['Yellow-green xanthopsia (halos)', 'Ventricular bigeminy', 'AV block', 'Nausea/vomiting', 'Hyperkalemia'],
    subtherapeuticRisks: ['Heart failure decompensation', 'Loss of ventricular rate control in AFib'],
    monitoringFrequency: 'Serum levels at steady state (7-10 days after dose change), drawn > 6 hours post-dose',
  },
  phenytoin: {
    drugId: 'phenytoin',
    genericName: 'Phenytoin',
    therapeuticWindow: {
      minConc: 10.0,
      maxConc: 20.0,
      unit: 'mg/L',
      targetDescription: 'Total Phenytoin: 10 - 20 mg/L; Free unbound fraction: 1.0 - 2.0 mg/L',
    },
    isNarrowTherapeuticIndex: true,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP2C9', 'CYP2C19'],
    pharmacogenomicVulnerabilities: [
      {
        gene: 'CYP2C9',
        phenotype: 'poor_metabolizer',
        clinicalConsequence: 'Zero-order Michaelis-Menten saturation occurs at very low doses, dramatic toxicity',
        cpicRecommendation: 'Reduce maintenance dose by 50% with frequent free and total level TDM',
      },
    ],
    toxicitySigns: ['Horizontal nystagmus (>20 mg/L)', 'Ataxia (>30 mg/L)', 'Lethargy/coma (>40 mg/L)', 'Gingival hyperplasia'],
    subtherapeuticRisks: ['Breakthrough status epilepticus', 'Generalized tonic-clonic seizures'],
    monitoringFrequency: 'Weekly during titration, adjust for serum albumin (Winter-Tozer equation)',
  },
  lithium: {
    drugId: 'lithium',
    genericName: 'Lithium',
    therapeuticWindow: {
      minConc: 0.6,
      maxConc: 1.2,
      unit: 'mEq/L',
      targetDescription: 'Acute Mania: 0.8 - 1.2 mEq/L; Long-term Maintenance: 0.6 - 1.0 mEq/L (Toxic > 1.5 mEq/L)',
    },
    isNarrowTherapeuticIndex: true,
    primaryClearanceOrgan: 'renal',
    majorCypEnzymes: [],
    pharmacogenomicVulnerabilities: [],
    toxicitySigns: ['Coarse tremor', 'Ataxia', 'Dysarthria', 'Nephrogenic diabetes insipidus', 'Seizures (>2.5 mEq/L)'],
    subtherapeuticRisks: ['Acute manic relapse', 'Depressive breakthrough', 'Suicidal ideation'],
    monitoringFrequency: '12-hour post-dose trough levels every 3-6 months; monitor renal eGFR and TSH',
  },
  tacrolimus: {
    drugId: 'tacrolimus',
    genericName: 'Tacrolimus',
    therapeuticWindow: {
      minConc: 5.0,
      maxConc: 15.0,
      unit: 'ng/mL',
      targetDescription: 'Early post-transplant: 10 - 15 ng/mL; Maintenance (>3-6 months): 5 - 10 ng/mL',
    },
    isNarrowTherapeuticIndex: true,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP3A4'],
    pharmacogenomicVulnerabilities: [
      {
        gene: 'CYP2D6', // Using general marker
        phenotype: 'rapid_metabolizer',
        clinicalConsequence: 'Hyper-clearance leading to subtherapeutic trough and acute graft rejection',
        cpicRecommendation: 'Increase initial daily dose by 1.5 - 2.0x and monitor daily whole-blood troughs',
      },
    ],
    toxicitySigns: ['Nephrotoxicity', 'Tremors', 'New-onset diabetes after transplantation (NODAT)', 'Hypertension'],
    subtherapeuticRisks: ['Acute allograft organ rejection', 'Immune graft loss'],
    monitoringFrequency: 'Daily in acute phase, weekly in subacute, monthly in maintenance',
  },
  theophylline: {
    drugId: 'theophylline',
    genericName: 'Theophylline',
    therapeuticWindow: {
      minConc: 5.0,
      maxConc: 15.0,
      unit: 'mg/L',
      targetDescription: 'Optimal therapeutic response: 5.0 - 15.0 mg/L (Severe toxicity > 20 mg/L)',
    },
    isNarrowTherapeuticIndex: true,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP1A2'],
    pharmacogenomicVulnerabilities: [],
    toxicitySigns: ['Tachyarrhythmias', 'Refractory seizures', 'Intractable nausea/vomiting', 'Hypokalemia'],
    subtherapeuticRisks: ['Acute bronchospasm', 'Severe status asthmaticus'],
    monitoringFrequency: 'Annual or upon addition of CYP1A2 inhibitors (ciprofloxacin) or smoking cessation',
  },
  amiodarone: {
    drugId: 'amiodarone',
    genericName: 'Amiodarone',
    therapeuticWindow: {
      minConc: 1.0,
      maxConc: 2.5,
      unit: 'mg/L',
      targetDescription: 'Therapeutic antiarrhythmic range: 1.0 - 2.5 mg/L (Toxicity > 2.5 mg/L)',
    },
    isNarrowTherapeuticIndex: false,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP3A4', 'CYP2C8'],
    pharmacogenomicVulnerabilities: [],
    toxicitySigns: ['Pulmonary fibrosis', 'Corneal microdeposits', 'Thyroid dysfunction (hypo/hyper)', 'Hepatotoxicity'],
    subtherapeuticRisks: ['Recurrent ventricular arrhythmias', 'AFib recurrence'],
    monitoringFrequency: 'PFTs, LFTs, and TSH baseline then every 6 months; long t1/2 of 40-58 days',
  },
  clopidogrel: {
    drugId: 'clopidogrel',
    genericName: 'Clopidogrel',
    therapeuticWindow: {
      minConc: 0.1,
      maxConc: 2.0,
      unit: 'mg/L',
      targetDescription: 'Prodrug requiring CYP2C19 2-step bioactivation to thiol active metabolite',
    },
    isNarrowTherapeuticIndex: false,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP2C19', 'CYP3A4'],
    pharmacogenomicVulnerabilities: [
      {
        gene: 'CYP2C19',
        phenotype: 'poor_metabolizer',
        clinicalConsequence: 'Failure to generate active antiplatelet metabolite, marked risk of stent thrombosis and MI',
        cpicRecommendation: 'Avoid clopidogrel; switch to prasugrel or ticagrelor (not dependent on CYP2C19 activation)',
      },
      {
        gene: 'CYP2C19',
        phenotype: 'intermediate_metabolizer',
        clinicalConsequence: 'Suboptimal platelet inhibition',
        cpicRecommendation: 'Consider alternative P2Y12 inhibitor (prasugrel/ticagrelor) especially post-PCI',
      },
    ],
    toxicitySigns: ['Major bleeding', 'Purpura', 'Thrombocytopenia'],
    subtherapeuticRisks: ['Acute stent thrombosis', 'Secondary myocardial infarction', 'Death'],
    monitoringFrequency: 'CYP2C19 genotype screening prior to elective PCI or high-risk coronary stenting',
  },
  metoprolol: {
    drugId: 'metoprolol',
    genericName: 'Metoprolol',
    therapeuticWindow: {
      minConc: 20.0,
      maxConc: 100.0,
      unit: 'ng/mL',
      targetDescription: 'Beta-blockade target concentration 20 - 100 ng/mL',
    },
    isNarrowTherapeuticIndex: false,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP2D6'],
    pharmacogenomicVulnerabilities: [
      {
        gene: 'CYP2D6',
        phenotype: 'poor_metabolizer',
        clinicalConsequence: '3-fold to 5-fold higher AUC and Cmax; severe bradycardia, heart block, and fatigue',
        cpicRecommendation: 'Reduce starting dose by 50% or titrate cautiously against resting heart rate',
      },
      {
        gene: 'CYP2D6',
        phenotype: 'ultra_rapid_metabolizer',
        clinicalConsequence: 'Rapid metabolism, subtherapeutic beta-blockade, failure of blood pressure control',
        cpicRecommendation: 'Select alternative beta-blocker not cleared by CYP2D6 (e.g. atenolol, bisoprolol)',
      },
    ],
    toxicitySigns: ['Severe bradycardia (< 50 bpm)', 'Hypotension', 'Second/third-degree AV block', 'Bronchospasm'],
    subtherapeuticRisks: ['Uncontrolled hypertension', 'Angina pectoris', 'Tachyarrhythmias'],
    monitoringFrequency: 'Resting pulse and blood pressure titration',
  },
  simvastatin: {
    drugId: 'simvastatin',
    genericName: 'Simvastatin',
    therapeuticWindow: {
      minConc: 1.0,
      maxConc: 15.0,
      unit: 'ng/mL',
      targetDescription: 'Lipid-lowering plasma concentration 1.0 - 15.0 ng/mL (High levels cause rhabdomyolysis)',
    },
    isNarrowTherapeuticIndex: false,
    primaryClearanceOrgan: 'hepatic',
    majorCypEnzymes: ['CYP3A4'],
    pharmacogenomicVulnerabilities: [
      {
        gene: 'SLCO1B1',
        phenotype: 'decreased_function',
        clinicalConsequence: 'Impaired hepatic uptake via OATP1B1, leading to 220% higher systemic statin exposure',
        cpicRecommendation: 'Do not exceed 20 mg/day simvastatin; prefer rosuvastatin or pravastatin',
      },
    ],
    toxicitySigns: ['Severe myalgia', 'Creatine kinase (CK) > 10x ULN', 'Rhabdomyolysis', 'Acute kidney injury'],
    subtherapeuticRisks: ['Uncontrolled LDL-C', 'Atherosclerotic cardiovascular progression'],
    monitoringFrequency: 'Baseline lipid panel and CK if muscle symptoms arise',
  },
};

/**
 * Helper to assess if a simulated drug concentration violates its therapeutic range
 */
export function checkTherapeuticRangeStatus(
  drugId: string,
  currentConcMgL: number
): {
  status: 'subtherapeutic' | 'optimal' | 'supratherapeutic' | 'toxic' | 'unknown';
  severity: 'safe' | 'warning' | 'critical';
  details: string;
  range?: DrugTherapeuticRange;
} {
  const profile = DRUG_THERAPEUTIC_RANGES[drugId.toLowerCase()];
  if (!profile) {
    return {
      status: 'unknown',
      severity: 'safe',
      details: 'No specific narrow therapeutic monitoring window defined.',
    };
  }

  const { minConc, maxConc, unit } = profile.therapeuticWindow;
  
  // Normalize units to mg/L for comparison (1 mg/L = 1000 ng/mL = 1 µg/mL)
  let normalizedConc = currentConcMgL;
  let normalizedMin = minConc;
  let normalizedMax = maxConc;

  if (unit === 'ng/mL') {
    // If target is in ng/mL, convert mg/L to ng/mL
    normalizedConc = currentConcMgL * 1000;
  }

  if (normalizedConc < normalizedMin * 0.8) {
    return {
      status: 'subtherapeutic',
      severity: 'warning',
      details: `Simulated exposure (${normalizedConc.toFixed(2)} ${unit}) is below Minimum Effective Concentration (${minConc} ${unit}). Risk: ${profile.subtherapeuticRisks.join(', ')}.`,
      range: profile,
    };
  } else if (normalizedConc > normalizedMax * 1.5) {
    return {
      status: 'toxic',
      severity: 'critical',
      details: `Simulated exposure (${normalizedConc.toFixed(2)} ${unit}) exceeds Toxic Threshold (${maxConc} ${unit})! Manifestations: ${profile.toxicitySigns.join(', ')}.`,
      range: profile,
    };
  } else if (normalizedConc > normalizedMax) {
    return {
      status: 'supratherapeutic',
      severity: 'warning',
      details: `Simulated exposure (${normalizedConc.toFixed(2)} ${unit}) is slightly above therapeutic target (${minConc} - ${maxConc} ${unit}).`,
      range: profile,
    };
  } else {
    return {
      status: 'optimal',
      severity: 'safe',
      details: `Simulated exposure (${normalizedConc.toFixed(2)} ${unit}) is safely within target therapeutic range (${minConc} - ${maxConc} ${unit}).`,
      range: profile,
    };
  }
}
