# Signal School design plan

## Direction

**Painted storm relay board.** Signal School is laid out like a compact coastal relay table: physical flags, cable paths, weather marks, and a clear harbor target. This makes routing choices legible as shared objects rather than abstract dashboard controls. It is deliberately not a classroom worksheet or a generic game lobby.

## Visual system

- Background: deep teal `#073b3a`, with raised teal `#104d4b` and deep board `#052d2c`.
- Signal and status colors: pale gold `#f4d985`, coral `#ef7863`, seafoam `#91d8bf`, muted violet `#8e7bb7`.
- Text: warm near-white `#fff8e4`; secondary text `#c9d7c7`. These combinations were checked in the browser with axe and retain at least 4.5:1 body-text contrast on the teal surfaces.
- Type: locally bundled Chivo 600/800 for terse route headings and IBM Plex Mono 400 for board labels, timers, and instructions. No remote font request is made.
- Layout: 8px rhythm, wide board paired with a concise decision panel on desktop; board above decisions on phones. Buttons carry text labels as well as their numeric shortcut.
- Shapes: route lines are dashed cables; relay nodes are filled painted circles; flags and weather marks are hand-authored SVG/CSS elements. Shadows are hard offset marks, like a board placed on a table.

## Interaction and motion

The storm clock advances through a fixed 60 Hz simulation while a practice run is active. Route choices change the next round immediately. The board uses no flashing or continuous decorative animation. System reduced-motion and the in-game Motion setting remove transitions. Pause stops the clock, and run progress saves to local storage.

## Assets and provenance

The board, flags, weather marks, favicon, apple icon, and social card are original hand-authored SVG/CSS assets made for this product on 2026-09-06. The 1200×630 PNG social card is rendered from the hand-authored SVG board. No generated imagery, stock art, brand material, third-party scripts, or remote fonts are used.

## Content and difficulty

The free practice has eight finished topologies, starting with Tide Lines (queues), Fog Junction (redundancy), and Headland Loop (feedback). Each uses three finite decisions and requires all six signals for a win. The built-in one-time Scenario Set has twelve more topology cards with four rotating role views, for twenty finished cards in total. The first round establishes a simple two-route choice; later rounds add a weather change or return signal. This keeps the challenge about comparing partial information, not timing accuracy.

## Accessibility checks

Controls have visible gold focus rings, 44px targets, semantic headings, live status, keyboard choices 1–3, touch-sized controls, and a skip link. The screen-reader map has a concise text description. The only scene art is decorative CSS/SVG; no required information is embedded in an image.
