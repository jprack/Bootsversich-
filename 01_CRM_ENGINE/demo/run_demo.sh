#!/usr/bin/env bash
# =============================================================================
#  01_CRM_ENGINE — Demo aufsetzen, Engine laufen lassen, Testsuite prüfen
#
#  Zwei Betriebsarten:
#
#  A) EIGENE DATENBANK (empfohlen, läuft überall)
#     Sie geben eine erreichbare PostgreSQL-Datenbank an, das Skript spielt
#     Schema, Demodaten und Engine hinein.
#
#       ./run_demo.sh --db "postgresql://benutzer:passwort@localhost:5432/crmdemo"
#
#     Die Datenbank muss existieren und leer sein. Schnellster Weg mit Docker:
#       docker run --name crmdemo -e POSTGRES_PASSWORD=geheim -e POSTGRES_DB=crmdemo \
#              -p 5432:5432 -d postgres:16
#       ./run_demo.sh --db "postgresql://postgres:geheim@localhost:5432/crmdemo"
#
#  B) TEMPORÄRE INSTANZ (ohne vorhandene Datenbank)
#     Das Skript legt selbst einen kurzlebigen PostgreSQL-Cluster an.
#     Voraussetzung: initdb und pg_ctl sind installiert und im PATH oder unter
#     einem der üblichen Pfade auffindbar. Nicht als root ausführen — initdb
#     verweigert das (im Container weicht das Skript auf den Benutzer postgres aus).
#
#       ./run_demo.sh                # Port 55432, Instanz bleibt danach offen
#       ./run_demo.sh 55555          # abweichender Port
#       ./run_demo.sh --stop         # Instanz nach dem Lauf beenden
#
#  Weitere Schalter:
#       --last                       zusätzlich den Lasttest ausführen
#                                    (5.009 Leads, 2.010 Kunden — dauert ~1 Minute)
# =============================================================================
set -euo pipefail

PORT=55432
STOP_NACH_LAUF=0
MIT_LASTTEST=0
DB_URL=""

while [ $# -gt 0 ]; do
  case "$1" in
    --db)    DB_URL="${2:-}"; shift 2 ;;
    --stop)  STOP_NACH_LAUF=1; shift ;;
    --last)  MIT_LASTTEST=1; shift ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *[0-9]*) PORT="$1"; shift ;;
    *) echo "Unbekannter Schalter: $1"; exit 1 ;;
  esac
done

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA="$HIER/../schema/crm_schema.sql"
ENGINE="$HIER/../schema/crm_engine.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql wurde nicht gefunden. Bitte PostgreSQL-Clientwerkzeuge installieren:"
  echo "  macOS:          brew install postgresql@16"
  echo "  Debian/Ubuntu:  sudo apt install postgresql-client-16"
  exit 1
fi

# -----------------------------------------------------------------------------
#  Betriebsart A: vorhandene Datenbank
# -----------------------------------------------------------------------------
if [ -n "$DB_URL" ]; then
  echo "==> Vorhandene Datenbank verwenden"
  PSQL_BASIS=(psql "$DB_URL")
  if ! "${PSQL_BASIS[@]}" -qAt -c "SELECT 1" >/dev/null 2>&1; then
    echo "Verbindung fehlgeschlagen. Bitte die Angabe hinter --db prüfen."
    exit 1
  fi
  BELEGT="$("${PSQL_BASIS[@]}" -qAt -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'crm\_%'")"
  if [ "$BELEGT" != "0" ]; then
    echo "In dieser Datenbank existieren bereits $BELEGT crm_-Tabellen."
    echo "Bitte eine leere Datenbank verwenden oder das Schema vorher entfernen:"
    echo "  psql \"$DB_URL\" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'"
    exit 1
  fi
  ENDHINWEIS="Datenbank bleibt bestehen. Weiterarbeiten:  psql \"$DB_URL\""

