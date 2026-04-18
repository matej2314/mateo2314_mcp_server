import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';

type SessionRecord = {
	transport: StreamableHTTPServerTransport;
	server: McpServer;
};

export type StartHttpTransportOptions = {
	port: number;
	host?: string;
	path?: string;
	allowedHosts?: string[];
};

function jsonRpcError(res: Response, status: number, code: number, message: string) {
	if (res.headersSent) return;
	res.status(status).json({
		jsonrpc: '2.0',
		error: { code, message },
		id: null,
	});
}

function clientSafeInternalMessage(_error: unknown): string {
	return 'Internal server error.';
}

export async function startHttpTransport(buildServer: () => McpServer | Promise<McpServer>, options: StartHttpTransportOptions): Promise<void> {
	const mountPath = options.path ?? '/mcp';
	const host = options.host ?? '127.0.0.1';
	const sessions: Record<string, SessionRecord> = {};

	const expectedToken = process.env.MCP_INTERNAL_TOKEN?.trim();
	if (!expectedToken) {
		throw new Error('[HTTP Transport] MCP_INTERNAL_TOKEN must be set to a non-empty value in the environment');
	}

	const app = createMcpExpressApp({
		host,
		allowedHosts: options.allowedHosts,
	});

	app.use((req, _res, next) => {
		const rId = req.headers['x-request-id'];
		(req as Request & { requestId?: string }).requestId = typeof rId === 'string' && rId.trim() ? rId.trim() : randomUUID();
		next();
	});

	app.use((req, res, next) => {
		const header = req.headers.authorization;
		const token = header && header.replace(/^Bearer\s+/i, '');

		if (token !== expectedToken) {
			jsonRpcError(res, 401, -32001, 'Unauthorized');
			return;
		}
		next();
	});

	const handlePost = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		const requestId = (req as Request & { requestId?: string }).requestId;

		try {
			const existing = sessionId ? sessions[sessionId] : undefined;
			if (existing) {
				await existing.transport.handleRequest(req as IncomingMessage, res as ServerResponse, req.body);
				return;
			}

			if (!sessionId && isInitializeRequest(req.body)) {
				const server = await buildServer();
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
					onsessioninitialized: sid => {
						sessions[sid] = { transport, server };
					},
				});

				transport.onclose = () => {
					const sid = transport.sessionId;
					if (sid && sessions[sid]) {
						delete sessions[sid];
					}
					void server.close();
				};

				await server.connect(transport);
				await transport.handleRequest(req as IncomingMessage, res as ServerResponse, req.body);
				return;
			}

			jsonRpcError(res, 400, -32000, 'Bad Request: No valid session Id provided.');
		} catch (error) {
			console.error(`[HTTP Transport] POST error requestId=${requestId}:`, error);
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: '2.0',
					error: {
						code: -32603,
						message: clientSafeInternalMessage(error),
					},
					id: null,
				});
			}
		}
	};

	const handleGet = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		const requestId = (req as Request & { requestId?: string }).requestId;

		try {
			if (!sessionId || !sessions[sessionId]) {
				jsonRpcError(res, 400, -32000, 'Invalid or missing session ID.');
				return;
			}
			await sessions[sessionId].transport.handleRequest(req as IncomingMessage, res as ServerResponse);
		} catch (error) {
			console.error(`[HTTP Transport] GET error requestId=${requestId}:`, error);
			jsonRpcError(res, 500, -32603, clientSafeInternalMessage(error));
		}
	};

	const handleDelete = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		const requestId = (req as Request & { requestId?: string }).requestId;

		try {
			if (!sessionId || !sessions[sessionId]) {
				jsonRpcError(res, 400, -32000, 'Invalid or missing session ID.');
				return;
			}
			await sessions[sessionId].transport.handleRequest(req as IncomingMessage, res as ServerResponse);
		} catch (error) {
			console.error(`[HTTP Transport] DELETE error requestId=${requestId}:`, error);
			jsonRpcError(res, 500, -32603, clientSafeInternalMessage(error));
		}
	};

	app.post(mountPath, handlePost);
	app.get(mountPath, handleGet);
	app.delete(mountPath, handleDelete);

	await new Promise<void>((resolve, reject) => {
		const httpServer = app
			.listen(options.port, host, () => {
				console.error(`[HTTP Transport] Streamable HTTP at http://${host}:${options.port}${mountPath}`);
				resolve();
			})
			.on('error', reject);

		const shutdown = async () => {
			for (const sid of Object.keys(sessions)) {
				try {
					await sessions[sid]?.transport.close();
				} catch {
					/* ignore */
				}
				delete sessions[sid];
			}
			httpServer.close(() => process.exit(0));
		};

		process.once('SIGINT', shutdown);
		process.once('SIGTERM', shutdown);
	});
}
