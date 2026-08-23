# ADR-0005 — Aktualität ist die Kennzahl, nicht Menge

**Status:** entschieden · 2026-08-23

## Kontext

Der Auftrag nennt als Ziel die **größte** Bootshändler-Datenbank im DACH-Raum.
Modul 03 hat belegt, dass der Markt endlich ist: Größenordnung 10³ Betriebe je
Land, wachsend um wenige Einheiten im Jahr.

**Damit ist Größe kein Vorsprung.** Wer den Markt vollständig erfasst, hat die
größte Datenbank — und jeder Wettbewerber, der dieselbe Arbeit macht, hat sie in
derselben Woche auch.

Der Engpass liegt woanders: Eine Händlerliste veraltet im ersten Jahr um
schätzungsweise ein Fünftel. Markenwechsel, Filialschließungen, Fusionen,
Personalwechsel — nichts davon meldet jemand.

## Entscheidung

**Leitkennzahl ist der Aktualitätsgrad:** der Anteil der Händler, deren fünf
tragende Angaben — Anschrift des Hauptsitzes, Ansprechpartner,
Markenvertretungen, Produktbereiche, `boote_pro_jahr` — in den letzten zwölf
Monaten bestätigt wurden.

Die Zielformulierung des Moduls lautet damit: **nicht die größte
Händlerdatenbank, sondern die einzige aktuelle.**

Daraus folgen drei Festlegungen:

1. Jedes beurteilende Feld trägt **Herkunft und Datum**.
2. Der Bestand darf nicht schneller wachsen, als Betreuung möglich ist. Die
   Klassenfrequenzen sind an die Kapazität gekoppelt.
3. Der Besuchsbericht enthält ein Pflichtfeld „Was wurde bestätigt" und verbindet
   damit jeden Besuch mit der Datenqualität.

## Begründung

- **Die Zahl kann niemand abschreiben.** Sie entsteht nur aus gepflegten
  Beziehungen und lässt sich nicht kaufen.
- **Sie fällt von selbst.** Ohne Arbeit sinkt sie jeden Monat — das ist die
  gewünschte Eigenschaft einer Führungskennzahl. „Anzahl Händler" steigt
  dagegen auch dann, wenn nichts Sinnvolles geschieht.
- **Sie richtet den Vertrieb aus.** Ein Besuch hebt sie, eine Aussendung nicht.

## Konsequenzen

**Positiv:** Die einzige Kennzahl des Moduls, die einen echten Vorsprung
beschreibt. Sie verhindert außerdem, dass Datensammeln mit Marktbearbeitung
verwechselt wird.

**Negativ:** Unbequem. Ein Bestand von 250 gepflegten Händlern sieht nach weniger
aus als 2.000 gekaufte Adressen — und ist es in jeder Hinsicht außer der Anzahl
nicht.

**Zielwerte:** über 80 % bei Klasse A und B, über 50 % im Gesamtbestand. Unter
70 % gesamt meldet Regel `D-54` an die Führung.
