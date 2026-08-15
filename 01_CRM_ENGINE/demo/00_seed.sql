-- =============================================================================
--  01_CRM_ENGINE — Demodaten
--  Realistischer Ausschnitt eines Boots-/Yachtversicherungsbestands.
--  Alle Datumsangaben sind relativ zu current_date, damit die Demo
--  unabhängig vom Ausführungstag dieselben Situationen erzeugt.
-- =============================================================================
\set M '''11111111-0000-0000-0000-000000000001'''

-- --- Mandant, Benutzer, Team, Gebiete -----------------------------------------
INSERT INTO crm_mandant_ref (id,name,kurzname) VALUES (:M,'Callidus Assekuranz','CAL');

INSERT INTO crm_benutzer_ref (id,mandant_id,anzeigename,email,rolle,kapazitaet_leads_pro_woche) VALUES
 ('22222222-0000-0000-0000-000000000001',:M,'Marc Sanders','m.sanders@callidus.example','vertrieb',25),
 ('22222222-0000-0000-0000-000000000002',:M,'Lena Brinkmann','l.brinkmann@callidus.example','vertrieb',25),
 ('22222222-0000-0000-0000-000000000003',:M,'Tobias Reuter','t.reuter@callidus.example','teamleitung',10),
 ('22222222-0000-0000-0000-000000000004',:M,'Sabine Kloos','s.kloos@callidus.example','innendienst',15),
 ('22222222-0000-0000-0000-000000000009',:M,'System','system@callidus.example','system',0);

INSERT INTO crm_team (id,mandant_id,name,leiter_id) VALUES
 ('23000000-0000-0000-0000-000000000001',:M,'Vertrieb Nord','22222222-0000-0000-0000-000000000003');
INSERT INTO crm_team_mitglied (team_id,benutzer_id,rolle_im_team) VALUES
 ('23000000-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','mitglied'),
 ('23000000-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','mitglied'),
 ('23000000-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004','innendienst');

INSERT INTO crm_gebiet (id,mandant_id,name,typ,kriterium,verantwortlicher_id,team_id,prioritaet) VALUES
 ('24000000-0000-0000-0000-000000000001',:M,'Küste Nord (PLZ 2xxxx)','plz','{"plz_von":"20000","plz_bis":"29999"}','22222222-0000-0000-0000-000000000001','23000000-0000-0000-0000-000000000001',10),
 ('24000000-0000-0000-0000-000000000002',:M,'Binnen/Süd','plz','{"plz_von":"30000","plz_bis":"99999"}','22222222-0000-0000-0000-000000000002','23000000-0000-0000-0000-000000000001',20);

-- --- Produkte -----------------------------------------------------------------
INSERT INTO crm_produkt (id,mandant_id,code,bezeichnung,sparte,durchschnittspraemie_eur,courtage_prozent) VALUES
 ('25000000-0000-0000-0000-000000000001',:M,'HP','Wassersport-Haftpflicht','haftpflicht',180,20),
 ('25000000-0000-0000-0000-000000000002',:M,'KASKO','Yacht-Kasko','kasko',1450,18),
 ('25000000-0000-0000-0000-000000000003',:M,'SKIPPER','Skipper-Haftpflicht','skipper',340,22),
 ('25000000-0000-0000-0000-000000000004',:M,'RS','Wassersport-Rechtsschutz','rechtsschutz',260,25),
 ('25000000-0000-0000-0000-000000000005',:M,'TRANSPORT','Transport- und Trailerdeckung','transport',210,20),
 ('25000000-0000-0000-0000-000000000006',:M,'CHARTER','Charterdeckung gewerblich','charter',2900,15),
 ('25000000-0000-0000-0000-000000000007',:M,'FLOTTE','Flottenvertrag','flotte',9800,14),
 ('25000000-0000-0000-0000-000000000008',:M,'WINTER','Winterlagerdeckung','winterlager',160,20),
 ('25000000-0000-0000-0000-000000000009',:M,'UNFALL','Insassen-/Crew-Unfall','unfall',290,22);

