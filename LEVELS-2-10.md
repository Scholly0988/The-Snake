# Level 2 bis 10

## Levelübersicht

| Level | Schlangen | Bewegung |
| --- | ---: | --- |
| 1 | 1 | Bestehender Referenzpfad, unverändert |
| 2 | 1 | Große, weiche Wellen |
| 3 | 2 | Getrennte linke und rechte Schleifenpfade |
| 4 | 1 | Klar erkennbare S-Kurven |
| 5 | 2 | Kreuzende, voneinander unabhängige Wege |
| 6 | 1 | Lange, große Bögen |
| 7 | 1 | Wechselnde weite und enge Kurvenradien |
| 8 | 2 | Große Wellen gegen engere S-Kurven |
| 9 | 1 | Kombinierter komplexer Rundkurs |
| 10 | 2 | Weite Finalbögen gegen engere Seitenwechsel |

## Technik

`levels.js` enthält die Level- und Pfaddefinitionen. Neue Pfade werden dicht
abgetastet und über eine Bogenlängentabelle ausgewertet. Deshalb bedeutet ein
Pixel Laufdistanz auf geraden Stücken und in Kurven dieselbe Bewegung, unabhängig
von der Bildrate. Vor dem Erzeugen eines Levels wird die tatsächliche Länge des
Level-1-Pfads für die aktuelle Spielfeldgröße berechnet. Jeder Pfad aus Level 2
bis 10 muss diese Länge erreichen, sonst wird das Level mit einer klaren
Fehlermeldung abgebrochen.

`state.snakes` enthält getrennte Instanzen mit ID, Segmentliste, Kopfentfernung
und eigenem Pfad. `state.snake` bleibt als flache gemeinsame Sicht bestehen,
damit vorhandene räumliche Flächenangriffe weiterhin ohne Sonderfälle auf alle
sichtbaren Gegner wirken. Zerstören eines Segments verändert nur die zugehörige
Instanz und lässt HP, Pfad und Segmente der anderen Schlange unberührt.

Automatisch zielende Projektile rufen beim Abschuss `nearestSnakeTarget` auf.
Die Funktion prüft alle lebenden Schlangen, verwirft Instanzen ohne sichtbares
gültiges Ziel und vergleicht die Entfernung ihres Kopfes beziehungsweise ersten
sichtbaren Segments zum jeweiligen Angriffsursprung. Erst danach wird innerhalb
der gewählten Schlange das vorderste sichtbare Segment verwendet. Jeder neue
Angriff berechnet diese Auswahl erneut.

## Tests

`test-levels-2-10.cjs` prüft den unveränderten Level-1-Pfad, alle Mindestlängen,
die vier Doppel-Level, dynamischen Zielwechsel, den Fallback bei unsichtbaren
Segmenten, den Sichtbarkeitsschutz und die Zustandsisolation beider Schlangen.
Die bisherigen Helden-, AOE-, Upgrade-, Speicher- und Kollisionsprüfungen laufen
zusätzlich weiter.
