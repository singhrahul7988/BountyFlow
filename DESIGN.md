# Design System Strategy: Technical Brutalism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Sovereign Auditor."** 

This system rejects the "friendly" softness of consumer SaaS in favor of a high-fidelity, high-stakes aesthetic that blends the elite underground of hacker culture with the cold, immutable precision of institutional fintech. We are moving away from standard rounded cards and generic layouts. Instead, we embrace **Extreme Angularity** and **Tonal Depth**. 

The visual identity is driven by:
*   **Intentional Asymmetry:** Breaking the 12-column grid with offset headers and "leaking" data visualizations that bleed to the edge of the viewport.
*   **On-Chain Credibility:** Using monospace systems and scanline textures to evoke a terminal-like environment where every pixel feels audited and intentional.
*   **Atmospheric Layering:** Using light-absorbent dark surfaces contrasted against "Electric Teal" pulses to guide the user's eye through complex data.

---

## 2. Colors & Surface Architecture
We do not use color to "decorate." We use color to define **State** and **Hierarchy**.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for structural sectioning. To separate a navigation rail from a main dashboard, or a sidebar from a feed, use a background shift from `surface` (#131318) to `surface-container-low` (#1b1b20). Boundaries are felt through tonal contrast, not drawn with lines.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of carbon-fiber plates. 
*   **Base:** `background` (#131318) for the overall canvas.
*   **Sections:** `surface-container-low` (#1b1b20) for large structural areas.
*   **Interactive Components:** `surface-container-high` (#2a292f) for cards or hovered states.
*   **Active Modals:** `surface-container-highest` (#35343a) to bring the element to the immediate foreground.

### The "Glass & Gradient" Rule
For primary CTAs and critical "On-Chain" status indicators, use a subtle linear gradient: `primary` (#6effc0) to `primary-container` (#00e5a0) at a 135° angle. For floating overlays (e.g., Command Palettes), use `surface-variant` (#35343a) at 70% opacity with a `24px` backdrop-blur to create a "tactical glass" effect.

---

## 3. Typography
The type system is a dialogue between human expression (`Syne`) and machine precision (`DM Mono` / `Space Mono`).

*   **Display & Headlines (Syne):** Used sparingly for high-impact editorial moments. Its unique letterforms convey "BountyFlow’s" premium nature. Use `display-lg` for hero statements with a `-0.04em` letter-spacing to create a tight, architectural feel.
*   **Body & UI (DM Mono / Inter):** `DM Mono` is the workhorse. It ensures that bug reports and terminal outputs remain legible and feel "technical." Use `body-md` for standard descriptions.
*   **Data & Numbers (Space Mono):** All financial values, bounty rewards, and timestamps must use `Space Mono`. The tabular figures ensure that numbers align perfectly in lists, reinforcing fintech precision.

---

## 4. Elevation & Depth
In this system, "Up" is "Brighter," not "Shadowier."

*   **The Layering Principle:** Avoid drop shadows for standard UI cards. Instead, place a `surface-container-high` card on a `surface-dim` background. This creates a "soft lift."
*   **Ambient Glow:** For high-priority elements (like a "Critical Bug" alert), use a diffused glow instead of a shadow. Apply a `12px` blur using `primary` (#6effc0) at 10% opacity.
*   **The "Ghost Border" Fallback:** If a divider is required for accessibility in high-density data tables, use the `outline-variant` token (#3b4a41) at 15% opacity. It should be barely visible—a "suggestion" of a boundary.
*   **Hero Texture:** The hero section must feature a `5%` opacity grain/noise overlay and a `10%` opacity scanline pattern (2px height, 4px gap) to simulate a high-end surveillance terminal.

---

## 5. Components

### Buttons
*   **Primary:** Sharp 0px corners. Background: `primary` (#6effc0), Text: `on-primary` (#003824). On hover, add a `primary-fixed` (#47ffb8) outer glow.
*   **Secondary:** `outline` (#84958a) Ghost Border (20% opacity). Text: `primary`.
*   **Tertiary:** No background. `DM Mono` uppercase with a `0.1rem` letter spacing.

### Inputs & Terminal Fields
*   **States:** Default state uses `surface-container-lowest`. Focus state triggers a `1px` "Ghost Border" using `primary-container` and a subtle scanline flicker effect.
*   **Feedback:** Error states use `error` (#ffb4ab) text with a `surface-container-high` background—never a bright red box, which breaks the dark aesthetic.

### Data Cards
*   **Rule:** Forbid the use of divider lines.
*   **Structure:** Use `spacing-8` (1.75rem) of vertical white space to separate content blocks. Use `surface-container-highest` for the header "strip" of a card to give it an armored, modular look.

### On-Chain Status Chips
*   **Execution:** Small, rectangular `label-sm` tags. Use `secondary-container` (#1c32be) for "Pending" and `primary-container` (#00e5a0) for "Validated." Text should always be uppercase.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use 0px border-radius for everything. The system is brutal and precise.
*   **Do** use "DM Mono" for all user-generated content to maintain the hacker-culture feel.
*   **Do** use `spacing-24` (5.5rem) for section breathing room to allow the dark surfaces to feel expansive and premium.

### Don't:
*   **Don't** use standard "Grey" for backgrounds. Use the blue-tinted `surface-dim` (#131318) to maintain depth.
*   **Don't** use icons with rounded terminals. Use sharp, geometric iconography that matches the "BountyFlow" shield slash.
*   **Don't** use transitions longer than 150ms. Interactions should feel "instant" and "mechanical," like a high-performance terminal.