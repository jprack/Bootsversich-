// Zentraler Zugriff auf das Backend. Ersetzt das frühere window.storage.*
// der Artefakt-Version — die UI ruft nur noch diese Funktionen auf und weiß
// nichts von HTTP.
// Backend-Host aus der aufgerufenen Adresse ableiten, nicht "localhost"
// festschreiben: ruft das Handy die App unter http://192.168.x.y:5173 auf,
// wäre "localhost" das Handy selbst und jeder Datenzugriff liefe ins Leere.
// Außerhalb des Browsers (Testskripte in Node) gibt es kein window —
// dann auf localhost zurückfallen.
const HOST = typeof window !== "undefined" ? window.location.hostname : "localhost";
const BASE = `http://${HOST}:3001/api`;

async function anfrage(pfad, optionen = {}) {
  const antwort = await fetch(`${BASE}${pfad}`, {
    headers: { "Content-Type": "application/json" },
    ...optionen,
  });

  if (!antwort.ok) {
    // Das Backend antwortet im Fehlerfall mit { fehler: "..." }. Falls doch
    // einmal etwas anderes kommt (z. B. der Server ist gar nicht erreichbar),
    // nehmen wir den Rohtext.
    let meldung = `${antwort.status} ${antwort.statusText}`;
    try {
      const inhalt = await antwort.json();
      if (inhalt?.fehler) meldung = inhalt.fehler;
    } catch {
      /* keine JSON-Antwort — bei der Statuszeile bleiben */
    }
    throw new Error(meldung);
  }

  return antwort.json();
}

const json = (methode, koerper) => ({
  method: methode,
  body: JSON.stringify(koerper),
});

export const api = {
  health: () => anfrage("/health"),

  customers: {
    list: () => anfrage("/customers"),
    get: (id) => anfrage(`/customers/${id}`),

    // Legt an oder aktualisiert — je nachdem, ob der Datensatz schon eine id
    // hat. So kann dasselbe Formular für "neu" und "bearbeiten" dienen.
    save: (data) =>
      data?.id
        ? anfrage(`/customers/${data.id}`, json("PUT", data))
        : anfrage("/customers", json("POST", data)),

    delete: (id) => anfrage(`/customers/${id}`, { method: "DELETE" }),

    // Polizze mit Sparten. Der Server setzt den Kundenstatus in derselben
    // Transaktion auf "polizze" und liefert den aktualisierten Kunden zurück.
    addVertrag: (customerId, vertrag) => anfrage(`/customers/${customerId}/vertraege`, json("POST", vertrag)),
    deleteVertrag: (id) => anfrage(`/vertraege/${id}`, { method: "DELETE" }),

    // Prämienberechnung aus dem Rechner beim Kunden vermerken.
    saveQuote: (customerId, quote) => anfrage(`/customers/${customerId}/quotes`, json("POST", quote)),
    quotes: (customerId) => anfrage(`/customers/${customerId}/quotes`),

    addBoat: (customerId, boat) => anfrage(`/customers/${customerId}/boats`, json("POST", boat)),
    updateBoat: (boat) => anfrage(`/boats/${boat.id}`, json("PUT", boat)),
    deleteBoat: (id) => anfrage(`/boats/${id}`, { method: "DELETE" }),
  },

  partners: {
    list: () => anfrage("/partners"),
    get: (id) => anfrage(`/partners/${id}`),

    // Wie bei den Kunden: id vorhanden → aktualisieren, sonst anlegen.
    // bootsbauer_typ darf hier als Array übergeben werden, das Backend
    // legt es als JSON-Text ab und liefert es wieder als Array zurück.
    save: (data) =>
      data?.id
        ? anfrage(`/partners/${data.id}`, json("PUT", data))
        : anfrage("/partners", json("POST", data)),

    delete: (id) => anfrage(`/partners/${id}`, { method: "DELETE" }),
  },

  tasks: {
    // Kommen vom Server nach Fälligkeit sortiert, erledigt als true/false.
    list: () => anfrage("/tasks"),
    toggle: (id, erledigt) => anfrage(`/tasks/${id}`, json("PUT", { erledigt })),
    delete: (id) => anfrage(`/tasks/${id}`, { method: "DELETE" }),
  },
};

export default api;
