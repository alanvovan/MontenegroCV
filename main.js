import { createShader } from 'shaders/js';

// Shader presets are exported from Shaders Pro (MCP), vanilla JS format.
// Pro is only needed to export; the runtime package `shaders` is MIT.
// Placeholder for a Pro key, if ever required: VITE_SHADERS_PRO_KEY (see .env.example). Not used at runtime.

const MAX_ACTIVE = 3;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const weak =
  (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
  (navigator.connection && navigator.connection.saveData);
const canShade = 'gpu' in navigator && !reduced && !weak;

const presets = {
  // Hero: Neutral Folds 2, slowed down so the name stays readable.
  hero: {
    components: [
      { type: 'Satin', id: 'hero-satin', props: { anisotropy: 0.11, bloom: 0.21, breeze: 0.45, color: '#d9d9d9', fiberAngle: 243, foldCount: 5, foldDepth: 0.48, foldDirection: 83, foldWidth: 0.3, gloss: 0.19, highlightColor: '#ffffff', lightAngle: 255, pinning: 0, sheen: 0.36, speed: 0.55, weave: 0.28 } },
      { type: 'ZoomBlur', id: 'hero-zoom', props: { dispersion: 1, focus: 0.6, intensity: 42 } },
    ],
    options: { toneMapping: 'neutral' },
  },
  // Contacts: Light Leaks 4.
  contact: {
    components: [
      { type: 'Swirl', id: 'leak-swirl', props: { blend: 40, colorA: '#0a1628', colorB: '#8b5e3c', colorSpace: 'oklch', detail: 1.8, speed: 0.4 } },
      { type: 'Blob', id: 'leak-blob-a', props: { center: { x: 0.45, y: 0.28 }, colorA: '#f2b544', colorB: '#e06820', colorSpace: 'oklch', deformation: 1.5, highlightColor: '#ffffff', highlightIntensity: 0.6, opacity: 0.75, size: 0.6, softness: 3, speed: 0.6 } },
      { type: 'Blob', id: 'leak-blob-b', props: { center: { x: 0.75, y: 0.29 }, colorA: '#ff9040', colorB: '#c44020', colorSpace: 'oklch', deformation: 1.8, highlightColor: '#ffffff', highlightIntensity: 0.7, opacity: 0.65, softness: 3.5, speed: 0.55, visible: true } },
      { type: 'ChromaticAberration', id: 'leak-ca', props: { angle: 30, blueOffset: 1.5, redOffset: -1.5, strength: 0.55 } },
      { type: 'FilmGrain', id: 'leak-grain', props: { strength: 0.08 } },
    ],
    options: {},
  },
  // Project cards on hover: Bokeh Ripples, recoloured to ink and slate, follows the cursor.
  card: {
    components: [
      { type: 'SolidColor', id: 'card-bg', props: { color: '#17110d' } },
      { type: 'Ripples', id: 'card-rip', props: { colorA: '#9fb3d1', frequency: 53.3, thickness: 0.01 } },
      { type: 'Vignette', id: 'card-vig', props: { falloff: 0.87, radius: 0.1 } },
      { type: 'BokehBlur', id: 'card-bokeh', props: { chromaticFringe: 0, highlightGain: 10, highlightThreshold: 0.21, radius: 24 } },
      { type: 'CursorRipples', id: 'card-cursor' },
    ],
    options: { toneMapping: 'aces' },
  },
};

let active = 0;
const instances = new Map();
const visibleNow = new Set();

async function mount(el, name) {
  if (instances.has(el) || active >= MAX_ACTIVE) return;
  const canvas = el.querySelector('canvas');
  active += 1;
  instances.set(el, null);
  try {
    const p = presets[name];
    const inst = await createShader(canvas, { components: structuredClone(p.components) }, p.options);
    instances.set(el, inst);
    if (!visibleNow.has(el)) inst.pause();
  } catch (e) {
    instances.delete(el);
    active -= 1;
    console.warn('Shader disabled, static fallback stays:', e);
  }
}

if (canShade) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const el = en.target;
      if (en.isIntersecting) {
        visibleNow.add(el);
        const inst = instances.get(el);
        if (inst) inst.resume();
        else if (!instances.has(el)) mount(el, el.dataset.shader);
      } else {
        visibleNow.delete(el);
        const inst = instances.get(el);
        if (inst) inst.pause();
      }
    }
  }, { rootMargin: '80px', threshold: 0.02 });
  document.querySelectorAll('[data-shader]').forEach((el) => io.observe(el));

  document.addEventListener('visibilitychange', () => {
    for (const [el, inst] of instances) {
      if (!inst) continue;
      if (document.hidden) inst.pause();
      else if (visibleNow.has(el)) inst.resume();
    }
  });

  // Hover shader on project cards: one live at a time, created on enter, destroyed on leave.
  if (finePointer) {
    document.querySelectorAll('[data-card]').forEach((card) => {
      const slot = card.querySelector('.slot');
      let token = 0;
      let inst = null;
      let canvas = null;
      const stop = () => {
        token += 1;
        if (canvas) canvas.classList.remove('is-on');
        slot.classList.remove('is-live');
        const c = canvas, i = inst;
        canvas = null; inst = null;
        if (i) { i.destroy(); active -= 1; }
        if (c) setTimeout(() => c.remove(), 420);
      };
      card.addEventListener('pointerenter', async () => {
        if (active >= MAX_ACTIVE || slot.querySelector('img')) return;
        const my = ++token;
        active += 1;
        canvas = document.createElement('canvas');
        canvas.className = 'shader-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        slot.prepend(canvas);
        const mine = canvas;
        try {
          const p = presets.card;
          const made = await createShader(mine, { components: structuredClone(p.components) }, p.options);
          if (my !== token) { made.destroy(); return; }
          inst = made;
          mine.classList.add('is-on');
          slot.classList.add('is-live');
        } catch (e) {
          active -= 1;
          mine.remove();
          canvas = null;
        }
      });
      card.addEventListener('pointerleave', () => {
        const wasPending = canvas && !inst;
        if (wasPending) { token += 1; active -= 1; canvas.remove(); canvas = null; return; }
        stop();
      });
    });
  }
}
