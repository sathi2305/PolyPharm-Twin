#!/usr/bin/env python3
"""
PolyPharm-Twin Domain-Adapted LLM Fine-Tuning Pipeline
Phase 4 Implementation:
- Parameter-Efficient Fine-Tuning (PEFT) using QLoRA 4-bit NF4 Quantization
- Hugging Face Transformers + TRL SFTTrainer
- Supports Meta-Llama-3.1-8B-Instruct and Qwen2.5-7B-Instruct (bilingual Tamil + English)
- Hardware checks: GPU VRAM compatibility (CUDA) with CPU fallback check
- Strict checkpoint saving, loss tracking, and reproducible seeds
"""

import os
import sys
import json
import torch
from dataclasses import dataclass, field
from typing import Optional, Dict, Any

# Ensure Hugging Face libraries can be imported
try:
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        TrainingArguments,
        set_seed,
    )
    from peft import (
        LoraConfig,
        get_peft_model,
        prepare_model_for_kbit_training,
        TaskType,
    )
    from datasets import load_dataset
    from trl import SFTTrainer
    HF_AVAILABLE = True
except ImportError as e:
    HF_AVAILABLE = False
    HF_IMPORT_ERROR = str(e)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
DATA_DIR = os.path.join(os.path.dirname(__file__), "processed_data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "lora_checkpoints")

def load_config() -> Dict[str, Any]:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def check_hardware_compatibility():
    print("=" * 60)
    print("[PolyPharm-Twin] Hardware & CUDA Compatibility Audit")
    print("=" * 60)
    print(f"Python Version : {sys.version.split()[0]}")
    print(f"PyTorch Version: {torch.__version__}")
    
    cuda_available = torch.cuda.is_available()
    print(f"CUDA Available : {cuda_available}")

    if cuda_available:
        device_count = torch.cuda.device_count()
        device_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"Active GPU     : {device_name} (Total: {device_count})")
        print(f"Total VRAM     : {vram_gb:.2f} GB")
        
        if vram_gb < 8.0:
            print("[Warning] Available VRAM is below 8 GB. QLoRA 4-bit requires at least 8-10 GB for batch_size=1.")
        elif vram_gb < 16.0:
            print("[Optimal] VRAM 8-16 GB detected. Suitable for QLoRA 4-bit with gradient checkpointing.")
        else:
            print("[High-Performance] VRAM > 16 GB detected. Full 8-bit or 4-bit LoRA with batch_size >= 4 supported.")
    else:
        print("[Notice] No CUDA GPU detected. Training will run in simulated dry-run or low-precision CPU mode.")
    print("=" * 60)

def format_instruction_prompt(example: Dict[str, Any]) -> str:
    """Formats raw example into LLM chat / instruction template."""
    instruction = example.get("instruction", "")
    user_input = example.get("input", "")
    response = example.get("response", "")

    prompt = (
        f"<|im_start|>system\n"
        f"You are PolyPharm AI, an expert clinical pharmacoinformatics and biomedical digital twin assistant. "
        f"Ground all recommendations in verified pharmacokinetics, CPIC guidelines, and adverse drug reaction evidence.<|im_end|>\n"
        f"<|im_start|>user\n"
        f"{instruction}\n"
    )
    if user_input:
        prompt += f"\nContext:\n{user_input}\n"
    prompt += f"<|im_end|>\n<|im_start|>assistant\n{response}<|im_end|>"
    return prompt

def run_training():
    check_hardware_compatibility()
    config = load_config()
    set_seed(config["training"].get("seed", 42))

    if not HF_AVAILABLE:
        print(f"[Notice] Hugging Face ecosystem libraries are not yet installed in local environment: {HF_IMPORT_ERROR}")
        print("[Notice] Please follow instructions in pipeline/README.md to install transformers, peft, and bitsandbytes.")
        return

    model_id = config["base_model"]["model_id"]
    print(f"[PolyPharm-Twin] Loading base model: {model_id} (Configurable identifier)")

    # 4-bit Quantization Configuration
    compute_dtype = getattr(torch, config["base_model"].get("bnb_4bit_compute_dtype", "bfloat16"))
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type=config["base_model"].get("bnb_4bit_quant_type", "nf4"),
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_use_double_quant=config["base_model"].get("use_double_quant", True),
    )

    # Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Model
    device_map = "auto" if torch.cuda.is_available() else "cpu"
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config if torch.cuda.is_available() else None,
        device_map=device_map,
        trust_remote_code=True,
    )

    if torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    # PEFT LoRA Config
    lora_cfg = config["peft_lora"]
    peft_config = LoraConfig(
        r=lora_cfg["r"],
        lora_alpha=lora_cfg["lora_alpha"],
        lora_dropout=lora_cfg["lora_dropout"],
        bias=lora_cfg["bias"],
        task_type=TaskType.CAUSAL_LM,
        target_modules=lora_cfg["target_modules"],
    )

    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # Load Processed Datasets
    train_file = os.path.join(DATA_DIR, "train.json")
    val_file = os.path.join(DATA_DIR, "val.json")

    dataset = load_dataset("json", data_files={"train": train_file, "val": val_file})
    print(f"[Info] Training set: {len(dataset['train'])} examples, Validation set: {len(dataset['val'])} examples")

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=config["training"]["batch_size_per_device"],
        gradient_accumulation_steps=config["training"]["gradient_accumulation_steps"],
        learning_rate=config["training"]["learning_rate"],
        weight_decay=config["training"]["weight_decay"],
        max_grad_norm=config["training"]["max_grad_norm"],
        num_train_epochs=config["training"]["num_train_epochs"],
        lr_scheduler_type=config["training"]["lr_scheduler_type"],
        warmup_ratio=config["training"]["warmup_ratio"],
        logging_steps=config["training"]["logging_steps"],
        eval_strategy="steps",
        eval_steps=config["training"]["eval_steps"],
        save_strategy="steps",
        save_steps=config["training"]["save_steps"],
        save_total_limit=config["training"]["save_total_limit"],
        bf16=torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False,
        fp16=False,
        report_to="none",
        seed=config["training"]["seed"],
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset["train"],
        eval_dataset=dataset["val"],
        peft_config=peft_config,
        formatting_func=format_instruction_prompt,
        max_seq_length=config["dataset"]["max_seq_length"],
        tokenizer=tokenizer,
        args=training_args,
    )

    print("[PolyPharm-Twin] Commencing LoRA training loop...")
    trainer.train()

    print(f"[PolyPharm-Twin] Training complete. Saving LoRA adapter checkpoint to {OUTPUT_DIR}")
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("[PolyPharm-Twin] Pipeline executed successfully.")

if __name__ == "__main__":
    run_training()
