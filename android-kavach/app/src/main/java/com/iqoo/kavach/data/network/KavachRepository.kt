package com.iqoo.kavach.data.network

import com.iqoo.kavach.data.auth.SessionState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class KavachRepository(
    private val backendApiService: BackendApiService
) {
    private val _healthState = MutableStateFlow<BackendHealthUiState>(BackendHealthUiState.Idle)
    val healthState: Flow<BackendHealthUiState> = _healthState.asStateFlow()

    suspend fun refreshHealth(): Result<BackendHealthUiState> {
        return try {
            val response = backendApiService.healthCheck()
            val nextState = BackendHealthUiState.Healthy(
                payload = mapOf("status" to (response.status ?: "ok"))
            )
            _healthState.value = nextState
            Result.success(nextState)
        } catch (error: Exception) {
            val downState = BackendHealthUiState.Unhealthy(error.localizedMessage ?: "Backend is unavailable")
            _healthState.value = downState
            Result.failure(error)
        }
    }

    suspend fun refreshConfig(): Result<ConfigCheckResponse> {
        return try {
            val response = backendApiService.configCheck()
            Result.success(response)
        } catch (error: Exception) {
            Result.failure(error)
        }
    }

    suspend fun startDemoCall(phoneNumber: String, customMessage: String?): Result<DemoCallResponse> {
        return try {
            val response = backendApiService.startDemoCall(
                DemoCallRequest(
                    phoneNumber = phoneNumber,
                    demo = true,
                    customMessage = customMessage
                )
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(IllegalStateException(response.errorBody()?.string() ?: "Unable to start demo call"))
            }
        } catch (error: Exception) {
            Result.failure(error)
        }
    }

    suspend fun disconnectDemoCall(): Result<String> {
        return try {
            val response = backendApiService.disconnectDemoCall()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body().toString())
            } else {
                Result.failure(IllegalStateException(response.errorBody()?.string() ?: "Unable to disconnect demo call"))
            }
        } catch (error: Exception) {
            Result.failure(error)
        }
    }
}

sealed class BackendHealthUiState {
    data object Idle : BackendHealthUiState()
    data class Healthy(val payload: Map<String, String>) : BackendHealthUiState()
    data class Unhealthy(val message: String) : BackendHealthUiState()
}
