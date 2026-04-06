import { registerAboutTools } from './tools/about.js';
import { registerCoursesTools } from './tools/courses.js';
import { registerExperienceTools } from './tools/experience.js';
import { registerManifestTools } from './tools/manifest.js';
import { registerProfileTools } from './tools/profile.js';
import { registerProjectsTools } from './tools/projects.js';
import { registerSearchTools } from './tools/search.js';
import { registerSkillsTools } from './tools/skills.js';
export async function register(server, options = {}) {
    const namespace = options.namespace || 'portfolio';
    const toolOptions = { namespace };
    registerProfileTools(server, toolOptions);
    registerAboutTools(server, toolOptions);
    registerManifestTools(server, toolOptions);
    registerSearchTools(server, toolOptions);
    registerProjectsTools(server, toolOptions);
    registerSkillsTools(server, toolOptions);
    registerExperienceTools(server, toolOptions);
    registerCoursesTools(server, toolOptions);
    console.error(`[portfolio] Registered tools with namespace: ${namespace}`);
}