-- --- Leadquellen --------------------------------------------------------------
INSERT INTO crm_lead_quelle (id,mandant_id,code,bezeichnung,kategorie,kostenmodell,erwartete_qualitaet) VALUES
 ('26000000-0000-0000-0000-000000000001',:M,'WEB','Webseite (organisch)','inbound','fix','hoch'),
 ('26000000-0000-0000-0000-000000000002',:M,'LP','Landingpages','inbound','cpc','hoch'),
 ('26000000-0000-0000-0000-000000000003',:M,'NL','Newsletter','owned','fix','mittel'),
 ('26000000-0000-0000-0000-000000000004',:M,'BREVO','Brevo-Kampagne','owned','fix','mittel'),
 ('26000000-0000-0000-0000-000000000005',:M,'EMPF','Empfehlung (Kunde)','netzwerk','keine','sehr_hoch'),
 ('26000000-0000-0000-0000-000000000006',:M,'HAENDL','Händler','partner','courtage','hoch'),
 ('26000000-0000-0000-0000-000000000007',:M,'WERFT','Werften','partner','courtage','sehr_hoch'),
 ('26000000-0000-0000-0000-000000000008',:M,'MARINA','Marinas','partner','keine','hoch'),
 ('26000000-0000-0000-0000-000000000009',:M,'YCLUB','Yachtclubs','partner','fix','hoch'),
 ('26000000-0000-0000-0000-000000000010',:M,'MESSE','Messen','event','fix','mittel'),
 ('26000000-0000-0000-0000-000000000011',:M,'REGATTA','Regatten','event','fix','mittel'),
 ('26000000-0000-0000-0000-000000000012',:M,'FB','Facebook','paid_social','cpl','niedrig'),
 ('26000000-0000-0000-0000-000000000013',:M,'IG','Instagram','paid_social','cpl','niedrig'),
 ('26000000-0000-0000-0000-000000000014',:M,'LI','LinkedIn','paid_social','cpc','mittel'),
 ('26000000-0000-0000-0000-000000000015',:M,'MKTPL','Marketplace','plattform','provision','hoch'),
 ('26000000-0000-0000-0000-000000000016',:M,'ACAD','Academy','plattform','fix','mittel'),
 ('26000000-0000-0000-0000-000000000017',:M,'PPORTAL','Partnerportal','partner','courtage','hoch'),
 ('26000000-0000-0000-0000-000000000018',:M,'TEL_IN','Telefonische Direktanfrage','inbound','keine','hoch');

-- Kosten der letzten drei Monate (für CPL/CAC/ROI)
INSERT INTO crm_lead_quelle_kosten (mandant_id,quelle_id,jahr,monat,kosten_eur)
SELECT :M, q.id, EXTRACT(year FROM d)::int, EXTRACT(month FROM d)::int, k.betrag
FROM (VALUES
   ('WEB',1200),('LP',3400),('NL',300),('BREVO',450),('EMPF',0),('HAENDL',0),('WERFT',0),
   ('MARINA',600),('YCLUB',900),('MESSE',7800),('REGATTA',2200),('FB',2600),('IG',3100),
   ('LI',1800),('MKTPL',0),('ACAD',700),('PPORTAL',0),('TEL_IN',0)
 ) AS k(code,betrag)
JOIN crm_lead_quelle q ON q.code = k.code
CROSS JOIN generate_series(date_trunc('month',current_date) - interval '2 months',
                           date_trunc('month',current_date), interval '1 month') d;

-- --- Signaltypen (Katalog aus 03_LEADMODELL.md) -------------------------------
INSERT INTO crm_signal_typ (mandant_id,code,bezeichnung,kategorie,basisgewicht,halbwertszeit_tage) VALUES
 (:M,'S-WEB-01','Besuch Tarif-/Preisseite','website',8,21),
 (:M,'S-WEB-02','Besuch Produktdetailseite','website',5,30),
 (:M,'S-WEB-03','Wiederholter Besuch','website',10,14),
 (:M,'S-WEB-04','Kontaktseite ohne Absenden','website',9,10),
 (:M,'S-WEB-05','Rechner/Konfigurator gestartet','website',12,21),
 (:M,'S-WEB-06','Rechner abgebrochen','website',11,7),
 (:M,'S-DOC-01','Download Bedingungen/Tarifübersicht','website',10,45),
 (:M,'S-DOC-02','Download Ratgeber/Checkliste','website',4,60),
 (:M,'S-NL-01','Newsletter geöffnet','newsletter',2,30),
 (:M,'S-NL-02','Newsletter-Klick Produktlink','newsletter',6,30),
 (:M,'S-NL-03','Mehrfachklick in Kampagne','newsletter',8,21),
 (:M,'S-EVT-01','Eventanmeldung','event',9,60),
 (:M,'S-EVT-02','Eventteilnahme bestätigt','event',12,90),
 (:M,'S-ACAD-01','Academy-Kurs gestartet','academy',5,90),
 (:M,'S-ACAD-02','Academy-Zertifikat','academy',7,180),
 (:M,'S-MKT-01','Marketplace-Inserat (Bootsverkauf)','marketplace',14,60),
 (:M,'S-MKT-02','Marketplace-Kaufanfrage','marketplace',16,45),
 (:M,'S-MAIL-01','Antwort auf Vertriebsmail','email',12,30),
 (:M,'S-MAIL-02','Angebots-PDF geöffnet','email',15,21),
 (:M,'S-MAIL-03','Angebots-PDF mehrfach geöffnet','email',18,14),
 (:M,'S-PART-01','Partnerportal-Übergabe','partner',14,90),
 (:M,'S-OBJ-01','Bootswechsel gemeldet','objekt',20,120),
 (:M,'S-OBJ-02','Wertänderung Boot > 20 %','objekt',12,90),
 (:M,'S-VTR-01','Hauptfälligkeit T-90 erreicht','vertrag',15,90),
 (:M,'S-SCH-01','Schaden abgeschlossen, Zufriedenheit hoch','schaden',10,60),
 (:M,'S-NEG-01','Abmeldung Newsletter','negativ',-15,180),
 (:M,'S-NEG-02','Keine Reaktion auf 3 Kontaktversuche','negativ',-12,60),
 (:M,'S-NEG-03','Schadenbeschwerde','negativ',-18,180);

