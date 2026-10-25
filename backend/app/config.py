from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Wind Forecast Intelligence API"
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    delivery_start: str = "2026-01-01T00:00:00Z"
    delivery_end: str = "2026-02-01T00:00:00Z"
    forecast_publish_start: str = "2025-12-31T00:00:00Z"
    forecast_publish_end: str = "2026-02-02T00:00:00Z"
    request_timeout_seconds: float = 30.0
    day_ahead_cutoff_hour: int = 10
    enable_snapshot_fallback: bool = True
    cors_origins: str = ""

    @property
    def allowed_cors_origins(self) -> list[str]:
        import os
        origins = [
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        raw = self.cors_origins or os.getenv("CORS_ORIGINS", "")
        if raw:
            for item in raw.split(","):
                cleaned = item.strip().rstrip("/")
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)
        return origins

    model_config = SettingsConfigDict(
        env_prefix="WIND_",
        extra="ignore",
    )


settings = Settings()