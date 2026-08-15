-- =============================================================================
--  01_CRM_ENGINE — Demodaten Teil 2: Leads, Chancen, Angebote, Aktivitäten,
--  Signale, Empfehlungen. Jede Situation bildet eine Regel des Regelwerks ab.
-- =============================================================================
\set M '''11111111-0000-0000-0000-000000000001'''
\set U1 '''22222222-0000-0000-0000-000000000001'''
\set U2 '''22222222-0000-0000-0000-000000000002'''
\set SYS '''22222222-0000-0000-0000-000000000009'''

-- --- LEADS --------------------------------------------------------------------
INSERT INTO crm_lead (id,mandant_id,leadnummer,kontakt_id,kunde_id,bedarfsart,beschreibung,produktinteresse,zeitfenster,
  boot_typ,boot_laenge_m,boot_wert_eur,boot_baujahr,motorleistung_kw,liegeplatz_marina,fahrgebiet,nutzungsart,unternehmerstatus,
  bestehender_versicherer,hauptfaelligkeit_bestand,quelle_id,verantwortlicher_id,status,eingegangen_am,erstkontakt_faellig_am,erstkontakt_am,reaktionszeit_minuten)
VALUES
 -- L1: A-Lead, Werftempfehlung, hoher Bootswert, Hauptfälligkeit in 47 Tagen
 ('90000000-0000-0000-0000-000000000001',:M,'L-2026-004711','30000000-0000-0000-0000-000000000021',NULL,'wechsel',
  'Werftübergabe Ostsee-Yachtbau. Neue Bavaria Cruiser 46, Wechsel zur Hauptfälligkeit gewünscht.',
  '{KASKO,HP}','3_monate','segelyacht',14.27,380000,2019,42,'Düsternbrook','nord_ostsee','privat',false,
  'Muster Assekuranz',current_date+47,'26000000-0000-0000-0000-000000000007',:U1,'neu',
  now()-interval '4 hours', now()+interval '1 hour', NULL, NULL),
 -- L2: Empfehlung einer Bestandskundin
 ('90000000-0000-0000-0000-000000000002',:M,'L-2026-004698','30000000-0000-0000-0000-000000000022',NULL,'neuversicherung',
  'Empfehlung Dr. Wessel. Neuerwerb X-Yachts, sucht Kasko inkl. Skipperdeckung.',
  '{KASKO,SKIPPER}','4_wochen','segelyacht',11.99,210000,2018,29,'Heikendorf','nord_ostsee','privat',false,
  NULL,NULL,'26000000-0000-0000-0000-000000000005',:U2,'kontaktiert',
  now()-interval '4 days', now()-interval '3 days 20 hours', now()-interval '2 days', 2880),
 -- L3: Messe-Lead, Flottenpotenzial, KEINE offene Aufgabe -> Vergessenswächter A-01
 ('90000000-0000-0000-0000-000000000003',:M,'L-2026-004655','30000000-0000-0000-0000-000000000023',NULL,'flotte',
  'Messekontakt Hanseboot. 4 Charterboote Nordsee, unzufrieden mit Bestandsversicherer.',
  '{FLOTTE,CHARTER}','3_monate','motoryacht',12.50,890000,2020,2*191,'Büsum','kuestennah','gewerblich_charter',true,
  'Nordmarine Vers.',current_date+190,'26000000-0000-0000-0000-000000000010',:U2,'kontaktiert',
  now()-interval '9 days', now()-interval '8 days', now()-interval '7 days', 1440),
 -- L4: Paid-Social-Lead, kleines Objekt -> D
 ('90000000-0000-0000-0000-000000000004',:M,'L-2026-004702','30000000-0000-0000-0000-000000000024',NULL,'skipper',
  'Instagram-Formular. Chartertörn Kroatien geplant, sucht Skipperhaftpflicht.',
  '{SKIPPER}','unklar','sportboot',5.20,35000,2012,60,NULL,'binnen','privat',false,
  NULL,NULL,'26000000-0000-0000-0000-000000000013',:U2,'neu',
  now()-interval '6 days', now()-interval '3 days', NULL, NULL),
 -- L5: Konfigurator abgebrochen -> Muster M2
 ('90000000-0000-0000-0000-000000000005',:M,'L-2026-004715','30000000-0000-0000-0000-000000000025',NULL,'neuversicherung',
  'Prämienrechner auf der Website abgebrochen (Schritt 3 von 4).',
  '{KASKO}','sofort','motoryacht',9.80,128000,2017,2*110,'Rendsburg','binnen','privat',false,
  NULL,NULL,'26000000-0000-0000-0000-000000000001',:U1,'neu',
  now()-interval '2 hours', now()+interval '22 hours', NULL, NULL),
 -- L6: Marketplace, Bootswechsel -> Muster M4
 ('90000000-0000-0000-0000-000000000006',:M,'L-2026-004709','30000000-0000-0000-0000-000000000026',NULL,'bootswechsel',
  'Marketplace: eigenes Boot inseriert, gleichzeitig Kaufanfrage für größere Yacht.',
  '{KASKO,HP}','4_wochen','segelyacht',13.10,340000,2021,40,'Hamburg','nord_ostsee','privat',false,
  'Elbversicherung',current_date+96,'26000000-0000-0000-0000-000000000015',:U1,'neu',
  now()-interval '3 days', now()-interval '2 days', NULL, NULL),
 -- L7: seit 197 Tagen kein Signal -> A-08 Nurturing, Consent widerrufen
 ('90000000-0000-0000-0000-000000000007',:M,'L-2026-002210','30000000-0000-0000-0000-000000000027',NULL,'neuversicherung',
  'Anfrage über Landingpage Winterlager, seither keine Reaktion.',
  '{WINTER}','unklar','sportboot',6.40,42000,2014,75,NULL,'binnen','privat',false,
  NULL,NULL,'26000000-0000-0000-0000-000000000002',:U2,'in_bearbeitung',
  now()-interval '205 days', now()-interval '202 days', now()-interval '200 days', 4320);

