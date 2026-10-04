---
title: "FreeRTOS auf ESP32: Aufgaben, Kommunikation und Diagnose"
date: "2026-07-23"
lang: "de"
summary: "Aufgaben strukturieren, Komponenten verbinden und Speicherbedarf sowie Zeiten in einem ESP-IDF-Projekt prüfen."
tags: ["esp32", "freertos", "rtos", "Referenz"]
category: "referencia"
---

ESP-IDF integriert FreeRTOS zur Organisation von Aufgaben und Ressourcen. Kernanzahl und Konfiguration hängen von Chip und Projekt ab. Nicht jedes Mitglied der ESP32-Familie hat zwei Kerne.

## Aufgaben, Prioritäten und Affinität

Auf SMP-fähigen Zielsystemen kann eine Aufgabe an einen Kern gebunden sein oder ohne feste Affinität laufen. Ausführungsbereite Aufgaben werden anhand ihrer Priorität und der für sie zulässigen Kerne eingeplant.

Gehe nicht von einer universellen Verteilung von WLAN, Bluetooth und Anwendung aus. Prüfe die Konfiguration deiner Version und miss das Verhalten, bevor du Prioritäten oder Kernbindungen festlegst. [FreeRTOS in ESP-IDF](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/freertos_idf.html).

## Aufgaben erstellen und Affinität wählen

Dieses Fragment verwendet den Einstiegspunkt `setup()` von Arduino-ESP32. Passe die Arbeit der Aufgabe an und prüfe, ob sie erfolgreich erstellt wurde. Es ist keine vollständige Audioanwendung.

```cpp
void audioTask(void *param) {
  for (;;) {
    // periodische Arbeit
    vTaskDelay(pdMS_TO_TICKS(10));
  }
  // Eine Aufgabe darf nicht zurückkehren; am Ende vTaskDelete(NULL) verwenden.
}

void setup() {
  xTaskCreatePinnedToCore(
    audioTask,   // Funktion
    "audio",     // Debug-Name
    4096,        // Stack in Bytes bei ESP-IDF/Arduino, nicht in Wörtern
    NULL,        // Parameter
    3,           // Priorität
    NULL,        // Handle
    tskNO_AFFINITY // kein fester Kern
  );
}
```

Wann ist eine Kernbindung sinnvoll?

- **Feste Affinität:** wenn Entwurf oder Messungen einen bestimmten Kern rechtfertigen.
- **Ohne feste Affinität:** mit `tskNO_AFFINITY` wählt der Scheduler zwischen verfügbaren Kernen.

Der Stack wird pro Aufgabe dimensioniert. Bei ESP-IDF wird seine Größe beim Erstellen in Bytes angegeben. Prüfe die beobachtete Nutzung und die anspruchsvollsten Fälle. Die Beispielgröße reicht nicht automatisch für jede Anwendung.

## Aufgaben verbinden und Ressourcen schützen

Gleichzeitiger Zugriff auf gemeinsame Daten muss koordiniert werden. Wähle den Mechanismus passend zu den geteilten Daten oder Ressourcen:

- **Task-Benachrichtigungen** (`xTaskNotify` / `ulTaskNotifyTake`): signalisieren Ereignisse an eine Aufgabe ohne zusätzliche Warteschlange. Wähle die Operation passend zur Verwendung des Benachrichtigungswerts.
- **Warteschlangen** (`xQueueSend` / `xQueueReceive`): kopieren Elemente zwischen Aufgaben. Prüfe das Verhalten bei voller Warteschlange. Verwende aus einer ISR die Varianten `...FromISR`.
- **Semaphore und Mutexe** (`xSemaphoreTake` / `xSemaphoreGive`): nutze einen Mutex für exklusiven Ressourcenzugriff und ein binäres Semaphor zur Signalisierung.

Die folgenden Fragmente setzen voraus, dass deine Anwendung `Event` und `render` definiert. Erzeuge die Warteschlange bei der Initialisierung, prüfe sie auf null und teile ihr Handle zwischen Produzent und Konsument.

```cpp
QueueHandle_t q = xQueueCreate(8, sizeof(Event));

// Produzent im Task-Kontext; aus einer ISR die FromISR-Variante verwenden.
Event produced{}; // zu sendende Daten eintragen
if (xQueueSend(q, &produced, 0) != pdTRUE) {
  // volle Warteschlange behandeln
}

// Konsument: Das Warten blockiert diese Aufgabe, nicht die anderen.
Event ev;
if (xQueueReceive(q, &ev, portMAX_DELAY) == pdTRUE) {
  render(ev);
}
```

## Watchdog und Wartezeiten

Die Watchdog-Konfiguration bestimmt, welche Aufgaben überwacht werden und was bei Überschreitung der zulässigen Zeit passiert. Prüfe bei einem `task_wdt`-Fehler, welche Aufgabe nicht mehr vorankommt, und bewahre das Protokoll für die Diagnose auf.

Zum Warten auf ein Intervall blockiert `vTaskDelay(pdMS_TO_TICKS(n))` die Aufgabe und lässt andere laufen. Aktives Warten wie `while (millis() - t0 < 100) {}` verbraucht CPU-Zeit. Wähle den Mechanismus nach Zeitgenauigkeit und Systemlast.

Die Auflösung der Wartezeiten hängt von der konfigurierten Tick-Frequenz ab. Prüfe diese Frequenz und die Zeitanforderungen vor der Auswahl des Mechanismus.

## Organisationsmuster

- **Oberfläche und Arbeit in getrennten Aufgaben:** verbinde Display und Bedienelemente über Nachrichten mit der Netzwerk- oder Audioaufgabe. Prüfe, ob Wartezeiten und gemeinsame Ressourcen die Bedienung blockieren.
- **Produzent-Konsument:** halte Callbacks kurz und verlagere Verarbeitung über eine Warteschlange in eine andere Aufgabe. Lege das Verhalten bei fehlendem Platz fest.
- **Kurze ISR:** erfasse das Ereignis mit einer für Interrupts geeigneten API und verarbeite es in einer Aufgabe. Vermeide blockierende Operationen und prüfe Plattformbeschränkungen.
- **Eine verantwortliche Aufgabe pro Ressource:** bündele den Zugriff auf Display oder Bus in einer Aufgabe. Andere Aufgaben senden Anfragen. Dokumentiere deren Reihenfolge und Kapazität.

## Kurzreferenz

| Bedarf | Mechanismus |
|---|---|
| Ein Intervall warten | `vTaskDelay(pdMS_TO_TICKS(ms))` |
| Schleife mit stabiler Periode | `vTaskDelayUntil` |
| Einfaches Ereignis an eine Aufgabe melden | Task-Benachrichtigung |
| Daten an eine Aufgabe übergeben | Warteschlange (`xQueueSend/Receive`) |
| Bus oder Ressource schützen | Mutex |
| Stack-Reserve prüfen | `uxTaskGetStackHighWaterMark` |
