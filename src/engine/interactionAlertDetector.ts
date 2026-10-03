/**
 * PolyPharm-Twin Automated Severe Drug-Drug Interaction Alert Detection Engine
 * Evaluates clinical risk on newly added drugs against current regimen
 */

import { Medicine, PatientContext, SevereInteractionToastAlert } from '../types';

export const HIGH_HAZARD_CLINICAL_PAIRS: Record<
  string,
  {
    severity: 'contraindicated' | 'major';
    mechanism: string;
    risk: string;
    action: string;
    alternative?: string;
  }
> = {
  'amiodarone__simvastatin': {
    severity: 'contraindicated',
    mechanism:
      'Amiodarone potently inhibits CYP3A4 and P-glycoprotein, drastically suppressing simvastatin clearance.',
    risk:
      'Severe risk of statin-induced Rhabdomyolysis, massive creatine kinase (CK) elevation, and acute renal failure.',
    action:
      'FDA warning: Simvastatin dose must NOT exceed 20 mg/day with amiodarone, or preferably switch to Pravastatin / Rosuvastatin.',
    alternative: 'Pravastatin (CYP3A4-independent) or Rosuvastatin',
  },
  'amiodarone__warfarin': {
    severity: 'major',
    mechanism:
      'Amiodarone inhibits CYP2C9 and CYP1A2, which clear the active S-warfarin enantiomer.',
    risk:
      'Critical coagulopathic bleeding, intracranial hemorrhage, and supratherapeutic INR elevation (> 5.0).',
    action:
      'Empirically reduce warfarin dose by 33% to 50% upon initiating amiodarone, and monitor baseline INR every 48-72 hours.',
    alternative: 'Apixaban under close monitoring or LMWH bridging',
  },
  'clarithromycin__simvastatin': {
    severity: 'contraindicated',
    mechanism:
      'Clarithromycin forms a metabolite-intermediate complex that quasi-irreversibly inactivates CYP3A4.',
    risk:
      'CONTRAINDICATED: Up to 10-fold surge in simvastatin plasma AUC; extreme risk of fatal rhabdomyolysis.',
    action:
      'Contraindicated combination. Temporarily withhold simvastatin during macrolide therapy or switch to Azithromycin.',
    alternative: 'Azithromycin (minimal CYP3A4 inhibition)',
  },
  'fluconazole__warfarin': {
    severity: 'major',
    mechanism:
      'Fluconazole strongly inhibits CYP2C9 in a dose-dependent manner, blocking S-warfarin elimination.',
    risk:
      'Catastrophic gastrointestinal hemorrhage, hematuria, or subdural hematoma; prolonged prothrombin time.',
    action:
      'Reduce warfarin dose by 50% and perform urgent INR reassessment within 48 to 72 hours.',
    alternative: 'Caspofungin / non-CYP2C9 antifungal',
  },
  'amiodarone__digoxin': {
    severity: 'major',
    mechanism:
      'Amiodarone inhibits P-glycoprotein-mediated renal tubular secretion and biliary clearance of digoxin.',
    risk:
      'Life-threatening digitalis toxicity: fatal ventricular arrhythmias, complete heart block, and nausea/visual disturbances.',
    action:
      'Reduce digoxin dose by 50% immediately upon amiodarone initiation and check serum digoxin levels weekly.',
    alternative: 'Beta-blocker rate control under telemetry',
  },
  'clopidogrel__omeprazole': {
    severity: 'major',
    mechanism:
      'Omeprazole competitively inhibits CYP2C19, preventing bioactivation of clopidogrel prodrug into active thiol metabolite.',
    risk:
      'FDA Boxed Warning: Attenuated antiplatelet efficacy resulting in stent thrombosis and recurrent myocardial infarction.',
    action:
      'Switch PPI to Pantoprazole (low CYP2C19 affinity) or H2RA (Famotidine) to preserve clopidogrel activation.',
    alternative: 'Pantoprazole or Famotidine',
  },
  'fluoxetine__tramadol': {
    severity: 'major',
    mechanism:
      'Fluoxetine strongly inhibits CYP2D6 (preventing tramadol conversion to active M1 analgesic) and produces synergistic central 5-HT reuptake inhibition.',
    risk:
      'High risk of Serotonin Syndrome (hyperthermia, clonus, autonomic instability) and paradoxical loss of analgesia.',
    action:
      'Avoid co-administration; use non-serotonergic analgesic or non-SSRI psychiatric management.',
    alternative: 'Acetaminophen or non-serotonergic analgesia',
  },
  'sertraline__tramadol': {
    severity: 'major',
    mechanism:
      'Combined 5-HT reuptake inhibition: Sertraline blocks serotonin transporter while tramadol inhibits serotonin and norepinephrine reuptake.',
    risk: 'Serotonin Syndrome (hyperreflexia, clonus, autonomic instability, hyperthermia) and tremor.',
    action: 'Avoid concomitant administration if possible; monitor closely for signs of serotonin toxicity.',
    alternative: 'Acetaminophen or non-serotonergic analgesia',
  },
  'paroxetine__tramadol': {
    severity: 'major',
    mechanism:
      'Potent CYP2D6 inhibition blocks tramadol active metabolite formation while compounding synaptic serotonin accumulation.',
    risk: 'Serotonin syndrome, motor restlessness, tremors, and loss of pain control.',
    action: 'Avoid concomitant prescribing. Substitute alternative analgesic.',
  },
  'aspirin__warfarin': {
    severity: 'major',
    mechanism:
      'Dual pharmacodynamic antithrombotic synergy: irreversible platelet COX-1 inhibition combined with vitamin K clotting factor synthesis blockade.',
    risk:
      'Severe upper gastrointestinal ulceration and major systemic hemorrhagic diathesis.',
    action:
      'Verify strict clinical indication for dual antiplatelet/anticoagulant therapy; co-prescribe PPI gastroprotection.',
    alternative: 'Add Pantoprazole gastroprotection; avoid unnecessary NSAID co-administration',
  },
  'ibuprofen__warfarin': {
    severity: 'major',
    mechanism:
      'NSAID-induced gastrointestinal mucosal injury and platelet inhibition combined with warfarin systemic anticoagulation.',
    risk: 'Severe gastrointestinal bleeding and peptic ulcer perforation.',
    action: 'Discontinue ibuprofen; substitute Acetaminophen for analgesia.',
    alternative: 'Acetaminophen (Paracetamol) or topical NSAID',
  },
  'ibuprofen__lisinopril': {
    severity: 'major',
    mechanism:
      'NSAID inhibits afferent arteriolar vasodilatory prostaglandins while ACE inhibitor blocks efferent arteriolar vasoconstriction.',
    risk:
      'Precipitous drop in glomerular filtration pressure leading to Acute Kidney Injury (AKI) and hyperkalemia.',
    action:
      'Avoid chronic NSAID combination; use Acetaminophen for analgesia and monitor serum creatinine & potassium.',
    alternative: 'Acetaminophen (Paracetamol)',
  },
  'ibuprofen__losartan': {
    severity: 'major',
    mechanism:
      'Prostaglandin synthesis inhibition opposing ARB-mediated efferent arteriolar tone regulation.',
    risk:
      'Blunted antihypertensive efficacy, renal hypoperfusion, and acute functional renal impairment.',
    action:
      'Switch analgesia to Acetaminophen; verify hydration status and check eGFR within 1-2 weeks.',
    alternative: 'Acetaminophen',
  },
  'amiodarone__citalopram': {
    severity: 'major',
    mechanism: 'Additive cardiac IKr potassium channel blockade leading to marked QTc interval prolongation.',
    risk: 'Torsades de Pointes, ventricular fibrillation, and sudden cardiac arrest.',
    action: 'Perform baseline ECG; consider switching SSRI to Sertraline (lowest QTc propensity).',
    alternative: 'Sertraline',
  },
  'amiodarone__escitalopram': {
    severity: 'major',
    mechanism: 'Additive cardiac IKr potassium channel blockade leading to marked QTc prolongation.',
    risk: 'Torsades de Pointes, polymorphic ventricular tachycardia, and syncope.',
    action: 'Perform baseline ECG; consider switching SSRI to Sertraline or reducing dose.',
    alternative: 'Sertraline',
  },
  'citalopram__fluconazole': {
    severity: 'major',
    mechanism: 'CYP2C19 inhibition by fluconazole doubles citalopram plasma concentrations with additive QTc prolongation.',
    risk: 'FDA Warning: Doses exceeding 20-40 mg trigger fatal QTc prolongation and arrhythmias.',
    action: 'Limit citalopram to max 20 mg daily during fluconazole therapy or switch antifungal.',
    alternative: 'Nystatin / Topical antifungal or non-CYP2C19 agent',
  },
  'methotrexate__ibuprofen': {
    severity: 'major',
    mechanism: 'NSAID decreases renal blood flow and inhibits organic anion transporters (OAT1/OAT3) clearing methotrexate.',
    risk: 'Severe methotrexate toxicity: fatal bone marrow suppression (pancytopenia), stomatitis, and acute nephrotoxicity.',
    action: 'Contraindicated with high-dose methotrexate; avoid concurrent NSAIDs with low-dose weekly methotrexate.',
    alternative: 'Acetaminophen for pain relief',
  },
  'methotrexate__naproxen': {
    severity: 'major',
    mechanism: 'Inhibition of renal tubular secretion of methotrexate via organic anion transport competition.',
    risk: 'Profound pancytopenia, severe mucosal ulceration, and acute renal tubular necrosis.',
    action: 'Avoid concomitant NSAIDs; use Acetaminophen and verify weekly folinic acid rescue.',
    alternative: 'Acetaminophen',
  },
  'methotrexate__omeprazole': {
    severity: 'major',
    mechanism: 'Omeprazole inhibits BCRP (ABCG2) and renal H+/K+ ATPase, decreasing methotrexate clearance.',
    risk: 'Sustained elevated serum methotrexate levels and severe systemic toxicity.',
    action: 'Temporarily switch PPI to H2-receptor antagonist (Famotidine) during methotrexate administration.',
    alternative: 'Famotidine',
  },
  'linezolid__sertraline': {
    severity: 'contraindicated',
    mechanism: 'Linezolid possesses reversible non-selective MAO inhibition; combined with SSRI produces massive 5-HT accumulation.',
    risk: 'CONTRAINDICATED: Life-threatening Serotonin Syndrome with hyperthermia, seizures, and cardiovascular collapse.',
    action: 'Do NOT co-administer. Discontinue sertraline at least 2 weeks prior, or use an alternative non-MAOI antibiotic.',
    alternative: 'Vancomycin or Daptomycin for MRSA coverage',
  },
  'linezolid__fluoxetine': {
    severity: 'contraindicated',
    mechanism: 'Linezolid MAO inhibition combined with long half-life SSRI fluoxetine triggers massive serotonin toxicity.',
    risk: 'CONTRAINDICATED: Fatal Serotonin Syndrome.',
    action: 'Select alternative antibiotic; fluoxetine wash-out requires up to 5 weeks.',
    alternative: 'Vancomycin / Daptomycin',
  },
  'linezolid__escitalopram': {
    severity: 'contraindicated',
    mechanism: 'Linezolid MAOI activity causes severe serotonin surge when paired with escitalopram.',
    risk: 'CONTRAINDICATED: Acute Serotonin Syndrome.',
    action: 'Select alternative antibiotic not exhibiting MAOI activity.',
    alternative: 'Daptomycin / Vancomycin',
  },
  'colchicine__clarithromycin': {
    severity: 'contraindicated',
    mechanism: 'Clarithromycin strongly inhibits CYP3A4 and P-glycoprotein, preventing colchicine elimination.',
    risk: 'CONTRAINDICATED: Fatal colchicine multi-organ failure, hemorrhagic gastroenteritis, and bone marrow aplasia.',
    action: 'Contraindicated combination, especially in patients with renal or hepatic impairment. Avoid combination completely.',
    alternative: 'Azithromycin or non-macrolide antibiotic',
  },
  'theophylline__ciprofloxacin': {
    severity: 'major',
    mechanism: 'Ciprofloxacin strongly inhibits CYP1A2, reducing theophylline metabolic clearance by 50% to 70%.',
    risk: 'Severe theophylline toxicity: intractable grand mal seizures, fatal ventricular tachyarrhythmias, and severe vomiting.',
    action: 'Reduce theophylline dose by 50% and monitor serum theophylline concentrations closely.',
    alternative: 'Levofloxacin (less potent CYP1A2 inhibitor) or alternative antimicrobial',
  },
  'lisinopril__spironolactone': {
    severity: 'major',
    mechanism: 'Dual suppression of aldosterone action and renal potassium excretion.',
    risk: 'Severe life-threatening hyperkalemia (> 6.0 mEq/L) and fatal cardiac conduction arrest.',
    action: 'Monitor serum potassium and renal function closely; avoid potassium supplements and NSAIDs.',
  },
  'losartan__spironolactone': {
    severity: 'major',
    mechanism: 'Combined AT1 receptor blockade and mineralocorticoid receptor antagonism impairs potassium clearance.',
    risk: 'Severe hyperkalemia and acute renal insufficiency.',
    action: 'Check serum potassium at baseline and within 1 week of initiation.',
  },
  'tacrolimus__clarithromycin': {
    severity: 'major',
    mechanism: 'Clarithromycin strongly inhibits CYP3A4 and P-gp, multiplying tacrolimus whole blood concentrations by 3-5 fold.',
    risk: 'Acute calcineurin inhibitor nephrotoxicity, neurotoxicity, tremors, and severe hypertension.',
    action: 'Avoid combination; if unavoidable, reduce tacrolimus dose by 75% with daily trough level monitoring.',
    alternative: 'Azithromycin (minimal CYP3A4 effect)',
  },
  'tacrolimus__voriconazole': {
    severity: 'major',
    mechanism: 'Voriconazole potently inhibits CYP3A4, causing massive accumulation of tacrolimus.',
    risk: 'Acute irreversible nephrotoxicity, hyperkalemia, and encephalopathy.',
    action: 'Empirically reduce oral tacrolimus dose to one-third of baseline and monitor daily trough levels.',
  },
};

