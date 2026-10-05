package com.iqoo.kavach.data.auth

import com.iqoo.kavach.data.network.AppConfig
import kotlinx.coroutines.flow.firstOrNull

class AuthRepository(
    private val sessionManager: DataStoreSessionManager,
    private val authApi: com.iqoo.kavach.data.network.SupabaseAuthApi
) {
    val sessionState = sessionManager.sessionFlow

    suspend fun signIn(email: String, password: String): Result<UserSession> {
        if (!AppConfig.isValidSupabaseConfig) {
            return Result.failure(IllegalStateException("Supabase URL and anon key are not configured yet. Update local.properties before signing in."))
        }

        return try {
            val response = authApi.signIn(
                body = mapOf(
                    "email" to email.trim(),
                    "password" to password
                ),
                apiKey = AppConfig.supabaseAnonKey,
                authorization = "Bearer ${AppConfig.supabaseAnonKey}"
            )

            val authResponse = response.body()
            if (!response.isSuccessful || authResponse == null || authResponse.accessToken.isNullOrBlank()) {
                return Result.failure(IllegalStateException(authResponse?.message ?: authResponse?.errorDescription ?: "Login failed"))
            }

            val user = authResponse.user ?: SupabaseUser(
                id = "",
                email = email.trim()
            )
            val userSession = UserSession(
                userId = user.id,
                email = user.email ?: email.trim(),
                accessToken = authResponse.accessToken,
                refreshToken = authResponse.refreshToken
            )

            sessionManager.saveSession(
                accessToken = authResponse.accessToken,
                refreshToken = authResponse.refreshToken,
                userId = user.id,
                email = user.email ?: email.trim()
            )
            Result.success(userSession)
        } catch (error: Exception) {
            Result.failure(error)
        }
    }

    suspend fun signUp(email: String, password: String, name: String, phone: String): Result<UserSession> {
        if (!AppConfig.isValidSupabaseConfig) {
            return Result.failure(IllegalStateException("Supabase URL and anon key are not configured yet. Update local.properties before creating an account."))
        }

        return try {
            val response = authApi.signUp(
                body = SignUpRequest(
                    email = email.trim(),
                    password = password,
                    data = mapOf(
                        "name" to name.trim(),
                        "phone" to phone.trim(),
                        "role" to "Customer"
                    )
                ),
                apiKey = AppConfig.supabaseAnonKey,
                authorization = "Bearer ${AppConfig.supabaseAnonKey}"
            )

            val authResponse = response.body()
            if (!response.isSuccessful || authResponse == null) {
                return Result.failure(IllegalStateException(authResponse?.message ?: authResponse?.errorDescription ?: "Signup failed"))
            }

            if (!authResponse.accessToken.isNullOrBlank()) {
                val user = authResponse.user ?: SupabaseUser(id = "", email = email.trim())
                val userSession = UserSession(
                    userId = user.id,
                    email = user.email ?: email.trim(),
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken
                )

                sessionManager.saveSession(
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken,
                    userId = user.id,
                    email = user.email ?: email.trim()
                )
                return Result.success(userSession)
            }

            Result.failure(IllegalStateException("Signup request accepted. Please verify your email to continue."))
        } catch (error: Exception) {
            Result.failure(error)
        }
    }

    suspend fun signOut(): Result<Unit> {
        return try {
            val session = sessionManager.sessionFlow.firstOrNull()
            val token = (session as? SessionState.LoggedIn)?.accessToken
            if (token != null) {
                authApi.signOut(
                    apiKey = AppConfig.supabaseAnonKey,
                    authorization = "Bearer $token"
                )
            }
            sessionManager.clearSession()
            Result.success(Unit)
        } catch (error: Exception) {
            sessionManager.clearSession()
            Result.failure(error)
        }
    }

    suspend fun getCurrentSession(): SessionState {
        return sessionManager.sessionFlow.firstOrNull() ?: SessionState.LoggedOut
    }
}
