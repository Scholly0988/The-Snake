# The Snake

## Version 21.1 – Schneller Routeneinstieg und höhere Endlevel-HP

- Alle generierten Schlangenrouten von Level 2 bis 10 beginnen mit einem kurzen
  geraden Einlauf. Der Kopf erreicht den sichtbaren Bereich nun nach rund 24 px
  statt erst nach langen unsichtbaren Kurven.
- Die Segmentleben der Level 5 bis 10 wurden über die jeweilige vollständige
  HP-Kurve um 25 % erhöht. Die neuen Endwerte reichen von 40.000 in Level 5 bis
  175.000 in Level 10.
- Die Mindestlänge aller Routen bleibt mindestens so groß wie der Referenzpfad
  aus Level 1.

## Version 21.0 – Schützen-Arsenal

- Der Standardschütze besitzt jetzt 14 neue dreistufige Runden-Upgrades sowie
  zehn seltene Spezialfähigkeiten für Krit-, Schnellfeuer-, Mehrfachschuss-,
  Durchschlag- und Präzisions-Builds.
- Präzisionsschuss darf beliebig oft gewählt werden. Alle anderen Stufen gelten
  einmal pro Run; Salvenmeister erscheint erst nach aktivem Mehrfachschuss.
- Kugelhagel und Meisterschütze bilden die orangefarbenen Endgame-Fähigkeiten.
  Geschossregen verursacht pro erzeugtem Geschoss 300 % Schaden.
- Sämtliche neuen Fähigkeiten können im reservierten vierten Standard-Slot
  erscheinen. Exklusive Fähigkeiten von Aldric, Vaelric, Selvara und Kaelvar
  bleiben dort ausgeschlossen.
- Für jede neue Fähigkeit steht im Schützen-Skillfenster eine dauerhafte
  Aufwertung zur Verfügung. Laufende Effekte werden im Kampf-HUD angezeigt.

## Version 20.3 – Heldenbalance und Ergebnis teilen

- Selvaras vollständig ausgebauter Einzelziel-Schaden wurde verteilt über Fläschchen, Gift, Explosive Mischung, Giftregen und Giftwolke auf ungefähr 310 DPS angehoben.
- Aldrics vollständig ausgebauter Einzelziel-Schaden wurde verteilt über Feuerrate, Hammer, Heiligen Einschlag, Morgenlicht, Vergeltung und Göttliches Urteil auf ungefähr 285 DPS angehoben.
- Nach Sieg und Niederlage kann das Rundenergebnis über das native Teilen-Menü geteilt werden. Ohne Web-Share-Unterstützung werden Text und Spiellink kopiert.
- Der Teiltext nennt Level, erreichtes Segment und Punktestand.

## Version 20.2 – Vollständige HP-Kurve bei zwei Schlangen

In Level 3, 5, 8 und 10 verwendet jetzt jede der beiden Schlangen unabhängig
die vollständige HP-Kurve des Levels. Das erste Segment beider Schlangen besitzt
den jeweiligen Minimalwert; das letzte Segment beider Schlangen erreicht den
Maximalwert. Alle dazwischenliegenden Segmentleben steigen pro Schlange
prozentual und streng an. Schwierigkeit bleibt als Multiplikator erhalten.

## Version 20.1 – Vier Upgrade-Auswahlen

Beim Zerstören eines besonderen Segments erscheinen jetzt vier unterschiedliche
Upgrade-Karten. Die ersten drei Karten verwenden weiterhin den vollständigen
Pool aus allgemeinen und ausgerüsteten Heldenfähigkeiten. Der vierte Platz ist
fest als **Standard / Schütze** reserviert und kann ausschließlich allgemeinen
Schaden, Feuerrate, Durchschlag, Krit-Upgrades und Schussfähigkeiten des
Standardschützen anbieten. Heldenfähigkeiten können dort nicht erscheinen.

## Version 20.0 – Level 2 bis 10

