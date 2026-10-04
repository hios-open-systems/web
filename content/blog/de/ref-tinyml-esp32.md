---
title: "TinyML auf dem ESP32-S3: einen Test vorbereiten"
date: "2026-09-23"
lang: "de"
summary: "Ein kompatibles Beispiel auswählen, Speicher prüfen und Ergebnisse messen, bevor Inferenz in ein Gerät integriert wird."
tags: ["KI", "tinyml", "esp32", "tensorflow-lite", "Referenz"]
category: "referencia"
---

Ein TinyML-Test braucht eine konkrete Aufgabe: ein Signal klassifizieren, ein Muster erkennen oder ein Ereignis feststellen. Definiere Eingabe, erwartetes Ergebnis und verfügbare Antwortzeit, bevor du das Modell auswählst.

Diese Anleitung dient als Referenz zum Experimentieren. TinyML und Sprachaufnahme sind in der aktuellen Firmware von HIOS Node AI noch nicht implementiert. Sie fragt Ollama auf einem anderen Rechner ab.

## Mit einem kompatiblen Beispiel beginnen

Espressif pflegt die Komponente `esp-tflite-micro` für ESP-IDF mit Beispielen wie `hello_world`, `micro_speech` und `person_detection`. Die Dokumentation beschreibt unterstützte Versionen, Build-Schritte und die Integration mit ESP-NN. Wähle ein zur Platine passendes Beispiel und folge seiner README. [Offizielles Repository von esp-tflite-micro](https://github.com/espressif/esp-tflite-micro).

Für Spracherkennung lohnt auch ein Blick auf ESP-SR. Die Anleitung unterscheidet Komponenten wie WakeNet und MultiNet und dokumentiert deren Voraussetzungen. Prüfe unterstützte Modelle, Sprachen und Platinen, bevor du die Bedienung entwirfst. [Offizielle ESP-SR-Anleitung für ESP32-S3](https://docs.espressif.com/projects/esp-sr/en/latest/esp32s3/index.html).

## Speicherkonfiguration prüfen

Die Größe der Modelldatei beschreibt nicht den gesamten Speicherbedarf der Anwendung. Berücksichtige auch Eingabepuffer, Arbeitsspeicher des Interpreters und die übrige Firmware.

Eine pauschale Regel wie „die Arena muss immer im SRAM liegen“ ersetzt keinen fertigen Entwurf. Notiere Ort und Größe der Puffer, führe das Beispiel aus und miss das Ergebnis auf der gewählten Platine.

Veröffentlichte Leistungswerte eines Anbieters gelten für ein bestimmtes Modell und eine bestimmte Konfiguration. Halte diese Bedingungen ein, wenn du den Test reproduzieren möchtest. Stelle die Werte nicht als Latenz einer beliebigen Anwendung dar.

## Den vollständigen Ablauf prüfen

1. Führe das Originalbeispiel aus und speichere seine Ausgabe.
2. Ermittle Format, Dimensionen und Typ der Eingabedaten.
3. Bereite bekannte Proben vor und prüfe die Vorverarbeitung.
4. Führe die Inferenz aus und prüfe die Interpretation der Ausgabe.
5. Miss Speicherbedarf und Antwortzeit bei aktiven übrigen Komponenten.
6. Teste unerwartete Eingaben und Initialisierungsfehler.

Wiederhole die Evaluation, wenn du das Modell oder seine Quantisierung änderst. Die Anwendung muss Tensoren passend zum geladenen Modell interpretieren. Nicht jede Ausgabe ist eine Gleitkommazahl, und ein fester Schwellenwert muss vor der Verwendung validiert werden.

## Demonstration und Produktfunktion unterscheiden

Ein Test, der eine Probe erkennt, belegt noch nicht die Eignung für den Dauerbetrieb. Dokumentiere Testdatensatz, Aufnahmebedingungen und beobachtete Fehler.

Bevor du das Ergebnis mit einer physischen Aktion verknüpfst, lege das Verhalten bei unsicherer Klassifikation, Verzögerung oder Modellfehler fest. Diese Logik gehört zum Geräteentwurf.
