# HIOS Node AI — Ollama-Abfragen mit einem ESP32-S3

Ein Prototyp mit **ESP32-S3**, der auf Knopfdruck eine vordefinierte Textabfrage an einen **Ollama**-Server sendet. Ein OLED-Display zeigt den Status der Anfrage und die Antwort. Das Modell läuft auf einem Server im lokalen Netzwerk.

## Verfügbare Funktionen

- **Abfragen über WLAN:** HTTP-Anfragen an den Ollama-Endpunkt `/api/chat`.
- **Physischer Taster:** startet die im Firmware-Code konfigurierte Abfrage.
- **OLED-Display:** zeigt Status, Antworten und Fehler auf einem SSD1306 über I2C.
- **Netzwerk-Task:** FreeRTOS führt die HTTP-Anfrage aus, während die Hauptschleife das Display aktualisiert.
- **Konfiguration im Code:** WLAN, Server und Modell werden vor dem Kompilieren festgelegt.

## Aktueller Umfang

Die Firmware in `src/main.cpp` implementiert weder Sprachaufnahme noch Audioausgabe oder TinyML-Inferenz. Die in den Entwurfsdokumenten beschriebenen Audiomodule sind geplante Erweiterungen. Es liegen keine veröffentlichten Messungen zu Latenz, Bildwiederholrate oder Akkulaufzeit vor.

## Erste Schritte

1. Klone das Repository und öffne `projects/hios-node-ai`.
2. Öffne das Projekt in **PlatformIO** (VS Code).
3. Bereite einen **Ollama**-Server mit heruntergeladenem Modell und einer Adresse vor, die der ESP32-S3 im lokalen Netzwerk erreichen kann.
4. Trage WLAN, API-Adresse, Modell und Abfragetext in `src/main.cpp` ein.
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
