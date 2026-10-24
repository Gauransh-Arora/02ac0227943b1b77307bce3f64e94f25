import numpy as np
import pandas as pd
from app.config import settings


def prepare_actuals(records: list[dict]) -> pd.DataFrame:
    """Clean actual wind generation and retain January delivery periods [2026-01-01T00:00:00Z, 2026-02-01T00:00:00Z)."""
    columns = ["startTime", "publishTime", "generation"]
    frame = pd.DataFrame(records)
    for column in columns:
        if column not in frame.columns:
            frame[column] = pd.NA
    frame = frame[columns].copy()

    frame["startTime"] = pd.to_datetime(frame["startTime"], format="ISO8601", utc=True, errors="coerce")
    frame["publishTime"] = pd.to_datetime(frame["publishTime"], format="ISO8601", utc=True, errors="coerce")
    frame["generation"] = pd.to_numeric(frame["generation"], errors="coerce")

    # Drop NaT, NaN, and non-finite values
    valid_mask = (
        frame["startTime"].notna()
        & frame["publishTime"].notna()
        & frame["generation"].notna()
        & np.isfinite(frame["generation"])
    )
    frame = frame[valid_mask].copy()

    start = pd.Timestamp("2026-01-01T00:00:00Z")
    end = pd.Timestamp("2026-02-01T00:00:00Z")

    frame = frame.loc[(frame["startTime"] >= start) & (frame["startTime"] < end)]
    if frame.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "actual_mw"])

    # For duplicate revisions for the same delivery interval, keep the latest published
    frame = (
        frame.sort_values("publishTime")
        .drop_duplicates("startTime", keep="last")
        .rename(columns={"generation": "actual_mw"})
    )

    return frame[["startTime", "publishTime", "actual_mw"]].sort_values("startTime").reset_index(drop=True)


def prepare_forecasts(records: list[dict]) -> pd.DataFrame:
    """Clean forecast records without discarding forecast versions."""
    columns = ["startTime", "publishTime", "generation"]
    frame = pd.DataFrame(records)
    for column in columns:
        if column not in frame.columns:
            frame[column] = pd.NA
    frame = frame[columns].copy()

    frame["startTime"] = pd.to_datetime(frame["startTime"], format="ISO8601", utc=True, errors="coerce")
    frame["publishTime"] = pd.to_datetime(frame["publishTime"], format="ISO8601", utc=True, errors="coerce")
    frame["generation"] = pd.to_numeric(frame["generation"], errors="coerce")

    valid_mask = (
        frame["startTime"].notna()
        & frame["publishTime"].notna()
        & frame["generation"].notna()
        & np.isfinite(frame["generation"])
    )
    frame = frame[valid_mask].copy()

    start = pd.Timestamp("2026-01-01T00:00:00Z")
    end = pd.Timestamp("2026-02-01T00:00:00Z")

    # Retain all forecast versions for January delivery periods (regardless of publishTime)
    frame = frame.loc[(frame["startTime"] >= start) & (frame["startTime"] < end)]
    if frame.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "forecast_mw"])

    return (
        frame.drop_duplicates(["startTime", "publishTime"], keep="last")
        .rename(columns={"generation": "forecast_mw"})
        .sort_values(["startTime", "publishTime"])
        .reset_index(drop=True)
    )


def select_latest_forecasts(
    forecasts: pd.DataFrame,
    cutoff_hour: int | None = None,
) -> pd.DataFrame:
    """Select the latest forecast available at the day-ahead cutoff.

    Assumption / Documentation:
    The decision cutoff defaults to 10:00 Europe/London on the calendar day before delivery.
    This is configurable via settings.day_ahead_cutoff_hour or the cutoff_hour argument.
    Only forecast versions with publishTime <= decision_cutoff are eligible.
    """
    if cutoff_hour is None:
        cutoff_hour = settings.day_ahead_cutoff_hour

    if forecasts.empty or "startTime" not in forecasts.columns or "publishTime" not in forecasts.columns:
        return pd.DataFrame(columns=["startTime", "publishTime", "forecast_mw"])

    frame = forecasts.dropna(subset=["startTime", "publishTime"]).copy()
    if frame.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "forecast_mw"])

    # Ensure tz-awareness in UTC
    if frame["startTime"].dt.tz is None:
        frame["startTime"] = frame["startTime"].dt.tz_localize("UTC")
    else:
        frame["startTime"] = frame["startTime"].dt.tz_convert("UTC")

    if frame["publishTime"].dt.tz is None:
        frame["publishTime"] = frame["publishTime"].dt.tz_localize("UTC")
    else:
        frame["publishTime"] = frame["publishTime"].dt.tz_convert("UTC")

    delivery_dates = frame["startTime"].dt.tz_convert("Europe/London").dt.date
    local_dates = pd.to_datetime(delivery_dates)
    local_cutoffs = (
        local_dates - pd.Timedelta(days=1) + pd.Timedelta(hours=cutoff_hour)
    ).dt.tz_localize("Europe/London")

    frame["decision_cutoff"] = local_cutoffs.dt.tz_convert("UTC")

    # Strict cutoff: only forecasts published AT OR BEFORE cutoff
    eligible = frame.loc[frame["publishTime"] <= frame["decision_cutoff"]]
    if eligible.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "forecast_mw"])

    return (
        eligible.sort_values("publishTime")
        .drop_duplicates("startTime", keep="last")
        .drop(columns=["decision_cutoff"])
        .sort_values("startTime")
        .reset_index(drop=True)
    )


def match_actuals_and_forecasts(actuals: pd.DataFrame, forecasts: pd.DataFrame) -> pd.DataFrame:
    """Join selected forecasts to actuals on delivery timestamp.

    Matches 1-to-1 on startTime, preserving source timestamps and units.
    """
    cols = ["startTime", "publishTime", "forecast_mw", "actual_mw"]
    if forecasts.empty or actuals.empty:
        return pd.DataFrame(columns=cols)

    if "startTime" not in forecasts.columns or "startTime" not in actuals.columns:
        return pd.DataFrame(columns=cols)

    return (
        forecasts.merge(
            actuals[["startTime", "actual_mw"]],
            on="startTime",
            how="inner",
            validate="one_to_one",
        )
        .sort_values("startTime")
        .reset_index(drop=True)
    )
