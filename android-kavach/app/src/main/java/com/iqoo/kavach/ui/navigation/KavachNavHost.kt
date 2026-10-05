package com.iqoo.kavach.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.material3.CircularProgressIndicator
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.iqoo.kavach.ui.auth.AuthViewModel
import com.iqoo.kavach.ui.auth.LandingScreen
import com.iqoo.kavach.ui.auth.LoginScreen
import com.iqoo.kavach.ui.auth.SignupScreen
import com.iqoo.kavach.ui.dashboard.DashboardScreen
import com.iqoo.kavach.ui.dashboard.DashboardViewModel
import com.iqoo.kavach.ui.protection.ProtectionScreen
import com.iqoo.kavach.ui.protection.ProtectionViewModel

object KavachDestinations {
    const val STARTUP = "startup"
    const val LANDING = "landing"
    const val LOGIN = "login"
    const val SIGNUP = "signup"
    const val DASHBOARD = "dashboard"
    const val PROTECTION = "protection"
}

@Composable
fun KavachNavHost(
    authViewModel: AuthViewModel,
    dashboardViewModel: DashboardViewModel,
    protectionViewModel: ProtectionViewModel
) {
    val navController: NavHostController = rememberNavController()
    val authState by authViewModel.uiState.collectAsState()

    NavHost(
        navController = navController,
        startDestination = KavachDestinations.STARTUP
    ) {
        composable(KavachDestinations.STARTUP) {
            LaunchedEffect(authState.isSessionReady) {
                if (authState.isSessionReady) {
                    val destination = if (authState.isAuthenticated) {
                        KavachDestinations.DASHBOARD
                    } else {
                        KavachDestinations.LANDING
                    }
                    navController.navigate(destination) {
                        popUpTo(KavachDestinations.STARTUP) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            }
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }

        composable(KavachDestinations.LANDING) {
            LandingScreen(
                onLoginClick = { navController.navigate(KavachDestinations.LOGIN) },
                onSignupClick = { navController.navigate(KavachDestinations.SIGNUP) }
            )
        }

        composable(KavachDestinations.LOGIN) {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = { navController.navigate(KavachDestinations.DASHBOARD) { popUpTo(KavachDestinations.LANDING) { inclusive = true } } },
                onCreateAccountClick = {
                    authViewModel.clearError()
                    navController.navigate(KavachDestinations.SIGNUP)
                }
            )
        }

        composable(KavachDestinations.SIGNUP) {
            SignupScreen(
                authViewModel = authViewModel,
                onSignupSuccess = { navController.navigate(KavachDestinations.DASHBOARD) { popUpTo(KavachDestinations.LANDING) { inclusive = true } } },
                onAlreadyHaveAccountClick = {
                    authViewModel.clearError()
                    navController.popBackStack()
                }
            )
        }

        composable(KavachDestinations.DASHBOARD) {
            DashboardScreen(
                dashboardViewModel = dashboardViewModel,
                userEmail = authState.userEmail,
                onOpenProtectionClick = { navController.navigate(KavachDestinations.PROTECTION) },
                onLogout = {
                    authViewModel.signOut {
                        navController.navigate(KavachDestinations.LANDING) { popUpTo(KavachDestinations.DASHBOARD) { inclusive = true } }
                    }
                }
            )
        }

        composable(KavachDestinations.PROTECTION) {
            ProtectionScreen(
                protectionViewModel = protectionViewModel,
                onBack = { navController.popBackStack() },
                onLogout = {
                    authViewModel.signOut {
                        navController.navigate(KavachDestinations.LANDING) { popUpTo(KavachDestinations.DASHBOARD) { inclusive = true } }
                    }
                }
            )
        }
    }
}
