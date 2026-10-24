// In production, always use relative URLs ("") so requests route through the reverse proxy.
// In development, fall back to VITE_API_BASE_URL or empty string (Vite dev proxy).
const API_BASE_URL = import.meta.env.PROD
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "");

export interface OverviewResponse {
  period: {
    start: string;
    end: string;
  };
  actual_records: number;
  selected_forecast_records: number;
  accuracy: {
    matched_periods: number;
    mae_mw: number | null;
    rmse_mw: number | null;
    bias_mw: number | null;
  };
}

export interface HourlySeriesPoint {
  startTime: string;
  publishTime: string;
  forecast_mw: number;
  actual_mw: number;
  error_mw: number;
  absolute_error_mw: number;
}

export interface DailyAccuracyPoint {
  date: string;
  label: string;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  matched_periods: number;
}

export interface LargestErrorItem {
  rank: number;
  startTime: string;
  publishTime: string;
  forecast_mw: number;
  actual_mw: number;
  error_mw: number;
  absolute_error_mw: number;
}

export interface OverviewSeriesResponse {
  period: {
    start: string;
    end: string;
  };
  total_periods: number;
  hourly_series: HourlySeriesPoint[];
  daily_accuracy: DailyAccuracyPoint[];
  largest_errors: LargestErrorItem[];
}

export interface ForecastPeriod {
  startTime: string;
  publishTime: string;
  generation_mw: number;
}

export interface ForecastResponse {
  date: string;
  forecast_periods: ForecastPeriod[];
}

export interface AccuracyPeriod {
  startTime: string;
  publishTime: string;
  forecast_mw: number;
  actual_mw: number;
  error_mw: number;
  absolute_error_mw: number;
}

export interface AccuracyResponse {
  date: string;
  matched_periods: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  periods: AccuracyPeriod[];
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error (${response.status}): ${detail || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function getOverview(signal?: AbortSignal) {
  return request<OverviewResponse>("/api/overview", signal);
}

export function getOverviewSeries(signal?: AbortSignal) {
  return request<OverviewSeriesResponse>("/api/overview/series", signal);
}

export function getForecasts(date: string, signal?: AbortSignal) {
  return request<ForecastResponse>(
    `/api/forecasts?date=${encodeURIComponent(date)}`,
    signal
  );
}

export function getAccuracy(date: string, signal?: AbortSignal) {
  return request<AccuracyResponse>(
    `/api/accuracy?date=${encodeURIComponent(date)}`,
    signal
  );
}