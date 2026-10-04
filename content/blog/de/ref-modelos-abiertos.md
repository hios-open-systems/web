---
title: "Lokale Modelle: Kompatibilität und Ergebnisse bewerten"
date: "2026-09-22"
lang: "de"
summary: "Modellbeschreibungen prüfen, Speicherbedarf testen und strukturierte Ausgaben einordnen."
tags: ["KI", "Open Source", "Modelle", "huggingface", "Referenz"]
category: "referencia"
---

Bei der Wahl eines lokalen Modells kommt es auf Aufgabe, Hardware und Laufzeitumgebung an. Eine Liste von Namen oder Größen reicht nicht aus, um das Verhalten im eigenen Projekt einzuschätzen.

## Mit der Aufgabe beginnen

Bereite vor dem Modellvergleich repräsentative Beispiele vor: Fragen in den benötigten Sprachen, passende Dateitypen oder Code aus dem Projekt. Lege auch fest, woran du eine falsche Antwort erkennst.

Bewerte bei einer Hardwareintegration die Interpretation einer Anfrage und die Validierung der Aktion getrennt. Ein Modell kann einen Befehl vorschlagen; die Anwendung muss entscheiden, ob er ausgeführt werden darf.

## Modellbeschreibung lesen

Eine Modellbeschreibung oder *Model Card* kann Einsatzzweck, Einschränkungen, Evaluation und Lizenz dokumentieren. Prüfe, welche Angaben der Autor veröffentlicht und welche Tests für deinen Anwendungsfall noch fehlen. Werbliche Beschreibungen ersetzen diese Prüfung nicht. [Hugging-Face-Dokumentation zu Model Cards](https://huggingface.co/docs/hub/model-cards).

Wenn du eine Konvertierung oder quantisierte Version herunterlädst, notiere auch Herkunft, genauen Namen und Revision. Prüfe, ob die installierte Laufzeitumgebung die Datei und ihre Architektur unterstützt.

## Speicherbedarf mit deiner Konfiguration testen

Der Kontext gehört zur zu prüfenden Konfiguration. Ollama dokumentiert, dass ein größeres Kontextfenster mehr Speicher benötigt, und stellt mit `ollama ps` eine Möglichkeit zur Prüfung der Ausführung bereit. Übertrage das Ergebnis einer kurzen Anfrage nicht einfach auf ein langes Dokument. [Kontext in Ollama](https://docs.ollama.com/context-length).

Halte für vergleichbare Tests fest:

- Modell und Dateivariante.
- Version der Laufzeitumgebung und verwendete Hardware.
- Eingestellte Kontextlänge.
- Beobachteter Speicherbedarf beim Laden und während der Anfrage.
- Zeit bis zur ersten Antwort und Gesamtdauer.
- Ergebnisse der Evaluationsbeispiele.

Das Speicherwerkzeug der Workbench zeigt illustrative Zahlenbeispiele mit vereinfachten Koeffizienten. Es bestätigt nicht, ob ein Modell auf deine Hardware passt. Dafür musst du die tatsächliche Ausführung messen.

## Ausgabeformat festlegen

llama.cpp unterstützt GBNF-Grammatiken und die Umwandlung einer Teilmenge von JSON Schema zur Einschränkung des erzeugten Formats. Prüfe die Optionen und Grenzen deiner Version. [Grammatik-Anleitung von llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md).

Ein gültiges Format beweist nicht, dass die Werte stimmen. Prüfe nach dem Einlesen der Antwort Felder, Wertebereiche und Berechtigungen. Berücksichtige auch unvollständige Antworten und Serverfehler.

## Vergleiche reproduzierbar halten

| Kriterium | Was festhalten? |
|---|---|
| Qualität | Gelöste Beispiele und gefundene Fehler. |
| Kompatibilität | Laufzeitumgebung, Version, Architektur und Modellformat. |
| Ressourcen | Speicherbedarf und Zeiten der getesteten Konfiguration. |
| Zulässige Nutzung | Lizenz und Bedingungen der ausgewählten Datei. |
| Integration | Antwortformat und Prüfungen der Anwendung. |

Führe dieselben Beispiele erneut aus, wenn du das Modell wechselst oder die Laufzeitumgebung aktualisierst. So bewertest du die Änderung anhand deiner tatsächlichen Aufgaben.
