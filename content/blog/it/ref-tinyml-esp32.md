---
title: "TinyML su ESP32-S3: preparare una prova"
date: "2026-09-23"
lang: "it"
summary: "Scegliere un esempio compatibile, controllare la memoria e misurare i risultati prima di integrare l’inferenza in un dispositivo."
tags: ["ia", "tinyml", "esp32", "tensorflow-lite", "riferimento"]
category: "referencia"
---

Una prova TinyML richiede un’attività concreta: classificare un segnale, riconoscere uno schema o rilevare un evento. Definisci input, risultato previsto e tempo disponibile per rispondere prima di scegliere il modello.

Questa guida è un riferimento per sperimentare. TinyML e acquisizione vocale non sono ancora implementati nel firmware attuale di HIOS Node AI, che interroga Ollama su un altro computer.

## Partire da un esempio compatibile

Espressif mantiene il componente `esp-tflite-micro` per ESP-IDF, con esempi come `hello_world`, `micro_speech` e `person_detection`. La documentazione indica versioni supportate, passaggi di compilazione e integrazione con ESP-NN. Scegli un esempio adatto alla tua scheda e segui il suo README. [Repository ufficiale di esp-tflite-micro](https://github.com/espressif/esp-tflite-micro).

Per il riconoscimento vocale, consulta anche ESP-SR. La guida distingue componenti come WakeNet e MultiNet e ne documenta i requisiti. Conferma modelli, lingue e schede supportati prima di progettare l’interazione. [Guida ufficiale di ESP-SR per ESP32-S3](https://docs.espressif.com/projects/esp-sr/en/latest/esp32s3/index.html).

## Controllare la configurazione della memoria

La dimensione del file del modello non descrive tutto il consumo dell’applicazione. Devi considerare anche buffer di input, memoria di lavoro dell’interprete e resto del firmware.

Non considerare una regola universale come «l’arena deve stare sempre in SRAM» una soluzione completa del progetto. Registra posizione e dimensione dei buffer, esegui l’esempio e misura il risultato sulla scheda scelta.

I dati prestazionali pubblicati da un fornitore si riferiscono a un modello e a una configurazione specifici. Mantieni quelle condizioni per riprodurre la prova; non presentarli come la latenza di qualsiasi applicazione.

## Verificare il percorso completo

1. Esegui l’esempio originale e conserva l’output.
2. Identifica formato, dimensioni e tipo dei dati di input.
3. Prepara campioni noti e verifica la pre-elaborazione.
4. Esegui l’inferenza e controlla come viene interpretato l’output.
5. Misura memoria e tempo di risposta con gli altri componenti attivi.
6. Prova input inattesi ed errori di inizializzazione.

Se cambi il modello o la sua quantizzazione, ripeti la valutazione. L’applicazione deve interpretare i tensori in base al modello caricato: non bisogna trattare ogni output come un numero in virgola mobile o applicare una soglia fissa senza validarla.

## Distinguere una dimostrazione da una funzione del prodotto

Una prova che riconosce un campione non dimostra ancora che la funzione sia pronta per un uso continuo. Documenta l’insieme delle prove, le condizioni di acquisizione e gli errori osservati.

Prima di collegarla a un’azione fisica, definisci cosa succede in caso di classificazione incerta, ritardo o errore del modello. Questa logica fa parte della progettazione del dispositivo.
