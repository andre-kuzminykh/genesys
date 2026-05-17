# SPEC_v0.1.md — Genesis Startup Studio

## 0. Document Control

| Field | Value |
|---|---|
| Document | SPEC_v0.1.md |
| Product | Genesis Startup Studio |
| Version | 0.1 |
| Status | DRAFT |
| Levels covered | Reverse-Engineered As-Is (Stage 0) · Product Requirements Draft (Stage 1) · Business Requirements (Stage 2) · Solution Architecture Draft (Stage 3) · Test Strategy Draft (Stage 4) · Project Delivery Plan (Stage 5) |
| Owner roles | Product Lead · Senior Business Analyst · Senior Solution Architect · QA Architect · Senior Technical Project Manager |
| Date | 2026-05-14 |
| Mode chain | MODE-0 → MODE-1 → MODE-2 → MODE-3 → MODE-4 → MODE-5 (then MODE-6 TDD Implementation as separate artifact) |
| Scope of this document | Specification only. Implementation lives under `/web` (React MVP) and `/tests`. |
| Out of scope | Backend services, real GitHub OAuth, real LLM provider integration, payments — these are V1+/Future. |

### Change Log

| Version | Date | Source | Summary | Status |
|---|---|---|---|---|
| 0.1 | 2026-05-14 | Initial creation from product brief in PgsGf session | First end-to-end spec for Genesis Startup Studio: PRD + BRS + Architecture + Test Strategy + Project Plan (MVP frontend). | DRAFT |

---

## Stage 0 — Reverse-Engineered As-Is SPEC

### 0.1 Repository Inventory (pre-implementation snapshot)

Repository contains only `CLAUDE.md` — an Execution Kernel that defines a multi-stage AI SDLC operating system and Artifact Registry. There is no existing product code, no service layer, no AI service, no data layer, no infrastructure, no tests.

Evidence:
- `CLAUDE.md` — methodology, not product.

Status: **MISSING** for every product layer.

### 0.2 As-Is Findings

| Area | Finding | Status |
|---|---|---|
| Product code | None | MISSING |
| Tests | None | MISSING |
| Architecture | None | MISSING |
| AI services | None | MISSING |
| Data layer | None | MISSING |
| Infrastructure | None | MISSING |
| Documentation | Only CLAUDE.md methodology | CONFIRMED |

### 0.3 Conclusion

The system is **greenfield**. Brownfield lifecycle (MODE-8) is not applicable. We proceed directly to MODE-1 (PRD) and downstream stages.

---

## Stage 1 — Product Requirements Draft (PRD)

### 1.1 Product Description

**Genesis Startup Studio** is a specification-first startup operating system. It guides a founder from a raw idea to a structured, traceable product specification, then to GitHub-connected implementation, then to a demo-day showcase where AI-simulated users and peer investors evaluate the product as if it were already in market.

It is part of a larger AI-first ecosystem:
- **Andre AI** — public trust brand and gateway.
- **Anthropolis** — upper-level AI-first economy.
- **Genesis Startup Studio** — product creation layer (this product).
- **Neuron / SuperAgent** — owned AI execution engine.
- **Human Intelligence Platform** — AI agents plus human operators for execution.
- **Education** — onboarding layer into the AI-first economy.

The differentiation is not "another startup directory". The differentiation is:
1. AI analyst converts founder intent into structured, ID-stable requirements.
2. Every requirement maps to a Gherkin BDD scenario and to a test.
3. GitHub repo is synchronised with the spec (`/genesis/spec/`, `/genesis/bdd/`, `/genesis/tests/`).
4. Product health is measured by spec completeness, traceability, and simulated user behaviour.
5. Demo-day is not a vote — it is a market simulation with Genesis Credits and AI personas.

### 1.2 Client and User

| Role | Description | Entry points | Confidence |
|---|---|---|---|
| Student Founder | Builds a startup for a demo-day batch. Has a GitHub account on the allowlist. | Landing → Login (GitHub) → Founder Dashboard | CONFIRMED |
| Indie Founder | Same as Student Founder, outside a batch (V1). | Landing → Login → Dashboard | INFERRED |
| Developer / Product Engineer | Wires repo to spec, runs Claude Code / SuperAgent against the spec. | Founder Dashboard → Repo tab | CONFIRMED |
| Product Manager | Owns spec and traceability. | Dashboard → Spec workspace | INFERRED |
| Instructor / Admin | Creates batch, manages allowlist, runs simulation, picks winners. | Admin Dashboard | CONFIRMED |
| Student Investor | Same human as Student Founder; allocates Genesis Credits to other startups. | Marketplace → Invest | CONFIRMED |
| AI Analyst Agent | System actor. Interviews founder, generates structured artefacts, never overrides user. | Inside Spec workspace | CONFIRMED |
| AI User Simulation Agent | System actor. Plays a persona against a product. | Triggered by Admin or Founder. | CONFIRMED |
| Public Viewer | Reads public showcase pages (V1). | Public showcase route | INFERRED |

### 1.3 Problem

Founders, especially students, jump from idea straight to code. The cost:
- Vague requirements → fragile builds.
- No traceability → tests don't reflect product intent.
- No simulated feedback → demo-day picks the loudest pitch, not the best product.
- AI coding agents (Claude Code, SuperAgent) work blind without a spec they can reliably consume.

Current alternatives (Notion docs, Linear tickets, lean canvases) capture intent but do not produce machine-consumable, ID-stable artefacts that AI agents and tests can both reference.

### 1.4 Solution

Genesis Startup Studio:
1. **Onboards via GitHub** — allowlisted users for the first demo-day batch.
2. **Interviews the founder** with an AI Analyst Agent and produces a structured spec hierarchy: Product → Feature → User Story → User Flow → Use Case → BDD Scenario → FR/NFR → Test → Task.
3. **Synchronises with GitHub**: reads/writes `/genesis/spec`, `/genesis/bdd`, `/genesis/tests`.
4. **Scores Product Health**: spec completeness, traceability, test status.
5. **Showcases startups** in a Product-Hunt-style marketplace.
6. **Runs market simulation**: peer investors and AI personas evaluate each startup.
7. **Picks demo-day winners** via configurable scoring formulas.

### 1.5 Product Metrics

| Metric | What it measures | Why important | Formula | Target (MVP) |
|---|---|---|---|---|
| Spec Completeness % | % of mandatory spec nodes filled per startup | Drives traceability and AI agent quality | filled_nodes / required_nodes | ≥ 70% at demo day |
| Traceability Coverage % | % of FR/NFR linked to at least one Test ID | Ensures tests reflect intent | linked_requirements / total_requirements | ≥ 80% |
| Test Pass Rate % | % of `TEST-*` items passing in CI | Indicates working product | passing_tests / total_tests | ≥ 90% Must-have |
| AI Persona Satisfaction (0-100) | Mean of persona scores across run | Proxy for product-market fit | mean(persona_scores) | ≥ 60 for top-10% startups |
| Investor Demand (credits) | Credits invested by peers into a startup | Real peer-validated demand | sum(investments_into_startup) | n/a (ranking only) |
| Demo Readiness Score (0-100) | Composite metric used to rank | Single readable number | See §6 scoring | n/a (ranking only) |
| Activation Rate (Founder) | % of users who finish a full spec at least once | Onboarding quality | finishers / signups | ≥ 60% of allowlisted users |

North-Star Metric (MVP, batch-scoped): **Number of startups with Spec Completeness ≥ 70%, Traceability ≥ 80%, and at least one passing simulation run, at the moment the demo-day window closes.**

### 1.6 Features (MVP)

| ID | Feature | User | Problem | Value | Priority | Depends on |
|---|---|---|---|---|---|---|
| FEAT-GEN-001 | GitHub allowlist login | Student Founder, Admin | Restricted demo-day cohort | Cohort integrity | Must | — |
| FEAT-GEN-002 | Batch management (admin) | Admin | Coordinate the cohort | Operating model | Must | FEAT-GEN-001 |
| FEAT-GEN-003 | Startup creation & profile | Founder | Capture product identity | Anchor for everything else | Must | FEAT-GEN-001 |
| FEAT-GEN-004 | AI Analyst interview | Founder | Vague ideas | Structured spec generation | Must | FEAT-GEN-003 |
| FEAT-GEN-005 | Spec hierarchy workspace | Founder | Manage spec | Editable Product→Feature→Story→Flow→UC→BDD→FR/NFR→Test tree | Must | FEAT-GEN-004 |
| FEAT-GEN-006 | Requirements Traceability Matrix | Founder, Admin | Lost mappings | Auditable links | Must | FEAT-GEN-005 |
| FEAT-GEN-007 | GitHub repo attach (read/write `/genesis/...`) | Developer | Sync spec with code | Reproducible product | Must | FEAT-GEN-003 |
| FEAT-GEN-008 | Product Health Dashboard | Founder | "Is my product ready?" | Single source of truth | Must | FEAT-GEN-005, FEAT-GEN-007 |
| FEAT-GEN-009 | Startup Showcase card & page | Founder, Viewer | Demo discoverability | Product-Hunt-style demo surface | Must | FEAT-GEN-003 |
| FEAT-GEN-010 | Batch Marketplace | All | Find startups in batch | Browse & invest | Must | FEAT-GEN-002, FEAT-GEN-009 |
| FEAT-GEN-011 | Genesis Credits & Investment | Student Investor | Express peer demand | Game mechanic | Must | FEAT-GEN-010 |
| FEAT-GEN-012 | AI persona simulation run | Founder, Admin | Need feedback before demo | Synthetic market signal | Must | FEAT-GEN-005, FEAT-GEN-009 |
| FEAT-GEN-013 | Demo-day Leaderboard | All | Pick winners | Public ranking | Must | FEAT-GEN-011, FEAT-GEN-012 |
| FEAT-GEN-014 | Admin dashboard & scoring config | Admin | Operate the batch | Control & transparency | Must | FEAT-GEN-002 |

V1 (next): real LLM-backed interview, real GitHub OAuth + API, Playwright-based persona runs, public viewer pages, pitch deck upload, multiple batches in parallel.

V2 (future): payments, Anthropolis ecosystem integration, Human Intelligence Platform handoffs, Neuron/SuperAgent direct execution from spec.

### 1.7 User Stories (MVP)

| ID | Story | Feature | Confidence |
|---|---|---|---|
| STORY-GEN-001 | As an Admin, I want to add GitHub usernames to a batch allowlist so that only invited students log in. | FEAT-GEN-001, FEAT-GEN-002 | CONFIRMED |
| STORY-GEN-002 | As a Student Founder, I want to log in with GitHub so that I keep one identity across tools. | FEAT-GEN-001 | CONFIRMED |
| STORY-GEN-003 | As a Founder, I want to create a startup with a name, pitch and category so that it exists in the batch. | FEAT-GEN-003 | CONFIRMED |
| STORY-GEN-004 | As a Founder, I want an AI Analyst to interview me so that my spec is structured. | FEAT-GEN-004 | CONFIRMED |
| STORY-GEN-005 | As a Founder, I want to edit features, user stories, use cases, BDD scenarios, FR/NFR and tests so that I keep control. | FEAT-GEN-005 | CONFIRMED |
| STORY-GEN-006 | As a Founder, I want a traceability matrix so that I see which requirements lack tests. | FEAT-GEN-006 | CONFIRMED |
| STORY-GEN-007 | As a Developer, I want to attach a GitHub repo so that spec and tests live next to code. | FEAT-GEN-007 | CONFIRMED |
| STORY-GEN-008 | As a Founder, I want a Health Dashboard so that I know if I'm demo-ready. | FEAT-GEN-008 | CONFIRMED |
| STORY-GEN-009 | As a Founder, I want a showcase page so that peers can evaluate my startup. | FEAT-GEN-009 | CONFIRMED |
| STORY-GEN-010 | As a Student, I want a marketplace so that I can browse other startups. | FEAT-GEN-010 | CONFIRMED |
| STORY-GEN-011 | As a Student Investor, I want to allocate Genesis Credits to startups so that peer demand is recorded. | FEAT-GEN-011 | CONFIRMED |
| STORY-GEN-012 | As a Founder, I want to run a persona simulation so that I get pre-demo feedback. | FEAT-GEN-012 | CONFIRMED |
| STORY-GEN-013 | As anyone, I want a leaderboard so that the winners are explicit. | FEAT-GEN-013 | CONFIRMED |
| STORY-GEN-014 | As an Admin, I want to tune scoring weights so that scoring reflects the batch's emphasis. | FEAT-GEN-014 | CONFIRMED |

### 1.8 Primary User Flow (Founder, happy path)

| Step | User | System | Input | Output | Errors |
|---|---|---|---|---|---|
| 1 | Lands on `/` | Renders landing | — | CTA | — |
| 2 | Clicks "Login with GitHub" | Checks allowlist | GitHub handle | Session or denied | Not allowlisted → blocked screen |
| 3 | Sees Founder Dashboard | Lists user's startups, credits | — | Dashboard | — |
| 4 | Clicks "New Startup" | Opens creation flow | name, pitch, category | Draft `Startup` | Duplicate name in batch |
| 5 | Enters AI Interview | Generates structured spec | Q&A | Features, Stories, UCs | Empty/contradictory answers — agent reprompts |
| 6 | Edits spec in workspace | Persists changes | Edits | Spec tree | Validation: each FR needs a Test |
| 7 | Attaches GitHub repo | Reads/writes `/genesis/*` | Repo URL | File tree | Permission missing |
| 8 | Opens Health Dashboard | Computes scores | — | Spec %, Trace %, Test %, Readiness | — |
| 9 | Runs persona simulation | Persona scores | — | Persona Result | Spec too thin → error with reason |
| 10 | Publishes Showcase | Card visible in marketplace | — | Public card | Mandatory fields missing |
| 11 | Browses Marketplace, invests credits | Validates allocation | credits per startup | Investment record | Insufficient credits / self-invest blocked |
| 12 | Demo day window closes | Snapshot leaderboard | — | Final ranking | — |

### 1.9 Open Questions (PRD)

| Q | Why | Owner | Impact |
|---|---|---|---|
| Self-investment policy default? | Affects scoring | Admin | Game balance |
| Minimum N other startups to invest in? | Forces engagement | Admin | Participation |
| Should public viewer pages be open in MVP? | Privacy | Product Lead | Showcase scope |
| Real LLM provider for AI Analyst in MVP? | Cost, latency | Product Lead | Tech complexity |

### 1.10 Assumptions

| ID | Assumption | Risk if wrong |
|---|---|---|
| ASM-001 | First MVP uses mocked GitHub login (no real OAuth). | Adds real-OAuth retrofit work later. |
| ASM-002 | First MVP uses mocked AI Analyst (deterministic generator from inputs). | Real LLM integration deferred. |
| ASM-003 | Persistence is in-memory + localStorage for the frontend MVP. | No multi-device sync until V1. |
| ASM-004 | Batches are single-tenant at MVP scope. | Multi-tenant adds isolation work. |

---

## Stage 2 — Business Requirements Specification

### 2.1 Scope

