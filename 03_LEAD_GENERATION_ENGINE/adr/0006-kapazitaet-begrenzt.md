# ADR-0006 — Die Kapazität begrenzt den Motor

**Status:** entschieden · 2026-08-23

## Kontext

Das Unternehmen arbeitet mit **zwei Personen** (C-04). Der Lastschutz des
Kern-CRM begrenzt auf 25 fällige Aufgaben je Person und Tag, also 50 insgesamt —
geteilt mit Bestandsarbeit und Fristen.

Eine Lead-Engine kann in einem Nachtlauf 500 Objekte erzeugen. Das Verhältnis ist
das eigentliche Problem dieses Moduls.

## Entscheidung

1. **Kontingent für die Akquise: höchstens 15 Aufgaben am Tag.** Der Rest gehört
   dem Bestand — ein verlorener Bestandskunde ist teurer als ein nicht
   angerufener Interessent.
2. **Freigabebremse:** Übersteigt die Prüfliste 100 Objekte, pausieren neue
   Rechercheläufe, bis der Rückstau unter 50 liegt.
3. **Bündelung:** Klasse C wird nie einzeln zugestellt, sondern als Wochenliste je
   Revier. Klasse D erzeugt keine Aufgabe.
4. **Trockenlauf vor jeder Regelaktivierung.** Über 40 Aufgaben am Tag ⇒ nicht
   aktivieren.
5. **Leitkennzahl ist die Abdeckung**, nicht die Menge neuer Leads.

## Begründung

- **Ein Motor, der weiterfindet, während niemand prüft, erzeugt eine Halde.** Die
  Halde wird nie abgearbeitet, und irgendwann wird das System umgangen. Das ist
  derselbe Mechanismus, der schlechte Automationen im Kern-CRM unbrauchbar macht.
- **Der Markt ist endlich.** In einem Markt der Größenordnung 10³ je Land ist
  Menge kein Ziel. Die Engine wird an der Reihenfolge gemessen, nicht am Ausstoß.
- **Das Ende bremst den Anfang.** Das ist ungewöhnlich für ein Vertriebswerkzeug
  und der Grund, weshalb dieses hier funktionieren wird.

## Konsequenzen

**Positiv:** Die Prüfliste bleibt bearbeitbar. Aufgaben werden ernst genommen,
weil es wenige sind. Die Zahlen bleiben ehrlich.

**Negativ:** Die Engine läuft unter ihrer technischen Leistungsfähigkeit. Wer
Ausstoß als Erfolg misst, wird enttäuscht.

**Neu zu entscheiden ab der dritten Person:** Kontingent und Bremse werden
angehoben — beides sind Datenwerte, keine Programmierung.
