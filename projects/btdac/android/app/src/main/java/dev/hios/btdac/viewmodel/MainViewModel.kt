package dev.hios.btdac.viewmodel

import android.annotation.SuppressLint
import android.app.Application
import android.bluetooth.BluetoothDevice
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import dev.hios.btdac.data.ble.BleManager
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {
    
    // In a real app, use Hilt/Koin for injection
    private val bleManager = BleManager(application)
    
    val isConnected: StateFlow<Boolean> = bleManager.isConnected
    val scanResults: StateFlow<List<BluetoothDevice>> = bleManager.scanResults

    fun scanForDevices() {
        bleManager.startScan()
    }

    fun connectToDevice(device: BluetoothDevice) {
        bleManager.connect(device)
    }
    
    fun disconnect() {
        bleManager.disconnect()
    }

    fun sendToneCommand(freq: Int) {
        val cmd = "tone:$freq"
        bleManager.sendCommand(cmd)
    }
}