Die Kampagne umfasst jetzt zehn vorbereitete Level. Level 1 verwendet weiterhin
unverändert den bisherigen Referenzpfad. Level 2 bis 10 besitzen datengetriebene,
deterministische Bewegungsmuster; Level 3, 5, 8 und 10 enthalten zwei technisch
getrennte Schlangen. Automatisch zielende Angriffe bestimmen bei jedem neuen
Schuss die zum Angriffsursprung nächstgelegene Schlange und berücksichtigen nur
sichtbare Segmente. Alte Spielstände mit neun Erstabschluss-Einträgen werden
automatisch auf zehn Level beziehungsweise 30 Kombinationen aus Level und
Schwierigkeit erweitert. Technische Details: [LEVELS-2-10.md](LEVELS-2-10.md).

Tests: `node test-game.cjs`, `node test-shooter.cjs`, `node test-alchemist.cjs`,
`node test-skills.cjs`, `node test-runemaster.cjs` und
`node test-levels-2-10.cjs`.

## Version 19.0 – Kaelvar

Kaelvar, der Meister der lebenden Runen, ist als vierter freischaltbarer
Begleitheld implementiert. Runenkanone, Runenladungen, Runenbruch, Runenschlag,
Großer Runenkreis, alle festgelegten Seltenheits-Upgrades, Sonderfähigkeiten,
Heldenmenü, Plattform-HUD, Browser-Speicherung und transparente Grafik sind
enthalten. Details: [KAELVAR.md](KAELVAR.md).

## Version 18.3

- Unter **Optionen → Spielfeldgröße messen** lassen sich die aktuellen Maße des aktiven Browsers auslesen.
- Der Bericht enthält Spielfeld, gesamten Spielbereich, Layout- und sichtbaren Viewport, Bildschirm, Zoom, Pixelfaktor und Ausrichtung.
- Die Werte können direkt kopiert und als Vorlage für eine feste Spielfeldgröße verwendet werden.

## Version 18.2

- Selvaras Charakterbild besitzt jetzt einen echten transparenten Hintergrund.
- Selvara fokussiert ein sichtbares Segment, bis dessen Giftstapel voll sind.
- Danach wechseln ihre homing Fläschchen automatisch zum nächsten sichtbaren Segment mit freien Giftstapeln.

## Runden-Upgrades

| Effekt | Grau | Grün | Lila |
| --- | --- | --- | --- |
| Schaden | +1 | +2 | +4 |
| Feuerrate | +10 % | +20 % | +30 % |
| Durchschlag | +1 | +2 | +3 |

Jede der drei angebotenen Karten würfelt ihre Stufe unabhängig: 60 % Grau,
25 % Grün, 10 % Lila und 5 % Orange. Innerhalb der Stufe werden verfügbare Effekte gleichmäßig
und ohne doppelte Karten ausgewählt. Nur die Rahmenfarbe kennzeichnet die Stufe;
Farbnamen stehen nicht auf den Karten.
Feuerrate multipliziert die aktuelle Rate, Schaden und Durchschlag addieren sich.

- Grau: +1 Mehrfachschuss fügt ein Geschoss hinzu.
- Grün: Engerer Mehrfachschuss halbiert die aktuelle Streuung.
- Lila: Paralleler Mehrfachschuss startet alle Geschosse nebeneinander in einer
  horizontalen Reihe; alle fliegen geradeaus. Die Reihe bleibt im Spielfeld.
- Streuungs-Upgrades erscheinen erst mit Mehrfachschuss und entfallen nach dem
  parallelen Upgrade. Weitere Geschosse behalten den parallelen Modus.
- Dauerhafte Käufe bleiben unverändert. Versionsanzeige: Multishot 3.

## Lokales Roguelite

