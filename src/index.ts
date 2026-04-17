import 'dotenv/config';

import { createMcpServer } from './core/server.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolRegistry } from './core/toolRegistry.js';
// import { startStdioTransport } from './transports/stdio.js';
import { startHttpTransport } from './transports/http.js';

async function createServerWithModules(): Promise<{
	server: McpServer;
	loadedModules: string[];
}> {
	const server = createMcpServer();
	const registry = new ToolRegistry(server);
	await registry.loadModules();
	return { server, loadedModules: registry.getLoadedModules() };
}

/** Nowa instancja + moduły — jedna para na sesję MCP (Streamable HTTP). */
async function buildMcpServer(): Promise<McpServer> {
	const { server } = await createServerWithModules();

	return server;
}

async function main() {
	console.log = console.error;
	console.error('Starting MCP server...');

	const { server: probe, loadedModules } = await createServerWithModules();
	console.error(`[Server] Loaded ${loadedModules.length} modules: ${loadedModules.join(', ')}`);
	await probe.close();

	// Stdio (jeden proces, jedna sesja): const { server } = await createServerWithModules(); await startStdioTransport(server);

	await startHttpTransport(buildMcpServer, {
		port: parseInt(process.env.MCP_PORT ?? '3333', 10),
		host: process.env.MCP_HOST ?? '127.0.0.1',
	});

	console.error('[Server] Connected via HTTP');
}

main().catch(error => {
	console.error('[Server] Fatal error:', error);
	process.exit(1);
});
