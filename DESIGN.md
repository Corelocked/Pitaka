# Design System Strategy: The Financial Atelier



## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Digital Private Bank."**



We are moving away from the loud, "disruptor" aesthetic of early fintech and pivoting toward a high-end, editorial experience that evokes the quiet confidence of a heritage institution. The system rejects the generic "app-template" look by utilizing intentional asymmetry, expansive negative space, and a sophisticated tonal depth.



Rather than relying on borders and boxes, the layout feels organic and curated. We prioritize a high-contrast typography scale and layered, monochromatic surfaces to create an interface that feels like an invitation to a premium financial lifestyle, prioritizing trust, security, and meticulous attention to detail.



---



## 2. Colors: Sophisticated Tonalism

Our palette transforms the original brand colors into an "Emerald and Gold" story, supported by a warm, off-white foundation.



### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For example, a card utilizing `surface_container_lowest` should sit on a background of `surface_container_low`. The eye should perceive depth through value changes, not structural lines.



### Surface Hierarchy & Nesting

Treat the UI as a physical stack of fine paper or frosted glass.

* **Base:** `surface` (#fbf9f8)

* **Level 1 (Subtle Inset):** `surface_container_low` (#f5f3f2)

* **Level 2 (Active Cards):** `surface_container_lowest` (#ffffff)

* **Level 3 (High Prominence):** `surface_bright` (#fbf9f8)



### The "Glass & Gradient" Rule

To elevate beyond flat design, use Glassmorphism for floating overlays (e.g., navigation bars or modals). Use a 20% opacity of `surface` with a 20px-40px backdrop blur.

* **Signature Textures:** Main CTAs should use a subtle linear gradient from `primary` (#023616) to `primary_container` (#1e4d2b) at a 135-degree angle. This adds a "silk" sheen that feels expensive and intentional.



---



## 3. Typography: Editorial Authority

The type system uses a dual-font approach to balance character with utility.



* **Display & Headline (Manrope):** A geometric sans-serif with a high x-height. These are used for big numbers and section headers to convey modernity and strength.

* *Usage:* `display-lg` for account balances; `headline-sm` for section titles.

* **Title & Body (Inter):** A hyper-legible sans-serif for functional data. Inter provides the "utility" required for financial trust.

* *Usage:* `title-md` for form labels; `body-md` for transaction details.



**The Identity Logic:** The extreme scale difference between a `display-lg` balance and a `label-sm` timestamp creates a "magazine" feel, making the data feel important and the UI feel spacious.



---



## 4. Elevation & Depth: Tonal Layering

We do not use shadows to represent "elevation" in the traditional sense; we use them to represent "ambience."



* **The Layering Principle:** Depth is achieved by stacking surface-containers. An element is "closer" to the user when it is whiter (`surface_container_lowest`) and "further" when it blends into the background (`surface_dim`).

* **Ambient Shadows:** For floating elements (like a Bottom Sheet), use a shadow with a blur of `32px` at `6%` opacity. The shadow color must be a tinted version of `on_surface` (#1b1c1c), never a pure, flat black.

* **The "Ghost Border" Fallback:** If a container requires more definition for accessibility, use a "Ghost Border": 1px stroke using `outline_variant` at **15% opacity**.



---



## 5. Components: Refined Interaction



### Buttons

* **Primary:** Gradient fill (`primary` to `primary_container`), `xl` (0.75rem) roundedness. No border. Text is `on_primary`.

* **Secondary:** `surface_container_highest` background with `primary` text.

* **Tertiary:** No background. Bold `primary` text with a 2px underline offset by 4px of whitespace.



### Input Fields

* **Default State:** Background `surface_container_low`. No border.

* **Focus State:** Subtle `primary` ghost border (20% opacity) and a soft ambient glow.

* **Labeling:** Labels use `label-md` in `on_surface_variant`, positioned with a `1.5` (0.375rem) spacing above the input.



### Cards & Lists

* **The Divider Forbid:** Never use horizontal lines to separate list items. Use `spacing-4` (1rem) of vertical whitespace or alternating subtle background shifts (`surface` to `surface_container_low`).

* **Roundedness:** All cards must use `xl` (0.75rem) corner radius to soften the financial data and make the app feel approachable.



### Specialized Fintech Components

* **The Value Indicator:** A pill-shaped chip for percentage changes. Positive: `primary_fixed` background with `on_primary_fixed_variant` text.

* **Amount Display:** Use `display-sm` for primary figures, ensuring the currency symbol is a weight lighter than the digits to keep the focus on the value.



---



## 6. Do's and Don'ts



### Do

* **DO** use extreme whitespace. If you think there is enough padding, add `spacing-4` more.

* **DO** use "Soft Gold" (`secondary`) only for meaningful accents—like an "Elite" status badge or a primary "Save" icon.

* **DO** utilize `surface_container_lowest` for the most important interactive element on the screen to make it "pop" naturally.



### Don't

* **DON'T** use 100% opaque borders. They create "visual noise" that contradicts the high-end editorial goal.

* **DON'T** use the original bright green (#5CB85C). Always use the modernized `primary` (#023616) for a more mature, emerald-toned aesthetic.

* **DON'T** crowd the screen. If a view feels busy, move secondary information into a "Details" sheet using the Glassmorphism blur.