// Textbausteine — 1:1 aus BootsCRM_reference.jsx (Zeilen 1295-1393).
// Reine Textfunktionen ohne Datenbankbezug. Angepasst sind nur die
// Feldnamen der Vorversicherung, die jetzt schema.sql folgen.
import { euro } from "../../lib/format.js";
import { fullName, berechneKuendigungsfrist } from "./helpers.js";
import { vertragTotal } from "./VertragCard.jsx";

// (Angebot Sunbeam 32.1 an Hr. Türtscher) — leicht generalisiert für die automatische Erzeugung.
export function generateAntragAnschreiben(customer, primaryBoat) {
  const name = fullName(customer);
  const bootsname = primaryBoat?.name || customer.bootsname || "Ihr Boot";
  return `Sehr geehrte/r ${name},

im Anhang übermitteln wir Ihnen unser maßgeschneidertes Angebot für die Bootsversicherung Ihrer ${bootsname}.

Mit dieser Absicherung profitieren Sie von einem besonders umfassenden Versicherungsschutz, der Ihnen maximale Sicherheit auf dem Wasser bietet:

- Allgefahrendeckung – Schutz auch bei unvorhergesehenen Schäden
- Grobe Fahrlässigkeit mitversichert – für zusätzliche Sicherheit im Ernstfall
- Segel und Persenning bis zu 5 Jahre zum Neuwert mitversichert – ohne finanziellen Nachteil bei einem Schaden
- Weitere Details zu den Leistungen finden Sie auf unserer Homepage: https://becallidus.com/bootskaskoversicherung/

Gerade bei hochwertigen Booten ist ein verlässlicher Versicherungsschutz entscheidend. Mit unserem Angebot erhalten Sie eine leistungsstarke Absicherung zu attraktiven Konditionen, damit Sie Ihre Zeit auf dem Wasser unbeschwert genießen können.

Bitte prüfen Sie das Angebot in Ruhe und senden Sie es uns unterschrieben zurück, damit wir die Versicherung für Sie in Deckung bringen können.

Bitte beachten Sie, dass die Prämien netto angegeben sind. Je nach Zulassungsland fällt zusätzlich die jeweilige Versicherungssteuer an (z. B. Österreich 11 %).

Gerne stehe ich Ihnen für Fragen telefonisch oder per E-Mail zur Verfügung. Ich freue mich auf Ihre Rückmeldung.

Mit freundlichen Grüßen
Ihr Callidus-Team`;
}

// Für die Zustellung der (ersten) Polizze — inkl. Schadenmeldung, da Schäden bei euch direkt
// über Callidus laufen (nicht über die Versicherung selbst).
export function generatePolizzeMail(customer, primaryBoat) {
  const name = fullName(customer);
  const bootsname = primaryBoat?.name || customer.bootsname || "Ihr Boot";
  const vertraege = customer.vertraege || [];
  const gesamtpraemie = vertraege.reduce((sum, v) => sum + vertragTotal(v), 0);
  const uebersicht = vertraege.map((v) => {
    const sparten = (v.sparten || []).map((s) => s.sparte).join(", ");
    return `- ${v.versicherer}${v.polizzennummer ? ` (Polizze-Nr. ${v.polizzennummer})` : ""}${sparten ? `: ${sparten}` : ""}`;
  }).join("\n");

  return `Sehr geehrte/r ${name},

herzlichen Glückwunsch — im Anhang erhalten Sie Ihre Polizze für die Bootsversicherung Ihrer ${bootsname}. Ihr Versicherungsschutz ist damit aktiv.
${uebersicht ? `\n${uebersicht}\n` : ""}${gesamtpraemie ? `\nGesamtprämie: ${euro(gesamtpraemie)} / Jahr\n` : ""}
Bitte prüfen Sie die Polizze in Ruhe und melden Sie sich, falls etwas nicht Ihren Wünschen entspricht.

IM SCHADENFALL

Sollte es zu einem Schaden kommen, melden Sie sich bitte direkt bei uns — wir übernehmen die gesamte Abwicklung mit der Versicherung für Sie:

Telefon: +43 660 3484538
E-Mail: j.prack@becallidus.com

Wir wünschen Ihnen eine unfallfreie und schöne Zeit auf dem Wasser.

Mit freundlichen Grüßen
Ihr Callidus-Team`;
}

// Kündigungsschreiben an die Vorversicherung — vom Kunden zu unterschreiben und selbst zu versenden
// (Kündigungen laufen rechtlich über den Versicherungsnehmer, nicht über den Makler).
export function generateKuendigungsschreiben(customer) {
  const name = fullName(customer);
  const versicherer = customer.vorversicherung_versicherer || "[Name der Vorversicherung]";
  const polizzennummer = customer.vorversicherung_polizzennummer || "";
  const frist = berechneKuendigungsfrist(customer.vorversicherung_hauptfaelligkeit);
  const fristText = frist ? frist.toLocaleDateString("de-AT") : "[Kündigungsfrist bitte ergänzen]";
  const hauptfaelligkeitText = customer.vorversicherung_hauptfaelligkeit
    ? new Date(customer.vorversicherung_hauptfaelligkeit).toLocaleDateString("de-AT")
    : "[Hauptfälligkeit bitte ergänzen]";
  const heute = new Date().toLocaleDateString("de-AT");

  return `Sehr geehrte/r ${name},

anbei wie besprochen das vorbereitete Kündigungsschreiben für Ihre bestehende Bootsversicherung bei ${versicherer}. Bitte prüfen Sie die Angaben, ergänzen Sie bei Bedarf Ihre Polizzennummer und senden Sie das unterschriebene Schreiben an ${versicherer}.

Wichtig: Die Kündigung muss spätestens bis ${fristText} bei ${versicherer} eingehen, da sich der Vertrag sonst automatisch um ein weiteres Jahr verlängert. Am besten per Einschreiben oder zumindest mit Lesebestätigung versenden.

— — —

${name}

${versicherer}
[Adresse der Versicherung bitte ergänzen]

${heute}

Betreff: Kündigung der Bootsversicherung${polizzennummer ? `, Polizze-Nr. ${polizzennummer}` : ""}

Sehr geehrte Damen und Herren,

hiermit kündige ich meine bestehende Bootsversicherung${polizzennummer ? ` (Polizze-Nr. ${polizzennummer})` : ""} fristgerecht zum ${hauptfaelligkeitText}.

Ich bitte Sie um eine schriftliche Bestätigung des Kündigungseingangs sowie der Vertragsbeendigung.

Mit freundlichen Grüßen

${name}`;
}

