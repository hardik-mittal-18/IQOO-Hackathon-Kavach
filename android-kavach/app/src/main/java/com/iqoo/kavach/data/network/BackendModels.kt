package com.iqoo.kavach.data.network

import com.google.gson.annotations.SerializedName

data class HealthResponse(
    @SerializedName("status") val status: String? = null
)

data class ConfigCheckResponse(
    @SerializedName("twilio_account_sid") val twilioAccountSid: Boolean = false,
    @SerializedName("twilio_auth_token") val twilioAuthToken: Boolean = false,
    @SerializedName("twilio_from_number") val twilioFromNumber: Boolean = false,
    @SerializedName("twilio_media_stream_url") val twilioMediaStreamUrl: Boolean = false,
    @SerializedName("deepgram_api_key") val deepgramApiKey: Boolean = false
)

data class DemoCallRequest(
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("demo") val demo: Boolean = true,
    @SerializedName("custom_message") val customMessage: String? = null
)

data class DemoCallResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("callSid") val callSid: String? = null,
    @SerializedName("call_sid") val callSidAlt: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    @SerializedName("call_type") val callType: String? = null
)

data class CallPayload(
    @SerializedName("call_id") val callId: String? = null,
    @SerializedName("caller_number") val callerNumber: String,
    @SerializedName("caller_name") val callerName: String? = null,
    @SerializedName("direction") val direction: String = "incoming",
    @SerializedName("start_time") val startTime: String? = null,
    @SerializedName("duration") val duration: Int? = null,
    @SerializedName("transcript") val transcript: String = ""
)

data class CallAnalysisDetail(
    @SerializedName("call_id") val callId: String? = null,
    @SerializedName("caller_number") val callerNumber: String? = null,
    @SerializedName("caller_name") val callerName: String? = null,
    @SerializedName("risk_score") val riskScore: Int? = null,
    @SerializedName("risk_level") val riskLevel: String? = null,
    @SerializedName("reasons") val reasons: List<String> = emptyList()
)

data class CallAnalysisResponse(
    @SerializedName("event") val event: String? = null,
    @SerializedName("call") val call: CallAnalysisDetail? = null
)
