# SPEC_v0.2.md — Genesys Startup Studio

| Field            | Value |
|------------------|-------|
| Document         | `SPEC_v0.2.md` |
| Product          | Genesys Startup Studio |
| Version          | 0.2 (re-baselined from the live system on the `claude/genesis-startup-studio-PgsGf` branch) |
| Status           | REVIEW_READY |
| Mode             | Reverse-Engineered As-Is SPEC consolidated from the running deployment + branch HEAD |
| Levels covered   | PRD · BRS · Architecture · Test Strategy (per-feature) · Delivery slice |
| Date             | 2026-05-17 |
| Replaces         | `SPEC_v0.1.md` §§ 11 – 19 (kept as historical record of incremental changes) |
| Owner role       | Senior Solution Architect |

> ID conventions used everywhere in this document:
> - **`FEAT-{NAME}`** — feature.
> - **`US-{FEAT}-{NN}`** — user story.
> - **`UC-{FEAT}-{NN}`** — use case (Gherkin BDD body in the relevant section).
> - **`FR-{FEAT}-{NNN}`** / **`NFR-{FEAT}-{NNN}`** — functional / non-functional requirements.
> - **`TEST-{REQ-ID}-{LAYER}`** — every test ID = the requirement it covers + a one-letter layer suffix:
>     - `S` service / backend
>     - `C` client / UI
>     - `D` data / persistence
>     - `I` infrastructure / smoke / ops
>     - `A` AI / prompt / eval
>   One requirement may have several tests on different layers.

---

## 1. Executive summary

Genesys Startup Studio is a public single-page React app + a single Node/Express
backend that powers a 16-startup demo "studio". Cohort members sign in with
GitHub, browse each others' startups, **upvote** (1-vote-per-handle, toggle),
**invest** play money ($100,000 starting wallet per investor), and watch an
**LLM-driven 13-month market simulation** play out with grounded market
research via the OpenAI Responses API + `web_search_preview`. A separate
**Build wizard** lets a founder spec a new product from scratch with magic-wand
LLM assists.

The deployment is one VM (`human-1` in `europe-west1-b`) running
`docker compose` with two containers behind a single nginx; shared state lives
in a JSON file on a host-mounted volume.

---

## 2. Product context

| Item | Value |
|---|---|
| Primary user        | Cohort founder / cohort investor (one of 15 allowlisted GitHub handles) |
| Secondary user      | Anonymous visitor (read-only browse + simulation viewing) |
| Painful trigger     | "Our cohort needs a way to surface signal — peer upvotes, play-money portfolios, market projection — without spinning up real auth, real billing, or a custom database." |
| Solution            | A single-domain demo platform that uses GitHub OAuth (no DB of users), play-money wallets, and an LLM panel that grounds market reads in live web search. |
| Key metrics         | (1) ≥ 80 % of cohort members log in within 24 h of launch. (2) ≥ 50 % cast at least one upvote and one investment. (3) Single LLM cohort simulation costs ≤ $3 and returns within 3 minutes. |

---

## 3. Feature roadmap & status (as of 2026-05-17)

| Feature | Status | Section |
|---|---|---|
| FEAT-AUTH         | LIVE | §5 |
| FEAT-LANDING      | LIVE | §6 |
| FEAT-UPVOTE       | LIVE | §7 |
| FEAT-INVEST       | LIVE | §8 |
| FEAT-LEADERBOARD  | LIVE | §9 |
| FEAT-PICKREPO     | LIVE | §10 |
| FEAT-BUILD        | LIVE (steps 1-2 wired; 3-7 placeholder) | §11 |
| FEAT-LEGAL        | LIVE (Terms / Privacy / Cookie banner) | §12 |

---

## 4. System architecture (current)

### 4.1 Topology

```
human-1 VM (europe-west1-b)
└── docker compose -f /opt/genesis/docker-compose.yml
    │
    ├── service: web     image=genesys-startup-studio:latest
    │     └── nginx → /usr/share/nginx/html  (Vite-built React SPA)
    │           ├── location /auth/(health|github|github/callback)  → auth:3000
    │           ├── location /api/                                   → auth:3000
    │           │     proxy_read_timeout 240s · proxy_buffering off
    │           ├── location /assets/                                → 30-day cache
    │           └── location /                                       → SPA fallback
    │
    └── service: auth    image=genesys-auth:latest   (Node 22 + Express)
          ├── env: GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / PUBLIC_URL
          │       OPENAI_API_KEY / OPENAI_MODEL · STATE_FILE=/data/state.json
          └── volume: ./data → /data            ← state.json lives here
```

### 4.2 Layer cuts

