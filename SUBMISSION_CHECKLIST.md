# AERIS — Final Submission Checklist

This checklist provides a structured, pre-submission audit covering code quality, documentation accuracy, container health, security safeguards, and submission deliverables for **AERIS — Wind Forecast Intelligence**.

---

## 1. Code Quality & Documentation

- [x] **Repository Documentation (`README.md`)**:
  - [x] Project value proposition and problem statement accurately reflect January 2026 UK wind generation context.
  - [x] Architecture Mermaid diagram verified against actual Docker Compose and Nginx reverse proxy implementation.
  - [x] Data sources accurately list Elexon BMRS API (`FUELHH` and `WINDFOR` streams).
  - [x] 10:00 Europe/London cutoff clearly identified as a project analytical assumption (not an officially mandated statutory market rule).
  - [x] Timestamp alignment (hourly forecast vs. half-hourly actuals) and resolution (744 matched periods) clearly documented.
  - [x] Formulas and sign conventions for MAE, RMSE, and Forecast Bias ($F - A$) explicitly stated.
  - [x] Local development and Docker commands verified using real project package managers (`uv`, `pnpm`, `docker compose`).
  - [x] Environment variables table verified against `backend/app/config.py` (`WIND_` prefix and defaults).
  - [x] API endpoint contracts verified against live responses for `/api/health`, `/api/overview`, `/api/overview/series`, `/api/forecasts`, and `/api/accuracy`.
  - [x] Historical snapshot fallback provenance and limitations documented.

- [x] **AI Use Disclosure (`AI_USE.md`)**:
  - [x] Accurately lists specific generative AI tools utilized (**ChatGPT** and **Google DeepMind Antigravity** with **Gemini 3.8 Flash**).
  - [x] Distinguishes AI assistance (boilerplate generation, test scaffolding, syntax refactoring) from independent human engineering (verification of Elexon data streams, mathematical verification of bias formulas, testing, and containerization).
  - [x] Signed developer declaration included.

- [x] **Demonstration Video Outline (`DEMO_VIDEO_OUTLINE.md`)**:
  - [x] Total scripted time $\le 10\text{ minutes}$ (target ~8:30).
  - [x] Part A (Client Pitch) strictly $\le 5\text{ minutes}$ (~4:30).
  - [x] Part B (Technical Review) strictly $\le 5\text{ minutes}$ (~4:30).
  - [x] Includes screen actions, speaking notes, and verification checklists.

- [x] **Code Cleanliness & Integrity**:
  - [x] No commented-out legacy code blocks or debugging `print` statements in production routes.
  - [x] Docstrings and typing annotations preserved throughout backend services.
  - [x] Consistent TypeScript typing across all frontend API clients and chart components.

---

## 2. Validation, Testing & Deployment

- [x] **Automated Test Suite**:
  - [x] All 32 backend tests passing (`uv run --directory backend pytest`).
  - [x] Tests cover edge cases: missing periods, zero errors, timezone conversions, leap/month boundaries, CORS origin whitelisting & rejection, and 502 error forwarding.
  - [x] No skipped or artificially mocked passes.

- [x] **Frontend Linting & Production Build**:
  - [x] Zero ESLint errors or warnings (`pnpm --dir frontend lint`).
  - [x] TypeScript builds cleanly with zero diagnostics (`tsc -b`).
  - [x] Production bundle successfully builds (`pnpm --dir frontend build`).
  - [x] Static bundle inspected to ensure no hardcoded `127.0.0.1:8000` or `localhost:8000` URLs are compiled into client JS.
  - [x] `frontend/vercel.json` added for clean client-side SPA routing.

- [x] **Containerization & Docker Health (Local Evaluation)**:
  - [x] `backend/Dockerfile` builds cleanly using multi-stage `python:3.12-slim` + `uv`, supporting dynamic `$PORT` binding.
  - [x] `frontend/Dockerfile` builds cleanly using multi-stage `node:22-alpine` + `nginx:alpine`.
  - [x] `docker-compose.yml` orchestrates both services on an internal bridge network (`aeris-network`).
  - [x] Backend container health check (`urllib.request` on `/api/health`) reaches `healthy` status.
  - [x] Frontend container `depends_on` backend with `condition: service_healthy`.
  - [x] Nginx reverse proxy successfully forwards `/api/...` traffic to `http://backend:8000/api/` with query string preservation.
  - [x] Container restart repeatability verified via `docker compose restart`.
  - [x] Clean teardown and recreation verified via `docker compose down && docker compose up -d`.

