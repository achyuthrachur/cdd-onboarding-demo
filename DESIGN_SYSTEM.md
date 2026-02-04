# Design System Reference

> **Purpose:** Style guide for implementing UI updates and new features.
> **Usage:** Reference this file when building new components or updating existing styles.
> **Important:** Apply these patterns incrementally to new/modified code—do not refactor existing working code unless explicitly requested.

---

## Core Principles

1. **Intentional choices** - Every design decision has a reason
2. **Neutral foundation** - Greys and blacks as canvas, muted accents for emphasis
3. **Purposeful motion** - Animations serve UX, not decoration
4. **Avoid AI aesthetics** - No Inter font, no purple gradients, no excessive rounding

---

## Typography

### Font Stacks

```css
/* Headlines & Display */
--font-display: 'Playfair Display', 'Fraunces', 'Libre Baskerville', Georgia, serif;

/* Body & UI */
--font-body: 'Bricolage Grotesque', 'DM Sans', 'Source Sans Pro', system-ui, sans-serif;

/* Code */
--font-mono: 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Consolas', monospace;
```

### Type Scale

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

### Usage Guidelines

- **Headlines:** Use `--font-display` for h1, h2, hero text
- **Body:** Use `--font-body` for paragraphs, UI labels, buttons
- **Code:** Use `--font-mono` for code blocks, technical content
- **Never** use Inter as the primary font
- **Limit** to 2-3 font families per project

---

## Color System

### Neutral Foundation (Warm Greys)

```css
--grey-50: #fafaf9;
--grey-100: #f5f5f4;
--grey-200: #e7e5e4;
--grey-300: #d6d3d1;
--grey-400: #a8a29e;
--grey-500: #78716c;
--grey-600: #57534e;
--grey-700: #44403c;
--grey-800: #292524;
--grey-900: #1c1917;
--grey-950: #0c0a09;
```

### Semantic Tokens

```css
:root {
  /* Text */
  --color-text-primary: var(--grey-900);
  --color-text-secondary: var(--grey-600);
  --color-text-muted: var(--grey-400);
  
  /* Surfaces */
  --color-surface-primary: var(--grey-50);
  --color-surface-secondary: var(--grey-100);
  --color-surface-elevated: #ffffff;
  
  /* Borders */
  --color-border: var(--grey-200);
  --color-border-strong: var(--grey-300);
}
```

### Muted Accent Colors

```css
/* Primary accent - Slate blue */
--color-accent-blue: #64748b;
--color-accent-blue-light: #94a3b8;
--color-accent-blue-dark: #475569;

/* Secondary accent - Warm taupe */
--color-accent-warm: #a8927c;
--color-accent-warm-light: #c4b5a5;
--color-accent-warm-dark: #8c7a66;

/* Functional colors */
--color-success: #6b8f71;           /* Sage green */
--color-success-light: #a3c4a9;
--color-warning: #c9a962;           /* Muted gold */
--color-warning-light: #e5d4a1;
--color-error: #b07070;             /* Dusty rose */
--color-error-light: #d4a5a5;
```

### Dark Mode

```css
[data-theme="dark"] {
  --color-text-primary: #e7e5e4;
  --color-text-secondary: #a8a29e;
  --color-text-muted: #78716c;
  
  --color-surface-primary: #121212;
  --color-surface-secondary: #1e1e1e;
  --color-surface-elevated: #2a2a2a;
  
  --color-accent-blue: #94a3b8;
  --color-accent-blue-light: #cbd5e1;
  --color-accent-blue-dark: #64748b;
  
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.12);
}
```

### Color Rules

1. **60-30-10:** 60% neutral greys, 30% secondary neutral, 10% accent
2. **Desaturate:** If a color looks "AI-generated," reduce saturation 20-30%
3. **Warm blacks:** Use `#1c1917` or `#121212`, never `#000000`
4. **Contrast:** All text must meet WCAG 2.1 AA (4.5:1 minimum)

---

## Spacing

### Scale (8px grid)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius

```css
--radius-sm: 4px;      /* Buttons, inputs */
--radius-md: 8px;      /* Cards, containers */
--radius-lg: 12px;     /* Modals, large cards */
--radius-xl: 16px;     /* Feature sections */
--radius-full: 9999px; /* Pills, avatars only */
```

