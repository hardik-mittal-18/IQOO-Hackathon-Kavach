package com.iqoo.kavach.data.auth

import com.google.gson.annotations.SerializedName

data class SupabaseUser(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("user_metadata") val userMetadata: Map<String, Any>? = null
)

data class SupabaseAuthResponse(
    @SerializedName("access_token") val accessToken: String? = null,
    @SerializedName("refresh_token") val refreshToken: String? = null,
    @SerializedName("expires_in") val expiresIn: Long? = null,
    @SerializedName("user") val user: SupabaseUser? = null,
    @SerializedName("error_description") val errorDescription: String? = null,
    @SerializedName("message") val message: String? = null
)

data class AuthRequest(
    val email: String,
    val password: String
)

data class SignUpRequest(
    val email: String,
    val password: String,
    val data: Map<String, String> = emptyMap()
)

data class UserSession(
    val userId: String,
    val email: String,
    val accessToken: String,
    val refreshToken: String? = null
)
