---
title: "Companion del PAD: stato del computer e controlli sulla rete locale"
date: "2026-06-24"
lang: "it"
summary: "Quali informazioni il companion invia al PAD, quali controlli aggiunge e quali funzioni restano disponibili senza di esso."
tags: ["companion", "architettura", "local-first"]
category: "devlog"
---

Il PAD può inviare scorciatoie tramite USB o Bluetooth senza conoscere lo stato effettivo del computer. Per esempio, un comando per cambiare il volume non gli comunica automaticamente il valore finale.

Il companion aggiunge questo canale informativo. È un programma in Node e TypeScript che viene eseguito sul computer, legge i dati disponibili e li invia al PAD tramite la rete locale.

## Quali informazioni invia

Il programma usa `POST /api/state` con un intervallo configurabile tramite `pollMs`. Può inviare volume, stato del microfono e dati di carico o temperatura di CPU e GPU, a seconda dei fornitori di dati e dei sensori disponibili.

La configurazione permette di scegliere quali campi inviare. Un valore assente non va interpretato come una misura pari a zero: il computer potrebbe non esporlo oppure il programma potrebbe non essere riuscito a leggerlo.

## Quali funzioni richiedono il companion

| Funzione | Requisito |
|---|---|
| Comandi di tastiera, mouse e multimedia | Connessione HID tramite USB o BLE. |
| Stato effettivo del computer sul display | Companion e connessione di rete. |
| Attivare o disattivare il mute globale del microfono | Companion e supporto del sistema operativo. |
| Editor web e replica dell’interfaccia | Companion configurato e raggiungibile. |

Il firmware torna allo stato stimato quando smette di ricevere informazioni recenti. Questo stato rappresenta le azioni del PAD, non una conferma del sistema operativo.

## Comandi nella direzione opposta

Il PAD può richiedere un’azione al companion nella risposta a `POST /api/state`. Il companion la elabora e comunica lo stato ottenuto negli aggiornamenti successivi.

Il mute globale del microfono è diverso da una scorciatoia inviata a un’applicazione. I controlli per riunioni e videocamera dipendono dall’applicazione attiva e dalle scorciatoie configurate.

## Preparazione

Segui il README del companion per compilarlo. Configura l’indirizzo del PAD, il token generato dal firmware e l’intervallo di interrogazione. I due dispositivi devono poter comunicare tramite la rete.

Sono implementati fornitori di dati per Windows e Linux. Il supporto per macOS è ancora da sviluppare. Le istruzioni includono opzioni di avvio automatico per Windows e un servizio utente per Linux.

Prima di considerare completata la configurazione, verifica quali dati arrivano al display e cosa succede quando arresti il companion. Potrai così distinguere le azioni HID dalle funzioni che dipendono dalla connessione.
