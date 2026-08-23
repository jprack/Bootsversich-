# ADR-0004 — Der Händlerwert wechselt von Schätzung zu Messung

**Status:** vorgeschlagen · 2026-08-23

## Kontext

Der Auftrag nennt zehn Scoring-Kriterien, überwiegend Merkmale des Betriebs:
Standort, Marken, Größe, Online-Präsenz, Social Media, Messeauftritte, Netzwerk.
Sie beschreiben **Reichweite**. Keines davon sagt, ob dieser Händler uns
tatsächlich Geschäft bringt.

| Option | Bewertung |
|---|---|
| **Ein Score aus Merkmalen, dauerhaft** | Ein großer Betrieb, der nichts vermittelt, bleibt jahrelang als A-Händler geführt. Der Vertrieb fährt an die falschen Adressen, und niemand merkt es |
| **Nur Ertrag bewerten** | Bei einem neuen Händler gibt es keinen. Dann wäre jeder Neuzugang 0 |
| **Drei Teile, wobei der Ertragsteil die Schätzung ablöst** *(gewählt)* | Vor dem ersten Geschäft eine begründete Erwartung, danach eine Messung |

## Entscheidung

Der Händlerwert besteht aus **Reichweite (40)**, **Beziehung (30)** und
**Ertrag (30)**.

Solange keine Vermittlung vorliegt, bleibt der Ertragsteil leer, der Wert wird
auf 70 Punkte skaliert und **sichtbar als vorläufig gekennzeichnet**. Mit der
ersten gemessenen Vermittlung wird der Ertragsteil berechnet und die
Kennzeichnung fällt weg.

**Geschätzte Eingangsgrößen bewerten nicht.** Ein Wert mit Herkunft
`SCHAETZUNG` geht mit 0 Punkten ein und erzeugt eine Anreicherungsaufgabe.

Zwei Kriterien des Auftrags gehen bewusst **nicht** in die Bewertung ein:
Online-Präsenz und Social Media. Sie beschreiben Marketingbudget, nicht
Versicherungsbedarf. Sie bleiben als Merkmal erfasst.

## Begründung

- **Größe ist nicht Ertrag.** Der Betrieb mit vier Standorten und drei
  Premiummarken sieht nach 90 Punkten aus; vermittelt er in zwei Jahren zwei
  Anfragen, ist er ein großer Betrieb, der uns nicht nutzt.
- **Die Umkehrung ist wertvoller:** Ein kleiner Betrieb, der jede Kaufabwicklung
  begleitet, steigt über den Ertragsteil an zehnmal größere vorbei. Genau diese
  Aussage soll das Modell treffen.
- **Der Beziehungsteil fällt von selbst**, wenn niemand hingeht. Ein A-Händler
  soll absteigen, bevor die Kooperation endet — nicht danach.

## Konsequenzen

**Positiv:** Der Wert wird mit der Zeit ehrlicher statt veralteter. Der Trend
über zwei Quartale ist aussagekräftiger als der Absolutwert.

**Negativ:** Zwei Skalen (vorläufig / vollständig) in derselben Liste. Das ist
erklärungsbedürftig und in der Oberfläche zu kennzeichnen.