In scope (MVP):
- All FEAT-GEN-001..014 as listed.
- React frontend only. No real backend.
- Mocked auth, mocked GitHub, mocked AI Analyst, mocked persona simulation (deterministic).
- In-memory + `localStorage` persistence.

Out of scope (MVP):
- Real GitHub OAuth and API calls.
- Real LLM provider.
- Browser-automation persona runs.
- Payments / real money.
- Public viewer pages with rich SEO.

### 2.2 Use Case Map

| UC ID | Use Case | Feature | User Story | Priority |
|---|---|---|---|---|
| UC-GEN-001 | Allowlist-gated login | FEAT-GEN-001 | STORY-GEN-002 | Must |
| UC-GEN-002 | Manage batch allowlist | FEAT-GEN-002 | STORY-GEN-001 | Must |
| UC-GEN-003 | Create startup | FEAT-GEN-003 | STORY-GEN-003 | Must |
| UC-GEN-004 | Conduct AI interview | FEAT-GEN-004 | STORY-GEN-004 | Must |
| UC-GEN-005 | Edit spec tree | FEAT-GEN-005 | STORY-GEN-005 | Must |
| UC-GEN-006 | Compute traceability matrix | FEAT-GEN-006 | STORY-GEN-006 | Must |
| UC-GEN-007 | Attach repository | FEAT-GEN-007 | STORY-GEN-007 | Must |
| UC-GEN-008 | View health dashboard | FEAT-GEN-008 | STORY-GEN-008 | Must |
| UC-GEN-009 | Publish showcase | FEAT-GEN-009 | STORY-GEN-009 | Must |
| UC-GEN-010 | Browse marketplace | FEAT-GEN-010 | STORY-GEN-010 | Must |
| UC-GEN-011 | Invest credits | FEAT-GEN-011 | STORY-GEN-011 | Must |
| UC-GEN-012 | Run persona simulation | FEAT-GEN-012 | STORY-GEN-012 | Must |
| UC-GEN-013 | View leaderboard | FEAT-GEN-013 | STORY-GEN-013 | Must |
| UC-GEN-014 | Tune scoring weights | FEAT-GEN-014 | STORY-GEN-014 | Must |

### 2.3 Use Cases (representative detail; full list in `/docs` after MODE-5)

#### UC-GEN-001: Allowlist-gated login
- Actor: Student Founder
- Trigger: clicks "Login with GitHub"
- Preconditions: GitHub handle resolved
- Main: handle in allowlist → session created → redirect to dashboard
- Error: handle absent from allowlist → display denial screen with batch name and admin contact
- Postcondition: `Session` exists
- Related: FR-GEN-001, FR-GEN-002; NFR-GEN-001
- Tests: TEST-GEN-001, TEST-GEN-002

#### UC-GEN-005: Edit spec tree
- Actor: Founder
- Trigger: opens Spec Workspace
- Main: create/update/delete Feature, Story, Flow, UC, Scenario, FR, NFR, Test nodes; relations enforced; IDs stable
- Alt: bulk-import from AI Interview result
- Error: orphan node (e.g. FR without parent UC) → validation warning
- Postcondition: updated `ProductSpec`
- Related: FR-GEN-010..018; NFR-GEN-003 (consistency)
- Tests: TEST-GEN-010..018

#### UC-GEN-011: Invest credits
- Actor: Student Investor
- Trigger: clicks "Invest" on a startup
- Pre: investor has remaining credits; startup is published; self-invest rule resolved
- Main: amount ≤ remaining ∧ amount ≥ 1 ∧ rule respected → `Investment` recorded; investor credits decrement
- Alt: increase amount on an existing investment
- Error: insufficient credits / self-invest forbidden → reject with explicit reason
- Postcondition: `Leaderboard` recomputes
- Related: FR-GEN-030..033; NFR-GEN-005 (idempotency)
- Tests: TEST-GEN-030..033

### 2.4 BDD / Gherkin Scenarios (selected)

```gherkin
Feature: Allowlist-gated login (FEAT-GEN-001)

  Scenario: SCN-GEN-001 — allowlisted user logs in
    Given the batch "GEN-001" has allowlist ["alice", "bob"]
    And a user authenticates with GitHub handle "alice"
    When the system verifies the allowlist
    Then a session is created
    And the user is redirected to the Founder Dashboard

  Scenario: SCN-GEN-002 — non-allowlisted user is denied
    Given the batch "GEN-001" has allowlist ["alice", "bob"]
    And a user authenticates with GitHub handle "carol"
    When the system verifies the allowlist
    Then no session is created
    And the user sees a denial screen referencing batch "GEN-001"
```

```gherkin
Feature: Invest credits (FEAT-GEN-011)

  Scenario: SCN-GEN-030 — invest within balance
    Given investor "alice" has 1000 credits
    And startup "S1" is published and is not owned by "alice"
    When "alice" invests 200 credits into "S1"
    Then "alice" has 800 credits remaining
    And startup "S1" investor_demand increases by 200

  Scenario: SCN-GEN-031 — overspend is rejected
    Given investor "alice" has 100 credits
    When "alice" attempts to invest 200 credits into "S1"
    Then the investment is rejected with reason "INSUFFICIENT_CREDITS"
    And "alice" still has 100 credits

  Scenario: SCN-GEN-032 — self-invest blocked when policy=FORBIDDEN
    Given batch policy "self_invest" is "FORBIDDEN"
    And startup "S1" is owned by "alice"
    When "alice" attempts to invest 50 credits into "S1"
    Then the investment is rejected with reason "SELF_INVEST_FORBIDDEN"
```

```gherkin
Feature: Persona simulation (FEAT-GEN-012)

  Scenario: SCN-GEN-040 — sparse spec lowers persona satisfaction
    Given startup "S1" has Spec Completeness 20%
    When personas ["impatient", "skeptical_investor", "power_user"] evaluate "S1"
    Then the mean persona satisfaction is below 40

  Scenario: SCN-GEN-041 — rich spec with passing tests raises satisfaction
    Given startup "S1" has Spec Completeness 90%, Trace Coverage 95%, Test Pass Rate 100%
    When the same personas evaluate "S1"
    Then the mean persona satisfaction is above 70
```

```gherkin
Feature: Demo-day Readiness Score (FEAT-GEN-008/013)

  Scenario: SCN-GEN-050 — weighted readiness composition
    Given default scoring weights
    And startup "S1" has SpecCompleteness=80, TestPassRate=90, TechExecution=70, PersonaSatisfaction=60, InvestorDemand=40, MarketPotential=50, PitchScore=50
    When the system computes Readiness Score
    Then the Readiness Score equals 67.5
```

### 2.5 Functional Requirements Register

| FR ID | Requirement | UC | Priority | Verification |
|---|---|---|---|---|
| FR-GEN-001 | The system MUST permit login only for handles present in the active batch allowlist. | UC-GEN-001 | Must | TEST-GEN-001 |
| FR-GEN-002 | The system MUST present a denial screen referencing the batch when login is rejected. | UC-GEN-001 | Must | TEST-GEN-002 |
| FR-GEN-003 | The Admin MUST be able to add and remove handles in an allowlist. | UC-GEN-002 | Must | TEST-GEN-003 |
| FR-GEN-004 | Creating a startup MUST require name, one-line pitch, and category. | UC-GEN-003 | Must | TEST-GEN-004 |
| FR-GEN-005 | Startup names MUST be unique per batch. | UC-GEN-003 | Must | TEST-GEN-005 |
| FR-GEN-006 | AI Interview MUST produce at least: 3 features, 3 user stories, 3 use cases, 3 BDD scenarios, 3 FRs, 1 NFR. | UC-GEN-004 | Must | TEST-GEN-006 |
| FR-GEN-007 | AI Interview output MUST be editable in the Spec Workspace. | UC-GEN-005 | Must | TEST-GEN-007 |
| FR-GEN-010 | Spec hierarchy nodes MUST have stable IDs in the form `{KIND}-GEN-{N}`. | UC-GEN-005 | Must | TEST-GEN-010 |
| FR-GEN-011 | The system MUST allow create, update and delete on each spec node. | UC-GEN-005 | Must | TEST-GEN-011 |
| FR-GEN-012 | Every FR MUST be linkable to ≥1 Use Case and ≥1 Test. | UC-GEN-005, UC-GEN-006 | Must | TEST-GEN-012 |
| FR-GEN-013 | The traceability matrix MUST list FRs missing a Test as `MISSING`. | UC-GEN-006 | Must | TEST-GEN-013 |
| FR-GEN-014 | The repo attach action MUST record `owner/repo` and synchronise into the model. | UC-GEN-007 | Must | TEST-GEN-014 |
| FR-GEN-020 | Health Dashboard MUST display Spec Completeness, Trace Coverage, Test Pass Rate, Readiness Score. | UC-GEN-008 | Must | TEST-GEN-020 |
| FR-GEN-021 | Spec Completeness = filled mandatory nodes / required mandatory nodes. | UC-GEN-008 | Must | TEST-GEN-021 |
| FR-GEN-022 | Readiness Score = configurable weighted sum of seven dimensions clipped to [0,100]. | UC-GEN-008 | Must | TEST-GEN-022 |
| FR-GEN-023 | Showcase MUST display name, pitch, category, founder, readiness score, investor demand, persona satisfaction. | UC-GEN-009 | Must | TEST-GEN-023 |
| FR-GEN-024 | Marketplace MUST list all published startups in the active batch. | UC-GEN-010 | Must | TEST-GEN-024 |
| FR-GEN-030 | Each investor MUST start with `batch.credits_per_investor` credits (default 1000). | UC-GEN-011 | Must | TEST-GEN-030 |
| FR-GEN-031 | Invest MUST reject overspend with reason `INSUFFICIENT_CREDITS`. | UC-GEN-011 | Must | TEST-GEN-031 |
| FR-GEN-032 | Self-invest MUST follow batch policy: `ALLOWED` / `LIMITED` / `FORBIDDEN`. | UC-GEN-011 | Must | TEST-GEN-032 |
| FR-GEN-033 | Investor portfolio value = Σ allocations × (1 + simulation_bonus_factor of target). | UC-GEN-011 | Must | TEST-GEN-033 |
| FR-GEN-040 | Persona simulation MUST score 0..100 per persona deterministically given the same inputs. | UC-GEN-012 | Must | TEST-GEN-040 |
| FR-GEN-041 | Simulation MUST refuse to run if Spec Completeness < 10% with reason `SPEC_TOO_THIN`. | UC-GEN-012 | Must | TEST-GEN-041 |
| FR-GEN-050 | Leaderboard MUST sort by Readiness Score (desc), with ties broken by Investor Demand (desc). | UC-GEN-013 | Must | TEST-GEN-050 |
| FR-GEN-060 | Admin MUST be able to set scoring weights; weights MUST sum to 1.0 ± 0.01. | UC-GEN-014 | Must | TEST-GEN-060 |
| FR-GEN-061 | Admin MUST be able to toggle self-invest policy per batch. | UC-GEN-014 | Must | TEST-GEN-061 |

### 2.6 Non-Functional Requirements Register

| NFR ID | Category | Requirement | Verification |
|---|---|---|---|
| NFR-GEN-001 | Usability | Login → first dashboard render < 2 s on a mid-laptop, no real network. | Manual + RTL render timing |
| NFR-GEN-002 | Reliability | All state mutations are pure functions of `(state, action)` so they are unit-testable. | Unit tests on reducers |
| NFR-GEN-003 | Maintainability | Domain logic lives under `web/src/domain/` and is framework-agnostic. | Code review |
| NFR-GEN-004 | Observability | Every domain action returns a structured result (`ok` / `error.reason`); UI surfaces `reason` verbatim. | Unit tests on results |
| NFR-GEN-005 | Data Integrity | Investments are idempotent under the same `(investor, startup, txnId)`. | Unit test |
| NFR-GEN-006 | Accessibility | All interactive elements reachable via keyboard; minimum WCAG AA contrast on the neon theme. | Manual + axe-style checks |
| NFR-GEN-007 | Performance | Marketplace renders 50 startup cards under 100 ms (no animations) on a mid-laptop. | Benchmark in dev |
| NFR-GEN-008 | Security | The allowlist check is enforced in the domain layer, not only in UI. | Unit test |

### 2.7 Traceability Matrix (selected; full matrix in §5)

| FR | UC | Story | Feature | Scenario | Test |
|---|---|---|---|---|---|
| FR-GEN-001 | UC-GEN-001 | STORY-GEN-002 | FEAT-GEN-001 | SCN-GEN-001 | TEST-GEN-001 |
| FR-GEN-031 | UC-GEN-011 | STORY-GEN-011 | FEAT-GEN-011 | SCN-GEN-031 | TEST-GEN-031 |
| FR-GEN-040 | UC-GEN-012 | STORY-GEN-012 | FEAT-GEN-012 | SCN-GEN-040 | TEST-GEN-040 |
| FR-GEN-022 | UC-GEN-008 | STORY-GEN-008 | FEAT-GEN-008 | SCN-GEN-050 | TEST-GEN-050 |

---

## Stage 3 — Solution Architecture Draft

### 3.1 Architecture Summary

For MVP, Genesis Studio is delivered as a **single-page React application** with a clearly separated **framework-agnostic domain layer**. There is no backend; persistence is in-memory plus `localStorage`. AI Analyst and Persona Simulator are **deterministic mocks** living in the AI Service Layer behind interfaces (`AiAnalystPort`, `PersonaSimulatorPort`) so V1 can swap real LLMs in without touching the UI or domain.

### 3.2 Project Structure

```
/genesys
  /SPEC_v0.1.md                  # this document
  /web                           # React MVP
    /src
      /domain                    # framework-agnostic, pure TS
        ids.ts                   # ID generator (`FEAT-GEN-001` etc.)
        types.ts                 # Entity types
        scoring.ts               # readiness, persona, weights
        traceability.ts          # FR↔Test coverage
        spec.ts                  # spec hierarchy CRUD
        investments.ts           # credit logic
        allowlist.ts             # allowlist check
      /ai
        analyst.ts               # deterministic mock interview
        personas.ts              # deterministic mock simulator
        ports.ts                 # interfaces
      /data
        store.ts                 # in-memory + localStorage adapter
        seed.ts                  # demo seed data
      /ui
        /design                  # tokens, primitives
        /components              # cards, chips, layout
        /screens                 # one folder per screen
        /hooks                   # useStore, useScoring
      /tests                     # unit tests live next to code (*.test.ts)
    /vitest.config.ts
    /package.json
    /index.html
```

### 3.3 Layered Architecture

| Layer | Folder | Responsibility |
|---|---|---|
| Client | `src/ui` | Screens, components, navigation. No business rules. |
| Service | `src/domain` | Business rules: spec, scoring, credits, allowlist, traceability. Pure functions over plain data. |
| AI Service | `src/ai` | Analyst + persona simulator behind ports. Deterministic in MVP. |
| Data | `src/data` | Persistence adapter. In-memory + `localStorage`. |
| Infrastructure | `vite`, `vitest`, build config | Build, dev server, test runner. |
| Test | `**/*.test.ts(x)` | Vitest + React Testing Library. |

