# 2026 Modernization Implementation Guide

## ✅ Completed Foundational Updates

### 1. Utility Hooks Created
- `src/hooks/useScrollReveal.ts` - Intersection Observer for scroll-triggered animations
- `src/hooks/useCountUp.ts` - Animated counter with easing

### 2. Animation Components
- `src/components/ui/animated-section.tsx` - Reusable scroll-reveal wrapper

### 3. Global CSS Enhancements (`src/styles.css`)
- ✅ `.btn-interactive` - Scale + lift on hover, spring-back on click
- ✅ `.card-interactive` - Lift with shadow deepening
- ✅ `.glass` - Glassmorphism with backdrop blur
- ✅ `.gradient-mesh` - Radial gradient overlays
- ✅ `.noise-texture` - Subtle SVG noise
- ✅ `.animate-pulse-scale` - Breathing animation for WhatsApp
- ✅ `.input-focus` - Smooth focus states
- ✅ Stagger delay utilities (`.stagger-1` through `.stagger-4`)
- ✅ `@media (prefers-reduced-motion: reduce)` - Accessibility support

### 4. Component Updates
- ✅ **Navbar** - Glassmorphism on scroll, animated underlines
- ✅ **WhatsApp Button** - Pulse animation, larger hit area

---

## 🚀 Next Steps: Apply to Pages

To complete the modernization, apply these patterns to each page:

### Homepage Hero (Asymmetric Layout)

```tsx
{/* Replace centered hero with asymmetric grid */}
<div className="container-page relative grid gap-12 py-24 sm:py-32 lg:grid-cols-[1.2fr_1fr] lg:items-center">
  <div>
    <p className="animate-fade-up stagger-1 text-xs font-bold uppercase tracking-[0.3em] text-accent">
      RC {site.rcNumber} · Jimeta-Yola, Adamawa
    </p>
    <h1 className="animate-fade-up stagger-2 mt-4 text-4xl font-extrabold leading-tight text-primary-foreground sm:text-6xl">
      Your trusted partner in{" "}
      <span className="text-accent">travel</span> and{" "}
      <span className="text-accent">trade</span>
    </h1>
    <p className="animate-fade-up stagger-3 mt-5 text-lg leading-relaxed text-primary-foreground/80">
      {/* Existing copy */}
    </p>
    <div className="animate-fade-up stagger-4 mt-8 flex flex-col gap-3 sm:flex-row">
      <Link to="/travel" className="btn-interactive ...">...</Link>
      <Link to="/trade" className="btn-interactive ...">...</Link>
    </div>
  </div>
  
  {/* Image side with layering */}
  <div className="relative hidden lg:block">
    <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
    <img
      src={heroImg}
      alt="..."
      className="animate-fade-in stagger-3 relative z-10 rounded-3xl shadow-elevated"
    />
  </div>
</div>
```

### Bento Grid Stats (Mixed Sizes)

Replace uniform grid with asymmetric layout:

```tsx
{/* Stats - Bento Grid */}
<section className="bg-primary py-16">
  <div className="container-page grid grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-2">
    {/* Large feature card */}
    <AnimatedSection
      animation="scale"
      className="col-span-2 row-span-2 rounded-3xl border border-primary-foreground/10 bg-primary-deep p-8 lg:col-span-2"
    >
      <StatCounter value={stats[0].value} label={stats[0].label} featured />
    </AnimatedSection>
    
    {/* Small cards */}
    {stats.slice(1).map((stat, i) => (
      <AnimatedSection
        key={stat.label}
        animation="scale"
        delay={i * 100}
        className="rounded-2xl border border-primary-foreground/10 bg-primary-deep p-6"
      >
        <StatCounter value={stat.value} label={stat.label} />
      </AnimatedSection>
    ))}
  </div>
</section>
```

### StatCounter Component with Count-Up

```tsx
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";

function StatCounter({ value, label, featured = false }: { value: string; label: string; featured?: boolean }) {
  const { ref, isVisible } = useScrollReveal();
  const numericValue = parseInt(value.replace(/\D/g, ""));
  const count = useCountUp({ end: numericValue, duration: 2000 }, isVisible);
  const suffix = value.replace(/[0-9]/g, "");

  return (
    <div ref={ref} className={`text-center ${featured ? "lg:text-left" : ""}`}>
      <p className={`font-display font-extrabold text-accent ${featured ? "text-6xl" : "text-4xl"}`}>
        {count}{suffix}
      </p>
      <p className={`mt-2 font-semibold uppercase tracking-wider text-primary-foreground/70 ${featured ? "text-base" : "text-xs"}`}>
        {label}
      </p>
    </div>
  );
}
```

### Card Cascading Animation

Wrap service cards with staggered delays:

