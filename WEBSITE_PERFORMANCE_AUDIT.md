# Website Performance and Technical Audit

**Audit date:** 2026-11-10
**Scope:** Static review of the Next.js frontend, Express/Mongoose backend, routes, components, hooks, styles, package manifests/lockfiles, tests, and public assets. A local browser smoke check was also performed. No application source or configuration was changed for this audit.

## 1. Executive Summary

The clearest user-facing performance risk is the homepage hero’s 7,086,021-byte MP4. It is played automatically for visitors who have not enabled reduced motion, including mobile visitors. The configured `preload="metadata"` does not prevent the effect from calling `play()` after mount, so it is not a guarantee that only metadata will be downloaded.

The homepage also has avoidable client work: a statistics animation calls React state setters on every animation frame, and the featured-slide timer continues every three seconds regardless of page visibility. A 110,512-byte global stylesheet is loaded from the root layout. These are code-confirmed costs; their final production transfer and CPU costs need a production build/profile to quantify.

The source contains several sophisticated canvas/scroll-frame implementations, but **they are not mounted by the current public pages**. Their expected frame directories are absent from `public/`. Therefore they are not evidenced as the cause of current homepage scrolling lag. If one of those components is intended to be active, its frame requests will fail until the assets are restored. One dormant implementation also has an unbounded decoded keyframe cache.

The backend dependency audit found a **high-severity production advisory in `body-parser@2.3.0`**, pulled in by Express. The backend also re-runs fleet seed/migration bulk writes on public reads and booking submissions, and public fleet requests explicitly bypass caching. Those patterns can add backend/database work, but production response times and database query plans were unavailable.

No critical issue was confirmed. A production Lighthouse/Web Vitals run was not available, so production FCP/LCP/TTFB/INP/CLS and production bundle sizes remain unmeasured.

## 2. Overall Website Performance Assessment

| Area | Assessment |
|---|---|
| Current homepage | Large autoplay video is the most obvious byte/bandwidth risk; avoidable animation React work is present. |
| Scroll-frame animation | No active frame-scrubbed section was found in the current route graph. The present homepage hero is an 8-second MP4. Dormant frame-sequence components refer to missing public assets. |
| Images | Several original PNGs are 1.5–2.0 MB each. Many component image paths use `next/image` and the local browser observed `/_next/image` requests, so source-file sizes are not equivalent to delivered bytes. The logo is also used directly as the site icon. |
| CSS/JavaScript | The root CSS source is 110.5 KB. Homepage booking, navigation, and multiple homepage sections are client components. Production chunk sizes were not measured. |
| Backend | Source shows repeated seed/migration database operations on fleet reads and booking writes. No reliable API timing or MongoDB explain/profiler evidence was available. |
| Mobile | A 390×844 browser viewport showed no horizontal overflow. This was a viewport/layout check, not a cold mobile load or low-end-device performance test. |
| Security/dependencies | Backend production audit: one high `body-parser` advisory. Root production-only audit: zero findings; full root audit: one high and seven moderate findings in development dependencies. |

### Measurements and limitations

- The integrated browser opened `http://localhost:3000/`, which was running **Next.js development mode** (`next-devtools` and development React chunks were present). During that local navigation, the browser recorded TTFB (`responseStart`) **1,528 ms**, FCP **48,912 ms**, DOMContentLoaded **66,541 ms**, and load **66,558 ms**.
- These values are **not a production benchmark**. The local development server was under concurrent audit-command load, the page was opened cold, and the browser had `prefers-reduced-motion: reduce` enabled. Do not use these numbers to predict customer CWV.
- LCP and CLS were not measured: the observers were installed after navigation and yielded no buffered entries. An empty observer result is not a zero score. INP was not measured through representative user interactions.
- The mobile viewport check found no horizontal overflow at 390×844. It did not use a physical device, CPU/network throttling, or a fresh mobile cold load.
- Local PowerShell HTTP probes to frontend/backend ports timed out during the same diagnostic load. No reliable API latency, production network, database, cache-header, or failed-production-request evidence was obtained.
- The browser snapshot showed development preload warnings for several unused Next chunks and a slide image, plus a reduced-motion notice. No production console/network audit was performed.
- `npm audit` and `npm outdated` queried the package registry. The backend test suite passed **18 tests**, with **one MongoDB integration test skipped**. `npm run lint` did not finish within 120 seconds and was stopped; this is not a lint pass or a lint failure. No production build or bundle analyzer was run.

## 3. Critical Problems

**None confirmed.** Production CWV, production bundle budgets, and production backend response times were not measured.

## 4. High Priority Problems

### H-1 — Large autoplay hero video

