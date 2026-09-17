from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Indicator:
    name: str
    weight: int
    phrases: tuple[str, ...]


INDICATORS = (
    Indicator("OTP request", 25, ("one-time password", "one time password", "otp", "verification code")),
    Indicator("Password/PIN request", 20, ("password", "passcode", "pin", "security code")),
    Indicator("Financial impersonation", 20, ("bank account", "bank security", "account verification", "security verification")),
    Indicator("Government/police impersonation", 15, ("police", "cyber crime", "government", "tax department", "security officer")),
    Indicator("Urgency", 10, ("immediately", "right now", "today", "urgent", "within the hour")),
    Indicator("Account blocking threat", 15, ("account will be blocked", "account blocked", "suspend your account", "account suspension")),
    Indicator("Payment request", 15, ("transfer money", "send money", "make a payment", "pay a fee")),
    Indicator("Remote-access request", 15, ("install anydesk", "install teamviewer", "remote access", "share your screen")),
    Indicator("Sensitive personal information request", 15, ("date of birth", "social security", "aadhaar", "card number", "personal information")),
    Indicator("Credential verification request", 15, ("complete verification", "verify your identity", "confirm your credentials", "verification officer")),
)


def analyze_transcript(transcript: str) -> dict:
    normalized = " ".join(transcript.lower().split())
    detected: list[str] = []
    score = 0

    for indicator in INDICATORS:
        if any(phrase in normalized for phrase in indicator.phrases):
            detected.append(indicator.name)
            score += indicator.weight

    score = min(100, score)
    level = "CRITICAL" if score >= 75 else "HIGH" if score >= 50 else "MEDIUM" if score >= 25 else "LOW"
    confidence = round(min(0.99, 0.35 + (len(detected) * 0.08)), 2) if detected else 0.0
    return {
        "risk_score": score,
        "risk_level": level,
        "detected_indicators": detected,
        "confidence": confidence,
        "transcript": transcript,
    }
