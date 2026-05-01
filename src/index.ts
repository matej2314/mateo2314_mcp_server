import dotenv from 'dotenv';
dotenv.config();

import { createMcpServer } from './core/server.js';
import { ToolRegistry } from './core/toolRegistry.js';
import { startHttpTransport } from './transports/http.js';
import { type ModuleConfig } from '../config/modules.config.js';
import { type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

async function buildMcpServerForModule(moduleConfig: ModuleConfig): Promise<McpServer> {
	const server = createMcpServer();
	const registry = new ToolRegistry(server);
	await registry.loadSingleModule(moduleConfig);
	console.error(`[Server] MCP server bound to module: ${moduleConfig.name}`);
	return server;
}

async function main() {
	const port = parseInt(process.env.MCP_PORT ?? '3333', 10);
	const host = process.env.MCP_HOST ?? '127.0.0.1';

	console.error('Starting MCP server...');
	console.error(`[Server] HTTP transport will bind to ${host}:${port}`);

	await startHttpTransport(buildMcpServerForModule, {
		port,
		host,
	});

	console.error(`[Server] HTTP transport is up on ${host}:${port}`);
}

void main().catch((err: unknown) => {
	console.error('[Server] Fatal startup error:', err);
	process.exit(1);
});
