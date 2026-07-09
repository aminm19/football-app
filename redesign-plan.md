# Total Football — FotMob-style Redesign Plan

Source of truth for the in-progress visual redesign. Presentation only — no
changes to data flow, routing, or business logic. Updated as units complete.

## Design direction

High-end premium/agency, modeled on FotMob (reference screenshots studied in
`~/Documents/JavaScript/react/FMReferences/`):

- Near-black canvas background with a lighter charcoal card surface, thin
  `whiteAlpha` separators instead of heavy borders, generous rounded corners.
- Signature accent: a colorful aurora-gradient banner treatment on
  competition/match header cards (blue/green/red blend), used sparingly.
- Clean sans body/UI type (Inter or system-sans stack). A condensed display
  font (Bebas Neue, properly loaded this time) reserved for the brand
  wordmark only, echoing FotMob's bold logo treatment.
- Pill-shaped buttons/toggles/status badges, green underline tab indicator
  (already present, being systematized).
- Zone-color bars + colored form-pill squares on standings (already present,
  being refined/tokenized).
- Dense data (standings, fixtures) stays legible via spacing/hierarchy, not
  clutter.

## Status legend
- [ ] not started · [~] in progress · [x] done

## Units

### 1. Design system foundation — DONE
- [x] Define semantic color tokens (canvas bg, card bg, borders, text
      primary/secondary, accent green, zone colors blue/orange/green/red,
      rating colors) in a Chakra v3 system/theme extension.
- [x] Load Inter (or chosen sans) for body/UI text; properly load a condensed
      display font for the wordmark only.
- [x] Delete dead leftover Vite-template CSS in `index.css`/`App.css`
      (stray purple `--accent`, hardcoded `#root` width/border, unused
      classes).
- Files: `client/src/theme.js` (new), `client/src/components/ui/provider.jsx`,
  `client/index.html`, `client/src/index.css`, `client/src/App.css`.
- Notes: new tokens live in `client/src/theme.js` — `bg.canvas`/`bg.surface`/
  `bg.raised`, `text.primary`/`text.secondary`, `border.subtle`/`border.muted`,
  `accent.green`, `zone.ucl`/`zone.uel`/`zone.uecl`/`zone.relegation`,
  `status.positive`/`warning`/`negative`. Existing per-file `bg="gray.900"` /
  `color="black"` calls still work today because the raw Chakra `gray.900`
  and `black` palette entries were nudged to match — later units should
  migrate call sites to the named semantic tokens above as they're touched.
  Visually verified on Home, Match, and League pages (localhost:5173) —
  canvas/card layering, Inter body text, and the Bebas Neue wordmark all
  render correctly; no regressions.

### 2. Top nav — DONE
- [x] Restyle wordmark + Home link on the new type system, fix alignment.
- Files: `client/src/App.jsx`.
- Notes: added a thin `border.subtle` bottom separator so the nav reads as
  a distinct bar; matched line-height on both links so Bebas Neue (wordmark)
  and Inter (Home link) sit on the same baseline; wordmark now uses
  `fontFamily="heading"`/`text.primary`/`accent.green` hover, Home link uses
  `fontFamily="body"`/`text.secondary` resting/`text.primary` hover. Visually
  verified on localhost:5173 — clean, balanced, no regressions.

### 3. MatchRow + status badges — DONE
- [x] Tighten spacing/alignment, adopt tokenized colors, refine status badge
      styling, fix status-under-score layout.
- Files: `client/src/components/MatchRow.jsx`.
- Notes: replaced the heavy trailing status `Badge` with a small muted
  uppercase caption under the score (`text.secondary` for FT, `accent.green`
  for HT/live), fixing row symmetry (home | center | away). Score is now the
  clear focal point, team names secondary, status least prominent — matches
  FotMob's understated status treatment. Verified on Home (grouped lists)
  and League Fixtures tab.

### 4. Home page — DONE
- [x] Restyle date-nav card, league-group cards, sidebar to new card/spacing
      system.
- Files: `client/src/pages/Home.jsx`.
- Notes: sidebar is now a compact nav list with per-row hover (`bg.raised`);
  date-nav bar reads as one cohesive pill (chevrons + day-label all
  `borderRadius="full"` on `bg.surface`); league-group header uses solid
  `bg.raised` vs. body `bg.surface` so it reads as a section header. All raw
  `gray.900`/`whiteAlpha.*` in this file migrated to semantic tokens.
  `MonthCalendar.jsx` reviewed, already fit — untouched. Verified visually,
  including calendar popover.

### 5. Match page — DONE
- [x] Apply gradient-banner treatment to competition strip/header, restyle
      meta row, score row typography, tabs polish.
- Files: `client/src/pages/Match.jsx`.
- Notes: signature aurora-gradient banner shipped — layered radial gradients
  (blue/green/red, muted) over the competition strip, fading into
  `bg.surface` below. Score bumped to `4xl`/extrabold as the dominant
  element, team names secondary. Tab indicator now uses `accent.green`.
  This is the reference implementation for the same gradient treatment on
  League's header card (unit 7). Verified visually across Events/Lineups/
  Standings tabs.

### 6. StandingsTable
- [ ] Refine zone bars, form pills, row density, header/legend styling.
- Files: `client/src/components/StandingsTable.jsx`.

### 7. League page
- [ ] Reuse gradient banner on header card, restyle pill toggles and pager.
- Files: `client/src/pages/League.jsx`.

### 8. Bracket / TieBox / TieDialog
- [ ] Apply card system to ties and dialog. Connector lines remain
      deferred/out of scope.
- Files: `client/src/components/TieBox.jsx`, `client/src/components/Bracket.jsx`,
  `client/src/components/TieDialog.jsx`.

### 9. Consistency pass
- [ ] Step back across the whole app, check for drift between restyled and
      not-yet-restyled areas, fix inconsistencies.

## Notes
- Team page (`/team/:id`) is a functional stub per CLAUDE.md — not a
  redesign target until it's built out.
- Bracket connector lines are intentionally deferred (CLAUDE.md) — do not
  add them here.
