# Multi Workspace Monorepo

Nx + Bun monorepo implementing the take-home assignment flow:

- `apps/backend-dotnet` – ASP.NET Core 8 API that issues/validates the shared session cookie.
- `apps/frontend-nextjs` – Next.js hub (App Router + Tailwind) where users authenticate via OTP.
- `apps/frontend-angular1` – Angular user portal (standalone component) that consumes the existing session.
- `apps/frontend-angular2` – Angular admin panel with a list of applications.

The `.multiworkspace.session` cookie is created by the backend and reused across the three front-ends to demonstrate OTP login and seamless navigation.

## Prerequisites

| Tool | Recommended Version | Notes |
|------|---------------------|-------|
| [Bun](https://bun.sh) | ≥ 1.2 | Runs Nx, installs deps, executes scripts |
| Node.js | ≥ 22 | Required by Bun internally |
| .NET SDK | 8.0.x | Build/run the backend |

## Installation

```bash
bun install
```

## Development Scripts (Bun)

```bash
bun run dev:backend        # ASP.NET Core API (http://localhost:5100)
bun run dev:next           # Next.js hub (http://localhost:3000)
bun run dev:angular:user   # Angular user portal (http://localhost:4200)
bun run dev:angular:admin  # Angular admin portal (http://localhost:4300)
bun run dev:all            # Launch everything (requires `concurrently`)

bun run lint               # Biome lint
bun run format             # Biome check --write
```

> `dev:all` already uses the `concurrently` dependency bundled in `package.json`.

## Repository Layout

```
apps/
├── backend-dotnet           # .NET 8 API (controllers, models, session helpers)
├── frontend-nextjs          # Next.js hub + Tailwind
├── frontend-angular1        # Angular user portal (standalone component)
└── frontend-angular2        # Angular admin dashboard (standalone component)
```

- `tailwind.config.js` – shared theme (colors, fonts) for every front-end.
- `biome.json` – Biome config (format + lint).
- `package.json` – unified scripts & workspaces (`apps/*`).

## Backend (.NET 8)

| Method | Route | Description |
|--------|-------|-------------|
| `POST /api/authentication/login/otp` | Demo OTP credentials (`phoneNumber: "5551234567"`, `otp: "246810"`). Creates a session with role `user`. |
| `POST /api/authentication/login/admin` | Admin credentials (`admin@example.com`, `SuperSecure123!`). Creates a session with role `admin`. |
| `POST /api/authentication/logout` | Clears current session cookie. |
| `GET /api/session/me` | Returns `SessionUser` or 401 when no session exists. |

- Session cookies are `HttpOnly`. In development they use `SameSite=Lax`, `SecurePolicy=None`; in production toggle `Security:EnforceHttps=true` to get `SameSite=None`, `Secure`.
- CORS allows `http://localhost:3000`, `4200`, `4300` and enables `AllowCredentials`.

## Front-end Behavior

### Next.js Hub (`frontend-nextjs`)
- OTP form with demo values.
- Calls `GET /session/me` on mount; shows a warning if 401 is returned.
- “Sign in” button disables when a valid session is present (shows “Session active”).
- Links to both Angular portals without losing authentication.

### Angular User Portal (`frontend-angular1`)
- Displays session details (`User`, `Name`, `Role`, `Phone`, `Email`).
- If opened from admin (`?from=admin&admin=...`), shows a banner with the admin’s name and a “Back to admin dashboard” button.
- “Log out” triggers `POST /logout`.

### Angular Admin Portal (`frontend-angular2`)
- Login with hard-coded credentials; button disables once a session exists.
- Shows “Registered Applications” table with demo applicants.
- “Open user app” redirects to Angular user portal while keeping the session.
- “Log out” clears the cookie.

## Demo Flows

1. **OTP (Next.js → Angular User)**
   - Log in on the Next.js hub via OTP.
   - Navigate to the Angular user portal; session details load automatically.
   - Returning to the hub preserves the session.

2. **Admin (Angular Admin → Angular User)**
   - Log in with `admin@example.com` / `SuperSecure123!`.
   - Click “Open user app” on the first row.
   - Angular user portal shows the admin banner and a button to go back to the admin dashboard.

3. **Clear Session**
   - Call `POST /logout`; the next `GET /session/me` returns 401 and login buttons unlock.

## Styling & UX

- Tailwind is centralized in `tailwind.config.js`. Angular apps reference a lightweight config that reuses the root theme.
- Dark theme with consistent fonts/gradients across apps.
- Buttons and alerts disable when the user already has a session.

## Dev Certificates

If browsers block `https://localhost:7100`:

```bash
dotnet dev-certs https --trust
```

On Linux you may need to import the generated `.pfx` into your browser manually. By default, development still accepts `http://localhost:5100` (`SameSite=Lax` cookie).

## Notes

- No build artifacts (e.g., `.next/`, `obj/`) are tracked.
- The backend builds via `bun run dev:backend` or `dotnet build` in `apps/backend-dotnet`.

Happy coding!
