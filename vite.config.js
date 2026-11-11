import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

const slimRegistry = fileURLToPath(new URL('./shader-registry.js', import.meta.url));

// The shaders package registers all ~250 components through one registry module; createShader pulls it in,
// so every component lands in the bundle. Point that module at our short list instead.
function slimShaderRegistry() {
  return {
    name: 'slim-shader-registry',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !importer.includes('/node_modules/shaders/dist/')) return null;
      if (/\/shaderRegistry-[\w-]+\.js$/.test(source) || /\/core\/registry\.js$/.test(source)) return slimRegistry;
      return null;
    },
  };
}

// WebGPU only exists in secure contexts, so a phone on the LAN needs HTTPS to see the shaders.
export default defineConfig({
  plugins: [slimShaderRegistry(), basicSsl()],
  optimizeDeps: {
    rolldownOptions: { plugins: [slimShaderRegistry()] },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
