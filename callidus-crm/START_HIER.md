# Start hier

Dieses Paket enthält alles, um das Boots-CRM lokal in Claude Code aufzubauen.

## Die vier Dateien

1. **ARCHITECTURE.md** — der Bauplan: welcher Stack, welche Ordnerstruktur,
   warum. Einmal lesen, dann als Nachschlagewerk.
2. **schema.sql** — das fertige Datenbank-Schema, wird automatisch beim
   ersten Start eingerichtet.
3. **PROMPTS.md** — 9 Prompts zum Kopieren, der Reihe nach in Claude Code
   einfügen. Das ist dein eigentlicher Fahrplan.
4. **BootsCRM_reference.jsx** — die komplette, funktionierende App, so wie
   sie jetzt hier läuft. Dient Claude Code als Vorlage zum Portieren —
   wird selbst nicht ausgeführt, nur gelesen.

## Los geht's

1. Ordner `callidus-crm` anlegen, alle vier Dateien reinkopieren
2. Node.js installieren, falls noch nicht vorhanden: https://nodejs.org
   (LTS-Version reicht)
3. Claude Code in diesem Ordner öffnen
4. Prompt 1 aus PROMPTS.md kopieren und abschicken
5. Nach jedem Prompt kurz testen, dann weiter zum nächsten

Rechne für alle 9 Prompts zusammen eher mit mehreren Arbeits-Sitzungen als
mit einer einzigen — das ist ein echtes, mehrteiliges Software-Projekt.
Aber jeder einzelne Prompt ist klein genug, um in einem Rutsch fertig und
testbar zu sein.

Bei Rückfragen zu einem bestimmten Teil (z. B. "wie hat die Wochenziel-
Berechnung noch gleich funktioniert?") einfach wieder hier im Chat fragen.