/**
 * Helper to identify narrow therapeutic index drugs
 */
export function isNarrowTherapeuticIndexDrug(drugId: string): boolean {
  const nti = [
    'warfarin',
    'digoxin',
    'tacrolimus',
    'cyclosporine',
    'theophylline',
    'lithium',
    'phenytoin',
    'carbamazepine',
    'methotrexate',
    'levothyroxine',
  ];
  return nti.includes(drugId.toLowerCase());
}

export function isAnticoagulant(drug: Medicine): boolean {
  const ids = ['warfarin', 'rivaroxaban', 'apixaban', 'dabigatran', 'enoxaparin', 'heparin'];
  return (
    ids.includes(drug.id.toLowerCase()) ||
    (drug.drugClass && drug.drugClass.toLowerCase().includes('anticoagulant'))
  );
}

export function isOpioid(drug: Medicine): boolean {
  const ids = ['morphine', 'fentanyl', 'oxycodone', 'methadone', 'tramadol', 'codeine', 'hydromorphone', 'buprenorphine'];
  return (
    ids.includes(drug.id.toLowerCase()) ||
    (drug.drugClass && drug.drugClass.toLowerCase().includes('opioid'))
  );
}

export function isBenzodiazepine(drug: Medicine): boolean {
  const ids = ['alprazolam', 'diazepam', 'clonazepam', 'lorazepam', 'midazolam', 'temazepam', 'triazolam', 'chlordiazepoxide'];
  return (
    ids.includes(drug.id.toLowerCase()) ||
    (drug.drugClass && (drug.drugClass.toLowerCase().includes('anxiolytic') || drug.drugClass.toLowerCase().includes('sedative')))
  );
}

