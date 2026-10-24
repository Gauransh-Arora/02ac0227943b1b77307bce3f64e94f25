import math
import numpy as np
import pandas as pd


def calculate_metrics(frame: pd.DataFrame) -> dict:
    """Calculate forecast accuracy on matched observations.

    Error sign convention:
        error_mw = forecast_mw - actual_mw
    Positive bias indicates overforecasting (forecast > actual).
    Negative bias indicates underforecasting (forecast < actual).
    """
    empty_result = {
        "matched_periods": 0,
        "mae_mw": None,
        "rmse_mw": None,
        "bias_mw": None,
    }

    if frame.empty or "forecast_mw" not in frame.columns or "actual_mw" not in frame.columns:
        return empty_result

    # Coerce to numeric, converting non-numeric strings to NaN
    f = pd.to_numeric(frame["forecast_mw"], errors="coerce")
    a = pd.to_numeric(frame["actual_mw"], errors="coerce")

    # Filter out missing, NaN, or non-finite (inf/-inf) values
    valid_mask = f.notna() & a.notna() & np.isfinite(f) & np.isfinite(a)
    valid_f = f[valid_mask]
    valid_a = a[valid_mask]

    n = len(valid_f)
    if n == 0:
        return empty_result

    errors = valid_f - valid_a

    return {
        "matched_periods": int(n),
        "mae_mw": float(errors.abs().mean()),
        "rmse_mw": float(math.sqrt((errors ** 2).mean())),
        "bias_mw": float(errors.mean()),
    }
