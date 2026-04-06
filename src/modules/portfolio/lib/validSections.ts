import manifest from '../content/manifest.json';

export const validSections =  new Set(manifest.sections.map((s) => s.name));