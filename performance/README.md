# Performance tests

The k6 suite exercises the Orders list at page sizes 20 and 100, individual Catalog lookup, a 50-ID Catalog batch, and optionally order creation. k6 was selected because it is open source, models HTTP workloads with virtual users/arrival rates, supports thresholds as code, and runs in GitHub Actions without browser-per-user overhead.

## Local smoke run

Start the application with Docker Compose, then from the repository root run:

```powershell
k6 version
k6 run performance/k6-orders.js
```

This runs read-only scenarios against the default local URLs (`localhost:8080` and `localhost:8081`). To include order creation, explicitly use a disposable environment:

```powershell
$env:PERF_ENABLE_ORDER_CREATION = 'true'
k6 run performance/k6-orders.js
Remove-Item Env:PERF_ENABLE_ORDER_CREATION
```

Order creation writes records and there is no API to remove them. Do not enable it against a shared, persistent, staging, or production environment. The CI job uses a fresh Compose stack and removes its volumes during cleanup.

## Profiles and configuration

- `K6_PROFILE=smoke` (default): short, low-intensity arrival-rate smoke.
- `K6_PROFILE=load`: a five-minute, higher-rate profile for an explicitly approved test environment; it is not part of the pull-request gate.
- `K6_PROFILE=stress`: a five-minute increasing-rate profile intended only for an approved test environment.
- `K6_PROFILE=soak`: a 30-minute sustained profile intended only for an approved test environment.
- `ORDER_URL` and `CATALOG_URL`: override the service base URLs.
- `PERF_ENABLE_ORDER_CREATION=true`: opt in to the write scenario; use only on a disposable environment.

The 1% error-rate and 800 ms p95 thresholds are provisional starting points, not an agreed SLO. Agree on traffic profile, target rates, environment, and service-level objectives before using these values as release criteria. The stress and soak profiles have not been calibrated or run; the suite does not yet capture CPU/memory and database resource metrics automatically.
