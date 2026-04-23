import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { modulesConfig } from '../../config/modules.config.js';
import { isMcpModule, type McpModule } from './types.js';

export class ToolRegistry {
	private server: McpServer;
	private loadedModules: Map<string, McpModule> = new Map();

	constructor(server: McpServer) {
		this.server = server;
	}

	async loadModules() {
		for (const moduleConfig of modulesConfig) {
			if (!moduleConfig.enabled) {
				console.error(`[ToolRegistry] Skipping disabled module: ${moduleConfig.name}`);
				continue;
			}

			try {
				const imported = await import(`../modules/${moduleConfig.name}/index.js`);

				if (!isMcpModule(imported)) {
					console.error(
						`[ToolRegistry] Moduł ${moduleConfig.name} is not a valid MCP module.`
					);
					continue;
				}

				await imported.register(this.server, {
					namespace: moduleConfig.namespace,
					config: moduleConfig.config,
				});

				this.loadedModules.set(moduleConfig.name, imported);
				console.error(`[ToolRegistry] Loaded module: ${moduleConfig.name} (namespace: ${moduleConfig.namespace})`);
			} catch (error) {
				console.error(`[ToolRegistry] Error loading module ${moduleConfig.name}:`, error);
			}
		}
	}

	getLoadedModules(): string[] {
		return Array.from(this.loadedModules.keys());
	}
}
