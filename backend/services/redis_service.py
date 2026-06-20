"""
Redis integration for:
  - Provider cache (by zip code, TTL 24 hours)
  - Chat conversation history (by session_id, TTL 24 hours)

When REDIS_URL is not configured, uses an in-memory dict as a fallback
so the app still works locally without Redis running.
"""

import json
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# ---------------------------------------------------------------------------
# Redis client (lazy init)
# ---------------------------------------------------------------------------

_redis_client = None
_use_fallback = False
_fallback_store: dict[str, str] = {}
_fallback_expiry: dict[str, float] = {}

import time as _time


def _get_redis():
    """Lazy-init Redis connection. Falls back to in-memory dict if unavailable."""
    global _redis_client, _use_fallback

    if _redis_client is not None or _use_fallback:
        return _redis_client

    try:
        import redis

        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        _redis_client.ping()  # test connection
        print(f"[redis] Connected to {REDIS_URL}")
    except Exception as exc:
        print(f"[redis] Not available ({exc}) — using in-memory fallback")
        _use_fallback = True
        _redis_client = None

    return _redis_client


# ---------------------------------------------------------------------------
# Provider cache
# ---------------------------------------------------------------------------


def get_cached_providers(zip_code: str) -> list[dict] | None:
    """Return cached providers for a zip code, or None if no cache hit."""
    r = _get_redis()
    key = f"providers:{zip_code}"

    if _use_fallback:
        raw = _fallback_store.get(key)
        if raw is None:
            return None
        # check expiry
        if _time.time() > _fallback_expiry.get(key, 0):
            del _fallback_store[key]
            return None
        return json.loads(raw)

    if r is None:
        return None
    raw = r.get(key)
    return json.loads(raw) if raw else None


def set_cached_providers(zip_code: str, providers: list[dict], ttl: int = 86400):
    """Cache provider results for a zip code (default TTL: 24 hours)."""
    r = _get_redis()
    key = f"providers:{zip_code}"
    value = json.dumps(providers)

    if _use_fallback:
        _fallback_store[key] = value
        _fallback_expiry[key] = _time.time() + ttl
        return

    if r:
        r.set(key, value, ex=ttl)


# ---------------------------------------------------------------------------
# Chat history
# ---------------------------------------------------------------------------


def get_chat_history(session_id: str) -> list[dict]:
    """Retrieve chat history for a session. Returns a list of message dicts."""
    r = _get_redis()
    key = f"chat:{session_id}"

    if _use_fallback:
        raw = _fallback_store.get(key, "[]")
        return json.loads(raw)

    if r is None:
        return []
    raw = r.get(key)
    return json.loads(raw) if raw else []


def set_chat_history(session_id: str, history: list[dict], ttl: int = 86400):
    """Persist chat history for a session (default TTL: 24 hours)."""
    r = _get_redis()
    key = f"chat:{session_id}"
    value = json.dumps(history)

    if _use_fallback:
        _fallback_store[key] = value
        _fallback_expiry[key] = _time.time() + ttl
        return

    if r:
        r.set(key, value, ex=ttl)


def append_chat_message(session_id: str, role: str, content: str):
    """Append a single message to the session's chat history."""
    history = get_chat_history(session_id)
    history.append({"role": role, "content": content})
    set_chat_history(session_id, history)
