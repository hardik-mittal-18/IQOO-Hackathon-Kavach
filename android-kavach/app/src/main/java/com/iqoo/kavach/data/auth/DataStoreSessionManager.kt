package com.iqoo.kavach.data.auth

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.sessionStore: DataStore<Preferences> by preferencesDataStore(name = "kavach_session")

class DataStoreSessionManager(private val context: Context) {
    private val accessTokenKey = stringPreferencesKey("access_token")
    private val refreshTokenKey = stringPreferencesKey("refresh_token")
    private val userIdKey = stringPreferencesKey("user_id")
    private val emailKey = stringPreferencesKey("email")

    val sessionFlow: Flow<SessionState> = context.sessionStore.data.map { prefs ->
        val accessToken = prefs[accessTokenKey]
        val refreshToken = prefs[refreshTokenKey]
        val userId = prefs[userIdKey]
        val email = prefs[emailKey]

        if (accessToken.isNullOrBlank()) {
            SessionState.LoggedOut
        } else {
            SessionState.LoggedIn(
                accessToken = accessToken,
                refreshToken = refreshToken,
                userId = userId,
                email = email
            )
        }
    }

    suspend fun saveSession(accessToken: String, refreshToken: String?, userId: String?, email: String?) {
        context.sessionStore.edit { prefs ->
            prefs[accessTokenKey] = accessToken
            if (refreshToken != null) prefs[refreshTokenKey] = refreshToken
            if (userId != null) prefs[userIdKey] = userId
            if (email != null) prefs[emailKey] = email
        }
    }

    suspend fun clearSession() {
        context.sessionStore.edit { prefs ->
            prefs.remove(accessTokenKey)
            prefs.remove(refreshTokenKey)
            prefs.remove(userIdKey)
            prefs.remove(emailKey)
        }
    }
}

sealed class SessionState {
    data object LoggedOut : SessionState()
    data class LoggedIn(
        val accessToken: String,
        val refreshToken: String? = null,
        val userId: String? = null,
        val email: String? = null
    ) : SessionState()
}