-- Bestandskunden-Lead: Björn Hagedorn hat ein neues Boot gekauft (Cross-Sell aus Objektsignal)
INSERT INTO crm_lead (id,mandant_id,leadnummer,kontakt_id,kunde_id,bedarfsart,beschreibung,produktinteresse,zeitfenster,
  boot_ref_id,boot_typ,boot_laenge_m,boot_wert_eur,boot_baujahr,fahrgebiet,nutzungsart,quelle_id,verantwortlicher_id,status,eingegangen_am,erstkontakt_faellig_am)
VALUES
 ('90000000-0000-0000-0000-000000000008',:M,'L-2026-004720','30000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000008','bootswechsel',
  'Objektmodul meldet neues Boot "Klabautermann II" (485.000 €) ohne Deckung.',
  '{KASKO,HP}','sofort','50000000-0000-0000-0000-000000000021','segelyacht',12.30,485000,2021,'nord_ostsee','privat',
  '26000000-0000-0000-0000-000000000018',:U1,'neu',now()-interval '11 days', now()-interval '10 days');

-- Erfolgreich empfohlener Kontakt (bereits abgeschlossen) — Beleg für V-12
INSERT INTO crm_kontakt (id,mandant_id,anrede,vorname,nachname,geburtsdatum,email,mobil,plz,ort,
  lifecycle_stufe,stufe_seit,verantwortlicher_id,gebiet_id,letzter_kontakt_am)
VALUES ('30000000-0000-0000-0000-000000000028',:M,'herr','Lars','Nissen','1976-06-04','l.nissen@example.com',
  '+491701234000','24340','Eckernförde','S5_abschluss',now()-interval '40 days',:U2,
  '24000000-0000-0000-0000-000000000001',now()-interval '40 days');

INSERT INTO crm_lead (id,mandant_id,leadnummer,kontakt_id,bedarfsart,beschreibung,produktinteresse,zeitfenster,
  boot_typ,boot_laenge_m,boot_wert_eur,boot_baujahr,fahrgebiet,nutzungsart,quelle_id,verantwortlicher_id,
  status,eingegangen_am,erstkontakt_faellig_am,erstkontakt_am,reaktionszeit_minuten,qualifiziert_am,konvertiert_am)
