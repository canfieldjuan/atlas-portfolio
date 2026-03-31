#!/usr/bin/env bash
# Atlas B2B Intelligence Pipeline Demo
# Records a clean walkthrough of: system status → scrape → enrichment → results

set -uo pipefail

export PGPASSWORD=atlas1234
DB_ARGS="-h localhost -p 5433 -U atlas -d atlas -t -A"
API="http://127.0.0.1:8000/api/v1"
SCRAPE_TASK="9ba761c1-1f04-4787-93eb-18b4082e1327"

db() { psql $DB_ARGS -c "$1" 2>/dev/null || true; }

latest_task_rows() {
  local task_name="$1"
  db "
    SELECT te.started_at, te.status, coalesce(te.duration_ms, 0), coalesce(te.result_text, '')
    FROM task_executions te
    JOIN scheduled_tasks st ON st.id = te.task_id
    WHERE st.name = '$task_name'
    ORDER BY te.started_at DESC
    LIMIT 25;
  "
}

pick_meaningful_scrape_execution() {
  python3 -c '
import ast
import sys

rows = []
for line in sys.stdin.read().splitlines():
    parts = line.split("|", 3)
    if len(parts) != 4:
        continue
    started_at, status, duration_ms, result_text = [p.strip() for p in parts]
    parsed = {}
    if result_text:
        try:
            parsed = ast.literal_eval(result_text)
        except Exception:
            parsed = {}
    rows.append((started_at, status, duration_ms, parsed, result_text))

def score(row):
    _, _, _, parsed, _ = row
    return (
        int(parsed.get("targets_scraped", 0)),
        int(parsed.get("total_reviews_inserted", 0)),
        int(parsed.get("total_reviews_found", 0)),
    )

meaningful_inserted = [
    row for row in rows
    if row[3].get("targets_scraped", 0) > 0 and row[3].get("total_reviews_inserted", 0) > 0
]
meaningful = [row for row in rows if row[3].get("targets_scraped", 0) > 0]
selected = (
    meaningful_inserted[0]
    if meaningful_inserted else
    (meaningful[0] if meaningful else (rows[0] if rows else None))
)
if not selected:
    sys.exit(0)

started_at, status, duration_ms, parsed, result_text = selected
print(started_at)
print(status)
print(duration_ms)
print(parsed.get("targets_scraped", 0))
print(parsed.get("total_reviews_found", 0))
print(parsed.get("total_reviews_inserted", 0))
print(parsed.get("total_duplicate_or_existing", 0))
print(parsed.get("total_skipped_quality_gate", 0))
results = parsed.get("results") or []
preferred_sources = {
    "g2", "capterra", "trustradius", "peerspot", "gartner",
    "reddit", "getapp", "trustpilot", "hackernews", "quora"
}
results = sorted(
    results,
    key=lambda r: (
        1 if r.get("source") in preferred_sources else 0,
        int(r.get("inserted", 0)),
        int(r.get("found", 0)),
    ),
    reverse=True,
)
for result in results[:3]:
    source = result.get("source", "?")
    vendor = result.get("vendor", "?")
    found = result.get("found", 0)
    inserted = result.get("inserted", 0)
    filtered = result.get("filtered", 0)
    print(f"RESULT\t{source}\t{vendor}\t{found}\t{inserted}\t{filtered}")
'
}

pick_blog_generation_execution() {
  python3 -c '
import ast
import sys

rows = []
for line in sys.stdin.read().splitlines():
    parts = line.split("|", 3)
    if len(parts) != 4:
        continue
    started_at, status, duration_ms, result_text = [p.strip() for p in parts]
    parsed = {}
    if result_text:
        try:
            parsed = ast.literal_eval(result_text)
        except Exception:
            parsed = {}
    rows.append((started_at, status, duration_ms, parsed))

meaningful = []
for row in rows:
    _, _, _, parsed = row
    posts = parsed.get("posts") or []
    count = parsed.get("count", 0)
    if posts or count:
        meaningful.append(row)

selected = meaningful[0] if meaningful else (rows[0] if rows else None)
if not selected:
    sys.exit(0)

started_at, status, duration_ms, parsed = selected
print(started_at)
print(status)
print(duration_ms)
print(parsed.get("count", 0))
for post in (parsed.get("posts") or [])[:3]:
    topic_type = post.get("topic_type", "?")
    slug = post.get("slug", "?")
    charts = post.get("charts", 0)
    print(f"POST\t{topic_type}\t{slug}\t{charts}")
'
}

