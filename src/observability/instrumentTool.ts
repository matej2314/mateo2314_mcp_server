import { observeTool } from './metrics.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

type ToolConfig = {
	title?: string;
	description?: string;
	inputSchema?: unknown;
	outputSchema?: unknown;
	annotations?: unknown;
	_meta?: Record<string, unknown>;
};

type ToolResult = {
	content?: unknown;
	isError?: boolean;
	[key: string]: unknown;
};

export function registerInstrumentedTool(
	server: McpServer,
	moduleId: string,
	name: string,
	config: ToolConfig,
	handler: (...args: any[]) => Promise<ToolResult> | ToolResult,
): void {
	const wrapped = async (...args: any[]) => {
		const started = process.hrtime.bigint();
		let result: 'ok' | 'error' = 'ok';
		try {
			const out = await handler(...args);
			if (out && out.isError === true) {
				result = 'error';
			}
			return out;
		} catch (err) {
			result = 'error';
			throw err;
		} finally {
			const seconds = Number(process.hrtime.bigint() - started) / 1e9;
			observeTool({ module: moduleId, tool: name, result, seconds });
		}
	};

	server.registerTool(name, config as Parameters<McpServer['registerTool']>[1], wrapped as never);
}
