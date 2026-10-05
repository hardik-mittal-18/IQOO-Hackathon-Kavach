package com.iqoo.kavach.ui.protection

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ProtectionScreen(
    protectionViewModel: ProtectionViewModel,
    onBack: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by protectionViewModel.uiState.collectAsState()
    var phoneNumber by remember { mutableStateOf("") }
    var customMessage by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        protectionViewModel.connectLiveMonitoring()
    }

    DisposableEffect(Unit) {
        onDispose { protectionViewModel.disconnectLiveMonitoring() }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Protection",
            style = MaterialTheme.typography.headlineMedium
        )

        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(text = "Real-time protection active", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (uiState.liveStatus.isConnected) uiState.liveStatus.riskSummary else "Waiting for scam-analysis stream...",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Status: ${uiState.liveStatus.callStatus}",
                    style = MaterialTheme.typography.bodyMedium
                )
                uiState.liveStatus.latestAlert?.let { alert ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Latest alert: ${alert.riskLevel} (${alert.riskScore})", style = MaterialTheme.typography.bodyMedium)
                    if (alert.reasons.isNotEmpty()) {
                        Text(text = "Reasons: ${alert.reasons.joinToString()}", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        OutlinedTextField(
            value = phoneNumber,
            onValueChange = { phoneNumber = it },
            label = { Text("Phone number") },
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = customMessage,
            onValueChange = { customMessage = it },
            label = { Text("Custom message (optional)") },
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = {
                if (phoneNumber.isNotBlank()) {
                    protectionViewModel.startDemoCall(phoneNumber, customMessage.ifBlank { null })
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isProcessing && phoneNumber.isNotBlank()
        ) {
            Text(text = if (uiState.isProcessing) "Starting call..." else "Test demo call")
        }

        uiState.successMessage?.let {
            Text(text = it, color = MaterialTheme.colorScheme.primary)
        }

        uiState.errorMessage?.let {
            Text(text = it, color = MaterialTheme.colorScheme.error)
        }

        Button(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Back to dashboard")
        }

        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Log out")
        }
    }
}
