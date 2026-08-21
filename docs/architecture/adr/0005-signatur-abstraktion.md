# ADR-0005 — Signatur hinter einer Abstraktion, ohne Aussage zur Signaturstufe

**Status:** angenommen · 2026-08-21

## Kontext
Es ist kein Signaturanbieter ausgewählt (O-08). Die erreichbare Signaturstufe
(einfach, fortgeschritten, qualifiziert) hängt vom Anbieter und vom Prozess ab.

## Entscheidung
Ein `SignatureProvider`-Interface mit `MockSignatureProvider` (Entwicklung/Test)
und `ManualSignatureProvider` (dokumentierter Papier- oder Fremdprozess). Kein
realer Anbieter im MVP.

## Verbot
Das System behauptet an keiner Stelle — weder in der UI noch in Dokumenten noch
in E-Mails — eine qualifizierte elektronische Signatur, solange Anbieter,
Prozess und Stufe nicht nachweislich belegt sind. Das Datenmodell führt
`SignatureEnvelope.assuranceLevel` mit dem Vorgabewert `UNDETERMINED`.

## Konsequenzen
- Die Beweiskraft der MVP-Signatur ist ungeklärt; das ist in `non-goals.md` dokumentiert.
- Ein realer Anbieter wird als zusätzliche Implementierung ergänzt, ohne Domänenänderung.