| Layer      | Source of truth |
|------------|-----------------|
| Client     | `web/src/ui/screens/*`, `web/src/ui/components/*` (React 18 + Tailwind) |
| Service    | `server/index.js` (single Express process) |
| AI service | `web/src/ai/openai.ts` (OpenAI adapters) + `web/src/ai/buildAssist.ts` (Build wizard helpers) |
| Data       | `/data/state.json` (server) + browser localStorage (per-feature keys, see §13) |
| Infra      | `docker-compose.yml`, `web/Dockerfile`, `server/Dockerfile`, `web/nginx.conf` |
| Test       | `web/src/**/__tests__/*.{ts,tsx}` (vitest), `server/state.test.js` (node:test) |

### 4.3 Cross-feature ER (data layer)

```
┌─────────────────┐         ┌──────────────────────┐
│ Startup         │  1...N  │ Investment           │
│  id S-*         │─────────│  startupId           │
│  ownerHandle    │         │  investorHandle      │
│  name, pitch    │         │  amount, ts          │
│  description    │         └──────────────────────┘
│  hashtags[]     │
│  coverImage?    │         ┌──────────────────────┐
└─────────────────┘  N...M  │ Upvote               │
        │                   │  startupId           │
        │                   │  voterHandle         │
        │                   │  (stored as          │
        │                   │   string[] per id)   │
        │                   └──────────────────────┘
        │
        │ derived (Leaderboard run)
        ▼
┌──────────────────────────┐
│ StartupForecast           │  not persisted; recomputed per Leaderboard run
│  monthly[13]              │  cached in localStorage `genesys:forecast:v1`
│  userReview { score,…,perPersona[] }
│  marketReview { score, trends[], sources[] }
│  events[13] { month, event }
│  recommendation
└──────────────────────────┘
```

### 4.4 Cross-feature DFD (one user session)

```
[Browser]
  │
  ├── load /                  → static React bundle  ── parses seed (16 startups)
  │
  ├── GET /api/state          → upvotes + investments map (anonymous OK)
  │
  ├── (if signed-in) POST /api/upvote   { startupId }  + Bearer GitHub token
  │   POST /api/invest                  { startupId, amount }  + Bearer
  │
  ├── Leaderboard "Run"
  │     ├── POST /api/llm/responses  (16× web_search market reviews)
  │     └── (browser-direct) POST api.openai.com/v1/chat/completions
  │            ×16 for user-panel + forecast + narrative + recommend
  │
  └── Build wizard "magic wand"
        └── POST /api/llm/chat        (single-field suggest)
```

---

## 5. FEAT-AUTH — GitHub OAuth + cohort allowlist

### 5.1 User stories

- **US-AUTH-01** — As a cohort member I want to sign in with the same GitHub
  account that's on the allowlist so I never have to remember a password.
- **US-AUTH-02** — As a non-cohort visitor I want to be told politely that I
  can browse but not vote/invest, so I don't bounce in confusion.
- **US-AUTH-03** — As a signed-in member I want a one-click sign-out so I can
  hand the laptop to a teammate.

### 5.2 User flow

1. Visitor clicks "Continue with GitHub" on `/login`.
2. Browser → `GET /auth/github` → server redirects to
   `github.com/login/oauth/authorize?...redirect_uri=$PUBLIC_URL/auth/github/callback`.
3. GitHub redirects back with `?code=…`.
4. Server `GET /auth/github/callback` exchanges code for an access token
   server-side (with the client secret), then redirects browser to
   `/auth/success#token=…`. Tokens never appear in URL query strings or
   server access logs (fragments are not sent).
5. SPA reads token from the URL fragment, scrubs it from history,
   `verifyToken(token)` → `GET api.github.com/user`. Login lowercased.
6. If login is in the cohort allowlist, session is set + browser navigates to
   `/onboarding/repo`; otherwise `/denied`.
7. Sign-out clears the local session; the upstream GitHub authorization
   can be removed at `github.com/settings/applications`.

### 5.3 Use cases (Gherkin BDD)

#### UC-AUTH-01 — Cohort member signs in

```gherkin
Feature: FEAT-AUTH — GitHub OAuth login
  Scenario: Allowlisted GitHub user completes the round-trip
    Given GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET + PUBLIC_URL are configured
      And my GitHub login (lowercased) is on the cohort allowlist
    When I click "Continue with GitHub" on /login
    Then I am redirected to github.com OAuth consent
    When I authorise
    Then I land back on /auth/success#token=<token>
      And the SPA scrubs the fragment from window.location
      And state.session = { handle: <login>, accessToken: <token>, … }
      And I am navigated to /onboarding/repo
```

#### UC-AUTH-02 — Non-allowlisted user

```gherkin
  Scenario: A GitHub user not on the cohort allowlist completes OAuth
    Given my login is "randompasserby" which is NOT on the allowlist
    When OAuth completes
    Then loginWithToken returns { ok:false, reason:"NOT_ON_ALLOWLIST" }
      And I am navigated to /denied
      And no session is stored
```