- Keine Registrierung, keine Serververbindung. Fortschritt liegt im localStorage dieser Website.
- 1 Münze pro zerstörtem Körperteil, 5 pro Upgrade-Teil; Gutschrift sofort.
- Im Hauptmenü dauerhaft +1 Startschaden oder +10 % Basisfeuerrate kaufen.
- Beide Verbesserungen haben 30 Stufen; Kosten: 20 × (nächste Stufe)² Münzen.
- Runde-Upgrades verschwinden beim Neustart. Dauerhafte Käufe wirken ab der nächsten Runde.
- Münzen, Käufe, Rekord, besiegte Teile, gestartete Runden und zuletzt gewählte Schwierigkeit werden gespeichert.
- Eine laufende Runde wird beim Neuladen nicht fortgesetzt. Bereits verdiente Münzen bleiben erhalten.
- Export als JSON oder Sicherungstext; Import im Hauptmenü mit Bestätigung vor dem Ersetzen.
- Browserdaten löschen/Privatmodus kann Daten entfernen. Regelmäßig Sicherungen exportieren.
- Bei beschädigten Daten oder Änderungen in einem anderen Tab wird nicht still überschrieben.
- Bei Speicherfehlern Hinweis beachten und den aktuellen Fortschritt exportieren.

Für die aktuelle Fassung müssen alle HTML-, CSS-, JavaScript- und Bilddateien
gemeinsam hochgeladen werden. Tests: `node test-game.cjs`, `node test-progress.cjs`,
`node test-skills.cjs` und `node test-alchemist.cjs`.

## Neues Bewegungs- und Grafikupdate

Finger aufsetzen aktiviert nur die Steuerung. Erst die relative Wischbewegung
verschiebt den Spieler; Loslassen stoppt ihn. Die Schlange läuft zeilenweise
von links nach rechts, dreht innerhalb der Seitenränder 52 Pixel nach unten
und läuft zurück. Nach einer Zerstörung rücken alle Teile davor Richtung
Schwanz zurück, bis die Lücke geschlossen ist. Der Abschnitt dahinter bleibt stehen.

Die Dateien snake-head.png und snake-body.png müssen neben game.js liegen.
Beide wurden mit der integrierten Bildgenerierung erstellt: grüner Schlangenkopf
nach rechts mit goldenen Augen sowie rundes grünes Schuppen-Körpersegment,
handgemalter Arcade-Stil, transparenter Hintergrund, ohne Text.

Technische Tests: node test-game.cjs

Ein mobiles Browser-Arcade-Spiel: Eine segmentierte Schlange bewegt sich in Schlangenlinien von oben nach unten. Der Spieler steuert seine automatisch feuernde Waffe am unteren Bildschirmrand durch Halten und seitliches Wischen.

## Spielregeln

- Jede Schlange hat 100 Körperteile plus den separaten Kopf, auch in Folgewellen.

- Vor dem Start wird zwischen Leicht, Normal und Schwer gewählt.
- Das erste Körperteil hat 5 HP. Jedes folgende erhält prozentual mehr: Leicht +10 %, Normal +15 %, Schwer +20 %. Formel: runden(5 × (1 + Rate)^Index); erst am Ende runden. Auf Leicht: 5, 6, 6, 7, 7. Upgrade-Teile haben dieselbe HP-Kurve.
- Über jedem Körperteil stehen seine verbleibenden HP als Zahl; der Kopf hat weiterhin keine eigenen HP.
- Die Trefferbereiche der Körperteile sind größer als ihre sichtbare Darstellung, damit das Zielen auf dem Handy zuverlässiger ist.
- Der Kopf ist separat sichtbar und besitzt keine eigenen Lebenspunkte. Kopftreffer beschädigen das erste Körperteil direkt dahinter.
- Sobald alle Körperteile zerstört sind, ist die Schlange besiegt.
- Die Schlange bewegt sich langsam in engen, kurzen Schlangenlinien nach unten.
- Das zweite Körperteil nach dem Kopf ist das erste Upgrade-Segment.
- Danach erscheint alle fünf Segmente ein weiteres Upgrade-Segment.
- Wird ein Segment zerstört, rücken alle Teile davor einschließlich Kopf um einen Segmentabstand auf der Bahn zurück. Die Teile Richtung Schwanz bleiben an ihrer Position.
- Beim Zerstören eines Upgrade-Segments hält das Spiel vollständig an.
- Upgrades verbessern Schaden, Feuerrate, Geschossanzahl oder Durchschlag.

## Starten

`index.html` im Browser öffnen oder das Repository über GitHub Pages veröffentlichen.

## Spielerplattform (Version Plattform 6)

