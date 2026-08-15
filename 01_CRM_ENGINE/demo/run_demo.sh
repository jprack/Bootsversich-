#!/usr/bin/env bash
# =============================================================================
#  01_CRM_ENGINE — Demo von Grund auf aufsetzen und prüfen
#
#  Legt eine temporäre PostgreSQL-Instanz an, rollt Schema, Demodaten und
#  Engine aus, führt einen Nachtlauf durch und lässt die Testsuite laufen.
#
#  Aufruf:  ./run_demo.sh [PORT] [--stop]
#           PORT    Standardport 55432
#           --stop  Instanz nach dem Lauf beenden. Ohne diesen Schalter bleibt
#                   sie geoeffnet, damit man mit psql weiterarbeiten kann.
# =============================================================================
set -euo pipefail

STOP_NACH_LAUF=0
PORT=55432
for arg in "$@"; do
  case "$arg" in
    --stop) STOP_NACH_LAUF=1 ;;
    *[0-9]*) PORT="$arg" ;;
  esac
done
HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA="$HIER/../schema/crm_schema.sql"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)"
DATA="${PGDATA_DEMO:-/var/lib/postgresql/crmdemo}"

if [ -z "$PGBIN" ]; then echo "PostgreSQL-Binärverzeichnis nicht gefunden."; exit 1; fi

echo "==> Temporäre Instanz auf Port $PORT vorbereiten"
# Eine aus einem früheren Lauf noch offene Instanz sauber beenden, bevor das
# Datenverzeichnis gelöscht wird — sonst läuft ein Server ohne Datenverzeichnis weiter.
if [ -f "$DATA/postmaster.pid" ]; then
  echo "    vorherige Instanz gefunden, wird beendet"
  su postgres -c "$PGBIN/pg_ctl -D $DATA -m immediate stop" >/dev/null 2>&1 || true
  sleep 1
fi
pkill -f "bin/postgres -D $DATA" >/dev/null 2>&1 || true
rm -f "/tmp/.s.PGSQL.$PORT" "/tmp/.s.PGSQL.$PORT.lock"
rm -rf "$DATA"; mkdir -p "$DATA"; chown postgres "$DATA" 2>/dev/null || true
su postgres -c "$PGBIN/initdb -D $DATA -U crm --auth=trust" >/dev/null
su postgres -c "$PGBIN/pg_ctl -D $DATA -o '-k /tmp -p $PORT -c listen_addresses=' -l /tmp/pgdemo.log start" >/dev/null
# Bei Abbruch oder Fehler aufraeumen; bei Erfolg entscheidet --stop (siehe Ende)
aufraeumen(){ [ "${LAUF_FERTIG:-0}" = "1" ] && [ "$STOP_NACH_LAUF" = "0" ] && return 0
              su postgres -c "$PGBIN/pg_ctl -D $DATA stop" >/dev/null 2>&1 || true; }
trap aufraeumen EXIT

PSQL="psql -h /tmp -p $PORT -U crm -d crmdemo -v ON_ERROR_STOP=1 -q"
psql -h /tmp -p "$PORT" -U crm -d postgres -qc "CREATE DATABASE crmdemo;"

echo "==> Schema"                 && $PSQL -f "$SCHEMA"
echo "==> Demodaten (Stammdaten)" && $PSQL -f "$HIER/00_seed.sql"
echo "==> Demodaten (Vertrieb)"   && $PSQL -f "$HIER/01_seed_vertrieb.sql"
echo "==> Engine"                 && $PSQL -f "$HIER/02_engine.sql"
echo "==> Regelwerk"              && $PSQL -f "$HIER/03_regelwerk.sql"
echo "==> Kalibrierung 1.1"       && $PSQL -f "$HIER/05_kalibrierung_v11.sql"
echo "==> Kalibrierung 1.2"       && $PSQL -f "$HIER/06_kalibrierung_v12.sql"
echo "==> Lastschutz"            && $PSQL -f "$HIER/08_lastschutz.sql"
echo "==> Fassung 1.3"           && $PSQL -f "$HIER/09_fixes_v13.sql"
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

LAUF_FERTIG=1
echo
if [ "$STOP_NACH_LAUF" = "1" ]; then
  su postgres -c "$PGBIN/pg_ctl -D $DATA stop" >/dev/null 2>&1 || true
  echo "Fertig. Die Instanz wurde beendet."
else
  echo "Fertig. Die Instanz laeuft weiter auf Port $PORT."
  echo "  Weiterarbeiten:  psql -h /tmp -p $PORT -U crm -d crmdemo"
  echo "  Beenden:         su postgres -c \"$PGBIN/pg_ctl -D $DATA stop\""
fi