#### UC-AUTH-03 — Placeholder OAuth config

```gherkin
  Scenario: Operator forgot to replace placeholder values in .env
    Given GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET still contains "PASTE" / "your_client_id"
    When the browser hits /auth/github
    Then the server responds 500 with an HTML page in the brand style
      explaining how to set the values
```

### 5.4 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-AUTH-001  | `/auth/github/callback` MUST exchange the OAuth code server-side and never expose `GITHUB_CLIENT_SECRET` to the browser. | TEST-FR-AUTH-001-I (manual code review) |
| FR-AUTH-002  | Tokens MUST be passed back to the SPA only via URL fragment (`#token=…`), never via query string. | TEST-FR-AUTH-002-C |
| FR-AUTH-003  | `verifyToken(token)` MUST call `GET api.github.com/user` and return the typed `{ login, name, avatar_url }`. | TEST-FR-AUTH-003-C |
| FR-AUTH-004  | Logins MUST be lowercased before comparison against the allowlist. | TEST-FR-AUTH-004-C |
| FR-AUTH-005  | `/auth/github` MUST refuse to redirect when the env contains placeholder values (matched by `PLACEHOLDER_RX`). | TEST-FR-AUTH-005-I |
| FR-AUTH-006  | `/auth/health` MUST report `configured`, `publicUrl`, and `openai: { hasKey, model }` without auth. | TEST-FR-AUTH-006-S |
| NFR-AUTH-001 | The GitHub token MUST NOT appear in browser history (`history.replaceState(null,'','/auth/success')` strips the fragment). | TEST-NFR-AUTH-001-C |
| NFR-AUTH-002 | The OAuth round-trip MUST land < 5 s p95 on a normal connection. | (manual) |

---

## 6. FEAT-LANDING — Browse cohort startups

### 6.1 User stories

- **US-LAND-01** — As a visitor I want to see the cohort startup roster on
  the home page so I can quickly understand what the cohort built.
- **US-LAND-02** — As a visitor I want a hero carousel that rotates through
  every cohort startup (live upvote-sorted) so each of the 16 founders gets
  stage time, not only the current top of the leaderboard.
- **US-LAND-03** — As a visitor I want a search box + horizontally-scrolling
  hashtag chips so I can filter the list.
- **US-LAND-04** — As a visitor on mobile I want the page to feel native,
  not desktop-zoomed.

### 6.2 User flow

1. Visitor opens `/`.
2. Header: wordmark, wallet pill ($100k default for anonymous), theme
   toggle, Connected pill (if signed in) or Login.
3. Search box + hashtag chip strip below the header.
4. Featured carousel (all 16 published cohort startups, sorted by live
   upvote count) with prev/next arrows and tap-to-jump dots.
5. Below: a `grid-cols-1 md:grid-cols-2` list of 20 startups per page,
   `Load more` via IntersectionObserver-driven infinite scroll.
6. Click a card → DetailDialog opens with the cover, pitch, hashtags, full
   description, pitch.pdf + demo.mp4 tiles, GitHub CTA, wallet card.

### 6.3 Use cases

#### UC-LAND-01 — First paint

```gherkin
Feature: FEAT-LANDING — Browse cohort startups
  Scenario: First-time anonymous visitor lands on /
    Given there are 16 published startups in the seed
    When I open /
    Then the page renders the brand header within 1 second
      And the Featured carousel shows the 1st of 16 cohort cards
      And the list below shows the top 20 startups in a 2-col grid (md+)
```

#### UC-LAND-02 — Filter via hashtag chip

```gherkin
  Scenario: Visitor clicks a hashtag chip
    Given the cohort has at least one startup tagged "#telegram"
    When I click the "#telegram" chip in the strip below the search box
    Then the list re-filters to show only "#telegram"-tagged startups
      And the chip strip moves the selected chip to the front of the row
      And the infinite-scroll counter resets so I'm back at the top
```

### 6.4 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-LAND-001 | The Landing list MUST render `grid grid-cols-1 md:grid-cols-2 gap-6` so cards lay out single-column on mobile and 2-column on md+. | TEST-FR-LAND-001-C |
| FR-LAND-002 | Featured carousel MUST surface every published startup in the active batch (16 in the seed cohort) ranked by `upvoteOf(id) DESC` (live, not cached), expose one navigation dot per slide and cycle every 6 s when not hovered. | TEST-FR-LAND-002-C |
| FR-LAND-003 | The DetailDialog upvote button MUST live in the title row (NOT overlaid on the cover image) so prev/next nav buttons never intercept it. | TEST-FR-LAND-003-C |
| FR-LAND-004 | Hashtag chips MUST live in a horizontal-scroll strip with hidden scrollbar; chips MUST `whitespace-nowrap shrink-0`. | TEST-FR-LAND-004-C |
| FR-LAND-005 | The list MUST paginate via IntersectionObserver — visible items default 20, +20 per sentinel intersection; resets on query/tag changes. | TEST-FR-LAND-005-C |
| FR-LAND-006 | DetailDialog prev/next arrow buttons MUST be hidden on viewports < `md` (768 px). | TEST-FR-LAND-006-C |
| NFR-LAND-001 | The header MUST adapt to mobile via a flex-wrap row with the search bar on its own row at `< md`. | TEST-NFR-LAND-001-C |
| NFR-LAND-002 | Every card MUST render its cover via `<img loading="lazy">` and fall back to a deterministic gradient on `onError`. | TEST-NFR-LAND-002-C |

