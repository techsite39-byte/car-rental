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
The Journey section uses existing vehicle SVG illustrations and original SVG/CSS
artwork until these original image assets are added:
`/images/experience/journey-main.webp`,
`/images/experience/convertible.webp`, and
`/images/experience/fleet-preview.webp`.

## Validation

```bash
npm run lint
npm run build
```

## Admin prototype and local data

The admin workspace is available under `/admin`. It has no authentication and
is not secure for public deployment. Admin changes and public booking/contact
submissions use browser `localStorage`; they are limited to that browser
profile/device and are not sent to a server or shared with other users. Clearing
site data removes these records. The original fleet and offers are seed content;
booking and enquiry lists begin empty and contain only actual local submissions.
Requests remain requests and are never marked as confirmed reservations.

`lib/admin-data.ts` defines the typed repository contracts and the current
development-only browser adapter. UI components depend on those repository
interfaces rather than a database implementation. A future MongoDB adapter
should implement the same vehicle, booking, enquiry, and deal repositories
behind a server-side API, with authentication and authorization added before
any real customer data is used. MongoDB, email/SMS delivery, cloud asset
storage, and multi-user synchronization are not implemented in this prototype.
Website settings are a browser-local preview and do not update `data/site.ts`.
