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
  // Hero: the cursor trail. At rest, a near-black gradient. The trail reveals the warm field.
  hero: {
    components: [
      { type: 'DotGrid', id: 'trailDots', props: { density: 40, dotSize: { type: 'map', source: 'trailFlow', channel: 'alpha', inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 }, twinkle: 0.9, visible: false } },
      { type: 'ChromaFlow', id: 'trailFlow', props: { intensity: 1.4, radius: 2.9, visible: false } },
      { type: 'LinearGradient', id: 'hero-ground', props: { colorA: '#3a2a22', colorB: '#241812', colorSpace: 'oklch', start: { x: 0, y: 1 }, end: { x: 1, y: 0 } } },
      { type: 'LinearGradient', id: 'hero-reveal', props: { colorA: '#e66047', colorB: '#e66047', colorSpace: 'oklch', start: { x: 0, y: 1 }, end: { x: 1, y: 0 }, maskSource: 'trailDots' } },
      { type: 'CursorRipples', id: 'hero-ripples', props: {} },
      { type: 'FilmGrain', id: 'hero-grain', props: { strength: 0.1 } },
    ],
    options: { toneMapping: 'aces' },
  },
  // Contact: the warm field that used to fill the hero, Run palette, always on.
  contact: {
    components: [
      {
        type: 'Group',
        id: 'contact-field',
        children: [
          {
            type: 'MultiPointGradient',
            id: 'contact-gradient',
            props: {
              colorA: '#e66047',
              colorB: '#2b0912',
              colorC: '#2e0d04',
              colorD: '#4a3a38',
              colorE: '#2b1512',
              positionA: { x: 0, y: 0 },
              positionB: { x: 0.71, y: 0.06 },
              positionC: { x: 0.26, y: 0.73 },
              positionD: { x: 1, y: 1 },
            },
          },
          { type: 'WaveDistortion', id: 'contact-wave', props: { angle: 21, speed: 2, strength: 0.4, visible: true } },
        ],
      },
      { type: 'FilmGrain', id: 'contact-grain', props: { strength: 0.1, visible: true } },
    ],
    options: { toneMapping: 'aces' },
  },
  // Project cards on hover: Afternoon Sunlight 3, recoloured to the warm paper palette, with the contact block's grain.
  card: {
    components: [
      { type: 'Blob', id: 'card-mask', props: { center: { x: 0.53, y: 0.97 }, colorA: '#000000', colorB: '#000000', size: 0.9, softness: 1.5, speed: 0.8, visible: false } },
      { type: 'SolidColor', id: 'card-bg', props: { color: '#e6ddd1' } },
      { type: 'WorleyNoise', id: 'card-light', props: { colorA: '#b9a998', colorB: '#fcf7ef', contrast: 0.55, lacunarity: 2.3, maskSource: 'card-mask', mode: 'f2MinusF1', octaves: 2, persistence: 1, scale: 2.5, seed: 33, speed: 2.2 } },
      { type: 'LinearBlur', id: 'card-blur', props: { angle: 211, intensity: 500 } },
      { type: 'ChromaticAberration', id: 'card-ca', props: { strength: 0.15 } },
      { type: 'FilmGrain', id: 'card-grain', props: { strength: 0.05 } },
    ],
    options: {},
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
