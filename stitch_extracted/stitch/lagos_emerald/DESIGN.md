# Design System Specification: High-End Editorial Delivery

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Culinary Curator."** 

In the fast-paced urban landscapes of Lagos and Abuja, luxury is defined by speed, precision, and exclusivity. This system moves away from the "cluttered marketplace" aesthetic of standard delivery apps, opting instead for a high-end editorial feel. We achieve this through **Intentional Asymmetry**—where high-quality food photography breaks out of standard containers—and **Tonal Depth**, using layers of charcoal and emerald to create a sense of infinite space. The goal is to make every meal feel like a curated event, not just a transaction.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, nocturnal foundation that allows the vibrant emerald and fiery accent to command attention.

### Primary & Accent Palette
- **Primary (`#76d6d5` / `#008080`):** The "Emerald Signature." Use the `primary` token for brand moments and `primary_container` for deep, sophisticated backgrounds that ground the UI.
- **Tertiary/Accent (`#ffb5a0` / `#d53800`):** The "Heat Element." Reserved exclusively for high-velocity actions: *Order*, *Pay*, and *Track*. It must be used sparingly (10% rule) to maintain its urgency.

### Surface Hierarchy & Nesting
To achieve a premium feel, we abandon flat design in favor of **Physical Layering**. 
- **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined by shifts in background tokens. 
- **Layering Logic:** 
    - Base Level: `surface` (#131313)
    - Section Level: `surface_container_low` (#1c1b1b)
    - Interaction Level (Cards): `surface_container_high` (#2a2a2a)
- **The "Glass & Gradient" Rule:** Use `surface_tint` at 8% opacity with a `backdrop-blur` of 20px for floating navigation bars. This creates a "frosted emerald" effect that feels expensive and lightweight.

---

## 3. Typography
The typography strategy pairs the geometric authority of **Plus Jakarta Sans** for headers with the high-legibility of **Inter** for utility.

- **Display (Display-LG/MD):** Used for "Daily Specials" or "Chef’s Choice." These should be set with tight letter-spacing (-0.02em) to feel like a high-fashion magazine.
- **Headlines (Headline-LG/MD):** Bold and unapologetic. Use these to anchor card layouts.
- **Body (Body-LG/MD):** Inter provides the clarity needed for ingredient lists and delivery instructions. 
- **Label (Label-MD/SM):** Set in uppercase with slightly increased tracking (+0.05em) for metadata like "Est. Time" or "Delivery Fee."

---

## 4. Elevation & Depth
In this system, elevation is a product of light and shadow, not lines.

- **The Layering Principle:** Place a `surface_container_highest` element over a `surface_container_low` background to create a "lift" effect. 
- **Ambient Shadows:** For floating "Checkout" buttons, use a shadow with a blur radius of `32px`, offset `Y: 12px`, with the color `#000000` at `12%` opacity. This mimics natural light rather than digital "glow."
- **The "Ghost Border" Fallback:** If a container sits on a background of similar value, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Use for floating action buttons (FABs). Combine `surface_bright` at 40% opacity with a heavy blur to ensure content remains readable while maintaining a "glass" aesthetic.

---

## 5. Components

### Cards & Lists
- **The Editorial Card:** Forbid the use of divider lines. Separate items using `spacing-6` (2rem) or a subtle background shift to `surface_container_low`.
- **Imagery:** Photos should have a corner radius of `xl` (1.5rem). Use a subtle inner vignette to ensure "on_surface" text remains legible when overlaid.

### Buttons
- **Primary (Emerald):** Large `xl` radius. Use a subtle gradient transition from `primary_container` to `primary` to add "soul."
- **High-Action (Orange-Red):** Reserved for "Place Order." These must stand out. No gradients; solid, vibrating color to drive conversion.
- **Tertiary:** No background. Use `primary` text with a `label-md` style for "View Menu" or "Cancel."

### Input Fields
- **State Logic:** Default state uses `surface_container_highest`. Focus state transitions to a `primary` "Ghost Border" (20% opacity). 
- **Floating Labels:** Use `label-sm` in `on_surface_variant` to keep the UI feeling "fast" and minimal.

### Specialized Components
- **The "Status Pulsar":** A small, emerald-glowing dot used next to "Live Tracking" to indicate real-time updates without cluttering the screen with text.
- **Selection Chips:** Use `secondary_container` for unselected and `primary` with `on_primary` for selected. Avoid heavy borders; use color fills.

---

## 6. Do’s and Don’ts

### Do:
- **Use Generous White Space:** Use `spacing-8` (2.75rem) between major sections to let the high-end imagery breathe.
- **Layer Surfaces:** Always ask, "Can I define this area with a background shift instead of a line?"
- **Contextual Accents:** Use the Orange-Red accent only when money is changing hands or a critical error has occurred.

### Don’t:
- **Never use 100% Black:** Pure `#000000` kills the depth. Stick to the `surface` tokens.
- **No Sharp Corners:** Avoid `none` or `sm` rounding. This system is premium and "soft"; stick to `md`, `lg`, and `xl`.
- **Avoid Default Shadows:** Never use high-opacity, small-blur shadows. They look "cheap" and dated.
- **No Dividers:** If you feel the urge to use a `<hr>` line, use `spacing-4` instead. Space is your divider.