- **Severity:** High
- **Files/lines:** `components/hero/FrameSequenceHero.tsx` (playback effect at lines 17, 20, 26; video at lines 48, 56, 60); `components/hero/FrameSequenceHero.css` (hero background at line 7).
- **Root cause:** `public/hero1.mp4` is **7,086,021 bytes**, 1280×720 and 8 seconds long. The component calls `video.play()` for users without reduced motion. There is one MP4 source and no mobile-specific/data-saving source. The same poster is also a CSS background and the video poster.
- **Why it matters:** A large autoplay asset can consume several megabytes on the initial visit, compete with content and interactive scripts for bandwidth, and require video decode/compositing work. Mobile users are affected most. `preload="metadata"` does not prevent the subsequent playback request.
- **Recommended solution:** Re-encode with a visually verified bitrate/codec appropriate to the source, provide a lower-bandwidth mobile rendition or static poster for constrained connections, and delay playback until it is useful/visible. Retain the same visible scene and timing, and compare actual optimized output before choosing a target size.
- **Expected improvement:** Fewer initial media bytes and less network/decode pressure; exact byte and LCP improvement requires a production A/B measurement.
- **Affects:** Both; highest risk on mobile and slower connections.

### H-2 — High production dependency advisory in the backend

- **Severity:** High (availability/security; can become a performance outage)
- **Files/lines:** `backend/package-lock.json` (lines 62, 64; `body-parser@2.3.0`); `backend/src/app.js` (line 31, `express.json`).
- **Root cause:** `express@5.3.0` resolves vulnerable `body-parser@2.3.0`. `npm audit --prefix backend` reports GHSA-27r3-jxmh-p828, a denial-of-service issue involving trailing bytes after a compressed request body; the vulnerable range is `<2.4.0`, and npm reported a fix available.
- **Why it matters:** Crafted public requests can consume backend resources and degrade or deny service. This is not evidence that normal requests are currently slow.
- **Recommended solution:** Upgrade to a dependency graph resolving `body-parser >=2.4.0` (through a compatible Express update or supported dependency resolution), then rerun the backend test suite and `npm audit`.
- **Expected improvement:** Removes the known vulnerable request-parsing path and reduces risk of request-triggered availability degradation. No normal-traffic latency gain is claimed.
- **Affects:** Backend/API, both desktop and mobile users when the API is unavailable or degraded.

## 5. Medium Priority Problems

### M-1 — React state update on every statistics-animation frame

- **Severity:** Medium
- **File/lines:** `components/homepage/StatisticsSection.tsx` (lines 18, 37, 40, 49, 53).
- **Root cause:** The counter animation schedules `requestAnimationFrame` and invokes `setCounts` on every frame for 1.4 seconds.
- **Why it matters:** Each frame schedules a React render of the statistics component even though the animation only changes displayed numbers. This adds main-thread work and can contribute to jank on slower phones.
- **Recommended solution:** Keep the same easing/duration but update the animated text through refs/DOM writes, or cap React updates to a measured cadence rather than every frame.
- **Expected improvement:** Fewer React renders and less main-thread work during the count-up; visual sequence can remain unchanged.
- **Affects:** Both; more noticeable on mobile/low-end CPUs.

### M-2 — Featured carousel timer runs continuously; first slide is eager

- **Severity:** Medium
- **File/lines:** `components/homepage/FleetBannerSlider.tsx` (lines 16, 19–20, 38).
- **Root cause:** The 3-second interval is always active after mount and rotates React state without checking document visibility or whether the slider is near the viewport. The first slide is explicitly `loading="eager"` even though the slider occurs well after the hero and booking section.
- **Why it matters:** It performs recurring work while the page is backgrounded/off-screen and can initiate image work before the user reaches the carousel. The browser also logged a development warning that a slide image preload was unused shortly after load.
- **Recommended solution:** Pause/resume the timer based on visibility/intersection and avoid eager-loading an off-screen first slide unless production LCP evidence shows it is needed.
- **Expected improvement:** Less background work and fewer unnecessary early image requests; no change to the carousel’s visual sequence while viewed.
- **Affects:** Both; mobile bandwidth/battery are more sensitive.

### M-3 — Fleet API responses are explicitly uncached

- **Severity:** Medium
- **Files/lines:** `lib/use-fleet-collection.ts` (line 48); `app/api/fleet/route.ts` (lines 28, 40).
- **Root cause:** The browser fetch uses `cache: "no-store"` and the proxy also uses `cache: "no-store"` and returns `Cache-Control: no-store`.
- **Why it matters:** Every fleet page mount reaches the proxy/backend even when the public fleet has not changed. This increases repeat-navigation latency and backend load.
- **Recommended solution:** If fleet freshness requirements permit, cache only the public fleet response for a short interval and invalidate it after successful admin writes (the route already calls `revalidateTag` after writes). Keep admin/hidden-record responses uncached.
- **Expected improvement:** Fewer repeated backend reads and potentially faster repeat fleet navigation; improvement depends on traffic and cache hit rate.
- **Affects:** Both, on fleet/cars-rental routes.