# ── colors ──────────────────────────────────────────────────
C="\033[36m"   # cyan
G="\033[32m"   # green
Y="\033[33m"   # yellow
W="\033[97m"   # white bold
D="\033[2m"    # dim
R="\033[0m"    # reset
B="\033[1m"    # bold

section() { echo -e "\n${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"; echo -e "${B}${W}  $1${R}"; echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}\n"; }
label()   { echo -e "  ${Y}▸${R} ${B}$1${R}"; }
value()   { echo -e "    ${G}$1${R}"; }
dim()     { echo -e "    ${D}$1${R}"; }
blank()   { echo ""; }

# ── 1. system status ───────────────────────────────────────
section "SYSTEM STATUS"

label "LLM (enrichment model)"
MODEL=$(curl -s http://127.0.0.1:8082/v1/models 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null || echo "unavailable")
value "$MODEL"
blank

label "Database"
COUNTS=$(db "
  SELECT enrichment_status, count(*)
  FROM b2b_reviews
  GROUP BY enrichment_status
  ORDER BY count(*) DESC;
" 2>/dev/null)
echo -e "    ${G}Review counts by enrichment status:${R}"
while IFS='|' read -r status count; do
  status=$(echo "$status" | xargs)
  count=$(echo "$count" | xargs)
  [ -z "$status" ] && continue
  printf "    %-20s %s\n" "$status" "$count"
done <<< "$COUNTS"
blank

label "Active scrape targets (sample)"
TARGETS=$(db "
  SELECT source || ' → ' || vendor_name
  FROM b2b_scrape_targets
  WHERE enabled = true
  ORDER BY random()
  LIMIT 5;
" 2>/dev/null)
while IFS= read -r line; do
  line=$(echo "$line" | xargs)
  [ -z "$line" ] && continue
  dim "$line"
done <<< "$TARGETS"
blank

label "Atlas Brain API"
PING=$(curl -s "$API/ping" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "unavailable")
value "$PING"

sleep 2

# ── 2. recent meaningful scrape execution ─────────────────
section "RECENT MEANINGFUL SCRAPE EXECUTION"

SCRAPE_PICK=$(latest_task_rows "b2b_scrape_intake" | pick_meaningful_scrape_execution)
STARTED=$(echo "$SCRAPE_PICK" | sed -n '1p')
FINAL_STATUS=$(echo "$SCRAPE_PICK" | sed -n '2p')
DURATION_MS=$(echo "$SCRAPE_PICK" | sed -n '3p')
TARGETS_SCRAPED=$(echo "$SCRAPE_PICK" | sed -n '4p')
REVIEWS_FOUND=$(echo "$SCRAPE_PICK" | sed -n '5p')
REVIEWS_INSERTED=$(echo "$SCRAPE_PICK" | sed -n '6p')
DUPLICATES=$(echo "$SCRAPE_PICK" | sed -n '7p')
SKIPPED_QUALITY=$(echo "$SCRAPE_PICK" | sed -n '8p')
if [ -n "$DURATION_MS" ]; then
  DURATION=$(python3 - <<PY
d = int("${DURATION_MS:-0}")
print(f"{d/1000:.1f}s")
PY
)
else
  DURATION="n/a"
fi

label "Task: b2b_scrape_intake"
value "Status: ${FINAL_STATUS:-n/a}  |  Duration: $DURATION  |  Started: ${STARTED:-n/a}"
dim "Selected from the latest scrape runs with real inserted activity"
blank

label "Run summary"
value "Targets scraped: ${TARGETS_SCRAPED:-0}  |  Reviews found: ${REVIEWS_FOUND:-0}  |  Inserted: ${REVIEWS_INSERTED:-0}"
dim "Duplicates/existing: ${DUPLICATES:-0}  |  Skipped by quality gate: ${SKIPPED_QUALITY:-0}"
blank

label "Sample target results"
echo "$SCRAPE_PICK" | awk -F'\t' '/^RESULT\t/ {printf "    \033[2m%s -> %s | found=%s inserted=%s filtered=%s\033[0m\n", $2, $3, $4, $5, $6}'
blank

sleep 2

# ── 4. show what changed ──────────────────────────────────
section "PIPELINE RESULTS"

label "Updated review counts"
COUNTS_AFTER=$(db "
  SELECT enrichment_status, count(*)
  FROM b2b_reviews
  GROUP BY enrichment_status
  ORDER BY count(*) DESC;
" 2>/dev/null)
while IFS='|' read -r status count; do
  status=$(echo "$status" | xargs)
  count=$(echo "$count" | xargs)
  [ -z "$status" ] && continue
  printf "    %-20s %s\n" "$status" "$count"
done <<< "$COUNTS_AFTER"
blank

label "Most recent reviews inserted"
RECENT=$(db "
  SELECT source || ' | ' || vendor_name || ' | ' || left(coalesce(nullif(summary, ''), review_text), 80) || '...'
  FROM b2b_reviews
  WHERE source IN ('g2','capterra','trustradius','peerspot','gartner','reddit')
  ORDER BY imported_at DESC
  LIMIT 5;
" 2>/dev/null)
while IFS= read -r line; do
  line=$(echo "$line" | xargs)
  [ -z "$line" ] && continue
  dim "$line"
done <<< "$RECENT"
blank

label "Most recent enrichments"
ENRICHED=$(db "
  SELECT vendor_name || ' | urgency=' || coalesce((enrichment->>'urgency_score')::text, 'n/a')
       || ' | pains=' || coalesce(
           (SELECT string_agg(p->>'category', ', ')
            FROM jsonb_array_elements(enrichment->'pain_categories') p
            LIMIT 3), 'n/a')
  FROM b2b_reviews
  WHERE enrichment_status = 'enriched'
    AND source IN ('g2','capterra','trustradius','peerspot','gartner','reddit')
  ORDER BY enriched_at DESC
  LIMIT 5;
" 2>/dev/null)
while IFS= read -r line; do
  line=$(echo "$line" | xargs)
  [ -z "$line" ] && continue
  dim "$line"
done <<< "$ENRICHED"
blank

sleep 2

# ── 5b. recent downstream artifact run ────────────────────
section "RECENT GENERATED ARTIFACT"

BLOG_PICK=$(latest_task_rows "b2b_blog_post_generation" | pick_blog_generation_execution)
BLOG_STARTED=$(echo "$BLOG_PICK" | sed -n '1p')
BLOG_STATUS=$(echo "$BLOG_PICK" | sed -n '2p')
BLOG_DURATION_MS=$(echo "$BLOG_PICK" | sed -n '3p')
BLOG_COUNT=$(echo "$BLOG_PICK" | sed -n '4p')
if [ -n "$BLOG_DURATION_MS" ]; then
  BLOG_DURATION=$(python3 - <<PY
d = int("${BLOG_DURATION_MS:-0}")
print(f"{d/1000:.1f}s")
PY
)
else
  BLOG_DURATION="n/a"
fi

label "Task: b2b_blog_post_generation"
value "Status: ${BLOG_STATUS:-n/a}  |  Duration: $BLOG_DURATION  |  Started: ${BLOG_STARTED:-n/a}"
dim "Shows a real downstream asset generated from the intelligence stack"
blank

label "Generated draft count"
value "${BLOG_COUNT:-0} draft(s)"
echo "$BLOG_PICK" | awk -F'\t' '/^POST\t/ {printf "    \033[2m%s | slug=%s | charts=%s\033[0m\n", $2, $3, $4}'
blank

sleep 2

# ── 6. before/after ───────────────────────────────────────
section "BEFORE → AFTER: RAW REVIEW vs ENRICHED"

label "Raw review (input) — just unstructured text"
RAW=$(db "
  SELECT jsonb_build_object(
    'source', source,
    'vendor', vendor_name,
    'rating', rating,
    'summary', summary,
    'reviewer', coalesce(reviewer_title, 'unknown') || ' at ' || coalesce(reviewer_company, 'unknown'),
    'review_text', left(review_text, 280) || '...'
  )::text
  FROM b2b_reviews
  WHERE enrichment_status = 'enriched'
    AND (enrichment->>'urgency_score')::numeric >= 6
    AND source IN ('g2','capterra','trustradius','peerspot','gartner')
    AND jsonb_array_length(coalesce(enrichment->'competitors_mentioned','[]'::jsonb)) > 0
    AND length(review_text) > 200
  ORDER BY (enrichment->>'urgency_score')::numeric DESC
  LIMIT 1;
")
echo "$RAW" | python3 -m json.tool 2>/dev/null | while IFS= read -r line; do
  echo -e "    ${D}$line${R}"
done
blank

label "After LLM enrichment (output) — 47 structured fields extracted"
ENRICHED_DETAIL=$(db "
  SELECT jsonb_build_object(
    'urgency_score', enrichment->'urgency_score',
    'pain_categories', enrichment->'pain_categories',
    'churn_signals', enrichment->'churn_signals',
    'competitors_mentioned', enrichment->'competitors_mentioned',
    'buyer_authority', enrichment->'buyer_authority',
    'timeline', enrichment->'timeline',
    'budget_signals', enrichment->'budget_signals',
    'sentiment_trajectory', enrichment->'sentiment_trajectory',
    'quotable_phrases', enrichment->'quotable_phrases',
    'would_recommend', enrichment->'would_recommend'
  )::text
  FROM b2b_reviews
  WHERE enrichment_status = 'enriched'
    AND (enrichment->>'urgency_score')::numeric >= 6
    AND source IN ('g2','capterra','trustradius','peerspot','gartner')
    AND jsonb_array_length(coalesce(enrichment->'competitors_mentioned','[]'::jsonb)) > 0
    AND length(review_text) > 200
  ORDER BY (enrichment->>'urgency_score')::numeric DESC
  LIMIT 1;
")
echo "$ENRICHED_DETAIL" | python3 -m json.tool 2>/dev/null | while IFS= read -r line; do
  echo -e "    ${G}$line${R}"
done
blank

sleep 2

# ── 7. downstream outputs ────────────────────────────────
section "DOWNSTREAM OUTPUTS (generated from enriched data)"

label "Intelligence reports"
REPORTS=$(db "SELECT count(*) FROM b2b_intelligence;" 2>/dev/null | xargs)
value "$REPORTS reports generated"
dim "Types: weekly_churn_feed, vendor_scorecard, battle_card, displacement_report, challenger_intel"
blank

label "Campaigns"
CAMPAIGNS=$(db "SELECT count(*) FROM b2b_campaigns;" 2>/dev/null | xargs)
CAMP_STATUS=$(db "
  SELECT status || ': ' || count(*)
  FROM b2b_campaigns
  GROUP BY status
  ORDER BY count(*) DESC;
" 2>/dev/null)
value "$CAMPAIGNS campaigns generated"
while IFS= read -r line; do
  line=$(echo "$line" | xargs)
  [ -z "$line" ] && continue
  dim "$line"
done <<< "$CAMP_STATUS"
blank

label "Blog posts"
BLOGS=$(db "SELECT count(*) FROM blog_posts;" 2>/dev/null | xargs)
BLOG_TYPES=$(db "
  SELECT topic_type || ': ' || count(*)
  FROM blog_posts
  GROUP BY topic_type
  ORDER BY count(*) DESC
  LIMIT 5;
" 2>/dev/null)
value "$BLOGS blog posts generated"
while IFS= read -r line; do
  line=$(echo "$line" | xargs)
  [ -z "$line" ] && continue
  dim "$line"
done <<< "$BLOG_TYPES"
blank

label "Evidence vaults"
VAULTS=$(db "SELECT count(*) FROM b2b_evidence_vault;" 2>/dev/null | xargs)
value "$VAULTS canonical evidence vaults"
blank

label "Reasoning synthesis"
SYNTH=$(db "SELECT count(*) FROM b2b_reasoning_synthesis;" 2>/dev/null | xargs)
value "$SYNTH reasoning contracts"
blank

label "Displacement edges"
EDGES=$(db "SELECT count(*) FROM b2b_displacement_edges;" 2>/dev/null | xargs)
value "$EDGES vendor displacement flows tracked"
blank

label "Churn signals"
SIGNALS=$(db "SELECT count(*) FROM b2b_churn_signals;" 2>/dev/null | xargs)
value "$SIGNALS vendor churn signals"

blank
section "DEMO COMPLETE"
echo -e "  ${W}Raw reviews → LLM enrichment → churn signals → evidence pools${R}"
echo -e "  ${W}→ reasoning synthesis → campaigns, blogs, battle cards, reports${R}"
blank
