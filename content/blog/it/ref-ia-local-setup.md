---
title: "IA locale: preparare una prova con llama.cpp"
date: "2026-09-22"
lang: "it"
summary: "Scegliere una build, caricare un modello GGUF e misurare memoria e tempi con una configurazione riproducibile."
tags: ["ia", "llama-cpp", "llm", "locale", "riferimento"]
category: "referencia"
---

llama.cpp permette di eseguire modelli compatibili in ambienti diversi. Per preparare una prova, identifica prima sistema operativo, hardware disponibile e file del modello. Conserva questi dati insieme alla versione del motore.

## Installazione o compilazione

Puoi usare una distribuzione preparata per la tua piattaforma oppure compilare il progetto. Se scegli di compilarlo, segui le dipendenze e le opzioni del backend adatte al tuo hardware. La documentazione include alternative come CUDA e Vulkan: abilitare un’opzione non sostituisce l’installazione dei suoi requisiti. [Guida ufficiale alla compilazione](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md).

Prima di scaricare un modello, verifica che architettura e formato siano compatibili con la versione installata. Controlla anche la licenza e la provenienza del file.

## Dimensione dei pesi e memoria totale

Una stima per pesi memorizzati con un numero uniforme di bit è:

`byte dei pesi ≈ numero di parametri × bit per parametro / 8`

Con otto miliardi di parametri e quattro bit per parametro, il calcolo dà quattro miliardi di byte. È un’approssimazione dei pesi, non una stima completa della memoria necessaria a eseguire il modello.

Il file può includere metadati e una quantizzazione che non usa lo stesso formato per tutti i tensori. L’esecuzione aggiunge altri consumi. Misura il carico reale con il contesto e le opzioni che intendi utilizzare.

## Prima esecuzione

Consulta la guida di `llama-cli` e prepara una richiesta breve. Registra percorso del modello, contesto, limite di output e configurazione GPU. Nomi e opzioni disponibili devono corrispondere alla tua versione. [Documentazione di llama-cli](https://github.com/ggml-org/llama.cpp/tree/master/tools/cli).

Per i modelli di conversazione, controlla il template di chat utilizzato. Se la risposta ha un formato inatteso, verifica questa configurazione insieme al prompt e alla compatibilità del modello.

## Misurare prima di modificare

| Osservazione | Passo successivo |
|---|---|
| Il modello non si carica | Controlla errore, compatibilità e memoria disponibile. |
| La risposta impiega troppo tempo | Registra tempi e uso di CPU/GPU con la configurazione attuale. |
| Il formato della risposta è errato | Controlla template, prompt e opzioni di output strutturato. |
| Una richiesta lunga fallisce | Confronta contesto e consumo con una richiesta breve. |

Modifica una variabile alla volta e ripeti lo stesso caso di prova. Potrai così identificare quale modifica ha prodotto la differenza.

## Registrazione minima

Conserva versione del motore, nome esatto del modello, opzioni di esecuzione, hardware e risultati. Includi errori e limiti insieme alle prove riuscite.

Le stime di memoria servono a pianificare. Tempi e risultati osservati sul tuo computer sono il riferimento per decidere se la configurazione è sufficiente per il progetto.
