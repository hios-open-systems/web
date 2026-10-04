# HIOS PAD — Console di controllo programmabile ESP32-S3

Controller da scrivania con schermo, encoder rotativo, joystick, 10 tasti azione e 2 tasti ALT. Invia **azioni di tastiera, mouse e multimedia tramite USB o Bluetooth BLE**. I livelli organizzano i controlli per contesto. Il WiFi permette di configurare il dispositivo e comunicare con un companion opzionale che riporta lo stato del PC.

## Primi passi

```bash
cd projects/pad

# Compilazione e caricamento con PlatformIO
pio run -t upload

# Monitor seriale
pio device monitor -b 115200
```

All’avvio il monitor mostra `token API/OTA`. Copialo in `companion/config.json` prima di avviare il servizio o aprire l’interfaccia web da un altro computer. Il token viene generato una sola volta, salvato in NVS e usato per autenticare l’API web e gli aggiornamenti OTA.

> **Caricamento da WSL:** collega l’interfaccia seriale del DevKit (CH343, UART) a WSL. Da PowerShell su Windows esegui `usbipd list`, poi `usbipd attach --wsl --busid <id>`. Ripeti dopo aver ricollegato il cavo. Il dispositivo può quindi apparire come `/dev/ttyACM0`. L’interfaccia **USB nativa** dell’S3 (303a:1001) gestisce HID; CH343 gestisce caricamento e comunicazione seriale.

## Procedura