### 3.4 Client Layer (screens)

| Screen | Route | Use Cases | Primary actions |
|---|---|---|---|
| Landing | `/` | — | Show value prop · Login CTA |
| Login | `/login` | UC-GEN-001 | Submit GitHub handle (mocked) |
| Denied | `/denied` | UC-GEN-001 | Show batch + admin contact |
| Founder Dashboard | `/app` | UC-GEN-003, UC-GEN-008 | List startups · Open one · Create one |
| Create Startup | `/app/new` | UC-GEN-003 | Name, pitch, category |
| AI Interview | `/app/startups/:id/interview` | UC-GEN-004 | Q&A → generate spec |
| Spec Workspace | `/app/startups/:id/spec` | UC-GEN-005, UC-GEN-006 | CRUD on spec tree · Trace matrix view |
| Repository | `/app/startups/:id/repo` | UC-GEN-007 | Attach `owner/repo`, view `/genesis/*` plan |
| Health | `/app/startups/:id/health` | UC-GEN-008, UC-GEN-012 | Scores · Run simulation |
| Showcase | `/app/startups/:id/showcase` | UC-GEN-009 | Public preview · Publish toggle |
| Marketplace | `/app/marketplace` | UC-GEN-010, UC-GEN-011 | Browse · Invest |
| Leaderboard | `/app/leaderboard` | UC-GEN-013 | Ranking |
| Admin | `/admin` | UC-GEN-002, UC-GEN-014 | Allowlist · Weights · Self-invest policy |

State management: a single `useStore()` hook backed by `data/store.ts`. Reducers are pure functions in `domain/`. UI dispatches actions and reads selectors.

### 3.5 Service Layer (key contracts)

```ts
// scoring.ts
export type ScoringWeights = {
  specCompleteness: number;   // 0.20 default
  testPassRate:     number;   // 0.15
  techExecution:    number;   // 0.15
  personaSatisfaction: number;// 0.20
  investorDemand:   number;   // 0.15
  marketPotential:  number;   // 0.10
  pitchScore:       number;   // 0.05
};

export type ReadinessInputs = {
  specCompleteness: number; testPassRate: number; techExecution: number;
  personaSatisfaction: number; investorDemand: number; marketPotential: number; pitchScore: number;
};

export const DEFAULT_WEIGHTS: ScoringWeights = { specCompleteness:.20, testPassRate:.15, techExecution:.15, personaSatisfaction:.20, investorDemand:.15, marketPotential:.10, pitchScore:.05 };
export function validateWeights(w: ScoringWeights): { ok: true } | { ok: false; reason: string };
export function readinessScore(i: ReadinessInputs, w?: ScoringWeights): number; // 0..100
```

```ts
// investments.ts
export type InvestResult =
  | { ok: true; investorBalance: number; startupDemand: number }
  | { ok: false; reason: 'INSUFFICIENT_CREDITS' | 'SELF_INVEST_FORBIDDEN' | 'INVALID_AMOUNT' | 'STARTUP_NOT_PUBLISHED' };

export function invest(state, action): InvestResult;
```

```ts
// allowlist.ts
export function canLogin(handle: string, allowlist: string[]): boolean;
```

```ts
// traceability.ts
export type Coverage = { fr: string; tests: string[]; status: 'COVERED' | 'MISSING' };
export function buildTraceability(spec): Coverage[];
export function tracePercent(spec): number; // 0..100
```

### 3.6 AI Service Layer

`ai/ports.ts`:

```ts
export interface AiAnalystPort {
  interview(input: { idea: string; answers: Record<string, string> }): SpecDraft;
}
export interface PersonaSimulatorPort {
  simulate(input: { startup: Startup; personas: PersonaId[] }): PersonaResult[];
}
```

`ai/analyst.ts` (MVP) is deterministic — given the same input it returns the same spec draft. It uses keyword expansion + templates to produce ≥ 3 features / stories / use cases / scenarios / FRs / 1 NFR.

`ai/personas.ts` (MVP) computes scores from spec completeness, trace coverage and test pass rate using a per-persona linear formula with bounded noise = 0 (deterministic in MVP).

### 3.7 Data Layer

Entities (minimal MVP set):

```
User           { id, handle, name, role: 'admin'|'founder'|'student' }
Batch          { id, name, allowlist: handle[], creditsPerInvestor, selfInvestPolicy, weights }
Startup        { id, batchId, ownerHandle, name, pitch, category, published, repo?: 'owner/repo' }
ProductSpec    { startupId, features[], stories[], flows[], useCases[], scenarios[], frs[], nfrs[], tests[] }
SpecNode       { id, kind, parentIds[], title, body, status, links: {tests: string[], ucs: string[], frs:string[]} }
Investment     { id, batchId, investorHandle, startupId, amount, createdAt }
SimulationRun  { id, startupId, personas, results: { personaId, score, notes }[], createdAt }
Score          { startupId, specCompleteness, testPassRate, techExecution, personaSatisfaction, investorDemand, marketPotential, pitchScore, readiness }
```

ERD:

```
erDiagram
  USER ||--o{ STARTUP : owns
  BATCH ||--o{ STARTUP : contains
  BATCH ||--o{ INVESTMENT : ledger
  USER ||--o{ INVESTMENT : makes
  STARTUP ||--|| PRODUCTSPEC : has
  STARTUP ||--o{ SIMULATIONRUN : evaluated_by
  PRODUCTSPEC ||--o{ SPECNODE : nodes
  STARTUP ||--|| SCORE : current
```

### 3.8 Architecture Decisions (ADRs)

**ADR-001 — Framework-agnostic domain layer.** Context: TDD requires testable rules. Decision: keep `domain/` pure TS with no React imports. Consequences: easy unit tests; UI can be rewritten without touching rules.

**ADR-002 — Deterministic mocks behind ports for AI.** Context: real LLMs add cost, latency, and flakiness. Decision: ship `AiAnalystPort` and `PersonaSimulatorPort` mocks for MVP. Consequences: tests are fast and stable; real LLM is a drop-in replacement.

**ADR-003 — In-memory + `localStorage` persistence.** Context: no backend for MVP. Decision: `data/store.ts` is the only place that knows about persistence. Consequences: trivially swappable for Postgres/Supabase later.

**ADR-004 — Vite + React + TypeScript + Tailwind + Vitest + React Testing Library + React Router.** Context: standard, fast, well-supported. Consequences: minimal yak-shaving; design tokens live in Tailwind config.

**ADR-005 — Dark Neon design system.** Context: brand direction. Decision: bento-style cards, neon yellow primary `#F9F871`-ish, soft blue secondary, WCAG-AA contrast. Tokens live in `ui/design/tokens.ts` and `tailwind.config.ts`.

### 3.9 Risks

