# ChainIT Application Answers

---

## Q1: Please provide examples of AI workflows, automations, or agents you've built

I built Atlas -- a full-stack AI platform that automates B2B sales intelligence, marketing content generation, and internal operations. A few highlights:

**B2B Intelligence Pipeline**: Atlas scrapes reviews from 16 sources (G2, Capterra, TrustRadius, Reddit, Twitter/X, etc.), enriches each review with an LLM to extract 47 structured fields (churn intent, urgency score, pain categories, competitor mentions, buying stage, budget signals), then aggregates into vendor-level churn signals. From there, the system auto-generates personalized sales campaigns, competitive battle cards with talk tracks and objection handlers, and SEO blog posts -- all grounded in real customer evidence. Campaign scoring is calibrated from actual CRM outcomes (deal won/lost) via a closed-loop feedback system. 38,000+ reviews enriched, 2,100+ intelligence reports generated.

**Autonomous Task Orchestration**: 57 scheduled tasks run on cron/interval triggers -- review enrichment every 5 minutes, campaign generation daily, churn intelligence weekly, morning briefings at 7 AM, email triage, prospect enrichment, anomaly detection, and more. Built on APScheduler with PostgreSQL-backed execution tracking and progress visibility.

**Multi-Agent System**: 12 LangGraph stateful workflows (email composition, appointment booking, call handling, calendar queries, security monitoring, home automation) with 8 MCP servers exposing 130+ tools to any AI client. The system routes queries through a semantic intent classifier to the right workflow, and each workflow has tool access to CRM, calendar, email, telephony, and the full intelligence stack.

**Voice Assistant**: End-to-end voice pipeline with wake word detection, streaming speech-to-text (NVIDIA Nemotron), semantic intent routing, LLM reasoning with tool access, and text-to-speech response. Runs on a central GPU server with an edge node (Orange Pi RK3588) handling local inference for low-latency responses.

---

## Q2: Please provide any links to GitHub, projects, or experiments

- **Atlas (full source code)**: [github.com/canfieldjuan/ATLAS](https://github.com/canfieldjuan/ATLAS)
- **Pipeline walkthrough**: [github.com/canfieldjuan/atlas-portfolio](https://github.com/canfieldjuan/atlas-portfolio) -- Narrated example showing a raw G2 review transforming through every pipeline stage into a personalized sales campaign and competitive battle card, with sample data at each step.

---

## Q3: Please provide a short note on why this role excites you

I've spent the last year building exactly the kind of system this role describes -- AI agents that automate marketing, sales, and operations -- but I built it solo for my own use. The opportunity to do this inside a company where the whole organization benefits from it is the natural next step.

What excites me most about ChainIT is that you're treating AI agents as core operators, not just support tools. That's how I think about it too. Atlas started as a voice assistant and grew into a system that scrapes review data, enriches it with LLMs, generates sales campaigns, writes blog content, handles phone calls, and runs 57 autonomous tasks -- because once you build the agent infrastructure, every business process becomes a candidate for automation.

I'm particularly interested in the Web3 intersection. The agentic patterns I've built (multi-model routing, tool orchestration, autonomous task scheduling, evidence-grounded content generation) are domain-agnostic -- they'd apply directly to marketing automation, sales enablement, and internal ops at ChainIT. I want to bring the builder mentality I've developed working with Claude Code, LangGraph, MCP, and local LLMs into a team where I can ship faster and learn from the crypto/Web3 side of the business.
