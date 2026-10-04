---
title: "Mit KI entwickeln: Code erzeugen und Entscheidungen prüfen"
date: "2026-09-20"
lang: "de"
summary: "Aufgaben strukturieren, generierten Code prüfen und sicherstellen, dass eine Lösung in der Projektumgebung funktioniert."
tags: ["KI", "Meinung", "Demokratisierung", "Web", "Arbeit"]
category: "referencia"
---

Ein Projekt wie HIOS verbindet Oberfläche, Dokumentation, Firmware und Tests. KI-Werkzeuge können Änderungen in diesen Bereichen vorbereiten. Jede Lieferung braucht jedoch eine Prüfung, die den Code mit dem erwarteten Verhalten abgleicht.

Die Menge des generierten Codes sagt nichts darüber aus, wie weit das Projekt vorangekommen ist. Eine Funktion ist dann nützlich, wenn sie die Aufgabe löst, zur Architektur passt und in ihrer späteren Laufzeitumgebung überprüft werden kann.

## Überschaubare Änderungen anfordern

Bei einer klar begrenzten Aufgabe lassen sich falsche Annahmen leichter erkennen. Fordere nicht gleich ein vollständiges Telemetriesystem an, sondern definiere zunächst einen Schritt: ein Paket auswerten, seine Felder validieren oder einen Messwert anzeigen.

Nenne in der Anfrage:

- Das erwartete Ergebnis mit einem Beispiel für Ein- und Ausgabe.
- Die Versionen von Sprache, Framework und Bibliotheken.
- Einschränkungen des Geräts oder Browsers.
- Fehlerfälle, die die Lösung berücksichtigen muss.

Zum Beispiel: „Implementiere einen Parser für dieses Paket mit acht Bytes. Weise unvollständige Eingaben und Werte außerhalb des festgelegten Bereichs zurück. Ergänze Tests für diese Fälle.“ Paketformat und Wertebereiche gehören zur Anfrage; das Modell sollte sie nicht erfinden.

## Entscheidungen und Syntax prüfen

Das Kompilieren ist eine erste Kontrolle. Danach musst du prüfen, wie das Programm mit echten Daten, Fehlern und nicht antwortenden Abhängigkeiten umgeht.

| Bereich | Was prüfen? |
|---|---|
| Oberfläche | Ladezustände, Fehler, Navigation, Barrierefreiheit und Bildschirmgrößen. |
| Daten und Dienste | Eingabevalidierung, Berechtigungen und unerwartete Antworten. |
| Firmware | API-Kompatibilität, verfügbarer Speicher, Zeitlimits und Fehlerbehandlung. |
| Dokumentation | Übereinstimmung von Anleitung, Code und veröffentlichter Version. |

Wenn du eine API nicht kennst, suche ihre Deklaration in der installierten Bibliothek und gleiche die Argumente mit der Dokumentation dieser Version ab. Ein plausibler Name ist kein Beleg dafür, dass die API existiert.

## In der Zielumgebung testen

Prüfe bei Firmware Größe und Lebensdauer der Puffer, die Konfiguration der Aufgaben und das Verhalten beim Ausfall eines Peripheriegeräts. Ein einzelnes Beispiel belegt nicht, dass das gesamte System auf der gewählten Platine funktioniert.

Gehe bei einer Webanwendung die vollständige Interaktion durch. Ein Formular kann korrekt dargestellt werden und trotzdem beim Speichern, Wiederherstellen einer Sitzung oder Anzeigen einer Fehlerantwort scheitern.

Tests müssen das relevante Verhalten einschließlich der Grenzfälle abdecken. Wiederholt ein Test dieselben Annahmen wie der generierte Code, kann er erfolgreich sein, ohne den Fehler zu erkennen.

## Ein überprüfbarer Arbeitsablauf

1. Definiere eine Aufgabe und ihre Abnahmekriterien.
2. Fordere eine begrenzte Änderung an oder implementiere sie.
3. Prüfe Abhängigkeiten, Entscheidungen und Fehlerbehandlung.
4. Führe die passenden Kontrollen aus.
5. Teste die vollständige Interaktion oder das gesamte Gerät.
6. Dokumentiere, was geprüft wurde und was noch offen ist.

Ist eine Änderung zu groß, um sie zu verstehen, teile sie nach Verhalten auf. Du solltest erklären können, was sich geändert hat, warum und wie es überprüft wurde.
