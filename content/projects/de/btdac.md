# HIOS BTDAC — Bluetooth-Empfänger + PCM5102-DAC

**Bluetooth-A2DP**-Audioempfänger mit ESP32 und PCM5102-DAC. Er liefert ein Stereo-Line-Signal und bietet einen **BLE**-Kanal für Testtöne aus der Android-App. Hardware **Rev. 2.0** · Firmware/App **v0.5**.

## Erste Schritte

**Firmware (ESP32):**

```bash
cd projects/btdac
pio run -t upload             # Kompilieren und übertragen (PlatformIO, Partition min_spiffs)
pio device monitor -b 115200  # Verbindungs- und Befehlsprotokoll
```

PlatformIO lädt die benötigten Abhängigkeiten beim ersten Kompilieren herunter.

**Android-App:** Öffne `android/` in Android Studio oder führe `./gradlew installDebug` aus (JDK 17+). Details: [`android/README.md`](android/README.md).

## Verfügbare Funktionen

BTDAC v2 verwendet **Dual Mode**:

1. **Audioempfang (Classic Bluetooth):** Stereo-A2DP mit 44,1kHz/16 Bit → PCM5102 → Line-Ausgang.
2. **BLE-Steuerung:** Ein separater GATT-Kanal fordert Testtöne aus der App an. Die Firmware erzeugt etwa zwei Sekunden lang einen Sinuston. Während der Musikwiedergabe startet sie keinen Testton.

## Verdrahtung

