# Seraphine – Meisterin der Glut

Seraphine ist ab Version 23.0 kostenlos freigeschaltet und kann links oder
rechts ausgerüstet werden. Ihre exklusiven Karten erscheinen nur in den ersten
drei Upgrade-Slots; Slot 4 bleibt ausschließlich dem Standardschützen
vorbehalten.

## Grundwerte

- Glutstab: 1,0 Direktschaden, 0,85× Feuerrate, 95 % Projekttempo,
  110 % Projektilgröße und kein Grunddurchschlag.
- Jeder normale Treffer erzeugt 1 Brandstapel. Jeder Stapel verursacht
  0,20 Schaden pro Sekunde, tickt zweimal pro Sekunde und teilt mit allen
  Stapeln des Segments einen erneuerbaren 4-Sekunden-Timer.
- Bei 3 Stapeln ist das Segment überhitzt. Der nächste branderzeugende Kontakt
  löst nach seinem normalen Schaden 1,5 Haupt- und 0,5 Flächenschaden in einem
  Radius von 55 px aus. Ein überschüssiger Stapel derselben Wirkung kann die
  Explosion sofort auslösen.
- Brennende Segmente übertragen beim Tod mit 25 % Chance Brand auf ein zufälliges
  direkt angrenzendes sichtbares Segment derselben Schlange.
- Feuerwelle wird nach 18 Sekunden bereit und startet ihren nächsten Cooldown
  erst nach dem ersten tatsächlichen Treffer. Sie besitzt 100 px Radius,
  verursacht 1,8 Schaden am Hauptziel und 0,6 an weiteren Zielen.
- Inferno startet erstmals nach 30 Sekunden, dauert 6 Sekunden und beginnt
  seinen nächsten Cooldown sofort bei Aktivierung. Währenddessen erzeugen
  normale Treffer und normale Feuerwellen 2 Brandstapel, Brand verursacht
  +50 %, Explosionen +25 % Schaden und die Feuerübertragung erhält
  +25 Prozentpunkte.

## Reaktionsregeln

- Alle Seraphine-Schadensquellen können kritisch treffen. Flächenziele würfeln
  unabhängig; Haupt- und Flächenanteil der Feuerwelle werden am Hauptziel
  gemeinsam gewürfelt.
- Brand und Höllenglut besitzen pro Segment und Halbsekunden-Tick getrennte
  Krit-Würfe.
- Kettenexplosionen dürfen überlappen und vollständig mehrfach treffen. Jedes
  Segment kann innerhalb derselben Reaktion jedoch höchstens einmal selbst
  explodieren.
- Übertragener Brand darf überhitzen und explodieren, löst in derselben Reaktion
  aber keine weitere Feuerübertragung aus.
- Unsichtbare Brandstapel und Timer bleiben aktiv; außerhalb des sichtbaren
  Spielfelds entsteht kein Brandschaden.

## Besondere Karten

- Lila: Ewige Glut, Feuerseuche und Feuersturm.
- Orange: Flammenpfad, Höllenglut und Sonnenkern.
- Jede besondere Karte ist pro Run genau einmal wählbar.

## Darstellung

`seraphine-front.png` enthält ausschließlich die transparente Frontfigur. Der
magische Feuerring wird vollständig im Canvas gezeichnet: gegenläufige Ringe,
Runen, wandernde Feuerpunkte und Funken reagieren auf Schüsse, Feuerwellen und
Inferno. Während Inferno erscheint eine zweite äußere Feuerbahn.

## Tests

`node test-seraphine.cjs` prüft Grundwerte, Zielpriorität, Brandtimer,
Überhitzung, Feuerwelle, Inferno, Sonnenkern, Tickschaden, Wahrscheinlichkeiten,
dauerhafte Aufwertungen, Slot-4-Isolation und kostenlose Ausrüstung.
