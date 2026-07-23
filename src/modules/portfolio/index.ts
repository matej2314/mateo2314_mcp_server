import path from 'path';
import fs from 'fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ModuleOptions } from '../../core/types.js';
import { setPortfolioContentRoot } from './lib/paths.js';
import { registerAboutTools } from './tools/about.js';
import { registerCoursesTools } from './tools/courses.js';
import { registerExperienceTools } from './tools/experience.js';
import { registerManifestTools } from './tools/manifest.js';
import { registerProfileTools } from './tools/profile.js';
import { registerProjectsTools } from './tools/projects.js';
import { registerSearchTools } from './tools/search.js';
import { registerSkillsTools } from './tools/skills.js';
import type { PortfolioModuleConfig } from '../../../config/modules.config.js';
import type { HealthCheck, ModuleHealthChecker } from '../../core/types.js';

export async function register(server: McpServer, options: ModuleOptions = {}) {
	const namespace = options.namespace || 'portfolio';
	const moduleId = options.moduleId ?? 'portfolio';

	const cfg = options.config as PortfolioModuleConfig | undefined;
	const rawRoot = cfg?.contentRoot;
	if (typeof rawRoot !== 'string' || !rawRoot.trim()) {
		throw new Error('[portfolio] No config.contentRoot. Check portfolio entry in modules.config.ts and that ToolRegistry passes options.config.');
	}
	setPortfolioContentRoot(path.resolve(rawRoot));

	const toolOptions = { namespace, moduleId };

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

export const checkHealth: ModuleHealthChecker = async (config: unknown) => {
	const cfg = config as PortfolioModuleConfig | undefined;
	const root = cfg?.contentRoot;
	if (typeof root !== 'string' || !root.trim()) {
		return [{ id: 'portfolio_content_root', ok: false, detail: 'missing contentRoot in module config' }];
	}

	try {
		await fs.access(root);
		return [{ id: 'portfolio_content_root', ok: true }];
	} catch {
		return [{ id: 'portfolio_content_root', ok: false, detail: 'contentRoot is not readable' }];
	}
};
