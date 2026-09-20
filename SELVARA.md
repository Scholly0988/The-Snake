# Selvara – Meisterin der toxischen Essenzen

Selvara ist ein Begleitheld für die linke oder rechte Plattform. Der erste
freigeschaltete Begleiter kostet 100 Münzen, jeder weitere 300 Münzen.

## Grundwerte

- 0,8 Direktschaden
- 0,9× Feuerrate
- 0 % Krit-Chance und 150 % Krit-Schaden
- 90 % Projektilgeschwindigkeit
- jeder Treffer erzeugt einen Giftstapel
- 0,20 Giftschaden pro Sekunde und Stapel
- 4 Sekunden Dauer je eigenständigem Stapel
- maximal 3 Stapel pro Segment

Die Fläschchen verfolgen automatisch das erste Schlangensegment. Schaden und
Gift können nur sichtbare Segmente treffen. Stirbt ein vergiftetes Segment,
wird mit 25 % Grundchance ein Stapel auf einen angrenzenden sichtbaren Körperteil
übertragen.

## Besondere Fähigkeiten

- **Giftwolke (Orange):** alle 18 Sekunden eine vier Sekunden anhaltende Wolke,
  die sichtbare Segmente im Bereich wiederholt vergiftet.
- **Meisterexperiment (Orange):** alle 30 Sekunden für 6 Sekunden zwei Stapel
  pro Fläschchen, +2 Stapellimit, +50 % Giftschaden und eine kleine Explosion.
- **Giftcocktail (Lila):** jeder fünfte Wurf wird zu Feuer-, Frost-, Säure- oder
  Seuchengift.
- **Epidemie (Lila):** 30 % Chance, beim Tod eines vergifteten Segments dessen
  verbleibenden Giftstatus auf ein zufälliges sichtbares Segment zu übertragen.
- **Giftregen (Orange):** jeder zehnte Wurf trifft bis zu fünf verschiedene
  sichtbare Segmente mit 50 % Direktschaden und einem Giftstapel.
- **Mutation (Lila):** nach vier Sekunden ununterbrochener Vergiftung verursacht
  das Gift 50 % mehr Schaden.
- **Lebende Seuche (Orange):** alle drei Sekunden verbreitet jedes aktuell
  vergiftete sichtbare Segment einen Stapel auf ein anderes sichtbares Ziel.

Alle normalen Grau-/Grün-/Lila-Upgrades für Giftstärke, Dauer, Stapellimit,
Übertragung, Explosionen, Giftwolken, Verlangsamung, kritische Treffer und das
Meisterexperiment sind im Upgrade-Pool enthalten. Additive Werte können erneut
gewählt werden; bei abgestuften Funktionswerten gilt die höchste gewählte Stufe.

## Dauerhafte Skills

Im Heldenmenü besitzt Selvara einen eigenen **Skills**-Button. Die dauerhaften
Aufwertungen kosten wie bei den anderen Helden je 50 Münzen und gelten ab dem
nächsten Run. Angriffsfamilien und Upgrade-Skills sind getrennt aufgeführt.

Benötigte Dateien: `alchemist.js` und `selvara-front.png`. `alchemist.js` muss
nach `necromancer.js` und vor `game.js` geladen werden.
