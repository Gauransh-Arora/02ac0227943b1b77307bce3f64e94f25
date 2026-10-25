import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from functools import lru_cache

# Ensure backend directory is in sys.path for direct script invocations
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.elexon import ElexonAPIError, ElexonClient
from app.services.metrics import calculate_metrics
from app.services.processing import (
    match_actuals_and_forecasts,
    prepare_actuals,
    prepare_forecasts,
    select_latest_forecasts,
)

app = FastAPI(
    title=settings.app_name,
    description="January 2026 UK wind forecast analytics",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ElexonAPIError)
async def elexon_api_error_handler(request: Request, exc: ElexonAPIError):
    return JSONResponse(
        status_code=502,
        content={"detail": f"Upstream Elexon service error: {exc}"},
    )



@lru_cache(maxsize=1)
def get_client() -> ElexonClient:
    return ElexonClient()


_cached_data = None


def clear_cache():
    """Clear in-memory analysis cache (primarily used in automated tests)."""
    global _cached_data
    _cached_data = None


import gzip
import json
import logging
from pathlib import Path

logger = logging.getLogger("uvicorn.error")
SNAPSHOT_FILE = Path(__file__).parent / "data" / "january_2026_snapshot.json.gz"


async def load_analysis(
    client: ElexonClient = Depends(get_client),
    force_refresh: bool = False,
):
    """Fetch and prepare source data for January analysis with caching and verified fallback."""
    global _cached_data
    if _cached_data is not None and not force_refresh:
        return _cached_data

    actual_start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    # Actual observations for the final January settlement periods publish on Feb 1/2
    actual_end = datetime(2026, 2, 2, tzinfo=timezone.utc)

    # Forecasts for Jan 1 delivery begin day-ahead on Dec 31
    forecast_start = datetime(2025, 12, 31, tzinfo=timezone.utc)
    forecast_end = datetime(2026, 2, 1, tzinfo=timezone.utc)

    try:
        actual_records = await client.fetch_actuals(actual_start, actual_end)
        forecast_records = await client.fetch_forecasts(forecast_start, forecast_end)
    except ElexonAPIError as exc:
        if settings.enable_snapshot_fallback and SNAPSHOT_FILE.exists():
            logger.warning(
                "Upstream Elexon API unreachable (%s). Using verified historical January 2026 snapshot fallback.",
                exc,
            )
            with gzip.open(SNAPSHOT_FILE, "rt", encoding="utf-8") as f:
                snapshot = json.load(f)
            actual_records = snapshot["actual_records"]
            forecast_records = snapshot["forecast_records"]
        else:
            raise

    actuals = prepare_actuals(actual_records)
    all_forecasts = prepare_forecasts(forecast_records)
    selected_forecasts = select_latest_forecasts(all_forecasts)

    matched = match_actuals_and_forecasts(actuals, selected_forecasts)

    _cached_data = (actuals, all_forecasts, selected_forecasts, matched)
    return _cached_data



def parse_january_date(date_str: str) -> datetime:
    """Validate that input date string is in YYYY-MM-DD format and strictly within January 2026."""
    try:
        parsed = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD") from exc

    if parsed.year != 2026 or parsed.month != 1:
        raise HTTPException(
            status_code=400,
            detail="Date must be within January 2026 (2026-01-01 to 2026-01-31)",
        )

    return datetime(parsed.year, parsed.month, parsed.day, tzinfo=timezone.utc)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
    }


@app.get("/api/overview")
async def overview(analysis=Depends(load_analysis)):
    try:
        actuals, _, selected, matched = analysis
    except ElexonAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "period": {
            "start": "2026-01-01",
            "end": "2026-01-31",
        },
        "actual_records": len(actuals),
        "selected_forecast_records": len(selected),
        "accuracy": calculate_metrics(matched),
    }


