package com.iqoo.kavach.ui.protection

import com.iqoo.kavach.data.network.ScamAnalysisPayload

data class LiveProtectionState(
    val isConnected: Boolean = false,
    val latestAlert: ScamAnalysisPayload? = null,
    val riskSummary: String = "Monitoring inactive",
    val callStatus: String = "idle"
)
