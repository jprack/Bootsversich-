// Zentraler Zugriff auf das Backend. Ersetzt das frühere window.storage.*
// der Artefakt-Version — die UI ruft nur noch diese Funktionen auf und weiß
// nichts von HTTP.
const BASE = "http://localhost:3001/api";

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
};

export default api;
