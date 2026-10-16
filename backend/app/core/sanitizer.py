# pyrefly: ignore-errors
# type: ignore
import html
import re
from typing import Any, Dict, List, Union

DANGEROUS_TAGS_PATTERN = re.compile(
    r'<\s*(script|iframe|object|embed|applet|meta|link|style|form|base)[^>]*>.*?<\s*/\s*\1\s*>',
    re.IGNORECASE | re.DOTALL
)

SELF_CLOSING_DANGEROUS_TAGS = re.compile(
    r'<\s*(script|iframe|object|embed|applet|meta|link|style|base|input)[^>]*\/?>',
    re.IGNORECASE
)

EVENT_HANDLERS_PATTERN = re.compile(
    r'\b(on\w+)\s*=\s*(".*?"|\'.*?\'|[^\s>]+)',
    re.IGNORECASE
)

JS_SCHEMES_PATTERN = re.compile(
    r'\b(javascript|vbscript|data):',
    re.IGNORECASE
)

def sanitize_string(value: str, escape_all_html: bool = False) -> str:
    """
    Sanitize a user-provided string against Cross-Site Scripting (XSS).
    Strips executable scripts, injected iframes, event handlers, and malicious protocols.
    """
    if not isinstance(value, str):
        return value

    # 1. Remove dangerous script and iframe blocks
    cleaned = DANGEROUS_TAGS_PATTERN.sub('', value)
    cleaned = SELF_CLOSING_DANGEROUS_TAGS.sub('', cleaned)

    # 2. Remove dangerous inline event handlers like onload, onerror, onclick
    cleaned = EVENT_HANDLERS_PATTERN.sub('', cleaned)

    # 3. Disarm dangerous URI schemes
    cleaned = JS_SCHEMES_PATTERN.sub('blocked:', cleaned)

    if escape_all_html:
        cleaned = html.escape(cleaned)

    return cleaned.strip()

def sanitize_payload(data: Union[Dict, List, str, Any]) -> Any:
    """
    Recursively walk through a dictionary or list and sanitize all string values.
    """
    if isinstance(data, dict):
        return {k: sanitize_payload(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_payload(item) for item in data]
    elif isinstance(data, str):
        return sanitize_string(data)
    return data
