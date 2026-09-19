# Vaelric – Herr der gebundenen Seelen (Version 14)

## Start und Ausrüstung
1,2 Schaden, 0,85× Feuerrate, 5 % Krit-Chance, 150 % Krit-Schaden,
90 % Projektilgeschwindigkeit, 100 % Größe, kein eigener Durchschlag.
Allgemeine Schadens-, Feuerraten-, Durchschlags- und Krit-Upgrades gelten auch
für Vaelric. Mehrfachschuss gehört weiterhin zum mittleren Schützen.
Projektile starten mittig auf der Plattform. Beide Begleiter passen links/rechts.
Ein belegter Platz wird mit dem bisherigen Platz getauscht (oder ersetzt).
Der erste freigeschaltete Begleiter kostet 100, der zweite 300 Münzen.
Vorhandener Aldric zählt als erster Kauf. Alte Spielstände bleiben gültig.

## Seelen
Von Vaelric beschädigte, später zerstörte Segmente erzeugen eine Seele:
0,6 Schaden, maximal 3 reguläre Seelen. Markierte Segmente erzeugen stärkere
Seelen mit 1,0 Basisschaden. Basis-Markierungschance: 20 %.
Jede Seele schwebt 0,3 s und verfolgt dann ein sichtbares Ziel.
Ein Segment wird pro Seele höchstens einmal getroffen.
Seelenangriffe markieren nicht erneut, zählen aber als Vaelric-Schaden.
Sämtliche Bewegung, Effekte und Timer pausieren bei Upgrade-Auswahl.

## Karten
| Upgrade | Grau | Grün | Lila | Regel |
|---|---|---|---|---|
| Ruhelose Seelen | +1 | +2 | +3 | Wiederholbar, addiert |
| Seelenhunger | +15 % | +30 % | +50 % | Wiederholbar, addiert |
| Dunkles Mal | +10 Punkte | +20 Punkte | +35 Punkte | Jede Stufe einmal, maximal 85 % inklusive Basis |
| Geisterflug | +20 % | +40 % | +70 % | Wiederholbar, addiert |
| Verdammte Bindung | 20 % | 40 % | 70 % | Nur höchste Stufe; ein zusätzlicher Sprung |
| Endlose Diener | +10 Punkte | +20 Punkte | +35 Punkte | Jede Stufe einmal; maximal 65 % |
| Seelenexplosion | +0,3 | +0,6 | +1,0 | Wiederholbar, addiert |
| Verstärkte Bindung | +0,2 | +0,5 | +1,0 | Wiederholbar, addiert auf Basis 1,0 |
| Totenchor | +1 | +2 | +4 | Wiederholbar; erst nach Totenruf |
| Seelensog | 0,3 s | 0,5 s | 0,8 s | Nur höchste Stufe; erst nach Totenruf |
| Fluch des Todes | +10 % | +20 % | +35 % | Wiederholbar, addiert |
| Kettenfluch | 20 % | 35 % | 55 % | Nur höchste Stufe |
| Unheilige Ernte | +5 Punkte | +10 Punkte | +20 Punkte | Jede Stufe einmal; maximal 35 % |

Seelensturm (Grün, einmal): ab 5 aktiven Seelen +25 % Geschwindigkeit und
+20 % Schaden, solange die Schwelle erfüllt ist.
Seelenlegion (Lila, einmal): +5 Plätze, alle Seelen verursachen 20 % weniger Schaden.
Letzter Fluch (Lila, maximal dreimal): Elite-Seelen mit 200/300/400 % des normalen
Seelenschadens. Benötigt markiertes Segment und eine beliebige Stufe Fluch des
Todes. Die Stufe ersetzt den vorherigen Multiplikator.

Totenruf (Orange, einmal): 22 s Basis-Abklingzeit, 0,5 s gemeinsame Aufladung,
anschließend gemeinsamer Angriff und 2 temporäre Seelen plus Totenchor.
Seelensog reduziert den verbleibenden Timer bei jeder tatsächlich erzeugten Seele.

Todessiegel (Orange, einmal): ersetzt Todesexplosionen. Je 5 zerstörte markierte
Segmente entstehen 50 nach außen spiralisierende Seelen mit je 150 % normalen
Seelenschadens. Jede trifft höchstens 3 verschiedene Segmente. Der Wirbel
überschreitet bewusst das reguläre Seelenlimit.

## Konkretisierte Startwerte
Nicht exakt vorgegebene Details: Seelengeschwindigkeit 180 px/s,
Explosionsradius 42 px, kleine Krit-Seele 0,3 Schaden.
Temporäre Totenruf-Seelen halten bis zu 8 s, Wirbelseelen bis zu 12 s oder bis
sie das Spielfeld vollständig verlassen; maximal 3 Treffer bleibt maßgeblich.
Seelen-Schadensboni gelten auch für Elite- und Wirbelseelen. Fluch des Todes
multipliziert zusätzlich den Vaelric-Schaden gegen markierte Ziele.
Kettenreaktionen werden gesammelt abgearbeitet; neue Seelen bewegen sich erst
im nächsten Frame. Totenruf kann sich nicht innerhalb desselben Frames selbst
erneut auslösen.

## Grafik
necromancer-platform.png, erzeugt mit integrierter Bildgenerierung.
Prompt: Single full body male necromancer Vaelric on a small circular metallic
floating platform with docking connectors on both left and right. Transparent
PNG, polished fantasy mobile game painted 3D/anime style, slight overhead front
view. Dark violet robe, silver trim, green runes, partly visible pale face under
hood, glowing eyes, dark staff with floating pale green crystal and violet ghost
particles. Compact centered silhouette, full staff/platform, no background/text.
Geister, Runensiegel, Schweife und Wirbel werden im Canvas animiert.

## Prüfung und Upload
node test-game.cjs
node test-progress.cjs
Automatisierte Logiktests und Zeichenpfade bestanden; kein echter iPhone-Test.
Zum Veröffentlichen ersetzen: index.html, game.js, paladin.js, progress.js.
Neu hinzufügen: necromancer.js und necromancer-platform.png.
Im Menü muss danach „Version: Vaelric 14“ stehen.
