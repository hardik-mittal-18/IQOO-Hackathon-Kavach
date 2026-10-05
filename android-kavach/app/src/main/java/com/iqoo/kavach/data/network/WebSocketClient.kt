package com.iqoo.kavach.data.network

import android.util.Log
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject

class WebSocketClient(
    private val baseUrl: String,
    private val client: OkHttpClient = OkHttpClient()
) {
    fun listenForAlerts(): Flow<ScamAnalysisPayload> = callbackFlow {
        val socketUrl = when {
            baseUrl.startsWith("ws://") || baseUrl.startsWith("wss://") -> baseUrl.removeSuffix("/") + "/ws"
            baseUrl.startsWith("http://") || baseUrl.startsWith("https://") -> {
                val scheme = if (baseUrl.startsWith("https://")) "wss://" else "ws://"
                val host = baseUrl.removePrefix("http://").removePrefix("https://").trimEnd('/')
                "$scheme$host/ws"
            }
            else -> "ws://10.0.2.2:8000/ws"
        }

        val socket = client.newWebSocket(
            Request.Builder().url(socketUrl).build(),
            object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: okhttp3.Response) {
                    Log.d("KavachWebSocket", "Connected to backend websocket")
                    trySend(ScamAnalysisPayload(event = "CONNECTED", type = "connection"))
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    try {
                        val json = JSONObject(text)
                        val call = json.optJSONObject("call")
                        val reasonsJson = call?.optJSONArray("reasons") ?: json.optJSONArray("reasons")
                        val payload = ScamAnalysisPayload(
                            event = json.optString("event", "SCAM_ANALYSIS"),
                            type = json.optString("type", "scam_analysis"),
                            callSid = json.optString("call_sid").takeIf { it.isNotBlank() }
                                ?: call?.optString("call_sid")?.takeIf { it.isNotBlank() },
                            callId = json.optString("call_id").takeIf { it.isNotBlank() }
                                ?: call?.optString("call_id")?.takeIf { it.isNotBlank() },
                            riskScore = call?.optInt("risk_score", json.optInt("risk_score", 0))
                                ?: json.optInt("risk_score", 0),
                            riskLevel = call?.optString("risk_level", json.optString("risk_level", "LOW"))
                                ?: json.optString("risk_level", "LOW"),
                            reasons = mutableListOf<String>().apply {
                                if (reasonsJson != null) {
                                    for (i in 0 until reasonsJson.length()) {
                                        add(reasonsJson.getString(i))
                                    }
                                }
                            },
                            timestamp = json.optString("timestamp").takeIf { it.isNotBlank() }
                                ?: call?.optString("timestamp")?.takeIf { it.isNotBlank() }
                        )
                        trySend(payload)
                    } catch (error: Exception) {
                        Log.e("KavachWebSocket", "Failed to parse payload: ${error.message}")
                    }
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) {
                    Log.e("KavachWebSocket", "Socket failure: ${t.message}")
                    trySend(ScamAnalysisPayload(event = "DISCONNECTED", type = "connection"))
                    close()
                }
            }
        )

        awaitClose {
            socket.close(1000, null)
        }
    }
}
