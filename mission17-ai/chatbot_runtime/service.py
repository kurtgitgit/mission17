"""HTTP-independent request handling for the bundled BrgyLink chatbot."""

import re
import threading
import time
from collections import OrderedDict

from .smart_classifier import (
    MODEL_VERSION,
    handle_message,
    load_model,
    new_session,
)


LANG_ALIASES = {
    "en": "english",
    "english": "english",
    "fil": "tagalog",
    "tl": "tagalog",
    "tagalog": "tagalog",
    "ilo": "ilocano",
    "ilocano": "ilocano",
    "pag": "pangasinan",
    "pangasinan": "pangasinan",
}
LANG_DISPLAY = {
    "pangasinan": "Pangasinan",
    "ilocano": "Ilocano",
    "tagalog": "Tagalog / Filipino",
    "english": "English",
}
SESSION_ID_PATTERN = re.compile(r"[A-Za-z0-9_.-]{1,128}")


class ChatService:
    """Bounded in-memory chat state around the safety-constrained classifier."""

    max_message_length = 2000
    max_sessions = 1000
    session_ttl_seconds = 3600

    def __init__(self):
        self.model = load_model()
        self.sessions = OrderedDict()
        self.session_last_seen = {}
        self.lock = threading.Lock()

    def clear_sessions(self):
        with self.lock:
            self.sessions.clear()
            self.session_last_seen.clear()

    def _prune_sessions(self, now):
        expired = [
            key for key, seen in self.session_last_seen.items()
            if now - seen >= self.session_ttl_seconds
        ]
        for key in expired:
            self.sessions.pop(key, None)
            self.session_last_seen.pop(key, None)
        while len(self.sessions) >= self.max_sessions:
            key, _session = self.sessions.popitem(last=False)
            self.session_last_seen.pop(key, None)

    def respond(self, payload):
        """Return a stable (status_code, JSON-safe payload) response tuple."""
        if not isinstance(payload, dict):
            return 400, {"error": "A JSON object is required."}

        message = payload.get("message")
        if not isinstance(message, str) or not message.strip():
            return 400, {"error": "Please enter a question or message."}
        message = message.strip()
        if len(message) > self.max_message_length:
            return 400, {"error": f"Messages must be at most {self.max_message_length} characters."}

        session_id = payload.get("session_id")
        if session_id is not None and (
            not isinstance(session_id, str) or not SESSION_ID_PATTERN.fullmatch(session_id)
        ):
            return 400, {
                "error": "Use a non-personal session_id of 1 to 128 letters, digits, dots, underscores or hyphens."
            }

        language = payload.get("language")
        if language is not None:
            if not isinstance(language, str) or language.lower().strip() not in LANG_ALIASES:
                return 400, {"error": "Unsupported language."}
            language = LANG_ALIASES[language.lower().strip()]

        try:
            started_at = time.time()
            with self.lock:
                now = time.monotonic()
                if session_id and session_id not in self.sessions:
                    self._prune_sessions(now)
                    self.sessions[session_id] = new_session()
                elif session_id and now - self.session_last_seen.get(session_id, 0) >= self.session_ttl_seconds:
                    self.sessions[session_id] = new_session()

                chat_session = self.sessions[session_id] if session_id else new_session()
                if session_id:
                    self.sessions.move_to_end(session_id)
                    self.session_last_seen[session_id] = now
                if language:
                    chat_session["preferred_language"] = language
                result = handle_message(message, session=chat_session, model=self.model)

            detected_language = result.get("language", "english")
            return 200, {
                "response": result["response"],
                "intent": result.get("intent", "unknown"),
                "confidence": result.get("similarity", 1.0),
                "language": detected_language,
                "language_name": LANG_DISPLAY.get(detected_language, detected_language.capitalize()),
                "processing_time_ms": round((time.time() - started_at) * 1000, 2),
                "model_version": MODEL_VERSION,
            }
        except Exception:
            return 500, {"error": "Failed to process chat message. Please try again."}