VALUES ('90000000-0000-0000-0000-000000000009',:M,'L-2026-004301','30000000-0000-0000-0000-000000000028','neuversicherung',
  'Empfehlung Ove Petersen (Nordwind Charter). Najad 380, Kaskodeckung gesucht.','{KASKO}','4_wochen',
  'segelyacht',11.60,320000,2011,'nord_ostsee','privat','26000000-0000-0000-0000-000000000005',:U2,
  'konvertiert',now()-interval '75 days',now()-interval '74 days 20 hours',now()-interval '74 days 21 hours',180,
  now()-interval '70 days',now()-interval '40 days');

-- Attribution
INSERT INTO crm_lead_attribution (mandant_id,lead_id,quelle_id,modell,gewicht,kontaktpunkt_am)
SELECT :M,l.id,l.quelle_id,m.modell,1.0,l.eingegangen_am
FROM crm_lead l CROSS JOIN (VALUES ('first_touch'),('last_touch')) m(modell);

-- --- EMPFEHLUNGEN -------------------------------------------------------------
INSERT INTO crm_empfehlung (id,mandant_id,empfehlungsgeber_kontakt_id,empfehlungsgeber_kunde_id,empfehlungsgeber_partner_id,
  empfohlener_name,empfohlener_email,empfohlener_telefon,erzeugter_lead_id,erzeugter_kontakt_id,beziehung,anlass,status,
  wert_eur,rueckmeldung_am,dsgvo_hinweis_erfolgt,eingegangen_am,abgeschlossen_am)
VALUES
 ('a0000000-0000-0000-0000-000000000001',:M,'30000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003',NULL,
  'Sönke Ohlsen','s.ohlsen@example.com','+491721122334','90000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000022',
  'stegnachbar','gespraech','kontaktiert',NULL,now()-interval '2 days',true,now()-interval '4 days',NULL),
 ('a0000000-0000-0000-0000-000000000002',:M,'30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',NULL,
  'Lars Nissen','l.nissen@example.com','+491701234000','90000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000028','geschaeftlich','abschluss','gewonnen',
  3200,now()-interval '38 days',true,now()-interval '75 days',now()-interval '40 days'),
 ('a0000000-0000-0000-0000-000000000003',:M,NULL,NULL,'28000000-0000-0000-0000-000000000001',
  'Jan Kramer','j.kramer@example.com','+491701234567','90000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000021',
  'geschaeftlich','partnerportal','eingegangen',NULL,NULL,true,now()-interval '4 hours',NULL),
 -- Empfehlung ohne Rückmeldung an den Geber -> Qualitätsproblem P-10
 ('a0000000-0000-0000-0000-000000000004',:M,'30000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000006',NULL,
  'Maike Struck','m.struck@example.com',NULL,NULL,NULL,'freund','kampagne','eingegangen',
  NULL,NULL,false,now()-interval '21 days',NULL);

UPDATE crm_lead SET empfehlung_id='a0000000-0000-0000-0000-000000000001' WHERE id='90000000-0000-0000-0000-000000000002';
UPDATE crm_lead SET empfehlung_id='a0000000-0000-0000-0000-000000000003' WHERE id='90000000-0000-0000-0000-000000000001';

-- --- OPPORTUNITIES ------------------------------------------------------------
INSERT INTO crm_opportunity (id,mandant_id,opportunity_nummer,name,kunde_id,kontakt_id,lead_id,boot_ref_id,
  wert_eur,deckungsbeitrag_eur,courtage_prozent,wahrscheinlichkeit,produktinteresse,deckungsumfang,versicherungssumme_eur,
  fahrgebiet,wettbewerber,wettbewerbspraemie_eur,quelle_id,verantwortlicher_id,team_id,pipeline_stufe,stufe_seit,
  erwartetes_abschlussdatum,naechster_schritt,naechster_schritt_am,ursprung,gewinngrund,verlustgrund,abgeschlossen_am)
