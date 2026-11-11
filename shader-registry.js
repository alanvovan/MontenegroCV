// Stands in for the shaders package registry so the bundle only carries the components the presets in main.js use.
// Add a component here when a preset starts using it, or createShader will report it as unknown.
import { componentDefinition as Satin } from 'shaders/core/Satin';
import { componentDefinition as ZoomBlur } from 'shaders/core/ZoomBlur';
import { componentDefinition as Swirl } from 'shaders/core/Swirl';
import { componentDefinition as Blob } from 'shaders/core/Blob';
import { componentDefinition as ChromaticAberration } from 'shaders/core/ChromaticAberration';
import { componentDefinition as FilmGrain } from 'shaders/core/FilmGrain';
import { componentDefinition as SolidColor } from 'shaders/core/SolidColor';
import { componentDefinition as Ripples } from 'shaders/core/Ripples';
import { componentDefinition as Vignette } from 'shaders/core/Vignette';
import { componentDefinition as BokehBlur } from 'shaders/core/BokehBlur';
import { componentDefinition as CursorRipples } from 'shaders/core/CursorRipples';

const definitions = [Satin, ZoomBlur, Swirl, Blob, ChromaticAberration, FilmGrain, SolidColor, Ripples, Vignette, BokehBlur, CursorRipples];

const shaderRegistry = Object.fromEntries(definitions.map((def) => [def.name, {
  name: def.name,
  fileName: def.name,
  category: def.category || 'Uncategorized',
  definition: def,
  propsMetadata: {},
}]));

const getAllShaders = () => Object.values(shaderRegistry);
const getShaderByName = (name) => shaderRegistry[name];
const getShadersByCategory = (category) => getAllShaders().filter((s) => s.category === category);
const getShaderCategories = () => [...new Set(getAllShaders().map((s) => s.category))].sort();

export {
  shaderRegistry, getAllShaders, getShaderByName, getShadersByCategory, getShaderCategories,
  // Minified names the package's own chunks import this module by.
  shaderRegistry as a, getShadersByCategory as i, getShaderByName as n, getShaderCategories as r, getAllShaders as t,
};