**Avoid:** Excessive rounding (`rounded-3xl` everywhere)

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 
             0 2px 4px -1px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 
             0 4px 6px -2px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 
             0 10px 10px -5px rgba(0, 0, 0, 0.03);

/* Hover elevation */
--shadow-hover: 0 12px 24px rgba(0, 0, 0, 0.12);
```

---

## Backgrounds & Textures

### Subtle Grid

```css
.bg-grid {
  background:
    linear-gradient(to bottom, var(--grey-50) 0%, var(--grey-100) 100%),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1px,
      rgba(0, 0, 0, 0.015) 1px,
      rgba(0, 0, 0, 0.015) 2px
    );
}
```

### Paper Texture

```css
.bg-paper {
  background: 
    linear-gradient(to bottom, var(--grey-50), var(--grey-100)),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}
```

### Glassmorphism

```css
.bg-glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .bg-glass {
  background: rgba(30, 30, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Dot Pattern

```css
.bg-dots {
  background-image: radial-gradient(
    circle,
    var(--grey-300) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}
```

### Subtle Gradient (hero sections)

```css
.bg-gradient-subtle {
  background: linear-gradient(
    135deg,
    var(--grey-50) 0%,
    var(--grey-100) 50%,
    rgba(100, 116, 139, 0.05) 100%
  );
}
```

---

## Animation

### Timing Tokens

```css
--duration-instant: 75ms;    /* Micro-feedback */
--duration-fast: 150ms;      /* Hover states */
--duration-normal: 250ms;    /* Standard transitions */
--duration-slow: 350ms;      /* Complex state changes */
--duration-slower: 500ms;    /* Page transitions */
```

### Easing Curves

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Common Patterns

**Hover lift:**
```css
.card {
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
```

**Fade in up (page load):**
```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s var(--ease-out) backwards;
}
```

**Staggered children:**
```css
.stagger-children > * {
  animation: fade-in-up 0.5s var(--ease-out) backwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
/* ... */
```

### Anime.js (Vanilla/React)

```javascript
import { animate, stagger } from 'animejs';

// Staggered entrance
animate('.card', {
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 600,
  delay: stagger(80),
  ease: 'outQuint'
});

// Hover micro-interaction
element.addEventListener('mouseenter', () => {
  animate(element, { scale: 1.02, duration: 200, ease: 'outQuad' });
});
element.addEventListener('mouseleave', () => {
  animate(element, { scale: 1, duration: 200, ease: 'outQuad' });
});
```

### Framer Motion (React)

```jsx
import { motion } from 'framer-motion';

// Basic fade in
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>

// Staggered list
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i} variants={item}>{i}</motion.li>
  ))}
</motion.ul>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Animation Rules

✅ **Do:**
- Animate to provide feedback
- Use staggered animations for lists (50-100ms delay)
- Respect `prefers-reduced-motion`
- Keep UI animations under 500ms

❌ **Don't:**
- Animate for decoration
- Use long durations for interactive elements
- Block user interaction during animations
- Animate multiple properties simultaneously (sequence instead)

---

## Component Patterns

### Buttons

```css
.btn {
  font-family: var(--font-body);
  font-weight: 500;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-primary {
  background: var(--color-accent-blue);
  color: white;
}
.btn-primary:hover {
  background: var(--color-accent-blue-dark);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-primary);
}
.btn-secondary:hover {
  background: var(--color-surface-secondary);
}
```

### Cards

```css
.card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Inputs

```css
.input {
  font-family: var(--font-body);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-elevated);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent-blue);
  box-shadow: 0 0 0 3px var(--color-accent-blue-light);
}
```

---

## Quick Reference: Tailwind Mappings

If using Tailwind, map CSS variables in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        grey: {
          50: '#fafaf9',
          100: '#f5f5f4',
          // ... etc
        },
        accent: {
          DEFAULT: '#64748b',
          light: '#94a3b8',
          dark: '#475569',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Bricolage Grotesque', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      }
    }
  }
}
```

---

## Checklist: New Components

When building a new component, verify:

- [ ] Uses semantic color tokens, not hardcoded hex
- [ ] Typography follows font stack hierarchy
- [ ] Spacing uses scale values (multiples of 4px/8px)
- [ ] Border radius is appropriate (not excessive)
- [ ] Hover/focus states have transitions
- [ ] Respects reduced motion preference
- [ ] Works in dark mode (if applicable)
- [ ] Meets contrast requirements (4.5:1 for text)
