import unittest

from backend.scam_analysis import analyze_transcript


class ScamAnalysisTests(unittest.TestCase):
    def test_genuine_text_is_low_risk(self) -> None:
        result = analyze_transcript(
            "Please verify this service request in the official banking application."
        )
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["risk_level"], "LOW")
        self.assertEqual(result["detected_indicators"], [])

    def test_multiple_scam_indicators_are_combined(self) -> None:
        result = analyze_transcript(
            "I am from the police. Send money immediately and share your OTP."
        )
        self.assertGreaterEqual(result["risk_score"], 50)
        self.assertIn("OTP request", result["detected_indicators"])
        self.assertIn("Payment request", result["detected_indicators"])
        self.assertIn("Urgency", result["detected_indicators"])

    def test_score_is_capped(self) -> None:
        result = analyze_transcript(
            "police cyber crime urgent immediately otp password pin bank account "
            "transfer money send money install anydesk aadhaar account blocked"
        )
        self.assertEqual(result["risk_score"], 100)
        self.assertEqual(result["risk_level"], "CRITICAL")


if __name__ == "__main__":
    unittest.main()
