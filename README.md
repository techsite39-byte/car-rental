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

## Admin fleet and MongoDB

The `/admin` workspace requires a server-configured password. Fleet records are
read from and written to the `fleet` collection in the `epicdrive` MongoDB
database. On first access, the backend inserts any missing JSON seed vehicles
by slug; existing database edits are never overwritten. Deleted seed vehicles
are archived so that the seed migration does not recreate them. Other prototype
admin areas still use browser-local data and are not covered by fleet storage.

Create a root `.env.local` from `.env.example`, and configure
`backend/.env.local` from `backend/.env.example`. Set `MONGODB_URI` only in the
backend environment. Set `ADMIN_PASSWORD`, a random `ADMIN_SESSION_SECRET` of
at least 32 characters, and an `ADMIN_API_TOKEN` in the root environment. Use
the exact same `ADMIN_API_TOKEN` in the backend environment. Keep both local
environment files out of Git. Generate random tokens locally, for example with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

The Next.js server proxies fleet requests to `BOOKING_API_URL`; run the backend
from `backend/` with `npm install` and `npm run dev`, then run the site with
`npm run dev` from the repository root. The backend always selects the
`epicdrive` database regardless of a database name in the URI.

Vehicle image uploads use Cloudinary and are enabled only when
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are
configured in the root server environment. Uploads accept JPG, PNG, and WebP up
to 5 MB. Until those values are set, image selection previews locally but saving
a replacement image returns a configuration error; existing image URLs remain
unchanged. Cloudinary secrets are never sent to the browser.

Booking records remain requests and are never marked as confirmed reservations.
Website settings, deals, enquiries, and other non-fleet prototype admin areas
remain browser-local and do not update their source files.
