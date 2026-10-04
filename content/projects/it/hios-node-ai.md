# HIOS Node AI — Richieste a Ollama da un ESP32-S3

Prototipo con **ESP32-S3** che invia una richiesta di testo predefinita a un server **Ollama** alla pressione di un pulsante. Uno schermo OLED mostra lo stato della richiesta e la risposta. Il modello viene eseguito sul server della rete locale.

## Funzioni disponibili

- **Richieste tramite WiFi:** invio HTTP all’endpoint `/api/chat` di Ollama.
- **Pulsante fisico:** avvia la richiesta configurata nel firmware.
- **Schermo OLED:** mostra stato, risposte ed errori su un SSD1306 tramite I2C.
- **Task di rete:** FreeRTOS esegue la richiesta HTTP mentre il ciclo principale aggiorna lo schermo.
- **Configurazione nel codice:** rete WiFi, server e modello vengono definiti prima della compilazione.

## Stato attuale

Il firmware in `src/main.cpp` non implementa acquisizione vocale, uscita audio o inferenza TinyML. I moduli audio descritti nei documenti di progettazione sono estensioni previste. Non sono state pubblicate misurazioni di latenza, frequenza di aggiornamento dello schermo o autonomia.

## Primi passi

1. Clona il repository e apri `projects/hios-node-ai`.
2. Apri il progetto in **PlatformIO** (VS Code).
3. Prepara un server **Ollama** con il modello scaricato e un indirizzo raggiungibile dall’ESP32-S3 sulla rete locale.
4. Configura rete WiFi, indirizzo API, modello e testo della richiesta in `src/main.cpp`.
5. Compila e carica il firmware sull’ESP32-S3 tramite USB-C:
   ```bash
   pio run -t upload
   ```
6. Premi il pulsante collegato a GPIO 4 per inviare la richiesta al LLM locale.

## Documentazione tecnica

- [Specifiche dei componenti (COMPONENTS.md)](COMPONENTS.md)
- [Schema dei collegamenti e pinout (PINOUT.md)](PINOUT.md)
- [Guida al montaggio (ASSEMBLY.md)](ASSEMBLY.md)
- [Risoluzione dei problemi (TROUBLESHOOTING.md)](TROUBLESHOOTING.md)
