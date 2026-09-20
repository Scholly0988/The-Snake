# Helden-Skills – Version 17.0

Jeder Skill kostet einmalig 50 Münzen. Ein Kauf gilt für alle zugehörigen Seltenheiten, wird im Browser sowie im Export gespeichert und wirkt ab dem nächsten Run. Gesperrte Helden können angesehen, aber erst nach Freischaltung aufgewertet werden. Run-Upgrades werden durch einen Kauf nicht freigeschaltet. Alte Spielstände starten ohne Skill-Käufe.

## Schütze

### Angriffe

| Skill | Seltenheiten | Aufwertung für 50 Münzen |
|---|---|---|
| Pistole | Basis | +20 % direkter Pistolenschaden. |

### Upgrade-Skills

| Skill | Seltenheiten | Aufwertung für 50 Münzen |
|---|---|---|
| Schaden | Grau, Grün, Lila | Schadensbonus jeder Auswahl +20 %. |
| Feuerrate | Grau, Grün, Lila | Je Auswahl 5 Prozentpunkte mehr. |
| Durchschlag | Grau, Grün, Lila | Je Auswahl 1 zusätzliches Segment. |
| Krit-Chance | Grau, Grün, Lila | Je Auswahl 1 Prozentpunkt mehr. |
| Krit-Schaden | Grau, Grün, Lila | Je Auswahl 10 Prozentpunkte mehr. |
| Mehrfachschuss | Grau | 2 statt 1 zusätzliches Geschoss je Auswahl. |
| Engerer Mehrfachschuss | Grün | Verringert die Streuung um 60 %. |
| Paralleler Mehrfachschuss | Lila | Parallele Pistolengeschosse fliegen 20 % schneller. |

## Aldric

### Angriffe

| Skill | Seltenheiten | Aufwertung für 50 Münzen |
|---|---|---|
| Hammer des Morgenlichts | Basis | +20 % direkter Hammerschaden; keine Verstärkung der Explosionen. |
| Heiliger Einschlag | Basis | +20 % Schaden dieser Explosion (50 → 60 %). |
| Göttliches Urteil | Orange | 750 % statt 500 % Hammerschaden. |

### Upgrade-Skills

| Skill | Seltenheiten | Aufwertung für 50 Münzen |
|---|---|---|
| Morgenlicht | Grün, Lila | Der Zusatztreffer verursacht 75 % statt 50 % Hammerschaden. |
| Vergeltung | Lila | 100 % statt 50 % Zusatzschaden. |
| Geweihter Hammer | Grau | +30 % statt +20 % je Auswahl. |
| Gesegneter Stahl | Grün | +25 % statt +15 % je Auswahl. |
| Hammerflug | Grün | +30 % statt +20 % je Auswahl. |
| Heilige Klinge | Orange | Spezialhammer verursacht +25 % direkten Trefferschaden. |
| Hammer der Vorfahren | Lila | Heilige Klinge bei jedem 3. Wurf. |
| Heilige Wucht | Grau, Grün, Lila | +20 / +35 / +55 % Radius je Auswahl. |
| Lichtbrecher | Grau, Grün, Lila | +20 / +30 / +50 % je Auswahl. |
| Richterspruch | Grün | Heiliger Einschlag bei jedem 2. Treffer. |
| Göttlicher Zorn | Orange, Lila | Orange: 18 s Grundabklingzeit. Lila: 25 % kürzere Abklingzeit. |

## Vaelric

### Angriffe

| Skill | Seltenheiten | Aufwertung für 50 Münzen |
|---|---|---|
| Seelenstab | Basis | +20 % direkter Stabschaden. |
| Gebundene Seele | Basis | +20 % Schaden normaler und markierter Seelen; auch bei Totenruf. |

### Upgrade-Skills

| Skill | Seltenheiten | Aufwertung für 50 Münzen |
|---|---|---|
| Ruhelose Seelen | Grau, Grün, Lila | +2 / +3 / +4 Plätze je Auswahl. |
| Seelenhunger | Grau, Grün, Lila | +20 / +35 / +55 % je Auswahl. |
| Dunkles Mal | Grau, Grün, Lila | Wartezeit zwischen Versuchen: 0,75 statt 1 Sekunde. |
| Geisterflug | Grau, Grün, Lila | +30 / +50 / +80 % je Auswahl. |
| Verdammte Bindung | Grau, Grün, Lila, Orange | +20 % Schaden bei Sprungtreffern und der Sprungexplosion. |
| Endlose Diener | Grau, Grün, Lila | Mit Endlosen Dienern nur 4 statt 5 s warten. |
| Seelenexplosion | Grau, Grün, Lila | +20 % Schaden dieser Explosion. |
| Verstärkte Bindung | Grau, Grün, Lila | +2,2 / +2,5 / +3 Basis je Auswahl. |
| Totenchor | Grau, Grün, Lila | +2 / +3 / +5 Seelen je Auswahl. |
| Seelensog | Grau, Grün, Lila | 0,4 / 0,6 / 0,9 s Verkürzung. |
| Fluch des Todes | Grau, Grün, Lila | +15 / +25 / +40 % je Auswahl. |
| Kettenfluch | Grau, Grün, Lila | 30 / 45 / 65 % Chance. |
| Seelensturm | Grün | Wird bereits ab 4 Seelen aktiv. |
| Unheilige Ernte | Grau, Grün, Lila | Kleine Seelen: 2 statt 1,5 Basisschaden. |
| Letzter Fluch | Lila | +20 % Schaden der Elite-Seelen. |
| Seelenlegion | Lila | Nur −10 % statt −20 % Seelenschaden. |
| Todessiegel | Orange | Wirbelseelen: 2,5 statt 2 Basisschaden, jeweils plus Waffenschaden. |
| Totenruf | Orange | 20 statt 22 s Grundabklingzeit. |

## Installation

Neu hochladen: `skills.js`. Ersetzen: `index.html`, `style.css`, `game.js`, `progress.js`, `paladin.js`, `necromancer.js`. Alle Dateien liegen gemeinsam im Repository-Hauptordner.

## Prüfung

`node test-game.cjs`, `node test-progress.cjs`, `node test-skills.cjs`. Die Tests verwenden einen simulierten DOM/Canvas; eine visuelle Mobilbrowser-Prüfung wurde nicht durchgeführt.
