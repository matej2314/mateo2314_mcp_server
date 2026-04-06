import { createMcpServer } from './core/server.js';
import { ToolRegistry } from './core/toolRegistry.js';
import { startStdioTransport } from './transports/stdio.js';
async function main() {
    console.log = console.error;
    console.error('Starting MCP server...');
    const server = createMcpServer();
    const registry = new ToolRegistry(server);
    await registry.loadModules();
    const loadedModules = registry.getLoadedModules();
    console.error(`[Server] Loaded ${loadedModules.length} modules: ${loadedModules.join(', ')}`);
    await startStdioTransport(server);
    console.error('[Server] Connected via stdio');
}
main().catch((error) => {
    console.error('[Server] Fatal error:', error);
    process.exit(1);
});
