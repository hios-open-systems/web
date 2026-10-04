# HIOS BTDAC — Ricevitore Bluetooth + DAC PCM5102

Ricevitore audio **Bluetooth A2DP** con ESP32 e DAC PCM5102. Offre un’uscita di linea stereo e un canale **BLE** per richiedere toni di prova dall’app Android. Hardware **rev 2.0** · firmware/app **v0.5**.

## Primi passi

**Firmware (ESP32):**

```bash
cd projects/btdac
pio run -t upload             # compilazione e caricamento (PlatformIO, partizione min_spiffs)
pio device monitor -b 115200  # log di connessioni e comandi
```

PlatformIO scarica le dipendenze necessarie durante la prima compilazione.

**App Android:** apri `android/` in Android Studio oppure esegui `./gradlew installDebug` (JDK 17+). Dettagli in [`android/README.md`](android/README.md).

## Funzioni disponibili

BTDAC v2 usa **Dual Mode**:

1. **Ricezione audio (Bluetooth Classic):** A2DP stereo a 44,1kHz/16 bit → PCM5102 → uscita di linea.
2. **Controllo BLE:** canale GATT separato per richiedere toni di prova dall’app. Il firmware genera un’onda sinusoidale per circa due secondi e non avvia il tono durante la riproduzione musicale.

## Collegamenti

La guida **[/pinouts/btdac](https://openhios.dev/pinouts/btdac)** viene verificata rispetto a `src/HIOS_BTDAC.ino` con `npm run test:wiring`. Riepilogo:

| Bus | ESP32 | Destinazione |
|---|---|---|
| I2S BCK | GPIO27 | PCM5102 BCK |
| I2S LRCK | GPIO14 | PCM5102 LRCK |
| I2S DIN | GPIO13 | PCM5102 DIN |
| — | GND | PCM5102 **SCK → GND** (PLL interno; lascia il pin 3.3V del modulo **scollegato**) |
| LED R/G/B | GPIO4 / GPIO16 / GPIO17 | KY-009, **330Ω** per colore, catodo comune a GND |
| 5V / GND | VIN / GND | Dal LM2596, regolato a 5.0V |

**Ponticelli sul retro del PCM5102:** `FLT=L · DEMP=L · XSMT=H · FMT=L`. **XSMT deve essere H**; con L il DAC è silenziato.

**GPIO da evitare sul WROOM-32:** 0 / 2 / 12 / 15 (strapping/avvio) e 6–11 (flash SPI interna, non utilizzare).

**LED di stato KY-009:** sequenza R→G→B all’avvio per l’autotest; verde fisso indica la connessione. Altri colori segnalano connessione in corso, riproduzione ed errori; la corrispondenza è in `src/HIOS_BTDAC.ino`. Il monitoraggio della batteria non è ancora implementato.

## Hardware (componenti)

Batteria 2S, uscita di linea:

| Componente | Funzione | Caratteristiche |
|---|---|---|
| ESP32-WROOM-32 DevKit (38 pin) | MCU + BT/BLE/WiFi | Dual-core, BT 4.2, flash da 4MB |
| PCM5102 (LAB1) | DAC I2S | TI PCM5102A, SNR 112dB, uscita 2.1V RMS, PLL interno (SCK→GND) |
| LM2596S con display | Regolatore a 5.0V | Corrente disponibile secondo modulo e dissipazione |
| KY-009 | LED RGB di stato | Catodo comune, **senza** resistenze integrate; aggiungere 3× 330Ω |
| Caricatore/BMS 2S USB-C | Carica e protezione del pacco | Verifica tensione, corrente e protezioni nella scheda del modulo utilizzato |
| 2× 18650 in serie (2S) | Batteria | Nessuna misurazione di riferimento pubblicata per l’autonomia |

> Usa un portabatterie per due celle **in serie (2S)** e verifica la configurazione prima di collegarlo al BMS.

## Sequenza di montaggio

Attrezzi: saldatore a punta fine, stagno 60/40, multimetro, pinzette e spelafili.

1. **Prima l’alimentazione:** batterie → BMS 2S (B+/B− e **BM al punto centrale** tra le celle) → LM2596. **Regola il convertitore a 5.0V con il multimetro. Collega gli altri moduli solo quando l’uscita è stabile.**
2. **PCM5102:** imposta i ponticelli (FLT/DEMP/FMT=L, **XSMT=H**) e collega **SCK→GND**.
3. **ESP32:** VIN←5V, massa comune. Verifica l’avvio tramite USB.
4. **I2S:** GPIO27→BCK, GPIO14→LRCK, GPIO13→DIN; cavi corti, inferiori a 10cm.
5. **LED KY-009:** GPIO4/16/17 → 330Ω → R/G/B; catodo → GND.
6. **Alimentazione PCM5102:** VIN←5V, GND, SCK→GND.

**Disaccoppiamento:** 100µF + 100nF vicino a VIN dell’ESP32 e 10µF + 100nF vicino a VIN del PCM5102 per contribuire a ridurre i disturbi di alimentazione.

**Prima di collegare i moduli:** ad alimentazione scollegata, verifica la continuità delle masse e l’assenza di cortocircuiti tra 5V e GND. Controlla separatamente che il regolatore sia impostato a 5.0V. Foto in `pics/build/` e `pics/modules/`.

## Protocollo di controllo BLE

Servizio GATT del progetto:

- **Service UUID:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Char UUID:** `beb5483e-36e1-4688-b7f5-ea07361b26a8`

| Comando | Esempio | Effetto |
|---|---|---|
| `tone:FREQ` | `tone:1000` | Genera un’onda sinusoidale a quella frequenza per circa 2s |

`vol:` ed `eq:` **non sono ancora implementati** nel firmware. Dettagli dell’app in [`android/README.md`](android/README.md).

## Diagnostica audio

Se Bluetooth si connette ma l’uscita è rumorosa o non riproduce musica, controlla configurazione, collegamenti e alimentazione:

1. **Prova isolata:** carica `tests/HIOS_BTDAC_minimal_test.ino`, che usa gli **stessi** pin 27/14/13 del firmware. Confronta il risultato con il firmware completo per circoscrivere il problema; questa prova da sola non ne identifica la causa.
2. **SCK→GND:** verifica la continuità per la configurazione con PLL interno.
3. **XSMT=H:** con L il DAC è silenziato.
4. **I2S:** verifica la continuità 27→BCK, 14→LRCK, 13→DIN. Una misura di tensione con il multimetro non convalida la comunicazione I2S.
5. **Cavi I2S inferiori a 10cm** e **massa comune** tra ESP32 e PCM5102.
6. **VIN stabile a 5V** durante la riproduzione. Se la tensione cala, controlla alimentatore, regolatore e collegamenti.

Riferimenti: [Wiki ESP32-A2DP](https://github.com/pschatzmann/ESP32-A2DP/wiki) · [Datasheet PCM5102](https://www.ti.com/lit/ds/symlink/pcm5102.pdf).

## Stato

Funzioni implementate ed estensioni previste:

- [x] Firmware Dual Mode (A2DP + BLE simultanei)
- [x] App Android (ricerca, connessione e toni di prova)
- [x] Generatore di toni remoto
- [ ] Monitoraggio batteria (hardware v2), equalizzatore DSP, WiFi Hi-Res (FLAC/DLNA), OTA dall’app

## Licenza

Consulta le condizioni di licenza di ogni dipendenza prima di ridistribuirla. Questa directory non include un proprio file di licenza.

---

_HIOS BTDAC — HI Open Systems_