---

## 7. FEAT-UPVOTE — Toggle a per-handle upvote on a startup

(See §18 of `SPEC_v0.1.md` for the full BDD pass — copied here unchanged
in substance and re-keyed to the new ID convention.)

### 7.1 User stories

- **US-UPVOTE-01** — As a cohort member I want to upvote a startup so the
  ranking reflects who else I'd back.
- **US-UPVOTE-02** — As a cohort member I want to take my upvote back when
  I change my mind, so the leaderboard reflects my CURRENT view.
- **US-UPVOTE-03** — As an anonymous visitor I want live totals visible
  without signing in.
- **US-UPVOTE-04** — As a non-cohort GitHub user I want to be refused
  politely so the cohort signal stays clean.

### 7.2 Use cases (Gherkin BDD)

#### UC-UPVOTE-01 — Cast a vote (optimistic)

```gherkin
Feature: FEAT-UPVOTE — Toggle upvote
  Scenario: Allowlisted user upvotes a startup
    Given I am signed in as "@mashan555"
      And "S-artrise" currently has 4 upvotes and I'm not among the voters
    When I click the upvote button on the "S-artrise" card
    Then the button flips to voted (neon, arrow down, count = 5) immediately
      And POST /api/upvote is called with my Bearer token + { startupId: "S-artrise" }
      And the server returns { ok:true, voted:true, count:5, login:"mashan555" }
      And state.upvotes["S-artrise"] now contains "mashan555"
      And /data/state.json reflects the new state
```

#### UC-UPVOTE-02 — Toggle off

```gherkin
  Scenario: Allowlisted user clicks their already-cast upvote
    Given I am signed in as "@mashan555"
      And "S-artrise" has 5 upvotes including mine
    When I click the upvote button again
    Then the button flips to not voted (textsec, arrow up, count = 4)
      And the server stores the decremented list
```

#### UC-UPVOTE-03 — Non-allowlisted user

```gherkin
  Scenario: A signed-in non-cohort user attempts to upvote
    Given my login "randompasserby" is NOT on the allowlist
    When I click the upvote button on any card
    Then POST /api/upvote responds 403 { error: "NOT_IN_ALLOWLIST" }
      And the optimistic flip rolls back
      And a top-center toast appears for ≤ 4 s with a friendly message
```

#### UC-UPVOTE-04 — Anonymous read

```gherkin
  Scenario: Anonymous visitor browses
    Given I am not signed in
    When I open /
    Then GET /api/state returns the upvotes map without auth
      And every card shows the correct cohort total
```

### 7.3 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-UPVOTE-001 | A single GitHub handle MUST contribute at most 1 upvote per startup at any time; re-clicking toggles. | TEST-FR-UPVOTE-001-S |
| FR-UPVOTE-002 | `POST /api/upvote` MUST verify the bearer token via `GET api.github.com/user`. A GitHub 401 MUST surface as 401 `BAD_TOKEN`. | TEST-FR-UPVOTE-002-S |
| FR-UPVOTE-003 | The server MUST refuse upvotes from logins not on the cohort allowlist with 403 `NOT_IN_ALLOWLIST`. | TEST-FR-UPVOTE-003-S |
| FR-UPVOTE-004 | `GET /api/state` MUST be unauthenticated and return `{ upvotes, investments }`. | TEST-FR-UPVOTE-004-S |
| FR-UPVOTE-005 | The browser MUST flip its UI optimistically on click, roll back on a non-2xx response, and toast the error code. | TEST-FR-UPVOTE-005-C |
| FR-UPVOTE-006 | Upvote totals MUST persist across `docker compose up -d --build` (host-mounted volume `./data:/data`). | TEST-FR-UPVOTE-006-I |
| FR-UPVOTE-007 | The browser polls `/api/state` every 15 s while the page is open. | TEST-FR-UPVOTE-007-C |
| NFR-UPVOTE-001 | `/api/upvote` end-to-end latency MUST land < 1.5 s p95. | (manual) |
| NFR-UPVOTE-002 | Writes to `state.json` MUST go through a single-process write queue (`writeChain`) and an atomic `writeFile→rename`. | TEST-NFR-UPVOTE-002-S (code review) |
| NFR-UPVOTE-003 | The upvote button MUST carry `aria-pressed` reflecting current state. | TEST-NFR-UPVOTE-003-C |