1. **Montaggio:** segui **[/pinouts/pad](https://openhios.dev/pinouts/pad)** per ordine dei moduli, checklist e misure: regolatore a 5.0V, pin SD degli amplificatori e diodi della matrice. `npm run test:wiring`, dalla radice del repository web, confronta la guida con [`src/app/Pins.h`](src/app/Pins.h) e [`platformio.ini`](platformio.ini).
2. **Primo caricamento via cavo:** esegui `pio run -t upload`. Su WSL collega prima CH343 con `usbipd`.
   > **Alimentazione:** con il pacco 2S collegato, apri `SW-CELDAS` prima di collegare USB. Altrimenti VBUS USB e uscita del regolatore verrebbero uniti sul pin `5V`. Carica il firmware con la batteria disattivata oppure usa OTA.
3. **Aggiornamenti OTA:** con WiFi disponibile, aggiungi `--auth=<token API/OTA>` a `upload_flags` nella sezione `[env:ota]` di `platformio.ini`. Esegui `pio run -e ota -t upload --upload-port hiospad.local`. Mantieni accessibili USB-C nativa e BOOT per il ripristino se un aggiornamento fallisce.
4. **Companion opzionale:** avvialo per ricevere lo stato del PC e controllare il silenziamento del microfono di sistema. I controlli HID funzionano anche senza companion.

## Funzioni disponibili

Ogni **livello** assegna azioni ai **10 tasti azione**, ai 2 ALT, all’encoder e al joystick. USB e BLE inviano azioni di tastiera, mouse e multimedia tramite HID. La compatibilità delle scorciatoie dipende dal sistema operativo e dall’applicazione.

- **USB e BLE:** TinyUSB e NimBLE offrono HID composito per tastiera, mouse e controlli multimediali. La selezione automatica usa USB quando collegato e BLE quando scollegato. Il WiFi trasporta stato e comandi mediati, non HID.
- **Uso indipendente:** HID non richiede rete né companion. Stato del PC e silenziamento del microfono di sistema richiedono entrambi.
- **Joystick come mouse:** muove il puntatore; pressione breve per clic sinistro, doppia per clic destro e lunga per cambiare modalità mouse.
- **Encoder contestuale:** controlla volume, scorrimento, zoom o schede secondo il livello. Il doppio clic cambia funzione; la pressione apre il menu.

## Livelli e menu

I livelli sono raggruppati per tipo. Premendo l’encoder si apre un selettore a un livello: i **10 tasti fisici** selezionano i livelli del gruppo corrente, mentre la rotazione cambia gruppo.

| Gruppo | Livelli |
|---|---|
| **Lavoro** | Modifica, Dev, Apps |
| **Multimedia** | Multimedia, YouTube, Netflix |
| **Web** | Browser |
| **Chiamate** | Meet, Slack, Zoom, Teams |
| **Sistema** | RGB |
| **Impostazioni** (ultima pagina) | Luminosità, Tema, Colore, Skin, Dimmer, Ora, WiFi, Calibrazione |

Ruota per cambiare gruppo o pagina; i tasti 1–10 selezionano un livello. Premi l’encoder per aprire le impostazioni; tienilo premuto per tornare indietro o chiudere.

### Videochiamate

Ogni app ha un livello di scorciatoie. Una pressione breve sul controllo del microfono invia la scorciatoia configurata; una pressione lunga richiede il silenziamento del microfono di sistema tramite il companion. Il livello Slack usa questo controllo di sistema. La videocamera usa la scorciatoia dell’app. La compatibilità dipende da sistema, configurazione delle scorciatoie e permessi.

> In Zoom abilita le scorciatoie globali in Settings → Keyboard Shortcuts per controllare il microfono anche quando la finestra non è attiva.

## Software companion opzionale

Il companion aggiunge modifica via web e comunicazione con il sistema operativo. HID resta disponibile quando il companion è scollegato.

- **[`pad-companion`](companion): servizio in background.** Riporta volume e stato del microfono tramite `POST /api/state` e riceve comandi PAD per il sistema operativo. Windows e Linux sono supportati; macOS è ancora da implementare. Le metriche CPU/GPU e temperatura dipendono da sensori, programmi e permessi disponibili. Se gli aggiornamenti si interrompono, il PAD torna a mostrare uno stato stimato. Contratto API, dipendenze e avvio automatico sono descritti in [`companion/README.md`](companion/README.md).
- **Amministrazione web e specchio dello schermo:** il server in [`companion/src/web`](companion/src/web) modifica assegnazioni, livelli e testi. Specchio ed emulatore usano il modello dati del firmware e inviano la configurazione senza ricompilare.
- **[`host/openrgb-rgb-layer.ahk`](host/openrgb-rgb-layer.ahk):** script AutoHotkey che collega il livello RGB del PAD a **OpenRGB** sul PC, controllando l’illuminazione delle periferiche secondo il livello attivo.

## Architettura

I task FreeRTOS sono assegnati ai core:

- **inputTask** (core1): legge pulsanti, encoder e joystick; `Dispatcher` risolve le azioni del livello, le accoda e prepara lo stato dell’interfaccia.
- **transportTask** (core1): consuma le azioni e le invia sul trasporto HID USB/BLE attivo tramite `TransportRouter`.
- **uiTask** (core0): disegna pannello, menu e portale con `TFT_eSprite`.
- **netTask** (core0): WiFi STA, captive portal, NTP e WebServer (`/api/state`).

Directory: `actions/` (modello `Action`), `mapping/` (`KeyMap`/`Dispatcher`), `inputs/` (pulsanti, encoder, joystick), `transport/` (USB, BLE, router), `net/`, `ui/` (skin, menu, dock, icone vettoriali), `storage/` (configurazione predefinita) e `app/` (configurazione, pin, stato).

## Hardware

- **ESP32-S3-DevKitC-1 N16R8:** flash da 16MB e PSRAM octal da 8MB, AP Memory 3.3V, identificate nel dump del chip del progetto. La PSRAM occupa GPIO 33–37 e la flash 26–32; questi pin non sono disponibili per le periferiche.
- **Display ILI9488 da 4 pollici:** 480×320, SPI/HSPI a 27MHz. Il progetto usa ILI9488, non ST7796.
- **Encoder KY-040**, **joystick HW-504** alimentato a **3V3** e **12 pulsanti normalmente aperti** verso GND: 10 tasti azione in una **matrice 2×5 con diodi**, catodi verso le righe, più 2 ALT diretti.
- **2× MAX98357A:** bus I2S condiviso; SD seleziona il canale. Collegamento del progetto: L con SD a Vin, R con SD tramite **390k** a Vin.
- Definizioni dei pin: [`src/app/Pins.h`](src/app/Pins.h). Collegamenti e alimentazione: **[/pinouts/pad](https://openhios.dev/pinouts/pad)**, verificati rispetto al firmware tramite test automatici.

## Note di implementazione

- **Sprite e font:** chiama `setTextFont(1)` dopo aver creato ogni `TFT_eSprite`; nel progetto è stato registrato un ciclo di riavvio causato da `gfxFont` non inizializzato.
- **Joystick a 3V3:** non alimentarlo a 5V; l’uscita può superare l’intervallo d’ingresso ADC dell’S3.
- **Conflitti di simboli BLE:** `USBHIDKeyboard.h` e gli header BLE definiscono simboli `KEY_*`/`KeyReport` in conflitto. Le factory in `transport/` li isolano, evitando che `main` includa entrambi gli header.
- **Memoria del menu:** libera lo sprite del carosello, circa 60KB, alla chiusura per ridurre l’uso dell’heap con BLE e WiFi attivi.
- **Cali di tensione:** se il dispositivo si riavvia quando si attivano WiFi o BLE, controlla alimentazione e log seriali prima di attribuire il problema al firmware.

## Stato

**Implementato:** selezione automatica USB/BLE HID, WiFi, portale, NTP, joystick mouse, livelli e menu, stato del PC e silenziamento del microfono di sistema tramite companion, **configurazione JSON** tramite `GET/POST /api/config` in LittleFS e **specchio dello schermo** fornito dal companion tramite SSE. La configurazione si modifica e invia senza ricompilare.

La misura della batteria sul PAD è disabilitata: il display dell’alimentatore mostra la tensione del pacco 2S, mentre GPIO9, prima assegnato al partitore, ora controlla il NeoPixel. Mantieni `cfg::BATTERY_ENABLED=false` finché l’ADC non viene riassegnato. Non collegare il partitore della batteria alla linea dati del NeoPixel.

### Sviluppi previsti

- [ ] **Interfaccia web diretta del PAD: codice implementato, verifica hardware in attesa.** Servita dal PAD tramite [`net/WebUi.cpp`](src/net/WebUi.cpp), senza PC. Include stato, selezione del livello, **PAD virtuale 2×5** per tasti/encoder ed **editor di configurazione** per nomi, colori ed etichette, conservando le azioni. Endpoint: `GET /api/ui`, `POST /api/cmd`, `/api/config`. `npm run test:padwebui` verifica la pagina estratta dal firmware con Playwright e un contratto API simulato. L’applicazione delle modifiche sul dispositivo fisico richiede ancora una prova con il firmware caricato.
- [ ] **Gesti modificabili:** aggiungere gesti secondari configurabili richiede una riprogettazione; il precedente comportamento fisso della pressione lunga è stato rimosso. Priorità inferiore.
- [ ] **Pad2:** nuova architettura proposta, a partire da un PAD virtuale, con comportamento guidato dai dati e JavaScript/JSDoc senza fase di build. Non avviata.

## Crediti

La manopola stampata del joystick deriva da [questo modello Thingiverse](https://www.thingiverse.com/thing:6189483). Grazie all’autore per averlo condiviso.
