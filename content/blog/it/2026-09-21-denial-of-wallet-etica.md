---
title: "Utilizzo delle API di IA: limiti e monitoraggio"
date: "2026-09-21"
lang: "it"
summary: "Come definire limiti per richieste, risposte e uso degli strumenti per controllare il carico di un’integrazione con IA."
tags: ["ia", "sicurezza", "etica", "opinione"]
category: "referencia"
---

Un’integrazione con IA ha bisogno di limiti operativi, oltre che di risposte utili. Se una richiesta può crescere, ripetersi o eseguire strumenti senza un tetto, diventa difficile prevedere quanto lavoro svolgerà il sistema.

OWASP include il consumo senza limiti tra i rischi delle applicazioni con modelli linguistici. Il problema può incidere su disponibilità, risorse e costi. Le misure proposte includono limiti di utilizzo, controllo delle risorse e monitoraggio dei consumi. [OWASP: Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/).

## Definire cosa viene limitato

Un limite di richieste al minuto non descrive, da solo, il lavoro generato da ogni richiesta. Verifica anche dimensione dell’input, output consentito, concorrenza e azioni che il modello può richiedere.

| Controllo | Domanda di progettazione |
|---|---|
| Richieste | Quante ne può avviare ogni utente o client in un periodo? |
| Input | Quali dimensioni e formati accetta l’applicazione? |
| Output | Quanto contenuto può generare una risposta? |
| Strumenti | Quante chiamate o quanti tentativi può eseguire un’operazione? |
| Concorrenza | Quante operazioni vengono elaborate contemporaneamente? |
| Durata | Quando viene annullata un’operazione che non termina? |

I valori devono riflettere l’uso previsto e i test del sistema. Un numero scelto per una dimostrazione non è una configurazione universale.

## Distinguere un avviso da un limite

Un avviso segnala il raggiungimento di una soglia. Un limite effettivo impedisce di proseguire o rifiuta lavoro aggiuntivo. Verifica quale comportamento offre ciascun controllo del fornitore e quale viene implementato dalla tua applicazione.

Lo stesso criterio vale per i tentativi successivi: registra quando avvengono, quanti sono consentiti e come termina l’operazione se non si ripristina. Non lasciarli crescere senza una condizione di uscita.

## Applicare i controlli dove viene gestita la risorsa

Un pulsante nel client può evitare clic ripetuti durante una richiesta, ma non sostituisce i controlli del servizio che accetta il lavoro. Se più client condividono un server, definisci dove viene conteggiato l’utilizzo complessivo.

In un prototipo locale, inizia registrando richieste, durata, errori e operazioni simultanee. Se aggiungi un fornitore a pagamento, includi il monitoraggio dei consumi appropriato alla sua API e alle sue condizioni.

## Provare cosa succede al raggiungimento di ogni limite

Per ogni controllo, prepara un caso che ne raggiunga il limite e verifica:

- Che il lavoro venga rifiutato o annullato come previsto.
- Che l’utente riceva uno stato comprensibile.
- Che i tentativi automatici non proseguano all’infinito.
- Che le risorse dell’operazione vengano liberate.
- Che l’evento resti disponibile per la diagnosi.

Questa guida descrive criteri di progettazione. Non implica che tutti questi controlli siano implementati nei prototipi HIOS: verifica l’ambito pubblicato di ogni progetto.
