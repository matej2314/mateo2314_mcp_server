import manifest from '../content/manifest.json' with { type: 'json' };

export const validSections =  new Set(manifest.sections.map((s) => s.name));