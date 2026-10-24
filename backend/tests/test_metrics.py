import math
import numpy as np
import pandas as pd
from app.services.metrics import calculate_metrics


def test_calculate_metrics_empty():
    frame = pd.DataFrame(columns=["forecast_mw", "actual_mw"])
    res = calculate_metrics(frame)
    assert res["matched_periods"] == 0
    assert res["mae_mw"] is None
    assert res["rmse_mw"] is None
    assert res["bias_mw"] is None


def test_calculate_metrics_missing_columns():
    frame = pd.DataFrame({"other_col": [1, 2, 3]})
    res = calculate_metrics(frame)
    assert res["matched_periods"] == 0
    assert res["mae_mw"] is None


def test_calculate_metrics_zero_error():
    frame = pd.DataFrame({
        "forecast_mw": [1500.0, 2500.0, 3500.0],
        "actual_mw": [1500.0, 2500.0, 3500.0],
    })
    res = calculate_metrics(frame)
    assert res["matched_periods"] == 3
    assert res["mae_mw"] == 0.0
    assert res["rmse_mw"] == 0.0
    assert res["bias_mw"] == 0.0


def test_calculate_metrics_hand_calculated():
    # Errors:
    # Row 1: 100 - 90 = +10
    # Row 2: 200 - 210 = -10
    # Row 3: 300 - 280 = +20
    # Absolute errors: [10, 10, 20] -> MAE = 40/3 = 13.333333333333334
    # Squared errors: [100, 100, 400] -> Mean = 600/3 = 200 -> RMSE = sqrt(200) ~ 14.1421356
    # Bias: (+10 - 10 + 20) / 3 = +20/3 = 6.666666666666667 (positive = overforecast)
    frame = pd.DataFrame({
        "forecast_mw": [100.0, 200.0, 300.0],
        "actual_mw": [90.0, 210.0, 280.0],
    })
    res = calculate_metrics(frame)
    assert res["matched_periods"] == 3
    assert abs(res["mae_mw"] - (40.0 / 3.0)) < 1e-6
    assert abs(res["rmse_mw"] - math.sqrt(200.0)) < 1e-6
    assert abs(res["bias_mw"] - (20.0 / 3.0)) < 1e-6
    assert res["mae_mw"] >= 0.0
    assert res["rmse_mw"] >= 0.0


def test_calculate_metrics_negative_bias():
    # Underforecasting: actual > forecast
    frame = pd.DataFrame({
        "forecast_mw": [100.0, 150.0],
        "actual_mw": [150.0, 200.0],
    })
    res = calculate_metrics(frame)
    # Errors: -50, -50 -> Bias: -50.0, MAE: 50.0, RMSE: 50.0
    assert res["bias_mw"] == -50.0
    assert res["mae_mw"] == 50.0
    assert res["rmse_mw"] == 50.0


def test_calculate_metrics_missing_and_nan_values():
    frame = pd.DataFrame({
        "forecast_mw": [100.0, np.nan, 200.0, None, 300.0],
        "actual_mw": [90.0, 110.0, np.nan, 150.0, 280.0],
    })
    # Only rows 0 (100 vs 90 -> err 10) and 4 (300 vs 280 -> err 20) are valid
    res = calculate_metrics(frame)
    assert res["matched_periods"] == 2
    assert res["mae_mw"] == 15.0
    assert res["bias_mw"] == 15.0
    assert abs(res["rmse_mw"] - math.sqrt((100 + 400) / 2)) < 1e-6


def test_calculate_metrics_non_finite_values():
    # Inf and -Inf should be filtered out
    frame = pd.DataFrame({
        "forecast_mw": [100.0, np.inf, 200.0, -np.inf],
        "actual_mw": [90.0, 100.0, 210.0, 50.0],
    })
    # Only rows 0 (err 10) and 2 (err -10) are valid
    res = calculate_metrics(frame)
    assert res["matched_periods"] == 2
    assert res["mae_mw"] == 10.0
    assert res["bias_mw"] == 0.0
    assert res["rmse_mw"] == 10.0


def test_calculate_metrics_all_invalid():
    frame = pd.DataFrame({
        "forecast_mw": [np.nan, np.inf, "invalid"],
        "actual_mw": [100.0, np.nan, 200.0],
    })
    res = calculate_metrics(frame)
    assert res["matched_periods"] == 0
    assert res["mae_mw"] is None
    assert res["rmse_mw"] is None
    assert res["bias_mw"] is None
