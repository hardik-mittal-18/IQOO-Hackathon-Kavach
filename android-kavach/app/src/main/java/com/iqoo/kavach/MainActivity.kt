package com.iqoo.kavach

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelProvider
import com.iqoo.kavach.ui.auth.AuthViewModel
import com.iqoo.kavach.ui.dashboard.DashboardViewModel
import com.iqoo.kavach.ui.navigation.KavachNavHost
import com.iqoo.kavach.ui.protection.ProtectionViewModel
import com.iqoo.kavach.ui.theme.KavachTheme

class MainActivity : ComponentActivity() {

    private lateinit var authViewModel: AuthViewModel
    private lateinit var dashboardViewModel: DashboardViewModel
    private lateinit var protectionViewModel: ProtectionViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as KavachApplication
        authViewModel = ViewModelProvider(
            this,
            AuthViewModelFactory(app.authRepository)
        )[AuthViewModel::class.java]
        dashboardViewModel = ViewModelProvider(
            this,
            DashboardViewModelFactory(app.kavachRepository)
        )[DashboardViewModel::class.java]
        protectionViewModel = ViewModelProvider(
            this,
            ProtectionViewModelFactory(app.kavachRepository)
        )[ProtectionViewModel::class.java]

        setContent {
            val darkTheme = isSystemInDarkTheme()
            KavachTheme(darkTheme = darkTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    KavachNavHost(
                        authViewModel = authViewModel,
                        dashboardViewModel = dashboardViewModel,
                        protectionViewModel = protectionViewModel
                    )
                }
            }
        }
    }
}

class AuthViewModelFactory(
    private val authRepository: com.iqoo.kavach.data.auth.AuthRepository
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AuthViewModel(authRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

class DashboardViewModelFactory(
    private val repository: com.iqoo.kavach.data.network.KavachRepository
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(DashboardViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return DashboardViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

class ProtectionViewModelFactory(
    private val repository: com.iqoo.kavach.data.network.KavachRepository
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ProtectionViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ProtectionViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
