---
title: "Externe Dienste und lokale Kontrolle: Abhängigkeiten auswählen"
date: "2026-09-20"
lang: "de"
summary: "Was beim Verbinden eines Geräts mit externen Diensten zu prüfen ist und welche Funktionen auch ohne diese Verbindung verfügbar bleiben sollen."
tags: ["KI", "Meinung", "Open Source", "Demokratisierung"]
category: "referencia"
---

Ein vernetztes Gerät kann von mehreren Systemen abhängen: seiner Firmware, dem lokalen Netzwerk, einem Server und einer externen API. Jede Abhängigkeit ergänzt Funktionen, bringt aber auch Bedingungen für Nutzung, Wartung und Verfügbarkeit mit.

Der Entwurf beginnt mit einer konkreten Frage: Was soll das Gerät noch können, wenn eines dieser Systeme nicht mehr antwortet?

## Funktionen und Voraussetzungen trennen

Eine Anfrage an ein Sprachmodell kann einen Server benötigen. Das Einlesen eines Tasters oder eine lokale Aktion können andere Voraussetzungen haben. Definiere diese Unterschiede, bevor du alles zu einem Ablauf verbindest.

| Aspekt | Externer Dienst | Dienst im lokalen Netzwerk |
|---|---|---|
| Verbindung | Benötigt Zugriff auf den Dienst über das Internet. | Benötigt Zugriff auf den Rechner, auf dem er läuft. |
| Betrieb | Hängt vom Anbieter und der Kontokonfiguration ab. | Erfordert die Wartung von Rechner, Software und Netzwerk. |
| Daten | Prüfe, welche Informationen übertragen und wie sie verarbeitet werden. | Prüfe Zugriffe, Protokolle und verwendete externe Dienste. |
| Änderungen | Beachte API-Versionen, Limits und Nutzungsbedingungen. | Verwalte Versionen und Kompatibilität der Komponenten. |

„Lokal“ bedeutet nicht automatisch „offline“: Ein Gerät, das einen Server im Netzwerk abfragt, bleibt von diesem Server abhängig. Der Begriff allein legt auch nicht Latenz, Datenschutz oder Sicherheit des Systems fest.

## Verhalten bei Fehlern festlegen

Lege für jede Netzwerkanfrage fest, was bei ausbleibender Antwort, ungültigem Format oder Ablehnung durch den Dienst passieren soll. Zeige einen Zustand an, der diese Fälle unterscheidbar macht.

Wenn ein Vorgang länger dauert, sollte die Oberfläche das anzeigen. Erlaubt die Architektur eine Trennung zwischen Anfrage und physischer Bedienung, prüfe trotzdem die Koordination beider Teile und ihre gemeinsam genutzten Ressourcen.

Eine generierte Antwort sollte auch nicht direkt zu einem Hardwarebefehl werden. Validiere Format, zulässige Werte und Berechtigung zur Ausführung. Die Anwendungslogik entscheidet, was das Gerät tun darf.

## Was verfügbarer Quellcode ermöglicht

Der Zugriff auf Firmware und Dokumentation ermöglicht es, Abhängigkeiten zu untersuchen, Verhalten anzupassen und Tests zu reproduzieren. Dazu brauchst du auch Build-Anleitungen, eindeutig benannte Versionen und eine Lizenz, die die geplante Nutzung erlaubt.

Diese Verfügbarkeit erleichtert die Prüfung, ersetzt aber keine Tests und garantiert keine vollständige Implementierung aller Funktionen. Prüfe den Stand und die Einschränkungen jedes Projekts.

## Ein Beispiel aus HIOS

Der Node-AI-Prototyp fragt Ollama von einem ESP32-S3 aus ab und zeigt die Antwort auf einem OLED-Display. Das Modell läuft auf einem anderen Rechner. Um eine Antwort zu erhalten, muss der Mikrocontroller diesen Server erreichen können.

Diese Trennung erlaubt es, die Integration eines Geräts mit einem lokalen Modell zu untersuchen, ohne die Inferenz als bereits auf dem ESP32 laufende Funktion darzustellen. Die in den Entwurfsunterlagen erwähnten Audio- und TinyML-Funktionen sind noch nicht umgesetzt.

## Vor der Wahl einer Architektur

- Liste auf, welche Funktionen ein Netzwerk benötigen und welche ohne Netzwerk funktionieren müssen.
- Definiere Zeitlimits und verständliche Fehlerzustände.
- Prüfe, welche Daten das Gerät verlassen und wohin sie gesendet werden.
- Dokumentiere Versionen und Voraussetzungen jedes Dienstes.
- Teste neben dem Normalbetrieb auch Verbindungsabbrüche und ungültige Antworten.
