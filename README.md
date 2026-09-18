# The Snake

## Runden-Upgrades

| Effekt | Grau | Grün | Lila |
| --- | --- | --- | --- |
| Schaden | +1 | +2 | +4 |
| Feuerrate | +10 % | +20 % | +30 % |
| Durchschlag | +1 | +2 | +3 |

Jede der drei angebotenen Karten würfelt ihre Stufe unabhängig: 65 % Grau,
25 % Grün, 10 % Lila. Innerhalb der Stufe werden verfügbare Effekte gleichmäßig
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

Upload: index.html, style.css, game.js und NEU progress.js zusammen hochladen.
Grafiken bleiben unverändert. Tests: node test-game.cjs und node test-progress.cjs.

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
