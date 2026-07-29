#!/usr/bin/env bash
#
# jump-day.sh — flytt spillet til dag 1/2/3/4 (for testing), eller tilbake til
# de ekte lansering-datoene. Endrer KUN public.case_config (release/closes/
# results). Rører ALDRI stemmer, stories eller romanse-data.
#
# Hvordan det virker: all tidslås i appen bestemmes server-side av case_config.
# «Å hoppe til dag N» = sette datoene slik at NÅ havner midt i dag N sitt vindu
# (dag 1..N åpne, dag <N sine resultater avslørt, dag N åpen og ikke avslørt).
#
# Bruk:
#   ./scripts/jump-day.sh 1      # spillet står i dag 1
#   ./scripts/jump-day.sh 2      # dag 2 (dag 1 resultater avslørt)
#   ./scripts/jump-day.sh 3      # dag 3
#   ./scripts/jump-day.sh 4      # dag 4 (fasit)
#   ./scripts/jump-day.sh reset  # tilbake til ekte datoer (31.7–2.8 2026)
#   ./scripts/jump-day.sh 3 --print   # bare skriv ut SQL-en (ikke kjør)
#
# Tilkobling: sett SUPABASE_DB_URL til connection string-en fra Supabase
# (Dashboard → Project Settings → Database → Connection string → URI, bytt ut
# [YOUR-PASSWORD]). Kan ligge i .env i repo-roten. Uten psql/URL skrives SQL-en
# bare ut, klar til å limes inn i SQL Editor.

set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-}"
FLAG="${2:-}"

if [[ ! "$MODE" =~ ^(1|2|3|4|reset)$ ]]; then
  echo "Bruk: $0 <1|2|3|4|reset> [--print]" >&2
  exit 1
fi

# Hent SUPABASE_DB_URL fra miljø eller .env (uten å eksponere resten av .env).
if [[ -z "${SUPABASE_DB_URL:-}" && -f .env ]]; then
  SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .env | tail -1 | cut -d= -f2- | tr -d '"'"'"'' || true)"
fi

# Bygg SQL-en --------------------------------------------------------------
if [[ "$MODE" == "reset" ]]; then
  SQL=$(cat <<'SQL'
-- Tilbake til de ekte lanseringsdatoene (jf. 0001_init.sql)
update public.case_config set release_at = timestamptz '2020-01-01 00:00 Europe/Oslo',
       closes_at = timestamptz '2026-07-31 09:00 Europe/Oslo', results_at = timestamptz '2026-07-31 09:00 Europe/Oslo' where day = 1;
update public.case_config set release_at = timestamptz '2026-07-31 09:00 Europe/Oslo',
       closes_at = timestamptz '2026-08-01 09:00 Europe/Oslo', results_at = timestamptz '2026-08-01 09:00 Europe/Oslo' where day = 2;
update public.case_config set release_at = timestamptz '2026-08-01 09:00 Europe/Oslo',
       closes_at = timestamptz '2026-08-02 09:00 Europe/Oslo', results_at = timestamptz '2026-08-02 09:00 Europe/Oslo' where day = 3;
update public.case_config set release_at = timestamptz '2026-08-02 09:00 Europe/Oslo',
       closes_at = null,                                      results_at = timestamptz '2026-08-02 09:00 Europe/Oslo' where day = 4;
SQL
)
else
  N="$MODE"
  # release(d) = nå + ((d - N)*60 - 30) minutter → dag N åpnet for 30 min siden,
  # dag N+1 om 30 min. Timestamps som absolutt UTC-instant (kolonnen er timestamptz).
  iso() { date -u -d "$1 minutes" +%Y-%m-%dT%H:%M:%SZ; }
  R1=$(iso $(( (1 - N) * 60 - 30 )))
  R2=$(iso $(( (2 - N) * 60 - 30 )))
  R3=$(iso $(( (3 - N) * 60 - 30 )))
  R4=$(iso $(( (4 - N) * 60 - 30 )))
  # results/closes(d) = release(d+1); dag 4 har ingen closes, results = egen release.
  SQL=$(cat <<SQL
-- Hopp til dag $N (test) — NÅ ligger midt i dag $N sitt vindu
update public.case_config set release_at = '$R1', closes_at = '$R2', results_at = '$R2' where day = 1;
update public.case_config set release_at = '$R2', closes_at = '$R3', results_at = '$R3' where day = 2;
update public.case_config set release_at = '$R3', closes_at = '$R4', results_at = '$R4' where day = 3;
update public.case_config set release_at = '$R4', closes_at = null,   results_at = '$R4' where day = 4;
SQL
)
fi

# Kjør eller skriv ut ------------------------------------------------------
if [[ "$FLAG" == "--print" || -z "${SUPABASE_DB_URL:-}" ]]; then
  if [[ -z "${SUPABASE_DB_URL:-}" && "$FLAG" != "--print" ]]; then
    echo "⚠  Fant ingen SUPABASE_DB_URL — skriver ut SQL-en (lim inn i SQL Editor):" >&2
    echo >&2
  fi
  echo "$SQL"
  exit 0
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "⚠  psql er ikke installert. Kjør på nytt med --print og lim inn i SQL Editor." >&2
  echo "$SQL"
  exit 1
fi

echo "$SQL" | psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 >/dev/null
if [[ "$MODE" == "reset" ]]; then
  echo "✓ case_config satt tilbake til ekte lanseringsdatoer."
else
  echo "✓ Hoppet til dag $MODE."
fi
