import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import TestCallRequest

cases = [
    {"phoneNumber": "+919876543210", "customMessage": "Hello from Android"},
    {"phone_number": "+919876543210", "custom_message": "Hello from browser"},
]

for idx, payload in enumerate(cases, start=1):
    parsed = TestCallRequest.model_validate(payload)
    print(f"case {idx}: phone={parsed.phone_number}, custom={parsed.custom_message}")