Anime-Pilot mit Pistole auf einer Metallplattform. Die mittlere Plattform ist
32 Pixel breit; links und rechts sind Andockplätze bei -36/+36 Pixeln vorgesehen.
16 Pixel Randabstand halten nur die mittlere Plattform im Bild. Seitliche
Begleiter dürfen über den Rand ragen, damit die Schlange außen erreichbar bleibt.
Aktuell sind nur der Pilot und zwei kleine Anschlussstücke sichtbar.
Die Geschosse starten an der Pistolenmündung; Drag-Steuerung bleibt relativ.
Neue Grafik: player-platform.png muss neben index.html hochgeladen werden.

Plattform 6: Spieler auf 32 × 61 Pixel verkleinert. Pistolenmündung und
Geschossstart liegen 14 Pixel unter der unteren Linie; auch nahe Körperteile
liegen dadurch vor dem Geschoss und können getroffen werden.

## Layout 7

Grid-Spalten und Menü dürfen unter ihre Inhaltsbreite schrumpfen. Canvas liegt
absolut im Spielfeld und erhält nur seine Bitmap-Auflösung aus JavaScript;
CSS bestimmt dauerhaft die sichtbare Größe. So vergrößern Canvas, Punktestand
und Menütexte nicht das Spielfeld bei Rückkehr ins Hauptmenü.

## Kritische Treffer (Krit 8)

Start pro Runde: 0 % Krit-Chance, Krit-Schaden 150 % des normalen Schadens.
Chance-Upgrades: +2,5 / +5 / +7,5 Prozentpunkte (grau/grün/lila), maximal 100 %.
Krit-Schaden: +15 / +30 / +50 Prozentpunkte, z. B. 150 → 165 %.
Jeder neue gültige Segmenttreffer würfelt unabhängig, auch mit Durchschlag.
Kopftreffer leiten diesen Schaden an das erste Körperteil weiter, ohne Doppelhit.
Bruchteile beim Schaden bleiben erhalten; HP-Anzeige rundet weiterhin auf.
Kritische Treffer erzeugen orange Trefferpartikel. Aktuelle Krit-Werte stehen
unter den Hauptwerten. Chance-Karten entfallen bei 100 %, Krit-Schaden bleibt.
Die Seltenheitschancen 65/25/10 bleiben unverändert.

## Hauptmenü (Menü 9)

Helle Fantasy-Hauskulisse mit goldenem The-Snake-Titel, aktuellem Münzstand,
grünem Spielknopf und drei bedienbaren Navigationspunkten: Upgrades, Hauptmenü,
Optionen. Schwierigkeit bleibt auf der Startseite, permanente Käufe im
Upgrade-Bereich, vorhandener Export/Import unter Optionen. Nach einer Runde
führt Hauptmenü zurück zur Hausansicht. Keine zusätzlichen Währungen oder Konten.

Neue Datei menu-background.png muss mit index.html, style.css und game.js
hochgeladen werden. Hintergrund mit integrierter Bildgenerierung erstellt:
„Vertical 9:16 bright painted fantasy cottage, blue slate roof, warm windows,
flower garden, stone path, distant castle and waterfalls; open sky for title,
darker foreground for controls; no text, logos or UI.“

## Arena 10

Spieloberfläche im Fantasy-Stil: Steinmauern und Laternen als Hintergrund,
goldene Rahmen, dunkelblaue Wertanzeigen mit Krone/Schwert/Pfeilen und eine
kompakte Krit-Leiste. Das Canvas zeigt einen blauen Verlauf, ein deutlicheres
Raster und die rote Verteidigungslinie. Spielfeldhöhe passt in den verfügbaren
Bildschirm; Spielmechanik und lokale Fortschrittsdaten bleiben erhalten.

Upload: index.html, style.css, game.js sowie neue arena-background.png.
Bildmotiv mit integrierter Bildgenerierung erstellt: „Vertical fantasy stone
arena, ivy and amber lanterns at perimeter, blue banners, distant waterfall,
empty navy centre, gold trim; no text, characters, snakes, bullets or UI.“

## Helden 11

