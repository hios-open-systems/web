package dev.hios.btdac.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ToolsScreen(
    viewModel: MainViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var frequency by remember { mutableFloatStateOf(1000f) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            text = "Audio Tools",
            style = MaterialTheme.typography.headlineMedium
        )

        Text("Frequency Generator: ${frequency.toInt()} Hz")
        
        Slider(
            value = frequency,
            onValueChange = { frequency = it },
            valueRange = 20f..20000f
        )

        Button(onClick = { 
            viewModel.sendToneCommand(frequency.toInt())
        }) {
            Text("Play Tone")
        }


        Button(onClick = onBack) {
            Text("Back to Dashboard")
        }
    }
}