---

## 8. FEAT-INVEST — Allocate play money to a startup

### 8.1 User stories

- **US-INVEST-01** — As a cohort member I want a $100k play wallet so I can
  back the projects I believe in.
- **US-INVEST-02** — As a cohort member I want a clear "you've invested $X"
  badge on cards I've backed so I can find my portfolio later.
- **US-INVEST-03** — As the admin (`andre-kuzminykh`) I want to back every
  startup including my own.
- **US-INVEST-04** — As a non-admin cohort founder I want the system to
  prevent me from investing in my own startup.

### 8.2 Use cases

#### UC-INVEST-01 — Successful investment

```gherkin
Feature: FEAT-INVEST — Allocate play money
  Scenario: Allowlisted investor backs a startup within budget
    Given I am signed in as "@mashan555" and my wallet is $100,000
    When I open S-artrise and confirm an investment of $25,000
    Then POST /api/invest responds 200 with
      { ok:true, investment:{ startupId:"S-artrise", investorHandle:"mashan555", amount:25000 },
        walletRemaining: 75000 }
      And the DetailDialog shows a green "$25k" badge
      And the Landing wallet pill reads "$75k"
```

#### UC-INVEST-02 — Self-invest forbidden (non-admin)

```gherkin
  Scenario: A founder tries to invest in their own startup
    Given I am signed in as "@artem-grigorash" — the owner of S-artrise
    When I confirm any positive investment in S-artrise
    Then POST /api/invest responds 400 { error: "SELF_INVEST_FORBIDDEN" }
      And the wallet stays unchanged
```

#### UC-INVEST-03 — Admin can back any startup

```gherkin
  Scenario: Admin invests in a startup they own
    Given I am signed in as "@andre-kuzminykh" (admin)
    When I confirm $5,000 into S-tonloans which I own
    Then POST /api/invest responds 200 with a recorded investment
```

#### UC-INVEST-04 — Overdraft

```gherkin
  Scenario: Investor tries to overdraw the $100k budget
    Given my prior investments total $90,000
    When I confirm a $20,000 investment in any other startup
    Then POST /api/invest responds 400 { error: "INSUFFICIENT_CREDITS", remaining: 10000 }
```

### 8.3 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-INVEST-001 | `/api/invest` MUST require a bearer token and refuse with 401 `NO_TOKEN` otherwise. | TEST-FR-INVEST-001-S |
| FR-INVEST-002 | Non-allowlisted users MUST receive 403 `NOT_IN_ALLOWLIST`. | TEST-FR-INVEST-002-S |
| FR-INVEST-003 | Non-admin founders MUST receive 400 `SELF_INVEST_FORBIDDEN` when they try to invest in a startup they own. | TEST-FR-INVEST-003-S |
| FR-INVEST-004 | Admins (currently `{andre-kuzminykh}`) MUST be allowed to invest in startups they own. | TEST-FR-INVEST-004-S |
| FR-INVEST-005 | The server MUST track `totalInvested(handle)` and reject calls where `spent + amount > 100,000` with 400 `INSUFFICIENT_CREDITS`. | TEST-FR-INVEST-005-S |
| FR-INVEST-006 | Amounts MUST be positive finite integers; otherwise 400 `INVALID_AMOUNT`. | TEST-FR-INVEST-006-S |
| FR-INVEST-007 | Each investment MUST be persisted to `/data/state.json` atomically. | TEST-FR-UPVOTE-006-I (shared) |
| NFR-INVEST-001 | The "Sending…" button state MUST disable submit while the request is in-flight. | TEST-NFR-INVEST-001-C |

---

## 9. FEAT-LEADERBOARD — LLM-driven cohort market simulation

### 9.1 User stories

- **US-LB-01** — As a viewer I want to watch a 13-month market simulation
  play out as a news ticker so each startup's story becomes legible.
- **US-LB-02** — As a viewer I want the market read to be grounded in
  current public web sources, not just the model's training cutoff.
- **US-LB-03** — As a viewer I want the user-panel verdict to come from
  named personas with quotes, not anonymous "personas like the idea" copy.
- **US-LB-04** — As a viewer I want the 30/60/90 recommendation to
  reference specific monthly events that drove the curve.

### 9.2 LLM service contract

