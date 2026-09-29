# Sekundärslots

Das Spiel besitzt zusätzlich zu den drei Hauptpositionen links, Mitte und
rechts drei unabhängige Sekundärslots. Sie liegen als kleinere, um 18 Pixel
nach hinten versetzte Reihe hinter den zugehörigen Hauptslots und verwenden
80 Prozent der normalen Darstellungsgröße.

Solange kein Sekundärcharakter ausgerüstet ist, wird an diesen Positionen nichts
gezeichnet. Das Grundsystem unterstützt spätere Charaktere, Tiere oder magische
Wesen mit eigenem Zustand, Update- und Zeichenverhalten.

## Unterstützte Rollen

- Fallen und andere Bodeneffekte
- Verlangsamung, Festhalten und weitere Kontrolle
- Charaktere ohne eigenen Schaden
- schwächere zusätzliche Angriffe
- Buffs für den jeweils zugeordneten Hauptslot

Jeder Sekundärheld kann die Hooks `update`, `draw`, `modify` und `onEvent`
verwenden. `secondaryModify()` ist für gezielte Werteänderungen am zugeordneten
Hauptslot vorgesehen. Temporäre Bodeneffekte können in einer auf 24 Einträge
begrenzten Effektliste verwaltet werden.

Die Belegung wird als `secondarySlots.left`, `secondarySlots.center` und
`secondarySlots.right` im bestehenden lokalen Spielstand gespeichert. Alte
Spielstände werden automatisch mit drei leeren Sekundärslots erweitert.

## Upgrade-Auswahl

Nach jeder normalen Viererauswahl folgt eine zweite Auswahl mit bis zu drei
Karten der aktuell ausgerüsteten Sekundärhelden. Die Karten aller belegten
Sekundärslots werden dafür in einem gemeinsamen Pool gemischt. Leere Slots und
Sekundärhelden ohne noch verfügbare Karten werden ignoriert. Während beider
Auswahlschritte bleibt die gesamte Runde pausiert. Erst nach der Sekundärwahl
wird das zugehörige Upgrade-Segment vollständig abgearbeitet.