### M-4 — Seed and migration writes occur on ordinary reads and bookings

- **Severity:** Medium
- **Files/lines:** `backend/src/controllers/fleetController.js` (lines 152, 158, 171, 208, 211); `backend/src/controllers/bookingController.js` (lines 196–197, 204–205).
- **Root cause:** `listFleet` calls `ensureFleetSeeded` before each public list. That helper performs two `bulkWrite` operations. Booking creation also calls it and then reads the entire non-archived fleet before booking/idempotency work.
- **Why it matters:** These database operations are on request paths and add round trips/queries to requests that should mostly read or write one record. Remote MongoDB latency and increased concurrency amplify the cost. No live query plan or API timing was available, so the actual delay is unquantified.
- **Recommended solution:** Keep seed/migration work in a startup/deployment migration or guarded one-time initialization, and query only the required fields/vehicle for booking validation where behavior permits.
- **Expected improvement:** Fewer database operations per public fleet read and booking submission, improving request latency and concurrency headroom.
- **Affects:** Backend/API, both desktop and mobile.

### M-5 — Large root-level stylesheet

- **Severity:** Medium (source-size indicator; delivered size unmeasured)
- **Files/lines:** `app/globals.css` (110,512 bytes, 5,576 lines); imported by `app/layout.tsx` at line 4.
- **Root cause:** A large project-wide stylesheet is imported from the root layout, making its rules part of the shared style path.
- **Why it matters:** Large CSS can increase transfer, parse, and style-recalculation cost on every route. The source byte count is not the compressed production CSS size, so the shipped cost is not established.
- **Recommended solution:** Inspect production CSS output first, then split route/component-specific rules from global styles and remove only rules confirmed unused.
- **Expected improvement:** Potentially less CSS delivered/parsed on routes that do not use page-specific styles; quantify using built CSS and the browser Network panel.
- **Affects:** Both, potentially all routes.

### M-6 — Client-side surface on the homepage needs bundle measurement

- **Severity:** Medium (potential; production bundle not measured)
- **Files/lines:** `app/(site)/page.tsx` (lines 1–8); `components/homepage/HomeBookingSection.tsx` (line 1; 35,124-byte source); `components/homepage/HomeDeferredSections.tsx` (line 1); `components/layout/Navbar.tsx` (lines 1–3).
- **Root cause:** The homepage imports a client booking experience, client deferred-section container, and a shared client navigation that imports Framer Motion. Dynamic imports exist for some sections, but the client/server boundary and final chunk split were not verified in a production build.
- **Why it matters:** Client code must be downloaded/parsed/hydrated for interactive behavior. Source file size does not directly equal shipped JavaScript; no reliable bundle or long-task profile is available.
- **Recommended solution:** Use a production bundle analyzer and route-level performance profile before changing boundaries. Preserve booking functionality; defer only content that is truly below the fold and not required for initial rendering.
- **Expected improvement:** If profiling confirms over-delivery, smaller initial JS and less hydration work without changing the user flow.
- **Affects:** Both, especially lower-powered mobile devices.

### M-7 — Large original image files remain in the public asset set

- **Severity:** Medium (some assets are optimized at request time; source payload is not the delivered payload)
- **Files:** The exact assets and dimensions are listed in section 8.
- **Root cause:** Several PNG originals range from about 1.5 to 2.0 MB. The homepage carousel and fleet data reference some of them. `next/image` is used for many image displays, and the local browser observed optimizer URLs; therefore the originals may be transformed before delivery. The raw logo is also registered directly as icon/shortcut/Apple icon.
- **Why it matters:** Large originals increase deployment/storage and image-optimizer work. Any direct static use bypassing the optimizer can transfer the full PNG. The raw logo icon is much larger than its display purpose.
- **Recommended solution:** Use responsive, appropriately sized AVIF/WebP derivatives (or a visually verified optimized source), retain `sizes`/lazy-loading, and use a small icon-specific logo asset. Verify production response `Content-Type` and bytes before prioritizing individual files.
- **Expected improvement:** Lower image bytes and image decode work where the current optimized path is not already doing so.
- **Affects:** Both; mobile bandwidth is most sensitive.

## 6. Low Priority Problems

### L-1 — Fleet list memoization is ineffective

