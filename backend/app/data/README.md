# January 2026 Historical Dataset Snapshot

This fixture contains verified raw historical data from the Elexon BMRS API used as an offline/cold-start fallback when external upstream Elexon APIs are unreachable.

### Metadata
- **Source**: Elexon BMRS API (`FUELHH` and `WINDFOR` stream datasets)
- **Dataset**: January 2026 UK Wind Generation and Day-Ahead Generation Forecasts
- **Retrieval Date**: October 2026
- **Delivery Interval**: 2026-01-01T00:00:00Z to 2026-02-01T00:00:00Z (half-open, exclusive)
- **Timezone**: All timestamps are in UTC.
- **Decision Cutoff**: Day-ahead 10:00 Europe/London cutoff assumption applied during processing.
- **Coverage**:
  - `actual_records`: 1,537 raw actual observations (cleaned down to 1,488 January half-hourly periods).
  - `forecast_records`: 18,688 forecast publication versions across all generation horizons.
  - `matched_periods`: 744 hourly comparison periods (100% matched resolution).

### Limitations
- This snapshot is strictly for January 2026 historical analytics.
- In production, the application will always attempt to fetch live from Elexon BMRS first, and will only use this snapshot if the external Elexon API is unreachable.
