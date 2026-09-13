# Frontend — Game Store

Angular (standalone components) + Angular Material. See the repo-root `README.md` for the
full setup (backend + database), the one-command Docker option, and design rationale.

## Setup & Run

```bash
npm install
npm start          # ng serve, http://localhost:4200
```

Expects the backend API at `http://localhost:8000/api` (see `src/app/core/api-config.ts` to
change that).

## Structure

```
src/app/
  core/           AuthService, JWT interceptor, route guard, Product/Order services, models
  layout/
    sidebar/      Persistent nav shown for every signed-in page (logo, Store, Important, logout)
  features/
    login/              Login page
    products/
      product-list/     Grid + pagination + in-page location filter
      product-detail/   Product page with the Buy button
    receipt/             Purchase receipt page
    important/            Placeholder page for notes to the technical team - edit its .html directly
```

## How auth works here

- `AuthService` stores the access/refresh token pair from `POST /auth/login/` in
  `localStorage` and exposes an `isAuthenticated` signal.
- `authInterceptor` attaches `Authorization: Bearer <access>` to every outgoing request. On a
  401 it calls `POST /auth/refresh/` once and retries the original request; if that also fails,
  it logs out and redirects to `/login`.
- `authGuard` blocks the products/detail/receipt/important routes for anyone without a
  stored access token, redirecting to `/login`.

## Build

```bash
npm run build
```

## Docker

`Dockerfile` here does a multi-stage build: `npm run build` in a `node` stage, then the static
output is served by `nginx` (see `nginx.conf` — it falls back to `index.html` for any path so
Angular's router still works after a hard refresh, e.g. on `/products/3`). This is what
`docker compose up --build` uses from the repo root; see the root `README.md` for the full
one-command setup.
