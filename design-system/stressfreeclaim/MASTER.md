# StressFreeClaim Design System

**Product:** Homeowner insurance claim intake and concierge coordination  
**Direction:** Calm, trustworthy, warm, plain-spoken  
**Design dials:** Variance 4/10 · Motion 2/10 · Density 4/10

This file is the authority for future UI work. Page-specific files under
`pages/` may refine these rules but must preserve the same visual language.

## Experience principles

- Meet a stressed homeowner with one clear question and one primary action.
- Use progressive disclosure: ask only for information that is missing.
- Favor readable paper-like surfaces and restrained depth over dashboard chrome.
- Make every persisted value visible and editable before submission.
- Keep status, validation, and next steps explicit; never rely on color alone.
- Optimize first for a phone being used outdoors after a storm.

## Foundations

### Color

| Role | Value | CSS token |
|---|---:|---|
| Page / warm paper | `#FBF4EF` | `--color-surface` |
| Raised surface | `#FFFFFF` | `--color-surface-raised` |
| Quiet surface | `#FDF7F2` | `--color-surface-2` |
| Body ink | `#2E2320` | `--color-ink` |
| Display oxblood | `#5E2A28` | `--color-ink-display` |
| Secondary text | `#7C6B62` | `--color-muted` |
| Border | `#EFE1D6` | `--color-border` |
| Strong border | `#DFC9BB` | `--color-border-strong` |
| Coral accent | `#E0714C` | `--color-accent` |
| Primary CTA | `#B84E2E` | `--color-accent-btn` |
| Primary CTA hover | `#A5441F` | `--color-accent-btn-hover` |
| Soft accent | `#FBE7DC` | `--color-accent-soft` |

Coral is an accent. Filled buttons use the darker terracotta so white text
meets WCAG AA.

### Type

- Display: Fraunces, medium weight, oxblood.
- UI and body: Inter, regular through semibold.
- Body copy uses a 1.5–1.7 line height and a 65–75 character maximum measure.
- Mobile fields remain at least 16px to avoid browser zoom.

### Shape and depth

- Cards: 22px radius, subtle warm border, quiet shadow.
- Controls: 14px radius and at least 48px tall.
- Primary buttons: pill shape; one per screen.
- Use a consistent three-level elevation scale; no glassmorphism.

## Interaction rules

- Provide a visible or programmatic label for every control.
- Keep touch targets at least 44px; primary controls target 48px.
- Place validation beside the field and announce it with `role="alert"`.
- Show multi-step progress during gap filling.
- Use 150–300ms transitions for hover and focus only; never shift layout.
- Respect `prefers-reduced-motion`.
- Preserve visible keyboard focus and logical tab order.
- Avoid sticky or fixed chrome unless the content reserves space for it.

## Responsive rules

- Design mobile-first at 375px, then verify 768px, 1024px, and 1440px.
- Never introduce horizontal scrolling.
- Stack summary labels and values on narrow screens.
- Keep the form and reading column near 700px on desktop. Supporting
  sections on the landing page (process steps, FAQ) may break out to a wider
  band of up to ~1040px, each with its own inner measure limit so body copy
  stays within 65–75 characters. Intake, gap, review, and done screens never
  widen.
- Let secondary header status wrap instead of crowding the wordmark.

## Avoid

- Generic blue/green insurance styling.
- Decorative animation, icon-heavy chrome, or dashboard navigation.
- Placeholder-only labels.
- Color-only state communication.
- Multiple competing calls to action.
- Real customer data in prototype mode.

## Delivery checklist

- [ ] One obvious primary action per screen.
- [ ] 4.5:1 text contrast and visible focus states.
- [ ] Labels, error announcements, and semantic input types.
- [ ] 44–48px touch targets with adequate spacing.
- [ ] Reduced-motion support.
- [ ] No mobile overflow at the four target widths.
- [ ] No content obscured by fixed or sticky elements.
- [ ] Loading controls prevent duplicate submission.