VALUES
 -- O1 Angebot draußen, 2x geöffnet -> Muster M6 / Regel A-16
 ('b0000000-0000-0000-0000-000000000001',:M,'O-2026-0331','Seebär Yachting — Charterdeckung — Sealine F430',
  '40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',NULL,'50000000-0000-0000-0000-000000000010',
  3100,558,18,50,'{CHARTER}','{charter,haftpflicht}',410000,'nord_ostsee',NULL,NULL,
  '26000000-0000-0000-0000-000000000001',:U1,'23000000-0000-0000-0000-000000000001','angebot',now()-interval '3 days',
  current_date+18,'Nachfassanruf T+3',current_date,'manuell',NULL,NULL,NULL),
 -- O2 Verhandlung, Termin steht
 ('b0000000-0000-0000-0000-000000000002',:M,'O-2026-0318','Marina Düsternbrook — Flottenvertrag — 3 Arbeitsboote',
  '40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000005',NULL,NULL,
  9800,1372,14,75,'{FLOTTE,HP}','{flotte,haftpflicht}',1500000,'kuestennah','Nordmarine Vers.',10400,
  '26000000-0000-0000-0000-000000000008',:U1,'23000000-0000-0000-0000-000000000001','verhandlung',now()-interval '6 days',
  current_date+12,'Konditionsgespräch',current_date+2,'manuell',NULL,NULL,NULL),
 -- O3 Stillstand seit 25 Tagen in "in_bearbeitung" (max. 10 WT) -> A-15
 ('b0000000-0000-0000-0000-000000000003',:M,'O-2026-0295','Segelclub Möwe — Vereinsdeckung — Jollenflotte',
  '40000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000009',NULL,NULL,
  2600,390,15,25,'{HP,UNFALL}','{haftpflicht,unfall}',3000000,'kuestennah',NULL,NULL,
  '26000000-0000-0000-0000-000000000009',:U2,'23000000-0000-0000-0000-000000000001','in_bearbeitung',now()-interval '25 days',
  current_date+30,'Unterlagen des Vereins anfordern',current_date-12,'manuell',NULL,NULL,NULL),
 -- O4 gewonnen aus Empfehlung (speist V-12 Empfehlungsanteil)
 ('b0000000-0000-0000-0000-000000000004',:M,'O-2026-0240','Lars Nissen — Kasko — Najad 380',
  NULL,'30000000-0000-0000-0000-000000000028','90000000-0000-0000-0000-000000000009',NULL,
  3200,576,18,100,'{KASKO}','{kasko,haftpflicht}',320000,'nord_ostsee',NULL,NULL,
  '26000000-0000-0000-0000-000000000005',:U2,'23000000-0000-0000-0000-000000000001','gewonnen',now()-interval '40 days',
  current_date-40,NULL,NULL,'empfehlung','empfehlung_vertrauen',NULL,now()-interval '40 days'),
 -- O5 verloren an Wettbewerb wegen Preis -> Wiedervorlage W-10
 ('b0000000-0000-0000-0000-000000000005',:M,'O-2026-0208','Klaus Reimers — Kasko — Hallberg-Rassy 372',
  '40000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000007',NULL,'50000000-0000-0000-0000-000000000020',
  5400,972,18,0,'{KASKO}','{kasko,haftpflicht}',215000,'nord_ostsee','Pantaenius',4650,
  '26000000-0000-0000-0000-000000000003',:U2,'23000000-0000-0000-0000-000000000001','verloren',now()-interval '60 days',
  current_date-60,NULL,NULL,'manuell',NULL,'preis',now()-interval '60 days'),
 -- O6 weiterer Gewinn im laufenden Quartal
 ('b0000000-0000-0000-0000-000000000006',:M,'O-2026-0262','Hendrik Voss — Wertanpassung Kasko — Störtebeker',
  '40000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000004',NULL,'50000000-0000-0000-0000-000000000012',
  1980,356,18,100,'{KASKO}','{kasko}',320000,'nord_ostsee',NULL,NULL,
  '26000000-0000-0000-0000-000000000001',:U1,'23000000-0000-0000-0000-000000000001','gewonnen',now()-interval '22 days',
  current_date-22,NULL,NULL,'next_best_offer','beratungsqualitaet',NULL,now()-interval '22 days');