Die Anleitung **[/pinouts/btdac](https://openhios.dev/pinouts/btdac)** wird mit `npm run test:wiring` gegen `src/HIOS_BTDAC.ino` geprüft. Übersicht:

| Bus | ESP32 | Ziel |
|---|---|---|
| I2S BCK | GPIO27 | PCM5102 BCK |
| I2S LRCK | GPIO14 | PCM5102 LRCK |
| I2S DIN | GPIO13 | PCM5102 DIN |
| — | GND | PCM5102 **SCK → GND** (interne PLL; den 3.3V-Pin des Moduls **nicht anschließen**) |
| LED R/G/B | GPIO4 / GPIO16 / GPIO17 | KY-009, je Farbe **330Ω**, gemeinsame Kathode an GND |
| 5V / GND | VIN / GND | Vom LM2596, auf 5.0V eingestellt |

**PCM5102-Jumper auf der Rückseite:** `FLT=L · DEMP=L · XSMT=H · FMT=L`. **XSMT muss H sein**; L schaltet den DAC stumm.

**Zu vermeidende GPIOs beim WROOM-32:** 0 / 2 / 12 / 15 (Strapping/Boot) sowie 6–11 (interner SPI-Flash, nicht verwenden).

**Status-LED KY-009:** R→G→B beim Selbsttest nach dem Start; dauerhaft grün bedeutet verbunden. Weitere Farben zeigen Verbindungsaufbau, Wiedergabe und Fehler an. Die Zuordnung steht in `src/HIOS_BTDAC.ino`. Die Überwachung des Akkustands ist noch nicht implementiert.

## Hardware (Stückliste)

2S-Akku, Line-Ausgang:

| Komponente | Funktion | Eigenschaften |
|---|---|---|
| ESP32-WROOM-32 DevKit (38 Pins) | MCU + BT/BLE/WLAN | Dual-Core, BT 4.2, 4MB Flash |
| PCM5102 (LAB1) | I2S-DAC | TI PCM5102A, 112dB SNR, 2.1V RMS Ausgang, interne PLL (SCK→GND) |
| LM2596S mit Display | 5.0V-Regler | Strombelastbarkeit abhängig von Modul und Kühlung |
| KY-009 | RGB-Status-LED | Gemeinsame Kathode, **keine** eingebauten Widerstände; 3× 330Ω ergänzen |
| USB-C-Ladegerät/BMS für 2S | Laden und Schutz des Akkupacks | Spannung, Strom und Schutzfunktionen des verwendeten Moduls prüfen |
| 2× 18650 in Reihe (2S) | Akku | Keine veröffentlichte Referenzmessung zur Laufzeit |

> Verwende einen Halter für zwei Zellen **in Reihe (2S)** und prüfe die Verschaltung vor dem Anschluss an das BMS.

## Montageablauf

Werkzeug: Lötkolben mit feiner Spitze, 60/40-Lötzinn, Multimeter, Pinzette und Abisolierzange.

1. **Zuerst die Versorgung:** Zellen → 2S-BMS (B+/B− und **BM an den Mittelpunkt** zwischen den Zellen) → LM2596. **Stelle den Regler mit dem Multimeter auf 5.0V ein. Schließe die übrigen Module erst bei stabiler Ausgangsspannung an.**
2. **PCM5102:** Jumper setzen (FLT/DEMP/FMT=L, **XSMT=H**) und **SCK→GND** verbinden.
3. **ESP32:** VIN←5V, gemeinsame Masse. Prüfe den Start über USB.
4. **I2S:** GPIO27→BCK, GPIO14→LRCK, GPIO13→DIN; Leitungen unter 10cm verwenden.
5. **KY-009:** GPIO4/16/17 → 330Ω → R/G/B; Kathode → GND.
6. **PCM5102 versorgen:** VIN←5V, GND, SCK→GND.

**Entkopplung:** 100µF + 100nF nahe ESP32-VIN sowie 10µF + 100nF nahe PCM5102-VIN zur Verringerung von Versorgungsstörungen.

**Vor dem Anschluss der Module:** Prüfe bei abgeschalteter Versorgung die Masseverbindungen und ob Kurzschlüsse zwischen 5V und GND vorliegen. Kontrolliere die Reglerspannung separat auf 5.0V. Fotos: `pics/build/` und `pics/modules/`.

## BLE-Steuerprotokoll

Projekteigener GATT-Dienst:

- **Service UUID:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Char UUID:** `beb5483e-36e1-4688-b7f5-ea07361b26a8`

| Befehl | Beispiel | Wirkung |
|---|---|---|
| `tone:FREQ` | `tone:1000` | Erzeugt etwa 2s lang einen Sinuston mit dieser Frequenz |

`vol:` und `eq:` sind in der Firmware **noch nicht implementiert**. Details zur App: [`android/README.md`](android/README.md).

## Audio-Fehlersuche

Wenn Bluetooth verbunden ist, aber Störgeräusche oder keine Musik ausgegeben werden, prüfe Konfiguration, Verdrahtung und Versorgung:

1. **Separater Test:** Übertrage `tests/HIOS_BTDAC_minimal_test.ino`. Er verwendet dieselben Pins 27/14/13 wie die Firmware. Vergleiche die Ergebnisse, um den Fehler einzugrenzen; der Test allein bestimmt die Ursache nicht.
2. **SCK→GND:** Prüfe die Verbindung für den Betrieb mit interner PLL.
3. **XSMT=H:** L schaltet den DAC stumm.
4. **I2S:** Prüfe 27→BCK, 14→LRCK und 13→DIN auf Durchgang. Eine Spannungsmessung mit dem Multimeter validiert keine I2S-Kommunikation.
5. **I2S-Leitungen unter 10cm** und **gemeinsame Masse** zwischen ESP32 und PCM5102.
6. **Stabile 5V an VIN** während der Wiedergabe. Bei Spannungsabfall Versorgung, Regler und Verbindungen prüfen.

Referenzen: [ESP32-A2DP-Wiki](https://github.com/pschatzmann/ESP32-A2DP/wiki) · [PCM5102-Datenblatt](https://www.ti.com/lit/ds/symlink/pcm5102.pdf).

## Status

Implementierte Funktionen und geplante Erweiterungen:

- [x] Dual-Mode-Firmware (A2DP + BLE gleichzeitig)
- [x] Android-App (Suchen, Verbinden, Testtöne)
- [x] Ferngesteuerter Tongenerator
- [ ] Akkuüberwachung (Hardware v2), DSP-Equalizer, WiFi Hi-Res (FLAC/DLNA), OTA über die App

## Lizenz

Prüfe vor einer Weitergabe die Lizenzbedingungen jeder Abhängigkeit. Dieses Verzeichnis enthält keine eigene Lizenzdatei.

---

_HIOS BTDAC — HI Open Systems_