-- --- Partner ------------------------------------------------------------------
INSERT INTO crm_organisation (id,mandant_id,name,rechtsform,ort,plz,ist_partner) VALUES
 ('27000000-0000-0000-0000-000000000001',:M,'Ostsee-Yachtbau GmbH','GmbH','Eckernförde','24340',true),
 ('27000000-0000-0000-0000-000000000002',:M,'Marina Düsternbrook Betriebs GmbH','GmbH','Kiel','24105',true),
 ('27000000-0000-0000-0000-000000000003',:M,'Kieler Yacht-Club e.V.','e.V.','Kiel','24103',true),
 ('27000000-0000-0000-0000-000000000004',:M,'Bootscenter Nord GmbH','GmbH','Heiligenhafen','23774',true);

INSERT INTO crm_partner (id,mandant_id,organisation_id,name,partner_typ,region,kooperationsstatus,vertrag_seit,courtage_prozent,betreuer_id,zugefuehrte_leads,gewonnene_leads,umsatz_eur,letzter_kontakt_am,portal_zugang) VALUES
 ('28000000-0000-0000-0000-000000000001',:M,'27000000-0000-0000-0000-000000000001','Ostsee-Yachtbau GmbH','werft','Ostsee','exklusiv',current_date - 900,15,'22222222-0000-0000-0000-000000000001',34,17,58200,current_date - 12,true),
 ('28000000-0000-0000-0000-000000000002',:M,'27000000-0000-0000-0000-000000000002','Marina Düsternbrook','marina','Kiel','aktiv',current_date - 600,0,'22222222-0000-0000-0000-000000000001',19,6,14300,current_date - 118,true),
 ('28000000-0000-0000-0000-000000000003',:M,'27000000-0000-0000-0000-000000000003','Kieler Yacht-Club e.V.','yachtclub','Kiel','aktiv',current_date - 1100,0,'22222222-0000-0000-0000-000000000002',22,9,21400,current_date - 41,false),
 ('28000000-0000-0000-0000-000000000004',:M,'27000000-0000-0000-0000-000000000004','Bootscenter Nord','haendler','Ostholstein','aktiv',current_date - 420,12,'22222222-0000-0000-0000-000000000002',8,1,2100,current_date - 200,false);

UPDATE crm_lead_quelle SET partner_id='28000000-0000-0000-0000-000000000001' WHERE code='WERFT';
UPDATE crm_lead_quelle SET partner_id='28000000-0000-0000-0000-000000000002' WHERE code='MARINA';

-- --- Organisationen der Kunden ------------------------------------------------
INSERT INTO crm_organisation (id,mandant_id,name,rechtsform,ort,plz,ist_gewerblich) VALUES
 ('27000000-0000-0000-0000-000000000010',:M,'Nordwind Charter GmbH','GmbH','Heiligenhafen','23774',true),
 ('27000000-0000-0000-0000-000000000011',:M,'Seebär Yachting GmbH','GmbH','Flensburg','24937',true),
 ('27000000-0000-0000-0000-000000000012',:M,'Segelclub Möwe e.V.','e.V.','Laboe','24235',false);

