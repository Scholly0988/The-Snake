# The Snake

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