- **Severity:** Low
- **File/lines:** `components/fleet/FleetListing.tsx` (lines 21–24).
- **Root cause:** `vehicles` is recreated with `.filter()` on each render, then passed as a dependency to `useMemo`; the dependency identity changes every render, so the memoized second filter is recomputed.
- **Why it matters:** It does unnecessary filtering after state changes, but the present fleet is small and the cost is likely negligible.
- **Recommended solution:** Memoize the first filtered list or perform the category filter once.
- **Expected improvement:** Slightly less render-time work on fleet filter interactions.
- **Affects:** Both, `/fleet`.

### L-2 — Unused/orphan assets and 3D code add repository/deployment weight

- **Severity:** Low (no current-page transfer established)
- **Files:** `components/car3d/Car3DSection.tsx` (component at line 805); `public/models/luxury-sedan.glb` (5,060,296 bytes); `public/electric.png`, `public/sedan.png`, `public/sport.png`, `public/suv.png`; paired PNG vehicle images listed in section 8.
- **Root cause:** The route/import scan found no current page importing `Car3DSection`, and the listed root category PNG paths were not referenced by app/data source. Static assets may still be deployed even when no page requests them.
- **Why it matters:** This does not currently prove extra browser JavaScript or network transfer, but it increases repository/deployment storage and makes asset ownership unclear. Three.js/R3F/Drei are declared dependencies; do not assume they are in the active homepage bundle without a bundle report.
- **Recommended solution:** Confirm intentional use before pruning; otherwise keep unused media and 3D dependencies out of the active route graph and deployment manifest.
- **Expected improvement:** Smaller deploy/install footprint if confirmed unused; no guaranteed runtime-page improvement.
- **Affects:** Both only if these assets/components are later loaded; currently no active-route impact found.

### L-3 — Production metadata is missing on some public pages; social links are placeholders

- **Severity:** Low (SEO/navigation quality, not a direct speed issue)
- **Files:** `app/layout.tsx` (lines 6–13); `app/(site)/about/page.tsx`; `app/(site)/deals/page.tsx`; `app/(site)/fleet/page.tsx`; `components/layout/Footer.tsx` (lines 105, 108, 114, 117, 120).
- **Root cause:** About, deals, and fleet pages have no page-specific metadata export and inherit the root title/description. Five footer social anchors use `href="#"`.
- **Why it matters:** Generic metadata weakens page-specific search presentation. Placeholder anchors do not lead to their intended social destinations.
- **Recommended solution:** Add accurate per-route title/description/canonical metadata and replace placeholder links with real destinations or non-link labels.
- **Expected improvement:** Better search snippets and working navigation; no CWV improvement expected.
- **Affects:** Both.

### L-4 — Autoplay failure is silently swallowed

- **Severity:** Low
- **File/line:** `components/hero/FrameSequenceHero.tsx` (line 26).
- **Root cause:** A rejected `video.play()` promise is caught and discarded.
- **Why it matters:** Autoplay restrictions are normal and the poster remains, but unexpected playback/decoding failures are indistinguishable from policy blocks during troubleshooting.
- **Recommended solution:** Preserve graceful fallback while adding a privacy-safe diagnostic path for unexpected media errors.
- **Expected improvement:** Better diagnosis of playback failures; no direct speed gain.
- **Affects:** Both.

## 7. Video Scroll Animation Problems

### What is active now

- The current homepage route renders `HomeVideoHero`, `HomeBookingSection`, and `HomeDeferredSections` (`app/(site)/page.tsx`). The active hero is an HTML video, not a frame-per-scroll canvas.
- No current route/import path was found for `Section2ScrollHero`, `FleetCinematicSection`, `Car3DSection`, or `useScrollFrameSequence`. These components/hooks are dormant in the current route graph.
- The integrated browser reported the hero video as 1280×720 and 8 seconds. The browser had reduced motion enabled, so playback was paused; this did not measure normal autoplay download/decode behavior.

### Frame sequence asset and cache findings

#### F-1 — Frame sequence directories are absent

- **Severity:** Medium for the dormant feature; no current homepage impact
- **Files/lines:** `components/hero/useSection2Animation.ts` (lines 10, 20, 24); `components/hero/Section2ScrollHero.tsx` (line 19); `components/fleet/useFleetCinematicAnimation.ts` (line 17); `components/fleet/FleetCinematicSection.tsx` (line 23).
- **Root cause:** Code requests `/frame2/ezgif-frame-*.png`, `/frame2.1/ezgif-frame-*.png`, and `/newsec/frame_*.jpg`, but `public/frame2`, `public/frame2.1`, `public/newsec`, and `public/newsec1` do not exist in this checkout.
- **Why it matters:** If these sections are mounted, their fallback and frame requests cannot load; frame size/compression and decode behavior cannot be assessed from absent files.
- **Recommended solution:** Before activating the feature, supply the complete, versioned frame sets or update the URLs to the actual assets; validate every frame request and boundary on desktop/mobile.
- **Expected improvement:** Restores the intended animation instead of blank/missing frames. No current-page speed improvement because these sections are not mounted.
- **Affects:** Both, if the dormant components are activated.

