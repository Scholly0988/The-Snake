# Ilyra – Hüterin des Winterherzens

## Integration

Ilyra ist ab Version 22.0 kostenlos freigeschaltet und kann ohne Münzkosten auf
der linken oder rechten Seitenplattform ausgerüstet werden. Ihre exklusiven
Karten erscheinen nur in den ersten drei Runden-Slots. Slot 4 bleibt vollständig
dem Standardschützen vorbehalten.

## Startwerte

- Direktschaden: 0,9 zuzüglich allgemeiner flacher Schadensboni
- Feuerrate: 0,80×
- Krit-Chance: gemeinsamer Startwert, ohne eigenen Bonus
- Krit-Schaden: 150 % zuzüglich gemeinsamer Aufwertungen
- Projektilgeschwindigkeit: 95 %
- Projektilgröße: 110 %
- Durchschlag: 0
- Frostdauer: 4 Sekunden
- Eisbruch: 5 Froststapel

Allgemeine flache Schadensboni werden zuerst auf den Frostzepter-Grundschaden
addiert. Der daraus entstehende prozentuale Faktor verstärkt außerdem Eisbruch,
Frostnova, Eissplitter, Kristallexplosion und Schwarzes Eis.

## Froststapel und Eisbruch

Jeder normale Treffer erzeugt einen Froststapel. Alle Stapel eines Segments
teilen einen Timer; neuer Frost erneuert ihn vollständig. Frost auf nicht mehr
sichtbaren Segmenten bleibt aktiv und verlangsamt weiterhin nur die zugehörige
Schlange. Schaden und neuer Frost sind ausschließlich auf sichtbaren Segmenten
möglich.

Jeder aktive Stapel verlangsamt seine Schlange um 1 %, insgesamt höchstens 15 %
durch normale Froststapel. Bei Erreichen der Schwelle verursacht Eisbruch 1,5
Basisschaden, entfernt den Überlauf und gibt der Schlange 1,5 Sekunden lang
weitere 10 % Slow. Verschiedene Slow-Quellen addieren sich, gleiche erneuern nur
ihre Dauer; das Gesamtlimit beträgt 60 %.

Tötet Eisbruch ein Segment, verursacht eine Kristallexplosion in 55 px Radius
0,35 Basisschaden. Sämtliche Ilyra-Schadensquellen können kritisch treffen;
Flächenangriffe würfeln pro Ziel unabhängig.

## Frostnova

Frostnova ist von Beginn an verfügbar. Nach 18 Sekunden wird sie automatisch am
nächstgelegenen sichtbaren Segment ausgelöst; ohne sichtbares Ziel bleibt sie
bereit. Ihr Basisradius beträgt 100 px. Das Hauptziel erhält 1,0 Schaden,
weitere sichtbare Segmente im Radius 0,5 Schaden und alle Ziele einen
Froststapel. Jede getroffene Schlange wird zwei Sekunden lang um 15 %
verlangsamt.

## Winterstille

Nullpunkt schaltet Winterstille frei. Die erste Aktivierung erfolgt 30 Sekunden
nach der Auswahl. Während der sechs Sekunden erhalten alle aktuell und später
sichtbar werdenden Segmente einmal Frost, sichtbare Schlangen werden um 30 %
verlangsamt, normale Treffer erzeugen zwei Stapel und Eisbruch verursacht 25 %
mehr Schaden. Währenddessen liegt die Eisbruchschwelle bei drei Stapeln. Der
nächste Cooldown startet erst nach dem Ende der Winterstille.

## Runden-Upgrades

Die dreistufigen Fähigkeiten Frostbiss, Tiefe Kälte, Permafrost, Eisige
Präzision, Kristallkrit, Kältekette, Splitterbruch, Kristallexplosion, Größerer
Frostbruch, Gletscherprojektil, Eisdurchstoß, Schnellfrost, Große Frostnova,
Konzentrierte Frostnova, Winteratem und Schnellere Frostnova sind vollständig
implementiert. Langer Winter, Eisige Herrschaft und Winter kommt erscheinen
erst nach Nullpunkt.

Jede Grau-, Grün- und Lila-Stufe kann einmal gewählt werden. Prozentwerte
addieren sich; bei festen Ersatzwerten gilt der höchste gewählte Wert.
Wahrscheinlichkeiten über 100 % lösen einmal garantiert aus und verwenden den
Überschuss als Chance auf eine zweite Auslösung.

Besondere Fähigkeiten:

- Lila: Absolute Kälte, Gletscherherz und Eiszeit
- Orange: Frostseuche, Schwarzes Eis und Nullpunkt

Jede besondere Fähigkeit ist einmal pro Run wählbar. Übertragener Frost kann
Eisbruch auslösen, aber Kältekette und Frostseuche werden innerhalb derselben
Übertragungsreaktion nicht erneut weitergegeben.

## Dauerhafte Aufwertungen

Jede Basismechanik und jede Runden-Fähigkeit besitzt im Skillfenster eine
einmalige Aufwertung für 50 Münzen. Die Werte entsprechen vollständig dem in der
Fragerunde bestätigten ersten und zweiten Aufwertungsblock.

## Darstellung

`ilyra-front.png` ist eine transparente, für mobile Ladezeiten auf 512 × 768 px
optimierte Charaktergrafik. Die vorhandene Seitenplattform erhält im Canvas ein
blau-weißes Frostleuchten und umlaufende Kristallpartikel. Froststapel,
Eisbrüche, Nova und Winterstille besitzen eigene sichtbare Effekte.

## Tests

`node test-ilyra.cjs` prüft Grundwerte, Frosttimer, Eisbruch, Zielwahl,
Sichtbarkeit, Slow-Limits, Chancen über 100 %, Frostnova, Nullpunkt,
Winterstille, dauerhafte Aufwertungen, Slot-4-Isolation und die kostenlose
Ausrüstung.
