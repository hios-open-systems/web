---
title: "PAD-Companion: Rechnerstatus und Steuerung im lokalen Netzwerk"
date: "2026-06-24"
lang: "de"
summary: "Welche Informationen der Companion an das PAD sendet, welche Steuerfunktionen er ergänzt und was ohne ihn funktioniert."
tags: ["companion", "Architektur", "local-first"]
category: "devlog"
---

Das PAD kann Tastenkürzel über USB oder Bluetooth senden, ohne den tatsächlichen Zustand des Rechners zu kennen. Ein Befehl zum Ändern der Lautstärke liefert beispielsweise nicht automatisch den anschließend eingestellten Wert zurück.

Der Companion ergänzt diesen Informationskanal. Das Programm auf Basis von Node und TypeScript läuft auf dem Rechner, fragt verfügbare Daten ab und sendet sie über das lokale Netzwerk an das PAD.

## Welche Informationen übertragen werden

Das Programm verwendet `POST /api/state` in einem über `pollMs` einstellbaren Intervall. Es kann Lautstärke, Mikrofonstatus sowie Auslastung oder Temperatur von CPU und GPU übertragen. Welche Daten verfügbar sind, hängt von den vorhandenen Datenanbietern und Sensoren ab.

In der Konfiguration lässt sich auswählen, welche Felder gesendet werden. Ein fehlender Wert bedeutet nicht, dass der Messwert null ist: Möglicherweise stellt der Rechner die Information nicht bereit oder sie konnte nicht abgefragt werden.

## Welche Funktionen den Companion benötigen

| Funktion | Voraussetzung |
|---|---|
| Tastatur-, Maus- und Medienbefehle | HID-Verbindung über USB oder BLE. |
| Tatsächlicher Rechnerstatus auf dem Display | Companion und Netzwerkverbindung. |
| Globale Mikrofonstummschaltung umschalten | Companion und Unterstützung durch das Betriebssystem. |
| Webeditor und Spiegelung der Oberfläche | Konfigurierter und erreichbarer Companion. |

Wenn keine aktuellen Informationen mehr eintreffen, verwendet die Firmware wieder ihren geschätzten Zustand. Dieser bildet die Aktionen des PAD ab und ist keine Bestätigung des Betriebssystems.

## Befehle in Gegenrichtung

Das PAD kann in der Antwort auf `POST /api/state` eine Aktion vom Companion anfordern. Der Companion verarbeitet sie und meldet den resultierenden Zustand in den folgenden Aktualisierungen.

Die globale Mikrofonstummschaltung unterscheidet sich von einem Tastenkürzel für eine Anwendung. Die Steuerung von Besprechungen und Kamera hängt von der aktiven Anwendung und den konfigurierten Tastenkürzeln ab.

## Einrichtung

Folge zum Kompilieren der README des Companion. Trage die Adresse des PAD, das von der Firmware erzeugte Token und das Abfrageintervall ein. Beide Geräte müssen sich über das Netzwerk erreichen können.

Datenanbieter sind für Windows und Linux implementiert. Die Unterstützung für macOS steht noch aus. Die Anleitung enthält Optionen für den automatischen Start unter Windows und einen Benutzerdienst für Linux.

Prüfe zum Abschluss, welche Daten auf dem Display ankommen und was beim Beenden des Companion passiert. So kannst du HID-Aktionen von den Funktionen unterscheiden, die eine Verbindung benötigen.
