-- =============================================================================
--  Vollstaendiger Endstand nach dem Lauf.
--  Zeigt jede Tabelle des Rechercheraums und die Uebergabestelle ins CRM.
--  Aufruf:  psql ... -f demo/03_ergebnis.sql
-- =============================================================================
\pset pager off
\pset border 2

\echo
\echo '################  1. QUELLEN  ################'
SELECT bezeichnung, art, erlaubnis,
       coalesce(erlaubnis_beleg,'—') AS beleg,
       speicherung_erlaubt AS speich, guete, takt, aktiv
FROM lg_quelle ORDER BY bezeichnung;

\echo
\echo '################  2. RECHERCHELAEUFE  ################'
SELECT q.bezeichnung AS quelle, l.status,
       l.anzahl_gefunden AS gefunden, l.anzahl_neu AS neu,
       l.anzahl_dublette AS bekannt, l.anzahl_gesperrt AS gesperrt,
       l.parameter::text AS parameter
FROM lg_lauf l JOIN lg_quelle q ON q.id = l.quelle_id
ORDER BY l.gestartet_am;

\echo
\echo '################  3. ALLE RECHERCHEOBJEKTE  ################'
SELECT o.objektnummer AS nr, o.name_roh AS name, o.name_norm AS normalisiert,
       o.untergruppe, o.land, o.revier,
       coalesce(o.domain_norm,'—') AS domain,
       coalesce(o.telefon_e164,'—') AS telefon,
       coalesce(o.adresse_plz,'—') AS plz, coalesce(o.adresse_ort,'—') AS ort
FROM lg_objekt o ORDER BY o.objektnummer;

\echo
\echo '--- Bewertung und Bearbeitungsstand ---'
SELECT o.objektnummer AS nr, left(o.name_roh,30) AS name,
       coalesce(o.groesse_indikator::text,'—') AS groesse,
       o.groesse_indikator_art AS art,
       o.basiswert AS basis, lg_fn_klasse(o.basiswert) AS kl,
       coalesce(o.potenzialwert::text,'—') AS potenzial,
       o.bearbeitungsstatus AS status,
       coalesce(o.verwerfungsgrund::text,'—') AS verwerfungsgrund,
       CASE WHEN o.organisation_id IS NULL THEN '—' ELSE 'ja' END AS im_crm
FROM lg_objekt o ORDER BY o.basiswert DESC NULLS LAST;

\echo
\echo '################  4. SCORE-HERLEITUNG, JEDER POSTEN  ################'
SELECT o.objektnummer AS nr, left(o.name_roh,26) AS name,
       p->>'code' AS code, (p->>'punkte')::int AS punkte, p->>'grund' AS grund
FROM lg_objekt o, jsonb_array_elements(o.score_herleitung->'posten') p
ORDER BY o.objektnummer, p->>'code';

\echo
\echo '################  5. BELEGE — jedes Feld mit seiner Quelle  ################'
SELECT o.objektnummer AS nr, b.feldname AS feld, left(b.wert,34) AS wert,
       q.bezeichnung AS quelle, coalesce(b.fundstelle,'—') AS fundstelle,
       b.ist_aktuell AS geltend
FROM lg_beleg b
JOIN lg_objekt o ON o.id = b.objekt_id
JOIN lg_quelle q ON q.id = b.quelle_id
ORDER BY o.objektnummer, b.ist_aktuell DESC, b.feldname;

\echo
\echo '################  6. ANSPRECHPARTNER  ################'
SELECT o.objektnummer AS nr, k.vorname, k.nachname, k.funktion,
       coalesce(k.email,'—') AS email,
       k.belegt_am AS belegt,
       coalesce(k.information_versendet_am::text,'OFFEN') AS art14_erfuellt,
       (current_date - k.belegt_am) AS tage_alt
FROM lg_kontakt k JOIN lg_objekt o ON o.id = k.objekt_id
ORDER BY o.objektnummer;

\echo
\echo '################  7. DUBLETTENVORSCHLAEGE  ################'
SELECT o.objektnummer AS nr, left(o.name_roh,26) AS objekt,
       a.ziel_typ AS ziel,
       coalesce(z.objektnummer, c.name, '?') AS gegenueber,
       a.kennzahl, a.entscheidung,
       coalesce(a.entschieden_von,'—') AS von,
       a.treffer::text AS regeln
FROM lg_abgleich a
JOIN lg_objekt o ON o.id = a.objekt_id
LEFT JOIN lg_objekt z ON z.id = a.ziel_id AND a.ziel_typ = 'RECHERCHEOBJEKT'
LEFT JOIN crm_organisation c ON c.id = a.ziel_id AND a.ziel_typ = 'ORGANISATION'
ORDER BY a.kennzahl DESC, o.objektnummer;

