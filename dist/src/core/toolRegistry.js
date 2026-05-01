import { isMcpModule } from './types.js';
export class ToolRegistry {
    mcpServer;
    loadedModules = new Map();
    constructor(server) {
        this.mcpServer = server;
    }
    async loadSingleModule(moduleConfig) {
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
    getLoadedModules() {
        return Array.from(this.loadedModules.keys());
    }
}
