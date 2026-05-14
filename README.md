# Genesis Startup Studio

Spec-first startup operating system for the AI-native economy.

The product runs the **CLAUDE.md Execution Kernel** as a first-class engine:
versioned spec artifacts, visible diffs, live Mermaid architecture, GitHub-only
auth, and a demo-day market simulation.

## Repo layout

```
/SPEC_v0.1.md           # master spec — PRD + BRS + Architecture + Test Strategy + Project Plan
/web                    # React MVP (Vite + TS + Tailwind + Vitest + Mermaid)
/CLAUDE.md              # methodology (Execution Kernel, Artifact Registry)
```

## Quick start

```bash
cd web
pnpm install            # or npm/yarn
pnpm test               # Vitest — 51 tests across 13 files
pnpm typecheck          # tsc --noEmit
pnpm dev                # Vite dev server at http://localhost:5173
pnpm build              # production bundle in web/dist
```

## Authentication (MVP)

GitHub is the **only** entry point. For the demo cohort the admin maintains an
allowlist of GitHub handles. Try one of the seeded handles on the Login screen:

- `alice` · founder
- `bob`   · founder
- `carol` · founder
- `dmitry`· founder (Orbit is unpublished — try publishing it)
- `admin` · admin console

## Architecture (one-paragraph)

A framework-agnostic **Domain Layer** (`web/src/domain`) owns rules: ID
generation, spec CRUD, versioning, traceability, scoring, investments, modes
and the allowlist. Behind ports (`web/src/ai/ports.ts`) sit two deterministic
mocks — `MockAiAnalyst` and `MockPersonaSimulator` — so the V1 swap to real
LLMs is a one-file change. The UI is React + Tailwind with a dark neon
design system. Persistence is in-memory + `localStorage`. See
`SPEC_v0.1.md §3` for full architecture, ERD and ADRs.

## Tests

The test suite is the spec contract:

| TEST ID range | What it locks down |
|---|---|
| TEST-GEN-001..003 | Allowlist gate + admin CRUD |
| TEST-GEN-004..014 | Startup / repo CRUD, spec CRUD + versioning + traceability |
| TEST-GEN-020..023 | Spec completeness, readiness formula, showcase rendering |
| TEST-GEN-030..033 | Credits, invest reasons, self-invest policy |
| TEST-GEN-040..041 | Persona simulation determinism + `SPEC_TOO_THIN` guard |
| TEST-GEN-050      | Leaderboard sort + tie-breaker |
| TEST-GEN-060..061 | Weights validation + self-invest policy toggle |
| TEST-GEN-070..072 | Versioning + diff history |
| TEST-GEN-080..082 | Mermaid diagrams from architecture model |
| TEST-GEN-090..091 | CLAUDE.md mode tracker |

Run `pnpm test --reporter=verbose` to see them grouped by feature.

## Docker / Deploy

Local container:

```bash
GENESIS_PORT=8026 docker compose up -d --build
# open http://localhost:8026
docker compose logs -f
docker compose down
```

Deploy to GCE VM via `gcloud`:

```bash
# defaults: project=i-crossbar-433120-v3 zone=europe-west1-b instance=human-1 port=8026
./scripts/deploy-gcp.sh

# or override:
PROJECT=i-crossbar-433120-v3 ZONE=europe-west1-b \
  INSTANCE=human-1 PORT=8027 ./scripts/deploy-gcp.sh
```

The script packs the source (skipping `node_modules`/`dist`/`.git`), `scp`s it
to `/opt/genesis` on the VM, then runs `docker compose up -d --build`. The VM
must have Docker installed. Open the firewall once:

```bash
gcloud compute firewall-rules create allow-genesis-8026 \
  --project=i-crossbar-433120-v3 \
  --direction=INGRESS --action=ALLOW --rules=tcp:8026 \
  --source-ranges=0.0.0.0/0
```

External IP:

```bash
gcloud compute instances describe human-1 \
  --project=i-crossbar-433120-v3 --zone=europe-west1-b \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

