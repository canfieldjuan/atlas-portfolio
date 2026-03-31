#!/usr/bin/env bash
# Curated Atlas portfolio terminal demo

set -uo pipefail

export PGPASSWORD=atlas1234
DB_ARGS="-h localhost -p 5433 -U atlas -d atlas -t -A"

db() { psql $DB_ARGS -c "$1" 2>/dev/null || true; }

C="\033[36m"
G="\033[32m"
Y="\033[33m"
W="\033[97m"
D="\033[2m"
R="\033[0m"
B="\033[1m"

section() { echo -e "\n${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"; echo -e "${B}${W}  $1${R}"; echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}\n"; }
label()   { echo -e "  ${Y}▸${R} ${B}$1${R}"; }
value()   { echo -e "    ${G}$1${R}"; }
dim()     { echo -e "    ${D}$1${R}"; }
blank()   { echo ""; }

sleep_brief() { sleep 1; }

section "ATLAS PORTFOLIO DEMO"
value "One platform turning review data into sales, content, and intelligence workflows"
dim "Curated view: scrape activity -> enriched signal -> campaign -> blog artifact"

sleep_brief

section "SYSTEM SNAPSHOT"

REVIEWS=$(db "SELECT count(*) FROM b2b_reviews;" | xargs)
ENRICHED=$(db "SELECT count(*) FROM b2b_reviews WHERE enrichment_status = 'enriched';" | xargs)
VENDORS=$(db "SELECT count(*) FROM b2b_churn_signals;" | xargs)
TASKS=$(db "SELECT count(*) FROM scheduled_tasks;" | xargs)

label "Core footprint"
value "$REVIEWS raw reviews  |  $ENRICHED enriched  |  $VENDORS vendors with churn signals"
dim "$TASKS scheduled tasks across enrichment, reasoning, campaigns, reports, and publishing"

sleep_brief

section "RECENT LIVE SCRAPE RUN"

