package com.iqoo.kavach.data.network

import com.google.gson.annotations.SerializedName

data class ScamAnalysisPayload(
    @SerializedName("event") val event: String = "SCAM_ANALYSIS",
    @SerializedName("type") val type: String = "scam_analysis",
    @SerializedName("call_sid") val callSid: String? = null,
    @SerializedName("call_id") val callId: String? = null,
    @SerializedName("risk_score") val riskScore: Int = 0,
    @SerializedName("risk_level") val riskLevel: String = "LOW",
    @SerializedName("reasons") val reasons: List<String> = emptyList(),
    @SerializedName("timestamp") val timestamp: String? = null
)

data class DemoCallStatusPayload(
    @SerializedName("event") val event: String = "DEMO_CALL_STATUS",
    @SerializedName("type") val type: String = "call_status",
    @SerializedName("call_sid") val callSid: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("call_type") val callType: String? = null
)