\echo
\echo '################  8. SPERRVERMERKE  ################'
SELECT art, schluesselart AS art_schluessel, schluessel,
       coalesce(gueltig_bis::text,'DAUERHAFT') AS gueltig_bis,
       coalesce(grund,'—') AS grund, erfasst_von AS von, erfasst_am
FROM lg_sperrvermerk ORDER BY erfasst_am, schluessel;

\echo
\echo '################  9. UEBERGABE INS CRM  ################'
SELECT c.objektnummer AS herkunft, c.name, c.name_norm AS normalisiert,
       coalesce(c.domain_norm,'—') AS domain, c.status, c.quelle,
       r.rolle, r.portalzugang AS portal
FROM crm_organisation c
LEFT JOIN crm_organisationsrolle r ON r.organisation_id = c.id
ORDER BY c.quelle, c.objektnummer NULLS FIRST;

\echo
\echo '--- Uebernommene Ansprechpartner ---'
SELECT c.name AS organisation, k.vorname, k.nachname, k.funktion,
       k.rechtsgrundlage, k.marketing_frei AS marketing
FROM crm_kontakt k JOIN crm_organisation c ON c.id = k.organisation_id
ORDER BY c.name;

\echo
\echo '################  10. AUFGABEN  ################'
SELECT a.regel_code AS regel, a.titel, a.prioritaet AS prio, a.faellig_am AS faellig,
       a.benutzer, a.dublettenschluessel AS schluessel
FROM lg_aufgabe a
ORDER BY CASE a.prioritaet WHEN 'DRINGEND' THEN 0 WHEN 'HOCH' THEN 1
                           WHEN 'NORMAL' THEN 2 ELSE 3 END, a.faellig_am;

\echo
\echo '################  11. KANALMATRIX  ################'
SELECT land, kanal, erlaubt, coalesce(bedingung,'—') AS bedingung
FROM lg_kanalmatrix ORDER BY land, kanal;

\echo
\echo '################  12. ABDECKUNGSGRAD  ################'
SELECT land, zielgruppe, grundgesamtheit AS nenner, nenner_stand AS stand,
       nenner_quelle AS quelle, beurteilt, freigegeben,
       abdeckung_prozent AS prozent
FROM vw_lg_abdeckung ORDER BY land, zielgruppe;

\echo
\echo '################  13. QUELLENBILANZ  ################'
SELECT * FROM vw_lg_quellenbilanz ORDER BY gefunden DESC, bezeichnung;

\echo
\echo '################  14. PROTOKOLL  ################'
SELECT p.zeitpunkt::time(0) AS zeit, p.ereignis,
       coalesce(o.objektnummer,'—') AS objekt, p.detail::text AS detail
FROM lg_protokoll p LEFT JOIN lg_objekt o ON o.id = p.objekt_id
ORDER BY p.id;

\echo
\echo '################  15. BILANZ DES LAUFS  ################'
SELECT 'Rohtreffer insgesamt'          AS groesse, sum(anzahl_gefunden)::text AS wert FROM lg_lauf
UNION ALL SELECT 'davon neu angelegt',        sum(anzahl_neu)::text      FROM lg_lauf
UNION ALL SELECT 'davon bereits bekannt',     sum(anzahl_dublette)::text FROM lg_lauf
UNION ALL SELECT 'davon vor Anlage gesperrt', sum(anzahl_gesperrt)::text FROM lg_lauf
UNION ALL SELECT 'Objekte im Rechercheraum',  count(*)::text FROM lg_objekt
UNION ALL SELECT '  davon freigegeben',       count(*)::text FROM lg_objekt WHERE bearbeitungsstatus='FREIGEGEBEN'
UNION ALL SELECT '  davon verworfen',         count(*)::text FROM lg_objekt WHERE bearbeitungsstatus='VERWORFEN'
UNION ALL SELECT '  davon noch offen',        count(*)::text FROM lg_objekt WHERE bearbeitungsstatus IN ('BEWERTET','ZUR_PRUEFUNG')
UNION ALL SELECT 'Belege',                    count(*)::text FROM lg_beleg
UNION ALL SELECT 'Dublettenvorschlaege',      count(*)::text FROM lg_abgleich
UNION ALL SELECT '  davon entschieden',       count(*)::text FROM lg_abgleich WHERE entscheidung<>'OFFEN'
UNION ALL SELECT 'Sperrvermerke',             count(*)::text FROM lg_sperrvermerk
UNION ALL SELECT 'Organisationen im CRM',     count(*)::text FROM crm_organisation
UNION ALL SELECT '  davon aus Recherche',     count(*)::text FROM crm_organisation WHERE quelle='RECHERCHE'
UNION ALL SELECT 'Aufgaben',                  count(*)::text FROM lg_aufgabe
UNION ALL SELECT 'Protokolleintraege',        count(*)::text FROM lg_protokoll;
