# VÉLOCE

Premium vehicles for exceptional journeys.

## Development

```bash
npm run dev
```

## Project structure

- `app/` contains the App Router pages and global styles.
- `components/layout/Navbar.tsx` provides the responsive global navigation.
- `components/hero/` contains the responsive cinematic hero, category selector,
  vehicle presentation, and booking controls.
- `components/experience/` contains the editorial journey section and its
  responsive vehicle-story cards.
- `components/fleet/` contains the homepage vehicle catalogue, category filters,
  typed vehicle cards, and dynamic vehicle-detail experience.
- `components/` contains reusable UI and future page-section placeholders.
- `data/site.ts` is the central brand, navigation, contact, and CTA configuration.
- `data/vehicles.ts` and `data/deals.ts` contain typed placeholder content.
- `public/images/` is organized for future vehicle, deal, experience, and brand assets.

Hero artwork currently uses original SVG illustrations as graceful placeholders.
The intended original image paths are recorded in `heroImage` in
`data/vehicles.ts`; remove the corresponding `imagePlaceholder` value to switch
to those assets once they are available. Other vehicle and deal image paths are
placeholders. Deal cards currently use original inline SVG artwork and CSS
fallback backgrounds; their future image paths are recorded in `data/deals.ts`.
Homepage fleet cards use the category-specific vehicle SVG illustrations as
fallbacks until original vehicle photography is added.
The Journey section uses local vehicle photographs and transparent cutouts from
`public/images/vehicles/`.

## Validation

```bash
npm run lint
npm run build
```

## Admin fleet, MongoDB, and deployment

The `/admin` workspace authenticates against bcrypt-hashed admin accounts in
MongoDB and issues the existing signed session cookie. The backend's initial
admin bootstrap requires `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`; it creates
an account only when the admin collection is empty and never changes an
existing account or password. Fleet records use the `fleet` collection in the
`epicdrive` database. On first access, the backend inserts missing JSON seed
vehicles by slug; existing database edits are never overwritten. Deleted seed
vehicles are archived so that the seed process does not recreate them. Other
prototype admin areas still use browser-local data and are not covered by fleet
storage.

### Environment variables

Keep local values in the ignored root `.env` file. Do not commit credentials or
copy production credentials into Git. The backend also loads this root file in
local development.

| Backend (Render) | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `production` on Render. |
| `MONGODB_URI` | MongoDB connection URI; the backend selects `epicdrive`. |
| `FRONTEND_URL` | Exact public frontend origin, without a path. |
| `ADMIN_EMAIL` | Email for the one-time initial admin bootstrap. |
| `ADMIN_INITIAL_PASSWORD` | Strong password for one-time bootstrap; existing accounts are not reset. |
| `ADMIN_INITIAL_NAME` | Optional initial admin display name. |
| `ADMIN_API_TOKEN` | Shared secret for authenticated admin API calls. |
| `ADMIN_SESSION_SECRET` | Random session-signing secret of at least 32 characters; use the same value on the frontend host. |
| `RAZORPAY_KEY_ID` | Razorpay key ID used by the backend. |
| `RAZORPAY_KEY_SECRET` | Razorpay secret; keep server-side only. |
| `WHATSAPP_ACCESS_TOKEN` | Optional WhatsApp integration token. |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional WhatsApp phone-number ID. |

| Frontend host (Next.js server runtime) | Purpose |
| --- | --- |
| `BOOKING_API_URL` | Backend origin, for example the HTTPS Render service origin. Required in production; localhost is used only when unset outside production. |
| `ADMIN_EMAIL` | Keep aligned with the backend bootstrap email when using shared environment groups; the frontend authenticates against MongoDB accounts and does not use this value directly. |
| `ADMIN_API_TOKEN` | Same value as the backend setting, for server-to-server admin API calls. |
| `ADMIN_SESSION_SECRET` | Same value as the backend setting, for signing/verifying admin sessions. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for server-side vehicle image uploads. |
| `CLOUDINARY_API_KEY` | Cloudinary API key for server-side uploads. |
| `CLOUDINARY_API_SECRET` | Cloudinary secret; keep server-side only. |

The admin login checks the MongoDB admin account through the backend. No
`ADMIN_PASSWORD_HASH` fallback or client-side password is used. Generate
`ADMIN_API_TOKEN` and `ADMIN_SESSION_SECRET` with a password manager or secret
manager, then enter them directly in the hosting providers' secret settings.
Do not echo credentials to a terminal or commit them to the repository.
`ADMIN_INITIAL_PASSWORD` remains required on the backend at startup, but it is
used only when the MongoDB `admins` collection has no admin account; startup
never changes or duplicates an existing account.

The backend always selects the `epicdrive` database regardless of a database
name in the URI. Vehicle image uploads use Cloudinary in the Next.js server
runtime. Uploads accept JPG, PNG, and WebP up to 5 MB; existing image URLs
remain unchanged, and no Render persistent disk is required.

### Render Web Service

Configure the service from the repository root:

- **Root Directory:** `.`
- **Runtime:** Node.js 22 LTS
- **Build Command:** `npm ci --prefix backend`
- **Start Command:** `npm --prefix backend start`
- **Health Check Path:** `/api/health`

Render provides `PORT`; the backend binds to `0.0.0.0`. Health returns `200`
only when MongoDB is connected and `503` while the database is unavailable.
Set the environment variables above in the Render dashboard; do not put real
credentials in Git.

For local development, install backend dependencies with
`npm ci --prefix backend`, run `npm --prefix backend run dev` from the
repository root, then start the website with `npm run dev`.

Booking records remain requests and are never marked as confirmed reservations.
Website settings, deals, enquiries, and other non-fleet prototype admin areas
remain browser-local and do not update their source files.