-- --- Kontakte -----------------------------------------------------------------
INSERT INTO crm_kontakt (id,mandant_id,organisation_id,anrede,titel,vorname,nachname,geburtsdatum,email,telefon,mobil,plz,ort,lifecycle_stufe,stufe_seit,rollen,verantwortlicher_id,gebiet_id,tracking_ids,letzter_kontakt_am,letztes_signal_am) VALUES
 -- Bestandskunden-Kontakte
 ('30000000-0000-0000-0000-000000000001',:M,'27000000-0000-0000-0000-000000000010','herr',NULL,'Ove','Petersen','1968-04-12','o.petersen@nordwind-charter.example','+4943619988','+491701112233','23774','Heiligenhafen','S6_bestandskunde',current_date-2400,'{empfehlungsgeber,vip}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{tr-ove-01}',current_date-312,current_date-140),
 ('30000000-0000-0000-0000-000000000002',:M,'27000000-0000-0000-0000-000000000011','frau',NULL,'Birte','Jessen','1979-09-03','b.jessen@seebaer-yachting.example','+4946122114','+491721234455','24937','Flensburg','S4_angebot',current_date-40,'{}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{tr-birte-01}',current_date-3,current_date-2),
 ('30000000-0000-0000-0000-000000000003',:M,NULL,'frau','Dr.','Almut','Wessel','1971-08-19','a.wessel@example.com','+4943122556','+491511234567','24103','Kiel','S6_bestandskunde',current_date-1500,'{empfehlungsgeber}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000001','{tr-almut-01}',current_date-58,current_date-11),
 ('30000000-0000-0000-0000-000000000004',:M,NULL,'herr',NULL,'Hendrik','Voss','1962-11-27','h.voss@example.com','+4945039911',NULL,'23730','Neustadt','S6_bestandskunde',current_date-2100,'{}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{}',current_date-96,NULL),
 ('30000000-0000-0000-0000-000000000005',:M,'27000000-0000-0000-0000-000000000002','herr',NULL,'Sven','Bruhn','1975-02-14','s.bruhn@marina-duesternbrook.example','+4943155660',NULL,'24105','Kiel','S6_bestandskunde',current_date-800,'{partner}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{}',current_date-9,current_date-9),
 ('30000000-0000-0000-0000-000000000006',:M,NULL,'frau',NULL,'Petra','Lindqvist','1983-06-08','p.lindqvist@example.com',NULL,'+491638877665','24159','Kiel','S6_bestandskunde',current_date-980,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000001','{tr-petra-01}',current_date-74,current_date-6),
 ('30000000-0000-0000-0000-000000000007',:M,NULL,'herr',NULL,'Klaus','Reimers','1957-01-30','k.reimers@example.com','+4943819922',NULL,'24211','Preetz','S8_ehemalig',current_date-150,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000001','{}',current_date-149,NULL),
 ('30000000-0000-0000-0000-000000000008',:M,NULL,'herr',NULL,'Björn','Hagedorn','1980-08-21','b.hagedorn@example.com','+4946122998','+491759988776','24943','Flensburg','S6_bestandskunde',current_date-1200,'{}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{tr-bjoern-01}',current_date-14,current_date-13),
 ('30000000-0000-0000-0000-000000000009',:M,'27000000-0000-0000-0000-000000000012','herr',NULL,'Jörn','Andresen','1966-03-05','vorstand@sc-moewe.example','+4934399221',NULL,'24235','Laboe','S6_bestandskunde',current_date-1900,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000001','{}',current_date-210,NULL),
 ('30000000-0000-0000-0000-000000000010',:M,NULL,'herr',NULL,'Thies','Carstensen','1990-12-11','t.carstensen@example.com',NULL,'+491602233445','25813','Husum','S6_bestandskunde',current_date-500,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000001','{}',current_date-260,NULL),
 -- Lead-Kontakte
 ('30000000-0000-0000-0000-000000000021',:M,NULL,'herr',NULL,'Jan','Kramer','1974-05-22','j.kramer@example.com','+4943199887','+491701234567','24103','Kiel','S1_lead',current_date-2,'{}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{tr-jan-01}',NULL,current_date-1),
 ('30000000-0000-0000-0000-000000000022',:M,NULL,'herr',NULL,'Sönke','Ohlsen','1969-10-02','s.ohlsen@example.com',NULL,'+491721122334','24226','Heikendorf','S1_lead',current_date-4,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000001','{}',current_date-2,current_date-3),
 ('30000000-0000-0000-0000-000000000023',:M,NULL,'frau',NULL,'Imke','Dohrn','1977-07-14','i.dohrn@nordsee-charter.example','+4948313344',NULL,'25761','Büsum','S1_lead',current_date-9,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000001','{}',NULL,current_date-8),
 ('30000000-0000-0000-0000-000000000024',:M,NULL,'frau',NULL,'Mareike','Peters','1995-03-18','m.peters@example.com',NULL,'+491771122998','30159','Hannover','S1_lead',current_date-6,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000002','{tr-mareike-01}',NULL,current_date-5),
 ('30000000-0000-0000-0000-000000000025',:M,NULL,'herr',NULL,'Rolf','Timm','1972-02-09','r.timm@example.com','+4943214455',NULL,'24784','Westerrönfeld','S1_lead',current_date,'{}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{tr-rolf-01}',NULL,current_date),
 ('30000000-0000-0000-0000-000000000026',:M,NULL,'frau',NULL,'Christina','Bohl','1985-11-30','c.bohl@example.com',NULL,'+491634455667','22767','Hamburg','S1_lead',current_date-3,'{}','22222222-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','{tr-christina-01}',NULL,current_date-1),
 ('30000000-0000-0000-0000-000000000027',:M,NULL,'herr',NULL,'Uwe','Sandmann','1959-09-09','u.sandmann@example.com',NULL,'+491512233667','24534','Neumünster','S1_lead',current_date-205,'{}','22222222-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000002','{}',current_date-198,current_date-197);

-- Einwilligungen
INSERT INTO crm_consent (mandant_id,kontakt_id,kanal,zweck,status,rechtsgrundlage,nachweis_quelle)
SELECT :M,id,k.kanal,'vertragsanbahnung','erteilt','einwilligung','formular:webseite'
FROM crm_kontakt CROSS JOIN (VALUES ('email'),('telefon'),('tracking')) AS k(kanal)
WHERE id <> '30000000-0000-0000-0000-000000000027';
INSERT INTO crm_consent (mandant_id,kontakt_id,kanal,zweck,status,rechtsgrundlage,nachweis_quelle) VALUES
 (:M,'30000000-0000-0000-0000-000000000027','email','werbung','widerrufen','einwilligung','abmeldung:newsletter');

-- --- Kunden -------------------------------------------------------------------
INSERT INTO crm_kunde (id,mandant_id,kundennummer,organisation_id,haupt_kontakt_id,bezeichnung,kundentyp,status,kunde_seit,betreuer_id,team_id,zahlungsverzug_tage,schadenquote_prozent,letzter_kontakt_am,naechstes_jahresgespraech_am) VALUES
 ('40000000-0000-0000-0000-000000000001',:M,'K-10021','27000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000001','Nordwind Charter GmbH','charterbetrieb','aktiv',current_date-2400,'22222222-0000-0000-0000-000000000001','23000000-0000-0000-0000-000000000001',0,64,current_date-312,current_date-140),
 ('40000000-0000-0000-0000-000000000002',:M,'K-10044','27000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000002','Seebär Yachting GmbH','gewerblich','aktiv',current_date-700,'22222222-0000-0000-0000-000000000001','23000000-0000-0000-0000-000000000001',0,12,current_date-3,current_date+120),
 ('40000000-0000-0000-0000-000000000003',:M,'K-10088',NULL,'30000000-0000-0000-0000-000000000003','Dr. Almut Wessel','privat','aktiv',current_date-1500,'22222222-0000-0000-0000-000000000002','23000000-0000-0000-0000-000000000001',0,0,current_date-58,current_date+40),
 ('40000000-0000-0000-0000-000000000004',:M,'K-10102',NULL,'30000000-0000-0000-0000-000000000004','Hendrik Voss','privat','aktiv',current_date-2100,'22222222-0000-0000-0000-000000000001','23000000-0000-0000-0000-000000000001',0,22,current_date-96,current_date+18),
 ('40000000-0000-0000-0000-000000000005',:M,'K-10133','27000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000005','Marina Düsternbrook Betriebs GmbH','gewerblich','aktiv',current_date-800,'22222222-0000-0000-0000-000000000001','23000000-0000-0000-0000-000000000001',0,8,current_date-9,current_date+65),
 ('40000000-0000-0000-0000-000000000006',:M,'K-10190',NULL,'30000000-0000-0000-0000-000000000006','Petra Lindqvist','privat','aktiv',current_date-980,'22222222-0000-0000-0000-000000000002','23000000-0000-0000-0000-000000000001',0,0,current_date-74,current_date+95),
 ('40000000-0000-0000-0000-000000000007',:M,'K-10211',NULL,'30000000-0000-0000-0000-000000000007','Klaus Reimers','privat','ehemalig',current_date-2600,'22222222-0000-0000-0000-000000000002','23000000-0000-0000-0000-000000000001',0,140,current_date-149,NULL),
 ('40000000-0000-0000-0000-000000000008',:M,'K-10250',NULL,'30000000-0000-0000-0000-000000000008','Björn Hagedorn','privat','aktiv',current_date-1200,'22222222-0000-0000-0000-000000000001','23000000-0000-0000-0000-000000000001',0,38,current_date-14,current_date+150),
 ('40000000-0000-0000-0000-000000000009',:M,'K-10277','27000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000009','Segelclub Möwe e.V.','verein','aktiv',current_date-1900,'22222222-0000-0000-0000-000000000002','23000000-0000-0000-0000-000000000001',0,15,current_date-210,current_date-30),
 ('40000000-0000-0000-0000-000000000010',:M,'K-10301',NULL,'30000000-0000-0000-0000-000000000010','Thies Carstensen','privat','aktiv',current_date-500,'22222222-0000-0000-0000-000000000002','23000000-0000-0000-0000-000000000001',0,0,current_date-260,current_date+30);

UPDATE crm_kunde SET kunde_bis = current_date-150, beendigungsgrund='wechsel_wettbewerb'
 WHERE id='40000000-0000-0000-0000-000000000007';

INSERT INTO crm_kunde_kontakt (kunde_id,kontakt_id,rolle,ist_hauptkontakt)
SELECT k.id, k.haupt_kontakt_id, CASE WHEN k.kundentyp='privat' THEN 'eigner' ELSE 'entscheider' END, true
FROM crm_kunde k WHERE k.haupt_kontakt_id IS NOT NULL;

-- Partnerbeziehungen
INSERT INTO crm_partner_beziehung (mandant_id,partner_id,kunde_id,beziehungsart,seit) VALUES
 (:M,'28000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000003','liegeplatz',current_date-1400),
 (:M,'28000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000006','liegeplatz',current_date-900),
 (:M,'28000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003','mitgliedschaft',current_date-1600),
 (:M,'28000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','wartung',current_date-2000),
 (:M,'28000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000008','kauf',current_date-1200);

-- --- Boote (Read-Model Objektmodul) -------------------------------------------
INSERT INTO crm_boot_ref (id,mandant_id,kunde_id,name,boot_typ,hersteller,modell,baujahr,laenge_m,motorleistung_kw,wert_eur,wert_geprueft_am,liegeplatz_land,liegeplatz_marina,liegeplatz_partner_id,fahrgebiet,nutzungsart,status,erworben_am) VALUES
 ('50000000-0000-0000-0000-000000000001',:M,'40000000-0000-0000-0000-000000000001','Nordwind I','segelyacht','Bavaria','Cruiser 46',2019,14.27,42,285000,current_date-400,'DE','Heiligenhafen',NULL,'nord_ostsee','gewerblich_charter','aktiv',current_date-2300),
 ('50000000-0000-0000-0000-000000000002',:M,'40000000-0000-0000-0000-000000000001','Nordwind II','segelyacht','Hanse','458',2020,13.95,40,268000,current_date-400,'DE','Heiligenhafen',NULL,'nord_ostsee','gewerblich_charter','aktiv',current_date-2100),
 ('50000000-0000-0000-0000-000000000003',:M,'40000000-0000-0000-0000-000000000001','Nordwind III','katamaran','Lagoon','42',2021,12.80,2*29,540000,current_date-400,'DE','Heiligenhafen',NULL,'nord_ostsee','gewerblich_charter','aktiv',current_date-1500),
 ('50000000-0000-0000-0000-000000000004',:M,'40000000-0000-0000-0000-000000000001','Seeadler','motoryacht','Linssen','45 SL',2016,13.60,2*81,395000,current_date-1850,'DE','Heiligenhafen',NULL,'nord_ostsee','gewerblich_charter','aktiv',current_date-1800),
 ('50000000-0000-0000-0000-000000000005',:M,'40000000-0000-0000-0000-000000000001','Windsbraut','segelyacht','Dehler','38 SQ',2022,11.35,21,255000,current_date-120,'DE','Heiligenhafen',NULL,'nord_ostsee','gewerblich_charter','aktiv',current_date-300),
 ('50000000-0000-0000-0000-000000000010',:M,'40000000-0000-0000-0000-000000000002','Seebär','motoryacht','Sealine','F430',2018,13.20,2*257,410000,current_date-200,'DE','Flensburg',NULL,'nord_ostsee','gewerblich_charter','aktiv',current_date-680),
 ('50000000-0000-0000-0000-000000000011',:M,'40000000-0000-0000-0000-000000000003','Aquarius','segelyacht','X-Yachts','X4⁰',2020,12.35,29,395000,current_date-300,'DE','Kiel','28000000-0000-0000-0000-000000000002','nord_ostsee','privat','aktiv',current_date-1450),
 ('50000000-0000-0000-0000-000000000012',:M,'40000000-0000-0000-0000-000000000004','Störtebeker','klassiker','Abeking & Rasmussen','Kutter',1961,15.80,66,320000,current_date-880,'DE','Neustadt',NULL,'nord_ostsee','privat','aktiv',current_date-2050),
 ('50000000-0000-0000-0000-000000000013',:M,'40000000-0000-0000-0000-000000000005','Hafenmeister 1','rib','Brig','Navigator 610',2023,6.10,110,48000,current_date-150,'DE','Kiel','28000000-0000-0000-0000-000000000002','kuestennah','gewerblich_flotte','aktiv',current_date-700),
 ('50000000-0000-0000-0000-000000000014',:M,'40000000-0000-0000-0000-000000000005','Hafenmeister 2','rib','Brig','Navigator 610',2023,6.10,110,48000,current_date-150,'DE','Kiel','28000000-0000-0000-0000-000000000002','kuestennah','gewerblich_flotte','aktiv',current_date-700),
 ('50000000-0000-0000-0000-000000000015',:M,'40000000-0000-0000-0000-000000000005','Hafenmeister 3','sportboot','Quicksilver','605',2021,6.05,86,39000,current_date-150,'DE','Kiel','28000000-0000-0000-0000-000000000002','kuestennah','gewerblich_flotte','aktiv',current_date-500),
 ('50000000-0000-0000-0000-000000000016',:M,'40000000-0000-0000-0000-000000000006','Freja','segelyacht','Beneteau','Oceanis 40.1',2021,12.15,33,285000,current_date-260,'ES','Palma de Mallorca',NULL,'mittelmeer','privat','aktiv',current_date-950),
 ('50000000-0000-0000-0000-000000000017',:M,'40000000-0000-0000-0000-000000000008','Klabautermann','segelyacht','Dehler','34',2015,10.35,20,145000,current_date-330,'DE','Flensburg',NULL,'nord_ostsee','privat','aktiv',current_date-1150),
 ('50000000-0000-0000-0000-000000000018',:M,'40000000-0000-0000-0000-000000000009','Möwe I','jolle','Laser','Standard',2018,4.23,NULL,7500,current_date-600,'DE','Laboe',NULL,'kuestennah','verein','aktiv',current_date-1800),
 ('50000000-0000-0000-0000-000000000019',:M,'40000000-0000-0000-0000-000000000010','Nis Puk','sportboot','Quicksilver','555',2019,5.55,60,32000,current_date-480,'DE','Husum',NULL,'kuestennah','privat','aktiv',current_date-490),
 ('50000000-0000-0000-0000-000000000020',:M,'40000000-0000-0000-0000-000000000007','Albatros','segelyacht','Hallberg-Rassy','372',2014,11.30,29,215000,current_date-800,'DE','Preetz',NULL,'nord_ostsee','privat','verkauft',current_date-2500);

-- Björn Hagedorn hat gerade ein neues, größeres Boot erworben (Kaufsignal S-OBJ-01)
INSERT INTO crm_boot_ref (id,mandant_id,kunde_id,name,boot_typ,hersteller,modell,baujahr,laenge_m,motorleistung_kw,wert_eur,liegeplatz_land,liegeplatz_marina,fahrgebiet,nutzungsart,status,erworben_am) VALUES
 ('50000000-0000-0000-0000-000000000021',:M,'40000000-0000-0000-0000-000000000008','Klabautermann II','segelyacht','Hallberg-Rassy','40C',2021,12.30,55,485000,'DE','Flensburg','nord_ostsee','privat','aktiv',current_date-11);

-- --- Verträge (Read-Model Vertragsmodul) --------------------------------------
INSERT INTO crm_vertrag_ref (id,mandant_id,kunde_id,boot_ref_id,policennummer,produkt_code,sparte,status,beginn_am,hauptfaelligkeit,jahrespraemie_eur,versicherungssumme_eur,selbstbehalt_eur,courtage_eur,deckungsumfang,fahrgebiet,praemienaenderung_prozent) VALUES
 ('60000000-0000-0000-0000-000000000001',:M,'40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','P-2019-0341','KASKO','kasko','aktiv',current_date-2300,current_date+47,3180,285000,2500,572,'{kasko,haftpflicht}','nord_ostsee',18),
 ('60000000-0000-0000-0000-000000000002',:M,'40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','P-2020-0122','KASKO','kasko','aktiv',current_date-2100,current_date+47,2980,268000,2500,536,'{kasko,haftpflicht}','nord_ostsee',18),
 ('60000000-0000-0000-0000-000000000003',:M,'40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','P-2021-0455','KASKO','kasko','aktiv',current_date-1500,current_date+47,4120,540000,5000,741,'{kasko,haftpflicht}','nord_ostsee',18),
 ('60000000-0000-0000-0000-000000000004',:M,'40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004','P-2016-0781','KASKO','kasko','aktiv',current_date-1800,current_date+47,2540,395000,2500,457,'{kasko,haftpflicht}','nord_ostsee',18),
 ('60000000-0000-0000-0000-000000000005',:M,'40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000005','P-2022-0910','KASKO','kasko','aktiv',current_date-300,current_date+47,1460,255000,2500,263,'{kasko}','nord_ostsee',0),
 ('60000000-0000-0000-0000-000000000006',:M,'40000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000010','P-2024-0210','KASKO','kasko','aktiv',current_date-680,current_date+215,3210,410000,5000,578,'{kasko,haftpflicht}','nord_ostsee',4),
 ('60000000-0000-0000-0000-000000000007',:M,'40000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000011','P-2022-0044','KASKO','kasko','aktiv',current_date-1450,current_date+128,2140,395000,2500,385,'{kasko,haftpflicht}','nord_ostsee',3),
 ('60000000-0000-0000-0000-000000000008',:M,'40000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000012','P-2020-0611','KASKO','kasko','aktiv',current_date-2050,current_date+22,1980,320000,5000,356,'{kasko,haftpflicht}','nord_ostsee',6),
 ('60000000-0000-0000-0000-000000000009',:M,'40000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000013','P-2023-0777','HP','haftpflicht','aktiv',current_date-700,current_date+88,420,5000000,500,84,'{haftpflicht}','kuestennah',0),
 ('60000000-0000-0000-0000-000000000010',:M,'40000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000014','P-2023-0778','HP','haftpflicht','aktiv',current_date-700,current_date+88,420,5000000,500,84,'{haftpflicht}','kuestennah',0),
 ('60000000-0000-0000-0000-000000000011',:M,'40000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000015','P-2023-0779','HP','haftpflicht','aktiv',current_date-500,current_date+88,380,5000000,500,76,'{haftpflicht}','kuestennah',0),
 ('60000000-0000-0000-0000-000000000012',:M,'40000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000016','P-2023-0301','KASKO','kasko','aktiv',current_date-950,current_date+61,1890,285000,2500,340,'{kasko,haftpflicht}','kuestennah',5),
 ('60000000-0000-0000-0000-000000000013',:M,'40000000-0000-0000-0000-000000000008','50000000-0000-0000-0000-000000000017','P-2023-0500','KASKO','kasko','aktiv',current_date-1150,current_date+175,1120,145000,1500,202,'{kasko,haftpflicht}','nord_ostsee',2),
 ('60000000-0000-0000-0000-000000000014',:M,'40000000-0000-0000-0000-000000000009','50000000-0000-0000-0000-000000000018','P-2021-0999','HP','haftpflicht','aktiv',current_date-1800,current_date+250,240,3000000,250,48,'{haftpflicht}','kuestennah',0),
 ('60000000-0000-0000-0000-000000000015',:M,'40000000-0000-0000-0000-000000000010','50000000-0000-0000-0000-000000000019','P-2025-0140','HP','haftpflicht','aktiv',current_date-490,current_date+140,190,3000000,250,38,'{haftpflicht}','kuestennah',0),
 -- gekündigt (ehemaliger Kunde)
 ('60000000-0000-0000-0000-000000000016',:M,'40000000-0000-0000-0000-000000000007','50000000-0000-0000-0000-000000000020','P-2018-0233','KASKO','kasko','gekuendigt',current_date-2600,current_date-150,1640,215000,2500,295,'{kasko,haftpflicht}','nord_ostsee',14),
 -- Seebär: zusätzlicher Rechtsschutz (zeigt Vertragsdichte)
 ('60000000-0000-0000-0000-000000000017',:M,'40000000-0000-0000-0000-000000000002',NULL,'P-2024-0211','RS','rechtsschutz','aktiv',current_date-680,current_date+215,290,NULL,150,73,'{rechtsschutz}','nord_ostsee',0);

UPDATE crm_vertrag_ref SET gekuendigt_von='kunde', kuendigungsgrund='praemie_zu_hoch'
 WHERE id='60000000-0000-0000-0000-000000000016';

-- --- Schäden (Read-Model Schadenmodul) ----------------------------------------
INSERT INTO crm_schaden_ref (id,mandant_id,kunde_id,vertrag_ref_id,boot_ref_id,schadennummer,schadendatum,meldedatum,schadenart,status,schadenhoehe_eur,zahlung_eur,regulierungsdauer_tage,zufriedenheit,beschwerde) VALUES
 ('70000000-0000-0000-0000-000000000001',:M,'40000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000004','S-2025-0088',current_date-410,current_date-408,'Grundberührung','geschlossen',48200,44700,96,2,true),
 ('70000000-0000-0000-0000-000000000002',:M,'40000000-0000-0000-0000-000000000008','60000000-0000-0000-0000-000000000013','50000000-0000-0000-0000-000000000017','S-2026-0031',current_date-60,current_date-59,'Sturmschaden Rigg','geschlossen',12400,12400,28,5,false),
 ('70000000-0000-0000-0000-000000000003',:M,'40000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000008','50000000-0000-0000-0000-000000000012','S-2026-0044',current_date-30,current_date-28,'Maschinenschaden','in_pruefung',18900,NULL,NULL,NULL,false);

-- --- Kampagnen ----------------------------------------------------------------
INSERT INTO crm_kampagne (id,mandant_id,name,externe_id,system,typ,start_am,budget_eur,quelle_id) VALUES
 ('80000000-0000-0000-0000-000000000001',:M,'Saisonstart 2026 — Deckungscheck','brevo-2026-03','brevo','newsletter',current_date-160,450,'26000000-0000-0000-0000-000000000004'),
 ('80000000-0000-0000-0000-000000000002',:M,'Hanseboot Leadstrecke','brevo-2026-06','brevo','nurturing',current_date-60,300,'26000000-0000-0000-0000-000000000010');
