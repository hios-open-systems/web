# HIOS WiFi Speaker

WLAN- und Bluetooth-Lautsprecher mit ESP32, **zwei MAX98357-I2S-Verstärkern für Stereo**, einem 16×2-LCD und einem über USB-C aufladbaren 2S-Akku. Er spielt WLAN-Radio, YouTube-Audio über Invidious und Bluetooth-A2DP-Audio ab. Die Steuerung erfolgt über eine Weboberfläche.

## Erste Schritte

```bash
cd projects/speaker
pio run -t upload             # Mit PlatformIO kompilieren und übertragen
pio device monitor -b 115200  # Serieller Monitor
```

Öffne nach der Verbindung mit dem Netzwerk **http://hios-speaker.local**.

## Wiedergabemodi

Die Firmware enthält diese Modi (`Mode` in `src/main.ino`):

- **WiFi Radio:** voreingestellte Sender oder eine Audio-URL.
- **YouTube:** Audio über die Invidious-API; abhängig von Verfügbarkeit und Kompatibilität der verwendeten Instanz.
- **Bluetooth A2DP:** empfängt Audio von einem Telefon oder Computer.
- **Konfiguration über Bluetooth Serial:** WLAN über ein Bluetooth-Terminal einrichten, ohne neu zu kompilieren.

Audio wird über I2S an beide MAX98357 übertragen, ein Verstärker pro Kanal. Das LCD zeigt Modus, Lautstärke und Titel.

## Verdrahtung

Die Anleitung **[/pinouts/speaker](https://openhios.dev/pinouts/speaker)** wird mit `npm run test:wiring` gegen `src/main.ino` geprüft. Übersicht:

| Bus | ESP32 | Ziel |
|---|---|---|
| I2S DIN | GPIO25 | DIN an **beiden** MAX98357 (gemeinsamer Bus) |
| I2S BCLK | GPIO26 | BCLK an beiden Modulen |
| I2S LRC | GPIO27 | LRC an beiden Modulen |
| I2C SDA / SCL | GPIO21 / GPIO22 | 16×2-LCD (0x27) |
| VBAT | GPIO34 | Spannungsteiler 100k/100k am Akkupack; IO34 ist nur als Eingang nutzbar |
| 5V / GND | VIN / GND | Vom LM2596, auf 5.0V eingestellt |

> **Kanalauswahl L/R:** Beide Verstärker teilen sich den I2S-Bus und wählen ihren Kanal über SD. Miss die Spannung an diesem Pin und vergleiche sie mit dem Datenblatt des Moduls. Siehe den Schritt zur SD-Messung in der Verdrahtungsanleitung.

## Komponenten (Stückliste)

Stereoausgabe, 2S-Akkupack:

| Komponente | Funktion | Modulauswahl |
|---|---|---|
| ESP32 DevKit (WROOM-32) | Steuerung, WLAN und Bluetooth | 2,4GHz-WLAN |
| **2×** MAX98357 | I2S-Verstärkung, ein Modul pro Kanal | Versorgung, Last und Kanalauswahl im Datenblatt prüfen |
| **2×** Lautsprecher | Linker und rechter Ausgang | Impedanz und Leistung passend zu den Verstärkern wählen |
| 16×2-LCD + I2C-Adapter | Status, Lautstärke und Titel | Adresse in der Firmware: 0x27 |
| LM2596S mit Display | Spannungsregelung | Ausgang auf 5.0V; Belastbarkeit abhängig von Modul und Kühlung |
| USB-C-Ladegerät und Schutz für 2S | Laden des Akkupacks | Zellkompatibilität und Anforderungen an die Versorgung prüfen |
| **2×** 18650 in Reihe | 2S-Akku | Reihenschaltung des Halters prüfen |
| Widerstände | VBAT-Teiler und SD-Kanalauswahl | Verdrahtungsanleitung beachten und Spannungen vor dem Anschluss prüfen |

Für den vollständigen Aufbau sind keine Messungen zu Ausgangsleistung, Verbrauch oder Akkulaufzeit veröffentlicht.

## Montageablauf

Prüfe jede Stufe, bevor du mit der nächsten beginnst:

1. **Zuerst die Versorgung:** Lade den 2S-Akkupack, verbinde ihn mit dem LM2596 und **stelle den Regler mit dem Multimeter auf 5.0V ein. Schließe weitere Module erst bei stabiler Ausgangsspannung an.**
2. **ESP32:** Regler OUT+ → VIN, OUT− → GND. Teste ein Blink-Programm über USB.
3. **Verstärker (×2):** Vin→5V, gemeinsame Masse, I2S-Bus (25/26/27) an beide Module. Je einen 4–8Ω-Lautsprecher direkt an den Verstärkerausgang anschließen (filterloser Class-D-Verstärker).
4. **LCD:** VCC→5V, GND, SDA=21 / SCL=22.
5. **Firmware:** `tests/test_basic.ino` sollte einen Ton erzeugen; danach `src/main.ino` übertragen.

## Prüfstand vor der Montage

Zur Prüfung von Hardware, Verdrahtung und Stabilität vor der endgültigen Montage:

- `testbench/README.md`
- `testbench/PINOUT.md`
- `testbench/VALIDATION_PLAN.md`
- `testbench/CHECKLIST_PRE_MONTAJE.md`
- `testbench/firmware/` (Funktionstest, L/R und Stereostabilität)
- `testbench/results/logs/LOG_TEMPLATE.md`

**Vor dem Anschluss der Module:** Prüfe bei abgeschalteter Versorgung die Masseverbindungen und ob Kurzschlüsse vorliegen. Kontrolliere separat, dass der Regler 5.0V liefert. Referenzfotos stehen in `pics/build/` und `pics/modules/`.

## Fehlersuche

- **Neustarts bei WLAN-Nutzung:** Prüfe Versorgung, Kabel und Meldungen im seriellen Monitor auf mögliche Spannungseinbrüche.
- **Störgeräusche:** Prüfe gemeinsame Masse, Versorgung und I2S-Verdrahtung. Beachte die Entkopplungsempfehlungen des Moduls.
- **Verzerrung:** Reduziere die Lautstärke und prüfe die Versorgung während der Wiedergabe.
- **Nur ein Kanal:** Miss SD an jedem Verstärker und vergleiche die Spannung mit dem Datenblatt.
- **Keine WLAN-Verbindung:** Prüfe Zugangsdaten und ob das Netzwerk mit 2,4GHz arbeitet.

## Status

In Entwicklung: funktionsfähiger Prototyp. Der Code enthält WLAN-Radio, YouTube/Invidious, Bluetooth A2DP, Konfiguration über Bluetooth Serial, LCD-Ansteuerung und VBAT-Messung. Eine eigene Leiterplatte ist geplant.

## Lizenz

Prüfe vor einer Weitergabe die Lizenzbedingungen jeder Abhängigkeit. Dieses Verzeichnis enthält keine eigene Lizenzdatei.

---

_HIOS — HI Open Systems · [openhios.dev/projects/speaker](https://openhios.dev/projects/speaker)_
