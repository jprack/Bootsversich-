#!/usr/bin/env bash
# =============================================================================
#  03_LEAD_GENERATION_ENGINE — Pruefstand aufsetzen und Testsuite laufen lassen
#
#  A) EIGENE DATENBANK
#       ./run_demo.sh --db "postgresql://benutzer:passwort@localhost:5432/leaddemo"
#     Die Datenbank muss existieren und leer sein.
#
#  B) TEMPORAERE INSTANZ (ohne vorhandene Datenbank)
#       ./run_demo.sh                # Port 55433, Instanz bleibt danach offen
#       ./run_demo.sh 55555          # abweichender Port
#       ./run_demo.sh --stop         # Instanz nach dem Lauf beenden
#
#  Alle Demodaten sind erfunden. Keine realen Organisationen, keine realen
#  Personen, keine realen Domains (durchgaengig .example nach RFC 2606).
# =============================================================================
set -euo pipefail

PORT=55433
STOP_NACH_LAUF=0
DB_URL=""

while [ $# -gt 0 ]; do
  case "$1" in
    --db)   DB_URL="${2:-}"; shift 2 ;;
    --stop) STOP_NACH_LAUF=1; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *[0-9]*) PORT="$1"; shift ;;
    *) echo "Unbekannter Schalter: $1"; exit 1 ;;
  esac
done

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA="$HIER/../schema/lead_schema.sql"
ENGINE="$HIER/../schema/lead_engine.sql"

command -v psql >/dev/null 2>&1 || {
  echo "psql wurde nicht gefunden. PostgreSQL-Clientwerkzeuge installieren:"
  echo "  Debian/Ubuntu:  sudo apt install postgresql-client-16"
  echo "  macOS:          brew install postgresql@16"; exit 1; }

if [ -n "$DB_URL" ]; then
  echo "==> Vorhandene Datenbank verwenden"
  PSQL_BASIS=(psql "$DB_URL")
  "${PSQL_BASIS[@]}" -qAt -c "SELECT 1" >/dev/null 2>&1 || {
    echo "Verbindung fehlgeschlagen. Bitte die Angabe hinter --db pruefen."; exit 1; }
  BELEGT="$("${PSQL_BASIS[@]}" -qAt -c \
    "SELECT count(*) FROM information_schema.tables
      WHERE table_schema='public' AND table_name LIKE 'lg\_%'")"
  [ "$BELEGT" = "0" ] || {
    echo "In dieser Datenbank existieren bereits $BELEGT lg_-Tabellen."
    echo "Bitte eine leere Datenbank verwenden."; exit 1; }
  ENDHINWEIS="Datenbank bleibt bestehen. Weiterarbeiten:  psql \"$DB_URL\""
else
  PGBIN=""
  if command -v initdb >/dev/null 2>&1; then PGBIN="$(dirname "$(command -v initdb)")"
  elif command -v pg_config >/dev/null 2>&1 && [ -x "$(pg_config --bindir)/initdb" ]; then
    PGBIN="$(pg_config --bindir)"
  else
    for K in /usr/lib/postgresql/*/bin /usr/local/opt/postgresql*/bin \
             /opt/homebrew/opt/postgresql*/bin /usr/pgsql-*/bin; do
      [ -x "$K/initdb" ] && PGBIN="$K"
    done
  fi
  [ -n "$PGBIN" ] || { echo "initdb nicht gefunden — PostgreSQL installieren oder --db verwenden."; exit 1; }

  DATA="${PGDATA_DEMO:-${TMPDIR:-/tmp}/callidus-leaddemo}"
  SOCKET="${TMPDIR:-/tmp}"
  ALS=""
  if [ "$(id -u)" = "0" ]; then
    if id -u postgres >/dev/null 2>&1; then
      ALS="postgres"; DATA="${PGDATA_DEMO:-/var/lib/postgresql/leaddemo}"
    else echo "Bitte nicht als root ausfuehren — initdb lehnt das ab."; exit 1; fi
  fi
  fuehre_aus(){ if [ -n "$ALS" ]; then su "$ALS" -c "$1"; else eval "$1"; fi; }

  echo "==> Temporaere Instanz auf Port $PORT vorbereiten"
  [ -f "$DATA/postmaster.pid" ] && fuehre_aus "$PGBIN/pg_ctl -D '$DATA' -m immediate stop" >/dev/null 2>&1 || true
  rm -f "$SOCKET/.s.PGSQL.$PORT" "$SOCKET/.s.PGSQL.$PORT.lock"
  rm -rf "$DATA"; mkdir -p "$DATA"; [ -n "$ALS" ] && chown "$ALS" "$DATA"
  fuehre_aus "$PGBIN/initdb -D '$DATA' -U crm --auth=trust" >/dev/null
  fuehre_aus "$PGBIN/pg_ctl -D '$DATA' -o '-k $SOCKET -p $PORT -c listen_addresses=' -l '$SOCKET/leaddemo.log' start" >/dev/null

  aufraeumen(){ [ "${LAUF_FERTIG:-0}" = "1" ] && [ "$STOP_NACH_LAUF" = "0" ] && return 0
                fuehre_aus "$PGBIN/pg_ctl -D '$DATA' stop" >/dev/null 2>&1 || true; }
  trap aufraeumen EXIT

  psql -h "$SOCKET" -p "$PORT" -U crm -d postgres -qc "CREATE DATABASE leaddemo;"
  PSQL_BASIS=(psql -h "$SOCKET" -p "$PORT" -U crm -d leaddemo)
  ENDHINWEIS="Instanz laeuft weiter auf Port $PORT.
  Weiterarbeiten:  psql -h $SOCKET -p $PORT -U crm -d leaddemo
  Beenden:         $PGBIN/pg_ctl -D $DATA stop"
