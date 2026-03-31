#!/usr/bin/env bash
# Atlas B2B Intelligence Pipeline Demo
# Records a clean walkthrough of: system status → scrape → enrichment → results

set -uo pipefail

export PGPASSWORD=atlas1234
DB_ARGS="-h localhost -p 5433 -U atlas -d atlas -t -A"
API="http://127.0.0.1:8000/api/v1"
SCRAPE_TASK="9ba761c1-1f04-4787-93eb-18b4082e1327"

db() { psql $DB_ARGS -c "$1" 2>/dev/null || true; }

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

# ── 2. last scrape execution ─────────────────────────────
section "LATEST SCRAPE EXECUTION"

EXEC_DATA=$(curl -s "$API/autonomous/$SCRAPE_TASK/executions?limit=1" 2>/dev/null)
FINAL_STATUS=$(echo "$EXEC_DATA" | python3 -c "import sys,json; e=json.load(sys.stdin)['executions'][0]; print(e['status'])" 2>/dev/null || echo "n/a")
DURATION=$(echo "$EXEC_DATA" | python3 -c "import sys,json; e=json.load(sys.stdin)['executions'][0]; d=e.get('duration_ms'); print(f'{d/1000:.1f}s' if d else 'n/a')" 2>/dev/null || echo "n/a")
STARTED=$(echo "$EXEC_DATA" | python3 -c "import sys,json; e=json.load(sys.stdin)['executions'][0]; print(e.get('started_at','?')[:19])" 2>/dev/null || echo "n/a")

label "Task: b2b_scrape_intake"
value "Status: $FINAL_STATUS  |  Duration: $DURATION  |  Started: $STARTED"
dim "Scrapes enabled targets → inserts reviews → fires LLM enrichment"
blank

RESULT=$(echo "$EXEC_DATA" | python3 -c "
import sys, json
e = json.load(sys.stdin)['executions'][0]
r = e.get('result_text','')
if r:
    try:
        d = json.loads(r)
        print(json.dumps(d, indent=2)[:600])
    except:
        print(r[:600])
else:
    print('(no result text)')
" 2>/dev/null || echo "(no result)")

label "Execution result"
echo -e "    ${D}$RESULT${R}"
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
  SELECT source || ' | ' || vendor_name || ' | ' || left(summary, 60) || '...'
  FROM b2b_reviews
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

# ── 5. before/after ───────────────────────────────────────
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

# ── 6. downstream outputs ────────────────────────────────
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