- [x] **Cloud Deployment Readiness (Free Tier: Vercel + Render)**:
  - [x] Frontend configured for Vercel deployment with dynamic `VITE_API_BASE_URL` environment variable support while preserving relative `/api/` fallback for local Docker Compose.
  - [x] Backend configured for Render Free Web Service with dynamic `0.0.0.0:$PORT` binding and `/api/health` health check path.
  - [x] `backend/requirements.txt` generated from pinned lockfile for seamless pip installation on Render.
  - [x] `render.yaml` Blueprint added to repository root configuring backend service, Python 3.12, build/start commands, and health check.
  - [x] Strict CORS origin validation implemented via `WIND_CORS_ORIGINS` setting, preserving local development origins and disallowing arbitrary wildcard origins.
  - [x] Snapshot fallback file (`backend/app/data/january_2026_snapshot.json.gz`) verified tracked by Git and resilient to Elexon API outages.

- [x] **Security & Credentials Audit**:
  - [x] `.dockerignore` files present in both `backend/` and `frontend/` excluding `.git`, `.venv`, `node_modules`, `dist`, and `.env`.
  - [x] `.gitignore` verified to exclude `.env`, `.env.*`, and credentials.
  - [x] No API keys, passwords, private tokens, or hardcoded sensitive credentials committed in the repository.

- [x] **Responsive UI & Browser Experience**:
  - [x] Dashboard layout renders cleanly on desktop (1920x1080) and responsive screens.
  - [x] Glassmorphism panels, turbine background visual, and typography render without clipping.
  - [x] Dual-series generation chart tooltips, zoom, and toggles operate smoothly.
  - [x] Date inspection linking from Overview to Forecast Explorer functions correctly.

---

## 3. Submission Deliverables & Metadata

- [ ] **GitHub Repository Settings**:
  - [ ] Repository created with clean, professional naming (e.g., `aeris-wind-forecast-intelligence` or `wind-forecast-portal`).
  - [ ] Repository visibility confirmed as **Public** (or shared with designated evaluator usernames).
  - [ ] Default branch set to `main` with all files committed.
  - [ ] GitHub repository description and tags added (`fastapi`, `react`, `wind-energy`, `elexon-bmrs`, `docker`).

- [ ] **Live Cloud Deployment Execution & Verification (Vercel + Render)**:
  - [ ] *Status: Pending User Dashboard Deployment (do not mark checked until live deployment is verified)*
  - [ ] Render Free Web Service deployed from `backend` using `render.yaml` Blueprint or manual Web Service setup.
  - [ ] Live Render health probe verified: `curl -i "https://<your-backend>.onrender.com/api/health"` returns HTTP 200 OK.
  - [ ] Live Render overview endpoint verified: `curl -i "https://<your-backend>.onrender.com/api/overview"` returns HTTP 200 OK (744 matched periods).
  - [ ] Live Render daily endpoints verified: `curl -i "https://<your-backend>.onrender.com/api/forecasts?date=2026-01-15"` and `curl -i "https://<your-backend>.onrender.com/api/accuracy?date=2026-01-15"` return HTTP 200 OK.
  - [ ] Vercel Hobby frontend deployed from `frontend` with `VITE_API_BASE_URL` set to the live Render backend URL.
  - [ ] Render `WIND_CORS_ORIGINS` environment variable updated with the live Vercel production URL (e.g. `https://<your-project>.vercel.app`).
  - [ ] End-to-end browser verification completed on the live Vercel domain: KPI cards render, charts display, date navigation functions, and DevTools Network tab shows 200 OK with zero CORS errors.
  - [ ] *Local Docker Fallback Confirmation: Verified that `docker compose up --build -d` runs out-of-the-box on port 8080.*

- [ ] **Demonstration Video Recording**:
  - [ ] Video recorded following `DEMO_VIDEO_OUTLINE.md`.
  - [ ] Video duration verified $\le 10\text{ minutes}$ (Part A $\le 5\text{ mins}$, Part B $\le 5\text{ mins}$).
  - [ ] Audio and video quality clear (1080p recommended).
  - [ ] Video uploaded to YouTube with privacy setting set strictly to **Unlisted** (not Private).
  - [ ] Unlisted video link tested in an incognito/private browser window to verify accessibility.

- [ ] **Final Submission Form**:
  - [ ] Public GitHub repository link entered and verified.
  - [ ] Unlisted YouTube video link entered and verified.
  - [ ] Live deployment link entered (or local Docker instructions noted).
  - [ ] Confirmation that all required files (`README.md`, `AI_USE.md`, `DEMO_VIDEO_OUTLINE.md`, `SUBMISSION_CHECKLIST.md`, `render.yaml`) are present at repository root.