SCRAPE=$(db "
  SELECT te.started_at, te.duration_ms, te.result_text
  FROM task_executions te
  JOIN scheduled_tasks st ON st.id = te.task_id
  WHERE st.name = 'b2b_scrape_intake'
    AND coalesce(te.result_text, '') like '%total_reviews_inserted%'
  ORDER BY te.started_at DESC
  LIMIT 1;
")

SCRAPE_SUMMARY=$(printf "%s\n" "$SCRAPE" | python3 -c '
import ast
import sys
line = sys.stdin.read().strip()
parts = line.split("|", 2)
if len(parts) != 3:
    raise SystemExit(0)
started_at, duration_ms, result_text = [p.strip() for p in parts]
parsed = ast.literal_eval(result_text)
print(started_at)
print(duration_ms)
print(parsed.get("targets_scraped", 0))
print(parsed.get("total_reviews_found", 0))
print(parsed.get("total_reviews_inserted", 0))
results = parsed.get("results") or []
preferred = {"g2","capterra","trustradius","peerspot","gartner","reddit","getapp","trustpilot","hackernews","quora","stackoverflow"}
results = sorted(
    results,
    key=lambda r: (
        1 if r.get("source") in preferred else 0,
        int(r.get("inserted", 0)),
        int(r.get("found", 0)),
    ),
    reverse=True,
)
for result in results[:3]:
    print("ROW\t{source}\t{vendor}\t{found}\t{inserted}".format(
        source=result.get("source", "?"),
        vendor=result.get("vendor", "?"),
        found=result.get("found", 0),
        inserted=result.get("inserted", 0),
    ))
')

SCRAPE_STARTED=$(echo "$SCRAPE_SUMMARY" | sed -n '1p')
SCRAPE_DURATION_MS=$(echo "$SCRAPE_SUMMARY" | sed -n '2p')
SCRAPE_TARGETS=$(echo "$SCRAPE_SUMMARY" | sed -n '3p')
SCRAPE_FOUND=$(echo "$SCRAPE_SUMMARY" | sed -n '4p')
SCRAPE_INSERTED=$(echo "$SCRAPE_SUMMARY" | sed -n '5p')
SCRAPE_DURATION=$(python3 - <<PY
d = int("${SCRAPE_DURATION_MS:-0}")
print(f"{d/1000:.1f}s")
PY
)

label "Latest meaningful execution"
value "Started: ${SCRAPE_STARTED:-n/a}  |  Duration: $SCRAPE_DURATION"
value "Targets scraped: ${SCRAPE_TARGETS:-0}  |  Reviews found: ${SCRAPE_FOUND:-0}  |  Inserted: ${SCRAPE_INSERTED:-0}"
blank

label "Sample target results"
echo "$SCRAPE_SUMMARY" | awk -F'\t' '/^ROW\t/ {printf "    \033[2m%s -> %s | found=%s inserted=%s\033[0m\n", $2, $3, $4, $5}'

sleep_brief

section "ENRICHED REVIEW -> STRUCTURED SIGNAL"

REVIEW=$(db "
  SELECT vendor_name,
         source,
         coalesce(nullif(summary, ''), left(review_text, 120)),
         jsonb_build_object(
           'urgency_score', enrichment->'urgency_score',
           'pain_categories', enrichment->'pain_categories',
           'competitors_mentioned', enrichment->'competitors_mentioned',
           'buyer_authority', enrichment->'buyer_authority',
           'churn_signals', enrichment->'churn_signals',
           'quotable_phrases', enrichment->'quotable_phrases'
         )::text
  FROM b2b_reviews
  WHERE enrichment_status = 'enriched'
    AND vendor_name = 'Slack'
    AND source IN ('reddit','g2','capterra','trustradius','peerspot','gartner')
    AND jsonb_array_length(coalesce(enrichment->'competitors_mentioned','[]'::jsonb)) > 0
    AND length(coalesce(review_text, '')) > 120
  ORDER BY (enrichment->>'urgency_score')::numeric DESC NULLS LAST, imported_at DESC
  LIMIT 1;
")

REVIEW_PARSED=$(printf "%s\n" "$REVIEW" | python3 -c '
import sys
line = sys.stdin.read().strip()
parts = line.split("|", 3)
if len(parts) == 4:
    print(parts[0].strip())
    print(parts[1].strip())
    print(parts[2].strip())
    print(parts[3])
')
REVIEW_VENDOR=$(echo "$REVIEW_PARSED" | sed -n '1p')
REVIEW_SOURCE=$(echo "$REVIEW_PARSED" | sed -n '2p')
REVIEW_SUMMARY=$(echo "$REVIEW_PARSED" | sed -n '3p')
REVIEW_JSON=$(echo "$REVIEW_PARSED" | sed -n '4p')

label "Selected example"
value "${REVIEW_VENDOR:-Slack} review from ${REVIEW_SOURCE:-reddit}"
dim "$REVIEW_SUMMARY"
blank

label "Structured signal extracted by the enrichment pipeline"
echo "$REVIEW_JSON" | python3 -m json.tool 2>/dev/null | sed -n '1,28p' | while IFS= read -r line; do
  echo -e "    ${G}$line${R}"
done

sleep_brief

section "CAMPAIGN ARTIFACT"

CAMPAIGN=$(db "
  SELECT company_name,
         vendor_name,
         status,
         opportunity_score,
         urgency_score,
         coalesce(subject, ''),
         left(body, 220),
         coalesce(cta, '')
  FROM b2b_campaigns
  WHERE vendor_name = 'Slack'
  ORDER BY created_at DESC
  LIMIT 1;
")

CAMPAIGN_PARSED=$(printf "%s\n" "$CAMPAIGN" | python3 -c '
import sys
line = sys.stdin.read().strip()
parts = line.split("|", 7)
if len(parts) == 8:
    for item in parts:
        print(item.strip())
')
CAMPAIGN_COMPANY=$(echo "$CAMPAIGN_PARSED" | sed -n '1p')
CAMPAIGN_VENDOR=$(echo "$CAMPAIGN_PARSED" | sed -n '2p')
CAMPAIGN_STATUS=$(echo "$CAMPAIGN_PARSED" | sed -n '3p')
CAMPAIGN_SCORE=$(echo "$CAMPAIGN_PARSED" | sed -n '4p')
CAMPAIGN_URGENCY=$(echo "$CAMPAIGN_PARSED" | sed -n '5p')
CAMPAIGN_SUBJECT=$(echo "$CAMPAIGN_PARSED" | sed -n '6p')
CAMPAIGN_BODY=$(echo "$CAMPAIGN_PARSED" | sed -n '7p')
CAMPAIGN_CTA=$(echo "$CAMPAIGN_PARSED" | sed -n '8p')

label "Latest generated campaign"
value "${CAMPAIGN_VENDOR:-Slack}  |  Status: ${CAMPAIGN_STATUS:-draft}  |  Opportunity score: ${CAMPAIGN_SCORE:-n/a}  |  Urgency: ${CAMPAIGN_URGENCY:-n/a}"
dim "Account: ${CAMPAIGN_COMPANY:-Slack}"
blank

label "Subject"
value "$CAMPAIGN_SUBJECT"
blank

label "Body excerpt"
dim "$CAMPAIGN_BODY"
blank

label "CTA"
value "$CAMPAIGN_CTA"

sleep_brief

section "BLOG ARTIFACT"

BLOG=$(db "
  SELECT topic_type, slug, title
  FROM blog_posts
  ORDER BY created_at DESC
  LIMIT 1;
")

BLOG_PARSED=$(printf "%s\n" "$BLOG" | python3 -c '
import sys
line = sys.stdin.read().strip()
parts = line.split("|", 2)
if len(parts) == 3:
    for item in parts:
        print(item.strip())
')
BLOG_TYPE=$(echo "$BLOG_PARSED" | sed -n '1p')
BLOG_SLUG=$(echo "$BLOG_PARSED" | sed -n '2p')
BLOG_TITLE=$(echo "$BLOG_PARSED" | sed -n '3p')

label "Latest generated blog draft"
value "${BLOG_TYPE:-unknown}  |  slug=${BLOG_SLUG:-n/a}"
dim "$BLOG_TITLE"

sleep_brief

section "WHY THIS MATTERS"
dim "One evidence pipeline feeds multiple outputs:"
value "research -> churn intelligence -> campaign generation -> blog content -> reports"
dim "This is the part I want the portfolio to show clearly: AI as an operator inside a system, not just AI as a prompt."

blank
section "DEMO COMPLETE"
echo -e "  ${W}Atlas turns live review data into structured churn signals${R}"
echo -e "  ${W}then reuses that intelligence across sales, content, and reporting workflows${R}"
