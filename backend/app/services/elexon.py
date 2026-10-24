from datetime import datetime, timezone
import httpx
from app.config import settings


class ElexonAPIError(RuntimeError):
    """Raised when Elexon data cannot be retrieved or parsed."""


class ElexonClient:
    def __init__(self) -> None:
        self.base_url = settings.elexon_base_url.rstrip("/")
        self.timeout = settings.request_timeout_seconds

    @staticmethod
    def _format_time(value: datetime) -> str:
        if value.tzinfo is None:
            raise ValueError("Datetime must include a timezone")
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    async def _get_records(self, dataset: str, params: dict[str, str]) -> list[dict]:
        if dataset not in ("FUELHH", "WINDFOR"):
            raise ValueError(f"Unsupported dataset: {dataset}")
        url = f"{self.base_url}/datasets/{dataset}/stream"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                records = response.json()
        except httpx.TimeoutException as exc:
            raise ElexonAPIError(f"Request timeout while fetching {dataset} data from Elexon: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            raise ElexonAPIError(f"Upstream Elexon {dataset} returned HTTP {exc.response.status_code}") from exc
        except httpx.RequestError as exc:
            raise ElexonAPIError(f"Network error while connecting to Elexon {dataset}: {exc}") from exc
        except (ValueError, TypeError) as exc:
            raise ElexonAPIError(f"Invalid JSON returned by Elexon {dataset}") from exc

        if not isinstance(records, list):
            raise ElexonAPIError(f"Expected a JSON array from {dataset}")
        if not all(isinstance(row, dict) for row in records):
            raise ElexonAPIError(f"Unexpected record structure from {dataset}")
        return records

    async def fetch_actuals(self, publish_start: datetime, publish_end: datetime) -> list[dict]:
        records = await self._get_records(
            "FUELHH",
            {
                "publishDateTimeFrom": self._format_time(publish_start),
                "publishDateTimeTo": self._format_time(publish_end),
                "fuelType": "WIND",
            },
        )
        return [row for row in records if row.get("fuelType") == "WIND"]

    async def fetch_forecasts(self, publish_start: datetime, publish_end: datetime) -> list[dict]:
        return await self._get_records(
            "WINDFOR",
            {
                "publishDateTimeFrom": self._format_time(publish_start),
                "publishDateTimeTo": self._format_time(publish_end),
            },
        )