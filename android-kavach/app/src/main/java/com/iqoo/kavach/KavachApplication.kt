package com.iqoo.kavach

import android.app.Application
import com.iqoo.kavach.data.auth.AuthRepository
import com.iqoo.kavach.data.auth.DataStoreSessionManager
import com.iqoo.kavach.data.network.BackendApiService
import com.iqoo.kavach.data.network.KavachRepository
import com.iqoo.kavach.data.network.RetrofitProvider

class KavachApplication : Application() {

    lateinit var authRepository: AuthRepository
        private set

    lateinit var backendApiService: BackendApiService
        private set

    lateinit var kavachRepository: KavachRepository
        private set

    override fun onCreate() {
        super.onCreate()
        val sessionManager = DataStoreSessionManager(this)
        val retrofitProvider = RetrofitProvider(this)
        backendApiService = retrofitProvider.backendApiService
        authRepository = AuthRepository(sessionManager, retrofitProvider.supabaseAuthApi)
        kavachRepository = KavachRepository(retrofitProvider.backendApiService)
    }
}