# -----------------------------------------------------------------------------
#  Betriebsart B: temporäre Instanz
# -----------------------------------------------------------------------------
else
  # Binärverzeichnis suchen: PATH, pg_config, übliche Installationspfade
  PGBIN=""
  if command -v initdb >/dev/null 2>&1; then
    PGBIN="$(dirname "$(command -v initdb)")"
  elif command -v pg_config >/dev/null 2>&1 && [ -x "$(pg_config --bindir)/initdb" ]; then
    PGBIN="$(pg_config --bindir)"
  else
    for KANDIDAT in /usr/lib/postgresql/*/bin /usr/local/opt/postgresql*/bin \
                    /opt/homebrew/opt/postgresql*/bin /Library/PostgreSQL/*/bin \
                    /usr/pgsql-*/bin; do
      [ -x "$KANDIDAT/initdb" ] && PGBIN="$KANDIDAT"
    done
  fi
  if [ -z "$PGBIN" ]; then
    echo "initdb wurde nicht gefunden. Entweder PostgreSQL installieren"
    echo "  (macOS: brew install postgresql@16 · Debian/Ubuntu: sudo apt install postgresql-16)"
    echo "oder eine vorhandene Datenbank angeben:"
    echo "  ./run_demo.sh --db \"postgresql://benutzer:passwort@localhost:5432/crmdemo\""
    exit 1
  fi

  DATA="${PGDATA_DEMO:-${TMPDIR:-/tmp}/callidus-crmdemo}"
  SOCKET="${TMPDIR:-/tmp}"

  # initdb verweigert die Ausführung als root. Im Container gibt es den Benutzer
  # postgres — dort wird darauf gewechselt, sonst bricht das Skript ab.
  ALS=""
  if [ "$(id -u)" = "0" ]; then
    if id -u postgres >/dev/null 2>&1; then
      ALS="postgres"
      DATA="${PGDATA_DEMO:-/var/lib/postgresql/crmdemo}"
    else
      echo "Bitte nicht als root ausführen — initdb lehnt das ab."
      exit 1
    fi
  fi
  fuehre_aus(){ if [ -n "$ALS" ]; then su "$ALS" -c "$1"; else eval "$1"; fi; }

  echo "==> Temporäre Instanz auf Port $PORT vorbereiten"
  if [ -f "$DATA/postmaster.pid" ]; then
    echo "    vorherige Instanz gefunden, wird beendet"
    fuehre_aus "$PGBIN/pg_ctl -D '$DATA' -m immediate stop" >/dev/null 2>&1 || true
    sleep 1
  fi
  pkill -f "bin/postgres -D $DATA" >/dev/null 2>&1 || true
  rm -f "$SOCKET/.s.PGSQL.$PORT" "$SOCKET/.s.PGSQL.$PORT.lock"
  rm -rf "$DATA"; mkdir -p "$DATA"
  [ -n "$ALS" ] && chown "$ALS" "$DATA"
  fuehre_aus "$PGBIN/initdb -D '$DATA' -U crm --auth=trust" >/dev/null
  fuehre_aus "$PGBIN/pg_ctl -D '$DATA' -o '-k $SOCKET -p $PORT -c listen_addresses=' -l '$SOCKET/crmdemo.log' start" >/dev/null

  aufraeumen(){ [ "${LAUF_FERTIG:-0}" = "1" ] && [ "$STOP_NACH_LAUF" = "0" ] && return 0
                fuehre_aus "$PGBIN/pg_ctl -D '$DATA' stop" >/dev/null 2>&1 || true; }
  trap aufraeumen EXIT

  psql -h "$SOCKET" -p "$PORT" -U crm -d postgres -qc "CREATE DATABASE crmdemo;"
  PSQL_BASIS=(psql -h "$SOCKET" -p "$PORT" -U crm -d crmdemo)
  ENDHINWEIS="Instanz läuft weiter auf Port $PORT.
  Weiterarbeiten:  psql -h $SOCKET -p $PORT -U crm -d crmdemo
  Beenden:         $PGBIN/pg_ctl -D $DATA stop"
fi

PSQL=("${PSQL_BASIS[@]}" -v ON_ERROR_STOP=1 -q)

echo "==> Schema"                 && "${PSQL[@]}" -f "$SCHEMA"
echo "==> Engine (Fassung 1.3)"   && "${PSQL[@]}" -f "$ENGINE"
echo "==> Demodaten (Stammdaten)" && "${PSQL[@]}" -f "$HIER/00_seed.sql"
echo "==> Demodaten (Vertrieb)"   && "${PSQL[@]}" -f "$HIER/01_seed_vertrieb.sql"
echo "==> Regelkatalog"           && "${PSQL[@]}" -c \
     "SELECT crm_fn_regelkatalog_anlegen('11111111-0000-0000-0000-000000000001');"

echo
echo "==> Nachtlauf der Engine"
"${PSQL_BASIS[@]}" -P pager=off -c \
  "SELECT * FROM crm_fn_engine_lauf('11111111-0000-0000-0000-000000000001');"

echo
echo "==> Tagesliste Marc Sanders (Next Best Actions)"
"${PSQL_BASIS[@]}" -P pager=off -P border=2 -c "
SELECT row_number() OVER (ORDER BY prioritaets_score DESC, faellig_am) AS rang,
       left(titel,50) AS aufgabe, regel_code AS regel, prioritaets_score AS score,
       CASE WHEN faellig_am<now() THEN 'überfällig' ELSE to_char(faellig_am,'DD.MM. HH24:MI') END AS faellig,
       coalesce(to_char(erwarteter_wert_eur,'FM999G999')||' €','—') AS wert
FROM vw_crm_next_best_action WHERE benutzer_id='22222222-0000-0000-0000-000000000001'
ORDER BY prioritaets_score DESC, faellig_am LIMIT 10;"

if [ "$MIT_LASTTEST" = "1" ]; then
  echo
  echo "==> Lasttest (5.009 Leads, 2.010 Kunden)"
  "${PSQL_BASIS[@]}" -P pager=off -P border=2 -q -v ON_ERROR_STOP=1 -f "$HIER/07_lasttest.sql"
fi

echo
echo "==> Testsuite"
"${PSQL_BASIS[@]}" -P pager=off -P border=2 -q -f "$HIER/04_pruefungen.sql"

LAUF_FERTIG=1
echo
if [ -z "$DB_URL" ] && [ "$STOP_NACH_LAUF" = "1" ]; then
  fuehre_aus "$PGBIN/pg_ctl -D '$DATA' stop" >/dev/null 2>&1 || true
  echo "Fertig. Die Instanz wurde beendet."
else
  echo "Fertig. $ENDHINWEIS"
fi
