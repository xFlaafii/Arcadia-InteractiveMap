# Arcadia – Interaktive Weltkarte

Interaktive Karte für die DnD-Welt Arcadia, in der mehrere Runden gleichzeitig spielen.

Die Karte läuft als Claude-Seite: https://claude.ai/artifact/DH22LGUZEkhpTMeBUkqJXT

## Funktionen

- **Eigene Karte**: Die Spielleitung lädt das Kartenbild direkt auf der Seite hoch.
- **Orte**: Stadt, Burg, Dorf, Taverne, Dungeon, Ruine, Landmarke. Jeder Ort hat eine Beschreibung für alle und eine geheime Notiz nur für die Spielleitung.
- **Runden**: Jede Runde hat eine Spielfigur in eigener Farbe. Wird sie verschoben, merkt sich die Karte den bisherigen Weg.
- **Nebel des Krieges**: Mit dem Pinsel aufdecken oder verdecken. Spieler sehen nur aufgedeckte Gebiete und Orte darin.
- **Spieleransicht**: Wer die Karte nur ansehen darf, kann nichts verändern.

## Die Welt

| Kontinent | Vorbild | Wichtige Orte |
| --- | --- | --- |
| Oben rechts: Schwertküste | Faerûn (D&D) | Luskan, Niewinter, Tiefwasser, Baldurs Tor, Silbrigmond, Eiswindtal |
| Grenzgebirge im Osten | Warhammer | Chaoswacht und Mithril-Halle, dahinter die Chaoswüste |
| Wüste rechts: Calimshan | Südliche Schwertküste | Calimport, Memnon, Messingthron, Glasdünen |
| Oben links: Naggaroth | Total War: Warhammer 3 | Naggarond, Ghrond, Karond Kar, Clar Karond, Hag Graef, Har Ganeth |
| Unten rechts: Zul'Rakar | Dschungel à la World of Warcraft | Goldpyramide, Kielbruchbucht, Glutkrater, Zul'Vasha |
| Unten links: Valdorien | Eigene Erfindung | Himmelsdorn, Aurenhall, Sturmwacht, Salzmarkt |

Weltenbäume: Elarion (Hoher Wald), der Dornenbaum (Naggaroth), Zandrassil und die Lianenmutter (Zul'Rakar), Valdrassil und der Silberbaum (Valdorien).

## Rechte

| Wer | Darf |
| --- | --- |
| Spielleitung (Besitzer oder Editor) | alles bearbeiten, Karte hochladen, geheime Notizen sehen |
| Spieler (Viewer) | Karte, aufgedeckte Orte und Runden ansehen |

## Dateien

- `arcadia-karte.html` – Quelltext der Seite. Die aktuellen Daten (Orte, Runden, Nebel) liegen im Speicher der Claude-Seite.
- `daten/orte.json` – Stand der Orte beim ersten Befüllen (Koordinaten von 0 bis 1, relativ zur Karte).
- `karte/arkadia.jpg` – die Grundkarte ohne Zeichnungen.
- `karte/arkadia-illustriert.jpg` – die illustrierte Karte, die auf der Seite angezeigt wird.
- `werkzeuge/kartenzeichner/` – Skripte, mit denen die Illustrationen auf die Grundkarte gezeichnet werden.
