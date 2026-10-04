---
title: "Lokale KI: einen Test mit llama.cpp vorbereiten"
date: "2026-09-22"
lang: "de"
summary: "Build auswählen, GGUF-Modell laden und Speicherbedarf sowie Laufzeiten mit einer reproduzierbaren Konfiguration messen."
tags: ["KI", "llama-cpp", "llm", "lokal", "Referenz"]
category: "referencia"
---

llama.cpp kann kompatible Modelle in unterschiedlichen Umgebungen ausführen. Halte zur Vorbereitung eines Tests zunächst Betriebssystem, verfügbare Hardware und Modelldatei fest. Bewahre diese Angaben zusammen mit der Version der Laufzeitumgebung auf.

## Installieren oder kompilieren

Du kannst eine fertige Distribution für deine Plattform verwenden oder das Projekt selbst kompilieren. Beim Kompilieren benötigst du die Abhängigkeiten und Backend-Optionen für deine Hardware. Die Dokumentation beschreibt unter anderem CUDA und Vulkan. Eine aktivierte Option ersetzt nicht die Installation ihrer Voraussetzungen. [Offizielle Build-Anleitung](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md).

Prüfe vor dem Herunterladen eines Modells, ob Architektur und Format mit der installierten Version kompatibel sind. Prüfe außerdem Lizenz und Herkunft der Datei.

## Größe der Gewichte und Gesamtspeicher

Für Gewichte, die mit einer einheitlichen Anzahl von Bits gespeichert werden, gilt näherungsweise:

`Bytes der Gewichte ≈ Anzahl der Parameter × Bits pro Parameter / 8`

Bei acht Milliarden Parametern und vier Bits pro Parameter ergibt das vier Milliarden Bytes. Diese Rechnung schätzt die Gewichte ab, nicht den gesamten Speicherbedarf zur Ausführung des Modells.

Die Datei kann Metadaten und eine Quantisierung enthalten, die nicht für alle Tensoren dasselbe Format verwendet. Während der Ausführung kommt weiterer Speicherbedarf hinzu. Miss die tatsächliche Auslastung mit dem Kontext und den Optionen, die du verwenden möchtest.

## Erster Lauf

Lies die Hilfe von `llama-cli` und bereite eine kurze Anfrage vor. Notiere Modellpfad, Kontext, Ausgabelimit und GPU-Konfiguration. Die verfügbaren Namen und Optionen müssen zu deiner Version passen. [Dokumentation von llama-cli](https://github.com/ggml-org/llama.cpp/tree/master/tools/cli).

Prüfe bei Gesprächsmodellen die verwendete Chat-Vorlage. Hat die Antwort ein unerwartetes Format, kontrolliere diese Einstellung zusammen mit Prompt und Modellkompatibilität.

## Vor dem Anpassen messen

| Beobachtung | Nächster Schritt |
|---|---|
| Das Modell wird nicht geladen | Fehlermeldung, Kompatibilität und verfügbaren Speicher prüfen. |
| Die Antwort dauert zu lange | Zeiten und CPU-/GPU-Nutzung mit der aktuellen Konfiguration erfassen. |
| Das Antwortformat ist falsch | Vorlage, Prompt und Optionen für strukturierte Ausgaben prüfen. |
| Eine lange Anfrage schlägt fehl | Kontext und Speicherbedarf mit einer kurzen Anfrage vergleichen. |

Ändere jeweils nur eine Variable und wiederhole denselben Testfall. So lässt sich erkennen, welche Anpassung den Unterschied verursacht hat.

## Mindestangaben im Protokoll

Halte Version der Laufzeitumgebung, genauen Modellnamen, Ausführungsoptionen, Hardware und Ergebnisse fest. Dokumentiere neben erfolgreichen Tests auch Fehler und Einschränkungen.

Speicherschätzungen unterstützen die Planung. Ob eine Konfiguration für das Projekt ausreicht, beurteilst du anhand der auf deiner Hardware beobachteten Zeiten und Ergebnisse.
