import json
import os
from typing import Any

import requests

GROQ_BASE = "https://api.groq.com/openai/v1"
WHISPER_MODEL = "whisper-large-v3"
CHAT_MODEL = "openai/gpt-oss-120b"


def get_api_key() -> str | None:
    key = os.getenv("EXTERNAL_API_KEY", "").strip()
    return key or None


def _extract_message_content(message: dict) -> str:
    content = message.get("content")
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, str):
                    parts.append(text)
            elif isinstance(part, str):
                parts.append(part)
        return "".join(parts)
    return str(content)


def _post_chat(body: dict) -> str:
    key = get_api_key()
    if not key:
        raise RuntimeError("Missing EXTERNAL_API_KEY")
    r = requests.post(
        f"{GROQ_BASE}/chat/completions",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        data=json.dumps(body),
        timeout=120,
    )
    r.raise_for_status()
    raw = r.json()
    message = raw["choices"][0]["message"]
    if not isinstance(message, dict):
        raise ValueError("Invalid chat message shape")
    out = _extract_message_content(message)
    if not isinstance(out, str):
        raise ValueError("Invalid chat response")
    return out


def transcribe_audio(file_obj, filename: str) -> str:
    key = get_api_key()
    if not key:
        raise RuntimeError("Missing EXTERNAL_API_KEY")
    if hasattr(file_obj, "seek"):
        file_obj.seek(0)
    raw_bytes = file_obj.read()
    mime = getattr(file_obj, "content_type", None) or "application/octet-stream"
    files = {"file": (filename, raw_bytes, mime)}
    data = {"model": WHISPER_MODEL}
    r = requests.post(
        f"{GROQ_BASE}/audio/transcriptions",
        headers={"Authorization": f"Bearer {key}"},
        files=files,
        data=data,
        timeout=120,
    )
    r.raise_for_status()
    out = r.json()
    text = out.get("text")
    if not isinstance(text, str):
        raise ValueError("Invalid transcription response")
    return text


def chat_completion(user_content: str, system_content: str | None = None) -> str:
    messages: list[dict[str, Any]] = []
    if system_content:
        messages.append({"role": "system", "content": system_content})
    messages.append({"role": "user", "content": user_content})
    body = {
        "model": CHAT_MODEL,
        "messages": messages,
        "temperature": 0.2,
    }
    return _post_chat(body)


def suggestions_completion(prompt: str) -> str:
    system = (
        'Return a JSON object with a single key "suggestions" whose value is an array '
        "of exactly 3 objects. Each object must have string fields preview and fullPrompt only. "
        "No markdown or extra keys."
    )
    body = {
        "model": CHAT_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    try:
        return _post_chat(body)
    except requests.HTTPError as exc:
        if exc.response is not None and exc.response.status_code == 400:
            body_retry = {k: v for k, v in body.items() if k != "response_format"}
            return _post_chat(body_retry)
        raise


def parse_suggestions_json(content: str) -> list[dict[str, str]]:
    payload = content.strip()
    if payload.startswith("```"):
        lines = payload.split("\n")
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        payload = "\n".join(lines).strip()
    start = payload.find("{")
    end = payload.rfind("}")
    if start != -1 and end != -1 and end > start:
        payload = payload[start : end + 1]
    obj = json.loads(payload)
    if isinstance(obj, dict) and "suggestions" in obj:
        data = obj["suggestions"]
    elif isinstance(obj, list):
        data = obj
    else:
        raise ValueError("Unexpected JSON shape")
    if not isinstance(data, list) or len(data) != 3:
        raise ValueError("Expected exactly 3 suggestions")
    parsed: list[dict[str, str]] = []
    for item in data:
        if not isinstance(item, dict):
            raise ValueError("Suggestion item must be an object")
        preview = item.get("preview")
        full_prompt = item.get("fullPrompt")
        if full_prompt is None:
            full_prompt = item.get("full_prompt")
        preview_s = str(preview).strip() if preview is not None else ""
        full_s = str(full_prompt).strip() if full_prompt is not None else ""
        if not preview_s or not full_s:
            raise ValueError("Invalid suggestion fields")
        parsed.append({"preview": preview_s, "fullPrompt": full_s})
    return parsed


def fallback_suggestions(transcript: str) -> list[dict[str, str]]:
    ctx = transcript.strip()[:4000] or "No transcript context available."
    preview = ctx[:100] + ("…" if len(ctx) > 100 else "")
    return [
        {"preview": preview, "fullPrompt": ctx},
        {"preview": preview, "fullPrompt": ctx},
        {"preview": preview, "fullPrompt": ctx},
    ]
