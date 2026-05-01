import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type ModuleConfig } from '../../config/modules.config';
import { isMcpModule, type McpModule } from './types';

export class ToolRegistry {
	private mcpServer: McpServer;
	private loadedModules: Map<string, McpModule> = new Map();

	constructor(server: McpServer) {
		this.mcpServer = server;
	}

	async loadSingleModule(moduleConfig: ModuleConfig): Promise<void> {
		const imported = await import(`../modules/${moduleConfig.name}/index.js`);

		if (!isMcpModule(imported)) {
			throw new Error(`[ToolRegistry] Module ${moduleConfig.name} is not a valid MCP module.`);
		}

		await imported.register(this.mcpServer, {
			namespace: moduleConfig.namespace,
			config: moduleConfig.config,
		});

		this.loadedModules.set(moduleConfig.name, imported);
		console.error(`[ToolRegistry] Loaded module: ${moduleConfig.name} (namespace: ${moduleConfig.namespace})`);
	}

	getLoadedModules(): string[] {
		return Array.from(this.loadedModules.keys());
	}
}