INSERT INTO crm_opportunity_position (opportunity_id,produkt_id,bezeichnung,praemie_eur,boot_ref_id) VALUES
 ('b0000000-0000-0000-0000-000000000001','25000000-0000-0000-0000-000000000006','Charterdeckung gewerblich',3100,'50000000-0000-0000-0000-000000000010'),
 ('b0000000-0000-0000-0000-000000000002','25000000-0000-0000-0000-000000000007','Flottenvertrag 3 Boote',9800,NULL);

INSERT INTO crm_opportunity_stufen_historie (opportunity_id,von_stufe,nach_stufe,dauer_tage,wahrscheinlichkeit_vorher,wahrscheinlichkeit_nachher,benutzer_id,zeitstempel) VALUES
 ('b0000000-0000-0000-0000-000000000001','neu','in_bearbeitung',2,10,25,:U1,now()-interval '12 days'),
 ('b0000000-0000-0000-0000-000000000001','in_bearbeitung','angebot',7,25,50,:U1,now()-interval '3 days'),
 ('b0000000-0000-0000-0000-000000000002','angebot','verhandlung',9,50,75,:U1,now()-interval '6 days');

-- --- ANGEBOTE -----------------------------------------------------------------
INSERT INTO crm_angebot (id,mandant_id,opportunity_id,angebotsnummer,variante,praemie_brutto_eur,praemie_netto_eur,
  versicherungssumme_eur,selbstbehalt_eur,deckungsumfang,laufzeit_monate,gueltig_bis,versendet_am,versandkanal,
  geoeffnet_am,oeffnungen_anzahl,letzte_oeffnung_am,status)
VALUES
 ('c0000000-0000-0000-0000-000000000001',:M,'b0000000-0000-0000-0000-000000000001','AN-2026-0881','komfort',3100,2605,
  410000,5000,'{charter,haftpflicht}',12,current_date+25,now()-interval '3 days','email',
  now()-interval '2 days',2,now()-interval '19 hours','geoeffnet'),
 -- Angebot läuft in 2 Tagen ab -> Regel A-12
 ('c0000000-0000-0000-0000-000000000002',:M,'b0000000-0000-0000-0000-000000000002','AN-2026-0864','premium',9800,8235,
  1500000,2500,'{flotte,haftpflicht}',12,current_date+2,now()-interval '20 days','email',
  now()-interval '19 days',4,now()-interval '5 days','in_verhandlung'),
 ('c0000000-0000-0000-0000-000000000003',:M,'b0000000-0000-0000-0000-000000000004','AN-2026-0790','basis',3200,2690,
  320000,2500,'{kasko,haftpflicht}',12,current_date-25,now()-interval '55 days','email',
  now()-interval '54 days',3,now()-interval '45 days','angenommen');

-- --- AKTIVITÄTEN --------------------------------------------------------------
INSERT INTO crm_aktivitaet (mandant_id,typ,richtung,kontakt_id,kunde_id,lead_id,opportunity_id,angebot_id,betreff,inhalt,
  zeitstempel,dauer_minuten,benutzer_id,ergebnis,ergebnis_notiz,stimmung,folgeaktion,folgeaktion_am,automatisch_erzeugt)