Helden-Menü mit aktivem Schützen und zwei leeren Andockplätzen vorbereitet.
Noch keine Heldenrekrutierung oder Ausrüstung. Orange Rahmen und Zielverteilung
60/25/10/5 sind vorbereitet. Da orange Effekte noch nicht festgelegt wurden,
bleiben aktive Runden-Angebote vorerst bei 65/25/10. Erst mit mindestens drei
orangen Karten wird die neue Verteilung aktiviert (drei eindeutige Angebote).

## Paladin 12 – aktueller Stand

Aldric ist für 100 Münzen dauerhaft freischaltbar und links/rechts ausrüstbar.
Alle vereinbarten Paladin-Karten, Licht-Hammer, Flächentreffer und Göttliches
Urteil sind implementiert. Frühere Hinweise auf nur vorbereitete Helden/Orange
sind damit überholt. Regeln, Anfangswerte und Installation: [PALADIN.md](PALADIN.md).

## Arena 12.2

Dekorative Außenabstände oben um 30 und unten um 50 CSS-Pixel reduziert.
Sicherheitsabstände des Geräts begrenzen die Erweiterung, wenn weniger Platz
vorhanden ist. Bei kleinen Displays bleiben mindestens 4 Pixel Rand.
Canvas und Spielerposition passen sich über den bestehenden ResizeObserver an.
Nur index.html und style.css müssen ersetzt werden.

## Upgrades 13

Dauerhafte Krit-Chance (+1 Prozentpunkt pro Kauf) und Krit-Schaden
(+25 Prozentpunkte pro Kauf) im Hauptmenü. Wie die bestehenden Käufe je 30
Stufen, Kosten 20 × nächste Stufe². Wirkung ab nächster Runde für Schützen und
Aldric. Alte Spielstände erhalten Stufe 0; Export/Import enthält die neuen Werte.
Ersetzen: index.html, game.js, progress.js.

## Plattformschüsse 13.1

Pistole und Paladin-Hämmer starten nun am Mittelpunkt ihrer jeweiligen Plattform
(Spieler-Y + 28) statt an der Mündung (Spieler-Y - 20). Die Sprites bleiben an
bisheriger Position. Paralleler Mehrfachschuss bleibt nebeneinander angeordnet.
Gezielte Tests prüfen Treffer nahe der unteren Verlustgrenze für den Schützen
sowie Aldric links und rechts. Ersetzen: index.html, game.js, paladin.js.

## Version 17.0 – Permanente Helden-Skills

Im Heldenmenü gibt es für Schütze, Aldric und Vaelric je einen Skills-Button.
Angriffe und Upgrade-Skills sind getrennt, Seltenheiten werden angezeigt.
Einmalige Aufwertungen kosten jeweils 50 Münzen und gelten ab dem nächsten Run.
Die vollständige Liste und Upload-Anleitung stehen in [SKILLS.md](SKILLS.md).
Neu erforderlich: **skills.js**; es wird vor progress.js geladen.

## Version 18.0 – Selvara

Selvara, die Meisterin der toxischen Essenzen, ist als dritter freischaltbarer
Begleitheld vollständig eingebaut. Sie besitzt ein eigenes Frontbild, zielsuchende
Seuchenfläschchen, unabhängige Giftstapel, Giftübertragung, Giftwolken,
Meisterexperiment sowie die vereinbarten lila und orangen Build-Fähigkeiten.
Heldenauswahl, Plattformwechsel, HUD, lokaler Spielstand und dauerhafte
50-Münzen-Skills unterstützen Selvara. Details: [SELVARA.md](SELVARA.md).

## Version 18.1 – Tablet- und Laptop-Ansicht

Ab 760 Pixel Fensterbreite steht das Spielfeld mittig zwischen zwei ausführlichen
Heldenkarten. Jede ausgerüstete Seitenplattform zeigt dort alle aktuellen
Kampf- und Klassenwerte, gewählte Run-Upgrades einschließlich Seltenheit und
Auswahlanzahl sowie die dauerhaft für 50 Münzen aufgewerteten Skills. Auf dem
Handy bleibt das bisherige kompakte HUD erhalten. Am PC bewegt man die komplette
Plattformgruppe zusätzlich mit den Pfeiltasten oder mit A/D; Touch-Wischen bleibt
unverändert verfügbar.
