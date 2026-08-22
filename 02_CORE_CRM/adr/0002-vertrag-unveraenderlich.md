# ADR-0002 — Der Vertrag ist unveränderlich

**Status:** vorgeschlagen · 2026-08-22

## Entscheidung

`VERTRAG` trägt nur Unveränderliches: Nummer, Kunde, Versicherer, Sparte,
Beginn. Alles Veränderliche liegt in `VERTRAGSVERSION` mit Gültigkeitszeitraum
und Anlass. Eine Änderung erzeugt eine neue Version; keine bestehende wird
angefasst.

## Begründung

Die entscheidende Frage im Schadenfall lautet: **Welche Deckung galt am Tag des
Ereignisses, mit welchem Selbstbehalt, für welches Objekt?**

Ohne Versionen ist die Antwort eine Rekonstruktion aus E-Mails und Erinnerung.
Mit Versionen ist sie eine Abfrage. Der Unterschied entscheidet über die
Haftung des Vermittlers.

Vier Anlässe treten regelmäßig auf und wären ohne Versionierung nicht sauber
abbildbar: Verlängerung, Prämienanpassung, Objektwechsel mitten in der Laufzeit,
Deckungsänderung.

## Konsequenzen

**Positiv:** Vollständige Historie. Auskunftsfähigkeit. Nachvollziehbare
Prämienentwicklung. Die Auswertung kann eine Umdeckung von einem Neukunden
unterscheiden.

**Negativ:** Jede Abfrage muss die geltende Version ermitteln. Die Oberfläche
muss zwischen „Vertrag" und „geltende Fassung" unterscheiden. Mehr Datensätze.

**Absicherung:** Ein Ausschlussindex verhindert überschneidende
Gültigkeitszeiträume. `VERTRAG.aktuelle_version_id` erspart die Ermittlung bei
jedem Lesezugriff.

## Was ausdrücklich nicht versioniert wird

Aufgaben, Aktivitäten, Notizen und Leads. Sie sind ereignishaft, nicht
zustandshaft — eine Version davon hätte keinen Adressaten.
