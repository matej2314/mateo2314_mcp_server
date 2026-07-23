import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { getEnabledModuleByName } from '../../config/modules.config.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Request, Response } from 'express';
import { ModuleConfig } from '../../config/modules.config.js';
import { register } from 'prom-client';
import { buildHealthPayload } from '../observability/health.js';
import {
	initMetrics,
	isMetricsEnabled,
	recordAuthFailure,
	recordHttpRequest,
	recordProtocolError,
	renderMetrics,
	sessionClosed,
	sessionOpened,
	setSessionActive,
	statusClassFromCode,
	type ProtocolErrorCode,
} from '../observability/metrics.js';

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

function sendJsonRpcError(
	res: Response,
	status: number,
	code: number,
	message: string,
	meta?: { module?: string; protocolCode?: ProtocolErrorCode },
): void {
	if (meta?.protocolCode) {
		recordProtocolError({
			module: meta.module ?? 'unknown',
			code: meta.protocolCode,
		});
	}
	jsonRpcError(res, status, code, message);
}

function attachHttpRequestMetrics(req: Request, res: Response, moduleId: string): void {
	res.on('finish', () => {
		recordHttpRequest({
			method: req.method,
			statusClass: statusClassFromCode(res.statusCode),
			module: moduleId || 'unknown',
		});
	});
}

function clientSafeInternalMessage(_error: unknown): string {
	return 'Internal server error';
}

