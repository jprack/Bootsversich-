#!/usr/bin/env bash
# =============================================================================
#  01_CRM_ENGINE — Demo von Grund auf aufsetzen und prüfen
#
#  Legt eine temporäre PostgreSQL-Instanz an, rollt Schema, Demodaten und
#  Engine aus, führt einen Nachtlauf durch und lässt die Testsuite laufen.
#
#  Aufruf:  ./run_demo.sh [PORT]     (Standardport 55432)
# =============================================================================
set -euo pipefail

PORT="${1:-55432}"
HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA="$HIER/../schema/crm_schema.sql"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)"
DATA="${PGDATA_DEMO:-/var/lib/postgresql/crmdemo}"

if [ -z "$PGBIN" ]; then echo "PostgreSQL-Binärverzeichnis nicht gefunden."; exit 1; fi

echo "==> Temporäre Instanz auf Port $PORT vorbereiten"
rm -rf "$DATA"; mkdir -p "$DATA"; chown postgres "$DATA" 2>/dev/null || true
su postgres -c "$PGBIN/initdb -D $DATA -U crm --auth=trust" >/dev/null
su postgres -c "$PGBIN/pg_ctl -D $DATA -o '-k /tmp -p $PORT -c listen_addresses=' -l /tmp/pgdemo.log start" >/dev/null
trap 'su postgres -c "$PGBIN/pg_ctl -D $DATA stop" >/dev/null 2>&1 || true' EXIT

PSQL="psql -h /tmp -p $PORT -U crm -d crmdemo -v ON_ERROR_STOP=1 -q"
psql -h /tmp -p "$PORT" -U crm -d postgres -qc "CREATE DATABASE crmdemo;"

echo "==> Schema"                 && $PSQL -f "$SCHEMA"
echo "==> Demodaten (Stammdaten)" && $PSQL -f "$HIER/00_seed.sql"
echo "==> Demodaten (Vertrieb)"   && $PSQL -f "$HIER/01_seed_vertrieb.sql"
echo "==> Engine"                 && $PSQL -f "$HIER/02_engine.sql"
echo "==> Regelwerk"              && $PSQL -f "$HIER/03_regelwerk.sql"
echo "==> Kalibrierung 1.1"       && $PSQL -f "$HIER/05_kalibrierung_v11.sql"
psql -h /tmp -p "$PORT" -U crm -d crmdemo -qAt -c \
  "SELECT 'DROP FUNCTION '||oid::regprocedure||';' FROM pg_proc WHERE proname='crm_fn_aufgabe' AND pronargs=14;" \
  | psql -h /tmp -p "$PORT" -U crm -d crmdemo -q

echo
echo "==> Nachtlauf der Engine"
psql -h /tmp -p "$PORT" -U crm -d crmdemo -P pager=off \
  -c "SELECT * FROM crm_fn_engine_lauf('11111111-0000-0000-0000-000000000001');"

echo
echo "==> Tagesliste Marc Sanders (Next Best Actions)"
psql -h /tmp -p "$PORT" -U crm -d crmdemo -P pager=off -P border=2 -c "
SELECT row_number() OVER (ORDER BY prioritaets_score DESC, faellig_am) AS rang,
       left(titel,50) AS aufgabe, regel_code AS regel, prioritaets_score AS score,
       CASE WHEN faellig_am<now() THEN 'überfällig' ELSE to_char(faellig_am,'DD.MM. HH24:MI') END AS faellig,
       coalesce(to_char(erwarteter_wert_eur,'FM999G999')||' €','—') AS wert
FROM vw_crm_next_best_action WHERE benutzer_id='22222222-0000-0000-0000-000000000001'
ORDER BY prioritaets_score DESC, faellig_am LIMIT 10;"

echo
echo "==> Testsuite"
psql -h /tmp -p "$PORT" -U crm -d crmdemo -P pager=off -P border=2 -q -f "$HIER/04_pruefungen.sql"

echo
echo "Fertig. Die Instanz wird beim Verlassen des Skripts wieder gestoppt."
echo "Zum Weiterarbeiten:  psql -h /tmp -p $PORT -U crm -d crmdemo"
