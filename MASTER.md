# EpicDrive Design System

This file is the visual source of truth for the website. Public routes and the admin
workspace share the same light, editorial red-and-white system; route-specific layout
and content remain unchanged.

## Design direction

- **Visual thesis:** Calm editorial premium: a warm light-grey canvas, white rounded
  cards, saturated red accents, bold modern sans-serif typography, airy spacing, thin
  borders, and restrained elevation.
- **Interaction thesis:** Fast 180ms ease-out control feedback; preserve existing
  scroll, video, and interaction behavior without adding reveals or parallax; avoid
  bounce or elastic effects; honor reduced-motion preferences.
- **Audience:** Premium travelers.
- **Reference:** User-provided EPICDRIVE booking-page screenshot and the supplied
  red-and-white palette.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#E71925` | Primary actions, active states, key icons |
| `--color-primary-hover` | `#C9121D` | Hover and pressed primary actions |
| `--color-background` | `#F7F5F5` | Page canvas |
| `--color-surface` | `#FFFFFF` | Cards, fields, menus, and panels |
| `--color-text-primary` | `#19191D` | Headings and primary content |
| `--color-text-secondary` | `#777B87` | Supporting text and labels |
| `--color-text-secondary-accessible` | `#6C6F79` | Body text on light surfaces when AA contrast is required |
| `--color-text-muted` | `#989BA5` | Placeholder and tertiary content |
| `--color-border` | `#E5E5EA` | Dividers, card and input borders |
| `--color-soft-red` | `#FFF0F1` | Icon wells, selected-state tints, subtle callouts |
| `--color-success` | `#2DAA72` | Success and completion indicators |
| `--color-error` | `#E71925` | Error status and validation feedback |
| `--color-warning` | `#777B87` | Warning status; pair with explicit text/icon |
| `--color-info` | `#777B87` | Informational status; pair with explicit text/icon |

Use the supplied values exactly. Warning and informational states use neutral text and
explicit labels/icons rather than introducing unrelated accent colors. Do not rely on
color alone to convey status.

## Typography

- **Family:** Existing system sans stack: `Inter, "Helvetica Neue", Helvetica, Arial,
  ui-sans-serif, system-ui, sans-serif`.
- **Body:** 16px / 1.5 line-height, regular weight.
- **Small labels:** 12px / 1.35, semibold or bold, uppercase with restrained tracking.
- **Type scale:** 12, 14, 16, 18, 20, 24, 32, 40, 48, and 56px. Use `clamp()` for
  page-level headings where the existing responsive composition needs it.
- **Headings:** Primary text color, semibold to bold, compact line-height, modest
  negative tracking. Supporting copy remains secondary and readable.

## Spacing and layout

- **Base unit:** 4px.
- **Scale:** 4, 8, 12, 16, 24, 32, 48, 64px.
- **Content width:** Retain the existing 90rem maximum and consistent responsive
  gutters; use narrower reading widths for prose.
- **Section rhythm:** 48–64px desktop, 32–48px tablet, and 24–32px mobile, adjusted
  to preserve existing page composition.
- **Responsive gutters:** Fluid at desktop/tablet, with at least 16px on small screens.

## Shape and elevation

- **Radius scale:** 8px (compact), 12px (inputs/buttons), 16px (small cards), 20px
  (cards), 24px (large panels), 28px (feature cards), full pill for chips/toggles.
- **Borders:** 1px solid `--color-border`; avoid high-contrast outlines except focus.
- **Shadows:** Restrained white-surface elevation only:
  - `--shadow-card: 0 8px 28px rgb(25 25 29 / 5%)`
  - `--shadow-raised: 0 14px 40px rgb(25 25 29 / 8%)`
  - `--shadow-primary: 0 8px 20px rgb(231 25 37 / 18%)`

## Base components

- **Primary button:** Red surface, white bold text, 12px radius, clear hover/active
  feedback and subtle red shadow. Disabled controls remain visibly disabled.
- **Secondary button:** White surface, thin neutral border, dark text; hover uses a
  soft neutral fill or red border, never a competing accent.
- **Input/select/date field:** White surface, neutral border, 12px radius, 44px minimum
  interactive height, visible label, and clear invalid/disabled states.
- **Card/panel:** White surface, thin border, 20–28px radius, restrained shadow.
- **Badge:** Soft-red or neutral surface with readable text; success uses the success
  token with sufficient contrast and a non-color status cue.
- **Links:** Dark by default, red on hover/focus; preserve route and navigation behavior.
- **Focus:** Visible 2px primary outline with offset on keyboard focus. Never suppress
  an outline without an equally visible replacement.

## Motion

- **Fast:** 120ms.
- **Normal:** 180ms.
- **Slow:** 260ms.
- **Easing:** `cubic-bezier(0.2, 0, 0, 1)`.
- **Hover:** Color, border, and restrained shadow transitions; no layout shift.
- **Scroll and hero:** Preserve existing behavior and performance; do not add new
  parallax or reveal effects.
- **Reduced motion:** Disable nonessential transitions and animations; preserve
  functionality and state changes.

## Accessibility and responsive behavior

- Keep body copy at or above 16px where practical and maintain WCAG AA contrast for
  text and controls. Use `--color-text-secondary-accessible` when the supplied
  secondary token does not meet the contrast threshold.
- Use semantic labels, keyboard-operable controls, visible focus, and minimum 44px
  touch targets where layout permits.
- Check layouts at 375, 768, 1024, and 1440px; prevent horizontal overflow and respect
  safe-area insets.
- Preserve all routes, content, business logic, booking validation, API behavior,
  video playback, and existing mobile navigation.
