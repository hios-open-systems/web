---
title: "Nutzung von KI-APIs: Grenzen und Überwachung"
date: "2026-09-21"
lang: "de"
summary: "Grenzen für Anfragen, Antworten und Werkzeugaufrufe festlegen, um die Auslastung einer KI-Integration zu kontrollieren."
tags: ["KI", "Sicherheit", "Ethik", "Meinung"]
category: "referencia"
---

Eine KI-Integration braucht neben nützlichen Antworten auch betriebliche Grenzen. Kann eine Anfrage unbegrenzt wachsen, sich wiederholen oder Werkzeuge aufrufen, lässt sich der Arbeitsaufwand des Systems nur schwer abschätzen.

OWASP zählt unbegrenzten Ressourcenverbrauch zu den Risiken von Anwendungen mit Sprachmodellen. Betroffen sein können Verfügbarkeit, Ressourcen und Kosten. Zu den vorgeschlagenen Maßnahmen gehören Nutzungsgrenzen, Ressourcenkontrollen und die Überwachung des Verbrauchs. [OWASP: Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/).

## Festlegen, was begrenzt wird

Eine Grenze für Anfragen pro Minute beschreibt allein noch nicht den Aufwand jeder Anfrage. Prüfe auch Eingabegröße, zulässige Ausgabe, parallele Verarbeitung und die Aktionen, die das Modell anfordern kann.

| Kontrolle | Frage für den Entwurf |
|---|---|
| Anfragen | Wie viele darf ein Nutzer oder Client in einem Zeitraum starten? |
| Eingabe | Welche Größen und Formate akzeptiert die Anwendung? |
| Ausgabe | Wie viel Inhalt darf eine Antwort erzeugen? |
| Werkzeuge | Wie viele Aufrufe oder Wiederholungsversuche sind pro Vorgang erlaubt? |
| Parallelität | Wie viele Vorgänge werden gleichzeitig verarbeitet? |
| Dauer | Wann wird ein Vorgang abgebrochen, der nicht endet? |

Die Werte sollten sich aus der geplanten Nutzung und den Tests des Systems ergeben. Eine für eine Demonstration gewählte Zahl ist keine allgemein gültige Konfiguration.

## Warnung und Grenze unterscheiden

Eine Warnung meldet das Erreichen eines Schwellenwerts. Eine wirksame Grenze verhindert die Fortsetzung oder weist zusätzliche Arbeit zurück. Prüfe, welches Verhalten die Kontrollen des Anbieters bieten und welches deine Anwendung umsetzt.

Dasselbe gilt für Wiederholungsversuche: Halte fest, wann sie auftreten, wie viele erlaubt sind und wie der Vorgang endet, wenn er sich nicht erholt. Wiederholungen brauchen eine Abbruchbedingung.

## Dort begrenzen, wo die Ressource verwaltet wird

Eine Schaltfläche im Client kann während einer Anfrage wiederholte Klicks verhindern. Sie ersetzt aber keine Prüfungen in dem Dienst, der die Arbeit annimmt. Nutzen mehrere Clients denselben Server, lege fest, wo ihre gemeinsame Nutzung erfasst wird.

Beginne bei einem lokalen Prototyp mit der Erfassung von Anfragen, Dauer, Fehlern und gleichzeitigen Vorgängen. Bindest du einen kostenpflichtigen Anbieter ein, ergänze die zu seiner API und seinen Bedingungen passende Verbrauchserfassung.

## Das Erreichen jeder Grenze testen

Bereite für jede Kontrolle einen Fall vor, der die Grenze erreicht, und prüfe:

- Ob die Arbeit wie vorgesehen abgelehnt oder abgebrochen wird.
- Ob der Nutzer einen verständlichen Status erhält.
- Ob automatische Wiederholungsversuche nicht endlos weiterlaufen.
- Ob die Ressourcen des Vorgangs freigegeben werden.
- Ob das Ereignis für die Diagnose verfügbar bleibt.

Diese Anleitung beschreibt Entwurfskriterien. Sie bedeutet nicht, dass alle genannten Kontrollen in den HIOS-Prototypen implementiert sind. Prüfe den veröffentlichten Funktionsumfang des jeweiligen Projekts.