#### F-2 — Keyframe cache is not bounded in two dormant implementations

- **Severity:** Medium if activated; currently no active-route impact
- **Files/lines:** `components/fleet/useFleetCinematicAnimation.ts` (keyframe cache at line 130, insertion at line 311; only sliding cache is trimmed at lines 268–274); `components/hero/useScrollFrameSequence.ts` (keyframe cache at line 80, insertion at line 281, trim call at line 289).
- **Root cause:** The Fleet cinematic hook caps the sliding cache at 40 mobile/80 desktop frames, but does not evict from `keyframeCache`. The generic hook’s `trimCache` limits `slidingCache` only, while keyframes are inserted separately. `useSection2Animation` is better bounded: it sets both cache limits to 4 and trims both.
- **Why it matters:** If the 329-frame Fleet animation is scrolled through, keyframes accumulate for the component lifetime. At 1280×720, one decoded RGBA frame is approximately 3.5 MiB; 80 sliding frames plus roughly 22 keyframes is a theoretical ~358 MiB desktop decoded-pixel upper bound, before browser/GPU overhead. This is an estimate, not measured memory.
- **Recommended solution:** Apply a bounded LRU/window policy to keyframes too; evict image sources when removed; profile memory on real mobile hardware. Preserve frame selection and sequence timing.
- **Expected improvement:** Bounded decoded-image memory and fewer mobile freezes/OOM risks while retaining the same frame sequence.
- **Affects:** Both, especially mobile; latent until the hook is mounted and valid frames are supplied.

### Scroll-handler and canvas assessment

- The frame hooks use passive scroll listeners and `requestAnimationFrame` coalescing; they cache layout measurements and cap canvas backing-store pixels. The section-two and Fleet hooks avoid React state updates during each scroll tick; they update React readiness only when the first frame draws.
- Those are good patterns and do not support a finding that a currently active frame-scroll handler is causing the homepage’s lag.
- If frame scrubbing is intended, the best appearance-preserving first step is to keep the current progress-to-frame mapping and scroll/pin timing, supply the same frames in efficient, visually verified modern image encodings, retain a small bounded decode cache, and keep mobile canvas DPR within the source detail. Do not reduce frame count or change mapping until visual parity is explicitly verified.
- No sequence asset sizes, per-frame decode times, canvas GPU timings, memory profile, scroll FPS, or real-device lag could be measured because the files/components are absent/inactive.

## 8. Image and Video Optimization Problems

### Referenced or potentially delivered assets

| Asset | Original dimensions | Source bytes | Audit note |
|---|---:|---:|---|
| `public/hero1.mp4` | 1280×720, 8 s (browser metadata) | 7,086,021 | Active homepage hero; see H-1. Codec/bitrate could not be inspected because `ffprobe` was unavailable. |
| `public/hero1-poster.jpg` | 1280×720 | 250,370 | Active poster/background; moderate size, referenced by video and CSS. |
| `public/logo.png` | 1672×941 | 2,243,328 | Used in the navigation/footer through `next/image`, but also directly used for root icon/shortcut/apple metadata. The raw icon path may transfer the full raster. |
| `public/slide1.png` | 2170×725 | 2,011,889 | Carousel image; first slide is eager. `next/image` is used. |
| `public/slide2.png` | 2172×724 | 1,802,938 | Carousel image; `next/image` is used. |
| `public/slide3.png` | 2172×724 | 1,866,619 | Carousel image; `next/image` is used. |
| `public/slide4.png` | 2172×724 | 1,764,480 | Carousel image; `next/image` is used. |
| `public/slide5.png` | 2172×724 | 1,888,614 | Carousel image; `next/image` is used. |
| `public/carsimg/kiaklavis.png` | 1774×887 | 1,910,194 | Referenced by fleet/vehicle sections; verify actual optimized response bytes. |
| `public/carsimg/renaultkiger.png` | 1774×887 | 1,858,051 | Referenced by fleet/vehicle sections; verify actual optimized response bytes. |
| `public/carsimg/suzukibreza.png` | 1774×887 | 1,893,424 | Referenced by fleet/vehicle sections; verify actual optimized response bytes. |
| `public/carsimg/suzukicelerio.png` | 1536×1024 | 1,972,467 | Referenced by fleet/vehicle sections; verify actual optimized response bytes. |
| `public/carsimg/suzukidzire.png` | 1774×887 | 1,796,008 | Referenced by fleet/vehicle sections; verify actual optimized response bytes. |
| `public/carsimg/suzukietiga.png` | 1774×887 | 1,843,909 | Referenced by fleet/vehicle sections; verify actual optimized response bytes. |

