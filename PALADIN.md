# Aldric – Hüter des Morgenlichts (Paladin 12.1)

## Freischaltung und Team

Einmalig 100 Münzen unter Helden. Danach links oder rechts einsetzen; es gibt
nur einen Aldric. Der Schütze bleibt in der Mitte. Freischaltung und Seite
werden lokal und im Export gespeichert. Alte Version-1-Spielstände behalten
Münzen/Käufe und erhalten einen zunächst gesperrten Paladin. Fehlgeschlagene
Speicherung rollt Käufe und Platzwechsel zurück.

## Grundwerte

2 Schaden, 0,75× Feuerrate gegenüber der Pistole, 0 % Krit-Chance, 150 %
Krit-Schaden, 85 % Projektilgeschwindigkeit, 140 % Projektilgröße, Durchschlag 0.
Die permanente Startschaden-Erhöhung addiert sich; allgemeine Runden-Upgrades
für Schaden, Feuerrate, Krit und Durchschlag wirken auch auf Aldric. Mehrfachschuss
und Streuungs-Upgrades gelten weiter für die Pistole. Paladin-spezifische Karten
wirken nur auf Aldric und erscheinen nur, wenn er in der Runde ausgerüstet ist.

Jeder vierte direkte Hammertreffer löst zusätzlich einen Heiligen Einschlag aus.
Das Hauptsegment erhält normalen (ggf. kritischen) Schaden, andere Segmente in
40 Pixel Radius erhalten 50 % des aktuellen Hammerschadens. Am Anfang also 2 + 1
Nachbarschaden. Flächentreffer erhöhen den Trefferzähler nicht und würfeln keinen
weiteren Krit. Kopf und erstes Körperteil zählen pro Projektil nur einmal.

## Festgelegte Upgrades

Mit vollständig gekauften Skill-Aufwertungen und jeder Run-Fähigkeit einmal
erreicht Aldric im gemeinsamen Vergleichsszenario von Version 20.3 ungefähr
286 Einzelziel-DPS. Der Zuwachs verteilt sich auf Hammer, Einschlag,
Morgenlicht, Vergeltung und Urteil.

| Karte | Seltenheit | Effekt |
| --- | --- | --- |
| Geweihter Hammer | Grau | +20 % Hammerschaden |
| Gesegneter Stahl | Grün | +15 % Projektilgröße |
| Heilige Wucht | Grau / Grün / Lila | +15 / +30 / +50 % Radius |
| Richterspruch | Grün | Einschlag jeden 3. Treffer; einmal, Zähler startet neu |
| Lichtbrecher | Grau / Grün / Lila | +10 / +20 / +40 % Explosionsschaden |
| Hammerflug | Grün | +20 % Projektilgeschwindigkeit |
| Göttlicher Zorn | Orange | Göttliches Urteil freischalten; einmal |
| Göttlicher Zorn | Lila | Danach 20 % kürzere Abklingzeit |
| Vergeltung | Lila | Kritische Hammertreffer erzeugen Lichtschlag; einmal |
| Heilige Klinge | Grün | +1 Durchschlag |
| Morgenlicht | Grün | +20 Prozentpunkte Zweitschlagchance; einmal |
| Morgenlicht | Lila | +50 Prozentpunkte Zweitschlagchance; einmal |

Morgenlicht addiert sich auf 70 %. Prozentuale Schadens-/Radius-/Tempo-Boni
multiplizieren den aktuellen Wert. Alle Rundenboni werden beim Neustart entfernt.

## Konkretisierte Anfangswerte

Göttliches Urteil startet erst nach orangem Unlock: 20 Sekunden Abklingzeit,
0,45 Sekunden sichtbares Aufladen, dann 500 % aktueller Hammerschaden im doppelten
Einschlagsradius (anfangs 80 Pixel). Ziel ist das tiefste sichtbare Körperteil;
ohne sichtbares Ziel wartet die Fähigkeit. Lichtbrecher verstärkt den Flächenschaden.
Vergeltung macht zusätzlich 50 % Hammerschaden am direkt getroffenen Körperteil.
Morgenlicht erzeugt mit seiner Chance einen zusätzlichen Flächentreffer mit
50 % Hammerschaden, verstärkt durch Lichtbrecher. Folgeeffekte sind terminal und
lösen keine weiteren Krit-/Morgenlicht-/Trefferzähler-Effekte aus.

60/25/10/5 sind die Gewichte von Grau/Grün/Lila/Orange. Nur vorhandene, noch nicht
angebotene Karten nehmen teil. Fehlt eine Stufe (z. B. Orange nach Freischaltung),
werden deren Chancen proportional auf verbleibende Stufen verteilt. Karten werden
innerhalb einer Auswahl nicht doppelt angeboten; der orange Unlock hat bei einer
vollständigen Stufenauswahl 5 % Chance pro Ziehung.

Flächenschaden wird anhand eines gemeinsamen Zustands berechnet, bevor Teile
zurückrutschen. Alle zerstörten Upgrade-Segmente geben ihre eigene Auswahl.
Während dieser Auswahlen stehen beide Helden, Geschosse, Effekte und Timer still.

## Assets und Installation

Neue Dateien: paladin.js, paladin-platform.png, holy-hammer.png.
Ersetzen: index.html, style.css, game.js, progress.js.
Alle Dateien liegen im selben Verzeichnis. Versionsanzeige: Paladin 12.1.

Grafiken mit integrierter Bildgenerierung erstellt; Original-PNGs unverändert,
Quellausschnitte werden nur beim Canvas-Zeichnen gewählt.
Paladin-Prompt: adult silver/gold armoured paladin with dark-blue cloth and golden
tree emblem, large warhammer, overhead rear view facing up, compact round metal
platform with left/right docks, isolated transparent background.
Hammer-Prompt: isolated transparent golden light hammer projectile, broad head,
white diamond centre, short handle pointing down, tight glow, no text or UI.

## Nachprüfung 12.1

Geprüft: sämtliche Grundwerte und Upgrade-Stufen, einmalige Karten, additive
70-%-Chance, 100-Münzen-Kauf, beide Seiten, Altspielstände und Export/Import,
Flächenschaden vor Rückrutschen, mehrere pausierte Upgrade-Auswahlen,
Schutz vor erneutem Klick auf alte Karten sowie Runden-Reset.
Die erste Ziehung mit allen Stufen ergibt in 10.000 gleichmäßig verteilten
Zufallswerten exakt 6000/2500/1000/500 Angebote. Zeichenfunktionen mit und ohne
geladene Grafiken auf gültige Koordinaten geprüft. Alle PNGs des ZIPs vollständig
dekodiert. Kein echter Safari-/iPhone-Sichttest.
