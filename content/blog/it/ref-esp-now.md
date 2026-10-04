---
title: "ESP-NOW: comunicazione tra ESP32 senza router"
date: "2026-07-23"
lang: "it"
summary: "Configurare peer, canale, messaggi e cifratura e distinguere la ricezione radio dall’elaborazione nell’applicazione."
tags: ["esp32", "esp-now", "wireless", "riferimento"]
category: "referencia"
---

ESP-NOW è un protocollo Espressif che scambia frame di azione 802.11 specifici del produttore senza stabilire una connessione IP. Permette a dispositivi compatibili di comunicare tramite indirizzo MAC, in unicast o broadcast, senza richiedere un router. Misura latenza e consegna dei messaggi nelle condizioni del tuo montaggio.

## Quando è adatto e quando no

| Scenario | Alternativa da valutare |
|---|---|
| Messaggi brevi tra schede vicine | ESP-NOW |
| Accesso a internet / MQTT / HTTP | WiFi (STA) |
| Comunicazione con un telefono | BLE |
| Rete di nodi con instradamento | ESP-WIFI-MESH o Thread, secondo l’hardware |

ESP-NOW può essere utile per messaggi brevi da sensori, telecomandi o pulsantiere. Conferma che tutti i dispositivi supportino il protocollo. Non sostituisce una connessione IP e non permette di comunicare direttamente con qualsiasi telefono o servizio web.

## Unicast, broadcast e peer

- **Unicast:** invio al MAC di un peer registrato. È prevista una conferma a livello MAC (ACK 802.11), e il callback di invio segnala l’esito della consegna. Questo non conferma che l’applicazione abbia elaborato il messaggio.
- **Broadcast:** invio a `FF:FF:FF:FF:FF:FF`. Non offre cifratura ESP-NOW né conferme individuali di ricezione. Registra anche l’indirizzo broadcast prima dell’invio.
- Prima dell’unicast devi **registrare il peer** con `esp_now_add_peer`, indicando MAC, canale e interfaccia. La documentazione ESP-IDF per ESP32 indica fino a **20 peer**, con un limite separato e configurabile per quelli cifrati. Verifica versione e configurazione di entrambi i dispositivi.

## Canale di comunicazione

Tutti i nodi devono usare lo **stesso canale WiFi**. Controllalo durante la diagnosi dei problemi di comunicazione:

- Se l’ESP32 è in modalità STA senza connettersi a un access point, usa il canale impostato con `esp_wifi_set_channel`.
- Se si connette anche a un access point, **è l’access point a determinare il canale**, che può cambiare. I peer ESP-NOW devono seguirlo.

La coesistenza con WiFi è possibile perché ESP-NOW condivide la radio, ma il canale è uno solo. Configura tutti i dispositivi sullo stesso canale oppure permetti ai nodi non associati all’access point di individuarlo, per esempio tramite scansione o un beacon broadcast dedicato.

## Payload

Il payload massimo classico è di **250 byte per frame**. ESP-NOW v2 nelle versioni recenti di ESP-IDF porta il limite a 1470 byte. Per interoperare con firmware meno recente, resta entro 250 byte. Messaggi più grandi richiedono frammentazione e ricomposizione gestite dall’applicazione, con numeri di sequenza.

## Cifratura

ESP-NOW cifra l’unicast con **CCMP** usando due chiavi:

- **PMK** (Primary Master Key): globale, configurata con `esp_now_set_pmk`.
- **LMK** (Local Master Key): per peer, inserita nella sua struttura con `encrypt = true`.

Il broadcast non supporta la cifratura ESP-NOW. Per messaggi che la richiedono, configura unicast cifrato oppure progetta una protezione a livello applicativo. Usare unicast senza configurare le chiavi non attiva la cifratura.

## Preparare un esempio compatibile

Usa l’esempio ESP-NOW corrispondente alla tua versione di ESP-IDF o Arduino-ESP32. Le firme dei callback possono cambiare tra versioni: confrontale con gli header installati.

La configurazione comprende avvio del WiFi, inizializzazione di ESP-NOW, registrazione dei callback e aggiunta dei peer prima di inviare dati. Controlla il risultato di ogni operazione e registra gli errori.

In ricezione, valida lunghezza e formato prima di interpretare il messaggio. Se l’elaborazione richiede tempo, spostala in un task dedicato perché il callback termini rapidamente.

Il [riferimento ufficiale ESP-NOW](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html) documenta versioni, limiti dei messaggi, cifratura e callback. Verifica i limiti per entrambe le estremità della comunicazione.

## Punti di diagnosi

- **Canale fisso e cambi di canale STA:** quando un nodo si associa a un access point, ne adotta il canale. I nodi rimasti su un altro canale possono smettere di comunicare.
- **Callback bloccanti:** sia il callback di invio sia quello di ricezione vengono eseguiti nel contesto del task WiFi. Evita `delay()`, stampe lunghe ed elaborazioni pesanti. Copia il payload in una coda FreeRTOS ed elaboralo in un altro task.
- **Confondere ACK e consegna all’applicazione:** `ESP_NOW_SEND_SUCCESS` indica che la radio del peer ha confermato il frame, non che la logica applicativa lo abbia elaborato.
- **Risparmio energetico:** verifica come influisce sulla ricezione nella tua configurazione e definisci conferme o tentativi successivi se necessari all’applicazione.
- **Formato dei dati:** definisci dimensioni, ordine dei byte e versione del messaggio. Non presumere che una struttura in memoria abbia la stessa rappresentazione su tutte le schede.