@app.get("/api/overview/series")
async def overview_series(analysis=Depends(load_analysis)):
    try:
        _, _, _, matched = analysis
    except ElexonAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    hourly = [
        {
            "startTime": row.startTime.isoformat(),
            "publishTime": row.publishTime.isoformat(),
            "forecast_mw": float(row.forecast_mw),
            "actual_mw": float(row.actual_mw),
            "error_mw": float(row.forecast_mw - row.actual_mw),
            "absolute_error_mw": float(abs(row.forecast_mw - row.actual_mw)),
        }
        for row in matched.itertuples()
    ]

    daily_metrics = []
    for day_int in range(1, 32):
        day_str = f"2026-01-{day_int:02d}"
        day_start = datetime(2026, 1, day_int, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        if not matched.empty and "startTime" in matched.columns:
            sub = matched.loc[(matched["startTime"] >= day_start) & (matched["startTime"] < day_end)]
            m = calculate_metrics(sub)
        else:
            m = {"mae_mw": None, "rmse_mw": None, "bias_mw": None, "matched_periods": 0}

        daily_metrics.append({
            "date": day_str,
            "label": f"Jan {day_int}",
            "mae_mw": m["mae_mw"],
            "rmse_mw": m["rmse_mw"],
            "bias_mw": m["bias_mw"],
            "matched_periods": m["matched_periods"],
        })

    if not matched.empty and "forecast_mw" in matched.columns and "actual_mw" in matched.columns:
        sorted_matched = matched.copy()
        sorted_matched["abs_error"] = (sorted_matched["forecast_mw"] - sorted_matched["actual_mw"]).abs()
        top_errors = sorted_matched.sort_values("abs_error", ascending=False).head(15)
        largest_errors = [
            {
                "rank": idx + 1,
                "startTime": row.startTime.isoformat(),
                "publishTime": row.publishTime.isoformat(),
                "forecast_mw": float(row.forecast_mw),
                "actual_mw": float(row.actual_mw),
                "error_mw": float(row.forecast_mw - row.actual_mw),
                "absolute_error_mw": float(row.abs_error),
            }
            for idx, row in enumerate(top_errors.itertuples())
        ]
    else:
        largest_errors = []

    return {
        "period": {
            "start": "2026-01-01",
            "end": "2026-01-31",
        },
        "total_periods": len(matched),
        "hourly_series": hourly,
        "daily_accuracy": daily_metrics,
        "largest_errors": largest_errors,
    }


@app.get("/api/forecasts")
async def forecasts(
    date: str = Query(..., description="Target date in YYYY-MM-DD format (January 2026)"),
    analysis=Depends(load_analysis),
):
    day_start = parse_january_date(date)
    day_end = day_start + timedelta(days=1)

    try:
        _, _, selected, _ = analysis
    except ElexonAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not selected.empty and "startTime" in selected.columns:
        subset = selected.loc[
            (selected["startTime"] >= day_start)
            & (selected["startTime"] < day_end)
        ]
    else:
        subset = selected

    return {
        "date": date,
        "forecast_periods": [
            {
                "startTime": row.startTime.isoformat(),
                "publishTime": row.publishTime.isoformat(),
                "generation_mw": float(row.forecast_mw),
            }
            for row in subset.itertuples()
        ],
    }


@app.get("/api/accuracy")
async def accuracy(
    date: str = Query(..., description="Target date in YYYY-MM-DD format (January 2026)"),
    analysis=Depends(load_analysis),
):
    day_start = parse_january_date(date)
    day_end = day_start + timedelta(days=1)

    try:
        _, _, _, matched = analysis
    except ElexonAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not matched.empty and "startTime" in matched.columns:
        subset = matched.loc[
            (matched["startTime"] >= day_start)
            & (matched["startTime"] < day_end)
        ]
    else:
        subset = matched

    result = calculate_metrics(subset)
    result["date"] = date
    result["periods"] = [
        {
            "startTime": row.startTime.isoformat(),
            "publishTime": row.publishTime.isoformat(),
            "forecast_mw": float(row.forecast_mw),
            "actual_mw": float(row.actual_mw),
            "error_mw": float(row.forecast_mw - row.actual_mw),
            "absolute_error_mw": float(abs(row.forecast_mw - row.actual_mw)),
        }
        for row in subset.itertuples()
    ]

    return result


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)

