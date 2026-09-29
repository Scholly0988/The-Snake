# Level 11 bis 30

## Grundregeln

- Die HP des ersten und letzten Segments steigen in jedem Level gegenüber dem vorherigen Level.
- Innerhalb jeder Schlange steigt jedes Segment streng vom ersten bis zum letzten Segment an.
- Alle Wege sind mindestens so lang wie der Referenzweg aus Level 1 und enden unten an der Gefahrenlinie.
- Die Muster wechseln von Beginn an zwischen senkrechten Rückläufen, Diagonalen, Eckenrundkursen, Diamanten und rechteckigen Spiralen in beiden Richtungen.
- Mehrere Schlangen verwenden synchronisierte, gespiegelte oder gegenläufige Varianten desselben Grundmusters.
- Automatisch zielende Angriffe wählen weiterhin bei jedem Schuss die nächstgelegene sichtbare Schlange.

## Mehrschlangen-Level

| Level | Schlangen | Besonderheit |
| --- | ---: | --- |
| 13 | 2 | Gekreuzte, gespiegelte Diagonalen |
| 15 | 2 | Spiralen im und gegen den Uhrzeigersinn |
| 18 | 2 | Gespiegelter senkrechter Rücklauf |
| 20 | 3 | Synchrones diagonales Geflecht |
| 23 | 2 | Gespiegelte Diamantwege |
| 25 | 2 | Gegenläufige Eckenrundkurse |
| 28 | 2 | Enge Spiegelspiralen |
| 30 | 5 | Fünf leicht zeitversetzte Spiralwege |

Level 30 ist die Ausnahme bei der Segmentmenge: Jede der fünf Schlangen besitzt 100 eigene Segmente und die vollständige HP-Kurve von 21.558 bis 7.590.000 Leben. Insgesamt befinden sich damit 500 unabhängige Segmente im Level.

## Speicherung und Tests

Bestehende Spielstände mit 30 Erstabschlusswerten werden automatisch auf 90 Werte für 30 Level und drei Schwierigkeiten erweitert. `test-levels-11-30.cjs` prüft Levelanzahl, Schlangenzahlen, streng steigende HP, Mindestweglängen, Bildschirmgrenzen, gespiegelte Synchronisierung, das Level-20-Trio, alle fünf vollständigen Level-30-Schlangen und die Spielstandmigration.
