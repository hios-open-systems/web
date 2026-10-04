---
title: "FreeRTOS su ESP32: task, comunicazione e diagnostica"
date: "2026-07-23"
lang: "it"
summary: "Concetti per organizzare task, collegare componenti e controllare memoria e tempi in un progetto ESP-IDF."
tags: ["esp32", "freertos", "rtos", "riferimento"]
category: "referencia"
---

ESP-IDF integra FreeRTOS per organizzare task e risorse. Numero di core e configurazione dipendono dal chip e dal progetto: non tutti i membri della famiglia ESP32 hanno due core.

## Task, priorità e affinità

Sui target compatibili con SMP, un task può essere vincolato a un core oppure eseguito senza affinità fissa. I task pronti vengono pianificati in base alla priorità e ai core su cui possono essere eseguiti.

Non presumere una distribuzione universale tra WiFi, Bluetooth e applicazione. Controlla la configurazione della tua versione e misura prima di assegnare priorità o vincolare task a un core. [FreeRTOS in ESP-IDF](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/freertos_idf.html).

## Creare task e scegliere l’affinità

Questo frammento usa il punto di ingresso `setup()` di Arduino-ESP32. Adatta il lavoro del task e controlla il risultato della sua creazione. Non è un’applicazione audio completa.

```cpp
void audioTask(void *param) {
  for (;;) {
    // lavoro periodico
    vTaskDelay(pdMS_TO_TICKS(10));
  }
  // Un task non deve ritornare; se termina, usare vTaskDelete(NULL).
}

void setup() {
  xTaskCreatePinnedToCore(
    audioTask,   // funzione
    "audio",     // nome per il debug
    4096,        // stack in byte in ESP-IDF/Arduino, non in word
    NULL,        // parametro
    3,           // priorità
    NULL,        // handle
    tskNO_AFFINITY // nessun core fisso
  );
}
```

Quando conviene vincolare un task a un core?

- **Affinità fissa:** quando il progetto o le misure giustificano un core specifico.
- **Senza affinità fissa:** `tskNO_AFFINITY` permette allo scheduler di scegliere tra i core disponibili.

Lo stack va dimensionato per ogni task. In ESP-IDF, la dimensione indicata alla creazione è espressa in byte. Controlla l’uso osservato e i casi più impegnativi: la dimensione dell’esempio non è sufficiente per qualsiasi applicazione.

## Comunicare tra task e proteggere le risorse

L’accesso concorrente a dati condivisi richiede coordinamento. Scegli il meccanismo in base ai dati o alle risorse da condividere:

- **Notifiche dei task** (`xTaskNotify` / `ulTaskNotifyTake`): segnalano eventi a un task senza creare una coda. Scegli l’operazione in base all’uso del valore di notifica.
- **Code** (`xQueueSend` / `xQueueReceive`): copiano elementi tra task. Verifica cosa succede quando la coda è piena; da una ISR, usa le varianti `...FromISR`.
- **Semafori e mutex** (`xSemaphoreTake` / `xSemaphoreGive`): usa un mutex per l’accesso esclusivo a una risorsa e un semaforo binario per la segnalazione.

I frammenti seguenti presuppongono che l’applicazione definisca `Event` e `render`. Crea la coda durante l’inizializzazione, verifica che non sia nulla e condividi il suo handle tra produttore e consumatore.

```cpp
QueueHandle_t q = xQueueCreate(8, sizeof(Event));

// Produttore nel contesto di un task; da una ISR usare la variante FromISR.
Event produced{}; // inserire i dati da inviare
if (xQueueSend(q, &produced, 0) != pdTRUE) {
  // gestire la coda piena
}

// Consumatore: l’attesa blocca questo task, non gli altri.
Event ev;
if (xQueueReceive(q, &ev, portMAX_DELAY) == pdTRUE) {
  render(ev);
}
```

## Watchdog e attese

La configurazione del watchdog determina quali task vengono controllati e cosa succede quando superano il tempo consentito. In caso di errore `task_wdt`, verifica quale task ha smesso di avanzare e conserva il log per la diagnosi.

Per attendere un intervallo, `vTaskDelay(pdMS_TO_TICKS(n))` blocca il task e permette l’esecuzione degli altri. Un’attesa attiva come `while (millis() - t0 < 100) {}` consuma tempo CPU. Scegli il meccanismo in base a precisione temporale e carico del sistema.

La risoluzione delle attese dipende dalla frequenza di tick configurata. Controlla questa frequenza e i requisiti temporali prima di scegliere il meccanismo.

## Schemi di organizzazione

- **Interfaccia e lavoro in task separati:** collega display e controlli al task di rete o audio tramite messaggi. Verifica che attese e risorse condivise non blocchino l’interazione.
- **Produttore-consumatore:** mantieni brevi i callback e sposta l’elaborazione in un altro task tramite una coda. Definisci cosa fare quando non c’è spazio.
- **ISR breve:** registra l’evento con un’API adatta alle interruzioni ed elaboralo in un task. Evita operazioni bloccanti e controlla i vincoli della piattaforma.
- **Un task responsabile per risorsa:** concentra l’accesso a display o bus in un task e invia richieste dagli altri. Documenta ordine e capacità delle richieste.

## Riferimento rapido

| Esigenza | Meccanismo |
|---|---|
| Attendere un intervallo | `vTaskDelay(pdMS_TO_TICKS(ms))` |
| Ciclo con periodo stabile | `vTaskDelayUntil` |
| Segnalare un evento semplice a un task | Notifica del task |
| Passare dati a un task | Coda (`xQueueSend/Receive`) |
| Proteggere un bus o una risorsa | Mutex |
| Controllare il margine dello stack | `uxTaskGetStackHighWaterMark` |
