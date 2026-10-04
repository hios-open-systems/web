---
title: "HIOS Node AI über WLAN mit Ollama verbinden"
date: "2026-09-24"
lang: "de"
summary: "Server vorbereiten, API prüfen und den ESP32-S3-Prototyp konfigurieren, der Antworten auf einem OLED-Display anzeigt."
tags: ["KI", "esp32", "ollama", "local-first", "Anleitung"]
category: "devlog"
---

Die Firmware von HIOS Node AI sendet auf Tastendruck eine vordefinierte Textanfrage an Ollama. Die Antwort erscheint auf einem SSD1306-OLED-Display. Der ESP32-S3 übernimmt Bedienung und Kommunikation; das Modell läuft auf einem anderen Rechner.

Der Referenzcode steht in `projects/hios-node-ai/src/main.cpp`. Sprachaufnahme, Audiowiedergabe und TinyML sind noch nicht umgesetzt.

## Server vorbereiten

Installiere Ollama auf dem Rechner, der das Modell ausführen soll, und teste zunächst eine Anfrage auf diesem Rechner. Wähle ein lokales Modell, das sich mit dem verfügbaren Speicher laden lässt.

Ollama lauscht standardmäßig auf `127.0.0.1:11434`. Für den Zugriff vom ESP32 muss `OLLAMA_HOST` auf eine im lokalen Netzwerk erreichbare Adresse eingestellt werden. Das Vorgehen hängt davon ab, ob du die Desktopanwendung, einen Dienst oder einen manuellen Start verwendest. [Offizielle Ollama-Konfiguration](https://docs.ollama.com/faq).

Beschränke den Zugriff auf die Geräte in deinem Netzwerk, die den Server nutzen sollen. Eine andere Listener-Adresse richtet allein noch keine Authentifizierung oder Zugriffsberechtigungen ein.

## API vor dem Flashen prüfen

Erstelle eine Datei `anfrage.json` und ersetze `INSTALLIERTES_MODELL` durch den genauen Namen deines Modells:

```json
{
  "model": "INSTALLIERTES_MODELL",
  "messages": [{ "role": "user", "content": "Erkläre kurz, was I2S ist." }],
  "stream": false
}
```

Sende die Anfrage von einem anderen Rechner im Netzwerk mit curl an die Serveradresse:

```bash
curl http://192.168.1.50:11434/api/chat -H "Content-Type: application/json" --data-binary @anfrage.json
```

Die Adresse ist ein Beispiel. Unter Windows kannst du `curl.exe` verwenden, falls dein Terminal `curl` für einen anderen Befehl reserviert.

Der Endpunkt `/api/chat` nimmt Gesprächsnachrichten entgegen. Mit `stream: false` wird die Antwort als JSON-Objekt geliefert; der Antworttext steht in `message.content`. Prüfe auch den HTTP-Status und zurückgegebene Fehler. [Referenz zur Chat-API](https://docs.ollama.com/api/chat).

## Prototyp konfigurieren

Folge der README und dem Verdrahtungsplan des Projekts. Passe vor dem Kompilieren WLAN, Ollama-URL, Modellname und Textanfrage an. Prüfe, ob die Pins für Display, Taster und Anzeige zu deinem Aufbau passen.

Die Firmware führt die HTTP-Anfrage in `networkTask` aus, einer FreeRTOS-Aufgabe. Die Hauptschleife verarbeitet die Bedienung und aktualisiert das Display. Diese Aufteilung organisiert die Arbeit, garantiert aber weder eine bestimmte Antwortzeit noch eine fehlerfreie Netzwerkverbindung.

## Gerätezustände testen

| Test | Worauf achten? |
|---|---|
| Server und Modell verfügbar | Anfrage wird gesendet, Antwort erscheint auf dem Display. |
| Falscher Modellname | HTTP-Status oder Fehlermeldung. |
| Server ausgeschaltet | Umgang mit Verbindungsfehler oder Zeitüberschreitung. |
| WLAN getrennt | Anzeige der unterbrochenen Verbindung. |
| Längere Anfrage | Verfügbarer Speicher, Dauer und Darstellung der Antwort. |

Notiere Firmware-Version, Modell und Ergebnis jedes Tests. Funktioniert die API vom Rechner aus, aber nicht vom Gerät, prüfe zuerst Verbindung, Konfiguration und Ausgabe des seriellen Monitors, bevor du das Modell wechselst.
