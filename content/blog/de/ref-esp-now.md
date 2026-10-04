---
title: "ESP-NOW: Kommunikation zwischen ESP32-Geräten ohne Router"
date: "2026-07-23"
lang: "de"
summary: "Gegenstellen, Kanal, Nachrichten und Verschlüsselung konfigurieren und Funkempfang von der Verarbeitung in der Anwendung unterscheiden."
tags: ["esp32", "esp-now", "Funk", "Referenz"]
category: "referencia"
---

ESP-NOW ist ein Espressif-Protokoll, das herstellerspezifische 802.11-Action-Frames ohne IP-Verbindung austauscht. Kompatible Geräte kommunizieren über MAC-Adressen per Unicast oder Broadcast, ohne einen Router zu benötigen. Miss Latenz und Nachrichtenzustellung unter den Bedingungen deines Aufbaus.

## Wann es passt und wann nicht

| Szenario | Zu prüfende Alternative |
|---|---|
| Kurze Nachrichten zwischen nahen Platinen | ESP-NOW |
| Internetzugriff / MQTT / HTTP | WLAN (STA) |
| Kommunikation mit einem Telefon | BLE |
| Netz aus Knoten mit Routing | ESP-WIFI-MESH oder Thread, je nach Hardware |

ESP-NOW kann für kurze Nachrichten von Sensoren, Fernbedienungen oder Tastenfeldern sinnvoll sein. Prüfe die Protokollunterstützung aller Geräte. Es ersetzt keine IP-Verbindung und ermöglicht keine direkte Kommunikation mit beliebigen Telefonen oder Webdiensten.

## Unicast, Broadcast und Gegenstellen

- **Unicast:** Senden an die MAC-Adresse einer registrierten Gegenstelle. Es gibt eine Bestätigung auf MAC-Ebene (802.11-ACK); der Sende-Callback meldet den Zustellstatus. Das bestätigt nicht die Verarbeitung durch die Anwendung.
- **Broadcast:** Senden an `FF:FF:FF:FF:FF:FF`. Es gibt weder ESP-NOW-Verschlüsselung noch individuelle Empfangsbestätigungen. Registriere auch die Broadcast-Adresse vor dem Senden.
- Vor Unicast muss die **Gegenstelle registriert** werden: mit `esp_now_add_peer`, MAC-Adresse, Kanal und Schnittstelle. Die ESP-IDF-Dokumentation für ESP32 nennt bis zu **20 Gegenstellen** und eine separate konfigurierbare Grenze für verschlüsselte Gegenstellen. Prüfe Version und Konfiguration beider Geräte.

## Kommunikationskanal

Alle Knoten müssen denselben **WLAN-Kanal** verwenden. Prüfe das bei Kommunikationsproblemen:

- Läuft der ESP32 im STA-Modus ohne Verbindung zu einem Access Point, verwendest du den mit `esp_wifi_set_channel` eingestellten Kanal.
- Verbindet er sich zusätzlich mit einem Access Point, **bestimmt dieser den Kanal**. Er kann sich ändern; die ESP-NOW-Gegenstellen müssen folgen.

Der gemeinsame Betrieb mit WLAN ist möglich, da ESP-NOW dieselbe Funkschnittstelle nutzt. Es gibt aber nur einen Kanal. Konfiguriere alle Geräte entsprechend oder lasse nicht am Access Point angemeldete Knoten den Kanal ermitteln, etwa durch Scannen oder ein eigenes Broadcast-Beacon.

## Nutzdaten

Die klassische maximale Nutzdatenlänge beträgt **250 Bytes pro Frame**. ESP-NOW v2 in neueren ESP-IDF-Versionen erhöht sie auf 1470 Bytes. Für die Zusammenarbeit mit älterer Firmware solltest du bei 250 Bytes bleiben. Größere Nachrichten benötigen Fragmentierung und Wiederzusammensetzung in der Anwendung, einschließlich Sequenznummern.

## Verschlüsselung

ESP-NOW verschlüsselt Unicast mit **CCMP** und zwei Schlüsseln:

- **PMK** (Primary Master Key): global, über `esp_now_set_pmk` konfiguriert.
- **LMK** (Local Master Key): pro Gegenstelle, in deren Struktur mit `encrypt = true` eingetragen.

Broadcast unterstützt die ESP-NOW-Verschlüsselung nicht. Konfiguriere für schutzbedürftige Nachrichten verschlüsselten Unicast oder einen Schutz auf Anwendungsebene. Unicast allein aktiviert ohne Schlüsselkonfiguration keine Verschlüsselung.

## Ein kompatibles Beispiel vorbereiten

Verwende das ESP-NOW-Beispiel für deine ESP-IDF- oder Arduino-ESP32-Version. Callback-Signaturen können sich zwischen Versionen ändern; gleiche sie mit den installierten Headern ab.

Die Einrichtung umfasst WLAN-Start, ESP-NOW-Initialisierung, Registrierung der Callbacks und Hinzufügen der Gegenstellen vor dem Senden. Prüfe das Ergebnis jeder Operation und protokolliere Fehler.

Prüfe beim Empfang Länge und Format, bevor du eine Nachricht interpretierst. Verlagere längere Verarbeitung in eine Arbeitsaufgabe, damit der Callback schnell zurückkehrt.

Die [offizielle ESP-NOW-Referenz](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html) dokumentiert Versionen, Nachrichtengrenzen, Verschlüsselung und Callbacks. Prüfe diese Grenzen an beiden Enden der Verbindung.

## Diagnosepunkte

- **Fester Kanal und Kanalwechsel im STA-Modus:** beim Verbinden mit einem Access Point übernimmt der Knoten dessen Kanal. Andere Knoten auf einem abweichenden Kanal können die Verbindung verlieren.
- **Blockierende Callbacks:** Sende- und Empfangs-Callbacks laufen im Kontext der WLAN-Aufgabe. Vermeide `delay()`, lange Ausgaben und aufwendige Verarbeitung. Kopiere Nutzdaten in eine FreeRTOS-Warteschlange und verarbeite sie in einer anderen Aufgabe.
- **ACK und Verarbeitung verwechseln:** `ESP_NOW_SEND_SUCCESS` bestätigt den Frame-Empfang durch die Gegenstelle auf Funkebene, nicht den Verbrauch durch die Anwendungslogik.
- **Energiesparen:** prüfe seine Auswirkungen auf den Empfang in deiner Konfiguration und definiere bei Bedarf Bestätigungen oder Wiederholungen.
- **Datenformat:** definiere Größen, Byte-Reihenfolge und Nachrichtenversion. Eine Struktur im Speicher muss nicht auf jeder Platine gleich dargestellt sein.
