import { modulesConfig } from '../../config/modules.config.js';
import { isMcpModule, type HealthCheck, type McpModule } from '../core/types.js';

export type HealthPayload = {
	status: 'ok' | 'degraded';
	checks: HealthCheck[];
};

async function loadModule(name: string): Promise<McpModule | undefined> {
	try {
		const imported = await import(`../modules/${name}/index.js`);
		if (!isMcpModule(imported)) return undefined;
		return imported;
	} catch {
		return undefined;
	}
}

export async function buildHealthPayload(): Promise<HealthPayload> {
	const checks: HealthCheck[] = [];

	for (const moduleConfig of modulesConfig) {
		if (!moduleConfig.enabled) continue;

		const module = await loadModule(moduleConfig.name);
		if (!module?.checkHealth) continue;

		try {
			const moduleChecks = await module.checkHealth(moduleConfig.config);
			checks.push(...moduleChecks);
		} catch (err) {
			checks.push({
				id: `${moduleConfig.name}_health`,
				ok: false,
				detail: err instanceof Error ? err.message : 'Unknown error',
			});
		}
	}

	const status = checks.every(check => check.ok) ? 'ok' : 'degraded';
	return { status, checks };
}