VALUES
 -- Nordwind: letzter echter Kontakt vor 312 Tagen (Kernproblem des Kunden)
 (:M,'termin','ausgehend','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',NULL,NULL,NULL,
  'Jahresgespräch 2025 vor Ort','Flottenbesprechung, Erweiterung um Windsbraut besprochen.',
  now()-interval '312 days',90,:U1,'erreicht_positiv',NULL,'positiv','wiedervorlage',now()-interval '52 days',false),
 (:M,'email','ausgehend','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',NULL,NULL,NULL,
  'Prämienanpassung zur Hauptfälligkeit 2025','Anpassung +18 % aufgrund Schadenverlauf mitgeteilt.',
  now()-interval '298 days',NULL,:U1,'versendet',NULL,'neutral','wiedervorlage',now()-interval '250 days',false),
 (:M,'system','intern','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',NULL,NULL,NULL,
  'Schaden S-2025-0088 geschlossen','Regulierung 96 Tage, Zufriedenheit 2/5, Beschwerde erfasst.',
  now()-interval '314 days',NULL,:SYS,'abgeschlossen',NULL,'negativ','keine',NULL,true),
 -- Seebär: laufender Vorgang
 (:M,'anruf','ausgehend','30000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002',NULL,'b0000000-0000-0000-0000-000000000001',NULL,
  'Bedarfsanalyse Charterdeckung','Saison 2027 mit 2 zusätzlichen Wochen Charter, Deckung anpassen.',
  now()-interval '12 days',35,:U1,'erreicht_positiv',NULL,'positiv','angebot_erstellen',now()-interval '4 days',false),
 (:M,'angebot','ausgehend','30000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002',NULL,'b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
  'Angebot AN-2026-0881 versendet','Variante Komfort, 3.100 € Jahresprämie, gültig 28 Tage.',
  now()-interval '3 days',NULL,:U1,'versendet',NULL,'neutral','anruf',current_date,false),
 -- Dr. Wessel: Empfehlungsgespräch
 (:M,'anruf','eingehend','30000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003',NULL,NULL,NULL,
  'Empfehlung Stegnachbar','Frau Dr. Wessel empfiehlt Herrn Ohlsen, X-Yachts Neuerwerb.',
  now()-interval '58 days',12,:U2,'erreicht_positiv',NULL,'positiv','wiedervorlage',now()-interval '20 days',false),
 -- Sönke Ohlsen: Erstkontakt erfolgt
 (:M,'anruf','ausgehend','30000000-0000-0000-0000-000000000022',NULL,'90000000-0000-0000-0000-000000000002',NULL,NULL,
  'Erstkontakt aus Empfehlung','Bedarf bestätigt, Unterlagen zugesagt, Termin folgt.',
  now()-interval '2 days',18,:U2,'erreicht_positiv',NULL,'positiv','termin_vereinbaren',current_date+1,false),
 -- Imke Dohrn (L3): kontaktiert, aber danach nichts mehr -> Vergessenswächter
 (:M,'anruf','ausgehend','30000000-0000-0000-0000-000000000023',NULL,'90000000-0000-0000-0000-000000000003',NULL,NULL,
  'Erstkontakt Messelead','Interesse an Flottenlösung, Unterlagen angefordert.',
  now()-interval '7 days',22,:U2,'erreicht_positiv',NULL,'positiv','unterlagen_anfordern',now()-interval '5 days',false),
 -- Björn Hagedorn: Schaden positiv abgeschlossen
 (:M,'system','intern','30000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000008',NULL,NULL,NULL,
  'Schaden S-2026-0031 reguliert','28 Tage Regulierungsdauer, Zufriedenheit 5/5.',
  now()-interval '32 days',NULL,:SYS,'abgeschlossen',NULL,'positiv','keine',NULL,true),
 (:M,'anruf','eingehend','30000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000008',NULL,NULL,NULL,
  'Rückmeldung nach Schadenregulierung','Kunde sehr zufrieden, erwähnt Bootskauf.',
  now()-interval '14 days',9,:U1,'erreicht_positiv',NULL,'positiv','wiedervorlage',now()-interval '7 days',false),
 -- Marina Düsternbrook: Verhandlung
 (:M,'meeting','ausgehend','30000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000005',NULL,'b0000000-0000-0000-0000-000000000002',NULL,
  'Konditionsgespräch Flottenvertrag','Wettbewerbsangebot 10.400 € liegt vor, Selbstbehalt verhandelt.',
  now()-interval '9 days',60,:U1,'erreicht_einwand','Selbstbehalt 2.500 € zu hoch, Kunde fordert 1.500 €.','neutral','anruf',current_date+2,false),
 -- Segelclub: Stillstand
 (:M,'email','ausgehend','30000000-0000-0000-0000-000000000009','40000000-0000-0000-0000-000000000009',NULL,'b0000000-0000-0000-0000-000000000003',NULL,
  'Unterlagen Vereinsdeckung angefordert','Mitgliederliste und Bootsverzeichnis erbeten.',
  now()-interval '25 days',NULL,:U2,'versendet',NULL,'neutral','unterlagen_anfordern',now()-interval '18 days',false),
 -- Klaus Reimers: Exit
 (:M,'anruf','ausgehend','30000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000007',NULL,'b0000000-0000-0000-0000-000000000005',NULL,
  'Kündigungsgespräch','Wechsel zu Pantaenius, 750 € Prämiendifferenz ausschlaggebend.',
  now()-interval '149 days',20,:U2,'erreicht_absage','Preisdifferenz 14 %; Deckungsumfang war unstrittig.','negativ','wiedervorlage',current_date+215,false);

