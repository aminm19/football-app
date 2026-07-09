'use client';

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// FotMob-inspired dark design system: near-black canvas, lighter charcoal
// card surfaces, subtle whiteAlpha separators, green accent, tokenized zone
// colors for standings. This is the single source of truth for later
// per-component restyle units (see redesign-plan.md) — new code should
// reference these semantic tokens instead of raw Chakra palette values.
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Two distinct dark levels so cards visually lift off the page.
        // Surface levels are deliberately a bit lighter than a "safe" dark
        // theme default — enough contrast against canvas to read as a
        // distinct layer at a glance, not just a faint border.
        canvas: { value: '#0a0a0c' },
        surface: { value: '#1a1b21' },
        surfaceRaised: { value: '#23242c' },
        // Nudge Chakra's own `black`/`gray.900` palette entries to match
        // `canvas`/`surface` above. The app's existing pages apply colors
        // ad hoc (`bg="gray.900"`, and the html/body bg driven by Chakra's
        // `bg` semantic token which defaults to `{colors.black}` in dark
        // mode) rather than through semantic tokens, so overriding these
        // two raw palette entries is what makes the new palette apply
        // globally without editing every page/component in this unit.
        // Later units can migrate call sites to `bg.canvas`/`bg.surface`
        // below.
        black: { value: '#0a0a0c' },
        gray: {
          900: { value: '#1a1b21' },
        },
      },
      fonts: {
        // Condensed display font — brand wordmark only (App.jsx).
        heading: { value: `'Bebas Neue', sans-serif` },
        // Default sans for all body/UI text.
        body: {
          value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
        },
      },
      shadows: {
        // Elevation for dark-on-dark cards: a plain drop shadow is nearly
        // invisible against a near-black canvas, so "lift" reads mainly
        // through a faint inset top highlight (simulates light catching the
        // card's top edge) plus a soft, fairly tight ambient shadow for
        // gentle depth. Use via `shadow="card"` on card-level Box/Flex.
        card: {
          value: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 8px 24px -12px rgba(0,0,0,0.65)',
        },
      },
    },
    semanticTokens: {
      colors: {
        // Named aliases for later units to reference explicitly instead of
        // raw `gray.900`/`black` (the actual global effect right now comes
        // from the raw palette overrides above).
        bg: {
          canvas: { value: '{colors.canvas}' },
          surface: { value: '{colors.surface}' },
          raised: { value: '{colors.surfaceRaised}' },
        },
        // Text hierarchy — Chakra's own `fg`/`fg.muted` already resolve to
        // near-white / mid-gray in dark mode; these are named aliases for
        // clarity in later units.
        text: {
          primary: { value: '{colors.fg}' },
          secondary: { value: '{colors.fg.muted}' },
        },
        border: {
          subtle: { value: '{colors.whiteAlpha.200}' },
          muted: { value: '{colors.whiteAlpha.100}' },
        },
        accent: {
          green: { value: '{colors.green.400}' },
        },
        // Standings zone colors (tokenized from StandingsTable.jsx's
        // existing inline ZONE_COLORS — not yet wired up there).
        zone: {
          ucl: { value: '{colors.blue.400}' },
          uel: { value: '{colors.orange.400}' },
          uecl: { value: '{colors.green.400}' },
          relegation: { value: '{colors.red.500}' },
        },
        // Generic status colors for later use (player ratings, live badges).
        status: {
          positive: { value: '{colors.green.400}' },
          warning: { value: '{colors.orange.400}' },
          negative: { value: '{colors.red.500}' },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
