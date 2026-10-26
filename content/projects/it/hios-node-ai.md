# HIOS Node AI — Richieste a Ollama da un ESP32-S3

> **Schema di cablaggio, netlist e BOM (CSV):** [`hardware/`](hardware/). Generati da dati verificati sul firmware.

Prototipo con **ESP32-S3** che invia una richiesta di testo predefinita a un server **Ollama** alla pressione di un pulsante. Uno schermo OLED mostra lo stato della richiesta e la risposta. Il modello viene eseguito sul server della rete locale.

## Funzioni disponibili

- **Richieste tramite WiFi:** invio HTTP all’endpoint `/api/chat` di Ollama.
- **Pulsante fisico:** avvia la richiesta configurata nel firmware.
- **Schermo OLED:** mostra stato, risposte ed errori su un SSD1306 tramite I2C.
- **Task di rete:** FreeRTOS esegue la richiesta HTTP mentre il ciclo principale aggiorna lo schermo.
- **Batteria:** una 18650 con ricarica USB-C (TP4056) e boost a 5V (Pololu U3V40F5); l’OLED ne mostra la tensione.
- **Beep di conferma:** il MAX98357A suona all’avvio e all’arrivo di ogni risposta.
- **Configurazione tramite `build_flags`:** rete WiFi, server e modello si definiscono in `platformio.ini`, non nel codice.

## Stato attuale

Il microfono INMP441 è cablato (GPIO40–42) ma il firmware non lo legge ancora: le richieste vocali richiedono anche un server di trascrizione sul PC, perché Ollama accetta solo testo. Non c’è inferenza TinyML. Il progetto non è ancora stato montato né compilato. Non sono state pubblicate misurazioni di latenza, frequenza di aggiornamento dello schermo o autonomia.

## Primi passi

1. Clona il repository e apri `projects/hios-node-ai`.
2. Apri il progetto in **PlatformIO** (VS Code).
3. Prepara un server **Ollama** con il modello scaricato e un indirizzo raggiungibile dall’ESP32-S3 sulla rete locale.
4. Configura rete WiFi, indirizzo API e modello nei `build_flags` di `platformio.ini` (senza fare commit delle credenziali). Il testo della richiesta è in `src/main.cpp`.
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
