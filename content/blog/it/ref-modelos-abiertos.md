---
title: "Modelli locali: valutare compatibilità e risultati"
date: "2026-09-22"
lang: "it"
summary: "Cosa controllare nella scheda di un modello, come provare l’uso della memoria e a cosa servono gli output strutturati."
tags: ["ia", "open-source", "modelli", "huggingface", "riferimento"]
category: "referencia"
---

Scegliere un modello locale richiede di considerare attività, hardware e ambiente di esecuzione. Un elenco di nomi o dimensioni non basta per sapere come risponderà nel tuo progetto.

## Partire dall’attività

Prepara esempi rappresentativi prima di confrontare i modelli: domande nelle lingue necessarie, file del tipo che elaborerai o codice del progetto. Definisci anche come riconoscere una risposta errata.

Per un’integrazione hardware, valuta separatamente l’interpretazione della richiesta e la validazione dell’azione. Un modello può proporre un comando; l’applicazione deve decidere se eseguirlo.

## Leggere la scheda del modello

La scheda o *model card* può documentare uso previsto, limiti, valutazione e licenza. Verifica quali informazioni pubblica l’autore e quali prove mancano per il tuo caso. Una descrizione promozionale non sostituisce questa verifica. [Documentazione delle model card di Hugging Face](https://huggingface.co/docs/hub/model-cards).

Se scarichi una conversione o una versione quantizzata, registra anche origine, nome esatto e revisione. Conferma che il motore installato supporti il file e la sua architettura.

## Provare la memoria con la tua configurazione

Il contesto fa parte della configurazione da valutare. Ollama documenta che una finestra di contesto più grande richiede più memoria e permette di esaminare l’esecuzione con `ollama ps`. Non estendere il risultato di una richiesta breve a un documento lungo. [Contesto in Ollama](https://docs.ollama.com/context-length).

Per confrontare le prove, annota:

- Modello e variante del file.
- Versione del motore e hardware utilizzato.
- Lunghezza del contesto configurata.
- Memoria osservata durante caricamento e richiesta.
- Tempo fino alla prima risposta e tempo totale.
- Risultati degli esempi di valutazione.

Lo strumento di memoria di Workbench mostra scenari numerici illustrativi con coefficienti semplificati. Non verifica se un modello entra nella memoria del tuo computer: serve misurarne l’esecuzione reale.

## Definire il formato di output

llama.cpp supporta grammatiche GBNF e la conversione di un sottoinsieme di JSON Schema per vincolare il formato generato. Consulta opzioni e limiti della versione utilizzata. [Guida alle grammatiche di llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md).

Un formato valido non dimostra che i valori siano corretti. Dopo aver interpretato la risposta, verifica campi, intervalli e permessi. Prevedi anche risposte incomplete ed errori del server.

## Mantenere un confronto riproducibile

| Criterio | Cosa registrare |
|---|---|
| Qualità | Esempi risolti ed errori trovati. |
| Compatibilità | Motore, versione, architettura e formato del modello. |
| Risorse | Memoria e tempi osservati con la configurazione provata. |
| Uso consentito | Licenza e condizioni applicabili al file scelto. |
| Integrazione | Formato della risposta e validazioni dell’applicazione. |

Esegui di nuovo gli stessi esempi quando cambi modello o aggiorni il motore. Potrai così valutare la modifica sul tuo lavoro reale.