export function isStatin(drug: Medicine): boolean {
  const ids = ['simvastatin', 'atorvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin', 'fluvastatin', 'pitavastatin'];
  return (
    ids.includes(drug.id.toLowerCase()) ||
    (drug.drugClass && drug.drugClass.toLowerCase().includes('statin'))
  );
}

export function isStrongCyp3a4Inhibitor(drug: Medicine): boolean {
  const ids = ['clarithromycin', 'itraconazole', 'ketoconazole', 'voriconazole', 'posaconazole', 'ritonavir'];
  if (ids.includes(drug.id.toLowerCase())) return true;
  return drug.enzymes?.some((e) => e.name === 'CYP3A4' && e.role === 'inhibitor_strong') ?? false;
}

export function isSerotonergic(drug: Medicine): boolean {
  const ids = [
    'fluoxetine',
    'paroxetine',
    'sertraline',
    'citalopram',
    'escitalopram',
    'venlafaxine',
    'duloxetine',
    'tramadol',
    'linezolid',
    'phenelzine',
    'selegiline',
    'amitriptyline',
    'nortriptyline',
  ];
  return (
    ids.includes(drug.id.toLowerCase()) ||
    (drug.drugClass && drug.drugClass.toLowerCase().includes('ssri'))
  );
}

/**
 * Evaluates whether adding a new drug causes severe / contraindicated interactions
 * with the currently active medication regimen.
 */