The five carousel source PNGs total **9,334,540 bytes**; the six `carsimg` PNGs total **11,274,053 bytes**. Those totals describe repository originals, not necessarily browser transfer: the local homepage requested Next image optimizer URLs for displayed images. Production optimizer output and cache behavior were not measured.

### Other assets found

- `public/electric.png` (1,809,490 bytes; 1774×887), `public/sedan.png` (1,568,515; 1774×887), `public/sport.png` (1,597,891; 1774×887), and `public/suv.png` (1,843,110; 1842×854) had no literal app/data source references in the scan. No current browser request was attributed to them; treat as likely unused, not as current network causes.
- Four PNGs share basenames and dimensions with JPEGs under `public/images/vehicles/`: `hero-aston-martin-vantage.png` (854,784 bytes), `hero-luxury-suv.png` (1,267,988), `hero-mercedes-s-class.png` (1,058,118), and `hero-porsche-taycan.png` (707,993). Their exact PNG paths were not found in app/data source references. Confirm whether they are intentional transparent variants before changing deployment contents.
- `public/models/luxury-sedan.glb` is 5,060,296 bytes. Its scene component is not imported by the current route graph; no current page download was established.
- The seven WebP deal images range from 85,070 to 381,204 bytes; the vehicle JPGs are generally about 174–655 KB. These are smaller than the large PNG originals; no source-level conclusion about their final optimized transfer is made.
- No frame-sequence folders exist, so no frame image can be listed or measured.

## 9. JavaScript and React Problems

- **M-1** is the strongest confirmed React rendering issue: statistics use `setCounts` on each animation frame.
- **M-2** is a recurring timer/state update in the carousel.
- **M-6** is a client-bundle profiling candidate, not a proven oversized production bundle. The homepage includes the interactive booking component; the shared navbar imports Framer Motion. Production JS chunk sizes and hydration duration were not measured.
- **L-1** identifies a memoization dependency that changes identity on every FleetListing render. The dataset is small, so impact is low.
- `components/layout/Navbar.tsx` has a passive scroll listener that calls `setIsScrolled` on each scroll event. The state is boolean and React can bail out when unchanged; no repeated expensive render was observed. This is not a confirmed major bottleneck.
- No infinite render loop was confirmed in the inspected active hooks. A complete lint result is unavailable because the full lint command did not finish within 120 seconds.
- `Car3DSection`, `Section2ScrollHero`, `FleetCinematicSection`, and the generic `useScrollFrameSequence` were not found in the current route/import graph. Their source complexity/dependencies should not be attributed to current homepage execution without a production bundle report.

## 10. Mobile Performance Problems

- The most concrete mobile risk is H-1: the 7.09 MB hero video is eligible to autoplay on mobile when reduced motion is not enabled. There is no mobile-specific rendition or data-saver policy.
- Carousel timer/image behavior (M-2), React frame-by-frame counter state (M-1), and latent frame-cache memory (F-2) are more sensitive on lower-powered devices.
- **Observed layout check:** viewport 390×844 showed no horizontal overflow (`scrollWidth` did not exceed the viewport). This was not a fresh mobile load and does not prove all breakpoints or pages are overflow-free.
- No physical iOS/Android, low-end CPU, throttled network, touch latency, scroll FPS, memory, or mobile INP testing was available.
- The integrated browser had reduced motion enabled; autoplay and scroll-animation behavior for a normal-motion user was not measured.

## 11. Backend and Network Problems

- No production backend URL, network trace, database profiler, or reliable local API timing was available. Therefore no claim is made that the production database/API is currently slow.
- **M-4** is a code-confirmed request-path cost: fleet seeding/migration bulk writes run during reads and booking requests.
- **M-3** is a code-confirmed cache policy: public fleet data is `no-store` from client through proxy. Consider a short public cache only if freshness rules permit; continue excluding hidden/admin data.
- `backend/src/controllers/fleetController.js` lists all matching fleet documents and sorts by `name`; the model defines unique indexes for `id` and `slug` but no compound index for the public archive/show-in-fleet filter plus sort. With the current small seed fleet this is not proven costly; it becomes a scale concern as the collection grows.
- Proxy timeouts are 12 seconds (`app/api/fleet/route.ts` and `app/api/bookings/route.ts`). This is a failure ceiling, not a measured response time. Fleet UI starts from seed data, so a slow request can delay freshness/error resolution rather than necessarily blanking the initial list.
- Backend tests passed 18 tests; the Mongo integration test was skipped. No production DB query plan, indexes in Mongo, connection-pool metrics, failed request trace, or cache-header validation is available.