| Risk | Category | Mitigation |
|---|---|---|
| Mock AI Analyst is too rigid to feel useful. | AI quality | Deterministic but templated by category. Real LLM in V1. |
| Frontend-only persistence loses data on browser clear. | Data | Surface a clear warning + "Export JSON" button. |
| Scoring weights misconfigured (don't sum to 1). | Product | Validate at edit time; reject save. |
| Self-invest abuse. | Game | Policy enforced in domain layer, not only UI. |

---

## Stage 4 — Test Strategy Draft

### 4.1 Approach

- TDD: write `*.test.ts(x)` before implementation for every domain module.
- Requirements-first: every Must-have FR has at least one `TEST-GEN-*` mapping.
- BDD-to-tests: every `SCN-GEN-*` has at least one Vitest test exercising it.
- Automation-first: only critical exploratory checks (visual neon contrast, vibe) remain manual.

### 4.2 Levels and tools

| Level | Tool | Folder |
|---|---|---|
| Unit | Vitest | `web/src/**/*.test.ts` |
| Component | Vitest + React Testing Library | `web/src/ui/**/*.test.tsx` |
| Integration | Vitest with store wiring | `web/src/ui/screens/__tests__/*.test.tsx` |
| Manual smoke | Browser dev | — |

### 4.3 Coverage by layer (targets)

| Layer | Min coverage of Must-have items |
|---|---|
| Domain | 100% of FRs with ≥1 test |
| AI Service mocks | All scenarios SCN-GEN-040..041 |
| UI critical components | Buttons, Card, StatusChip, ScoreRing rendered tests |
| Screen smoke | Dashboard, Marketplace, Spec Workspace render without crash |

### 4.4 Test Cases — Requirements-to-Tests Matrix

| Test ID | Type | FR | Scenario | What it asserts |
|---|---|---|---|---|
| TEST-GEN-001 | Unit | FR-GEN-001 | SCN-GEN-001 | `canLogin('alice', ['alice','bob']) === true` |
| TEST-GEN-002 | Unit | FR-GEN-001/002 | SCN-GEN-002 | `canLogin('carol', ['alice','bob']) === false` |
| TEST-GEN-003 | Unit | FR-GEN-003 | — | Admin add/remove allowlist updates batch |
| TEST-GEN-004 | Unit | FR-GEN-004 | — | Creating startup w/o pitch fails with `MISSING_PITCH` |
| TEST-GEN-005 | Unit | FR-GEN-005 | — | Duplicate name in batch rejected with `DUPLICATE_NAME` |
| TEST-GEN-006 | Unit | FR-GEN-006 | — | Mock interview yields ≥3 features / stories / UCs / scenarios / FRs / 1 NFR |
| TEST-GEN-007 | Component | FR-GEN-007 | — | Generated spec rendered & editable in workspace |
| TEST-GEN-010 | Unit | FR-GEN-010 | — | `nextId('FEAT')` is monotonic and zero-padded |
| TEST-GEN-011 | Unit | FR-GEN-011 | — | CRUD on spec nodes preserves IDs and parents |
| TEST-GEN-012 | Unit | FR-GEN-012 | — | Linking FR → Test → UC is reflected in trace matrix |
| TEST-GEN-013 | Unit | FR-GEN-013 | — | `buildTraceability` reports `MISSING` for FRs without tests |
| TEST-GEN-014 | Unit | FR-GEN-014 | — | `attachRepo('o/r')` stores normalized `owner/repo`; invalid form rejected |
| TEST-GEN-020 | Component | FR-GEN-020 | — | Health Dashboard renders four scores |
| TEST-GEN-021 | Unit | FR-GEN-021 | — | Spec completeness formula matches definition |
| TEST-GEN-022 | Unit | FR-GEN-022 | SCN-GEN-050 | Readiness score uses default weights correctly |
| TEST-GEN-023 | Component | FR-GEN-023 | — | Showcase card shows all mandatory fields |
| TEST-GEN-024 | Component | FR-GEN-024 | — | Marketplace lists only published startups in batch |
| TEST-GEN-030 | Unit | FR-GEN-030 | SCN-GEN-030 | New investor balance = batch.credits |
| TEST-GEN-031 | Unit | FR-GEN-031 | SCN-GEN-031 | Overspend rejected with `INSUFFICIENT_CREDITS` |
| TEST-GEN-032 | Unit | FR-GEN-032 | SCN-GEN-032 | Self-invest under `FORBIDDEN` rejected with reason |
| TEST-GEN-033 | Unit | FR-GEN-033 | — | Portfolio value adds simulation bonus factor |
| TEST-GEN-040 | Unit | FR-GEN-040 | SCN-GEN-040/041 | Persona simulator deterministic across calls |
| TEST-GEN-041 | Unit | FR-GEN-041 | — | Simulation refuses with `SPEC_TOO_THIN` < 10% completeness |
| TEST-GEN-050 | Unit | FR-GEN-050 | SCN-GEN-050 | Leaderboard sort: readiness desc, demand tiebreak |
| TEST-GEN-060 | Unit | FR-GEN-060 | — | `validateWeights` rejects non-summing-to-1 weights |
| TEST-GEN-061 | Unit | FR-GEN-061 | — | Toggling self-invest policy persists and is read by `invest` |

### 4.5 Quality Gates

Before merge:
- All `web/src/domain/**` tests pass.
- All `web/src/ui/**` component tests pass.
- `tsc --noEmit` is clean.
- `vite build` succeeds.

Before demo:
- Above gates plus Health Dashboard renders for the seeded demo batch with non-trivial values.

---

## Stage 5 — Project Delivery Plan

### 5.1 Delivery Scope

| Scope item | Type | Priority |
|---|---|---|
| FEAT-GEN-001..014 | MVP | Must |
| Real GitHub OAuth + API | V1 | Should |
| Real LLM-backed analyst | V1 | Should |
| Browser-automation persona runs | V1 | Could |
| Multi-batch concurrency | V2 | Could |

### 5.2 WBS

```
EPIC-GEN-001 Authentication & Batch
  FEAT-GEN-001 Allowlist login        → TASK-001..002
  FEAT-GEN-002 Batch management       → TASK-003

EPIC-GEN-002 Spec Creation
  FEAT-GEN-003 Startup CRUD           → TASK-004..005
  FEAT-GEN-004 AI Analyst interview   → TASK-006..007
  FEAT-GEN-005 Spec workspace         → TASK-008..012
  FEAT-GEN-006 Traceability           → TASK-013..014

EPIC-GEN-003 Integration & Health
  FEAT-GEN-007 GitHub repo attach     → TASK-015
  FEAT-GEN-008 Health dashboard       → TASK-016..018

EPIC-GEN-004 Market Layer
  FEAT-GEN-009 Showcase               → TASK-019..020
  FEAT-GEN-010 Marketplace            → TASK-021
  FEAT-GEN-011 Credits & Investment   → TASK-022..025
  FEAT-GEN-012 Persona simulation     → TASK-026..027
  FEAT-GEN-013 Leaderboard            → TASK-028

EPIC-GEN-005 Admin
  FEAT-GEN-014 Admin & scoring        → TASK-029..030
```

### 5.3 Backlog (MVP, abridged)

| Task | Layer | Test first | AC |
|---|---|---|---|
| TASK-001 | Domain | TEST-GEN-001/002 | `canLogin` implemented |
| TASK-003 | Domain | TEST-GEN-003 | Allowlist CRUD reducer |
| TASK-006 | AI | TEST-GEN-006 | Mock analyst yields min counts |
| TASK-008 | Domain | TEST-GEN-010..013 | Spec node CRUD + IDs |
| TASK-013 | Domain | TEST-GEN-013 | `buildTraceability` |
| TASK-016 | Domain | TEST-GEN-021/022 | Spec completeness + readiness |
| TASK-022 | Domain | TEST-GEN-030..033 | Invest reducer w/ reasons |
| TASK-026 | AI | TEST-GEN-040/041 | Persona simulator |
| TASK-028 | Domain | TEST-GEN-050 | Leaderboard sort |
| TASK-029 | Domain | TEST-GEN-060/061 | Weights validation, self-invest toggle |
| TASK-030 | UI | (component tests) | Admin screen wired |
| TASK-009..012 | UI | screen renders | Spec Workspace functional |
| TASK-019..021 | UI | renders | Showcase + Marketplace |
| TASK-017..018 | UI | renders | Health Dashboard wired |
| TASK-027 | UI | smoke | Run simulation button |

### 5.4 Definition of Ready

A task is Ready when it has: linked FR(s), linked TEST(s), target file path, AC, and no blocking open question.

### 5.5 Definition of Done

A task is Done when: tests written first, all linked tests pass, `tsc --noEmit` clean, code lives in the correct layer, and the traceability matrix reflects new IDs.

### 5.6 Roadmap

| Sprint | Goal | Exit criteria |
|---|---|---|
| S0 | Bootstrap Vite/TS/Tailwind/Vitest + design tokens | `pnpm test` green on stub tests; landing renders |
| S1 | Auth + Batch + Startup CRUD + Mock Analyst | TEST-GEN-001..007 pass |
| S2 | Spec Workspace + Traceability | TEST-GEN-010..014 + 020..023 pass |
| S3 | Marketplace + Credits + Persona Sim + Leaderboard + Admin | TEST-GEN-024..061 pass |
| S4 | Polish, accessibility, seed demo data | Visual QA on neon theme; demo-ready |

### 5.7 Traceability Matrix (master)

| Feature | User Story | Use Case | Scenario | FR | NFR | Test | Task |
|---|---|---|---|---|---|---|---|
| FEAT-GEN-001 | STORY-GEN-002 | UC-GEN-001 | SCN-GEN-001, SCN-GEN-002 | FR-GEN-001, FR-GEN-002 | NFR-GEN-008 | TEST-GEN-001, 002 | TASK-001, 002 |
| FEAT-GEN-002 | STORY-GEN-001 | UC-GEN-002 | — | FR-GEN-003 | — | TEST-GEN-003 | TASK-003 |
| FEAT-GEN-003 | STORY-GEN-003 | UC-GEN-003 | — | FR-GEN-004, FR-GEN-005 | NFR-GEN-002 | TEST-GEN-004, 005 | TASK-004, 005 |
| FEAT-GEN-004 | STORY-GEN-004 | UC-GEN-004 | — | FR-GEN-006, FR-GEN-007 | — | TEST-GEN-006, 007 | TASK-006, 007 |
| FEAT-GEN-005 | STORY-GEN-005 | UC-GEN-005 | — | FR-GEN-010..012 | NFR-GEN-003 | TEST-GEN-010..012 | TASK-008..012 |
| FEAT-GEN-006 | STORY-GEN-006 | UC-GEN-006 | — | FR-GEN-013 | — | TEST-GEN-013 | TASK-013, 014 |
| FEAT-GEN-007 | STORY-GEN-007 | UC-GEN-007 | — | FR-GEN-014 | — | TEST-GEN-014 | TASK-015 |
| FEAT-GEN-008 | STORY-GEN-008 | UC-GEN-008 | SCN-GEN-050 | FR-GEN-020..022 | NFR-GEN-007 | TEST-GEN-020..022, 050 | TASK-016..018 |
| FEAT-GEN-009 | STORY-GEN-009 | UC-GEN-009 | — | FR-GEN-023 | NFR-GEN-006 | TEST-GEN-023 | TASK-019..020 |
| FEAT-GEN-010 | STORY-GEN-010 | UC-GEN-010 | — | FR-GEN-024 | — | TEST-GEN-024 | TASK-021 |
| FEAT-GEN-011 | STORY-GEN-011 | UC-GEN-011 | SCN-GEN-030..032 | FR-GEN-030..033 | NFR-GEN-005 | TEST-GEN-030..033 | TASK-022..025 |
| FEAT-GEN-012 | STORY-GEN-012 | UC-GEN-012 | SCN-GEN-040..041 | FR-GEN-040, FR-GEN-041 | — | TEST-GEN-040, 041 | TASK-026, 027 |
| FEAT-GEN-013 | STORY-GEN-013 | UC-GEN-013 | SCN-GEN-050 | FR-GEN-050 | — | TEST-GEN-050 | TASK-028 |
| FEAT-GEN-014 | STORY-GEN-014 | UC-GEN-014 | — | FR-GEN-060, FR-GEN-061 | — | TEST-GEN-060, 061 | TASK-029, 030 |

---

## 6. Scoring Formulas (canonical)

```
Spec Completeness =
  (filled_mandatory_nodes / required_mandatory_nodes) * 100

Trace Coverage =
  (FRs_with_at_least_one_test / total_FRs) * 100

Test Pass Rate =
  (passing_tests / total_tests) * 100        // = 100 if total_tests == 0 and Spec Completeness < 50, else 0

Persona Satisfaction (mock, deterministic):
  base = 0.4*SpecCompleteness + 0.3*TraceCoverage + 0.2*TestPassRate + 0.1*TechExecution
  per_persona_bias = { impatient: -5, technical: +0, skeptical_investor: -10, power_user: +5, confused_first_time: -7 }
  score_i = clamp(base + per_persona_bias[i], 0, 100)
  mean = average(score_i)

Investor Demand (normalized 0..100 within batch):
  demand_i = (credits_invested_into_startup_i / max_credits_invested_into_any_startup_in_batch) * 100

Readiness =
  w.specCompleteness * SpecCompleteness
+ w.testPassRate     * TestPassRate
+ w.techExecution    * TechExecution
+ w.personaSatisfaction * PersonaSatisfaction
+ w.investorDemand   * InvestorDemand
+ w.marketPotential  * MarketPotential
+ w.pitchScore       * PitchScore
  // weights sum to 1 ± 0.01, validated by validateWeights()
```

The example scenario `SCN-GEN-050` (defaults: 0.20, 0.15, 0.15, 0.20, 0.15, 0.10, 0.05) with inputs 80,90,70,60,40,50,50 yields:

`0.20*80 + 0.15*90 + 0.15*70 + 0.20*60 + 0.15*40 + 0.10*50 + 0.05*50 = 16 + 13.5 + 10.5 + 12 + 6 + 5 + 2.5 = 65.5`

(Note: the BDD example uses 67.5 — the test that authoritatively defines the formula is `TEST-GEN-022`. Discrepancy intentionally documented as Open Question OQ-001 below; the implementation will match the formula above and `TEST-GEN-022` updated accordingly.)

### 6.1 Open Questions (Spec)

| ID | Question | Resolution path |
|---|---|---|
| OQ-001 | The BDD example `SCN-GEN-050` shows 67.5 while the canonical formula yields 65.5. | Trust the formula; rewrite `SCN-GEN-050` expectation to 65.5 in implementation/test. |

---

## 7. Meta-Methodology — Genesis as a CLAUDE.md Executor

Genesis Studio is **not just inspired by** the CLAUDE.md Execution Kernel — it **implements** it. The product itself is a CLAUDE.md runtime that founders use to operate their own startup.

### 7.1 Implications

1. **Artifact Registry is a first-class entity in the product.** Each startup's spec hierarchy is rendered as an Artifact Registry table (`ART-XX → name, version, status, prerequisites, owner, allowed next`).
2. **Spec is versioned, never overwritten.** When a node (Feature/Story/UC/Scenario/FR/NFR/Test) changes meaningfully, a new version is created and the previous one is marked `DEPRECATED` / `REPLACED`.
3. **Every change shows a visible diff.** The UI surfaces "what changed, why, evidence, impacted downstream artifacts".
4. **Architecture is live Mermaid.** ERD, layered diagrams and data-flow diagrams are rendered from the same source data, so editing an entity updates the diagram immediately.
5. **Modes are explicit.** A startup carries a current Mode (MODE-1 PRD → MODE-2 BRS → MODE-3 Arch → MODE-4 Tests → MODE-5 Plan → MODE-6 Build, plus MODE-8 Brownfield CR). The dashboard shows which modes are unlocked.
6. **Statuses are explicit.** Each artifact carries one of: `DRAFT · REVIEW_READY · APPROVED · UPDATED · DEPRECATED · REPLACED · OBSOLETE · BLOCKED · PARTIAL · FINAL`.
7. **Single entry point: GitHub.** The only authentication path for MVP is GitHub. All routes other than `/`, `/login`, `/denied` are guarded.

### 7.2 New MVP features driven by §7.1

| ID | Feature | User | Value | Priority |
|---|---|---|---|---|
| FEAT-GEN-015 | Spec Version & Change Diff View | Founder, Admin | "What changed in my product spec, when, and why" — auditable | Must |
| FEAT-GEN-016 | Live Mermaid Architecture (ERD + Layers + Data Flow) | Founder, Developer | Diagram stays in sync with the model | Must |
| FEAT-GEN-017 | Mode/Status Tracker (CLAUDE.md modes) | Founder | Knows which stage is unlocked next | Must |
| FEAT-GEN-018 | GitHub-only Auth Gate (everywhere except landing/denied) | All | Single trust source | Must |

### 7.3 New user stories

| ID | Story | Feature |
|---|---|---|
| STORY-GEN-015 | As a Founder, I want to see a version history with diffs on each spec node so that I trust what changed. | FEAT-GEN-015 |
| STORY-GEN-016 | As a Developer, I want a live Mermaid diagram of layers and ERD that updates when I edit entities so that the diagram never lies. | FEAT-GEN-016 |
| STORY-GEN-017 | As a Founder, I want to see which CLAUDE.md mode I'm in and what's unlocked next so that I follow the methodology. | FEAT-GEN-017 |
| STORY-GEN-018 | As any user, I want GitHub to be the only login so that identity is unambiguous. | FEAT-GEN-018 |

### 7.4 New use cases

#### UC-GEN-015: View spec change diff
- Actor: Founder
- Trigger: opens "History" on any spec node or product spec root
- Main: list versions (`v1, v2…`) → click a version → see field-level diff (old → new) and a short `reason`
- Postcondition: no mutation; pure read
- Related: FR-GEN-070..072
- Tests: TEST-GEN-070..072

#### UC-GEN-016: Live architecture (Mermaid)
- Actor: Developer/Founder
- Trigger: opens "Architecture" tab
- Main: system renders ERD from current entities, Layered diagram from current components, Data Flow diagram from current flows; switching tabs updates source code panel
- Alt: copy Mermaid source to clipboard
- Postcondition: read-only render
- Related: FR-GEN-080..082
- Tests: TEST-GEN-080..082

#### UC-GEN-017: Mode tracker
- Actor: Founder
- Trigger: views Founder Dashboard
- Main: current mode is highlighted; future modes locked with explanation of unmet prerequisite
- Related: FR-GEN-090..091
- Tests: TEST-GEN-090..091

#### UC-GEN-018: GitHub-only entry
- Actor: any
- Trigger: visits any protected route without session
- Main: redirected to `/login`
- Related: FR-GEN-100
- Tests: TEST-GEN-100

### 7.5 New Functional Requirements

| FR ID | Requirement | UC | Test |
|---|---|---|---|
| FR-GEN-070 | Editing any spec node MUST create a new version with `version++`, `status=UPDATED` for the new and `status=REPLACED` for the previous. | UC-GEN-015 | TEST-GEN-070 |
| FR-GEN-071 | Each version MUST record `changedFields[]`, `reason`, `timestamp`, `author`. | UC-GEN-015 | TEST-GEN-071 |
| FR-GEN-072 | Diff view MUST display added, removed, and modified fields. | UC-GEN-015 | TEST-GEN-072 |
| FR-GEN-080 | Architecture view MUST render Mermaid ERD from `entities[]`. | UC-GEN-016 | TEST-GEN-080 |
| FR-GEN-081 | Architecture view MUST render layered diagram from `components[].layer`. | UC-GEN-016 | TEST-GEN-081 |
| FR-GEN-082 | Editing an entity name MUST reflect in the next diagram render (same source of truth). | UC-GEN-016 | TEST-GEN-082 |
| FR-GEN-090 | The system MUST track current mode of each startup: `MODE-1 .. MODE-6, MODE-8`. | UC-GEN-017 | TEST-GEN-090 |
| FR-GEN-091 | A mode MUST report `BLOCKED` with a reason when its prerequisites are absent (e.g. MODE-3 requires ≥1 use case). | UC-GEN-017 | TEST-GEN-091 |
| FR-GEN-100 | Any route under `/app/**` and `/admin/**` without a `Session` MUST redirect to `/login`. | UC-GEN-018 | TEST-GEN-100 |

### 7.6 Updated screens (additions)

| Screen | Route | Purpose |
|---|---|---|
| Architecture | `/app/startups/:id/architecture` | Live Mermaid ERD / Layered / Data-Flow diagrams from the current model |
| History | `/app/startups/:id/history` | Spec versions + diffs across nodes |
| (Modified) Founder Dashboard | `/app` | Now displays Mode tracker per startup |
| (Modified) Login | `/login` | Explicit "GitHub is the only entry point" copy |

### 7.7 Spec versioning model

```
SpecNode {
  id: string;                  // FEAT-GEN-001
  kind: 'FEATURE'|'STORY'|...
  version: number;             // 1, 2, 3...
  status: ArtifactStatus;      // DRAFT|UPDATED|REPLACED|DEPRECATED|...
  title: string;
  body: string;
  prevVersionId?: string;      // pointer to previous version
  links: { tests:[], ucs:[], frs:[] };
  changedFields?: string[];    // populated on update
  reason?: string;             // why it changed
  author?: string;             // handle
  updatedAt: number;
}
```

### 7.8 Updated traceability matrix (additions)

| Feature | Story | UC | FR | Test |
|---|---|---|---|---|
| FEAT-GEN-015 | STORY-GEN-015 | UC-GEN-015 | FR-GEN-070..072 | TEST-GEN-070..072 |
| FEAT-GEN-016 | STORY-GEN-016 | UC-GEN-016 | FR-GEN-080..082 | TEST-GEN-080..082 |
| FEAT-GEN-017 | STORY-GEN-017 | UC-GEN-017 | FR-GEN-090..091 | TEST-GEN-090..091 |
| FEAT-GEN-018 | STORY-GEN-018 | UC-GEN-018 | FR-GEN-100 | TEST-GEN-100 |

---

## 8. Handoff to Stage 6 — TDD Implementation

Implementation proceeds in `web/` per §5.6 Roadmap. The test suite is the contract: each FR is paired with a `TEST-GEN-*` and each Must-have feature has at least one component test. §7 additions (versioning, Mermaid, mode tracker, auth gate) are implemented alongside their tests in S1–S3.

---

## 9. Feed, Hashtags, Search & Repo-Driven Onboarding (added 2026-05-14)

This section captures requirements driven by user feedback on the public Landing and the onboarding flow.

### 9.1 New features

| ID | Feature | User | Value | Priority |
|---|---|---|---|---|
| FEAT-GEN-019 | Hashtags per startup (multi-tag, user-extendable) | Founder, Viewer | Replace single category with rich AI-app taxonomy | Must |
| FEAT-GEN-020 | Search across the public feed | Viewer | Find a startup by name/pitch/description/tag | Must |
| FEAT-GEN-021 | Multi-select hashtag filter (AND intersection) | Viewer | Narrow down quickly with 2+ tags | Must |
| FEAT-GEN-022 | Carousel controls rendered OUTSIDE the slide frame | Viewer | Cleaner visual; arrows do not occlude content | Should |
| FEAT-GEN-023 | Mocked GitHub OAuth → repository picker after login | Founder | Match the real OAuth UX; user picks the repo to start from | Must |
| FEAT-GEN-024 | Repo scan: detect `/genesys/spec` and `/genesys/tests` | Founder, Developer | Auto-import if present; offer to generate otherwise | Must |
| FEAT-GEN-025 | Repo scan widget inside the Founder's product admin (Repo tab) | Founder | Single place to see "spec found / tests found" and act | Should |

### 9.2 New user stories

| ID | Story | Feature |
|---|---|---|
| STORY-GEN-019 | As a Founder, I want to attach many hashtags to my startup so that it shows up in the right slices of the feed. | FEAT-GEN-019 |
| STORY-GEN-020 | As a Viewer, I want a search box on the feed so that I can find a specific product without scrolling. | FEAT-GEN-020 |
| STORY-GEN-021 | As a Viewer, I want to combine hashtags so that I can find e.g. `#image #b2b` startups in one click. | FEAT-GEN-021 |
| STORY-GEN-022 | As a Viewer, I want carousel arrows outside the cover so that the visual reads cleaner. | FEAT-GEN-022 |
| STORY-GEN-023 | As a Founder, after I authenticate with GitHub I want to pick a repository so that the studio works against real code. | FEAT-GEN-023 |
| STORY-GEN-024 | As a Founder/Developer, I want the studio to detect existing spec/tests in my repo so that the dashboard imports them automatically. | FEAT-GEN-024 |
| STORY-GEN-025 | As a Founder, I want the scan status visible in the Repo tab so that I always know whether import or generation is required. | FEAT-GEN-025 |

### 9.3 New use cases (brief)

- **UC-GEN-019 — Add/edit hashtags.** Actor: Founder. Hashtags are normalized (lowercase, `kebab-case`, no `#`). 0..N per startup. Stored as `Startup.hashtags`.
- **UC-GEN-020 — Search feed.** Case-insensitive substring across `name`, `pitch`, `description` and `hashtags`. Empty query returns all.
- **UC-GEN-021 — Multi-select filter.** Selecting `tags = [t1, t2]` returns startups whose `hashtags` is a superset of `{t1, t2}` (AND intersection).
- **UC-GEN-022 — Carousel controls.** Prev/Next live in a wrapper grid `[btn | slide | btn]`, not absolutely positioned on the slide. The slide's rounded `[32px]` border is unobscured.
- **UC-GEN-023 — Onboarding repo pick.** After successful (mocked) GitHub login, a founder with zero startups is routed to `/onboarding/repo` to pick from a mocked repo list. Picking a repo with a detected spec auto-creates a startup imported from that repo; picking an empty repo routes to the AI Interview.
- **UC-GEN-024 — Repo scan.** `scanRepo(repo)` returns `{ kind: 'found', specPath, testCount, nodeCount }` or `{ kind: 'partial' }` or `{ kind: 'missing' }`. Deterministic.
- **UC-GEN-025 — Repo scan widget.** Repo tab inside Startup admin renders the scan result and an "Import detected spec" or "Generate spec" CTA accordingly.

### 9.4 New Functional Requirements

| FR ID | Requirement | UC | Test |
|---|---|---|---|
| FR-GEN-110 | `Startup` MUST carry `hashtags: string[]`; hashtags are normalized (lowercased, kebab-cased, no leading `#`). | UC-GEN-019 | TEST-GEN-110 |
| FR-GEN-111 | Multi-select filter MUST return startups whose hashtags contain ALL selected tags. | UC-GEN-021 | TEST-GEN-111 |
| FR-GEN-112 | The popular-tags list MUST be sorted by usage frequency, descending. | UC-GEN-021 | TEST-GEN-112 |
| FR-GEN-120 | Search MUST be a case-insensitive substring match across `name`, `pitch`, `description`, and `hashtags`. | UC-GEN-020 | TEST-GEN-120 |
| FR-GEN-121 | Empty search query MUST return the input set unchanged. | UC-GEN-020 | TEST-GEN-121 |
| FR-GEN-130 | Carousel prev/next controls MUST live outside the slide frame (sibling, not descendant). | UC-GEN-022 | covered by visual review (NFR-GEN-006) |
| FR-GEN-140 | `scanRepo` MUST classify a repo as `found` when both `hasSpec` and `hasTests` are true; `partial` when exactly one is true; `missing` otherwise. | UC-GEN-024 | TEST-GEN-140 |
| FR-GEN-141 | After a successful login, a session-holder with zero startups MUST be redirected to `/onboarding/repo`. | UC-GEN-023 | TEST-GEN-141 |
| FR-GEN-142 | Picking a repo with `kind=found` MUST create a startup populated from the repo metadata and route to the Spec workspace. | UC-GEN-023, UC-GEN-024 | TEST-GEN-142 |
| FR-GEN-143 | Picking a repo with `kind=missing` or `kind=partial` MUST route to a flow that generates a new spec (AI Interview). | UC-GEN-023, UC-GEN-024 | TEST-GEN-143 |
| FR-GEN-150 | The Repo tab MUST render the live scan result (kind, paths) for the attached repo. | UC-GEN-025 | TEST-GEN-150 |

### 9.5 Updated traceability matrix (additions)

| Feature | Story | UC | FR | Test |
|---|---|---|---|---|
| FEAT-GEN-019 | STORY-GEN-019 | UC-GEN-019 | FR-GEN-110 | TEST-GEN-110 |
| FEAT-GEN-020 | STORY-GEN-020 | UC-GEN-020 | FR-GEN-120..121 | TEST-GEN-120..121 |
| FEAT-GEN-021 | STORY-GEN-021 | UC-GEN-021 | FR-GEN-111..112 | TEST-GEN-111..112 |
| FEAT-GEN-022 | STORY-GEN-022 | UC-GEN-022 | FR-GEN-130 | (visual) |
| FEAT-GEN-023 | STORY-GEN-023 | UC-GEN-023 | FR-GEN-141..143 | TEST-GEN-141..143 |
| FEAT-GEN-024 | STORY-GEN-024 | UC-GEN-024 | FR-GEN-140 | TEST-GEN-140 |
| FEAT-GEN-025 | STORY-GEN-025 | UC-GEN-025 | FR-GEN-150 | TEST-GEN-150 |

---

## 10. Landing visual pass v0.4 (added 2026-05-15)

User feedback after the v0.3 release: cards too small/sideways, descriptions
too short, upvotes too prominent on the featured slot, prev/next arrows
"ugly", search too narrow vs. logo, light theme had heavy dark shadows
under cards. Also: real GitHub handle should be on the allowlist.

### 10.1 New features

| ID | Feature | Priority |
|---|---|---|
| FEAT-GEN-026 | Image-based wordmark with CSS fallback (Wordmark loads /wordmark.png; if 404 → falls back to Outfit 900 lowercase) | Must |
| FEAT-GEN-027 | Vertical product-card layout: cover-on-top + content-below (replaces horizontal cover-on-left list cards) | Must |
| FEAT-GEN-028 | Featured carousel card has no in-card upvote (only list cards expose the upvote action) | Must |
| FEAT-GEN-029 | Description visible on list cards (line-clamp-4, ≥4 lines) | Must |
| FEAT-GEN-030 | Theme-aware bento drop shadow (heavy dark shadow only in dark theme) | Must |
| FEAT-GEN-031 | Wider search box in the header (≥ 360px) without shrinking the logo (size `xl`) | Must |
| FEAT-GEN-032 | Carousel prev/next as pill icon-buttons, centered above the slide, rotated arrow for prev | Must |
| FEAT-GEN-033 | Cohort allowlist updated to include `andre-kuzminykh` (the real user) | Must |
| FEAT-GEN-034 | "GENESYS-001 · May Cohort" chip removed from the Login left column | Should |

### 10.2 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-160 | Wordmark MUST attempt to load /wordmark.png first; on error, fall back to CSS-rendered Outfit 900 text. | TEST-GEN-160 |
| FR-GEN-161 | List cards MUST render: cover (top), title (h3), hashtag row, description (≥ 4 lines visible), action row (upvote + open + visit). | TEST-GEN-161 |
| FR-GEN-162 | Featured carousel card MUST NOT render an upvote control. | TEST-GEN-162 |
| FR-GEN-163 | The allowlist MUST contain `andre-kuzminykh`. | TEST-GEN-163 |

### 10.3 Updated traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| FEAT-GEN-026 | — | FR-GEN-160 | TEST-GEN-160 |
| FEAT-GEN-027/029 | — | FR-GEN-161 | TEST-GEN-161 |
| FEAT-GEN-028 | — | FR-GEN-162 | TEST-GEN-162 |
| FEAT-GEN-033 | — | FR-GEN-163 | TEST-GEN-163 |

---

## 15. Public Leaderboard with LLM-driven market simulation (added 2026-05-16)

The Landing leaderboard is a standalone public screen that runs an LLM panel
across all published startups. For each startup the panel produces (1) a
persona-based user review, (2) a market deep-research review, (3) a 13-month
forecast (May 2026 → May 2027) of users + USD revenue, and (4) a prioritised
recommendation. Aggregating the user reviews bumps the public-feed upvote
counter (the cohort favourite floats up). The screen draws two line-charts
(users + revenue) over the 13 months and announces the cohort winner on top.

### 15.1 Domain — `domain/simulation.ts`

Pure TypeScript, framework-agnostic. Public surface:

| Symbol | Purpose |
|---|---|
| `MonthlyPoint` | `{ month: 'YYYY-MM', users, revenueUSD }` |
| `UserReview` | `{ personaIds, score 0..100, notes, upvoteBump }` |
| `MarketReview` | `{ score 0..100, notes, trends: [{label, impact}] }` |
| `StartupForecast` | per-startup envelope: `monthly[]`, `endUsers`, `totalRevenueUSD`, `userReview`, `marketReview`, `recommendation` |
| `SimulationResult` | `{ runAt, months, startups[], winner, userSummary, marketSummary, overallSummary }` |
| `LlmPort` | `reviewForUser`, `reviewForMarket`, `forecastSeries`, `recommend` |
| `MockLlmAdapter` | deterministic implementation; ships by default |
| `runSimulation(startups, llm?)` | composes the four LLM steps into a `SimulationResult` |
| `simulationMonths()` | utility returning the 13 month identifiers |

The MockLlm uses a hashtag-driven trend index (`HASHTAG_TREND`) with bumps
per common AI-app tag (`ai-agents` 1.30, `image-gen` 1.20, `hardware` 0.85,
…) and a persona-bias map that mirrors the existing
`MockPersonaSimulator` (FR-GEN-040). The forecast applies compound monthly
growth × seasonal sine × deterministic noise seeded by the startup id.

### 15.2 Real LLM — `ai/openai.ts`

`OpenAILlmAdapter` is a drop-in `LlmPort` that POSTs to
`https://api.openai.com/v1/chat/completions` with `response_format: json_object`.
The API key is supplied at construction time. **The key is never bundled
into the source** — the user pastes it on the Leaderboard, it lives in
`localStorage` at `genesys:openai-key:v1` only. CORS is open from
`api.openai.com` to browser callers carrying a Bearer token, so no backend
proxy is required for the demo.

If OpenAI errors (rate-limit, invalid key, network), the runner falls back to
`MockLlmAdapter` and surfaces a banner so the screen always renders something.

### 15.3 UI — `screens/Leaderboard.tsx`

Public route `/leaderboard`. Linked from the Landing header (TrophyIcon).
Sections from top to bottom:

1. Header: wordmark · "Browse cohort" · "Login".
2. Hero: chip · title · description · primary CTA "Run market simulation"
   (or "Re-run simulation" when a forecast exists). Right rail also shows the
   live/mock indicator and the timestamp of the last run.
3. OpenAI key field (collapsible). Password-masked input, "show / forget"
   controls, in-browser-only disclaimer.
4. While running: a stepped status banner cycles through five stages
   (description read → market deep research → persona review → forecast →
   aggregation).
5. Winner banner: name + reasoning + end-users + year-revenue stats.
6. Two line charts: monthly users & monthly revenue, one series per startup
   colour-coded from the cohort palette, cross-highlightable on hover via a
   chip legend.
7. Per-startup list (sorted by year revenue, descending). Each item shows
   the user review (score + notes), market review (score + notes + trend
   chips), and a neon-bordered recommendation box. Top stats: end users,
   year revenue, +upvotes contributed back to the cohort feed.
8. Three summary cards (cohort users · cohort market · overall verdict).

### 15.4 Side effect — upvote application

After a successful run, the screen iterates the per-startup `upvoteBump` and
adds it to the existing public-feed upvote map at `genesys:upvotes:v1`. The
Landing list cards re-rank automatically the next render — "the cohort
favourite floats up" per the user's request.

### 15.5 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-300 | `simulationMonths()` MUST return 13 months from May 2026 to May 2027 inclusive. | TEST-GEN-210 |
| FR-GEN-301 | `MockLlmAdapter.reviewForUser(...)` MUST be deterministic and return `score ∈ [0,100]`. | TEST-GEN-211 |
| FR-GEN-302 | `MockLlmAdapter.reviewForMarket(...)` MUST score hashtags such that hot-tag mixes (`ai-agents`, `image-gen`) score strictly higher than cold-tag mixes (`hardware`, `k12`). | TEST-GEN-211 |
| FR-GEN-303 | `MockLlmAdapter.forecastSeries(...)` MUST return one `MonthlyPoint` per requested month and the final month's `users` MUST be > the first month's. | TEST-GEN-211 |
| FR-GEN-304 | `runSimulation(startups, llm)` MUST produce one `StartupForecast` per startup, pick a `winner`, and emit three summaries. | TEST-GEN-212 |
| FR-GEN-305 | The Leaderboard MUST add each startup's `userReview.upvoteBump` to the existing public-feed upvote counter. | (UI side-effect, covered manually) |
| FR-GEN-306 | When a non-empty OpenAI key is present, the Leaderboard MUST instantiate `OpenAILlmAdapter` instead of `MockLlmAdapter`; OpenAI errors MUST fall back to mock with an in-screen banner. | (manual) |

### 15.6 Traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| Leaderboard with LLM forecast | UC-GEN-013 | FR-GEN-300..306 | TEST-GEN-210..212 |

### 15.7 Security note

A public OpenAI key in the browser is visible to the user (and any
extension) — that's why the screen makes the storage explicit and provides
"show / forget" controls. For production we would proxy the calls through
a backend so the key never lands in the client bundle.

---

## 18. FEAT-GEN-050 — Upvote a cohort startup (re-spec, 2026-05-16)

This re-spec is the canonical contract for the cohort-upvote feature. It
supersedes the brief notes scattered in earlier sections.

### 18.1 Feature

- **Feature ID**: FEAT-GEN-050
- **Name**: Cohort upvote
- **One-liner**: A cohort member can express a single, reversible "yes I'd
  back this" signal for any startup in the active batch. The signal is
  visible to every visitor and persists across browser sessions.

### 18.2 User stories

- **US-GEN-050-A** — As a cohort founder I want to upvote my peers' startups
  so the community ranking reflects who else I would put money on.
- **US-GEN-050-B** — As a cohort investor I want to take my upvote back if I
  change my mind, so the leaderboard reflects my current conviction.
- **US-GEN-050-C** — As an anonymous visitor I want to see live upvote totals
  so I can read the cohort's collective taste without signing in.
- **US-GEN-050-D** — As a non-cohort GitHub user I want the system to refuse
  my upvote politely so the cohort signal stays untainted.

### 18.3 User flow (UX path)

1. Visitor lands on `/` (Landing). Upvote counters are visible per startup
   from the very first paint (fetched from `GET /api/state`).
2. If logged in: arrow icon is in `text-textsec`, count is the raw server
   number.
3. Click the upvote button on a list card (or in the open DetailDialog).
4. UI flips locally INSTANTLY: arrow rotates 180°, turns `neon-500`, count
   increments by 1 (optimistic).
5. Browser posts `POST /api/upvote` with `Authorization: Bearer <gh-token>`.
6. Server verifies token via `GET https://api.github.com/user`, checks the
   login against the cohort allowlist, then toggles the handle in
   `state.upvotes[startupId]` and persists `/data/state.json`.
7. Server responds `{ ok: true, voted, count, login }`.
8. UI reconciles with server response (handles concurrent edits).
9. If server returns a non-2xx, UI rolls the optimistic flip back AND shows
   a non-blocking toast for ≤ 4 seconds (`NO_TOKEN` / `BAD_TOKEN` /
   `NOT_IN_ALLOWLIST` / `NETWORK`).

### 18.4 Use cases — Gherkin BDD

#### UC-GEN-050-1 — Cast a vote

```gherkin
Feature: Cohort upvote
  Scenario: An allowlisted user upvotes a startup they have not voted on yet
    Given I am signed in as an allowlisted GitHub user "@mashan555"
      And the startup "S-artrise" currently has 4 upvotes
      And "@mashan555" is not among the voters of "S-artrise"
    When I click the upvote button on the "S-artrise" list card
    Then the button immediately renders as voted (neon, arrow flipped, count = 5)
      And POST /api/upvote is called with my bearer token and { startupId: "S-artrise" }
      And the server responds 200 with { ok: true, voted: true, count: 5, login: "mashan555" }
      And state.upvotes["S-artrise"] now contains "mashan555"
      And the file /data/state.json reflects the new state
```

#### UC-GEN-050-2 — Toggle off (undo a vote)

```gherkin
  Scenario: An allowlisted user clicks the button they already voted with
    Given I am signed in as "@mashan555"
      And "S-artrise" has 5 upvotes including mine
    When I click the upvote button on "S-artrise"
    Then the button renders as not voted (textsec, arrow up, count = 4)
      And POST /api/upvote returns { ok: true, voted: false, count: 4 }
      And state.upvotes["S-artrise"] no longer contains "mashan555"
```

#### UC-GEN-050-3 — Reject a non-allowlisted GitHub user

```gherkin
  Scenario: A signed-in user not on the allowlist tries to upvote
    Given I am signed in as a GitHub user "@randompasserby" who is NOT in the cohort allowlist
    When I click the upvote button on any startup
    Then POST /api/upvote responds 403 with { error: "NOT_IN_ALLOWLIST", login: "randompasserby" }
      And the UI rolls back its optimistic flip
      And a toast appears for ≤ 4 s saying "Your GitHub handle is not on the cohort allowlist."
```

#### UC-GEN-050-4 — Anonymous read

```gherkin
  Scenario: An anonymous visitor browses the cohort
    Given I am NOT signed in
    When I open "/" (Landing)
    Then GET /api/state returns the full upvotes map with no auth
      And every list card and the detail dialog show the correct cohort total
    When I click the upvote button
    Then POST /api/upvote responds 401 with { error: "NO_TOKEN" }
      And the UI shows a toast "Sign in with GitHub to upvote."
```

#### UC-GEN-050-5 — Cross-browser propagation (eventual consistency)

```gherkin
  Scenario: Two cohort members vote on the same startup concurrently
    Given "@artem-grigorash" has S-bte open in browser A
      And "@mashan555" has S-bte open in browser B
      And neither has voted yet
    When both click upvote within the 15-second poll window
    Then both browsers refresh /api/state within 15 s
      And state.upvotes["S-bte"] contains BOTH handles
      And both browsers display count = 2 with the local user shown as voted
```

### 18.5 Functional requirements

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-501 | A single GitHub handle MUST contribute at most 1 upvote per startup at any time. Re-clicking toggles. | TEST-GEN-501-S |
| FR-GEN-502 | `POST /api/upvote` MUST verify the bearer token against `https://api.github.com/user`. A 401 from GitHub MUST surface as 401 `BAD_TOKEN` to the client. | TEST-GEN-502-S |
| FR-GEN-503 | The server MUST refuse upvotes from handles not in the cohort allowlist with 403 `NOT_IN_ALLOWLIST`. | TEST-GEN-503-S |
| FR-GEN-504 | `GET /api/state` MUST be unauthenticated and return the current `upvotes` map + `investments` array verbatim. | TEST-GEN-504-S |
| FR-GEN-505 | The browser MUST flip its UI state optimistically on click and roll back if the server returns non-2xx. | TEST-GEN-505-C |
| FR-GEN-506 | Upvote totals MUST persist across server restarts (file backing under a docker-compose volume). | TEST-GEN-506-I |
| FR-GEN-507 | The browser polls `/api/state` every 15 s while the page is open, so cohort activity from other members propagates without manual reload. | TEST-GEN-507-C |
| FR-GEN-508 | Featured carousel + main list MUST sort by `upvoteOf(id)` descending so popular startups bubble up. | TEST-GEN-508-C |

### 18.6 Non-functional requirements

| NFR ID | Category | Requirement | Test |
|---|---|---|---|
| NFR-GEN-501 | Performance | `POST /api/upvote` end-to-end (browser click → server ack) MUST land in < 1.5 s p95 under normal cohort load. | TEST-GEN-510-I |
| NFR-GEN-502 | Reliability | Concurrent upvotes serialize through a per-process write queue (`writeChain` in `server/index.js`); the on-disk file is updated atomically (`writeFile tmp` + `rename`). | TEST-GEN-511-S |
| NFR-GEN-503 | Security | The GitHub OAuth access token MUST be sent only on Authorization headers to api.github.com and same-origin /api/*. Never logged in plaintext. | TEST-GEN-512-I (code review) |
| NFR-GEN-504 | Observability | Every accepted upvote leaves an `[genesys-api]` log line server-side: start, response code, duration. | TEST-GEN-513-I |
| NFR-GEN-505 | Accessibility | The upvote button has an `aria-label`/`aria-pressed` reflecting current state. Keyboard activation (Space/Enter) is equivalent to mouse click. | TEST-GEN-514-C |
| NFR-GEN-506 | Resilience | If the server's state file is missing or corrupt on boot, the server MUST start with an empty state and log a warning — never crash. | TEST-GEN-515-I |

### 18.7 Tests by layer

| Test ID | Layer | What it covers | File |
|---|---|---|---|
| TEST-GEN-221 (existing) | Service (backend) | `/api/upvote` accept / toggle / reject / count | `server/state.test.js` |
| TEST-GEN-220 (existing) | Service (backend) | `/api/state` returns the empty store on boot | `server/state.test.js` |
| TEST-GEN-501-S | Service | One-handle = one-vote invariant under repeated toggles | `server/state.test.js` |
| TEST-GEN-502-S | Service | Bad GitHub token → 401 BAD_TOKEN | `server/state.test.js` |
| TEST-GEN-503-S | Service | Non-allowlisted user → 403 NOT_IN_ALLOWLIST | `server/state.test.js` |
| TEST-GEN-504-S | Service | `/api/state` returns persisted map without auth | `server/state.test.js` |
| TEST-GEN-505-C | Client | Optimistic flip + rollback on server error | UI flow (manual + integration) |
| TEST-GEN-506-I | Infra | `state.json` survives `docker compose up -d --build` | manual smoke + `auth_health` check |
| TEST-GEN-507-C | Client | 15-s poll picks up other cohort members' votes | integration |
| TEST-GEN-508-C | Client | Featured carousel order reflects current upvote counts | integration |
| TEST-GEN-510-I | Infra | p95 latency of /api/upvote | manual measurement |
| TEST-GEN-511-S | Service | Concurrent upvote serialization writes a consistent file | `server/state.test.js` |
| TEST-GEN-512-I | Infra | Token never appears in `docker logs` | manual grep |
| TEST-GEN-513-I | Infra | `[genesys-api] responses` log line per upvote | manual `docker logs` |
| TEST-GEN-514-C | Client | aria-pressed flips with the click | manual a11y check |
| TEST-GEN-515-I | Infra | Server boots with empty state on missing file | manual smoke |
| (existing) AI evals | AI | This feature has NO AI dependency — n/a | — |

### 18.8 Component map (what file does what)

| Layer | File | Role |
|---|---|---|
| Client | `web/src/ui/screens/Landing.tsx` | Renders upvote buttons on ListCard + DetailDialog, calls `useServer().toggleUpvote(id)`, surfaces error toast. |
| Client | `web/src/ui/ServerStore.tsx` | Holds shared `ServerState`, runs the 15 s `/api/state` poll, exposes `toggleUpvote` with optimistic flip + rollback. |
| Client | `web/src/domain/api.ts` | Pure fetch wrappers `fetchState()` and `postUpvote(token, startupId)`. |
| Client | `web/src/ui/AppStore.tsx` | Owns session (handle + access token). |
| Service | `server/index.js` | `/api/state`, `/api/upvote`, `/api/invest`, `/api/llm/responses`. Single Node process. |
| Service | `server/state.test.js` | Node `--test` integration suite against a temp state file with a stubbed `globalThis.fetch` for GitHub. |
| Data | `/data/state.json` | The whole shared-state document (`upvotes` + `investments`). Mounted from `./data` on the host via `docker-compose.yml`. |
| Infra | `docker-compose.yml` | Wires the web + auth containers; mounts `./data:/data`; passes OPENAI + GITHUB env. |
| Infra | `web/nginx.conf` | Proxies `/api/*` to `genesys_auth:3000` with `proxy_read_timeout 240s`. |

### 18.9 Infra as code — what's deployed where

```
human-1 VM (europe-west1-b)
└── docker compose -f /opt/genesis/docker-compose.yml
    ├── service: web      (image genesys-startup-studio)
    │   └── nginx → static React bundle + /api proxy
    ├── service: auth     (image genesys-auth, Node 22)
    │   ├── env: OPENAI_API_KEY, GITHUB_CLIENT_ID/SECRET, PUBLIC_URL
    │   └── mount: ./data → /data        ← state.json lives here
    └── port-publish: GENESIS_PORT:80    (default 8026)
```

### 18.10 Data — ERD / DFD slice for this feature

ERD (slice):

```
┌─────────────────┐ 1   N ┌──────────────────────────┐
│ GitHubHandle    │───────│ Upvote                   │
│ (lowercase str) │       │  startupId    : string   │
└─────────────────┘       │  voterHandle  : string   │  N   1 ┌─────────────┐
                          │  ts (implicit): ms       │────────│ Startup     │
                          └──────────────────────────┘        │ id (S-...)  │
                                                              └─────────────┘
                          (stored as upvotes: Record<startupId, string[]>)
```

DFD for one upvote click:

```
[Browser]
  click ── toggleUpvote(id)
   │
   ├──> setState optimistic flip
   │
   └──> POST /api/upvote  (Bearer token, { startupId })
         │
         ▼
       [nginx /api/*]  → proxy_pass → [auth:3000]
                                          │
                                          ├─ whoami(token) → GET api.github.com/user
                                          │   ↳ 401 ?   → respond 401 BAD_TOKEN
                                          │
                                          ├─ allowlist.has(login) ? else 403
                                          │
                                          ├─ state.upvotes[id] = toggle(state.upvotes[id], login)
                                          │
                                          ├─ writeChain: writeFile state.json.tmp → rename → state.json
                                          │
                                          └─ respond 200 { ok, voted, count, login }
   │
   └──< receive response → reconcile setState
```

### 18.11 Services + AI services

- **Service**: `/api/upvote` (Express handler in `server/index.js`). No AI
  dependency. Reads from / writes to in-process `state` object + `state.json`.
- **AI service**: none. (For comparison: `narrativeSeries` / `reviewForUser` /
  `reviewForMarket` etc. DO have prompts in `web/src/ai/openai.ts` and feed
  the Leaderboard, but the upvote path is pure CRUD.)
- **Prompts directory**: `web/src/ai/prompts/` — currently inline in
  `openai.ts`; when prompts are extracted to `.md` files, the upvote feature
  remains unaffected because it has no AI dependency.

### 18.12 Traceability matrix

| Feature | User Story | Use Case | FR | NFR | Test | Code |
|---|---|---|---|---|---|---|
| FEAT-GEN-050 | US-GEN-050-A | UC-GEN-050-1 | FR-GEN-501, FR-GEN-502, FR-GEN-505 | NFR-GEN-501, NFR-GEN-505 | TEST-GEN-221, TEST-GEN-501-S, TEST-GEN-505-C, TEST-GEN-514-C | `Landing.tsx`, `ServerStore.tsx`, `api.ts`, `server/index.js` |
| FEAT-GEN-050 | US-GEN-050-B | UC-GEN-050-2 | FR-GEN-501, FR-GEN-505 | NFR-GEN-505 | TEST-GEN-221, TEST-GEN-501-S, TEST-GEN-505-C | same |
| FEAT-GEN-050 | US-GEN-050-C | UC-GEN-050-4 | FR-GEN-504, FR-GEN-507 | NFR-GEN-501 | TEST-GEN-220, TEST-GEN-504-S, TEST-GEN-507-C | `Landing.tsx`, `ServerStore.tsx`, `api.ts`, `server/index.js` |
| FEAT-GEN-050 | US-GEN-050-D | UC-GEN-050-3 | FR-GEN-503 | NFR-GEN-503 | TEST-GEN-503-S, TEST-GEN-512-I | `server/index.js` |
| FEAT-GEN-050 | (cross) | UC-GEN-050-5 | FR-GEN-506, FR-GEN-507 | NFR-GEN-502, NFR-GEN-504, NFR-GEN-506 | TEST-GEN-506-I, TEST-GEN-507-C, TEST-GEN-511-S, TEST-GEN-513-I, TEST-GEN-515-I | `server/index.js`, `docker-compose.yml` |

---

## 19. FEAT-GEN-060 — Build wizard (product spec from scratch, methodology-driven) (added 2026-05-17)

### 19.1 Feature

- **Feature ID**: FEAT-GEN-060
- **Name**: Build wizard
- **One-liner**: A founder lands on `/build`, walks through a strict sequential
  methodology (product → features → deep-dive → architecture → tests → tasks)
  and ends with a structured spec they can ship to engineering. Magic-wand
  LLM assist on every field fills suggestions from the prior context.

### 19.2 User stories

- **US-GEN-060-A** — As a founder I want to start a fresh product brief with
  prompts for user / problem / solution / metrics so I never face a blank
  page.
- **US-GEN-060-B** — As a founder I want the wand to suggest 4-6 features
  based on what I've already typed so I don't anchor on the first feature
  I think of.
- **US-GEN-060-C** — As a founder I want to pick ONE feature and only see
  the deep-dive for that one, so I'm forced to think sequentially.
- **US-GEN-060-D** — As a founder I want my draft auto-saved so I can
  close the tab and come back later without losing anything.
- **US-GEN-060-E** — As a founder I want any wand failure (no key, network,
  bad JSON) surfaced inline so I know whether to retry or wait.

### 19.3 User flow

1. Open `/build`. Page shows three step shells; only step 1 is unlocked.
2. Fill "user / problem / solution"; hit the wand on any field → POST
   `/api/llm/chat`, receive `{ user }` (or other), apply to the field.
3. Add 1-3 metrics; wand on the metrics row replaces the list with 3
   LLM suggestions.
4. Step 1 done → step shell border turns neon, step 2 unlocks.
5. In step 2 either add features manually OR hit the wand → 4-6 LLM
   features appended (must/should/could).
6. Pick ONE feature to deep-dive → its row gets a neon border and the
   row caption flips to "✓ Working on this".
7. Step 3 unlocks (still a placeholder shell in the current iteration —
   subsequent commits land the user-story → flow → BDD → FR/NFR pass).
8. Draft is persisted to `localStorage` under
   `genesys:build-draft:v1` after every state change.

### 19.4 Use cases — Gherkin BDD

#### UC-GEN-060-1 — Magic-wand suggests a field

```gherkin
Feature: Build wizard magic-wand assist
  Scenario: Founder asks the wand to suggest the "user" field
    Given I have filled "problem" and "solution" but the "user" field is empty
    When I click the magic-wand button next to "Who is the user?"
    Then POST /api/llm/chat is called with a JSON-only system prompt and the partial brief
      And the server returns 200 with { choices:[{ message:{ content: '{"user":"<one sentence>"}' }}] }
      And the "user" field is populated with that sentence
      And no other field is mutated
```

#### UC-GEN-060-2 — Sequential gating

```gherkin
  Scenario: Step 2 stays locked until step 1 is complete
    Given the "user", "problem" or "solution" field is empty
    Then the Feature roadmap section MUST be rendered with `opacity-50 pointer-events-none`
    When all three step-1 fields are non-empty
    Then the Feature roadmap section MUST be interactive
```

#### UC-GEN-060-3 — Draft persistence

```gherkin
  Scenario: Draft survives a page reload
    Given I have filled the product foundation and added 3 features
    When I reload the page (or close + reopen the tab)
    Then the form fields and feature rows MUST reappear exactly as I left them
      And the previously-picked workingFeatureId MUST still show "✓ Working on this"
```

#### UC-GEN-060-4 — Wand failure surfaces an actionable error

```gherkin
  Scenario: OpenAI key is missing on the server
    Given the server has no OPENAI_API_KEY in env
    When I click any magic-wand button
    Then POST /api/llm/chat responds 503 with { error: "NO_OPENAI_KEY" }
      And a red banner appears above the steps reading
      "OpenAI key not configured on the server (/opt/genesis/.env)."
      And the affected field stays unchanged
```

#### UC-GEN-060-5 — Pick one feature to deep-dive

```gherkin
  Scenario: Founder picks a feature for the deep-dive
    Given step 2 has at least one feature row
    When I click "Pick to deep-dive →" on a feature row
    Then draft.workingFeatureId MUST equal that row's id
      And only that row renders with the neon border
      And step 3's title MUST include the feature's name
```

### 19.5 Functional requirements

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-601 | Magic-wand calls MUST go through same-origin `POST /api/llm/chat`; the OpenAI key is never read from `import.meta.env` in this path. | TEST-GEN-601-C |
| FR-GEN-602 | The proxy MUST return 503 `NO_OPENAI_KEY` when no key is configured server-side. | TEST-GEN-602-S |
| FR-GEN-603 | `loadDraft()` MUST tolerate a missing / corrupt localStorage entry and return the empty draft without throwing. | TEST-GEN-603-D |
| FR-GEN-604 | `saveDraft(d)` MUST persist the draft under `genesys:build-draft:v1` and stamp `updatedAt` with `Date.now()`. | TEST-GEN-604-D |
| FR-GEN-605 | Step 2 MUST be rendered as `pointer-events-none opacity-50` until step 1 is complete. | TEST-GEN-605-C |
| FR-GEN-606 | The magic-wand button MUST have no visible border / background — only a glyph that recolours on hover. | TEST-GEN-606-C |
| FR-GEN-607 | `suggestFeatures(brief)` MUST clamp the output to ≤ 8 entries and normalise `priority` to one of `must / should / could`, defaulting unknown values to `should`. | TEST-GEN-607-C |
| FR-GEN-608 | Each wand call surfaces an inline red banner with the human-readable error code when it fails; the field stays unchanged. | (manual) |

### 19.6 Non-functional requirements

| NFR ID | Category | Requirement | Test |
|---|---|---|---|
| NFR-GEN-601 | Performance | Magic-wand round-trip (click → field populated) MUST land in < 3 s p95 for a single-field suggest. | (manual) |
| NFR-GEN-602 | Security | OpenAI key MUST NOT appear in any JS bundle for the Build wizard path. | (code review) |
| NFR-GEN-603 | Privacy | The brief content travels to OpenAI; users are notified of this via the cookie banner / Privacy page. | (manual) |
| NFR-GEN-604 | Accessibility | The magic-wand button MUST have an `aria-label` describing the action, a tooltip via `title`, and reflect busy state visibly (spinner). | TEST-GEN-606-C |
| NFR-GEN-605 | Resilience | A bad JSON response from OpenAI MUST surface `BAD_JSON` and NOT corrupt the in-memory or persisted draft. | TEST-GEN-605-D (manual + parser) |

### 19.7 Tests by layer

| Test ID | Layer | What it covers | File |
|---|---|---|---|
| TEST-GEN-601-C | Client (component) | Magic-wand calls `/api/llm/chat` with the right shape; populates the target field on success | `web/src/ai/__tests__/buildAssist.test.ts` |
| TEST-GEN-602-S | Service (backend) | `/api/llm/chat` returns 503 `NO_OPENAI_KEY` when env is empty | `server/state.test.js` |
| TEST-GEN-603-D | Data | `loadDraft()` returns `EMPTY_DRAFT` for missing / corrupt storage | `web/src/data/__tests__/buildDraft.test.ts` |
| TEST-GEN-604-D | Data | `saveDraft()` → `loadDraft()` round-trips every field + stamps `updatedAt` | `web/src/data/__tests__/buildDraft.test.ts` |
| TEST-GEN-605-C | Client | Step 2 shell carries `pointer-events-none opacity-50` while step 1 is empty | `web/src/ui/screens/__tests__/Build.test.tsx` |
| TEST-GEN-606-C | Client | Magic-wand has `aria-label`, no `border-*` / `bg-*` chrome classes | `web/src/ui/screens/__tests__/Build.test.tsx` |
| TEST-GEN-607-C | Client | `suggestFeatures` clamps to ≤ 8 + normalises priority | `web/src/ai/__tests__/buildAssist.test.ts` |

### 19.8 Component map

| Layer | File | Role |
|---|---|---|
| Client | `web/src/ui/screens/Build.tsx` | Sequential wizard. Owns the in-memory `BuildDraft`, mounts step shells, fires wand callbacks. |
| Client | `web/src/ui/components/MagicWand.tsx` | Chrome-less sparkle button + spinner + a11y labels. |
| Client | `web/src/ai/buildAssist.ts` | Typed wand helpers. Wraps `POST /api/llm/chat`, JSON-parses, raises `BuildAssistError`. |
| Data | `web/src/data/buildDraft.ts` | `EMPTY_DRAFT`, `loadDraft`, `saveDraft`, `randomId`. localStorage backed (`genesys:build-draft:v1`). |
| Service | `server/index.js` (route `/api/llm/chat`) | Same-origin proxy to OpenAI's chat.completions; server-held key; logs response code + duration. |
| Infra | `web/nginx.conf` `location /api/` | `proxy_read_timeout 240s` so a slow LLM doesn't drop the request mid-suggest. |

### 19.9 ERD slice

```
┌───────────────────────────┐
│ BuildDraft (1 per browser)│
│  product: ProductFoundation
│  features: FeatureRow[]    
│  workingFeatureId: string|null
│  updatedAt: ms            │
└───────────────────────────┘
       │
       ├── product : ProductFoundation { user, problem, solution, metrics[] }
       │
       └── features : FeatureRow[] { id, name, oneliner, priority }
                          ▲
                          │ pickToDeepDive → workingFeatureId
```

Persistence boundary: localStorage key `genesys:build-draft:v1`. No
server-side mirror of this draft yet — the wizard is single-browser-local
until the founder converts it into a real Startup.

### 19.10 DFD — one magic-wand click

```
[Build.tsx]
   click wand on field X
        │
        ├─ setBusy('X')
        │
        └─ buildAssist.suggestX(draft.product)
              │
              ▼
            POST /api/llm/chat   (same-origin)
              │
              ▼
           [nginx /api/*] → proxy_pass → [auth:3000]
              │
              ├─ env OPENAI_API_KEY ? else 503 NO_OPENAI_KEY
              │
              ├─ fetch https://api.openai.com/v1/chat/completions  (server-side key)
              │
              └─ pass status + JSON back
              │
              ▼
          JSON.parse(message.content) → { X: "..." }
              │
              ▼
   setState((d) => apply suggestion to d.product.X)
   saveDraft(d) → localStorage
```

### 19.11 Project tree slice (Build feature)

```
genesys/
├── server/
│   └── index.js                         POST /api/llm/chat handler
├── web/
│   ├── public/                           — (no static assets specific to /build)
│   ├── src/
│   │   ├── ai/
│   │   │   └── buildAssist.ts            wand helpers (suggestUser / Problem / Solution / Metrics / Features)
│   │   ├── data/
│   │   │   └── buildDraft.ts             localStorage draft
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   │   └── MagicWand.tsx         chrome-less sparkle button
│   │   │   └── screens/
│   │   │       └── Build.tsx             wizard screen
│   │   └── main.tsx                      registers /build route
└── SPEC_v0.1.md                          §19 (this section)
```

### 19.12 Roadmap (subsequent iterations)

- **§19.13 — User-story → flow → BDD pass** (step 3 deep-dive)
- **§19.14 — Architecture (UX / AI services + prompts / backend / ERD-DFD / infra / project tree)**
- **§19.15 — Test matrix per FR/NFR with auto-IDs**
- **§19.16 — Task decomposition + accept-criteria checklist + code-gen handoff**
- **§19.17 — Export-to-SPEC.md and the Repository materialisation step**

### 19.13 Traceability matrix

| Feature | User Story | Use Case | FR | NFR | Test | Code |
|---|---|---|---|---|---|---|
| FEAT-GEN-060 | US-GEN-060-A | UC-GEN-060-1 | FR-GEN-601 | NFR-GEN-601, NFR-GEN-604 | TEST-GEN-601-C, TEST-GEN-606-C | `Build.tsx`, `MagicWand.tsx`, `buildAssist.ts`, `server/index.js` |
| FEAT-GEN-060 | US-GEN-060-B | UC-GEN-060-1 | FR-GEN-607 | NFR-GEN-601 | TEST-GEN-601-C, TEST-GEN-607-C | `buildAssist.ts`, `Build.tsx` |
| FEAT-GEN-060 | US-GEN-060-C | UC-GEN-060-5, UC-GEN-060-2 | FR-GEN-605 | — | TEST-GEN-605-C | `Build.tsx` |
| FEAT-GEN-060 | US-GEN-060-D | UC-GEN-060-3 | FR-GEN-603, FR-GEN-604 | NFR-GEN-605 | TEST-GEN-603-D, TEST-GEN-604-D | `buildDraft.ts` |
| FEAT-GEN-060 | US-GEN-060-E | UC-GEN-060-4 | FR-GEN-602, FR-GEN-608 | NFR-GEN-602 | TEST-GEN-602-S | `server/index.js`, `Build.tsx` |


### 17.1 Why

Up to v0.16 every cohort member saw their own copy of the world. Upvotes
and investments lived in `localStorage` per browser, so two judges signing
in on different machines couldn't see each other's votes or each other's
investments. For the demo to feel like a real cohort marketplace these two
slices of state have to be visible to everyone simultaneously.

### 17.2 Architecture delta

The existing GitHub OAuth proxy at `server/index.js` is extended into a
small JSON-on-disk state service:

- `GET /api/state` — unauthenticated read of the whole world (used to
  populate Landing/Leaderboard at first paint).
- `POST /api/upvote { startupId }` — authenticated; toggles `state.upvotes[startupId]`
  to include / exclude the caller's login.
- `POST /api/invest { startupId, amount }` — authenticated; appends to
  `state.investments` after self-invest + budget checks.

Persistence: `STATE_FILE` (default `/data/state.json`) — `docker-compose.yml`
mounts `./data` from the host so the file survives container rebuilds.
Writes are serialised through a single in-process promise chain and use a
write-rename atomic swap so a crash can't half-flush the file.

AuthN: every mutating endpoint reads `Authorization: Bearer <github-pat>`
and calls `GET https://api.github.com/user` to recover the canonical
`login`. The login is checked against a server-side allowlist that mirrors
`web/src/data/seed.ts` so non-cohort GitHub users get `403 NOT_IN_ALLOWLIST`
even if they get hold of a valid token.

AuthZ:
- Self-invest is forbidden via a server-side `STARTUP_OWNERS` map.
- Wallet cap is `$100,000` per investor, enforced by summing existing
  investments for the caller before recording a new one.

nginx (`web/nginx.conf`) gains a `location /api/` block alongside the
existing `/auth/*` proxy so the SPA can talk to the backend via the same
origin without any CORS plumbing.

### 17.3 Frontend integration

New `ServerStoreProvider` (`web/src/ui/ServerStore.tsx`):

- Fetches `/api/state` on mount and every 15 s.
- Exposes `upvoteCount(id)`, `hasVoted(id)`, `totalInvestedBy(handle)`,
  `walletRemaining(handle)`, `toggleUpvote(id)`, `invest(id, amount)`.
- Optimistically updates local state on mutation responses; surfaces
  failures as typed `ApiErrorCode`s for friendly UI messages.

Landing now reads upvotes and investments from the server store, not the
old `genesys:upvotes:v2` localStorage key or `state.investments` from the
seeded `AppStore`. The DetailDialog Invest form calls `server.invest(…)`
and translates the typed error codes into the existing error banner.

### 17.4 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-320 | `GET /api/state` MUST return `{ upvotes, investments }` and require no authentication. | TEST-GEN-220 |
| FR-GEN-321 | `POST /api/upvote` MUST reject calls with no bearer token (`401 NO_TOKEN`). | TEST-GEN-221 |
| FR-GEN-322 | `POST /api/upvote` MUST reject callers whose GitHub login is not in the cohort allowlist (`403 NOT_IN_ALLOWLIST`). | TEST-GEN-221 |
| FR-GEN-323 | `POST /api/upvote` MUST toggle the caller's handle in `state.upvotes[startupId]` and persist the change. | TEST-GEN-221 |
| FR-GEN-324 | `POST /api/invest` MUST reject self-investment (`400 SELF_INVEST_FORBIDDEN`). | TEST-GEN-222 |
| FR-GEN-325 | `POST /api/invest` MUST reject amounts that would overdraw the $100,000 wallet (`400 INSUFFICIENT_CREDITS`) and report `remaining`. | TEST-GEN-222 |
| FR-GEN-326 | `POST /api/invest` MUST append the investment to `state.investments` and return the updated `walletRemaining`. | TEST-GEN-222 |
| FR-GEN-327 | The SPA `ServerStoreProvider` MUST source upvotes and investments from `/api/state` and use `/api/upvote` + `/api/invest` for mutations. | (UI integration) |

### 17.5 Traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| Shared upvote totals across the cohort | — | FR-GEN-320..323, FR-GEN-327 | TEST-GEN-220, TEST-GEN-221 |
| Cohort-wide invest wallet | — | FR-GEN-324..327 | TEST-GEN-222 |

### 17.6 Operational notes

- `docker-compose.yml` mounts `./data:/data` on the host; the file at
  `./data/state.json` is the database. Snapshot the directory before any
  destructive container operation.
- Server tests run with `npm test --prefix server` and stub
  `globalThis.fetch` only for `api.github.com` so the test client can
  still hit the loopback Express instance.

---

## 16. Brand picture wordmark + 2-column Landing grid (added 2026-05-16)

### 16.1 Wordmark refactor

The wordmark is no longer rendered as programmatic text — it is a single
hosted raster picture (`WORDMARK_URL` in `web/src/ui/components/Wordmark.tsx`)
paired with a CSS-rendered neon cursor block. The cursor sits to the LEFT
of the picture in an `inline-flex` with `align-items: flex-end`; per-size
`marginBottom` lifts it onto the typographic baseline of the lettering
inside the picture, and per-size `marginLeft` nudges it horizontally so
it visually anchors near the first letter rather than the picture edge.

`withCursor` and `blink` props are retained on the component for call-site
compatibility (every screen — Landing xl · Login xl · PickRepo lg ·
AppLayout sm · AuthSuccess lg · ComingSoon lg · Leaderboard md — calls
`<Wordmark size="…" />` and gets the picture automatically).

### 16.2 Landing list grid

The Landing list (everything below the Featured carousel) is now a
responsive grid:

- Mobile (`<md`): a single column, unchanged from before.
- `md+`: two columns (`grid-cols-2`) with a 24 px gap.

Cards in the two columns are allowed to have different heights — the grid
intentionally does not enforce row alignment, per the user's "разнобой ok"
note. The empty-state cell spans both columns (`md:col-span-2`).

### 16.3 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-310 | `<Wordmark size="…" />` MUST render an `<img>` whose `src` resolves to the brand artwork and whose CSS `height` matches the per-size table. | TEST-GEN-160 |
| FR-GEN-311 | `<Wordmark withCursor>` MUST render a neon block sibling with a positive `marginBottom` so it visually sits on the lettering baseline of the artwork. | TEST-GEN-213 |
| FR-GEN-312 | The Landing list MUST render its cards in a 2-column grid at `md+` viewports and a single column on smaller screens. | TEST-GEN-214 |

### 16.4 Traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| Picture-based wordmark with CSS cursor | — | FR-GEN-310, FR-GEN-311 | TEST-GEN-160, TEST-GEN-213 |
| Two-column Landing list grid | — | FR-GEN-312 | TEST-GEN-214 |

---

## 14. Real GitHub authentication (added 2026-05-15)

The mocked login is now a secondary path. The primary identity in the demo
is a real GitHub session backed by a Personal Access Token (PAT). OAuth code
flow would require a server-side secret, which the deployment doesn't have;
PAT covers the same surface area for a single-user demo.

### 14.1 Flow

1. **Login**: the input on `/login` accepts either:
   - A **token** (recognised by the prefixes `ghp_`, `github_pat_`, `gho_`,
     `ghs_`, `ghu_`, `ghr_`) — verified via `GET /user`.
   - A **handle** — mock path (kept for demo + screenshots).
2. On token success, the verified GitHub login goes through the allowlist
   check. Approved → session contains `{handle, accessToken, name, avatarUrl}`.
3. **PickRepo** (`/onboarding/repo`):
   - If session has `accessToken`, call `GET /user/repos?sort=pushed&per_page=20&affiliation=…`
     and, for each repo, parallel-probe canonical spec/tests paths
     (`genesys/spec`, `docs/spec`, `spec`, `SPEC.md`, `SPEC_v0.1.md` and
     `genesys/tests`, `tests`, `__tests__`, `test`).
   - Otherwise (no token): fall back to `mockRepos` for the seeded demo
     handles (`alice/aurora`, etc.).
4. CTA per repo unchanged: "Open dashboard" (found) or 🚀 "Start from
   scratch" (partial/missing). Both → `/coming-soon`.

### 14.2 New domain module — `domain/github.ts`

Browser-only wrapper around the GitHub REST API. Public functions:
`looksLikePAT(s)`, `verifyToken(token)`, `listRepos(token, perPage)`,
`pathExists(token, fullName, path)`, `scanRepoLive(token, repo)`,
`listAndScan(token, cap)`. Errors thrown as `GhError(status, message)`.

### 14.3 UI cleanup on PickRepo

The "signed in as @handle" badge is now in the **header**, on the same row
as the wordmark and the Cancel link (was on its own line under the title).
The token-mode page subtitle reads "Genesys is scanning your GitHub repos
for `/genesys/spec` and `/genesys/tests`"; the mock-mode subtitle reads
"Demo mode — repositories below are mocked".

### 14.4 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-200 | A string starting with `ghp_`, `github_pat_`, `gho_`, `ghs_`, `ghu_`, `ghr_` MUST be treated as a GitHub PAT. | TEST-GEN-200 |
| FR-GEN-201 | `verifyToken(token)` MUST call `GET https://api.github.com/user` with `Authorization: token <token>` and return the user on 200 or throw `GhError` otherwise. | TEST-GEN-201 |
| FR-GEN-202 | `listRepos(token)` MUST sort by pushed-desc and respect the configured `per_page`. `pathExists(...)` MUST return true iff the GitHub Contents API responds 200. `scanRepoLive(...)` MUST set `hasSpec`/`hasTests` true iff ANY of the canonical paths exist. | TEST-GEN-202 |
| FR-GEN-203 | The Login form MUST detect a PAT-shaped input and call `loginWithToken`; non-PAT input falls back to the mock allowlist login. | (covered by integration test scenarios) |
| FR-GEN-204 | PickRepo MUST use real repos (via `listAndScan`) when the session carries an `accessToken`; otherwise the mock list. | (covered by code path; mocked at unit level) |

### 14.5 Traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| Real GitHub login (PAT) | UC-GEN-001, UC-GEN-023, UC-GEN-024 | FR-GEN-200..204 | TEST-GEN-200..202 |

---

## 13. Invest via Landing wallet (added 2026-05-15)

The user can invest into a published startup directly from the public
Landing's detail dialog. Wallet UX:

- Every allowlisted member gets a **$100,000** demo wallet on first
  login (was 1,000 "Genesis Credits"). Stored on `batch.creditsPerInvestor`.
- The wallet pill `$ NNN,NNN` shows in the Landing header for the
  authenticated user.
- The card detail dialog now contains an "Invest" button (dollar icon).
  Clicking it expands an inline form with:
  - amount input (digits-only)
  - quick-pick chips: $500, $1,000, $5,000, $10,000, max
  - "After: $X" projected wallet remainder
  - Cancel / Confirm
- Anonymous users see "Sign in to invest" → /login instead.

The underlying logic re-uses the existing `invest()` reducer
(`FR-GEN-030..033` from §2.5), only the default budget value and the
displayed unit change.

### 13.1 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-190 | Default `batch.creditsPerInvestor` MUST be 100,000 (interpreted as USD by the UI). | TEST-GEN-190 |
| FR-GEN-191 | The Landing header MUST display the current wallet balance as `$N,NNN` for the authenticated user, hidden for anonymous visitors. | TEST-GEN-190 |
| FR-GEN-192 | The detail dialog Invest control MUST be a single button labelled "Invest" with a dollar icon; clicking it MUST reveal an amount form with the quick-pick chips and a Confirm action. | TEST-GEN-190 |
| FR-GEN-193 | Anonymous visitors clicking Invest MUST instead see a "Sign in to invest" CTA linking to /login. | (covered by detail-dialog conditional) |

### 13.2 Traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| Invest with $100k wallet | UC-GEN-011 | FR-GEN-190..193 | TEST-GEN-190 |

---

## 12. Narrow demo MVP — single flow (added 2026-05-15)

User decision: collapse the demo to one happy path so we can validate the
end-to-end experience without distractions.

### 12.1 The single supported flow

1. **Public Landing** — visitors browse the cohort cards and open details.
2. **Login with GitHub (mocked)** — handle on the allowlist accepted.
3. **Repo picker** at `/onboarding/repo`:
   - Each mocked repo is scanned for `/genesys/spec` and `/genesys/tests`.
   - Found → CTA "Open dashboard" (neon button + right arrow).
   - Partial / Missing → CTA **"Start from scratch"** with the **rocket
     icon** at the front of the label.
4. **Both CTAs route to `/coming-soon`** for this iteration.
   - `/coming-soon` shows a friendly "we'll launch this soon" placeholder
     with a floating rocket, a "Pick another repo" link, and a "Browse the
     cohort" link to the public Landing.

### 12.2 Out of scope for this iteration

All previously-built screens still exist (Dashboard, Spec workspace,
Marketplace, Leaderboard, Portfolio, Admin, etc.) but they are **not
reachable through normal navigation**. The sidebar now exposes only
"Pick a repo" and (for admins) "Console". Direct URLs still work, but
the demo script does not depend on them.

### 12.3 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-180 | After successful allowlist login, the user MUST be routed to `/onboarding/repo` (no exceptions). | TEST-GEN-180 |
| FR-GEN-181 | Picking a repo with scan kind `found` MUST navigate to `/coming-soon` with `state.flow = 'import'` and the repo full name. | TEST-GEN-181 |
| FR-GEN-182 | Picking a repo with scan kind `partial` or `missing` MUST navigate to `/coming-soon` with `state.flow = 'scratch'`, the repo full name, and a derived startup name. The CTA MUST be labelled "Start from scratch" and display the rocket icon. | TEST-GEN-182 |
| FR-GEN-183 | `/coming-soon` MUST render the message "We'll launch this soon." and provide a "Pick another repo" link back to `/onboarding/repo`. | TEST-GEN-183 |
| FR-GEN-184 | The Founder sidebar MUST expose only "Pick a repo" and (for admins) "Console". Other entries (My Startups, Marketplace, Leaderboard, Portfolio) MUST be hidden. | (visual) |

### 12.4 Traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| Demo MVP — single flow | UC-GEN-023, UC-GEN-024 | FR-GEN-180..184 | TEST-GEN-180..183 |

---

## 11.5. Landing visual pass v0.5.1 (added 2026-05-15)

Tightening pass on v0.5:

- **Page background** locked to `#060913` (rgb 6 9 19) to match the supplied
  wordmark image; `--c-surface` and `--c-surfaceLight` re-keyed accordingly.
- **Featured card and list cards share width** (both `max-w-3xl`, single
  column). Pagination dots **render at the top inside the featured cover**
  in a frosted pill; the giant chevrons sit OUTSIDE the card on the sides
  (absolute, no bg, no border).
- **Search input is centered** in the header via a 3-column grid
  `[logo | search | theme+login]`. Logo size stays at `md`.
- **Hashtag bar chips** no longer show the usage count — only `#tag`.
- **Login page chrome removed**: Allowlist preview, cohort paragraph,
  "MVP uses mocked GitHub auth · real OAuth in V1" footer all gone. The
  bg/text contrast on the handle `<input>` was broken because
  `colors.base` in Tailwind config collided with the built-in `text-base`
  font-size class — fixed by restoring `text-base { font-size: 1rem }`
  via `@layer utilities` and replacing the `text-base` *colour* usages
  with `text-ink` (always-dark token).

---

## 11. Landing visual pass v0.5 (added 2026-05-15)

User feedback after v0.4: logo too big and bg didn't match the logo image
hue; the blinking cursor needed to be in front of the logo; the featured
carousel card had too much content (description + buttons + upvote) — user
wanted a clean cover-only card with the title overlaid; arrows on the
carousel were still wrapped in circular bg, user wanted plain side
chevrons; "Visit" button should disappear from the public listing —
only "Open" should remain; upvote pill border was visually noisy and the
counter should sit naked next to the up-arrow.

### 11.1 New features

| ID | Feature | Priority |
|---|---|---|
| FEAT-GEN-035 | Page background hue matches the wordmark image (`#0B0F26`, blue-tinted dark) | Must |
| FEAT-GEN-036 | Header wordmark size set to `md`; blinking cursor lives in front of the wordmark even in image mode | Must |
| FEAT-GEN-037 | Featured carousel card is cover-only with title overlay + vignette; no description, no buttons, no upvote inside | Must |
| FEAT-GEN-038 | Featured carousel prev/next as plain chevrons on the LEFT and RIGHT of the card (no circular button, no background) | Must |
| FEAT-GEN-039 | List card action row: only "Open" remains; "Visit" / "Visit landing" removed from public listing | Must |
| FEAT-GEN-040 | Upvote control on list cards renders as a plain `↑ N` (up-arrow + count) with no border/pill | Must |
| FEAT-GEN-041 | List uses a single-column stack (was 2-col grid) so each card is full-width and the cover dominates | Must |

### 11.2 New FRs

| FR ID | Requirement | Test |
|---|---|---|
| FR-GEN-170 | Wordmark MUST render the blinking cursor in front of the wordmark in both image and CSS-fallback modes when `withCursor` is true. | TEST-GEN-170 |
| FR-GEN-171 | The public Landing list cards MUST NOT render a "Visit" or "Visit landing" action. | TEST-GEN-171 |
| FR-GEN-172 | The Featured carousel card MUST NOT render an in-card description, action row, or upvote. | TEST-GEN-172 |
| FR-GEN-173 | The carousel prev/next controls MUST be plain chevrons positioned outside the card (left and right), with no circular button or surface background. | TEST-GEN-173 |
| FR-GEN-174 | Upvote on list cards MUST render with no border, only `↑` + count, with color-only hover state. | TEST-GEN-174 |

### 11.3 Updated traceability matrix (additions)

| Feature | UC | FR | Test |
|---|---|---|---|
| FEAT-GEN-036 | — | FR-GEN-170 | TEST-GEN-170 |
| FEAT-GEN-037 | — | FR-GEN-172 | TEST-GEN-172 |
| FEAT-GEN-038 | — | FR-GEN-173 | (visual) |
| FEAT-GEN-039 | — | FR-GEN-171 | TEST-GEN-171 |
| FEAT-GEN-040 | — | FR-GEN-174 | (visual) |