function moduleFromMcpPath(path: string, mountPath: string): string {
	if (!path.startsWith(mountPath)) return 'unknown';
	const rest = path.slice(mountPath.length).replace(/^\//, '');
	const segment = rest.split('/')[0];
	return segment || 'unknown';
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

	initMetrics();

	const healthPath = process.env.HEALTH_PATH ?? '/healthz';
	const metricsPath = process.env.METRICS_PATH ?? '/metrics';

	if (process.env.HEALTH_ENABLED !== 'false') {
		app.get(healthPath, async (_req, res) => {
			const payload = await buildHealthPayload();
			const status = payload.status === 'ok' ? 200 : 503;
			res.status(status).json(payload);
		});
	}

	if (isMetricsEnabled()) {
		app.get(metricsPath, async (_req, res) => {
			res.setHeader('Content-Type', register.contentType);
			res.status(200).send(await renderMetrics());
		});
	}

	const refreshSessionGauge = (moduleId: string): void => {
		const count = Object.values(sessions).filter(s => s.moduleId === moduleId).length;
		setSessionActive(moduleId, count);
	};

	app.use((req, res, next) => {
		if (!req.path.startsWith(mountPath)) {
			next();
			return;
		}

		const header = req.headers.authorization;
		if (!header || !/^Bearer\s+/i.test(header)) {
			recordAuthFailure('missing_token');
			recordHttpRequest({
				method: req.method,
				statusClass: '4xx',
				module: moduleFromMcpPath(req.path, mountPath),
			});
			jsonRpcError(res, 401, -32001, 'Unauthorized: invalid or missing bearer token');
			return;
		}

		const token = header.replace(/^Bearer\s+/i, '');
		if (token !== expectedToken) {
			recordAuthFailure('invalid_token');
			recordHttpRequest({
				method: req.method,
				statusClass: '4xx',
				module: moduleFromMcpPath(req.path, mountPath),
			});
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
		const moduleIdParam = (req.params.moduleId as string | undefined) ?? 'unknown';
		attachHttpRequestMetrics(req, res, moduleIdParam);

		try {
			if (!req.params.moduleId) {
				sendJsonRpcError(res, 400, -32000, 'Bad Request: module id missing in path', {
					module: 'unknown',
					protocolCode: 'missing_module',
				});
				return;
			}

			const existing = sessionId ? sessions[sessionId] : undefined;
			if (existing) {
				if (existing.moduleId !== moduleIdParam) {
					sendJsonRpcError(res, 403, -32000, 'Forbidden: session does not match this module path.', {
						module: moduleIdParam,
						protocolCode: 'session_mismatch',
					});
					return;
				}
				await existing.transport.handleRequest(req as IncomingMessage, res as ServerResponse, req.body);
				return;
			}

			if (!sessionId && isInitializeRequest(req.body)) {
				const moduleConfig = getEnabledModuleByName(moduleIdParam);
				if (!moduleConfig) {
					sendJsonRpcError(res, 404, -32001, `Unknown or disabled module: ${moduleIdParam}`, {
						module: moduleIdParam,
						protocolCode: 'unknown_module',
					});
					return;
				}

				const server = await buildServer(moduleConfig);
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
					onsessioninitialized: sid => {
						sessions[sid] = { transport, server, moduleId: moduleIdParam };
						sessionOpened(moduleIdParam);
						refreshSessionGauge(moduleIdParam);
					},
				});

				transport.onclose = () => {
					const sid = transport.sessionId;
					const moduleId = sid && sessions[sid] ? sessions[sid].moduleId : moduleIdParam;
					if (sid && sessions[sid]) {
						delete sessions[sid];
					}
					sessionClosed(moduleId);
					refreshSessionGauge(moduleId);
					void server.close();
				};

				await server.connect(transport);
				await transport.handleRequest(req as IncomingMessage, res as ServerResponse, req.body);
				return;
			}

			sendJsonRpcError(res, 400, -32000, 'Bad Request: missing initialize request body', {
				module: moduleIdParam,
				protocolCode: 'missing_initialize',
			});
		} catch (error) {
			console.error(`[HTTP Transport] POST error requestId=${requestId}:`, error);
			if (!res.headersSent) {
				sendJsonRpcError(res, 500, -32603, clientSafeInternalMessage(error), {
					module: moduleIdParam,
					protocolCode: 'internal',
				});
			}
		}
	};

	const handleGet = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		const requestId = (req as Request & { requestId?: string }).requestId;
		const moduleIdParam = (req.params.moduleId as string | undefined) ?? 'unknown';
		attachHttpRequestMetrics(req, res, moduleIdParam);

		try {
			if (!sessionId || !sessions[sessionId]) {
				sendJsonRpcError(res, 400, -32000, 'Invalid or missing session ID.', {
					module: moduleIdParam,
					protocolCode: 'invalid_session',
				});
				return;
			}
			if (!req.params.moduleId || sessions[sessionId].moduleId !== moduleIdParam) {
				sendJsonRpcError(res, 403, -32000, 'Forbidden: session does not match this module path.', {
					module: moduleIdParam,
					protocolCode: 'session_mismatch',
				});
				return;
			}
			await sessions[sessionId].transport.handleRequest(req as IncomingMessage, res as ServerResponse);
		} catch (error) {
			console.error(`[HTTP Transport] GET error requestId=${requestId}:`, error);
			sendJsonRpcError(res, 500, -32603, clientSafeInternalMessage(error), {
				module: moduleIdParam,
				protocolCode: 'internal',
			});
		}
	};

	const handleDelete = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		const requestId = (req as Request & { requestId?: string }).requestId;
		const moduleIdParam = (req.params.moduleId as string | undefined) ?? 'unknown';
		attachHttpRequestMetrics(req, res, moduleIdParam);

		try {
			if (!sessionId || !sessions[sessionId]) {
				sendJsonRpcError(res, 400, -32000, 'Invalid or missing session ID.', {
					module: moduleIdParam,
					protocolCode: 'invalid_session',
				});
				return;
			}
			if (!req.params.moduleId || sessions[sessionId].moduleId !== moduleIdParam) {
				sendJsonRpcError(res, 403, -32000, 'Forbidden: session does not match this module path.', {
					module: moduleIdParam,
					protocolCode: 'session_mismatch',
				});
				return;
			}
			await sessions[sessionId].transport.handleRequest(req as IncomingMessage, res as ServerResponse);
		} catch (error) {
			console.error(`[HTTP Transport] DELETE error requestId=${requestId}:`, error);
			sendJsonRpcError(res, 500, -32603, clientSafeInternalMessage(error), {
				module: moduleIdParam,
				protocolCode: 'internal',
			});
		}
	};

	app.post(moduleMountPath, handlePost);
	app.get(moduleMountPath, handleGet);
	app.delete(moduleMountPath, handleDelete);

	await new Promise<void>((resolve, reject) => {
		const httpServer = app
			.listen(options.port, host, () => {
				console.error(`[HTTP Transport] Server started and listening on port ${options.port} (host ${host})`);
				console.error(`[HTTP Transport] Streamable MCP HTTP — http://${host}:${options.port}${mountPath}/<moduleId> (e.g. ...${mountPath}/portfolio, ...${mountPath}/test-tools)`);
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
