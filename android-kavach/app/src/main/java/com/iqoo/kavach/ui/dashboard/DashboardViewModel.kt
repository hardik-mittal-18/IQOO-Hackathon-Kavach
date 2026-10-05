package com.iqoo.kavach.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iqoo.kavach.data.network.BackendHealthUiState
import com.iqoo.kavach.data.network.ConfigCheckResponse
import com.iqoo.kavach.data.network.KavachRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = false,
    val healthStatus: BackendHealthUiState = BackendHealthUiState.Idle,
    val configStatus: ConfigCheckResponse? = null,
    val errorMessage: String? = null
)

class DashboardViewModel(
    private val repository: KavachRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    fun checkBackendHealth() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val healthResult = repository.refreshHealth()
            val configResult = repository.refreshConfig()

            healthResult.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isLoading = false, healthStatus = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.localizedMessage ?: "Backend unavailable") }
            )

            configResult.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(configStatus = it) },
                onFailure = { _uiState.value = _uiState.value.copy(errorMessage = it.localizedMessage ?: "Configuration check failed") }
            )
        }
    }
}
