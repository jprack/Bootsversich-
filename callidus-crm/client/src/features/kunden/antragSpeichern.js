// Ersetzt den storage-Teil von saveToCustomer aus BootsCRM_reference.jsx
// (NautimaAntragTab und CallidusDatenblattTab machten dort dasselbe).
//
// Die fachliche Logik ist unverändert: bestehenden Kunden über die Auswahl
// oder den Namens-/Adressabgleich finden, sonst neu anlegen; vorhandene
// Felder nicht überschreiben, nur leere füllen. Was sich ändert, ist die
// Ablage — und dass das frühere risiko-Objekt am Kunden jetzt ein Eintrag in
// der Tabelle boats ist.
import api from "../../api.js";
import { fullName, getBoats } from "./helpers.js";
import { findCustomerMatches } from "./matching.js";

// Leere Werte sollen bestehende Bootsdaten nicht überschreiben — das
// entspricht dem { ...existing.risiko, ...risiko } der Referenz.
function ohneLeere(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));
}

export async function antragBeimKundenSichern({
  customers, prefillId, anzeigename, namensfelder,
  adresse = "", email = "", telefon = "", geburtsdatum = "", bootsname = "",
  bootsfelder, statusWennNeu, quote, antragTyp, antragDaten,
}) {
  // 1. Kunde bestimmen: ausgewählt, per Abgleich gefunden, oder neu.
  let kunde = null;
  if (prefillId) {
    try { kunde = await api.customers.get(prefillId); } catch { /* wurde inzwischen gelöscht */ }
  }
  if (!kunde) {
    const treffer = findCustomerMatches(customers || [], { name: anzeigename, adresse });
    if (treffer.exact) kunde = treffer.exact;
  }

  if (kunde) {
    // Vorhandenes nicht überschreiben, nur Lücken füllen.
    kunde = await api.customers.save({
      id: kunde.id,
      adresse: kunde.adresse || adresse,
      email: kunde.email || email,
      telefon: kunde.telefon || telefon,
      geburtsdatum: kunde.geburtsdatum || geburtsdatum,
      bootsname: kunde.bootsname || bootsname,
      bootstyp: kunde.bootstyp || bootsfelder.bootstyp,
      status: kunde.status || statusWennNeu,
    });
  } else {
    kunde = await api.customers.save({
      ...namensfelder, adresse, email, telefon, geburtsdatum,
      bootsname, bootstyp: bootsfelder.bootstyp, status: statusWennNeu,
    });
  }

  // 2. Bootsdaten: erstes Boot ergänzen oder anlegen.
  const boote = getBoats(kunde).filter((b) => b.id !== "legacy");
  if (boote.length === 0) {
    await api.customers.addBoat(kunde.id, ohneLeere({ name: bootsname, ...bootsfelder }));
  } else {
    await api.customers.updateBoat({ id: boote[0].id, ...ohneLeere(bootsfelder) });
  }

  // 3. Berechnung und vollständige Antragsdaten ablegen.
  await api.customers.saveQuote(kunde.id, quote);
  await api.customers.saveAntrag(kunde.id, { typ: antragTyp, daten: antragDaten });

  return fullName(kunde);
}
