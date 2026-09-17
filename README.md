# The Snake

## Neues Bewegungs- und Grafikupdate

Finger aufsetzen aktiviert nur die Steuerung. Erst die relative Wischbewegung
verschiebt den Spieler; Loslassen stoppt ihn. Die Schlange läuft zeilenweise
von links nach rechts, dreht innerhalb der Seitenränder 52 Pixel nach unten
und läuft zurück. Überlebende Teile behalten ihre Position auf dem Pfad.

Die Dateien snake-head.png und snake-body.png müssen neben game.js liegen.
Beide wurden mit der integrierten Bildgenerierung erstellt: grüner Schlangenkopf
nach rechts mit goldenen Augen sowie rundes grünes Schuppen-Körpersegment,
handgemalter Arcade-Stil, transparenter Hintergrund, ohne Text.

Technische Tests: node test-game.cjs

Ein mobiles Browser-Arcade-Spiel: Eine segmentierte Schlange bewegt sich in Schlangenlinien von oben nach unten. Der Spieler steuert seine automatisch feuernde Waffe am unteren Bildschirmrand durch Halten und seitliches Wischen.

## Spielregeln

- Vor dem Start wird zwischen Leicht, Normal und Schwer gewählt.
- Die Lebenspunkte jedes folgenden Segments steigen je nach Schwierigkeit um 10 %, 15 % oder 20 % des Grundwertes.
- Die Trefferbereiche der Körperteile sind größer als ihre sichtbare Darstellung, damit das Zielen auf dem Handy zuverlässiger ist.
- Der Kopf besitzt keine eigenen Lebenspunkte. Er sitzt auf dem vordersten intakten Körperteil und wandert nach dessen Zerstörung auf das nächste zurück.
- Sobald alle Körperteile zerstört sind, ist die Schlange besiegt.
- Die Schlange bewegt sich langsam in engen, kurzen Schlangenlinien nach unten.
- Das erste Upgrade-Segment befindet sich an Position 2 der Schlange.
- Danach erscheint alle fünf Segmente ein weiteres Upgrade-Segment.
- Wird ein Segment zerstört, rückt das nächste intakte Segment nach vorn und übernimmt die Kopfposition.
- Beim Zerstören eines Upgrade-Segments hält das Spiel vollständig an.
- Upgrades verbessern Schaden, Feuerrate, Geschossanzahl oder Durchschlag.

## Starten

`index.html` im Browser öffnen oder das Repository über GitHub Pages veröffentlichen.