export function detectSevereInteractionsOnAdd(
  addedDrug: Medicine,
  currentRegimen: Medicine[],
  patientContext?: PatientContext
): SevereInteractionToastAlert[] {
  if (!addedDrug || !currentRegimen || currentRegimen.length === 0) {
    return [];
  }

  const alerts: SevereInteractionToastAlert[] = [];
  const addedId = addedDrug.id.toLowerCase();
  const addedName = addedDrug.genericName.toLowerCase();
  const addedBrands = (addedDrug.brandNames || []).map((b) => b.toLowerCase());

  currentRegimen.forEach((regDrug) => {
    if (regDrug.id === addedDrug.id) return;
    const regId = regDrug.id.toLowerCase();
    const regName = regDrug.genericName.toLowerCase();
    const regBrands = (regDrug.brandNames || []).map((b) => b.toLowerCase());

    // 1. Direct documented interaction in addedDrug
    const directInterAdded = addedDrug.knownInteractions?.find((k) => {
      const p = k.partnerDrug.toLowerCase();
      return (
        p.includes(regName) ||
        regName.includes(p) ||
        regBrands.some((b) => p.includes(b) || b.includes(p)) ||
        p.includes(regId) ||
        regId.includes(p)
      );
    });

    // 2. Direct documented interaction in regDrug
    const directInterReg = regDrug.knownInteractions?.find((k) => {
      const p = k.partnerDrug.toLowerCase();
      return (
        p.includes(addedName) ||
        addedName.includes(p) ||
        addedBrands.some((b) => p.includes(b) || b.includes(p)) ||
        p.includes(addedId) ||
        addedId.includes(p)
      );
    });

    const directInter = directInterAdded || directInterReg;
    if (directInter && (directInter.severity === 'contraindicated' || directInter.severity === 'major')) {
      alerts.push({
        id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
        addedDrug,
        regimenDrug: regDrug,
        severity: directInter.severity,
        title:
          directInter.severity === 'contraindicated'
            ? 'CONTRAINDICATED COMBINATION'
            : 'SEVERE DRUG INTERACTION DETECTED',
        headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
        mechanism: directInter.mechanism,
        clinicalRisk: directInter.clinicalRisk,
        recommendedAction:
          directInter.severity === 'contraindicated'
            ? `Avoid concurrent administration of ${addedDrug.genericName} and ${regDrug.genericName}. Select an alternative therapeutic agent.`
            : `Close clinical monitoring required. Consider empiric dosage adjustment or therapeutic drug monitoring for ${regDrug.genericName}.`,
        evidenceSource: directInterAdded ? addedDrug.evidenceSource : regDrug.evidenceSource,
        timestamp: Date.now(),
      });
      return;
    }

    // 3. High-hazard clinical pairs lookup
    const pairKey = [addedId, regId].sort().join('__');
    const curatedDdi = HIGH_HAZARD_CLINICAL_PAIRS[pairKey];
    if (curatedDdi) {
      alerts.push({
        id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
        addedDrug,
        regimenDrug: regDrug,
        severity: curatedDdi.severity,
        title:
          curatedDdi.severity === 'contraindicated'
            ? 'CONTRAINDICATED COMBINATION'
            : 'SEVERE DRUG INTERACTION DETECTED',
        headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
        mechanism: curatedDdi.mechanism,
        clinicalRisk: curatedDdi.risk,
        recommendedAction: curatedDdi.action,
        suggestedAlternative: curatedDdi.alternative,
        evidenceSource: 'FDA Black Box Warning / CPIC Guidelines',
        timestamp: Date.now(),
      });
      return;
    }

    // 4. Pharmacokinetic Strong CYP Inhibition + Narrow Therapeutic Window
    const strongInhibAdded = addedDrug.enzymes?.find((e) => e.role === 'inhibitor_strong');
    const strongInhibReg = regDrug.enzymes?.find((e) => e.role === 'inhibitor_strong');

    // Case 4a: addedDrug strongly inhibits enzyme that clears regDrug (narrow therapeutic index)
    if (strongInhibAdded) {
      const substrateReg = regDrug.enzymes?.find(
        (e) => e.name === strongInhibAdded.name && e.role === 'substrate'
      );
      if (substrateReg && isNarrowTherapeuticIndexDrug(regDrug.id)) {
        alerts.push({
          id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
          addedDrug,
          regimenDrug: regDrug,
          severity: 'contraindicated',
          title: 'POTENT METABOLIC INHIBITION ALERT',
          headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
          mechanism: `${addedDrug.genericName} is a strong ${strongInhibAdded.name} inhibitor, severely halting metabolic clearance of narrow therapeutic index agent ${regDrug.genericName}.`,
          clinicalRisk: `High hazard of toxic supratherapeutic accumulation of ${regDrug.genericName}, exceeding safety window.`,
          recommendedAction: `Avoid combination or execute aggressive dose reduction of ${regDrug.genericName} with therapeutic concentration monitoring.`,
          timestamp: Date.now(),
        });
        return;
      }
    }

    // Case 4b: regDrug strongly inhibits enzyme that clears addedDrug (narrow therapeutic index)
    if (strongInhibReg) {
      const substrateAdded = addedDrug.enzymes?.find(
        (e) => e.name === strongInhibReg.name && e.role === 'substrate'
      );
      if (substrateAdded && isNarrowTherapeuticIndexDrug(addedDrug.id)) {
        alerts.push({
          id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
          addedDrug,
          regimenDrug: regDrug,
          severity: 'contraindicated',
          title: 'POTENT METABOLIC INHIBITION ALERT',
          headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
          mechanism: `${regDrug.genericName} in current regimen strongly inhibits ${strongInhibReg.name}, preventing elimination of newly added ${addedDrug.genericName}.`,
          clinicalRisk: `Excessive ${addedDrug.genericName} plasma exposure surge leading to rapid toxic accumulation.`,
          recommendedAction: `Select an alternative agent not dependent on ${strongInhibReg.name} clearance.`,
          timestamp: Date.now(),
        });
        return;
      }
    }

    // 5. Dual Full-Dose Anticoagulants
    if (isAnticoagulant(addedDrug) && isAnticoagulant(regDrug)) {
      alerts.push({
        id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
        addedDrug,
        regimenDrug: regDrug,
        severity: 'contraindicated',
        title: 'DUAL FULL-DOSE ANTICOAGULATION ALERT',
        headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
        mechanism:
          'Concomitant administration of multiple systemic anticoagulants provides no additional thrombosis prevention and drastically compounds bleeding hazard.',
        clinicalRisk:
          'Catastrophic major bleeding: fatal gastrointestinal hemorrhage, retroperitoneal bleed, and intracranial hemorrhagic stroke.',
        recommendedAction:
          'Discontinue one anticoagulant agent immediately unless executing a calibrated bridging protocol under telemetry.',
        timestamp: Date.now(),
      });
      return;
    }

    // 6. Opioid + Benzodiazepine (FDA Boxed Warning)
    if (
      (isOpioid(addedDrug) && isBenzodiazepine(regDrug)) ||
      (isBenzodiazepine(addedDrug) && isOpioid(regDrug))
    ) {
      alerts.push({
        id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
        addedDrug,
        regimenDrug: regDrug,
        severity: 'major',
        title: 'FDA BOXED WARNING: CNS / RESPIRATORY DEPRESSION',
        headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
        mechanism:
          'Synergistic central nervous system and medullary respiratory center depression via combined GABA-A receptor potentiation and mu-opioid receptor signaling.',
        clinicalRisk: 'Profound sedation, respiratory arrest, coma, and fatal overdose.',
        recommendedAction:
          'Reserve concomitant prescribing for patients for whom alternative treatment options are inadequate; limit dosages and durations to the minimum required.',
        timestamp: Date.now(),
      });
      return;
    }

    // 7. Statin + Strong CYP3A4 Inhibitor
    if (
      (isStatin(addedDrug) && isStrongCyp3a4Inhibitor(regDrug)) ||
      (isStrongCyp3a4Inhibitor(addedDrug) && isStatin(regDrug))
    ) {
      const statin = isStatin(addedDrug) ? addedDrug : regDrug;
      const inhib = isStatin(addedDrug) ? regDrug : addedDrug;
      if (statin.id === 'simvastatin' || statin.id === 'atorvastatin') {
        alerts.push({
          id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
          addedDrug,
          regimenDrug: regDrug,
          severity: statin.id === 'simvastatin' ? 'contraindicated' : 'major',
          title: 'RHABDOMYOLYSIS & MYOPATHY WARNING',
          headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
          mechanism: `${inhib.genericName} blocks CYP3A4-mediated first-pass and systemic clearance of ${statin.genericName}, surging statin lactone and acid AUC by up to 5-10 fold.`,
          clinicalRisk:
            'Severe rhabdomyolysis, myoglobinuria, severe muscle breakdown, and acute renal failure.',
          recommendedAction:
            statin.id === 'simvastatin'
              ? 'Contraindicated combination. Withhold simvastatin or switch to non-CYP3A4 statin (Pravastatin or Rosuvastatin).'
              : 'Limit atorvastatin dose to max 20 mg daily or choose Pravastatin.',
          timestamp: Date.now(),
        });
        return;
      }
    }

    // 8. Dual Serotonergic Agents (Serotonin Syndrome)
    if (isSerotonergic(addedDrug) && isSerotonergic(regDrug)) {
      const isContra = addedDrug.id === 'linezolid' || regDrug.id === 'linezolid' || addedDrug.id === 'phenelzine' || regDrug.id === 'phenelzine';
      alerts.push({
        id: `toast_${addedDrug.id}_${regDrug.id}_${Date.now()}`,
        addedDrug,
        regimenDrug: regDrug,
        severity: isContra ? 'contraindicated' : 'major',
        title: isContra ? 'CONTRAINDICATED: SEROTONIN CRISIS' : 'SEROTONIN TOXICITY WARNING',
        headline: `${addedDrug.genericName} + ${regDrug.genericName}`,
        mechanism: 'Cumulative intrasynaptic serotonin accumulation via dual serotonergic mechanisms (reuptake inhibition and/or MAO blockade).',
        clinicalRisk: 'Serotonin syndrome: hyperthermia, bilateral clonus, neuromuscular agitation, and autonomic instability.',
        recommendedAction: 'Avoid co-prescribing multiple potent serotonergic agents. Monitor closely for tremors and mental status changes.',
        timestamp: Date.now(),
      });
      return;
    }
  });

  return alerts;
}
