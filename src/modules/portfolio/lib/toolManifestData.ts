import manifest from '../content/manifest.json';

export const toolManifestData = (sectionName: string) => {
    const sec = manifest.sections.find((s) => s.name === sectionName) as
    | { tags?: string[]; categories?: string[]; platforms?: string[] }
    | undefined;
return {
    tags: sec?.tags ?? [],
    categories: sec?.categories ?? [],
    platforms: sec?.platforms ?? [],
};
}