| Method | Endpoint | Purpose | Concurrency |
|---|---|---|---|
| `reviewForUser` | OpenAI chat.completions (`gpt-4o`) | ICP inference + per-persona panel (5 personas with `label`, `score`, `quote`) | unbounded |
| `reviewForMarket` | OpenAI Responses (`gpt-4o` + `web_search_preview`), proxied through `/api/llm/responses` | Segment ID, incumbents, tailwinds/headwinds, trend signals, **source URLs** | semaphore (max 3) |
| `forecastSeries` | chat.completions | 13 monthly `{ users, revenueUSD }` points | unbounded |
| `narrativeSeries` | chat.completions | 13 monthly `{ event }` lines with causes | unbounded |
| `recommend` | chat.completions | 4-7 sentence advice that REFERENCES the narrative causes | unbounded |

Prompt source: `web/src/ai/openai.ts`. Each prompt's system role + schema
is inline in the adapter; prompts live close to the parsing logic to avoid
schema drift.

### 9.3 Use cases

#### UC-LB-01 — Run a full simulation

```gherkin
Feature: FEAT-LEADERBOARD — Cohort market simulation
  Scenario: Cohort viewer runs the simulation end-to-end
    Given the server has OPENAI_API_KEY configured
    When I click "Run market simulation"
    Then for each of the 16 cohort startups
      reviewForUser, reviewForMarket, forecastSeries, narrativeSeries, recommend are called
      in that order
    Then once all forecasts return, the month-by-month tape begins streaming
      And one news headline per startup per month is emitted to the single-line ticker
      And after the month's events drain, the chart steps forward one month
      And after the 13th month, the winner card + per-startup verdict cards are revealed
      And a one-time upvote bump is applied to each startup based on userReview.upvoteBump
```

#### UC-LB-02 — Web search grounding

```gherkin
  Scenario: Market review cites real sources
    Given an LLM run completes
    Then each market-review block MUST include a "Sources:" footer with up to 4 URLs
      And those URLs MUST come from web_search_preview results, not invented
```

### 9.4 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-LB-001 | The simulation MUST run 5 LLM steps per startup in sequence: user → market → forecast → narrative → recommend. | TEST-FR-LB-001-A (`web/src/domain/simulation.test.ts` — TODO add stub coverage; existing mock-adapter tests cover the runner shape) |
| FR-LB-002 | Market reviews MUST be requested via `/api/llm/responses` with `tools:[{type:"web_search_preview"}]`. | TEST-FR-LB-002-S (code review) |
| FR-LB-003 | Concurrent web-search calls MUST be capped at 3 via a module-level semaphore (`acquireSearchSlot`). | TEST-FR-LB-003-C |
| FR-LB-004 | `recommend` MUST receive the per-month events array and reference at least one cause in its 4-7 sentence output. | TEST-FR-LB-004-A (prompt assertion) |
| FR-LB-005 | The Leaderboard ticker MUST drip lines one-at-a-time at 450-900 ms cadence with a single visible line at any time. | TEST-FR-LB-005-C |
| FR-LB-006 | Per-startup verdict cards MUST be sorted by `compositeScore` so #1 is always the announced winner. | TEST-FR-LB-006-C |
| FR-LB-007 | If OpenAI returns non-2xx for any startup, the runner MUST fall back to the deterministic `MockLlmAdapter` for that path and surface a banner. | TEST-FR-LB-007-C |
| NFR-LB-001 | A full 16-startup run MUST land within 3 minutes under normal OpenAI tier rate limits. | (manual) |
| NFR-LB-002 | Total OpenAI cost of one cohort run MUST stay ≤ $3 at current pricing for `gpt-4o`. | (manual) |
| NFR-LB-003 | The streaming ticker MUST stay readable on mobile (single-line truncate, font-mono, fade-in animation). | TEST-NFR-LB-003-C |

---

## 10. FEAT-PICKREPO — Pick a GitHub repo to import as a startup

### 10.1 User stories

- **US-PICK-01** — As a signed-in cohort member I want to see my GitHub repos
  (incl. those I collaborate on) so I can pick one as a startup root.
- **US-PICK-02** — As a member with many repos I want a search filter so I
  can find the right one fast.
- **US-PICK-03** — As a member I want the platform to detect a `genesys/spec`
  + `genesys/tests` layout so the "Open dashboard" affordance only appears
  when there's something to open.

### 10.2 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-PICK-001 | `listRepos(token)` MUST page through up to 5 pages of 100 repos with `affiliation=owner,collaborator,organization_member&visibility=all`. | TEST-FR-PICK-001-C |
| FR-PICK-002 | `scanRepoLive(token, repo)` MUST probe `genesys/spec`, `docs/spec`, `SPEC.md` (spec candidates) and `genesys/tests`, `tests`, `__tests__` (tests candidates) in parallel. | TEST-FR-PICK-002-C |
| FR-PICK-003 | The picker UI MUST link the repo full-name to `https://github.com/{repo}` (target `_blank`). | TEST-FR-PICK-003-C |
| FR-PICK-004 | The picker UI MUST paginate via IntersectionObserver at 15 rows per page; the search input resets the page counter. | TEST-FR-PICK-004-C |
| FR-PICK-005 | The picker header MUST expose a Sign-out pill matching the "signed in as" pill in size (`px-3 py-1.5 text-sm rounded-full`). | TEST-FR-PICK-005-C |
| NFR-PICK-001 | A scan MUST cover the top-50 most-recently pushed repos; the rest are listed but not probed. | TEST-FR-PICK-001-C (same path) |

