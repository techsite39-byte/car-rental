# EPICDRIVE Playwright QA Audit

## Environment

- URL tested: `http://localhost:3000`
- Server: production Next.js server started with `npm.cmd run start -- -p 3000`
- Browser automation: available Playwright browser tool
- Viewports: 1440×900, 1280×800, 390×844, 360×800, 768×1024
- No existing Playwright configuration or npm Playwright test script was present.

## Results

| Check | Result | Notes |
| --- | --- | --- |
| Homepage desktop overflow | PASS | No horizontal overflow detected. |
| Homepage laptop overflow | PASS | No horizontal overflow detected. |
| Homepage mobile overflow | PASS | No horizontal overflow detected. |
| Homepage small-mobile overflow | PASS | No horizontal overflow detected. |
| Homepage tablet overflow | PASS | No horizontal overflow detected. |
| Fleet six cards | PASS | Six cards rendered in the requested order. |
| Fleet names/specifications/prices | PASS | All six names, seats, fuel types, and prices matched. |
| Fleet PNG paths and dimensions | PASS | All six `/carsimg/` images loaded with nonzero natural dimensions. |
| SUV filter | PASS | 3 vehicles: Kia Clavis, Brezza, Kiger. |
| Sedan filter | PASS | 1 vehicle: Dzire. |
| Sport filter | PASS | Empty state, 0 vehicles. |
| Electric filter | PASS | Empty state, 0 vehicles. |
| Convertible filter | PASS | Empty state, 0 vehicles. |
| Homepage vehicle selection | PASS | Brezza selection updated the hero vehicle, image, and specifications after scrolling it into view. |
| Hero canvas initialization | PASS | Canvas initialized with a nonzero drawing buffer. |
| Below-fold sequence activation | PASS | Section 2 canvas initialized after entering the viewport. |
| Booking vehicle consistency | PASS | Kia Clavis selected with 7 seats, Petrol, ₹4,000/day. |
| Driver toggle | PASS | With-driver selection worked. |
| Round-trip toggle | PASS | Toggle changed state without submission. |
| Invalid date validation | PASS | Return date before pickup produced `Return date and time must be later than pick-up.` |
| JavaScript page errors | PASS | No uncaught page errors observed. |
| Unexpected HTTP errors | PASS | No unexpected 4xx/5xx responses. |

## Earlier service issue

The initial browser audit observed `GET /api/fleet` returning HTTP 503 because the local backend was not running. After starting the backend and fixing the public fleet query/migration path, the endpoint returned HTTP 200 with six records. MongoDB health returned `databaseConnected: true`.

The backend still requires `ADMIN_API_TOKEN` for authenticated admin operations and hidden-record reads. That configuration is intentionally not bypassed.

## Files added

- `tests/epicdrive-qa.spec.js` — reproducible Playwright Test specification covering responsive layout, fleet data/images, filters, vehicle selection, canvas activation, and safe booking validation.
- `QA_REPORT.md` — this audit report.

The repository does not currently include `@playwright/test`, so the saved spec was not run through the npm CLI. The equivalent checks were executed directly through the available Playwright browser automation tool against the production server. No screenshot was required because the final audit had no application failures.

## Commands and checks

- `npm.cmd run start -- -p 3000`
- `npm.cmd run build` — passed
- `npx.cmd tsc --noEmit` — passed previously for the current source
- `npx.cmd eslint ...` — passed for the changed animation/navigation files
- `git diff --check` — passed

## Recommendations

- Add `@playwright/test` and a `playwright.config` in a follow-up if CI execution is required.
- Start the fleet backend/database in QA environments to remove the expected `/api/fleet` 503.
- Replace 1280×720 animation source frames with higher-resolution source material if large desktop displays still appear soft; browser-side scaling cannot restore missing image detail.
