# ADR-0003 — Versicherer und Hersteller als Organisationsrollen

**Status:** vorgeschlagen · 2026-08-22 · **ändert Kapitel 13 der Architektur**

## Kontext

[ADR-0004 der Gesamtarchitektur](../../01_ARCHITECTURE/adr/0004-organisation-mit-rollen.md)
führt Händler, Club und Partner als Rollen einer Organisation. Kapitel 13 führte
`VERSICHERER` als eigenständige Entität ein. Der Hersteller fehlte bislang.

## Entscheidung

Beide werden Organisationsrollen: `VERSICHERER` und `HERSTELLER`. Die
spezifischen Felder liegen im jeweiligen Rollenprofil — genau wie bei Händler,
Club und Partner.

## Begründung

**Ein Muster statt zwei.** Ein Versicherer ist eine juristische Person mit
Anschrift, Ansprechpartnern und einer Vereinbarung. Das ist eine Organisation.
Seine Besonderheiten — Agenturnummer, Kanal, Postfach, TLS-Prüfung — sind
rollenspezifisch, nicht wesensmäßig.

**Überschneidungen kommen vor.** Ein Versicherer kann zugleich Kooperations-
partner sein. Eine Werft kann Hersteller **und** Händler sein — bei
Direktvertrieb der Normalfall. Getrennte Tabellen erzwängen doppelte
Stammdaten, die auseinanderlaufen.

**Der Hersteller ist keine Zierde.** Der Premiumwerften-Nachlass aus dem
NAUTIMA-Tarif (10 % für fünfzehn namentlich genannte Werften) lässt sich ohne
gepflegte Herstellerliste nicht anwenden. Das Feld `ist_premiumhersteller` am
Rollenprofil ist damit eine Tarifvoraussetzung, kein Komfortmerkmal.

## Konsequenzen

**Positiv:** Ein Pflegemuster für alle Geschäftspartner. Mehrfachrollen
möglich. Der Tarifnachlass wird datengetrieben statt hart codiert.

**Negativ:** Kapitel 13 der Architektur ist anzupassen — `VERSICHERER` ist dort
als eigene Entität beschrieben. Die Felder bleiben identisch, nur die
Verankerung ändert sich. Abfragen auf Versicherer brauchen einen Verbund über
die Rollentabelle.

**Bewertung:** Der Anpassungsaufwand ist gering, weil das Modul noch nicht
umgesetzt ist. Später wäre es eine Migration.
