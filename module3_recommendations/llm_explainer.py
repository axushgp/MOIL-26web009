"""Optional Ollama phrasing layer; it receives an already-decided action."""

from __future__ import annotations

import json
import os
from urllib import request


def explain_in_natural_language(recommendation: dict, mine_context: dict) -> str:
    prompt = f"""You are writing a short operational note for MOIL mine planning staff.
Do not invent facts beyond the supplied fields.
Mine: {mine_context['name']} ({mine_context['district']})
Recommended action: {recommendation['action']}
Reasoning: {recommendation['detail']}
Driver identified: {recommendation['driver']}
Write a 2-3 sentence plain-English note. Do not add numbers, dates, or facts."""
    url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    model = os.getenv("OLLAMA_MODEL", "llama3:8b")
    payload = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode()
    try:
        with request.urlopen(
            request.Request(url, data=payload, headers={"Content-Type": "application/json"}),
            timeout=20,
        ) as response:
            body = json.loads(response.read().decode())
    except Exception as exc:
        raise RuntimeError(
            "Ollama is unavailable. Install Ollama, run 'ollama pull llama3:8b', "
            "and retry; the deterministic recommendation remains the source of truth."
        ) from exc
    text = body.get("response")
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("Ollama returned no explanation text.")
    return text.strip()