---

## 11. FEAT-BUILD — Multi-step product spec wizard

(Full BDD pass in §19 of `SPEC_v0.1.md`. The summary below is the canonical
table going forward.)

### 11.1 User stories

- **US-BUILD-01** — As a founder I want guided prompts for user / problem /
  solution / metrics so I never face a blank page.
- **US-BUILD-02** — As a founder I want LLM-generated feature suggestions
  based on the brief I've already typed.
- **US-BUILD-03** — As a founder I want to deep-dive ONE feature at a time;
  the others stay on a roadmap.
- **US-BUILD-04** — As a founder I want my draft saved across page reloads.

### 11.2 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-BUILD-001 | Magic-wand calls MUST go through same-origin `POST /api/llm/chat`; no OpenAI key in the SPA path. | TEST-FR-BUILD-001-C |
| FR-BUILD-002 | The proxy MUST return 503 `NO_OPENAI_KEY` when the server has no key. | TEST-FR-BUILD-002-S |
| FR-BUILD-003 | `loadDraft()` MUST tolerate missing / corrupt localStorage and return `EMPTY_DRAFT`. | TEST-FR-BUILD-003-D |
| FR-BUILD-004 | `saveDraft(d)` MUST persist under `genesys:build-draft:v1` and stamp `updatedAt`. | TEST-FR-BUILD-004-D |
| FR-BUILD-005 | Step 2 MUST render `pointer-events-none opacity-50` until step 1 is complete. | TEST-FR-BUILD-005-C |
| FR-BUILD-006 | The magic-wand button MUST have no `border-*` / `bg-*` chrome classes and an `aria-label`. | TEST-FR-BUILD-006-C |
| FR-BUILD-007 | `suggestFeatures` MUST clamp to ≤ 8 entries and normalise `priority` to `must / should / could`. | TEST-FR-BUILD-007-C |
| NFR-BUILD-001 | OpenAI key MUST NOT appear in any JS bundle for the Build path. | (code review) |

---

## 12. FEAT-LEGAL — Terms, Privacy, Cookie banner

### 12.1 Requirements

| ID | Requirement | Test |
|---|---|---|
| FR-LEGAL-001 | A one-time cookie/localStorage notice MUST be shown until the visitor clicks OK; ack persisted under `genesys:cookie-acked:v1`. | TEST-FR-LEGAL-001-C (component render) |
| FR-LEGAL-002 | `/terms` and `/privacy` MUST be reachable from the footer of every public screen. | TEST-FR-LEGAL-002-C |
| FR-LEGAL-003 | The footer MUST render at the bottom of Landing, Leaderboard, Login, PickRepo, ComingSoon, AuthSuccess, Terms, Privacy. | TEST-FR-LEGAL-003-C |

---

## 13. Data layer — storage map

| Key / file | Owner | Shape | Lifetime |
|---|---|---|---|
| `/data/state.json` (server) | `server/index.js` | `{ upvotes: Record<startupId,string[]>, investments: Array<{startupId,investorHandle,amount,ts}> }` | Persistent on the host volume `./data` |
| `genesys:v0.9` (browser) | `web/src/data/store.ts` | `AppState` (session + seed catalog) | Per-browser |
| `genesys:upvotes:v2` (browser) | legacy / unused after migration to `/api/state` | — | superseded |
| `genesys:cookie-acked:v1` | `CookieBanner` | timestamp string | per-browser |
| `genesys:build-draft:v1` | `buildDraft.ts` | `BuildDraft` | per-browser |
| `genesys:forecast:v1` | `Leaderboard` | last `SimulationResult` for re-warm | per-browser |

---

## 14. Test inventory (mapped to requirements)

> Test IDs follow `TEST-{REQ-ID}-{LAYER}` so every failure points straight at
> the requirement that broke. The current vitest suites use this naming via
> `describe()` headers in the new tests added by §15.