## 12. SEO and Accessibility Problems

- **L-3:** about, deals, and fleet routes lack page-specific title/description metadata and inherit root metadata. Other inspected booking/contact/privacy/terms pages define metadata; the vehicle detail page generates metadata.
- **L-3:** footer social anchors at `components/layout/Footer.tsx` lines 105, 108, 114, 117, and 120 point to `#` placeholders.
- The homepage browser snapshot showed one H1 followed by section H2s and card H3s; no obvious homepage heading-order issue was observed.
- Image components generally provide `alt`; carousel slides use the same generic alt text for all five images. Audit only; whether each image conveys distinct information needs product/content context.
- No external font request or `@font-face` declaration was found in the inspected stylesheet paths; the root CSS uses a system font stack, so no third-party font-loading delay was identified.
- The browser snapshot showed preload warnings but no console error was reported there. Console errors and broken links across every route were not comprehensively tested.
- Mobile no-overflow observation is limited to 390×844 on the homepage.

## 13. Security and Code Quality Problems

### Dependency audit

- `npm audit --prefix backend`: **1 high** production finding, `body-parser@2.3.0` (GHSA-27r3-jxmh-p828); fix available. See H-2.
- Full root `npm audit`: **1 high + 7 moderate** findings in development dependency paths. The high finding is `zod@4.6.5` in `package-lock.json` (line 7496), advisory GHSA-mrhx-c7xc-m3w5, vulnerable below 4.6.6; npm reports a fix available. Moderate findings include `@typescript-eslint/*`, `typescript-eslint`, and `minimatch`.
- Root `npm audit --omit=dev`: **0 production findings**.
- `npm outdated` also reports newer in-range versions for `@react-three/fiber` 9.8.1→9.8.2, `@tailwindcss/turbopack` 4.3.3→4.3.5, Framer Motion 14.0.0→14.11.1, GSAP 3.15.0→3.15.1, Lucide 1.53.0→1.70.0, React/React DOM 19.3.0→19.3.1, Tailwind 4.3.3→4.3.5, and backend dotenv 18.0.8→18.0.10, express-rate-limit 8.7.1→8.7.4, and Mongoose 9.11.2→9.12.1. These updates are not evidence of slowness; upgrade with compatibility tests. Major latest versions outside declared ranges are not recommended as routine patch updates.

### Secret handling and errors

- No `NEXT_PUBLIC_*` environment references or hard-coded API-key literals were found in the searched source. The root `.env` is not tracked by Git. Secret values were not read into this report.
- The Next fleet/booking proxy routes return generic 503 responses when upstream calls fail. Their catches do not record a server-side diagnostic, which makes production latency/outage triage harder; add privacy-safe structured error logging/metrics without logging secrets or customer data.
- The hero’s `video.play()` rejection is silently ignored (L-4). Browser autoplay policy is expected, but unexpected media failures are not observable.
- No source change was made. Existing unrelated dirty worktree entries were left unchanged.

## 14. Exact File Names and Line Numbers

| Finding | File and line/component | Confirmed evidence |
|---|---|---|
| H-1 | `components/hero/FrameSequenceHero.tsx:20,26,48,56,60`; `public/hero1.mp4` | Effect starts playback; one MP4 source; 7,086,021 bytes. |
| H-2 | `backend/package-lock.json:62,64`; `backend/src/app.js:31` | `body-parser@2.3.0` is resolved and used by `express.json`. |
| M-1 | `components/homepage/StatisticsSection.tsx:18,37,40,49,53` | State update repeats in each animation frame. |
| M-2 | `components/homepage/FleetBannerSlider.tsx:16,19,20,38` | Always-running interval; first image eager. |
| M-3 | `lib/use-fleet-collection.ts:48`; `app/api/fleet/route.ts:28,40` | Client/upstream response both bypass caching. |
| M-4 | `backend/src/controllers/fleetController.js:152,158,171,203,208,211`; `backend/src/controllers/bookingController.js:196,197,204,205` | Seed/migration work and full fleet query on request paths. |
| M-5 | `app/layout.tsx:4`; `app/globals.css` | Root import; stylesheet source is 110,512 bytes/5,576 lines. |
| M-6 | `app/(site)/page.tsx:1,5,6`; `components/homepage/HomeBookingSection.tsx:1`; `components/homepage/HomeDeferredSections.tsx:1`; `components/layout/Navbar.tsx:1,3` | Client boundaries and Framer Motion import to profile in production. |
| L-1 | `components/fleet/FleetListing.tsx:21,22,24` | Memo dependency is a newly filtered array. |
| L-3 | `app/(site)/about/page.tsx`; `app/(site)/deals/page.tsx`; `app/(site)/fleet/page.tsx`; `components/layout/Footer.tsx:105,108,114,117,120` | No route metadata export on the first three; footer placeholders. |
| F-1 | `components/hero/useSection2Animation.ts:10,20,24`; `components/fleet/useFleetCinematicAnimation.ts:17`; `public/frame2`, `public/frame2.1`, `public/newsec`, `public/newsec1` | Source URLs point to absent directories. |
| F-2 | `components/fleet/useFleetCinematicAnimation.ts:130,268,311`; `components/hero/useScrollFrameSequence.ts:80,241,281,289` | Keyframe insertion without corresponding keyframe-cache eviction. |
| L-2 | `components/car3d/Car3DSection.tsx:805`; `public/models/luxury-sedan.glb`; root PNG assets listed in section 8 | Current route graph does not import the component; no current-page transfer established. |

