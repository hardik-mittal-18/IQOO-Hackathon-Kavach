package com.iqoo.kavach.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iqoo.kavach.data.auth.AuthRepository
import com.iqoo.kavach.data.auth.SessionState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val isSessionReady: Boolean = false,
    val isAuthenticated: Boolean = false,
    val userEmail: String? = null,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        authRepository.sessionState.onEach { session ->
            when (session) {
                is SessionState.LoggedIn -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isSessionReady = true,
                        isAuthenticated = true,
                        userEmail = session.email,
                        errorMessage = null
                    )
                }
                SessionState.LoggedOut -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isSessionReady = true,
                        isAuthenticated = false,
                        userEmail = null,
                        errorMessage = null
                    )
                }
            }
        }.launchIn(viewModelScope)
    }

    fun signIn(email: String, password: String, onSuccess: (() -> Unit)? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.signIn(email, password)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        userEmail = it.email,
                        successMessage = "Signed in successfully"
                    )
                    onSuccess?.invoke()
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.localizedMessage ?: "Unable to sign in right now."
                    )
                }
            )
        }
    }

    fun signUp(email: String, password: String, name: String, phone: String, onSuccess: (() -> Unit)? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.signUp(email, password, name, phone)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        userEmail = it.email,
                        successMessage = "Account created successfully"
                    )
                    onSuccess?.invoke()
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.localizedMessage ?: "Unable to create account."
                    )
                }
            )
        }
    }

    fun signOut(onSuccess: (() -> Unit)? = null) {
        viewModelScope.launch {
            authRepository.signOut()
            _uiState.value = AuthUiState(isAuthenticated = false, userEmail = null)
            onSuccess?.invoke()
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}
