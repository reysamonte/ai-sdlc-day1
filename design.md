# Snip Design Language

Dark, minimal, "chat-input-as-centerpiece" style inspired by the look and feel of
modern AI product landing pages (no borrowed logos, names, or copy — tokens only).

## Color tokens

| Token              | Value                                    | Use                              |
| ------------------- | ----------------------------------------- | --------------------------------- |
| `--bg`              | `#0a0a0b`                                 | Page background (near-black)     |
| `--surface`         | `#151517`                                 | Card / input surface              |
| `--surface-raised`  | `#1c1c1f`                                 | Hover / elevated surface          |
| `--border`          | `rgba(255, 255, 255, 0.08)`               | Subtle card & input borders       |
| `--border-strong`   | `rgba(255, 255, 255, 0.16)`               | Focus / emphasized borders        |
| `--text`            | `#f5f5f5`                                 | Primary text                      |
| `--muted`           | `#9a9a9f`                                 | Subline, helper, secondary text   |
| `--accent-coral`    | `#ff6b6b`                                 | Gradient stop 1                   |
| `--accent-pink`     | `#f472b6`                                 | Gradient stop 2                   |
| `--accent-orange`   | `#fb923c`                                 | Gradient stop 3                   |
| `--success`         | `#4ade80` / bg `rgba(74, 222, 128, 0.1)`  | Success notice                    |
| `--error`           | `#f87171` / bg `rgba(248, 113, 113, 0.1)` | Error notice                      |

## Accent gradient (hero glow)

```
--glow-gradient: radial-gradient(
  ellipse 80% 60% at 50% 0%,
  rgba(255, 107, 107, 0.35),
  rgba(244, 114, 182, 0.25) 35%,
  rgba(251, 146, 60, 0.15) 55%,
  transparent 75%
);
```

Applied to a **fixed, full-viewport-width** band pinned to the top of the page
(`position: fixed; top: 0; left: 0; right: 0; height: ~520px; pointer-events: none;
z-index: 0`) — never inside the max-width content column, so it washes the entire
hero on wide screens instead of just the centered strip.

## Type

- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto,
  Helvetica, Arial, sans-serif`
- Scale:
  - Headline (h1): `clamp(2.25rem, 5vw, 3.25rem)`, weight 700, tight line-height (1.1)
  - Subline: `1.125rem`, weight 400, `--muted`
  - Body / table: `0.9375rem`
  - Small / meta (hits, code): `0.8125rem`

## Spacing & radii

- Base spacing unit: `8px` (`--space-1` = 8px … `--space-6` = 48px)
- Page vertical rhythm: generous, `--space-6`+ between hero and content
- Radii:
  - Chat-style input / pill controls: `--radius-full` = `999px`
  - Cards / table container: `--radius-lg` = `20px`
  - Small elements (badges, buttons inside input): `--radius-md` = `12px`

## Borders, shadows, glow

- Cards/inputs: `1px solid var(--border)` at rest, `var(--border-strong)` on
  focus/hover
- Card shadow: `0 1px 2px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.35)`
- Input focus glow: soft coral ring, `0 0 0 4px rgba(255,107,107,0.15)`

## Mapping Snip elements onto the system

| Snip element                     | Design role                                                                 |
| ---------------------------------| ---------------------------------------------------------------------------- |
| Page header ("Snip" + subtitle)   | Hero: centered bold headline + muted subline, sits inside the glow band     |
| URL form (input + Shorten button) | Chat-style input: large pill-rounded surface, button attached to its right edge, focus ring uses the accent |
| Success notice (short link)       | Inline pill/card below the input, success color, monospace-ish link text   |
| Error notice (form/list errors)   | Inline pill/card below the input, error color                              |
| Links table                       | Card: rounded-lg surface, subtle border, no harsh row lines, generous cell padding |

This file is the single source of truth for Snip's visual language — paste it into
any future styling prompt instead of re-describing the look.