-- --- SIGNALE ------------------------------------------------------------------
INSERT INTO crm_signal (mandant_id,signal_typ_id,kontakt_id,lead_id,tracking_id,zeitstempel,kanal,url,verarbeitet)
SELECT :M, st.id, s.kontakt_id::uuid, s.lead_id::uuid, s.tracking, now() - (s.vor_stunden || ' hours')::interval, s.kanal, s.url, false
FROM (VALUES
 -- Jan Kramer: Kaufvorbereitung (M1)
 ('S-WEB-03','30000000-0000-0000-0000-000000000021','90000000-0000-0000-0000-000000000001','tr-jan-01',26,'web','/yachtversicherung'),
 ('S-WEB-01','30000000-0000-0000-0000-000000000021','90000000-0000-0000-0000-000000000001','tr-jan-01',25,'web','/tarife'),
 ('S-WEB-05','30000000-0000-0000-0000-000000000021','90000000-0000-0000-0000-000000000001','tr-jan-01',24,'web','/rechner'),
 ('S-DOC-01','30000000-0000-0000-0000-000000000021','90000000-0000-0000-0000-000000000001','tr-jan-01',23,'web','/bedingungen.pdf'),
 ('S-PART-01','30000000-0000-0000-0000-000000000021','90000000-0000-0000-0000-000000000001',NULL,5,'partner','ostsee-yachtbau'),
 -- Rolf Timm: Abbrecher (M2)
 ('S-WEB-05','30000000-0000-0000-0000-000000000025','90000000-0000-0000-0000-000000000005','tr-rolf-01',3,'web','/rechner'),
 ('S-WEB-06','30000000-0000-0000-0000-000000000025','90000000-0000-0000-0000-000000000005','tr-rolf-01',2,'web','/rechner/schritt-3'),
 -- Christina Bohl: Bootswechsel (M4)
 ('S-MKT-01','30000000-0000-0000-0000-000000000026','90000000-0000-0000-0000-000000000006','tr-christina-01',72,'marketplace','/inserat/48221'),
 ('S-MKT-02','30000000-0000-0000-0000-000000000026','90000000-0000-0000-0000-000000000006','tr-christina-01',30,'marketplace','/anfrage/51900'),
 ('S-WEB-02','30000000-0000-0000-0000-000000000026','90000000-0000-0000-0000-000000000006','tr-christina-01',26,'web','/kasko'),
 -- Birte Jessen: Angebot mehrfach geöffnet (M6)
 ('S-MAIL-02','30000000-0000-0000-0000-000000000002',NULL,'tr-birte-01',48,'email','AN-2026-0881'),
 ('S-MAIL-03','30000000-0000-0000-0000-000000000002',NULL,'tr-birte-01',19,'email','AN-2026-0881'),
 ('S-WEB-01','30000000-0000-0000-0000-000000000002',NULL,'tr-birte-01',18,'web','/tarife'),
 -- Nordwind: Hauptfälligkeit T-90 überschritten, Newsletter unbeachtet
 ('S-VTR-01','30000000-0000-0000-0000-000000000001',NULL,NULL,1032,'system','HF 2026-10'),
 -- Dr. Wessel: Newsletter aktiv
 ('S-NL-01','30000000-0000-0000-0000-000000000003',NULL,'tr-almut-01',264,'email','saisonstart'),
 ('S-NL-02','30000000-0000-0000-0000-000000000003',NULL,'tr-almut-01',263,'email','saisonstart/skipper'),
 -- Petra Lindqvist: Mittelmeer, Newsletter
 ('S-NL-01','30000000-0000-0000-0000-000000000006',NULL,'tr-petra-01',144,'email','saisonstart'),
 -- Björn Hagedorn: Bootswechsel gemeldet
 ('S-OBJ-01','30000000-0000-0000-0000-000000000008','90000000-0000-0000-0000-000000000008','tr-bjoern-01',264,'objekt','boot/50000000-...21'),
 ('S-SCH-01','30000000-0000-0000-0000-000000000008',NULL,'tr-bjoern-01',768,'schaden','S-2026-0031'),
 -- Mareike Peters: schwaches Interesse
 ('S-WEB-02','30000000-0000-0000-0000-000000000024','90000000-0000-0000-0000-000000000004','tr-mareike-01',120,'web','/skipperhaftpflicht'),
 -- Uwe Sandmann: Abmeldung
 ('S-NEG-01','30000000-0000-0000-0000-000000000027','90000000-0000-0000-0000-000000000007',NULL,4728,'email','newsletter-abmeldung')
) AS s(code,kontakt_id,lead_id,tracking,vor_stunden,kanal,url)
JOIN crm_signal_typ st ON st.code = s.code;

