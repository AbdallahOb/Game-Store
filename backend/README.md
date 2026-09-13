# Backend — Game Store API

Django + Django REST Framework, kept deliberately simple: **one app** (`store`), and every
endpoint is a plain Python function, not a framework class. See the repo-root `README.md` for
setup and design rationale.

**Postman:** import [`postman_collection.json`](postman_collection.json) for a ready-to-run copy
of every endpoint below. Run "Auth > Login" first — it saves the access/refresh tokens into
collection variables automatically, so every other request just works (they inherit Bearer auth
from the collection). Defaults assume the backend is at `http://localhost:8000` with the seeded
`admin` / `admin12345` login.

## How it's organized

```
store/
  models.py       Product and Order (the two database tables)
  serializers.py  Turns a Product into JSON (used for read-only output)
  views.py        The 4 endpoint functions - this is the actual logic, read top to bottom
  urls.py         Maps a URL path to one of those functions
  admin.py        Registers the models with Django's built-in admin site (/admin/)
  management/commands/import_items.py   The CSV import script
  tests/          pytest tests for auth, products, and the purchase flow
Dockerfile              Builds the backend image (see root README.md, "Running It - Option A")
docker-entrypoint.sh    Runs on container start: migrate -> import_items -> ensure a login exists -> runserver
```

That's it — no separate apps to jump between, no class hierarchies to trace. `views.py` is the
one file worth reading closely; everything else is supporting cast.

## Django/Python things you'll see, explained

If you know Angular/TypeScript already, here's the mapping:

- **`@api_view(["GET"])`** (a *decorator*, similar in spirit to a TS decorator) — turns a plain
  function into something Django can call for that HTTP method. Without it, Django wouldn't
  know this function is a web endpoint at all.
- **`request.query_params` / `request.data`** — like reading `?page=2` from the URL or the JSON
  body of a POST, same idea as `HttpParams` / a request body in Angular's `HttpClient`.
- **`Response({...}, status=201)`** — like `res.json(...)` in Express, or returning an
  `HttpResponse` from an Angular interceptor — just "send this JSON back with this status code."
- **`Product.objects.filter(location="JO")`** — Django's ORM (object-relational mapper): instead
  of writing SQL, you call methods on the model class and it builds the `SELECT ... WHERE ...`
  for you. `.filter()`, `.order_by()`, `.get()` are the ones used here.
  `Paginator` (from `django.core.paginator`) then slices that queryset into pages.
- **`get_object_or_404(Product, id=product_id)`** — look up a row by id; if it doesn't exist,
  automatically return a 404 instead of crashing. Saves writing an `if not found: return 404`
  every time.
- **`ProductSerializer`** — the *one* place we still use a DRF class instead of a plain
  function, because it's genuinely simple: it just lists which model fields to turn into JSON
  keys (`id`, `title`, `description`, `price`, `location`). Orders don't use a serializer class
  at all — `_receipt()` in `views.py` is a plain function that builds the dict by hand, which is
  arguably even easier to follow.
- **JWT login/refresh** (`/api/auth/login/`, `/api/auth/refresh/`) — these two endpoints aren't
  even our code; they come straight from the `djangorestframework-simplejwt` library
  (`TokenObtainPairView`, `TokenRefreshView` in `config/urls.py`). We just wired them up.
- **`IsAuthenticated` as the default** (in `config/settings.py`, under `REST_FRAMEWORK`) — one
  line that means "every endpoint requires a valid token unless it says otherwise." That's why
  none of the 4 functions in `views.py` mention auth at all — it's handled globally.

## Authentication

Every endpoint below except login/refresh requires `Authorization: Bearer <access_token>`.

### `POST /api/auth/login/`

```json
// request
{ "username": "admin", "password": "admin12345" }

// response 200
{ "access": "<jwt>", "refresh": "<jwt>" }
```

### `POST /api/auth/refresh/`

```json
// request
{ "refresh": "<jwt>" }

// response 200
{ "access": "<jwt>" }
```

## Products

### `GET /api/products/`

Query params (all optional):

| Param | Default | Notes |
|---|---|---|
| `page` | 1 | |
| `page_size` | 10 | max 50 |
| `location` | — | `JO` or `SA`; 400 if anything else |

```json
// response 200
{
  "count": 100,
  "page": 1,
  "total_pages": 10,
  "results": [
    { "id": 1, "title": "Sword of Valor", "description": "...", "price": "150.00", "location": "JO" }
  ]
}
```

### `GET /api/products/{id}/`

Returns a single product (404 if it doesn't exist).

## Orders (purchase flow)

### `POST /api/orders/`

Buys exactly one product.

```json
// request
{ "product_id": 1 }

// response 201 - this is also the receipt shape
{
  "id": 7,
  "product": 1,
  "product_title": "Sword of Valor",
  "price": "150.00",
  "location": "JO",
  "buyer": "admin",
  "created_at": "2026-01-01T12:00:00Z"
}
```

400 if `product_id` is missing, 404 if it doesn't match a product.

### `GET /api/orders/{id}/`

Re-fetches a receipt (e.g. after a page refresh). Returns 404 for an order that doesn't exist
or doesn't belong to the requesting user.

## CSV Import

```bash
python manage.py import_items [path/to/items.csv]   # defaults to the repo-root items.csv
```

Reads `id, title, description, price, location` and creates-or-updates a `Product` per row
(keyed on `id`), so it's safe to re-run after editing the CSV. Rows with an invalid `price` or
a `location` other than `JO`/`SA` are skipped and logged, not fatal to the rest of the import.

## Running in Docker

`docker compose up --build` from the repo root builds this into an image and runs
`docker-entrypoint.sh` on start, which does `migrate` → `import_items` → creates a default
superuser if one doesn't exist yet → `runserver 0.0.0.0:8000`. All three steps are safe to
repeat, so this runs the same way on every container start, not just the first. See the root
`README.md` for the full one-command setup.

## Tests

```bash
pytest
```

Covers: login success/failure, token refresh, product list pagination/filtering/404, the
purchase flow (including that the receipt price is a snapshot, not a live lookup), and that
every protected endpoint rejects unauthenticated requests.
