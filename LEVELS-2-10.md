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
| 10 | 3 | Zwei äußere Standardrouten und eine längere mittlere Rage-Route |

Alle generierten Pfade aus Level 2 bis 10 besitzen am oberen Bildschirmrand
einen 24 px langen geraden Einlauf. Dadurch erscheint der Schlangenkopf bei der
anfänglichen Geschwindigkeit nach ungefähr 1,1 Sekunden. Die eigentlichen
Kurvenmuster beginnen erst innerhalb des sichtbaren Spielfelds.

Ab Level 5 wurde die gesamte HP-Kurve um 25 % erhöht:

| Level | Erstes Segment | Letztes Segment |
| --- | ---: | ---: |
| 5 | 94 | 40.000 |
| 6 | 138 | 56.250 |
| 7 | 200 | 77.500 |
| 8 | 288 | 102.500 |
| 9 | 400 | 135.000 |
| 10 | 563 | 175.000 |

### Level 10: Rage-Trio

Die linke und rechte Schlange verwenden die normale Levelgeschwindigkeit. Die
mittlere Schlange legt durch 26 enge Kurvenzyklen deutlich mehr Weg zurück als
beide äußeren Schlangen. Ab Sekunde 15 beginnt alle 15 Sekunden ein dreisekündiger
Rage-Modus, in dem ausschließlich die mittlere Schlange 20 % schneller läuft.
Der aktive Zustand wird mit einem roten Ring und `RAGE` über ihrem Kopf markiert.

## Technik

`levels.js` enthält die Level- und Pfaddefinitionen. Neue Pfade werden dicht
abgetastet und über eine Bogenlängentabelle ausgewertet. Deshalb bedeutet ein
Pixel Laufdistanz auf geraden Stücken und in Kurven dieselbe Bewegung, unabhängig
von der Bildrate. Vor dem Erzeugen eines Levels wird die tatsächliche Länge des
Level-1-Pfads für die aktuelle Spielfeldgröße berechnet. Jeder Pfad aus Level 2
bis 10 muss diese Länge erreichen, sonst wird das Level mit einer klaren
Fehlermeldung abgebrochen.

Seit Version 21.3 verwenden die generierten Routen nur noch 22 px sicheren
Seitenabstand. Die Amplituden jedes Levels sind so ausgelegt, dass die gemeinsame
Route beziehungsweise alle Routen zusammen auf allen getesteten Spielfeldgrößen
links und rechts bis auf höchstens 28 px an den sichtbaren Rand reichen. Der
Schlangenkopf bleibt dabei vollständig im Bild.

Level 7 besitzt zusätzlich eine progressive untere Verdichtung von 15 %. Die
Phasenverschiebung steigt quadratisch entlang der Route: Der obere Abschnitt
bleibt fast unverändert, während sich die zusätzlichen Kurven zunehmend im
unteren Spielfeld sammeln. Dadurch wächst die gesamte Pfadlänge auf den
getesteten Größen um ungefähr 15 %.

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
den höchstens 26 px langen unsichtbaren Einlauf, die breite Randabdeckung, die um rund 15 % verlängerte Level-7-Route, die erhöhten HP-Endpunkte, die
Mehrschlangen-Level einschließlich Level-10-Trio und Rage-Taktung, dynamische Zielwechsel, den Fallback bei unsichtbaren
Segmenten, den Sichtbarkeitsschutz und die Zustandsisolation beider Schlangen.
Die bisherigen Helden-, AOE-, Upgrade-, Speicher- und Kollisionsprüfungen laufen
zusätzlich weiter.
