# HIOS WiFi Speaker

Diffusore WiFi e Bluetooth con ESP32, **due amplificatori I2S MAX98357 per l’uscita stereo**, display LCD 16×2 e batteria 2S ricaricabile tramite USB-C. Riproduce radio WiFi, audio di YouTube tramite Invidious e audio Bluetooth A2DP, con controllo da interfaccia web.

## Primi passi

```bash
cd projects/speaker
pio run -t upload             # Compilazione e caricamento con PlatformIO
pio device monitor -b 115200  # Monitor seriale
```

Una volta connesso alla rete, apri **http://hios-speaker.local**.

## Modalità di riproduzione

Il firmware include queste modalità (enum `Mode` in `src/main.ino`):

- **WiFi Radio:** stazioni preconfigurate o un URL audio.
- **YouTube:** audio tramite l’API di Invidious; dipende dalla disponibilità e dalla compatibilità dell’istanza utilizzata.
- **Bluetooth A2DP:** riceve audio da un telefono o un computer.
- **Configurazione tramite Bluetooth seriale:** imposta la rete WiFi da un terminale Bluetooth senza ricompilare.

L’audio passa tramite I2S ai due MAX98357, un amplificatore per canale. Il display mostra modalità, volume e titolo.

## Collegamenti

La guida **[/pinouts/speaker](https://openhios.dev/pinouts/speaker)** viene verificata rispetto a `src/main.ino` con `npm run test:wiring`. Riepilogo:

| Bus | ESP32 | Destinazione |
|---|---|---|
| I2S DIN | GPIO25 | DIN di **entrambi** i MAX98357 (bus condiviso) |
| I2S BCLK | GPIO26 | BCLK di entrambi i moduli |
| I2S LRC | GPIO27 | LRC di entrambi i moduli |
| I2C SDA / SCL | GPIO21 / GPIO22 | LCD 16×2 (0x27) |
| VBAT | GPIO34 | Partitore 100k/100k del pacco; IO34 è solo un ingresso |
| 5V / GND | VIN / GND | Dal LM2596, regolato a 5.0V |

> **Selezione del canale L/R:** i due amplificatori condividono il bus I2S e selezionano il canale tramite SD. Misura la tensione su questo pin e confrontala con la scheda tecnica del modulo. Consulta il passaggio dedicato alla misura di SD nella guida ai collegamenti.

## Componenti

Uscita stereo, pacco 2S:

| Componente | Funzione | Selezione del modulo |
|---|---|---|
| ESP32 DevKit (WROOM-32) | Controllo, WiFi e Bluetooth | Rete WiFi a 2,4GHz |
| **2×** MAX98357 | Amplificazione I2S, un modulo per canale | Verifica alimentazione, carico e selezione del canale nella scheda tecnica |
| **2×** altoparlante | Uscita sinistra e destra | Scegli impedenza e potenza compatibili con gli amplificatori |
| LCD 16×2 + adattatore I2C | Stato, volume e titolo | Indirizzo nel firmware: 0x27 |
| LM2596S con display | Regolazione dell’alimentazione | Uscita a 5.0V; capacità secondo modulo e dissipazione |
| Caricatore e protezione 2S USB-C | Carica del pacco | Verifica compatibilità delle celle e requisiti d’ingresso |
| **2×** 18650 in serie | Batteria 2S | Verifica il collegamento in serie del portabatterie |
| Resistenze | Partitore VBAT e selezione del canale SD | Segui la guida e verifica le tensioni prima di collegare |

Non sono state pubblicate misurazioni di potenza, consumo o autonomia del montaggio completo.

## Sequenza di montaggio

Verifica ogni fase prima di passare alla successiva:

1. **Prima l’alimentazione:** carica il pacco 2S, collegalo al LM2596 e **regola il convertitore a 5.0V con il multimetro. Collega gli altri moduli solo quando l’uscita è stabile.**
2. **ESP32:** OUT+ del convertitore → VIN, OUT− → GND. Prova un programma Blink tramite USB.
3. **Amplificatori (×2):** Vin→5V, massa comune, bus I2S (25/26/27) a entrambi. Collega un altoparlante da 4–8Ω direttamente all’uscita di ciascun amplificatore (classe D senza filtro).
4. **LCD:** VCC→5V, GND, SDA=21 / SCL=22.
5. **Firmware:** `tests/test_basic.ino` dovrebbe produrre un tono; poi carica `src/main.ino`.

## Banco di prova prima del montaggio

Per verificare hardware, collegamenti e stabilità prima del montaggio finale, consulta:

- `testbench/README.md`
- `testbench/PINOUT.md`
- `testbench/VALIDATION_PLAN.md`
- `testbench/CHECKLIST_PRE_MONTAJE.md`
- `testbench/firmware/` (test di base, L/R e stabilità stereo)
- `testbench/results/logs/LOG_TEMPLATE.md`

**Prima di collegare i moduli:** ad alimentazione scollegata, verifica la continuità delle masse e l’assenza di cortocircuiti. Controlla separatamente che il regolatore fornisca 5.0V. Le foto di riferimento sono in `pics/build/` e `pics/modules/`.

## Diagnostica

- **Riavvii durante l’uso del WiFi:** controlla alimentazione, cavi e messaggi del monitor seriale per individuare possibili cali di tensione.
- **Rumore:** verifica massa comune, alimentazione e collegamenti I2S. Segui le raccomandazioni di disaccoppiamento del modulo.
- **Distorsione:** prova un volume inferiore e verifica che l’alimentazione resti stabile durante la riproduzione.
- **Un solo canale:** misura SD su ogni amplificatore e confronta la tensione con la scheda tecnica.
- **WiFi non connesso:** verifica le credenziali e che la rete operi a 2,4GHz.

## Stato

In sviluppo: prototipo funzionante. Il codice include radio WiFi, YouTube/Invidious, Bluetooth A2DP, configurazione tramite Bluetooth seriale, LCD e lettura VBAT. È prevista una PCB dedicata.

## Licenza

Consulta le condizioni di licenza di ogni dipendenza prima di ridistribuirla. Questa directory non include un proprio file di licenza.

---

_HIOS — HI Open Systems · [openhios.dev/projects/speaker](https://openhios.dev/projects/speaker)_