```tsx
<div className="mt-10 grid gap-6 lg:grid-cols-3">
  {testimonials.map((t, i) => (
    <AnimatedSection
      key={i}
      animation={i % 2 === 0 ? "slide-left" : "slide-right"}
      delay={i * 100}
    >
      <figure className="card-interactive flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
        {/* Card content */}
      </figure>
    </AnimatedSection>
  ))}
</div>
```

### Modernized Buttons

Replace all CTAs:

```tsx
{/* Old */}
<Link className="rounded-md bg-accent px-6 py-3.5 ...">

{/* New */}
<Link className="btn-interactive rounded-full bg-accent px-6 py-3.5 ...">
```

### Modernized Cards

Add to all service/feature cards:

```tsx
{/* Old */}
<div className="rounded-xl border border-border bg-card p-6 shadow-card">

{/* New */}
<div className="card-interactive rounded-2xl border border-border bg-card p-6 shadow-card">
```

### Form Input Focus States

Update all form inputs:

```tsx
{/* Old */}
<input className="rounded-md border border-input ...">

{/* New */}
<input className="input-focus rounded-xl border border-input ...">
```

### Section Dividers (Curved SVG)

Add between major sections:

```tsx
<div className="relative">
  <svg
    className="absolute bottom-0 left-0 w-full"
    viewBox="0 0 1440 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <path
      d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
      fill="var(--color-secondary)"
      fillOpacity="0.3"
    />
  </svg>
</div>
```

### Gradient Mesh Backgrounds

Add to hero and key sections:

```tsx
<section className="gradient-mesh noise-texture relative isolate overflow-hidden bg-primary-deep">
  {/* Content */}
</section>
```

---

## 📋 Page-by-Page Checklist

### Homepage
- [ ] Asymmetric hero with animated entrance (stagger-1 through stagger-4)
- [ ] Bento grid stats with count-up animation
- [ ] Division panels with card-interactive
- [ ] Journey stepper with AnimatedSection wrapper
- [ ] Trust points in bento grid layout
- [ ] Testimonials with alternating slide animations
- [ ] FAQ accordion with AnimatedSection
- [ ] All buttons use btn-interactive + rounded-full
- [ ] Gradient mesh on hero
- [ ] Curved dividers between sections

### Travel Page
- [ ] Hero with AnimatedSection fade-up
- [ ] Service cards cascade with stagger delays
- [ ] Visa checker with card-interactive
- [ ] Document checklist with AnimatedSection
- [ ] Service details with AnimatedSection per section
- [ ] Form inputs with input-focus class
- [ ] Buttons modernized

### Trade Page
- [ ] Hero with AnimatedSection
- [ ] Service cards with card-interactive
- [ ] Dynamic form tabs with hover effects
- [ ] Service details animated
- [ ] Form modernized

### About Page
- [ ] Timeline with scroll-reveal per milestone
- [ ] Values cards with stagger
- [ ] Team cards with hover effects
- [ ] All sections wrapped in AnimatedSection

### Contact Page
- [ ] Contact cards with card-interactive
- [ ] Form with input-focus
- [ ] Map with AnimatedSection reveal
- [ ] "What happens next" with fade-up

---

## 🎨 Design Token Updates

Consider these additional modern touches:

### Increased Border Radius
```css
--radius: 1rem; /* was 0.5rem */
```

### Softer Shadows
```css
--shadow-card: 0 1px 3px oklch(0.22 0.06 260 / 0.05), 0 12px 32px oklch(0.22 0.06 260 / 0.08);
--shadow-elevated: 0 16px 48px oklch(0.22 0.06 260 / 0.15);
```

---

## ⚡ Performance Notes

All animations use:
- ✅ GPU-accelerated properties only (`transform`, `opacity`)
- ✅ `will-change` avoided (only when absolutely needed)
- ✅ Intersection Observer for visibility detection
- ✅ `requestAnimationFrame` for count-up
- ✅ Reduced motion support via media query

---

## 🧪 Testing Checklist

- [ ] Test with reduced motion setting enabled
- [ ] Verify animations don't cause layout shift
- [ ] Check mobile performance (smooth 60fps)
- [ ] Test WhatsApp button pulse doesn't interfere with clicks
- [ ] Verify glassmorphism works in Safari (webkit-backdrop-filter)
- [ ] Test keyboard navigation with new button styles
- [ ] Verify all animations complete before user can interact

---

## 🚀 Quick Implementation Priority

1. **High Impact, Low Effort:**
   - Apply `.btn-interactive` to all buttons (find/replace)
   - Apply `.card-interactive` to all cards
   - Change `rounded-md/xl` to `rounded-full/2xl`
   - Wrap section headers in `<AnimatedSection>`

2. **Medium Impact, Medium Effort:**
   - Bento grid stats with count-up
   - Hero entrance animations (stagger classes)
   - Form input-focus states

3. **High Impact, High Effort:**
   - Asymmetric hero layout restructure
   - Curved SVG dividers
   - Gradient meshes

Start with priority 1 for immediate visual impact, then work through 2 and 3.
