# Callidus — Capability Matrix

| Feld | Wert |
|---|---|
| Status des Dokuments | **ENTWURF — vollständig unverifiziert** |
| Letzte Verifikation | *keine* |
| Verantwortlich | Produktverantwortung / Versicherungsagent |

---

## 0. Verbindliche Lesehilfe

Dieses Dokument ist die **einzige zulässige Quelle** für die Frage, ob eine
Callidus-Funktion im Code verwendet werden darf.

| Status | Bedeutung | Erlaubte Umsetzung |
|---|---|---|
| `VERIFIZIERT` | Durch eine der in §1 genannten Quellen belegt. | Reale Integration erlaubt. |
| `ANNAHME` | Plausibel, aber unbelegt. | Nur Mock/Manuell. Keine reale Integration. |
| `OFFENER PUNKT` | Frage gestellt, Antwort steht aus. | Nur Mock/Manuell. |
| `NICHT UNTERSTÜTZT` | Belegt, dass es die Funktion nicht gibt. | Manueller Fallback verpflichtend. |
| `MANUELLER FALLBACK` | Prozess läuft nachweislich außerhalb einer API. | `ManualCallidusAdapter`. |

**Regel:** Solange in der Spalte *Status* einer Zeile nicht `VERIFIZIERT` steht,
darf für diese Zeile **kein** Code gegen eine reale Callidus-Schnittstelle
geschrieben werden. Der `RealCallidusAdapter` bleibt deaktiviert.

---

## 1. Zulässige Verifikationsquellen

1. Offizielle API-Dokumentation von Callidus
2. OpenAPI-, Swagger- oder WSDL-Spezifikation
3. Technische Partnerdokumentation
4. Dokumentiertes Export- oder Importformat
5. Zugang zu einer Sandbox oder Testumgebung
6. Schriftliche technische Auskunft von Callidus
7. Reale, anonymisierte Beispieldateien
8. Dokumentierter E-Mail- oder Portalprozess

Eine mündliche Aussage, ein Screenshot ohne Kontext oder eine Vermutung aus einem
Marketingtext ist **keine** zulässige Quelle.

---

## 2. Produktmatrix

> Die folgenden Produktzeilen sind **Platzhalter**. Sie beschreiben, welche
> Informationen erhoben werden müssen — nicht, welche Produkte tatsächlich
> existieren. Produktcodes sind frei erfunden und ausschließlich für die
> synthetische Entwicklungskonfiguration bestimmt.

| # | Versicherungsprodukt | Produktcode (synthetisch) | AT | DE | Online-Tarifierung | Angebotserstellung | Antragseinreichung | Statusrückmeldung | Dokumentenrückgabe | API | Auth-Verfahren | Sandbox | Webhook | Importformat | Exportformat | E-Mail-Prozess | Portal-Prozess | Technische Quelle | Verifikationsdatum | Status | Offene Frage | Manueller Fallback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | *(zu erheben)* | `DEMO-PRODUCT-A` | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | — | — | `OFFENER PUNKT` | F-01, F-02, F-04 | `ManualCallidusAdapter` |
| 2 | *(zu erheben)* | `DEMO-PRODUCT-B` | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | — | — | `OFFENER PUNKT` | F-01, F-02, F-04 | `ManualCallidusAdapter` |

Legende der Spaltenwerte: `ja` / `nein` / `?` (unbekannt).

---

## 3. Fähigkeitsmatrix der Schnittstelle

| Fähigkeit (Adapter-Methode) | Benötigt für | Belegt durch | Verifikationsdatum | Status |
|---|---|---|---|---|
| `getCapabilities()` | Selbstauskunft des Adapters | — | — | `ANNAHME` (nur Mock/Manuell) |
| `getSupportedProducts(country)` | Produktauswahl auf der Website | — | — | `OFFENER PUNKT` (F-01, F-02, F-03) |
| `validateProductData(...)` | Vorabprüfung vor Übermittlung | — | — | `OFFENER PUNKT` (F-04) |
| `submitQuoteRequest(request)` | Tarifierung / Angebotsanfrage | — | — | `OFFENER PUNKT` (F-05, F-10) |
| `getQuoteStatus(externalReference)` | Statusverfolgung | — | — | `OFFENER PUNKT` (F-09, F-12) |
| `importQuote(payload)` | Angebotsübernahme | — | — | `OFFENER PUNKT` (F-10, F-11) |
| `submitSignedApplication(application)` | Antragseinreichung | — | — | `OFFENER PUNKT` (F-10, F-11) |
| `getSubmissionStatus(externalReference)` | Abschlusskontrolle | — | — | `OFFENER PUNKT` (F-09, F-13) |

---

## 4. Namenskonflikt (dokumentiert, ungeklärt)

Im bestehenden Repository-Modul `01_CRM_ENGINE` wird „Callidus" als Name der
**eigenen** Plattform verwendet (*Callidus Boat Intelligence Platform*,
`api.callidus.example`). Im Auftrag für dieses MVP bezeichnet „Callidus" die
**externe** Versicherungsplattform beziehungsweise Produktquelle.

Beide Bedeutungen können nicht gleichzeitig gelten, ohne dass Code und
Dokumentation mehrdeutig werden.

- Bis zur Klärung gilt in `apps/`, `packages/` und `docs/` ausschließlich die
  **externe** Bedeutung.
- Der Namensraum des eigenen Systems lautet in diesem MVP `platform` / `crm`.
- Siehe `decision-log.md`, Eintrag **ADR-0002**, und `open-items.md`, Punkt **O-01**.

---

## 5. Aktueller Gesamtstatus

> **Die reale Callidus-Integration ist BLOCKIERT.**
>
> Es liegt keine einzige zulässige Verifikationsquelle vor. Bis mindestens
> Produktliste, Pflichtfelder und Übertragungsweg belegt sind, wird
> ausschließlich gegen `MockCallidusAdapter` und `ManualCallidusAdapter`
> entwickelt und getestet.