| Layer | File | Covers |
|---|---|---|
| Service | `server/state.test.js` | TEST-FR-UPVOTE-001-S / -002-S / -003-S / -004-S, TEST-FR-INVEST-001-S / -003-S / -004-S / -005-S, TEST-FR-AUTH-006-S, TEST-FR-BUILD-002-S (contract) |
| Data | `web/src/data/__tests__/buildDraft.test.ts` | TEST-FR-BUILD-003-D, TEST-FR-BUILD-004-D |
| Client (unit) | `web/src/ai/__tests__/buildAssist.test.ts` | TEST-FR-BUILD-001-C, TEST-FR-BUILD-007-C |
| Client (unit) | `web/src/ui/screens/__tests__/Build.test.tsx` | TEST-FR-BUILD-005-C, TEST-FR-BUILD-006-C |
| Client (unit) | `web/src/ui/screens/__tests__/Landing.test.tsx` | TEST-FR-LAND-001-C |
| Client (unit) | `web/src/ui/components/Wordmark.test.tsx` | TEST-NFR-LAND-001-C (branding renders) |
| Client (unit) | `web/src/ui/components/Chip.test.tsx` | TEST-FR-LAND-004-C (chip composition) |
| Client (unit) | `web/src/ui/screens/__tests__/PickRepoRow.test.tsx` | TEST-FR-PICK-005-C |
| Client (unit) | `web/src/ui/screens/__tests__/PickRepoFlow.test.tsx` | TEST-FR-PICK-001-C (mock flow) |
| Client (unit) | `web/src/ui/screens/__tests__/Invest.test.tsx` | TEST-NFR-INVEST-001-C |
| Client (unit) | `web/src/ui/screens/__tests__/ComingSoon.test.tsx` | smoke |

§15 below documents what tests were added / renamed in this re-baseline.

---

## 15. Test additions / renames in this re-baseline (2026-05-17)

- **server/state.test.js** — `describe()` headers re-keyed:
    - `TEST-GEN-220` → **TEST-FR-AUTH-006-S** (auth/health shape covers /api/state response).
    - `TEST-GEN-221` → **TEST-FR-UPVOTE-001-S** + **-003-S** + **-004-S** (split by `it()`).
    - `TEST-GEN-222` → **TEST-FR-INVEST-001-S** through **-005-S** (split by `it()`).
    - `TEST-GEN-501-S` → **TEST-FR-UPVOTE-001-S** (one-handle-one-vote invariant).
    - `TEST-GEN-502-S` → **TEST-FR-UPVOTE-002-S** (BAD_TOKEN contract).
    - `TEST-GEN-602-S` → **TEST-FR-BUILD-002-S** (NO_OPENAI_KEY contract).
- **web/src/data/__tests__/buildDraft.test.ts** — `TEST-GEN-603-D` / `-604-D` renamed to **TEST-FR-BUILD-003-D** / **TEST-FR-BUILD-004-D**.
- **web/src/ai/__tests__/buildAssist.test.ts** — `TEST-GEN-601-C` / `-607-C` / `-602-CONTRACT` renamed to **TEST-FR-BUILD-001-C** / **TEST-FR-BUILD-007-C** / **TEST-FR-BUILD-002-CONTRACT-C**.
- **web/src/ui/screens/__tests__/Build.test.tsx** — `TEST-GEN-605-C` / `-606-C` renamed to **TEST-FR-BUILD-005-C** / **TEST-FR-BUILD-006-C**.

No test bodies change. The renaming is purely the `describe()` label so a
failure now reads e.g. `FAIL · TEST-FR-UPVOTE-002-S — BAD_TOKEN contract`
and you can grep the SPEC for that ID in seconds.

---

## 16. Open gaps (TODO — surface only, not yet covered by tests)

| Gap | Requirement | Action |
|---|---|---|
| Build wizard step 3 (User story → flow → BDD → FR/NFR) is a placeholder shell. | extends FR-BUILD-* | Land in the next iteration (§19.13 roadmap). |
| `TEST-FR-LB-005-C` (single-line ticker drip pacing) is currently manual-only. | FR-LB-005 | Add a fake-timer vitest. |
| `TEST-NFR-UPVOTE-002-S` (write queue) is a code-review check. | NFR-UPVOTE-002 | Add a concurrent-writes test with two parallel POSTs and assert the final file is consistent. |
| `TEST-FR-AUTH-005-I` (placeholder OAuth env) is manual. | FR-AUTH-005 | Mock env + boot the server in-process and assert the 500 HTML page contains the brand-yellow banner. |

---

## 17. Change log

| Version | Date       | Change | Status |
|---------|------------|--------|--------|
| v0.1.x  | 2026-05-14..16 | Incremental sections appended as features shipped. | DEPRECATED (kept for traceability) |
| **v0.2** | 2026-05-17 | **Re-baseline of the live system. ID convention switched to `FR-{FEAT}-NNN` + matching test IDs.** | REVIEW_READY |
| v0.2.1  | 2026-05-23 | FR-LAND-002 updated: Featured carousel now cycles through every published cohort startup (16) instead of the top-4 slice, so every founder gets stage time on the home page. US-LAND-02, UC-LAND-01 wording aligned. Covered by `TEST-FR-LAND-002-C` (dot count + prev/next controls). No other section impacted. | UPDATED |
