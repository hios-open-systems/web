package dev.hios.btdac.ui

import android.annotation.SuppressLint
import androidx.compose.foundation.clickable
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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import dev.hios.btdac.viewmodel.MainViewModel

@SuppressLint("MissingPermission")
@Composable
fun DashboardScreen(
    viewModel: MainViewModel,
    onNavigateToTools: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isConnected by viewModel.isConnected.collectAsState()
    val scanResults by viewModel.scanResults.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "HIOS BTDAC",
            style = MaterialTheme.typography.headlineLarge
        )

        // Status Card
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = if (isConnected) "Status: Connected" else "Status: Disconnected",
                    style = MaterialTheme.typography.titleMedium,
                    color = if (isConnected) Color.Green else Color.Red
                )
                
                if (!isConnected) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { viewModel.scanForDevices() }) {
                        Text("Scan for HIOS Devices")
                    }
                } else {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { viewModel.disconnect() }) {
                        Text("Disconnect")
                    }
                }
            }
        }

        // Tools Navigation (Only enabled if connected)
        Button(
            onClick = onNavigateToTools,
            enabled = isConnected,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Open Audio Tools")
        }
        
        // Scan Results
        if (!isConnected && scanResults.isNotEmpty()) {
            Text("Found Devices:", style = MaterialTheme.typography.titleSmall)
            LazyColumn {
                items(scanResults) { device ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clickable { viewModel.connectToDevice(device) }
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(text = device.name ?: "Unknown HIOS Device", style = MaterialTheme.typography.bodyLarge)
                            Text(text = device.address, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }
    }
}

