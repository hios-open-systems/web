---
title: "BLE beim PAD: Advertising-Modi und Diagnose"
date: "2026-06-25"
lang: "de"
summary: "Legacy-, Extended- oder Dual-Advertising in der PAD-Firmware auswählen und Probleme bei Erkennung, Verbindung und Neustart unterscheiden."
tags: ["esp32", "ble", "firmware"]
category: "devlog"
---

Wenn das PAD bei einer Bluetooth-Suche nicht erscheint, solltest du drei Fälle unterscheiden: Der Rechner erkennt es nicht, er erkennt es, kann aber keine Verbindung herstellen, oder das Gerät startet beim Verbindungsaufbau neu.

Die Firmware enthält serielle Befehle, um diese Zustände ohne erneutes Kompilieren zu vergleichen. Die Implementierung steht in `projects/pad/src/transport/BleHidTransport.cpp`.

## Verfügbare Modi

| Serieller Befehl | Aktion |
|---|---|
| `l` | Legacy-Advertising auswählen. |
| `e` | Extended-Advertising auswählen. |
| `d` | Dual-Modus auswählen. |
| `s` | Aktuellen Zustand anzeigen. |
| `c` | Gespeicherte Kopplungen löschen und Advertising neu starten. |

Im Code ist der Dual-Modus voreingestellt. Mit diesen Modi lässt sich die Kompatibilität verschiedener Adapter und Betriebssysteme testen. Sie garantieren nicht, dass alle dieselben Verfahren zur Erkennung oder Kopplung unterstützen.

## Erkennung und Verbindung getrennt prüfen

1. Öffne den seriellen Monitor und frage den Zustand mit `s` ab.
2. Probiere einen Advertising-Modus aus und starte am Rechner eine neue Suche.
3. Wenn das PAD erscheint, versuche eine Verbindung herzustellen und beobachte die Firmware-Meldungen.
4. Notiere Adapter, Betriebssystem, Firmware-Version und verwendeten Modus.

Wenn du gespeicherte Kopplungen mit `c` löschst, musst du das Gerät erneut koppeln. Prüfe auch die auf dem Rechner gespeicherten Kopplungen.

## Neustarts während der Kopplung

Der Code initialisiert Callbacks ausdrücklich mit `setCallbacks(nullptr)`. Der Implementierungskommentar stellt einen Zusammenhang mit einem beobachteten Fehler in `NimBLEExtAdvertising` her.

Dieser Hinweis muss im Zusammenhang mit der vom Projekt verwendeten NimBLE-Version gelesen werden. Nicht jeder Verbindungsfehler hat dieselbe Ursache, und das Verhalten muss nicht in allen Versionen gleich sein.

## Was du zur Reproduktion eines Fehlers festhalten solltest

Bewahre das serielle Protokoll des Neustarts oder Fehlers auf und notiere Advertising-Modus und Versionen der Abhängigkeiten. Unter Linux kann eine Aufzeichnung mit `btmon` Informationen von der Rechnerseite liefern.

Der Vergleich dieser Aufzeichnungen hilft, die fehlerhafte Phase des Verbindungsaufbaus einzugrenzen. So wird ein Neustart des Geräts nicht lediglich als Problem bei der Suche behandelt.
