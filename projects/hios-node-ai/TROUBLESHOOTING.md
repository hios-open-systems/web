# HIOS Node AI — Guía de Solución de Problemas

Tabla de diagnósticos y solución de fallas comunes en el ensamblaje y firmware del nodo HIOS AI.

---

## Tabla de Problemas → Causas → Soluciones

| Síntoma | Causa Probable | Solución Diagnóstica |
|---------|----------------|----------------------|
| **`task_wdt: Task watchdog got triggered`** | La llamada HTTP al servidor local de Ollama bloqueó la CPU sin ceder ticks de FreeRTOS. | Asegurarse de correr la red en una task pineada a `Core 0` con `xTaskCreatePinnedToCore` y llamar `vTaskDelay(pdMS_TO_TICKS(50))` en el loop. |
| **`DeserializationError::NoMemory`** | La API de Ollama devolvió el array masivo de `context` (~15KB) saturando el buffer JSON. | Usar el endpoint `/api/chat` en lugar de `/api/generate` y utilizar `ArduinoJson v7` (`JsonDocument`). |
| **Ruido estático / Chasquido en el parlante** | Ruido de conmutación en la línea de alimentación de 5V al encender el WiFi. | Agregar un capacitor electrolítico de 220µF entre los pines `5V` y `GND` del amplificador MAX98357A. |
| **Pantalla OLED vacía o congelada** | Dirección I2C incorrecta o falsos contactos en SDA/SCL. | Escanear el bus I2C con un sketch I2C Scanner. Verificar que la dirección sea `0x3C` o `0x3D`. |
| **La PC local no responde a las consultas del ESP32** | Ollama está escuchando únicamente en `127.0.0.1` (localhost). | Configurar la variable de entorno `OLLAMA_HOST=0.0.0.0` y reiniciar el servicio de Ollama en la PC. |
