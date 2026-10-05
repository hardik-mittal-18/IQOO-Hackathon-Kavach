package com.iqoo.kavach.ui.protection

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iqoo.kavach.data.network.AppConfig
import com.iqoo.kavach.data.network.DemoCallResponse
import com.iqoo.kavach.data.network.KavachRepository
import com.iqoo.kavach.data.network.WebSocketClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

data class ProtectionUiState(
    val isProcessing: Boolean = false,
    val successMessage: String? = null,
    val errorMessage: String? = null,
    val lastCallResponse: DemoCallResponse? = null,
    val liveStatus: LiveProtectionState = LiveProtectionState()
)

class ProtectionViewModel(
    private val repository: KavachRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProtectionUiState())
    val uiState: StateFlow<ProtectionUiState> = _uiState.asStateFlow()

    private val websocketClient = WebSocketClient(AppConfig.backendUrl)
    private var monitoringJob: Job? = null

    fun connectLiveMonitoring() {
        if (monitoringJob?.isActive == true) return
        monitoringJob = viewModelScope.launch {
            websocketClient.listenForAlerts().collect { alert ->
                val current = _uiState.value.liveStatus
                val updated = when (alert.event) {
                    "CONNECTED" -> current.copy(isConnected = true, callStatus = "connected")
                    "DISCONNECTED" -> current.copy(isConnected = false, callStatus = "disconnected")
                    "CALL_STARTED" -> current.copy(
                        isConnected = true,
                        callStatus = "call started",
                        riskSummary = "Monitoring incoming call..."
                    )
                    else -> current.copy(
                        isConnected = true,
                        latestAlert = alert,
                        riskSummary = "Risk score: ${alert.riskScore} / ${alert.riskLevel}",
                        callStatus = alert.riskLevel
                    )
                }
                _uiState.value = _uiState.value.copy(liveStatus = updated)
            }
        }
    }

    fun disconnectLiveMonitoring() {
        monitoringJob?.cancel()
        monitoringJob = null
        _uiState.value = _uiState.value.copy(
            liveStatus = _uiState.value.liveStatus.copy(
                isConnected = false,
                callStatus = "disconnected"
            )
        )
    }

    fun startDemoCall(phoneNumber: String, customMessage: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)
            val result = repository.startDemoCall(phoneNumber, customMessage)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        successMessage = "Demo call started for $phoneNumber",
                        lastCallResponse = it,
                        liveStatus = _uiState.value.liveStatus.copy(callStatus = it.status ?: "initiating")
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        errorMessage = it.localizedMessage ?: "Unable to start demo call"
                    )
                }
            )
        }
    }

    override fun onCleared() {
        disconnectLiveMonitoring()
        super.onCleared()
    }
}
