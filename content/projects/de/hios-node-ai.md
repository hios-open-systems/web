# HIOS Node AI — Ollama-Abfragen mit einem ESP32-S3

> **Verdrahtungsschema, Netzliste und BOM (CSV):** [`hardware/`](hardware/). Erzeugt aus gegen die Firmware geprüften Daten.

Ein Prototyp mit **ESP32-S3**, der auf Knopfdruck eine vordefinierte Textabfrage an einen **Ollama**-Server sendet. Ein OLED-Display zeigt den Status der Anfrage und die Antwort. Das Modell läuft auf einem Server im lokalen Netzwerk.

## Verfügbare Funktionen

- **Abfragen über WLAN:** HTTP-Anfragen an den Ollama-Endpunkt `/api/chat`.
- **Physischer Taster:** startet die im Firmware-Code konfigurierte Abfrage.
- **OLED-Display:** zeigt Status, Antworten und Fehler auf einem SSD1306 über I2C.
- **Netzwerk-Task:** FreeRTOS führt die HTTP-Anfrage aus, während die Hauptschleife das Display aktualisiert.
- **Akku:** eine 18650 mit USB-C-Ladung (TP4056) und 5V-Boost (Pololu U3V40F5); das OLED zeigt die Spannung.
- **Bestätigungston:** der MAX98357A piept beim Start und bei jeder Antwort.
- **Konfiguration über `build_flags`:** WLAN, Server und Modell stehen in `platformio.ini`, nicht im Code.

## Aktueller Umfang

Das INMP441-Mikrofon ist verdrahtet (GPIO40–42), wird von der Firmware aber noch nicht gelesen: Sprachabfragen brauchen zusätzlich einen Transkriptionsserver auf dem PC, da Ollama nur Text annimmt. Es gibt keine TinyML-Inferenz. Der Entwurf wurde noch nicht aufgebaut oder kompiliert. Es liegen keine veröffentlichten Messungen zu Latenz, Bildwiederholrate oder Akkulaufzeit vor.

## Erste Schritte

1. Klone das Repository und öffne `projects/hios-node-ai`.
2. Öffne das Projekt in **PlatformIO** (VS Code).
3. Bereite einen **Ollama**-Server mit heruntergeladenem Modell und einer Adresse vor, die der ESP32-S3 im lokalen Netzwerk erreichen kann.
4. Trage WLAN, API-Adresse und Modell in die `build_flags` von `platformio.ini` ein (Zugangsdaten nicht committen). Der Abfragetext steht in `src/main.cpp`.
5. Kompiliere die Firmware und übertrage sie per USB-C auf den ESP32-S3:
   ```bash
   pio run -t upload
   ```
6. Drücke den Taster an GPIO 4, um die Abfrage an das lokale LLM zu senden.

## Technische Dokumentation

- [Komponentenspezifikationen (COMPONENTS.md)](COMPONENTS.md)
- [Verdrahtung und Pinbelegung (PINOUT.md)](PINOUT.md)
- [Montageanleitung (ASSEMBLY.md)](ASSEMBLY.md)
- [Fehlersuche (TROUBLESHOOTING.md)](TROUBLESHOOTING.md)
