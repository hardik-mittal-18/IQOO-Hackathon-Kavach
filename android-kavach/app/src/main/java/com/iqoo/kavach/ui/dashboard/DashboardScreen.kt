package com.iqoo.kavach.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.iqoo.kavach.data.network.BackendHealthUiState

@Composable
fun DashboardScreen(
    dashboardViewModel: DashboardViewModel,
    userEmail: String?,
    onOpenProtectionClick: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by dashboardViewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        dashboardViewModel.checkBackendHealth()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Dashboard",
                style = MaterialTheme.typography.headlineMedium
            )
        }

        item {
            DashboardStatsCard(
                title = "Signed in as",
                value = userEmail ?: "No active session",
                detail = "Active session"
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = onOpenProtectionClick,
                    modifier = Modifier.weight(1f)
                ) {
                    Text(text = "Open protection")
                }

                Button(
                    onClick = onLogout,
                    modifier = Modifier.weight(1f)
                ) {
                    Text(text = "Log out")
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                DashboardStatsCard(
                    title = "Protection",
                    value = "Active",
                    detail = "Monitoring enabled"
                )
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(text = "Backend status", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    when (val status = uiState.healthStatus) {
                        is BackendHealthUiState.Idle -> {
                            Text(text = "Checking backend connection...", style = MaterialTheme.typography.bodyMedium)
                        }
                        is BackendHealthUiState.Healthy -> {
                            Text(
                                text = "System online: ${status.payload["status"] ?: "ok"}",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                        is BackendHealthUiState.Unhealthy -> {
                            Text(
                                text = status.message,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }

                    uiState.configStatus?.let { config ->
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(text = "Twilio config: ${config.twilioAccountSid && config.twilioAuthToken && config.twilioFromNumber}", style = MaterialTheme.typography.bodyMedium)
                        Text(text = "Media stream configured: ${config.twilioMediaStreamUrl}", style = MaterialTheme.typography.bodyMedium)
                        Text(text = "Deepgram configured: ${config.deepgramApiKey}", style = MaterialTheme.typography.bodyMedium)
                    }

                    uiState.errorMessage?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = it, color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }

        item {
            Text(
                text = "Recent protection status",
                style = MaterialTheme.typography.titleMedium
            )
        }

        items(listOf("System online", "Monitoring active", "No active scam alerts")) { item ->
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = item,
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }
    }
}
