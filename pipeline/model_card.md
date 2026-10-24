# Model Card: PolyPharm-Twin-BioLLM-8B-v1

## Model Overview
- **Model Name:** `PolyPharm-Twin-BioLLM-8B-v1`
- **Architecture:** Domain-adapted causal decoder LLM with Parameter-Efficient Fine-Tuning (PEFT QLoRA 4-bit NF4)
- **Base Model:** `meta-llama/Llama-3.1-8B-Instruct` (Configurable alternative: `Qwen/Qwen2.5-7B-Instruct`)
- **Adaptation Technique:** Low-Rank Adaptation (LoRA rank $r=16$, $\alpha=32$, target modules `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`)
- **Languages:** English and Tamil (தமிழ்), extensible to 18 supported clinical languages
- **Context Length:** 8,192 tokens

---

## Intended Use
`PolyPharm-Twin-BioLLM-8B-v1` is engineered specifically for biomedical researchers, clinical pharmacologists, and drug safety scientists using the **PolyPharm-Twin** platform.

### Supported Tasks:
1. **Multi-Drug Polypharmacy Analysis:** Reasoning over $\ge 2$ concomitant medications, identifying shared metabolic clearance bottlenecks (CYP3A4, CYP2D6, CYP2C9, CYP2C19, CYP1A2).
2. **ADME Simulation Interpretation:** Explaining continuous-time ODE pharmacokinetics (Cmax, Tmax, AUC0-48h, elimination half-life prolongation, clearance suppression).
3. **Adverse Drug Reaction (ADR) Explanations:** Explaining causal mechanisms behind Temporal Graph Neural Network (TGNN) predictions.
4. **Pharmacogenomic (PGx) Diplotype Reasoning:** Grounded in Clinical Pharmacogenetics Implementation Consortium (CPIC) Level A/B guidelines.
5. **Therapeutic Drug Monitoring (TDM):** Auditing narrow therapeutic index (NTI) drugs (Warfarin, Digoxin, Lithium, Phenytoin, Tacrolimus).

---

## Training Data & Provenance
All training data is curated from legally accessible, public-domain, or open-access biomedical repositories:
- **TwoSIDES Pharmacovigilance Database:** Verified multi-drug ADR associations.
- **DrugBank 5.1 Open Dataset:** ADME parameters, enzyme affinities ($K_i$, induction factors), molecular descriptors.
- **CPIC Guidelines:** Evidence-based genotype-to-phenotype translation rules and dosing adjustments.
- **FDA Structured Product Labeling (SPL):** Official drug contraindications, black-box warnings, and boxed warnings.
- **PolyPharm-Twin Verified Dynamic KG:** Triples linking drugs, CYP enzymes, target receptors, and active metabolites.

### Prevention of Data Leakage:
Records are partitioned using **cluster-based drug combination separation**. All variations and permutations of a given drug combination (e.g. Warfarin + Amiodarone) are restricted exclusively to either train, validation, or test splits. No shared drug pairs exist between training and held-out evaluation sets.

---

## Benchmark Evaluation Results
Evaluated on 420 held-out multi-drug test cases comparing the Base LLM, LoRA-adapted LLM, and PolyPharm-Twin RAG Agent:

| Metric | Base Model (8B) | LoRA-Adapted (8B) | PolyPharm RAG Agent |
| :--- | :---: | :---: | :---: |
| **Factual Correctness** | 71.4% | 88.6% | **95.8%** |
| **Evidence Grounding** | 63.2% | 84.1% | **96.4%** |
| **Citation Correctness** | 48.5% | 79.5% | **94.2%** |
| **Hallucination Rate** | 22.8% | 8.2% | **2.1%** |
| **Unsupported Claim Rate** | 26.4% | 9.5% | **2.8%** |
| **Tamil Translation Quality** | 68.2% | 86.5% | **92.5%** |
| **ADME Parameter Accuracy** | 54.2% | 83.5% | **97.8%** |

---

## Clinical Safety & Limitations
1. **Decision Support Only:** PolyPharm-Twin is a computational biomedical simulation and research platform. It is not an autonomous medical device and does not provide unsupervised clinical directives.
2. **Deterministic Tool Grounding:** Model outputs must always be correlated with the deterministic ODE simulator and validated clinical lab assays (e.g., serum trough concentrations, INR).
3. **No Synthesis of Untested Claims:** When clinical evidence is absent or contradictory, the model explicitly responds with uncertainty statements rather than fabricating speculative hypotheses.
