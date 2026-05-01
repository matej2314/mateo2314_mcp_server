import dotenv from 'dotenv';
dotenv.config();
import { createMcpServer } from './core/server.js';
import { ToolRegistry } from './core/toolRegistry.js';
import { startHttpTransport } from './transports/http.js';
async function buildMcpServerForModule(moduleConfig) {
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
void main().catch((err) => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
});
