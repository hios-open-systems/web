---
title: "Servizi remoti e controllo locale: scegliere le dipendenze"
date: "2026-09-20"
lang: "it"
summary: "Cosa verificare quando colleghi un dispositivo a servizi esterni e come decidere quali funzioni devono restare disponibili senza quella connessione."
tags: ["ia", "opinione", "open-source", "democratizzazione"]
category: "referencia"
---

Un dispositivo connesso può dipendere da più sistemi: firmware, rete locale, server e API esterna. Ogni dipendenza aggiunge capacità, ma anche condizioni di utilizzo, manutenzione e disponibilità.

La progettazione parte da una domanda concreta: cosa dovrebbe poter fare il dispositivo quando una di queste parti smette di rispondere?

## Separare le funzioni e i loro requisiti

Una richiesta a un modello linguistico può richiedere un server. La lettura di un pulsante o un’azione locale possono avere requisiti diversi. Definisci queste differenze prima di collegare tutto in un unico flusso.

| Aspetto | Servizio remoto | Servizio sulla rete locale |
|---|---|---|
| Connettività | Richiede accesso al servizio tramite internet. | Richiede accesso al computer che lo esegue. |
| Gestione | Dipende dal fornitore e dalla configurazione dell’account. | Richiede la manutenzione di computer, software e rete. |
| Dati | Verifica quali informazioni vengono inviate e come vengono trattate. | Verifica accessi, registri e servizi esterni utilizzati. |
| Modifiche | Segui versioni, limiti e condizioni dell’API. | Gestisci versioni e compatibilità dei componenti. |

«Locale» non significa automaticamente «offline»: un dispositivo che interroga un server in rete continua a dipendere da quel server. Il termine, da solo, non definisce nemmeno latenza, privacy o sicurezza del sistema.

## Definire il comportamento in caso di errore

Per ogni richiesta di rete, stabilisci cosa deve succedere se non arriva una risposta, il formato non è valido o il servizio rifiuta la richiesta. Mostra uno stato che permetta di distinguere questi casi.

Quando un’operazione richiede tempo, l’interfaccia dovrebbe comunicarlo. Se l’architettura permette di separare la richiesta dall’interazione fisica, verifica comunque come si coordinano le due parti e quali risorse condividono.

Una risposta generata non dovrebbe diventare direttamente un comando hardware. Valida il formato, i valori consentiti e l’autorizzazione a eseguire l’azione. È la logica dell’applicazione a decidere cosa può fare il dispositivo.

## Cosa offre il codice disponibile

L’accesso a firmware e documentazione permette di esaminare le dipendenze, adattare i comportamenti e riprodurre i test. Servono anche istruzioni di compilazione, versioni identificate e una licenza che consenta l’uso previsto.

Questa disponibilità facilita la revisione, ma non sostituisce i test né garantisce che tutte le funzioni siano complete. Consulta lo stato e i limiti di ogni progetto.

## Un esempio in HIOS

Il prototipo Node AI interroga Ollama da un ESP32-S3 e mostra la risposta su un display OLED. Il modello viene eseguito su un altro computer: il microcontrollore deve connettersi a quel server per ottenere una risposta.

Questa separazione permette di studiare l’integrazione tra un dispositivo e un modello locale senza presentare l’inferenza come una funzione già eseguita nell’ESP32. Le funzioni audio e TinyML citate nel materiale di progettazione restano da sviluppare.

## Prima di scegliere un’architettura

- Elenca le funzioni che richiedono la rete e quelle che devono funzionare senza.
- Definisci timeout e stati di errore comprensibili.
- Verifica quali dati escono dal dispositivo e dove vengono inviati.
- Documenta versioni e requisiti di ogni servizio.
- Prova disconnessioni e risposte non valide, oltre al funzionamento normale.
