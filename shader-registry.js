// Stands in for the shaders package registry so the bundle only carries the components the presets in main.js use.
// Add a component here when a preset starts using it, or createShader will report it as unknown.
import { componentDefinition as Group } from 'shaders/core/Group';
import { componentDefinition as MultiPointGradient } from 'shaders/core/MultiPointGradient';
import { componentDefinition as WaveDistortion } from 'shaders/core/WaveDistortion';
import { componentDefinition as DotGrid } from 'shaders/core/DotGrid';
import { componentDefinition as ChromaFlow } from 'shaders/core/ChromaFlow';
import { componentDefinition as LinearGradient } from 'shaders/core/LinearGradient';
import { componentDefinition as CursorRipples } from 'shaders/core/CursorRipples';
import { componentDefinition as Blob } from 'shaders/core/Blob';
import { componentDefinition as ChromaticAberration } from 'shaders/core/ChromaticAberration';
import { componentDefinition as FilmGrain } from 'shaders/core/FilmGrain';
import { componentDefinition as SolidColor } from 'shaders/core/SolidColor';
import { componentDefinition as WorleyNoise } from 'shaders/core/WorleyNoise';
import { componentDefinition as LinearBlur } from 'shaders/core/LinearBlur';

const definitions = [Group, MultiPointGradient, WaveDistortion, DotGrid, ChromaFlow, LinearGradient, CursorRipples, Blob, ChromaticAberration, FilmGrain, SolidColor, WorleyNoise, LinearBlur];

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