-- Websitebesuche als Mengensignal (für Block C des Lead Scores)
INSERT INTO crm_signal (mandant_id,signal_typ_id,kontakt_id,lead_id,tracking_id,zeitstempel,kanal,url,verarbeitet)
SELECT :M, st.id,'30000000-0000-0000-0000-000000000021','90000000-0000-0000-0000-000000000001','tr-jan-01',
       now() - (g*18 || ' hours')::interval,'web','/yachtversicherung',false
FROM generate_series(1,6) g, crm_signal_typ st WHERE st.code='S-WEB-02';

-- --- WIEDERVORLAGE-REGELN (Auszug, entsprechend 07_AUFGABENMODELL.md) ---------
INSERT INTO crm_wiedervorlage_regel (mandant_id,code,bezeichnung,anlass,bezug_typ,zeitpunkt_typ,offset_tage,aufgabe_typ,aufgabe_titel_vorlage,prioritaet,empfaenger_logik,buendelbar) VALUES
 (:M,'W-01','Angebot nachfassen T+3','angebot_versendet','angebot','relativ',3,'angebot_nachfassen','Angebot {angebotsnummer} nachfassen (T+3)','hoch','verantwortlicher',false),
 (:M,'W-02','Angebot läuft ab','angebot_ablauf','angebot','relativ',-3,'angebot_nachfassen','Angebot {angebotsnummer} läuft ab','kritisch','verantwortlicher',false),
 (:M,'W-03','Hauptfälligkeit T-90','hauptfaelligkeit','vertrag_ref','relativ',-90,'hauptfaelligkeit','Hauptfälligkeitsgespräch {kunde}','hoch','betreuer',false),
 (:M,'W-04','Jahresgespräch','jahresgespraech','kunde','relativ',-30,'jahresgespraech','Jahresgespräch {kunde}','normal','betreuer',false),
 (:M,'W-05','Geburtstag','geburtstag','kontakt','relativ',-3,'geburtstag','Geburtstag {kontakt}','niedrig','betreuer',true),
 (:M,'W-06','Wertprüfung','wertpruefung','kunde','absolut',730,'wertpruefung','Bootswert prüfen: {boot}','normal','betreuer',false),
 (:M,'W-07','Empfehlungsanfrage','empfehlungsanfrage','kunde','absolut',270,'empfehlungsanfrage','Empfehlung erbitten: {kunde}','normal','betreuer',false),
 (:M,'W-08','Kein Kontakt 180 Tage','beziehungspflege','kunde','absolut',180,'beziehungspflege','Beziehungspflege {kunde}','normal','betreuer',true);
