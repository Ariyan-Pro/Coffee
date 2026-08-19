# Observability

The backend exposes three layers of operational signal: **metrics** (Prometheus),
**structured logs** (JSON), and **health endpoints**. Distributed tracing is
supported behind an optional OpenTelemetry exporter.

## Metrics (`/metrics`)

A Prometheus text-format endpoint is served at `GET /metrics` (outside the
versioned API). Disabled with `METRICS_ENABLED=false`.

Exposed metrics:

| Metric | Type | Meaning |
| --- | --- | --- |
| `http_requests_total{method,path,status}` | Counter | Request count by method, normalized path, and status |
| `http_request_duration_seconds{method,path}` | Histogram | Latency distribution per endpoint |
| `http_requests_in_progress{method,path}` | Histogram | Concurrent in-flight requests |

Path labels are normalized (`/api/v1/orders/42` -> `/api/v1/orders/{id}`) so
label cardinality stays bounded regardless of traffic volume.

### Scraping

```yaml
# prometheus.yml
scrape_configs:
  - job_name: coffee-backend
    static_configs:
      - targets: ["backend:8000"]
    metrics_path: /metrics
```

## Structured logging

All logs are emitted as one JSON object per line (`LOG_FORMAT=json`, the
default), ready for Loki/CloudWatch/Datadog without a parser. Set
`LOG_FORMAT=plain` for human-readable local output.

Every request line includes:

```json
{
  "ts": "2026-08-16T16:40:06+0500",
  "level": "INFO",
  "logger": "coffee_backend.access",
  "request_id": "d3f1...",
  "method": "POST",
  "path": "/api/v1/orders",
  "status": 201,
  "duration_ms": 42.1,
  "client_ip": "10.0.0.5",
  "user_agent": "curl/8.0"
}
```

The request id is also returned on every response as `X-Request-ID`, so a
support ticket can be correlated with its log lines. Structured errors include
the full exception trace inside the JSON `exc` field.

## Health endpoints

- `GET /api/v1/health` - liveness + database reachability check
  (`{"status":"ok","database":"ok"}` or an error state).

## Alerting rules (Prometheus)

```yaml
groups:
  - name: coffee-backend
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m])) > 0.05
        for: 10m
        annotations:
          summary: "More than 5% of requests failing"
      - alert: SlowEndpoint
        expr: |
          histogram_quantile(0.95,
            sum by (le, path) (rate(http_request_duration_seconds_bucket[5m])))
            > 2
        for: 15m
        annotations:
          summary: "p95 latency above 2s"
      - alert: BackgroundJobStalled
        expr: |
          max_over_time(up{job="coffee-worker"}[5m]) != 1
        for: 5m
        annotations:
          summary: "Celery worker not reporting"
```

Alert on the worker/beat process liveness (`up{job="coffee-worker"}`) and on
celery task failures via the result backend; the renewal and stale-order tasks
return the number of rows they processed.

## Dashboards

Suggested Grafana panels for `http_request_duration_seconds` and
`http_requests_total`:

1. RPS by status class (5xx/4xx/2xx stacked)
2. p50/p95/p99 latency per top-10 endpoint
3. Error rate percentage
4. In-flight requests gauge

## Distributed tracing (optional)

Tracing is not enabled by default because it requires an exporter. To enable
it, set `TRACING_EXPORTER_ENDPOINT` to an OTLP endpoint (e.g.
`http://jaeger:4318`) and add OpenTelemetry instrumentation to the image:

```bash
pip install opentelemetry-api opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-http \
  opentelemetry-instrumentation-fastapi
opentelemetry-instrument \
  --traces_exporter otlp_proto_http \
  --service_name coffee-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000
```

This gives end-to-end traces across the API, the Celery tasks, and the DB via
the standard instrumentations.

## Verifying background jobs at runtime

The job *logic* is covered by `tests/unit/test_tasks.py` (beat schedule,
retry policy, and both job cores against a real session). The Docker wiring
can be verified as follows:

```bash
docker compose up --build -d
# 1. worker registered the tasks:
docker compose logs worker | grep "process_subscription_renewals"
docker compose logs worker | grep "mark_stale_orders_failed"

# 2. beat is ticking (fires every minute, tasks are no-ops when nothing is due):
docker compose logs beat | tail

# 3. trigger a renewal run manually and read the result (count of orders created):
docker compose exec worker \
  celery -A app.tasks.celery_app.celery_app call \
  app.tasks.subscriptions.process_subscription_renewals
docker compose exec worker \
  celery -A app.tasks.celery_app.celery_app inspect active

# 4. confirm the daily schedules are loaded:
docker compose exec beat \
  celery -A app.tasks.celery_app.celery_app inspect scheduled
```

Retry behaviour: both tasks register `autoretry_for=(Exception,)`,
`max_retries=3` and exponential backoff (30s, 60s, 120s). A task that keeps
failing surfaces in the result backend and can be alerted on.
