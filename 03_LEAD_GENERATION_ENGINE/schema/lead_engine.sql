-- =============================================================================
--  03_LEAD_GENERATION_ENGINE — Engine
--  Normalisierung · Sperrpruefung · Erfassung · Abgleich · Bewertung ·
--  Freigabe · Aufgaben · Abdeckungsgrad
--
--  Fassung 1.0
-- =============================================================================

-- =============================================================================
--  1. NORMALISIERUNG   (Kapitel 6.2)
-- =============================================================================

-- Domain: Kleinschreibung, Schema/www/Pfad weg, auf registrierbare Domain
CREATE OR REPLACE FUNCTION lg_fn_norm_domain(p text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p IS NULL OR btrim(p) = '' THEN NULL ELSE
    regexp_replace(
      split_part(
        regexp_replace(lower(btrim(p)), '^[a-z]+://', ''),   -- Schema
      '/', 1)                                                -- Pfad
      , '^www\.', '')                                        -- www.
  END
$$;

-- Telefon: E.164 aus roher Schreibweise und Land
CREATE OR REPLACE FUNCTION lg_fn_norm_telefon(p text, p_land char(2)) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  ziffern text;
  vorwahl text;
BEGIN
  IF p IS NULL OR btrim(p) = '' THEN RETURN NULL; END IF;

  -- Durchwahlangaben hinter Bindestrich abtrennen: "12 34-15" -> "12 34"
  p := regexp_replace(p, '\s*-\s*\d{1,4}\s*$', '');

  IF p LIKE '+%' THEN
    ziffern := regexp_replace(p, '[^0-9]', '', 'g');
    RETURN '+' || ziffern;
  END IF;

  ziffern := regexp_replace(p, '[^0-9]', '', 'g');
  IF ziffern = '' THEN RETURN NULL; END IF;

  vorwahl := CASE p_land WHEN 'AT' THEN '43' WHEN 'DE' THEN '49'
                         WHEN 'CH' THEN '41' ELSE NULL END;
  IF vorwahl IS NULL THEN RETURN NULL; END IF;

  IF left(ziffern, 2) = '00' THEN RETURN '+' || substr(ziffern, 3); END IF;
  IF left(ziffern, 1) = '0'  THEN ziffern := substr(ziffern, 2); END IF;

  RETURN '+' || vorwahl || ziffern;
END $$;

-- Name: ohne Rechtsform, Diakritika, Fuellwoerter
CREATE OR REPLACE FUNCTION lg_fn_norm_name(p text) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE n text;
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  n := lower(btrim(p));

  -- Diakritika
  n := translate(n, 'äöüáàâéèêíìîóòôúùûñç', 'aouaaaeeeiiiooouuunc');
  n := replace(n, 'ß', 'ss');

  -- Bindestrich und kaufmaennisches Und zu Leerzeichen
  n := replace(n, '-', ' ');
  n := replace(n, '&', ' ');
  n := regexp_replace(n, '[^a-z0-9 ]', ' ', 'g');

  -- Rechtsformen
  n := regexp_replace(n,
        '(^|\s)(gmbh|ag|kg|og|ohg|e\s?u|gesbr|gbr|e\s?v|ev|verein|zvr|co|mbh|ug|se|ltd|inc)(\s|$)',
        ' ', 'gi');
  n := regexp_replace(n,
        '(^|\s)(gmbh|ag|kg|og|ohg|e\s?u|gesbr|gbr|e\s?v|ev|verein|zvr|co|mbh|ug|se|ltd|inc)(\s|$)',
        ' ', 'gi');   -- zweiter Durchgang: "GmbH & Co KG"

  -- Fuellwoerter
  n := regexp_replace(n, '(^|\s)(der|die|das|den|und|am|im|zum|zur)(\s|$)', ' ', 'g');

  -- Mehrfachleerzeichen
  n := btrim(regexp_replace(n, '\s+', ' ', 'g'));
  RETURN nullif(n, '');
END $$;

-- E-Mail
CREATE OR REPLACE FUNCTION lg_fn_norm_email(p text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT nullif(lower(btrim(coalesce(p, ''))), '')
$$;

-- Namensaehnlichkeit ohne Zusatzerweiterung: Zeichenbigramme (Dice)
CREATE OR REPLACE FUNCTION lg_fn_aehnlichkeit(a text, b text) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  ga text[]; gb text[]; i int; gemeinsam int := 0; rest text[];
BEGIN
  IF a IS NULL OR b IS NULL THEN RETURN 0; END IF;
  IF a = b THEN RETURN 1; END IF;
  IF length(a) < 2 OR length(b) < 2 THEN RETURN 0; END IF;

  FOR i IN 1..length(a)-1 LOOP ga := ga || substr(a, i, 2); END LOOP;
  FOR i IN 1..length(b)-1 LOOP gb := gb || substr(b, i, 2); END LOOP;

  rest := gb;
  FOREACH i IN ARRAY (SELECT array_agg(g) FROM generate_subscripts(ga,1) g) LOOP
    IF ga[i] = ANY(rest) THEN
      gemeinsam := gemeinsam + 1;
      rest := array_remove(rest, ga[i]);   -- jedes Bigramm nur einmal zaehlen
    END IF;
  END LOOP;

  RETURN round((2.0 * gemeinsam) / (array_length(ga,1) + array_length(gb,1)), 3);
END $$;

-- =============================================================================
--  2. SPERRPRUEFUNG   —  wirkt VOR der Anlage (Kapitel 6.1, Stelle 1)
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_ist_gesperrt(
  p_domain text, p_email text, p_telefon text
) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT s.schluesselart::text || ':' || s.schluessel || ' (' || s.art::text || ')'
  FROM lg_sperrvermerk s
  WHERE (s.gueltig_bis IS NULL OR s.gueltig_bis >= current_date)
    AND ( (s.schluesselart = 'DOMAIN'  AND s.schluessel = p_domain)
       OR (s.schluesselart = 'EMAIL'   AND s.schluessel = p_email)
       OR (s.schluesselart = 'TELEFON' AND s.schluessel = p_telefon) )
  ORDER BY CASE s.art WHEN 'WIDERSPRUCH' THEN 0 ELSE 1 END
  LIMIT 1
$$;

-- =============================================================================
--  3. ERFASSUNG   —  ein Rohtreffer wird zum Objekt oder eben nicht
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_erfassen(
  p_lauf_id      uuid,
  p_zielgruppe   lg_zielgruppe,
  p_untergruppe  lg_untergruppe,
  p_name         text,
  p_land         char(2),
  p_website      text    DEFAULT NULL,
  p_email        text    DEFAULT NULL,
  p_telefon      text    DEFAULT NULL,
  p_plz          text    DEFAULT NULL,
  p_ort          text    DEFAULT NULL,
  p_strasse      text    DEFAULT NULL,
  p_revier       text    DEFAULT NULL,
  p_groesse      integer DEFAULT NULL,
  p_groesse_art  lg_groessenart DEFAULT 'UNBEKANNT',
  p_fundstelle   text    DEFAULT NULL
) RETURNS TABLE (ergebnis text, objekt_id uuid, hinweis text)
LANGUAGE plpgsql AS $$
DECLARE
  v_quelle   uuid;
  v_erlaubt  lg_erlaubnis;
  v_mandant  uuid;
  v_domain   text;
  v_email    text;
  v_tel      text;
  v_name_n   text;
  v_sperre   text;
  v_id       uuid;
  v_vorhanden uuid;
BEGIN
  SELECT q.id, q.erlaubnis INTO v_quelle, v_erlaubt
  FROM lg_lauf l JOIN lg_quelle q ON q.id = l.quelle_id WHERE l.id = p_lauf_id;

  IF v_quelle IS NULL THEN
    RAISE EXCEPTION 'Unbekannter Lauf %', p_lauf_id;
  END IF;

  -- Klasse D / ungeklaerte Erlaubnis: der Lauf wird technisch abgewiesen
  IF v_erlaubt = 'UNGEKLAERT' THEN
    RAISE EXCEPTION 'Quelle mit ungeklaerter Erlaubnis darf nicht ausgefuehrt werden';
  END IF;

  SELECT id INTO v_mandant FROM lg_mandant WHERE land = p_land;
  IF v_mandant IS NULL THEN
    UPDATE lg_lauf SET anzahl_gefunden = anzahl_gefunden + 1 WHERE id = p_lauf_id;
    RETURN QUERY SELECT 'AUSSERHALB_MARKT'::text, NULL::uuid,
                        ('kein Mandant fuer Land ' || p_land)::text;
    RETURN;
  END IF;

  v_domain := lg_fn_norm_domain(p_website);
  v_email  := lg_fn_norm_email(p_email);
  v_tel    := lg_fn_norm_telefon(p_telefon, p_land);
  v_name_n := lg_fn_norm_name(p_name);

  UPDATE lg_lauf SET anzahl_gefunden = anzahl_gefunden + 1 WHERE id = p_lauf_id;

  -- (1) Sperrpruefung vor allem anderen
  v_sperre := lg_fn_ist_gesperrt(v_domain, v_email, v_tel);
  IF v_sperre IS NOT NULL THEN
    UPDATE lg_lauf SET anzahl_gesperrt = anzahl_gesperrt + 1 WHERE id = p_lauf_id;
    INSERT INTO lg_protokoll (ereignis, detail)
      VALUES ('erfassung.gesperrt', jsonb_build_object('name', p_name, 'sperre', v_sperre));
    RETURN QUERY SELECT 'GESPERRT'::text, NULL::uuid, v_sperre;
    RETURN;
  END IF;

  -- (2) Bereits vorhanden? Domain ist der staerkste Schluessel — aber eine
  --     abweichende Anschrift entkraeftet ihn: ein Haendler mit drei Filialen
  --     fuehrt alle unter derselben Domain (Kapitel 6.5).
  IF v_domain IS NOT NULL THEN
    SELECT o.id INTO v_vorhanden FROM lg_objekt o
     WHERE o.mandant_id = v_mandant
       AND o.domain_norm = v_domain
       AND (o.adresse_plz IS NULL OR p_plz IS NULL OR o.adresse_plz = p_plz)
     LIMIT 1;
  END IF;

  IF v_vorhanden IS NOT NULL THEN
    UPDATE lg_objekt SET zuletzt_gesehen_am = current_date WHERE id = v_vorhanden;
    UPDATE lg_lauf SET anzahl_dublette = anzahl_dublette + 1 WHERE id = p_lauf_id;
    RETURN QUERY SELECT 'BEKANNT'::text, v_vorhanden, 'Domain bereits erfasst'::text;
    RETURN;
  END IF;

  -- (3) Neues Objekt
  v_id := gen_random_uuid();
  INSERT INTO lg_objekt (
    id, objektnummer, mandant_id, zielgruppe, untergruppe,
    name_roh, name_norm, website, domain_norm, email,
    telefon_roh, telefon_e164, adresse_strasse, adresse_plz, adresse_ort,
    land, revier, groesse_indikator, groesse_indikator_art, bearbeitungsstatus)
  VALUES (
    v_id, 'R' || lpad(nextval('lg_objektnummer_seq')::text, 6, '0'),
    v_mandant, p_zielgruppe, p_untergruppe,
    p_name, v_name_n, p_website, v_domain, v_email,
    p_telefon, v_tel, p_strasse, p_plz, p_ort,
    p_land, p_revier, p_groesse,
    CASE WHEN p_groesse IS NULL THEN 'UNBEKANNT' ELSE p_groesse_art END,
    'NORMALISIERT');

  -- Belege: jedes gelieferte Feld bekommt seinen Nachweis
  INSERT INTO lg_beleg (id, objekt_id, feldname, wert, quelle_id, lauf_id, fundstelle)
  SELECT gen_random_uuid(), v_id, f, w, v_quelle, p_lauf_id, p_fundstelle
  FROM (VALUES ('name', p_name), ('website', p_website), ('email', p_email),
               ('telefon', p_telefon), ('adresse_plz', p_plz), ('adresse_ort', p_ort),
               ('groesse_indikator', p_groesse::text)) AS t(f, w)
  WHERE w IS NOT NULL;

  UPDATE lg_lauf SET anzahl_neu = anzahl_neu + 1 WHERE id = p_lauf_id;
  RETURN QUERY SELECT 'NEU'::text, v_id, NULL::text;
END $$;

-- =============================================================================
--  4. DUBLETTENABGLEICH   (Kapitel 6.4, Regeln D1-D8)
--     Erzeugt Vorschlaege. Fuehrt niemals zusammen.
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_abgleichen(p_objekt_id uuid)
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  o          lg_objekt%ROWTYPE;
  r          record;
  v_kennzahl numeric(4,3);
  v_treffer  jsonb;
  v_anzahl   integer := 0;
BEGIN
  SELECT * INTO o FROM lg_objekt WHERE id = p_objekt_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- ---------------------------------------------------------------- gegen CRM
  FOR r IN
    SELECT c.id, c.name_norm, c.domain_norm, c.telefon_e164, c.adresse_plz
    FROM crm_organisation c
    WHERE c.mandant_id = o.mandant_id
  LOOP
    v_kennzahl := 0; v_treffer := '[]'::jsonb;

    IF o.domain_norm IS NOT NULL AND o.domain_norm = r.domain_norm THEN
      IF o.adresse_plz IS DISTINCT FROM r.adresse_plz AND o.adresse_plz IS NOT NULL
         AND r.adresse_plz IS NOT NULL THEN
        v_kennzahl := greatest(v_kennzahl, 0.60);
        v_treffer := v_treffer || jsonb_build_object('regel','D1*',
                     'hinweis','gleiche Domain, andere Anschrift — moeglicher Zweitstandort');
      ELSE
        v_kennzahl := greatest(v_kennzahl, 0.95);
        v_treffer := v_treffer || jsonb_build_object('regel','D1','feld','domain_norm');
      END IF;
    END IF;

    IF o.telefon_e164 IS NOT NULL AND o.telefon_e164 = r.telefon_e164 THEN
      v_kennzahl := greatest(v_kennzahl, 0.85);
      v_treffer := v_treffer || jsonb_build_object('regel','D3','feld','telefon_e164');
    END IF;

    IF o.name_norm = r.name_norm AND o.adresse_plz IS NOT DISTINCT FROM r.adresse_plz THEN
      v_kennzahl := greatest(v_kennzahl, 0.80);
      v_treffer := v_treffer || jsonb_build_object('regel','D4','feld','name_norm+plz');
    ELSIF o.name_norm = r.name_norm THEN
      v_kennzahl := greatest(v_kennzahl, 0.70);
      v_treffer := v_treffer || jsonb_build_object('regel','D5','feld','name_norm');
    ELSIF lg_fn_aehnlichkeit(o.name_norm, r.name_norm) >= 0.90
          AND o.adresse_plz IS NOT DISTINCT FROM r.adresse_plz THEN
      v_kennzahl := greatest(v_kennzahl, 0.65);
      v_treffer := v_treffer || jsonb_build_object('regel','D6','feld','name_aehnlich+plz');
    END IF;

    IF v_kennzahl >= 0.50 THEN
      INSERT INTO lg_abgleich (id, objekt_id, ziel_typ, ziel_id, kennzahl, treffer)
      VALUES (gen_random_uuid(), o.id, 'ORGANISATION', r.id, v_kennzahl, v_treffer)
      ON CONFLICT (objekt_id, ziel_typ, ziel_id) DO NOTHING;
      v_anzahl := v_anzahl + 1;
    END IF;
  END LOOP;

  -- -------------------------------------------------- gegen den Rechercheraum
  FOR r IN
    SELECT x.id, x.name_norm, x.domain_norm, x.telefon_e164, x.adresse_plz, x.untergruppe
    FROM lg_objekt x
    WHERE x.mandant_id = o.mandant_id AND x.id <> o.id
      AND x.bearbeitungsstatus <> 'VERWORFEN'
  LOOP
    v_kennzahl := 0; v_treffer := '[]'::jsonb;

    IF o.email IS NOT NULL AND o.email = (SELECT email FROM lg_objekt WHERE id = r.id) THEN
      v_kennzahl := greatest(v_kennzahl, 0.90);
      v_treffer := v_treffer || jsonb_build_object('regel','D2','feld','email');
    END IF;

    IF o.telefon_e164 IS NOT NULL AND o.telefon_e164 = r.telefon_e164 THEN
      IF o.untergruppe = r.untergruppe THEN
        v_kennzahl := greatest(v_kennzahl, 0.85);
        v_treffer := v_treffer || jsonb_build_object('regel','D3','feld','telefon_e164');
      ELSE
        -- D8: gleiche Zentrale, verschiedene Betriebe. Kein Vorschlag.
        v_treffer := v_treffer || jsonb_build_object('regel','D8',
                     'hinweis','gleiche Rufnummer, andere Untergruppe — vermutlich dieselbe Zentrale');
      END IF;
    END IF;

    IF o.name_norm = r.name_norm AND o.adresse_plz IS NOT DISTINCT FROM r.adresse_plz THEN
      v_kennzahl := greatest(v_kennzahl, 0.80);
      v_treffer := v_treffer || jsonb_build_object('regel','D4','feld','name_norm+plz');
    ELSIF lg_fn_aehnlichkeit(o.name_norm, r.name_norm) >= 0.90
          AND o.adresse_plz IS NOT DISTINCT FROM r.adresse_plz THEN
      v_kennzahl := greatest(v_kennzahl, 0.65);
      v_treffer := v_treffer || jsonb_build_object('regel','D6','feld','name_aehnlich+plz');
    END IF;

    -- Gedaechtnis: ein als IST_ANDERE entschiedenes Paar kommt nie wieder
    IF v_kennzahl >= 0.50 AND NOT EXISTS (
         SELECT 1 FROM lg_abgleich a
         WHERE a.entscheidung = 'IST_ANDERE'
           AND ((a.objekt_id = o.id AND a.ziel_id = r.id)
             OR (a.objekt_id = r.id AND a.ziel_id = o.id))) THEN
      INSERT INTO lg_abgleich (id, objekt_id, ziel_typ, ziel_id, kennzahl, treffer)
      VALUES (gen_random_uuid(), o.id, 'RECHERCHEOBJEKT', r.id, v_kennzahl, v_treffer)
      ON CONFLICT (objekt_id, ziel_typ, ziel_id) DO NOTHING;
      v_anzahl := v_anzahl + 1;
    END IF;
  END LOOP;

  RETURN v_anzahl;
END $$;

-- =============================================================================
--  5. BEWERTUNG   (Kapitel 5)
--     Basiswert aus Beobachtbarem. Jeder Punkt mit seiner Tatsache.
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_bewerten(p_objekt_id uuid)
RETURNS smallint
LANGUAGE plpgsql AS $$
DECLARE
  o        lg_objekt%ROWTYPE;
  b1 int := 0; b2 int := 0; b3 int := 0; b4 int := 0; b5 int := 0;
  v_summe  int;
  v_posten jsonb := '[]'::jsonb;
  v_quellen int;
  v_gewicht int;
BEGIN
  SELECT * INTO o FROM lg_objekt WHERE id = p_objekt_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- B1  Zielgruppentyp (30)
  b1 := CASE o.untergruppe
          WHEN 'BOOTSHAENDLER'     THEN 30
          WHEN 'MARINA'            THEN 28
          WHEN 'HAFENBETREIBER'    THEN 28
          WHEN 'CHARTER'           THEN 26
          WHEN 'YACHTMAKLER'       THEN 24
          WHEN 'YACHTCLUB'         THEN 20
          WHEN 'SEGELCLUB'         THEN 20
          WHEN 'MOTORBOOTCLUB'     THEN 20
          WHEN 'WERFT'             THEN 18
          WHEN 'WASSERSPORTVEREIN' THEN 16
          WHEN 'SERVICEBETRIEB'    THEN 12
          WHEN 'WASSERSPORTSCHULE' THEN 10
          ELSE 6 END;
  v_posten := v_posten || jsonb_build_object(
    'code','B1','punkte',b1,'grund','untergruppe=' || o.untergruppe::text);

  -- B2  Groessenindikator (25) — je Zielgruppe eigene Skala.
  --     Unbekannt ergibt 0, nicht den Mittelwert.
  IF o.groesse_indikator IS NULL THEN
    b2 := 0;
    v_posten := v_posten || jsonb_build_object(
      'code','B2','punkte',0,'grund','Groesse unbekannt — bewusst 0, nicht Mittelwert');
  ELSE
    b2 := CASE o.groesse_indikator_art
      WHEN 'LIEGEPLAETZE' THEN
        CASE WHEN o.groesse_indikator >= 500 THEN 25 WHEN o.groesse_indikator >= 250 THEN 18
             WHEN o.groesse_indikator >= 100 THEN 12 WHEN o.groesse_indikator >= 30 THEN 6 ELSE 0 END
      WHEN 'MITGLIEDER' THEN
        CASE WHEN o.groesse_indikator >= 500 THEN 25 WHEN o.groesse_indikator >= 250 THEN 18
             WHEN o.groesse_indikator >= 100 THEN 12 WHEN o.groesse_indikator >= 40 THEN 6 ELSE 0 END
      WHEN 'FLOTTE' THEN
        CASE WHEN o.groesse_indikator >= 30 THEN 25 WHEN o.groesse_indikator >= 15 THEN 18
             WHEN o.groesse_indikator >= 6  THEN 12 WHEN o.groesse_indikator >= 2  THEN 6 ELSE 0 END
      WHEN 'MITARBEITER' THEN
        CASE WHEN o.groesse_indikator >= 50 THEN 25 WHEN o.groesse_indikator >= 20 THEN 18
             WHEN o.groesse_indikator >= 8  THEN 12 WHEN o.groesse_indikator >= 3  THEN 6 ELSE 0 END
      ELSE 0 END;
    v_posten := v_posten || jsonb_build_object('code','B2','punkte',b2,
      'grund', o.groesse_indikator_art::text || '=' || o.groesse_indikator);
  END IF;

  -- B3  Revier und Region (20)
  SELECT gewicht INTO v_gewicht FROM lg_revier
   WHERE land = o.land AND name = o.revier;
  b3 := coalesce(v_gewicht, 4);
  v_posten := v_posten || jsonb_build_object('code','B3','punkte',b3,
    'grund','revier=' || coalesce(o.revier, 'unbekannt'));

  -- B4  Erreichbarkeit und Datenlage (15)
  b4 := (CASE WHEN o.telefon_e164 IS NOT NULL THEN 6 ELSE 0 END)
      + (CASE WHEN o.adresse_plz IS NOT NULL AND o.adresse_ort IS NOT NULL THEN 4 ELSE 0 END)
      + (CASE WHEN o.email IS NOT NULL THEN 3 ELSE 0 END)
      + (CASE WHEN EXISTS (SELECT 1 FROM lg_kontakt k
                            WHERE k.objekt_id = o.id AND k.funktion IS NOT NULL) THEN 2 ELSE 0 END);
  v_posten := v_posten || jsonb_build_object('code','B4','punkte',b4,
    'grund', concat_ws(', ',
      CASE WHEN o.telefon_e164 IS NOT NULL THEN 'Telefon' END,
      CASE WHEN o.adresse_plz IS NOT NULL THEN 'Anschrift' END,
      CASE WHEN o.email IS NOT NULL THEN 'E-Mail' END));

  -- B5  Marktsichtbarkeit (10)
  SELECT count(DISTINCT quelle_id) INTO v_quellen FROM lg_beleg WHERE objekt_id = o.id;
  b5 := (CASE WHEN o.website IS NOT NULL THEN 4 ELSE 0 END)
      + (CASE WHEN v_quellen >= 2 THEN 3 ELSE 0 END);
  v_posten := v_posten || jsonb_build_object('code','B5','punkte',b5,
    'grund','website=' || (o.website IS NOT NULL)::text || ', quellen=' || v_quellen);

  v_summe := b1 + b2 + b3 + b4 + b5;

  UPDATE lg_objekt
     SET basiswert = v_summe,
         score_herleitung = jsonb_build_object(
           'modell','basis-1.0',
           'berechnet_am', to_char(now(),'YYYY-MM-DD"T"HH24:MI:SSOF'),
           'summe', v_summe,
           'posten', v_posten),
         bearbeitungsstatus = CASE WHEN bearbeitungsstatus IN ('ROH','NORMALISIERT')
                                   THEN 'BEWERTET' ELSE bearbeitungsstatus END
   WHERE id = p_objekt_id;

  RETURN v_summe::smallint;
END $$;

CREATE OR REPLACE FUNCTION lg_fn_klasse(p_basiswert smallint) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_basiswert IS NULL THEN NULL
              WHEN p_basiswert >= 75 THEN 'A'
              WHEN p_basiswert >= 55 THEN 'B'
              WHEN p_basiswert >= 35 THEN 'C'
              ELSE 'D' END
$$;

-- =============================================================================
--  6. FREIGABE   —  der einzige Uebergang ins CRM (Kapitel 7.2)
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_freigeben(
  p_objekt_id uuid,
  p_rolle     text,
  p_benutzer  text,
  p_kontakt_uebernehmen boolean DEFAULT true
) RETURNS TABLE (ergebnis text, organisation_id uuid, aufgabe_id uuid, grund text)
LANGUAGE plpgsql AS $$
DECLARE
  o        lg_objekt%ROWTYPE;
  v_sperre text;
  v_offen  integer;
  v_org    uuid;
  v_auf    uuid;
  v_klasse text;
  v_regel  text;
  v_frist  integer;
  v_prio   text;
  v_ds     text;
BEGIN
  SELECT * INTO o FROM lg_objekt WHERE id = p_objekt_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'ABGEWIESEN'::text, NULL::uuid, NULL::uuid, 'unbekanntes Objekt'::text;
    RETURN;
  END IF;

  IF o.bearbeitungsstatus = 'FREIGEGEBEN' THEN
    RETURN QUERY SELECT 'BEREITS_FREIGEGEBEN'::text, o.organisation_id, o.aufgabe_id, NULL::text;
    RETURN;
  END IF;

  -- Pruefung 1: Sperrvermerk
  v_sperre := lg_fn_ist_gesperrt(o.domain_norm, o.email, o.telefon_e164);
  IF v_sperre IS NOT NULL THEN
    RETURN QUERY SELECT 'ABGEWIESEN'::text, NULL::uuid, NULL::uuid,
                        ('SPERRVERMERK_AKTIV: ' || v_sperre)::text;
    RETURN;
  END IF;

  -- Pruefung 2: Zulassung des Mandanten
  IF NOT EXISTS (SELECT 1 FROM lg_mandant m WHERE m.id = o.mandant_id AND m.zulassung) THEN
    RETURN QUERY SELECT 'ABGEWIESEN'::text, NULL::uuid, NULL::uuid, 'KEINE_ZULASSUNG'::text;
    RETURN;
  END IF;

  -- Pruefung 3: Pflichtfelder
  IF o.name_norm IS NULL OR o.land IS NULL THEN
    RETURN QUERY SELECT 'ABGEWIESEN'::text, NULL::uuid, NULL::uuid, 'PFLICHTFELD_FEHLT'::text;
    RETURN;
  END IF;

  -- Pruefung 4: offene Dublettenvorschlaege >= 0,80
  SELECT count(*) INTO v_offen FROM lg_abgleich a
   WHERE a.objekt_id = o.id AND a.kennzahl >= 0.80 AND a.entscheidung = 'OFFEN';
  IF v_offen > 0 THEN
    RETURN QUERY SELECT 'ABGEWIESEN'::text, NULL::uuid, NULL::uuid,
                        ('DUBLETTE_OFFEN: ' || v_offen || ' Vorschlag/Vorschlaege')::text;
    RETURN;
  END IF;

  -- Pruefung 5: Untergruppe auf Rolle abbildbar
  IF p_rolle NOT IN ('HAENDLER','CLUB','PARTNER','HERSTELLER') THEN
    RETURN QUERY SELECT 'ABGEWIESEN'::text, NULL::uuid, NULL::uuid,
                        ('ROLLE_UNZULAESSIG: ' || p_rolle)::text;
    RETURN;
  END IF;

  -- ---- Uebernahme ins CRM --------------------------------------------------
  v_org := gen_random_uuid();
  INSERT INTO crm_organisation (id, mandant_id, name, name_norm, domain_norm,
                                telefon_e164, adresse_plz, status, quelle, objektnummer)
  VALUES (v_org, o.mandant_id, o.name_roh, o.name_norm, o.domain_norm,
          o.telefon_e164, o.adresse_plz, 'INTERESSENT', 'RECHERCHE', o.objektnummer);

  INSERT INTO crm_organisationsrolle (id, organisation_id, rolle)
  VALUES (gen_random_uuid(), v_org, p_rolle);

  IF p_kontakt_uebernehmen THEN
    INSERT INTO crm_kontakt (id, organisation_id, vorname, nachname, funktion, email,
                             rechtsgrundlage, marketing_frei)
    SELECT gen_random_uuid(), v_org, k.vorname, k.nachname, k.funktion, k.email,
           'BERECHTIGTES_INTERESSE', false          -- niemals Marketing aus der Recherche
    FROM lg_kontakt k WHERE k.objekt_id = o.id;
  END IF;

  -- ---- Aufgabe: genau eine, nach Klasse ------------------------------------
  v_klasse := lg_fn_klasse(o.basiswert);
  SELECT CASE
    WHEN o.untergruppe = 'BOOTSHAENDLER' THEN 'L-04'
    WHEN o.untergruppe IN ('MARINA','HAFENBETREIBER') THEN 'L-05'
    WHEN o.untergruppe = 'CHARTER' THEN 'L-07'
    WHEN o.zielgruppe = 'Z3_GEMEINSCHAFT' THEN 'L-06'
    WHEN o.zielgruppe = 'Z5_INDUSTRIE' THEN 'L-08'
    WHEN v_klasse = 'A' THEN 'L-01'
    WHEN v_klasse = 'B' THEN 'L-02'
    WHEN v_klasse = 'C' THEN 'L-03'
    ELSE NULL END INTO v_regel;

  -- Klasse D erzeugt keine Aufgabe und wird trotzdem gespeichert.
  IF v_klasse = 'D' THEN v_regel := NULL; END IF;

  IF v_regel IS NOT NULL THEN
    v_frist := CASE v_regel WHEN 'L-04' THEN 5 WHEN 'L-05' THEN 10 WHEN 'L-07' THEN 10
                            WHEN 'L-01' THEN 5 WHEN 'L-02' THEN 15 WHEN 'L-03' THEN 7
                            WHEN 'L-06' THEN 15 WHEN 'L-08' THEN 30 END;
    v_prio  := CASE WHEN v_regel IN ('L-01','L-04','L-05','L-07') THEN 'HOCH'
                    WHEN v_regel = 'L-08' THEN 'NIEDRIG'
                    WHEN v_regel = 'L-03' THEN 'NIEDRIG' ELSE 'NORMAL' END;
    v_ds    := v_regel || ':OBJEKT:' || o.id::text || ':einmalig';

    v_auf := gen_random_uuid();
    INSERT INTO lg_aufgabe (id, objekt_id, regel_code, titel, prioritaet,
                            faellig_am, benutzer, dublettenschluessel)
    VALUES (v_auf, o.id, v_regel,
            CASE v_regel
              WHEN 'L-04' THEN 'Haendlergespraech: ' || o.name_roh
              WHEN 'L-05' THEN 'Betreibergespraech: ' || o.name_roh
              WHEN 'L-07' THEN 'Flottengespraech: ' || o.name_roh
              WHEN 'L-06' THEN 'Vereinsansprache (Fenster Okt-Feb): ' || o.name_roh
              WHEN 'L-08' THEN 'Haendlerliste auswerten: ' || o.name_roh
              ELSE 'Erstansprache: ' || o.name_roh END,
            v_prio, current_date + v_frist, p_benutzer, v_ds)
    ON CONFLICT (dublettenschluessel) DO NOTHING
    RETURNING id INTO v_auf;
  END IF;

  UPDATE lg_objekt
     SET bearbeitungsstatus = 'FREIGEGEBEN', organisation_id = v_org, aufgabe_id = v_auf
   WHERE id = o.id;

  INSERT INTO lg_protokoll (ereignis, objekt_id, detail)
  VALUES ('research.object.released', o.id,
          jsonb_build_object('organisation_id', v_org, 'rolle', p_rolle,
                             'klasse', v_klasse, 'regel', v_regel));

  RETURN QUERY SELECT 'FREIGEGEBEN'::text, v_org, v_auf, NULL::text;
END $$;

-- =============================================================================
--  7. VERWERFEN
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_verwerfen(
  p_objekt_id uuid, p_grund lg_verwerfungsgrund, p_benutzer text
) RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE lg_objekt
     SET bearbeitungsstatus = 'VERWORFEN', verwerfungsgrund = p_grund
   WHERE id = p_objekt_id AND bearbeitungsstatus <> 'FREIGEGEBEN';
  IF NOT FOUND THEN RETURN 'ABGEWIESEN'; END IF;

  INSERT INTO lg_protokoll (ereignis, objekt_id, detail)
  VALUES ('research.object.discarded', p_objekt_id,
          jsonb_build_object('grund', p_grund::text, 'von', p_benutzer));
  RETURN 'VERWORFEN';
END $$;

-- =============================================================================
--  8. RUECKFLUSS AUS DEM CRM   (Kapitel 7.5)
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_rueckfluss_ablehnung(
  p_objekt_id uuid, p_art lg_sperrart, p_monate integer, p_grund text
) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE o lg_objekt%ROWTYPE; v_id uuid;
BEGIN
  SELECT * INTO o FROM lg_objekt WHERE id = p_objekt_id;
  IF NOT FOUND OR o.domain_norm IS NULL THEN RETURN NULL; END IF;

  v_id := gen_random_uuid();
  INSERT INTO lg_sperrvermerk (id, art, schluesselart, schluessel, gueltig_bis, grund, erfasst_von)
  VALUES (v_id, p_art, 'DOMAIN', o.domain_norm,
          CASE WHEN p_art = 'WIDERSPRUCH' THEN NULL
               ELSE current_date + (p_monate || ' months')::interval END::date,
          p_grund, 'rueckfluss');

  INSERT INTO lg_protokoll (ereignis, objekt_id, detail)
  VALUES ('research.block.created', p_objekt_id,
          jsonb_build_object('art', p_art::text, 'schluessel', o.domain_norm));
  RETURN v_id;
END $$;

-- =============================================================================
--  9. NACHTLAUF   —  Regeln als Daten waeren der naechste Schritt;
--     hier die sechs Regeln des Startpakets (Kapitel 9.6)
-- =============================================================================
CREATE OR REPLACE FUNCTION lg_fn_nachtlauf(p_benutzer text DEFAULT 'vertrieb')
RETURNS TABLE (regel text, erzeugt integer, unterdrueckt integer, bemerkung text)
LANGUAGE plpgsql AS $$
DECLARE
  v_kontingent constant integer := 15;   -- Kapitel 9.4
  v_frei    integer;
  v_erzeugt integer;
  v_kand    integer;
  r         record;
  v_ds      text;
BEGIN
  SELECT v_kontingent - count(*)::integer INTO v_frei
    FROM lg_aufgabe WHERE faellig_am = current_date AND erledigt_am IS NULL;

  -- ---- L-31  Informationspflicht nach Art. 14 DSGVO ------------------------
  --      Rechtspflicht: laeuft VOR dem Kontingent, wird nie gestaffelt.
  v_erzeugt := 0; v_kand := 0;
  FOR r IN
    SELECT k.id, k.objekt_id, o.name_roh
    FROM lg_kontakt k JOIN lg_objekt o ON o.id = k.objekt_id
    WHERE k.information_versendet_am IS NULL
      AND k.belegt_am <= current_date - 21
  LOOP
    v_kand := v_kand + 1;
    v_ds := 'L-31:KONTAKT:' || r.id::text || ':einmalig';
    INSERT INTO lg_aufgabe (id, objekt_id, kontakt_id, regel_code, titel, prioritaet,
                            faellig_am, benutzer, dublettenschluessel)
    VALUES (gen_random_uuid(), r.objekt_id, r.id, 'L-31',
            'Informationspflicht Art. 14 erfuellen: ' || r.name_roh,
            'DRINGEND', current_date, p_benutzer, v_ds)
    ON CONFLICT (dublettenschluessel) DO NOTHING;
    IF FOUND THEN v_erzeugt := v_erzeugt + 1; END IF;
  END LOOP;
  RETURN QUERY SELECT 'L-31'::text, v_erzeugt, (v_kand - v_erzeugt),
                      'Rechtspflicht — nicht kontingentiert'::text;

  -- ---- L-11  Eskalation: freigegeben, nicht angesprochen -------------------
  v_erzeugt := 0; v_kand := 0;
  FOR r IN
    SELECT o.id, o.name_roh
    FROM lg_objekt o
    WHERE o.bearbeitungsstatus = 'FREIGEGEBEN'
      AND EXISTS (SELECT 1 FROM lg_aufgabe a
                   WHERE a.objekt_id = o.id AND a.erledigt_am IS NULL
                     AND a.faellig_am < current_date)
    ORDER BY o.basiswert DESC NULLS LAST
  LOOP
    v_kand := v_kand + 1;
    IF v_frei <= 0 THEN CONTINUE; END IF;      -- Staffelung
    v_ds := 'L-11:OBJEKT:' || r.id::text || ':' || to_char(current_date,'YYYY-MM');
    INSERT INTO lg_aufgabe (id, objekt_id, regel_code, titel, prioritaet,
                            faellig_am, benutzer, dublettenschluessel)
    VALUES (gen_random_uuid(), r.id, 'L-11',
            'Eskalation: ' || r.name_roh || ' liegt ueber der Hoechstverweildauer',
            'HOCH', current_date, p_benutzer, v_ds)
    ON CONFLICT (dublettenschluessel) DO NOTHING;
    IF FOUND THEN v_erzeugt := v_erzeugt + 1; v_frei := v_frei - 1; END IF;
  END LOOP;
  RETURN QUERY SELECT 'L-11'::text, v_erzeugt, (v_kand - v_erzeugt),
                      ('Kontingent verbleibend: ' || v_frei)::text;

  -- ---- L-24  Dublettenvorschlag seit 14 Tagen offen ------------------------
  v_erzeugt := 0; v_kand := 0;
  FOR r IN
    SELECT DISTINCT o.id, o.name_roh
    FROM lg_abgleich a JOIN lg_objekt o ON o.id = a.objekt_id
    WHERE a.entscheidung = 'OFFEN' AND a.kennzahl >= 0.80
  LOOP
    v_kand := v_kand + 1;
    IF v_frei <= 0 THEN CONTINUE; END IF;
    v_ds := 'L-24:OBJEKT:' || r.id::text || ':' || to_char(current_date,'IYYY-IW');
    INSERT INTO lg_aufgabe (id, objekt_id, regel_code, titel, prioritaet,
                            faellig_am, benutzer, dublettenschluessel)
    VALUES (gen_random_uuid(), r.id, 'L-24',
            'Dublettenentscheidung offen: ' || r.name_roh,
            'NORMAL', current_date, p_benutzer, v_ds)
    ON CONFLICT (dublettenschluessel) DO NOTHING;
    IF FOUND THEN v_erzeugt := v_erzeugt + 1; v_frei := v_frei - 1; END IF;
  END LOOP;
  RETURN QUERY SELECT 'L-24'::text, v_erzeugt, (v_kand - v_erzeugt),
                      ('Kontingent verbleibend: ' || v_frei)::text;
END $$;

-- =============================================================================
--  10. KENNZAHLEN
-- =============================================================================

-- Abdeckungsgrad: beurteilt zaehlt, nicht bearbeitet.
CREATE OR REPLACE VIEW vw_lg_abdeckung AS
SELECT g.land,
       g.zielgruppe,
       g.anzahl                             AS grundgesamtheit,
       g.erhoben_am                         AS nenner_stand,
       g.quelle                             AS nenner_quelle,
       count(o.id) FILTER (WHERE o.bearbeitungsstatus IN
            ('BEWERTET','ZUR_PRUEFUNG','FREIGEGEBEN','VERWORFEN','ZURUECKGESTELLT'))
                                            AS beurteilt,
       count(o.id) FILTER (WHERE o.bearbeitungsstatus = 'FREIGEGEBEN') AS freigegeben,
       round(100.0 * count(o.id) FILTER (WHERE o.bearbeitungsstatus IN
            ('BEWERTET','ZUR_PRUEFUNG','FREIGEGEBEN','VERWORFEN','ZURUECKGESTELLT'))
            / g.anzahl, 1)                  AS abdeckung_prozent
FROM lg_grundgesamtheit g
LEFT JOIN lg_objekt o ON o.land = g.land AND o.zielgruppe = g.zielgruppe
GROUP BY g.land, g.zielgruppe, g.anzahl, g.erhoben_am, g.quelle;

-- Prueflise: was wartet, mit Score, Klasse und Dublettenlage
CREATE OR REPLACE VIEW vw_lg_pruefliste AS
SELECT o.objektnummer,
       o.name_roh,
       o.untergruppe,
       o.land,
       o.revier,
       o.basiswert,
       lg_fn_klasse(o.basiswert)               AS klasse,
       o.potenzialwert,
       (SELECT count(*) FROM lg_abgleich a
         WHERE a.objekt_id = o.id AND a.entscheidung = 'OFFEN')      AS vorschlaege_offen,
       (SELECT max(a.kennzahl) FROM lg_abgleich a
         WHERE a.objekt_id = o.id AND a.entscheidung = 'OFFEN')      AS hoechste_kennzahl,
       o.id
FROM lg_objekt o
WHERE o.bearbeitungsstatus IN ('BEWERTET','ZUR_PRUEFUNG')
ORDER BY o.basiswert DESC NULLS LAST, o.erstmals_gesehen_am;

-- Quellenbilanz: die einzige Grundlage, eine Quelle abzuschalten
CREATE OR REPLACE VIEW vw_lg_quellenbilanz AS
SELECT q.bezeichnung,
       q.art,
       q.erlaubnis,
       coalesce(sum(l.anzahl_gefunden), 0)  AS gefunden,
       coalesce(sum(l.anzahl_neu), 0)       AS neu,
       coalesce(sum(l.anzahl_dublette), 0)  AS bekannt,
       coalesce(sum(l.anzahl_gesperrt), 0)  AS gesperrt,
       (SELECT count(DISTINCT b.objekt_id) FROM lg_beleg b
         JOIN lg_objekt o ON o.id = b.objekt_id
        WHERE b.quelle_id = q.id AND o.bearbeitungsstatus = 'FREIGEGEBEN') AS freigegeben
FROM lg_quelle q LEFT JOIN lg_lauf l ON l.quelle_id = q.id
GROUP BY q.id, q.bezeichnung, q.art, q.erlaubnis;
