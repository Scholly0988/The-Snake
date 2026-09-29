# Kiko – der Bananenwerfer

Kiko ist ein kostenloser **Sekundärheld** für Verlangsamung, Boden-Effekte und
leichte Unterstützung. Er belegt einen der drei Sekundärslots und erhält nach
jeder Hauptauswahl eine eigene Sekundär-Upgrade-Auswahl.

## Grundwerte

- Bananenschale: 0,4 Schaden, 12 % Slow für 2,5 Sekunden
- Wurfintervall: 4,5 Sekunden; erster Wurf nach 1 Sekunde
- maximal 3 aktive Schalen; Liegedauer 10 Sekunden
- 18 px Auslöseradius; Zielpunkt 1,5 Sekunden vor der nächsten Schlange
- Fluganimation: 0,45 Sekunden
- Rutschiger Fleck: 22 px, 0,15 Schaden, 8 % Slow für 1,5 Sekunden
- Bananenhaufen: alle 18 Sekunden, 34 px, 0,8 Schaden, 20 % Slow für
  3 Sekunden; 12 Sekunden Liegedauer
- Dschungelchaos: alle 30 Sekunden für 6 Sekunden

Ein Haufen löst seinen starken Effekt einmal aus und hinterlässt danach für
2 Sekunden ein Rutschfeld. Normale Schalen und Goldbananen teilen sich das
Aktivlimit; der Haufen besitzt ein getrenntes Limit von eins. Ein neuer Haufen
ersetzt den bisherigen.

## Dschungelchaos

Beim Start landen drei zusätzliche Schalen an unterschiedlichen vorausberechneten
Wegpunkten. Sie dürfen das während der Ultimate um zwei erhöhte Aktivlimit
vorübergehend überschreiten. Während der Ultimate gilt:

- +50 % Bananenschaden
- +8 Prozentpunkte Bananen-Slow
- 1,5 Sekunden Wurfintervall
- bestehende Schalen bleiben nach dem Ende bis zu ihrem normalen Ablauf liegen

Der Cooldown beginnt bei der Aktivierung.

## Runden-Upgrades

Grau, Grün und Lila jeder Familie dürfen jeweils einmal gewählt werden.
Prozentboni addieren sich; feste Zielwerte verwenden die höchste gewählte Stufe.

| Fähigkeit | Grau | Grün | Lila |
| --- | ---: | ---: | ---: |
| Glatte Schale | +4 % Slow | +8 % | +12 % |
| Feste Banane | +15 % Schaden | +30 % | +50 % |
| Mehr Schalen | +1 Maximum | +2 | +3 |
| Schneller Werfer | 4,0 s | 3,5 s | 2,8 s |
| Liegende Schalen | 12 s | 15 s | 18 s |
| Größere Rutschfläche | +15 % Radius | +30 % | +50 % |
| Klebriger Fleck | +20 % Dauer | +40 % | +70 % |
| Extra rutschig | +4 % Slow | +8 % | +12 % |
| Großer Bananenhaufen | +20 % Radius | +35 % | +50 % |
| Schwerer Haufen | +15 %/+4 % | +30 %/+8 % | +50 %/+12 % |
| Wildes Chaos | +1 s | +2 s | +4 s |
| Noch mehr Chaos | +1 Schale | +2 | +3 |

Besondere Karten sind jeweils einmal wählbar:

- Lila: **Bananenkette**, **Affeninstinkt**
- Orange: **Goldene Banane**

Bananenkette kann normale und goldene Schalen, Haufen und Rutschfelder
verstärken. Der Bonus von +50 % wird durch den ersten folgenden Treffer
verbraucht und stapelt nicht mehrfach auf demselben Feld.

## Schadens- und Slow-Regeln

Allgemeine flache Schadensboni geben Kiko 25 % ihres Werts. Aus diesem Wert
wird ein gemeinsamer Faktor für Schalen, Haufen und Rutschfelder gebildet.
Feste Banane wird danach multiplikativ verrechnet. Kikos Schaden kann nicht
kritisch treffen.

Verschiedene Slow-Quellen addieren sich, gleiche Kiko-Quellen erneuern nur ihre
Dauer. Zusammen mit allen anderen Helden gilt ein Gesamtlimit von 60 % je
Schlange. Fallen reagieren nur auf sichtbare Segmente. Berührt der Kopf eine
Falle, wird der Schaden auf das nächste sichtbare intakte Körpersegment
umgeleitet.

## Dauerhafte Aufwertungen

Jede kostet einmalig 50 Münzen:

- Bananenschale: 0,5 statt 0,4 Grundschaden
- Rutschiger Fleck: 0,20 Schaden und 1,8 Sekunden Grunddauer
- Bananenhaufen: 1,0 Schaden und 16 Sekunden Cooldown
- Dschungelchaos: 27 Sekunden Cooldown und 1,35 Sekunden Wurfintervall
- Goldene Banane: 25 % statt 20 % Chance
- Bananenkette: 45 % statt 35 % Chance
- Affeninstinkt: 0,7 statt 1 Sekunde

Kikos transparente Frontgrafik ist `kiko-front.png`. Die kleine Holzplattform,
Blätter, Fallen, Flugbahnen und Rutschfelder werden direkt über Canvas gezeichnet.

