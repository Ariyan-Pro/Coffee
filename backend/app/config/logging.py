"""Logging configuration.

`setup_logging` installs a handler that emits one JSON object per line so
logs are directly consumable by aggregators (Loki, CloudWatch, etc.) without
a separate parser. When `LOG_FORMAT=plain` it falls back to human-readable
lines for local development.
"""

import json
import logging
import sys

from app.config.settings import settings


class JsonFormatter(logging.Formatter):
    """Emit a single JSON object per log record."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        extra = getattr(record, "extra_fields", None)
        if extra:
            payload.update(extra)
        return json.dumps(payload, default=str)


class ExtraFieldsLogRecord(logging.LogRecord):
    """Allow `extra={"request_id": ...}` to reach the formatter."""

    def getMessage(self) -> str:
        self.extra_fields = {
            k: v for k, v in self.__dict__.items()
            if k not in logging.LogRecord.__dict__
        }
        return super().getMessage()


def setup_logging() -> None:
    """Configure the root logger once per process."""
    logging.setLogRecordFactory(ExtraFieldsLogRecord)
    root = logging.getLogger()
    if getattr(root, "_coffee_configured", False):
        return
    root.setLevel(settings.LOG_LEVEL.upper())

    handler = logging.StreamHandler(sys.stdout)
    if settings.LOG_FORMAT.lower() == "json":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
        )
    root.handlers = [handler]
    root._coffee_configured = True  # type: ignore[attr-defined]