fi

PSQL=("${PSQL_BASIS[@]}" -v ON_ERROR_STOP=1 -q)

echo "==> Erweiterung"      && "${PSQL[@]}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
echo "==> Schema"           && "${PSQL[@]}" -f "$SCHEMA"
echo "==> Engine"           && "${PSQL[@]}" -f "$ENGINE"
echo "==> Stammdaten"       && "${PSQL[@]}" -f "$HIER/00_seed.sql"
echo "==> Rechercheläufe"   && "${PSQL[@]}" -f "$HIER/01_lauf.sql" >/dev/null

echo
echo "==> Quellenbilanz"
"${PSQL_BASIS[@]}" -P pager=off -P border=2 -c "
SELECT bezeichnung, erlaubnis, gefunden, neu, bekannt, gesperrt FROM vw_lg_quellenbilanz
ORDER BY gefunden DESC;"

echo
echo "==> Prüfliste (was auf eine Entscheidung wartet)"
"${PSQL_BASIS[@]}" -P pager=off -P border=2 -c "
SELECT objektnummer AS nr, left(name_roh,32) AS name, untergruppe, revier,
       basiswert AS score, klasse AS kl,
       coalesce(potenzialwert::text,'—') AS potenzial,
       vorschlaege_offen AS dubl, hoechste_kennzahl AS kennz
FROM vw_lg_pruefliste;"

echo
echo "==> Testsuite"
"${PSQL_BASIS[@]}" -P pager=off -P border=2 -q -f "$HIER/02_pruefungen.sql"

echo
echo "==> Abdeckungsgrad nach dem Lauf"
"${PSQL_BASIS[@]}" -P pager=off -P border=2 -c "
SELECT land, zielgruppe, grundgesamtheit AS nenner, nenner_stand, beurteilt,
       freigegeben, abdeckung_prozent AS prozent
FROM vw_lg_abdeckung ORDER BY zielgruppe;"

echo
echo "==> Tagesliste"
"${PSQL_BASIS[@]}" -P pager=off -P border=2 -c "
SELECT a.regel_code AS regel, left(a.titel,52) AS aufgabe, a.prioritaet AS prio,
       a.faellig_am AS faellig
FROM lg_aufgabe a WHERE a.erledigt_am IS NULL
ORDER BY CASE a.prioritaet WHEN 'DRINGEND' THEN 0 WHEN 'HOCH' THEN 1
                           WHEN 'NORMAL' THEN 2 ELSE 3 END, a.faellig_am;"

LAUF_FERTIG=1
echo
if [ -z "$DB_URL" ] && [ "$STOP_NACH_LAUF" = "1" ]; then
  fuehre_aus "$PGBIN/pg_ctl -D '$DATA' stop" >/dev/null 2>&1 || true
  echo "Fertig. Die Instanz wurde beendet."
else
  echo "Fertig. $ENDHINWEIS"
fi
