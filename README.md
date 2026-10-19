# Arcadia – Interaktive Weltkarte

Interaktive Karte für die DnD-Welt Arcadia, in der mehrere Runden gleichzeitig spielen.

Die Karte läuft als Claude-Seite: https://claude.ai/artifact/DH22LGUZEkhpTMeBUkqJXT

## Funktionen

- **Eigene Karte**: Die Spielleitung lädt das Kartenbild direkt auf der Seite hoch.
- **Orte**: Stadt, Burg, Dorf, Taverne, Dungeon, Ruine, Landmarke. Jeder Ort hat eine Beschreibung für alle und eine geheime Notiz nur für die Spielleitung.
- **Runden**: Jede Runde hat eine Spielfigur in eigener Farbe. Wird sie verschoben, merkt sich die Karte den bisherigen Weg.
- **Nebel des Krieges**: Mit dem Pinsel aufdecken oder verdecken. Spieler sehen nur aufgedeckte Gebiete und Orte darin.
- **Spieleransicht**: Wer die Karte nur ansehen darf, kann nichts verändern.

## Rechte

| Wer | Darf |
| --- | --- |
| Spielleitung (Besitzer oder Editor) | alles bearbeiten, Karte hochladen, geheime Notizen sehen |
| Spieler (Viewer) | Karte, aufgedeckte Orte und Runden ansehen |

## Dateien

- `arcadia-karte.html` – Quelltext der Seite. Daten (Orte, Runden, Nebel) liegen im Speicher der Claude-Seite, nicht im Repo.
