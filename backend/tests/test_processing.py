import pandas as pd
import pytest
from app.services.processing import (
    prepare_actuals,
    prepare_forecasts,
    select_latest_forecasts,
    match_actuals_and_forecasts,
)


def test_prepare_actuals_january_boundaries():
    records = [
        # Before January
        {"startTime": "2025-12-31T23:30:00Z", "publishTime": "2026-01-01T00:00:00Z", "generation": 1000},
        # Exact start boundary (included)
        {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2026-01-01T00:30:00Z", "generation": 1100},
        # Inside January
        {"startTime": "2026-01-15T12:00:00Z", "publishTime": "2026-01-15T12:30:00Z", "generation": 1500},
        # Last period of January (included)
        {"startTime": "2026-01-31T23:30:00Z", "publishTime": "2026-02-01T00:00:00Z", "generation": 1800},
        # Exact end boundary (February 1 00:00:00Z - exclusive, must be dropped)
        {"startTime": "2026-02-01T00:00:00Z", "publishTime": "2026-02-01T00:30:00Z", "generation": 2000},
        # After January
        {"startTime": "2026-02-01T01:00:00Z", "publishTime": "2026-02-01T01:30:00Z", "generation": 2200},
    ]
    df = prepare_actuals(records)
    assert len(df) == 3
    times = [t.isoformat() for t in df["startTime"]]
    assert "2026-01-01T00:00:00+00:00" in times
    assert "2026-01-15T12:00:00+00:00" in times
    assert "2026-01-31T23:30:00+00:00" in times
    assert "2025-12-31T23:30:00+00:00" not in times
    assert "2026-02-01T00:00:00+00:00" not in times


def test_prepare_actuals_revision_deduplication():
    # Two actuals for the same delivery startTime with different publishTime
    records = [
        {"startTime": "2026-01-05T10:00:00Z", "publishTime": "2026-01-05T10:30:00Z", "generation": 5000},
        {"startTime": "2026-01-05T10:00:00Z", "publishTime": "2026-01-05T11:00:00Z", "generation": 5200},  # Later revision
    ]
    df = prepare_actuals(records)
    assert len(df) == 1
    assert df.iloc[0]["actual_mw"] == 5200
    assert df.iloc[0]["publishTime"] == pd.Timestamp("2026-01-05T11:00:00Z")


def test_prepare_actuals_invalid_values():
    records = [
        {"startTime": "invalid-date", "publishTime": "2026-01-01T00:30:00Z", "generation": 1000},
        {"startTime": "2026-01-01T01:00:00Z", "publishTime": "invalid-publish", "generation": 1000},
        {"startTime": "2026-01-01T02:00:00Z", "publishTime": "2026-01-01T02:30:00Z", "generation": "not-a-number"},
        {"startTime": "2026-01-01T03:00:00Z", "publishTime": "2026-01-01T03:30:00Z", "generation": float("inf")},
        {"startTime": "2026-01-01T04:00:00Z", "publishTime": "2026-01-01T04:30:00Z", "generation": 1500},
    ]
    df = prepare_actuals(records)
    assert len(df) == 1
    assert df.iloc[0]["actual_mw"] == 1500


def test_prepare_actuals_empty():
    df = prepare_actuals([])
    assert df.empty
    assert list(df.columns) == ["startTime", "publishTime", "actual_mw"]


def test_prepare_forecasts_retains_versions():
    # Multiple forecast versions for same delivery window should be preserved
    records = [
        {"startTime": "2026-01-10T12:00:00Z", "publishTime": "2026-01-09T08:00:00Z", "generation": 10000},
        {"startTime": "2026-01-10T12:00:00Z", "publishTime": "2026-01-09T09:30:00Z", "generation": 10500},
        {"startTime": "2026-01-10T12:00:00Z", "publishTime": "2026-01-09T14:00:00Z", "generation": 11000},
    ]
    df = prepare_forecasts(records)
    assert len(df) == 3
    assert list(df["forecast_mw"]) == [10000, 10500, 11000]


def test_prepare_forecasts_preserves_december_published_for_january_delivery():
    records = [
        # Forecast published Dec 31 for Jan 1 delivery must be kept!
        {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2025-12-31T09:30:00Z", "generation": 12000},
        # Delivery in Dec should be dropped
        {"startTime": "2025-12-31T23:00:00Z", "publishTime": "2025-12-30T09:30:00Z", "generation": 11000},
    ]
    df = prepare_forecasts(records)
    assert len(df) == 1
    assert df.iloc[0]["startTime"] == pd.Timestamp("2026-01-01T00:00:00Z")
    assert df.iloc[0]["forecast_mw"] == 12000


def test_select_latest_forecasts_cutoff_enforcement():
    # Target delivery: 2026-01-15 14:00 UTC
    # Day before delivery in London: 2026-01-14
    # Cutoff at 10:00 Europe/London = 2026-01-14T10:00:00Z
    forecasts = pd.DataFrame({
        "startTime": [
            pd.Timestamp("2026-01-15T14:00:00Z"),
            pd.Timestamp("2026-01-15T14:00:00Z"),
            pd.Timestamp("2026-01-15T14:00:00Z"),
            pd.Timestamp("2026-01-15T14:00:00Z"),
        ],
        "publishTime": [
            pd.Timestamp("2026-01-14T07:00:00Z"),  # Eligible (early)
            pd.Timestamp("2026-01-14T09:30:00Z"),  # Eligible (latest before cutoff)
            pd.Timestamp("2026-01-14T10:00:00Z"),  # Eligible (exact cutoff boundary)
            pd.Timestamp("2026-01-14T10:01:00Z"),  # Ineligible (post-cutoff leak attempt)
        ],
        "forecast_mw": [10000.0, 12000.0, 12500.0, 15000.0],
    })

    # When exact 10:00 is included
    selected = select_latest_forecasts(forecasts, cutoff_hour=10)
    assert len(selected) == 1
    assert selected.iloc[0]["forecast_mw"] == 12500.0
    assert selected.iloc[0]["publishTime"] == pd.Timestamp("2026-01-14T10:00:00Z")


def test_select_latest_forecasts_post_cutoff_excluded():
    # If the only available forecast is published AFTER the cutoff:
    forecasts = pd.DataFrame({
        "startTime": [pd.Timestamp("2026-01-15T14:00:00Z")],
        "publishTime": [pd.Timestamp("2026-01-14T11:00:00Z")],  # After 10:00 cutoff
        "forecast_mw": [12000.0],
    })
    selected = select_latest_forecasts(forecasts, cutoff_hour=10)
    # Should not select anything (empty) rather than leaking an ineligible forecast
    assert len(selected) == 0


def test_select_latest_forecasts_empty():
    empty_df = pd.DataFrame(columns=["startTime", "publishTime", "forecast_mw"])
    selected = select_latest_forecasts(empty_df)
    assert selected.empty


def test_match_actuals_and_forecasts_exact_join():
    forecasts = pd.DataFrame({
        "startTime": [
            pd.Timestamp("2026-01-01T00:00:00Z"),
            pd.Timestamp("2026-01-01T01:00:00Z"),
        ],
        "publishTime": [
            pd.Timestamp("2025-12-31T09:30:00Z"),
            pd.Timestamp("2025-12-31T09:30:00Z"),
        ],
        "forecast_mw": [1000.0, 2000.0],
    })

    # Actuals has half-hourly records: 00:00, 00:30, 01:00
    actuals = pd.DataFrame({
        "startTime": [
            pd.Timestamp("2026-01-01T00:00:00Z"),
            pd.Timestamp("2026-01-01T00:30:00Z"),
            pd.Timestamp("2026-01-01T01:00:00Z"),
        ],
        "publishTime": [
            pd.Timestamp("2026-01-01T00:35:00Z"),
            pd.Timestamp("2026-01-01T01:05:00Z"),
            pd.Timestamp("2026-01-01T01:35:00Z"),
        ],
        "actual_mw": [950.0, 1100.0, 2100.0],
    })

    matched = match_actuals_and_forecasts(actuals, forecasts)
    # Exact join matches top-of-hour periods: 00:00 and 01:00
    assert len(matched) == 2
    assert list(matched["actual_mw"]) == [950.0, 2100.0]
    assert list(matched["forecast_mw"]) == [1000.0, 2000.0]


def test_match_actuals_and_forecasts_duplicate_key_safety():
    # If a bug introduced duplicate keys, validate="one_to_one" must raise MergeError
    forecasts = pd.DataFrame({
        "startTime": [
            pd.Timestamp("2026-01-01T00:00:00Z"),
            pd.Timestamp("2026-01-01T00:00:00Z"),  # Duplicate
        ],
        "publishTime": [
            pd.Timestamp("2025-12-31T09:30:00Z"),
            pd.Timestamp("2025-12-31T09:30:00Z"),
        ],
        "forecast_mw": [1000.0, 1200.0],
    })
    actuals = pd.DataFrame({
        "startTime": [pd.Timestamp("2026-01-01T00:00:00Z")],
        "actual_mw": [950.0],
    })

    with pytest.raises(pd.errors.MergeError):
        match_actuals_and_forecasts(actuals, forecasts)
