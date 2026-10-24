from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import app, get_client, clear_cache
from app.services.elexon import ElexonAPIError


class MockElexonClient:
    def __init__(self, fail: bool = False, empty: bool = False):
        self.fail = fail
        self.empty = empty

    async def fetch_actuals(self, publish_start: datetime, publish_end: datetime) -> list[dict]:
        if self.fail:
            raise ElexonAPIError("Simulated upstream Elexon failure on FUELHH")
        if self.empty:
            return []

        # Return mock records for Jan 1 and Jan 15
        return [
            # Jan 1 actuals
            {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2026-01-01T00:30:00Z", "fuelType": "WIND", "generation": 10000},
            {"startTime": "2026-01-01T00:30:00Z", "publishTime": "2026-01-01T01:00:00Z", "fuelType": "WIND", "generation": 10200},
            {"startTime": "2026-01-01T01:00:00Z", "publishTime": "2026-01-01T01:30:00Z", "fuelType": "WIND", "generation": 10500},
            # Jan 15 actuals
            {"startTime": "2026-01-15T00:00:00Z", "publishTime": "2026-01-15T00:30:00Z", "fuelType": "WIND", "generation": 14602},
            {"startTime": "2026-01-15T01:00:00Z", "publishTime": "2026-01-15T01:30:00Z", "fuelType": "WIND", "generation": 15000},
        ]

    async def fetch_forecasts(self, publish_start: datetime, publish_end: datetime) -> list[dict]:
        if self.fail:
            raise ElexonAPIError("Simulated upstream Elexon failure on WINDFOR")
        if self.empty:
            return []

        return [
            # Jan 1 forecasts published Dec 31 before 10:00 cutoff
            {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2025-12-31T09:30:00Z", "generation": 10500},
            {"startTime": "2026-01-01T01:00:00Z", "publishTime": "2025-12-31T09:30:00Z", "generation": 11000},
            # Jan 15 forecasts published Jan 14 before 10:00 cutoff
            {"startTime": "2026-01-15T00:00:00Z", "publishTime": "2026-01-14T09:30:00Z", "generation": 15828},
            {"startTime": "2026-01-15T01:00:00Z", "publishTime": "2026-01-14T09:30:00Z", "generation": 15200},
        ]


@pytest.fixture(autouse=True)
def setup_mock_client():
    clear_cache()
    mock = MockElexonClient()
    app.dependency_overrides[get_client] = lambda: mock
    yield
    app.dependency_overrides.clear()
    clear_cache()


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "Wind Forecast Intelligence API",
    }


def test_overview_endpoint():
    client = TestClient(app)
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["period"] == {"start": "2026-01-01", "end": "2026-01-31"}
    assert data["actual_records"] == 5
    assert data["selected_forecast_records"] == 4
    accuracy = data["accuracy"]
    assert accuracy["matched_periods"] == 4
    assert accuracy["mae_mw"] > 0
    assert accuracy["rmse_mw"] > 0
    assert accuracy["bias_mw"] is not None


def test_overview_series_endpoint():
    client = TestClient(app)
    response = client.get("/api/overview/series")
    assert response.status_code == 200
    data = response.json()
    assert data["total_periods"] == 4
    assert len(data["hourly_series"]) == 4
    assert len(data["daily_accuracy"]) == 31  # 31 calendar days in January
    assert len(data["largest_errors"]) <= 15
    assert "rank" in data["largest_errors"][0]
    assert "absolute_error_mw" in data["largest_errors"][0]


def test_forecasts_valid_date():
    client = TestClient(app)
    response = client.get("/api/forecasts?date=2026-01-15")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-01-15"
    assert len(data["forecast_periods"]) == 2
    assert data["forecast_periods"][0]["generation_mw"] == 15828.0


def test_accuracy_valid_date():
    client = TestClient(app)
    response = client.get("/api/accuracy?date=2026-01-15")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-01-15"
    assert data["matched_periods"] == 2
    # Errors on Jan 15:
    # 00:00: 15828 - 14602 = +1226
    # 01:00: 15200 - 15000 = +200
    # MAE = (1226 + 200) / 2 = 713
    assert data["mae_mw"] == 713.0
    assert len(data["periods"]) == 2
    assert data["periods"][0]["error_mw"] == 1226.0


def test_invalid_date_format():
    client = TestClient(app)
    response = client.get("/api/forecasts?date=2026-01-xx")
    assert response.status_code == 400
    assert "Invalid date format" in response.json()["detail"]


def test_date_outside_january():
    client = TestClient(app)
    # February 1
    res1 = client.get("/api/forecasts?date=2026-02-01")
    assert res1.status_code == 400
    assert "Date must be within January 2026" in res1.json()["detail"]

    # December 31
    res2 = client.get("/api/accuracy?date=2025-12-31")
    assert res2.status_code == 400
    assert "Date must be within January 2026" in res2.json()["detail"]


def test_empty_elexon_data():
    clear_cache()
    mock_empty = MockElexonClient(empty=True)
    app.dependency_overrides[get_client] = lambda: mock_empty

    client = TestClient(app)
    # Overview with empty data should return 200 with 0 records
    res_ov = client.get("/api/overview")
    assert res_ov.status_code == 200
    assert res_ov.json()["actual_records"] == 0
    assert res_ov.json()["accuracy"]["matched_periods"] == 0

    # Accuracy with empty data should return 200 with empty periods
    res_acc = client.get("/api/accuracy?date=2026-01-15")
    assert res_acc.status_code == 200
    assert res_acc.json()["matched_periods"] == 0
    assert res_acc.json()["periods"] == []


def test_upstream_elexon_failure_handled(monkeypatch):
    clear_cache()
    from app.config import settings
    monkeypatch.setattr(settings, "enable_snapshot_fallback", False)
    mock_failing = MockElexonClient(fail=True)
    app.dependency_overrides[get_client] = lambda: mock_failing

    client = TestClient(app)
    response = client.get("/api/overview")
    assert response.status_code == 502
    assert "Simulated upstream Elexon failure" in response.json()["detail"]


def test_upstream_elexon_snapshot_fallback(monkeypatch):
    clear_cache()
    from app.config import settings
    monkeypatch.setattr(settings, "enable_snapshot_fallback", True)
    mock_failing = MockElexonClient(fail=True)
    app.dependency_overrides[get_client] = lambda: mock_failing

    client = TestClient(app)
    # When upstream fails but fallback is enabled, snapshot provides verified records
    response = client.get("/api/overview")
    assert response.status_code == 200
    assert response.json()["actual_records"] == 1488
    assert response.json()["accuracy"]["matched_periods"] == 744

