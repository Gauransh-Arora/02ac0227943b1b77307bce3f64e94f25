# AERIS — Demonstration Video Recording Script & Outline

**Target Platform**: Unlisted YouTube Video  
**Target Duration**: 8 minutes 30 seconds (**Strict Maximum: 10 minutes 00 seconds**)  
**Format**: Dual-part presentation — Part A (Client Pitch, $\le 5\text{ mins}$) + Part B (Technical Review, $\le 5\text{ mins}$)

---

## Recording Setup Checklist
- [ ] Screen resolution set to 1080p (1920x1080) with clean browser profile (no extraneous bookmarks or tabs).
- [ ] Docker Compose running locally (`docker compose up -d`) on `http://localhost:8080`.
- [ ] Terminal window open on the project root with readable font size (16pt+).
- [ ] VS Code / IDE open displaying key files (`processing.py`, `docker-compose.yml`, `test_api.py`).
- [ ] Audio input checked for clear vocal levels without background noise.

---

## Part A — Client Pitch (0:00 – 4:30 | Max: 5:00)

> **Objective**: Present the business problem, target audience, and demonstrate how AERIS delivers actionable commercial insight from complex energy market data.

### 0:00 – 1:00 | The Problem & Industry Context
- **Screen**: Title slide or landing view of the AERIS dashboard at [http://localhost:8080](http://localhost:8080).
- **Action**: Camera on speaker or screen showing the hero section with turbine visual and Great Britain fleet metadata.
- **Speaking Notes**:
  > *"Hello everyone. Today I'm presenting AERIS — an intelligence platform built to analyze Great Britain’s national wind generation forecast accuracy throughout January 2026.*
  > 
  > *In modern decarbonized power grids like the UK, wind energy is frequently the largest single source of electricity. However, wind is inherently intermittent. Electricity suppliers and trading desks must submit their physical contract positions day-ahead before market gate closure. When actual wind generation deviates from the day-ahead forecast, the system falls out of balance, triggering expensive 'Cashout' penalty charges and forcing National Grid ESO to fire up costly gas peaker plants.*
  > 
  > *To manage this financial exposure, energy traders and asset managers need transparency into how day-ahead forecasts actually perform against physical outturn. That is the exact mission of AERIS."*

### 1:00 – 2:30 | Executive Overview & Key January 2026 Insights
- **Screen**: AERIS Dashboard — Overview Tab.
- **Action**: Mouse hover over the 4 top KPI cards (MAE, RMSE, Forecast Bias, Matched Periods), then scroll smoothly down to the Generation Chart.
- **Speaking Notes**:
  > *"Here on the AERIS Overview Dashboard, we see settlement-grade analytics across all 744 hourly delivery periods of January 2026, ingested directly from the Elexon BMRS API.*
  > 
  > *Let’s look at the headline metrics: Across the entire month, our Mean Absolute Error was **2,107 MW**, with a Root Mean Squared Error of **2,611 MW**.*
  > 
  > *Most critically, look at our net Forecast Bias: **+1,839 MW**. In power trading, a positive bias signifies systematic overforecasting — meaning the day-ahead forecast routinely predicted significantly more wind than the turbines actually generated. For a commercial desk, this insight is crucial: persistent overforecasting leaves a supplier chronically short in the balancing mechanism, incurring real-time imbalance penalties.*
  > 
  > *Below the KPIs, our dual-series Generation Chart plots the day-ahead forecast in olive green against physical outturn in dark slate. We can immediately observe periods of high generation reaching nearly 20,000 MW, as well as pronounced forecast gaps during rapid weather shifts."*

### 2:30 – 3:45 | Daily Performance, Error Ranking & Deep-Dive
- **Screen**: Scroll to Daily Accuracy Chart and Largest Errors Table, then switch tabs to Forecast Explorer and Accuracy Analysis.
- **Action**: 
  1. Click on a bar with high error in the Daily Accuracy Chart (e.g., Jan 8 or Jan 15).
  2. Transition to the *Daily Comparison / Accuracy* tab showing 2026-01-15.
  3. Scroll through the hourly breakdown table.
- **Speaking Notes**:
  > *"A monthly average only tells part of the story. The Daily Accuracy chart breaks down error variance day-by-day. Notice how certain days experienced dramatic misses exceeding 4,000 MW MAE.*
  > 
  > *AERIS automatically extracts and ranks the top 15 largest forecast errors of the month. For instance, on January 8th at 14:00, the day-ahead forecast predicted 21,450 MW, but outturn reached only 11,200 MW — a staggering 10,250 MW gap.*
  > 
  > *By clicking any date, we navigate seamlessly to our Day-Level Explorer. For January 15th, AERIS breaks down all 24 settlement hours, showing exact forecast revision publication timestamps from Elexon and hourly variance.*
  > 
  > *This transforms raw public grid data into immediate situational awareness for commercial desks."*

### 3:45 – 4:30 | Commercial Value Proposition & Wrap-Up of Part A
- **Screen**: Return to main Overview page.
- **Action**: Pan across the Coverage Panel showing 100% data coverage and 744 matched periods.
- **Speaking Notes**:
  > *"In summary, AERIS provides trading and risk teams with three direct benefits: First, empirical quantification of forecast bias so traders can shade day-ahead positions; second, granular event auditing to dissect severe weather misses; and third, 100% verified data completeness backed by official settlement records.*
  > 
  > *Now, let’s transition into Part B for our Technical Architecture and Engineering Review."*

---

## Part B — Technical Review (4:30 – 9:00 | Max: 5:00)

> **Objective**: Review the architecture, data pipeline, forecast selection algorithms, Docker deployment, test coverage, and engineering trade-offs.

### 4:30 – 5:45 | Architecture & Technology Stack
- **Screen**: IDE showing project file tree and `docker-compose.yml`.
- **Action**: Point out `backend/`, `frontend/`, `docker-compose.yml`, and `frontend/nginx.conf`.
- **Speaking Notes**:
  > *"Welcome to the technical review. AERIS is engineered as a decoupled, containerized full-stack application.*
  > 
  > *On the frontend, we use React 19 with TypeScript, Vite, and Tailwind CSS v4, utilizing Recharts for vector graphics. In production, the client bundle is compiled into static assets and served by an Alpine Nginx web server.*
  > 
  > *The backend is powered by Python 3.12, FastAPI, and Pandas, with dependencies deterministically locked using Astral's `uv` package manager.*
  > 
  > *As shown in `docker-compose.yml`, both containers operate on an internal bridge network. The frontend is exposed on port 8080, while Nginx acts as a reverse proxy, forwarding all `/api/` calls directly to the FastAPI container on port 8000. Crucially, the frontend never makes calls to localhost:8000 from the browser, avoiding CORS complexities and preventing environment leakage."*

### 5:45 – 7:00 | Data Pipeline & Forecast Selection Methodology
- **Screen**: IDE showing `backend/app/services/processing.py` and `metrics.py`.
- **Action**: Highlight `select_latest_forecasts` (lines 82–133) and `calculate_metrics` (lines 6–44).
- **Speaking Notes**:
  > *"Let's look at the data ingestion and transformation pipeline in `processing.py`.*
  > 
  > *We stream two separate datasets from Elexon BMRS: `FUELHH` for actual outturn generation, filtered strictly for wind, and `WINDFOR` for forecasts.*
  > 
  > *A core engineering challenge is forecast selection: Elexon publishes multiple forecast horizons continuously. To establish a realistic day-ahead benchmark, we implemented `select_latest_forecasts` with a configurable 10:00 Europe/London cutoff on the calendar day prior to delivery.*
  > 
  > *Our pipeline handles timezone awareness between UTC and London time, filters strictly for forecasts where `publishTime <= decision_cutoff`, and retains the latest version issued before that cutoff.*
  > 
  > *Next, in `match_actuals_and_forecasts`, we perform a 1-to-1 inner join against actual generation timestamps, successfully matching all 744 hours in January.*
  > 
  > *In `metrics.py`, we implement vectorized calculations for MAE, RMSE, and Bias. We enforce the standard sign convention: Forecast minus Actual. Positive values strictly denote overforecasting."*

### 7:00 – 8:00 | API Contracts, Automated Testing & Verification
- **Screen**: Split screen showing terminal running tests and `curl` commands.
- **Action**: 
  1. Run `uv run --directory backend pytest` in terminal.
  2. Execute `curl -s http://localhost:8080/api/health` and `curl -s http://localhost:8080/api/overview`.
- **Speaking Notes**:
  > *"Reliability is backed by an automated test suite. Running `pytest`, all 29 unit and integration tests pass in approximately one second.*
  > 
  > *These tests validate API status codes, date parameter bounds, timezone shifts across midnight, zero-division protections, and mathematical edge cases.*
  > 
  > *Querying our live container via curl at `localhost:8080/api/overview`, you can see the response returned instantaneously through the Nginx reverse proxy.*
  > 
  > *Furthermore, in `backend/app/data`, we integrated a versioned 118 KB snapshot fallback of January 2026 data. If the upstream Elexon BMRS API suffers a network outage or rate-limiting during evaluation, the backend catches the exception, logs a warning, and falls back gracefully without dropping service availability."*

### 8:00 – 9:00 | Engineering Trade-Offs, Limitations & Conclusion
- **Screen**: Slide or IDE showing `backend/app/main.py` caching and `processing.py`.
- **Action**: Highlight the in-memory cache variable `_cached_data` in `main.py`.
- **Speaking Notes**:
  > *"To conclude, I'd like to highlight one key engineering trade-off and one limitation:*
  > 
  > *Trade-off: We chose an in-memory Pandas caching layer over introducing an external database like PostgreSQL. Because the target analysis covers a fixed historical month (January 2026), in-memory caching eliminated unnecessary database overhead, reduced container memory footprints to under 130 MB combined, and delivers sub-millisecond API response times.*
  > 
  > *Limitation: BMRS actuals are published half-hourly, while forecasts are published hourly. We matched 1-to-1 on the hour. A valuable future improvement would be implementing half-hourly linear interpolation to evaluate the intermediate thirty-minute settlement periods as well.*
  > 
  > *AERIS demonstrates a robust, reproducible, and production-ready solution to energy market analytics. Thank you for your time, and I welcome any questions."*

---

## Post-Recording Verification
- [ ] Total recording time verified $\le 10:00$.
- [ ] Part A verified $\le 5:00$.
- [ ] Part B verified $\le 5:00$.
- [ ] No personal credentials, secrets, or API tokens visible on screen.
- [ ] Uploaded to YouTube with visibility explicitly set to **Unlisted**.
