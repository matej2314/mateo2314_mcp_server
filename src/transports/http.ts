import { randomUUID } from 'crypto';
import { type IncomingMessage, type ServerResponse } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types';
import { getEnabledModuleByName } from '../../config/modules.config';
import { type McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { type Request, type Response } from 'express';
import { type ModuleConfig } from '../../config/modules.config';

interface SessionRecord {
	transport: StreamableHTTPServerTransport;
	server: McpServer;
	moduleId: string;
}

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
	return 'Internal server error';
}

export async function startHttpTransport(buildServer: (moduleConfig: ModuleConfig) => McpServer | Promise<McpServer>, options: StartHttpTransportOptions): Promise<void> {
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
			jsonRpcError(res, 401, -32001, 'Unauthorized: invalid or missing bearer token');
			return;
		}
		next();
	});

	const moduleMountPath = `${mountPath}/:moduleId`;

	const handlePost = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		const requestId = (req as Request & { requestId?: string }).requestId;
		const moduleIdParam = req.params.moduleId as string | undefined;

		try {
			if (!moduleIdParam) {
				jsonRpcError(res, 400, -32000, 'Bad Request: module id missing in path');
				return;
			}

			const existing = sessionId ? sessions[sessionId] : undefined;
			if (existing) {
				if (existing.moduleId !== moduleIdParam) {
					jsonRpcError(res, 403, -32000, 'Forbidden: session does not match this module path.');
					return;
				}
				await existing.transport.handleRequest(req as IncomingMessage, res as ServerResponse, req.body);
				return;
			}

			if (!sessionId && isInitializeRequest(req.body)) {
				const moduleConfig = getEnabledModuleByName(moduleIdParam);
				if (!moduleConfig) {
					jsonRpcError(res, 404, -32001, `Unknown or disabled module: ${moduleIdParam}`);
					return;
				}

				const server = await buildServer(moduleConfig);
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
					onsessioninitialized: sid => {
						sessions[sid] = { transport, server, moduleId: moduleIdParam };
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

			jsonRpcError(res, 400, -32000, 'Bad Request: missing initialize request body');
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
		const moduleIdParam = req.params.moduleId as string | undefined;
		try {
			if (!sessionId || !sessions[sessionId]) {
				jsonRpcError(res, 400, -32000, 'Invalid or missing session ID.');
				return;
			}
			// REFACTOR: GET musi trafiać na ten sam `:moduleId` co przy initialize.
			if (!moduleIdParam || sessions[sessionId].moduleId !== moduleIdParam) {
				jsonRpcError(res, 403, -32000, 'Forbidden: session does not match this module path.');
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
		const moduleIdParam = req.params.moduleId as string | undefined;
		try {
			if (!sessionId || !sessions[sessionId]) {
				jsonRpcError(res, 400, -32000, 'Invalid or missing session ID.');
				return;
			}
			// REFACTOR: Jak wyżej — spójność ścieżki z sesją.
			if (!moduleIdParam || sessions[sessionId].moduleId !== moduleIdParam) {
				jsonRpcError(res, 403, -32000, 'Forbidden: session does not match this module path.');
				return;
			}
			await sessions[sessionId].transport.handleRequest(req as IncomingMessage, res as ServerResponse);
		} catch (error) {
			console.error(`[HTTP Transport] DELETE error requestId=${requestId}:`, error);
			jsonRpcError(res, 500, -32603, clientSafeInternalMessage(error));
		}
	};

	app.post(moduleMountPath, handlePost);
	app.get(moduleMountPath, handleGet);
	app.delete(moduleMountPath, handleDelete);

	await new Promise<void>((resolve, reject) => {
		const httpServer = app
			.listen(options.port, host, () => {
				console.error(
					`[HTTP Transport] Server started and listening on port ${options.port} (host ${host})`,
				);
				console.error(
					`[HTTP Transport] Streamable MCP HTTP — http://${host}:${options.port}${mountPath}/<moduleId> (e.g. ...${mountPath}/portfolio, ...${mountPath}/test-tools)`,
				);
				resolve();
			})
			.on('error', reject);

		const shutdown = async () => {
			for (const sid of Object.keys(sessions)) {
				try {
					await sessions[sid]?.transport.close();
				} catch {}
				delete sessions[sid];
			}
			await httpServer.close(() => process.exit(0));
		};

		process.on('SIGINT', shutdown);
		process.on('SIGTERM', shutdown);
	});
}
