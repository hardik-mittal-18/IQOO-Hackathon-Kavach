package com.iqoo.kavach.data.network

import android.content.Context
import com.iqoo.kavach.data.auth.AuthRepository
import com.google.gson.GsonBuilder
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class RetrofitProvider(context: Context) {
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .build()

    private val gson = GsonBuilder().create()

    val supabaseAuthApi: SupabaseAuthApi by lazy {
        Retrofit.Builder()
            .baseUrl(AppConfig.supabaseUrl.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(SupabaseAuthApi::class.java)
    }

    val backendApiService: BackendApiService by lazy {
        Retrofit.Builder()
            .baseUrl(AppConfig.backendUrl.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(BackendApiService::class.java)
    }
}

interface SupabaseAuthApi {
    @retrofit2.http.POST("auth/v1/token")
    suspend fun signIn(
        @retrofit2.http.Body body: Map<String, String>,
        @retrofit2.http.Header("apikey") apiKey: String,
        @retrofit2.http.Header("Authorization") authorization: String = "Bearer $apiKey"
    ): retrofit2.Response<com.iqoo.kavach.data.auth.SupabaseAuthResponse>

    @retrofit2.http.POST("auth/v1/signup")
    suspend fun signUp(
        @retrofit2.http.Body body: com.iqoo.kavach.data.auth.SignUpRequest,
        @retrofit2.http.Header("apikey") apiKey: String,
        @retrofit2.http.Header("Authorization") authorization: String = "Bearer $apiKey"
    ): retrofit2.Response<com.iqoo.kavach.data.auth.SupabaseAuthResponse>

    @retrofit2.http.POST("auth/v1/logout")
    suspend fun signOut(
        @retrofit2.http.Header("apikey") apiKey: String,
        @retrofit2.http.Header("Authorization") authorization: String,
        @retrofit2.http.Header("Content-Type") contentType: String = "application/json"
    ): retrofit2.Response<Unit>

    @retrofit2.http.GET("auth/v1/user")
    suspend fun getCurrentUser(
        @retrofit2.http.Header("apikey") apiKey: String,
        @retrofit2.http.Header("Authorization") authorization: String
    ): retrofit2.Response<com.iqoo.kavach.data.auth.SupabaseUser>
}

interface BackendApiService {
    @retrofit2.http.GET("api/health")
    suspend fun healthCheck(): HealthResponse

    @retrofit2.http.GET("api/config-check")
    suspend fun configCheck(): ConfigCheckResponse

    @retrofit2.http.POST("api/calls")
    suspend fun sendCall(@retrofit2.http.Body payload: CallPayload): retrofit2.Response<CallAnalysisResponse>

    @retrofit2.http.POST("api/calls/demo")
    suspend fun startDemoCall(@retrofit2.http.Body payload: DemoCallRequest): retrofit2.Response<DemoCallResponse>

    @retrofit2.http.POST("api/test-call/disconnect")
    suspend fun disconnectDemoCall(): retrofit2.Response<Map<String, Any>>
}
