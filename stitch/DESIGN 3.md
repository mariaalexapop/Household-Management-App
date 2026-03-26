# Design System Strategy: The Harmonious Home

## 1. Overview & Creative North Star
The modern family dashboard is often a chaotic mess of checklists and calendars. This design system rejects the "utilitarian grid" in favor of our Creative North Star: **The Digital Curator.** 

Instead of a rigid software interface, we are building a bespoke editorial experience that feels like a premium, well-organized home magazine. We move beyond "standard" UI by employing **Intentional Asymmetry** and **Tonal Depth**. By breaking the expected 12-column symmetry with overlapping cards and varying module heights, we create a visual rhythm that feels organic and "warm" rather than robotic. The goal is to transform "management" into "mindfulness."

## 2. Colors: Tonal Atmosphere
Our palette is grounded in the primary blue (`#0053dc`) for trust, but its implementation must be sophisticated. 

### The "No-Line" Rule
To achieve a high-end, seamless aesthetic, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts. 
- Use `surface-container-low` (#f1f4f6) for global sections.
- Place `surface-container-lowest` (#ffffff) cards on top to create a natural, "floating" boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of fine stationery.
- **Level 0 (Background):** `surface` (#f7f9fb). The canvas.
- **Level 1 (Sections):** `surface-container` (#eaeef1). Defines broad functional areas.
- **Level 2 (Cards):** `surface-container-lowest` (#ffffff). The primary content container.
- **Level 3 (Pop-overs):** `surface-bright` (#f7f9fb) with a high-blur shadow.

### The "Glass & Gradient" Rule
Standard flat colors feel "out-of-the-box." To elevate the experience:
- **Glassmorphism:** Use semi-transparent `surface-container-highest` with a `backdrop-blur` for navigation bars and floating action buttons.
- **Signature Textures:** For high-priority CTAs or module headers (like the 'Car' or 'Insurance' modules), use a subtle linear gradient from the module's accent color (e.g., `secondary` #742fe5) to its container variant (e.g., `secondary-container` #eaddff). This adds a "soul" to the module that flat hex codes lack.

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance warmth with professional reliability.

- **The Display/Headline Layer (Plus Jakarta Sans):** Chosen for its modern, geometric clarity. Use `display-lg` and `headline-md` for high-impact family greetings or status summaries. The generous x-height feels welcoming.
- **The Functional Layer (Public Sans):** Used for `body-md` and `label-sm`. This is our workhorse typeface—highly legible and neutral, ensuring that even complex insurance details or chore lists feel organized.

**Hierarchy Note:** Always pair a `headline-sm` in a heavier weight with a `body-md` in a lighter weight to create the "Editorial Gap"—the high-contrast difference in scale that makes a layout look professionally designed.

## 4. Elevation & Depth
In this system, depth is a feeling, not a feature.

- **Tonal Layering:** Avoid shadows where possible. Instead, stack `surface-container-low` on `surface`. This "tone-on-tone" approach is the hallmark of premium modern design.
- **Ambient Shadows:** When a card must float (e.g., a dragged chore item), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(45, 51, 55, 0.06);`. Note the 6% opacity—it should feel like a soft glow of light, not a dark smudge.
- **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` (#acb3b7) at **15% opacity**. Never use 100% opacity lines; they "trap" the content and make the UI feel claustrophobic.

## 5. Components: Modular Sophistication

### Cards & Lists
*   **The Rule of Flow:** Forbid the use of divider lines. Separate list items using `spacing-4` (1rem) of vertical white space or by alternating background tints between `surface-container-lowest` and `surface-container-low`.
*   **Modular Radius:** All cards must use `rounded-lg` (1rem) for a friendly, approachable feel.

### Buttons
*   **Primary:** Uses `primary` (#0053dc). Apply a subtle `shadow-sm` and `rounded-full` (9999px) for a "pill" shape that stands out against the angular modular cards.
*   **Secondary/Module-Specific:** When inside a "Kids" or "Car" module, the button should adopt that module's specific accent color (e.g., `tertiary` #006b62 for Kids) to maintain contextual scent.

### Input Fields
*   **Interaction:** On focus, transition the background from `surface-container-highest` to `surface-container-lowest` and apply a 2px `primary` ghost-border. This "glow-in" effect makes the family feel the system is reacting to their touch.

### Family-Specific Components
*   **Progress Orbs:** Use soft, thick-stroke circular progress indicators for chores, utilizing `primary-container` as the track and the module accent (e.g., Orange for Car) as the fill.
*   **The "Pulse" Badge:** A soft, glowing dot (using `error_container`) to signify urgent notifications (e.g., "Insurance Expiring") without causing panic.

## 6. Do's and Don'ts

### Do:
*   **Do use asymmetric margins.** If a card is 4 units from the left, try making it 6 units from the right to create a "custom-built" feel.
*   **Do use whitespace as a separator.** If you feel the need to draw a line, add 16px of space instead.
*   **Do lean into the color tokens.** Use `on-primary-container` for text sitting on light blue backgrounds to ensure a sophisticated tonal match rather than plain black.

### Don't:
*   **Don't use pure black (#000000).** Always use `on-surface` (#2d3337) for text to keep the "warm" brand personality.
*   **Don't "box-in" the content.** Avoid heavy containers. Let the white space and soft background shifts define the modules.
*   **Don't use default "rounded-sm" corners.** Small radii feel "standard" and "cheap." Stick to the `lg` (1rem) and `xl` (1.5rem) tokens for a premium, custom-molded feel.