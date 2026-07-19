---
name: Vinous Elegance
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#554242'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#877272'
  outline-variant: '#dac0c0'
  surface-tint: '#994348'
  primary: '#390009'
  on-primary: '#ffffff'
  primary-container: '#58111a'
  on-primary-container: '#db767b'
  inverse-primary: '#ffb3b4'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#2c003f'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c0069'
  on-tertiary-container: '#c274e1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b4'
  on-primary-fixed: '#40000b'
  on-primary-fixed-variant: '#7b2c32'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#f8d8ff'
  tertiary-fixed-dim: '#ecb2ff'
  on-tertiary-fixed: '#320047'
  on-tertiary-fixed-variant: '#6c228c'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  technical-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  pdf-margin: 15mm
  gutter: 24px
  container-max: 1200px
---

## Brand & Style
The design system is rooted in the heritage of fine viticulture, blending **Classical Editorial** aesthetics with **Modern Professional** utility. It evokes the tactile quality of a premium sommelier’s menu—sophisticated, authoritative, and meticulously organized. 

The visual language prioritizes "Quiet Luxury," using expansive whitespace (Off-White) to let high-quality product photography and typography breathe. The style utilizes subtle golden accents and deep bordeaux tones to signal prestige, while maintaining a rigorous grid for functional clarity during PDF generation and digital cataloging.

**Keywords:** Sommelier-grade, Heritage, Precision, Timeless.

## Colors
This design system employs a high-contrast, editorial palette designed for both digital depth and print fidelity.

- **Primary (Bordeaux):** Used for primary branding, heavy headers, and interactive states to establish a connection with red wine heritage.
- **Secondary (Ancient Gold):** Reserved for excellence markers, dividers, quality seals, and active focus states.
- **Accent (Deep Grape):** A modern counterpoint used sparingly for technical highlights, digital-only alerts, or secondary data visualization.
- **Neutral (Graphite Black):** The foundation for structural borders, primary body text, and iconography to ensure maximum legibility.
- **Background (Off-White):** A warm, paper-like foundation that reduces eye strain and ensures a premium "menu" feel in PDF exports.

## Typography
The typographic hierarchy creates a tension between the expressive, high-contrast Serifs of the headlines and the clinical, functional Sans-Serifs of the data.

- **Headlines (Playfair Display):** Should be used for wine names, estate titles, and major section headers. Its high stroke contrast embodies elegance.
- **Body & Technical (Inter):** Chosen for its exceptional legibility at small sizes, crucial for technical wine specs (vintage, ABV, region) and PDF export clarity.
- **Label Caps:** Used for metadata categories (e.g., "REGION", "VARIETAL") to create a structured scanning experience.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Digital interfaces use a 12-column grid with generous gutters to maintain an editorial feel. 

**PDF Considerations:** 
The design system mandates a strict 15mm outer margin for all exportable documents. Spacing inside cards and lists must remain consistent between digital and print views to ensure visual branding integrity.

**Breakpoints:**
- **Mobile (<600px):** Single column, condensed vertical spacing (unit-4).
- **Tablet (600px - 1024px):** 2-column product grids, 15mm safe areas.
- **Desktop (>1024px):** Multi-column layouts with a max-width of 1200px to prevent excessive line lengths in descriptions.

## Elevation & Depth
Depth is signaled through **Tonal Layering** and **Ambient Shadows** rather than aggressive bevels.

- **Level 1 (Product Cards):** Low-opacity, diffused shadows (Color: Graphite Black @ 5% opacity, 12px blur) to make wine bottles feel slightly elevated from the "paper" background.
- **Level 2 (Modals/Overlays):** Medium-strength shadows with a subtle Bordeaux tint in the shadow color to maintain brand warmth.
- **Dividers:** Instead of shadows, use 1px "Ancient Gold" or light graphite lines to separate content sections, echoing traditional print layouts.

## Shapes
The shape language is **Conservative and Structured**. 

- **Primary Radius:** 0.25rem (Soft) for cards and input fields. This provides a hint of modernity without sacrificing the formal, traditional aesthetic.
- **Pill Shapes:** Used exclusively for interactive "Chips" (filters) to differentiate them from static content containers.
- **Buttons:** Sharp or very slightly rounded (Soft) to maintain a "Buttoned-up" professional appearance.

## Components

### Buttons
- **Primary:** Solid Bordeaux background with Off-White text. Rectangular with minimal rounding.
- **Secondary:** Outlined in Gold with Gold text for "Premium" actions (e.g., "Upgrade" or "Export PDF").
- **Ghost:** Graphite text, no border, used for utility actions in the admin panel.

### Product Cards
- Vertical orientation to accommodate the silhouette of wine bottles.
- Background: Pure White (#FFFFFF) to pop against the Off-White page background.
- Include a 1px Gold bottom border on the header section of the card.

### Chips (Pill Filters)
- Used for region, grape type, and price range. 
- Style: Pill-shaped, light graphite border, transitioning to solid Bordeaux when active.

### PDF Headers & Footers
- Must feature the "Ancient Gold" separator (1pt weight).
- Left-aligned serif typography for the catalog name; right-aligned sans-serif for page numbers.

### Admin Controls
- **Sliders:** Gold track with a Graphite handle for sensory characteristics (e.g., Tannins, Acidity).
- **Inputs:** Graphite Black outlines (low opacity) that turn Bordeaux on focus.
