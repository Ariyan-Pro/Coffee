# API Versioning & Deprecation Strategy

## Versioning model

The API is versioned through the URL path: `https://api.example.com/api/v1/...`.

- The **major version** is a breaking-change boundary. A new major version
  means clients must migrate; there is no backward compatibility promise.
- Within a major version, the API is **additive and backward compatible**:
  new fields are optional, new endpoints are added, and existing behaviour is
  never silently changed. Pydantic schemas are only extended (new optional
  fields); nothing already emitted is removed or renamed.

## Lifecycle

| Stage | Condition | Signals |
| --- | --- | --- |
| Current | The only version in production | `X-API-Version: v1` on every response |
| Deprecated | A successor major version exists | `Deprecation: true` header |
| Sunsetting | A retirement date is set | `Sunset: <date>` (RFC 8594) + `Link` header pointing at the successor |
| Retired | Sunset date passes | Requests return `400 UNSUPPORTED_API_VERSION` |

Unknown version prefixes (`/api/v99/...`) are rejected immediately with
`400 UNSUPPORTED_API_VERSION` rather than a misleading 404, so typos and
misconfigured clients fail fast.

## Deprecation headers

When a legacy version is retired, add it to `DEPRECATED_ROUTES` in settings:

```python
DEPRECATED_ROUTES: dict[str, str] = {"/api/v0": "2027-01-01"}
```

Every request to `/api/v0/*` then returns:

```http
X-API-Version: v1
Deprecation: true
Sunset: 2027-01-01
Link: <https://api.example.com/api/v1>; rel="successor-version"; title="latest"
```

The implementation lives in `app/middleware/versioning.py`.

## Backward compatibility rules

1. Never remove, rename, or change the type of an existing field within a major
   version.
2. New fields must have defaults; clients that ignore them keep working.
3. Never reorder the JSON `error.details` structure or change status codes for
   an existing error condition.
4. Fixes to validation are allowed within a version, but tightening validation
   that previously accepted data must be announced and handled as a migration.

## Release cadence

- **Minor/additive changes**: deploy at any time; update `API_VERSION` in
  `app/config/settings.py`.
- **Major (breaking)**: a new `/api/vX` router is added alongside `/api/v1`.
  Both run in production while v1 goes through the lifecycle above. Sunset
  period is **12 months** minimum from the day a successor ships (a policy
  decision; adjust to your client base).

## Schema evolution in practice

```text
v1.0  orders[].id        int      # shipped
v1.1  +orders[].shipping_estimates   # added, optional -> backward compatible
v2.0  orders[].id        uuid      # breaking -> requires /api/v2
```

Database changes (e.g. adding `audit_logs`) are decoupled from API changes via
Alembic migrations and never force a version bump by themselves.
