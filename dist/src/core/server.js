import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export function createMcpServer() {
    const server = new McpServer({
        name: 'mateo2314_mcp_server',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        }
    });
    return server;
}
