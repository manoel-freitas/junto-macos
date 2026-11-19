#!/usr/bin/env python3
"""Gera conf.yaml no vendor a partir do template v1.2.1 e do overlay Junto."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
VENDOR = ROOT / "vendor" / "Open-LLM-VTuber"
TEMPLATE = VENDOR / "config_templates" / "conf.default.yaml"
OUT = VENDOR / "conf.yaml"

PERSONA = """Você é meu parceiro de foco numa chamada de vídeo. Fale em português, frases curtas.
1. Ao começar, pergunte só: "O que você vai terminar agora?" Se a meta for vaga, peça o primeiro passo concreto.
2. Depois fique em silêncio, trabalhando no seu canto. Não puxe assunto.
3. Só responda se eu falar com você, em no máximo 1 frase, e volte ao silêncio.
4. Quando eu disser "acabei", pergunte: "Saiu? Sim, parcial ou não?" e encerre com 1 frase gentil, sem cobrança.
"""


def main() -> int:
    if not TEMPLATE.is_file():
        print(f"Template ausente: {TEMPLATE}", file=sys.stderr)
        return 1
    data = yaml.safe_load(TEMPLATE.read_text(encoding="utf-8"))
    cc = data.setdefault("character_config", {})
    cc["conf_name"] = "junto"
    cc["conf_uid"] = "junto_001"
    cc["live2d_model_name"] = "mao_pro"
    cc["character_name"] = "Junto"
    cc["human_name"] = "Você"
    cc["persona_prompt"] = PERSONA

    agent = cc.setdefault("agent_config", {})
    settings = agent.setdefault("agent_settings", {}).setdefault("basic_memory_agent", {})
    settings["llm_provider"] = (
        "openai_compatible_llm"
        if os.environ.get("OPENROUTER_API_KEY")
        else "ollama_llm"
    )
    settings["use_mcpp"] = False
    settings["mcp_enabled_servers"] = []

    llm = agent.setdefault("llm_configs", {})
    ollama = llm.setdefault("ollama_llm", {})
    ollama["base_url"] = "http://127.0.0.1:11434/v1"
    ollama["model"] = os.environ.get("OLLAMA_MODEL", "qwen2.5:latest")

    if os.environ.get("OPENROUTER_API_KEY"):
        oai = llm.setdefault("openai_compatible_llm", {})
        oai["base_url"] = "https://openrouter.ai/api/v1"
        oai["llm_api_key"] = os.environ["OPENROUTER_API_KEY"]
        oai["model"] = os.environ.get("OPENROUTER_MODEL", "anthropic/claude-3.5-haiku")

    tts = cc.setdefault("tts_config", {})
    tts["tts_model"] = "edge_tts"
    edge = tts.setdefault("edge_tts", {})
    edge["voice"] = "pt-BR-FranciscaNeural"

    sys_cfg = data.setdefault("system_config", {})
    sys_cfg["host"] = "127.0.0.1"
    sys_cfg["port"] = 12393

    OUT.write_text(yaml.dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
    print(f"Wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())