## 15. Recommended Solutions

1. Re-encode the hero media and add an appropriate mobile/constrained-connection delivery path; preserve the visible scene and validate the resulting poster/video transition.
2. Resolve the backend `body-parser` advisory to a fixed version and rerun backend tests plus dependency audit.
3. Move seed/migration writes out of normal read/booking requests; limit booking lookups to the necessary vehicle record.
4. Consider short-lived caching for public fleet reads with invalidation after admin writes; keep hidden/admin records `no-store`.
5. Remove per-frame React state updates from the statistics animation and pause carousel work when it is hidden/off-screen.
6. Bound every frame cache, including keyframes, before enabling any frame-scroll sections.
7. Restore/verify frame assets before activating frame-sequence components; compress assets without altering frame count, ordering, mapping, or verified visual quality.
8. Use the production Next build to measure actual JS/CSS/image bytes and run Lighthouse/Web Vitals on a representative mobile profile before changing client boundaries or CSS.
9. Add page-specific metadata and replace placeholder social destinations.
10. Upgrade remaining outdated dependencies selectively after compatibility checks; do not treat every newer major version as a safe drop-in.

## 16. Optimization Priority Checklist

- [ ] Resolve the backend production `body-parser` high advisory.
- [ ] Measure a clean production build on a production-like host: FCP, LCP, TTFB, INP, CLS, JS/CSS bytes, and media bytes.
- [ ] Reduce hero video transfer size and define mobile/data-saving behavior.
- [ ] Remove request-path fleet seeding/migration writes.
- [ ] Establish an explicit public fleet cache policy and invalidation test.
- [ ] Eliminate the statistics component’s frame-by-frame React updates.
- [ ] Pause the carousel timer when hidden/off-screen and verify whether eager first-slide loading is justified.
- [ ] Bound dormant animation caches and verify complete frame assets before activation.
- [ ] Inspect optimizer output for the logo, carousel, and vehicle images; replace oversized direct icon assets.
- [ ] Run low-end mobile scroll/memory/touch tests and full-route console/network checks.
- [ ] Add route metadata and resolve placeholder links.
- [ ] Re-run lint/build after the audit is approved; the audit lint attempt did not complete.

## 17. Expected Performance Improvements

No numeric CWV improvements can be promised without a production baseline. Expected direction, subject to measurement:

- Smaller/lower-priority hero media should reduce transferred bytes and competition for critical resources, especially on mobile.
- Moving seed/migration work off request paths and caching unchanged public fleet data should reduce backend database operations and improve repeat-route latency under load.
- Avoiding React renders on every animation frame and pausing off-screen intervals should reduce main-thread/battery work and improve scroll responsiveness on weaker devices.
- Bounded frame caches should prevent decoded-image memory from growing with the length of a scroll session.
- Production CSS/image/bundle analysis may reveal fewer delivered bytes, but source-size numbers alone are not a shipped-size measurement.

## 18. Final Developer Recommendations

The current source does **not** show an active scroll-scrubbed frame animation on the homepage. Its main cinematic asset is the 7 MB autoplay MP4. Prioritize that media path, the backend dependency advisory, and repeated database work first.

Before attempting to tune production CWV, capture a clean production-like run with throttled mobile CPU/network and an actual browser trace. Record LCP element/resource, INP interactions, CLS contributors, long tasks, and request transfer sizes. Separately, if the frame-sequence experience is intended, restore its assets and profile frame decode/cache memory on a real mobile device before enabling it.

This report is audit-only. No application fixes were applied; wait for approval before making any changes.
