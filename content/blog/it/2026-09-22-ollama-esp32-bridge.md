---
title: "Collegare HIOS Node AI a Ollama tramite WiFi"
date: "2026-09-24"
lang: "it"
summary: "Preparare il server, verificare l’API e configurare il prototipo ESP32-S3 che mostra le risposte su un display OLED."
tags: ["ia", "esp32", "ollama", "local-first", "tutorial"]
category: "devlog"
---

Il firmware di HIOS Node AI invia a Ollama una richiesta testuale predefinita quando premi un pulsante. La risposta appare su un display OLED SSD1306. L’ESP32-S3 gestisce l’interazione e la comunicazione; il modello viene eseguito su un altro computer.

Il codice di riferimento si trova in `projects/hios-node-ai/src/main.cpp`. Acquisizione vocale, riproduzione audio e TinyML sono ancora da implementare.

## Preparare il server

Installa Ollama sul computer che eseguirà il modello e verifica prima una richiesta da quel computer. Scegli un modello locale che possa essere caricato nella memoria disponibile.

Ollama ascolta su `127.0.0.1:11434` per impostazione predefinita. Per accedervi dall’ESP32, configura `OLLAMA_HOST` con un indirizzo raggiungibile dalla rete locale. La procedura dipende dall’uso dell’applicazione desktop, di un servizio o di un avvio manuale. [Configurazione ufficiale di Ollama](https://docs.ollama.com/faq).

Limita l’accesso al server ai dispositivi della rete che devono usarlo. Modificare l’indirizzo di ascolto non configura automaticamente autenticazione o permessi.

## Verificare l’API prima di caricare il firmware

Prepara un file `richiesta.json`, sostituendo `MODELLO_INSTALLATO` con il nome esatto del tuo modello:

```json
{
  "model": "MODELLO_INSTALLATO",
  "messages": [{ "role": "user", "content": "Spiega brevemente che cos’è I2S." }],
  "stream": false
}
```

Da un altro computer della rete, invia la richiesta con curl all’indirizzo del server:

```bash
curl http://192.168.1.50:11434/api/chat -H "Content-Type: application/json" --data-binary @richiesta.json
```

L’indirizzo è un esempio. Su Windows puoi usare `curl.exe` se il terminale riserva `curl` a un altro comando.

L’endpoint `/api/chat` riceve messaggi di conversazione. Con `stream: false`, la risposta viene restituita come oggetto JSON e il testo si trova in `message.content`. Controlla anche lo stato HTTP e gli errori restituiti. [Riferimento dell’API chat](https://docs.ollama.com/api/chat).

## Configurare il prototipo

Segui il README e lo schema di collegamento del progetto. Prima di compilare, imposta rete WiFi, URL di Ollama, nome del modello e richiesta testuale. Verifica che i pin del display, del pulsante e dell’indicatore corrispondano al tuo montaggio.

Il firmware esegue la richiesta HTTP in `networkTask`, un task FreeRTOS. Il ciclo principale gestisce l’interazione e aggiorna il display. Questa separazione organizza il lavoro, ma non garantisce un tempo di risposta né elimina gli errori di rete.

## Provare gli stati del dispositivo

| Prova | Cosa osservare |
|---|---|
| Server e modello disponibili | Richiesta inviata e risposta sul display. |
| Nome del modello errato | Stato HTTP o messaggio di errore. |
| Server spento | Gestione dell’errore di connessione o del timeout. |
| WiFi disconnesso | Indicazione di disconnessione. |
| Richiesta più lunga | Memoria disponibile, durata e presentazione della risposta. |

Registra la versione del firmware, il modello e il risultato di ogni prova. Se l’API funziona da un computer ma non dal dispositivo, controlla connettività, configurazione e output del monitor seriale prima di cambiare modello.
