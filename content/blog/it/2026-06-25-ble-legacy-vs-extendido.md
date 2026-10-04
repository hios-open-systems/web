---
title: "BLE sul PAD: modalità di advertising e diagnostica"
date: "2026-06-25"
lang: "it"
summary: "Come scegliere advertising legacy, esteso o duale nel firmware del PAD e distinguere problemi di rilevamento, connessione e riavvio."
tags: ["esp32", "ble", "firmware"]
category: "devlog"
---

Quando il PAD non compare in una scansione Bluetooth, conviene distinguere tre situazioni: il computer non lo rileva, lo rileva ma non si connette, oppure il dispositivo si riavvia durante la connessione.

Il firmware include comandi seriali per confrontare questi stati senza ricompilare. L’implementazione si trova in `projects/pad/src/transport/BleHidTransport.cpp`.

## Modalità disponibili

| Comando seriale | Azione |
|---|---|
| `l` | Selezionare advertising legacy. |
| `e` | Selezionare advertising esteso. |
| `d` | Selezionare modalità duale. |
| `s` | Mostrare lo stato attuale. |
| `c` | Cancellare gli abbinamenti salvati e riavviare l’advertising. |

La modalità predefinita nel codice è quella duale. Queste modalità permettono di provare la compatibilità con adattatori e sistemi diversi; non garantiscono che tutti supportino gli stessi metodi di rilevamento o abbinamento.

## Verificare separatamente rilevamento e connessione

1. Apri il monitor seriale e consulta lo stato con `s`.
2. Prova una modalità di advertising ed esegui una nuova scansione dal computer.
3. Se compare il PAD, tenta la connessione e osserva i messaggi del firmware.
4. Annota adattatore, sistema operativo, versione del firmware e modalità utilizzata.

Se cancelli gli abbinamenti con `c`, dovrai abbinare nuovamente il dispositivo. Controlla anche gli abbinamenti salvati sul computer.

## Riavvii durante l’abbinamento

Il codice inizializza esplicitamente i callback con `setCallbacks(nullptr)`. Il commento nell’implementazione collega questo passaggio a un errore osservato in `NimBLEExtAdvertising`.

Questo dettaglio va letto insieme alla versione di NimBLE usata dal progetto. Non bisogna presumere che ogni errore di connessione abbia la stessa causa o che il comportamento sia identico in tutte le versioni.

## Cosa registrare per riprodurre un problema

Conserva il log seriale del riavvio o dell’errore, la modalità di advertising e le versioni delle dipendenze. Su Linux, una cattura con `btmon` può fornire informazioni dal lato del computer.

Confrontare queste registrazioni aiuta a individuare la fase in cui la connessione fallisce ed evita di trattare un riavvio del dispositivo come un semplice problema di scansione.
