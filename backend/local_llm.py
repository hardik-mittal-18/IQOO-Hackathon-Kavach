import json
import logging
import os
from typing import AsyncGenerator
import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger("kavach.llm")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")


class LLMAnalyzeRequest(BaseModel):
    transcript: str = Field(..., min_length=1, description="Call or chat transcript to analyze")
    language: str = Field("English", description="Response language: English or Hindi")
    model: str = Field(DEFAULT_MODEL, description="Ollama model tag to use")


async def check_ollama_status() -> dict:
    """Checks whether the local Ollama daemon is reachable and whether the model is available."""
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                model_ready = any(DEFAULT_MODEL in m for m in models)
                return {
                    "online": True,
                    "ollama_url": OLLAMA_BASE_URL,
                    "target_model": DEFAULT_MODEL,
                    "installed_models": models,
                    "model_ready": model_ready,
                    "status_text": "Running locally on-device" if model_ready else f"Ollama online, but '{DEFAULT_MODEL}' not pulled",
                    "instruction": "" if model_ready else f"Run: ollama pull {DEFAULT_MODEL}",
                }
    except Exception as exc:
        logger.debug("Ollama status check failed: %s", exc)

    return {
        "online": False,
        "ollama_url": OLLAMA_BASE_URL,
        "target_model": DEFAULT_MODEL,
        "installed_models": [],
        "model_ready": False,
        "status_text": "Offline / Not Running",
        "instruction": f"Start Ollama and run: ollama run {DEFAULT_MODEL}",
    }


def build_system_prompt(language: str) -> str:
    lang_inst = (
        "Respond strictly in Hindi (Devanagari script)."
        if language.lower() == "hindi"
        else "Respond in concise English."
    )
    return (
        "You are Kavach On-Device Security Intel, an offline cyber-safety assistant running locally on the user's laptop.\n"
        f"{lang_inst}\n"
        "Your task is to analyze the suspicious call/message transcript provided by the user.\n"
        "Keep each section brief, clear, and direct (max 2-3 short bullet points or sentences per section) "
        "to ensure low latency on local CPU inference.\n\n"
        "Format your answer using EXACTLY these three headings:\n"
        "### 1. Threat Explanation\n"
        "(Explain what psychological coercion or scam trick is being used, e.g. digital arrest, urgency, impersonation)\n\n"
        "### 2. What to Say Right Now\n"
        "(Provide 1 or 2 exact sentences the victim should speak or send right now to de-escalate and hang up safely)\n\n"
        "### 3. Draft Incident Complaint\n"
        "(A 2-sentence summary ready for reporting to the Cyber Crime Portal 1930 / cybercrime.gov.in)"
    )


async def stream_ollama_analysis(
    transcript: str, language: str = "English", model: str = DEFAULT_MODEL
) -> AsyncGenerator[str, None]:
    """Streams token by token from Ollama generating explainable scam analysis."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": build_system_prompt(language)},
            {
                "role": "user",
                "content": f"Analyze this transcript:\n\"\"\"{transcript}\"\"\"",
            },
        ],
        "stream": True,
        "options": {
            "temperature": 0.2,
            "num_predict": 300,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload
            ) as response:
                if response.status_code != 200:
                    err_msg = f"Ollama error {response.status_code}: Make sure '{model}' is installed."
                    yield f"data: {json.dumps({'error': err_msg, 'done': True})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        done = chunk.get("done", False)
                        if content or done:
                            yield f"data: {json.dumps({'token': content, 'done': done})}\n\n"
                        if done:
                            break
                    except json.JSONDecodeError:
                        continue
    except httpx.ConnectError:
        err = f"OFFLINE / NOT RUNNING. Start Ollama and run: ollama run {model}"
        yield f"data: {json.dumps({'error': err, 'done': True})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
