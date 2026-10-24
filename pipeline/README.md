# PolyPharm-Twin: Biomedical LLM Domain Adaptation & Training Pipeline

This directory provides the complete, reproducible training, evaluation, and retrieval-augmented generation (RAG) pipeline for domain-adapting open-weight Large Language Models for the **PolyPharm-Twin** multi-drug simulation engine.

---

## 1. Hardware Requirements & VRAM Budget Analysis

| Hardware | VRAM | Recommended Precision | Batch Size | Feasibility |
| :--- | :---: | :---: | :---: | :--- |
| **NVIDIA RTX 3060 / 4060** | 12 GB | 4-bit QLoRA (NF4) | 1 (GradAccum 16) | Fully Supported |
| **NVIDIA RTX 3090 / 4090** | 24 GB | 4-bit or 8-bit QLoRA | 4 (GradAccum 4) | High Throughput |
| **NVIDIA A100 / H100** | 80 GB | FP16 / BF16 Full LoRA | 16 (GradAccum 2) | Ultra-Fast Research |
| **CPU Only (x86_64)** | 32 GB RAM | 4-bit GGUF / Simulated | 1 | Dry-run / Evaluation |

---

## 2. Windows PowerShell Setup & Execution Guide

Follow these exact commands in **Windows PowerShell (Run as Administrator or standard user)**:

### Step 1: Create Virtual Environment
```powershell
# Navigate to project pipeline directory
cd "C:\path\to\PolyPharm-Twin\pipeline"

# Initialize Python 3.10+ virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
```

### Step 2: Install PyTorch with CUDA Support
```powershell
# Install PyTorch with CUDA 12.1 support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### Step 3: Install Hugging Face & Fine-Tuning Dependencies
```powershell
# Install transformers, PEFT, TRL, bitsandbytes, and dataset tools
pip install transformers==4.44.2 peft==0.12.0 trl==0.9.6 bitsandbytes==0.43.3 datasets==2.21.0 accelerate==0.34.2
pip install sentencepiece protobuf scipy scikit-learn
```

### Step 4: Run Data Ingestion & Preprocessing
```powershell
# Ingests TwoSIDES, DrugBank, and CPIC records; prevents train/test combination leakage
python prepare_datasets.py
```

### Step 5: Execute QLoRA Domain Adaptation Training
```powershell
# Starts 4-bit NF4 parameter-efficient fine-tuning with checkpoint saving and loss logging
python train_lora.py
```

### Step 6: Run Independent Evaluation Harness
```powershell
# Evaluates factual correctness, citation recall, hallucination rate, and AUROC
python evaluate_model.py
```

### Step 7: Test RAG Evidence Retrieval
```powershell
# Runs hybrid BM25 + dense embedding query
python rag_engine.py
```

---

## 3. Linux / WSL2 Setup Commands

```bash
# Activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install CUDA PyTorch and libraries
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers peft trl bitsandbytes datasets accelerate scikit-learn

# Run pipeline
python3 prepare_datasets.py
python3 train_lora.py
python3 evaluate_model.py
```

---

## 4. Pipeline Components

1. **`config.json`**: Hyperparameters, LoRA rank ($r=16$, $\alpha=32$), learning rate, and model identifiers (`meta-llama/Llama-3.1-8B-Instruct` or `Qwen/Qwen2.5-7B-Instruct`).
2. **`sample_biomedical_dataset.json`**: Curated instruction-response examples in English and Tamil with verifiable DrugBank/TwoSIDES/CPIC citations.
3. **`prepare_datasets.py`**: Tokenization checks, PII sanitization, cluster-based drug combination splits.
4. **`train_lora.py`**: Quantization-aware training using Hugging Face `SFTTrainer`.
5. **`evaluate_model.py`**: Multi-dimensional evaluation harness comparing Base LLM vs Adapted Model vs RAG Agent.
6. **`rag_engine.py`**: Real-time evidence grounding engine returning verifiable citations and flagging missing data.
7. **`model_card.md`**: Comprehensive model documentation and safety specifications.
