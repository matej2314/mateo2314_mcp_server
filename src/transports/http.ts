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
	/** Passed to createMcpExpressApp + listen. Default 127.0.0.1; use 0.0.0.0 for Docker/VPS. */
	host?: string;
	/** MCP endpoint path. Default /mcp */
	path?: string;
	/** Required non-empty Bearer secret for every request. */
	internalToken?: string;
	/** When binding to 0.0.0.0, set allowed hostnames for DNS rebinding middleware */
	allowedHosts?: string[];
};

/**
 * Streamable HTTP transport (stateful sessions). Alternative to stdio.
 *
 * One {@link McpServer} is tied to one transport; each MCP session gets a fresh server from
 * `buildServer()` — same pattern as SDK `simpleStreamableHttp` example.
 */
export async function startHttpTransport(buildServer: () => McpServer | Promise<McpServer>, options: StartHttpTransportOptions): Promise<void> {
	const mountPath = options.path ?? '/mcp';
	const host = options.host ?? '127.0.0.1';
	const sessions: Record<string, SessionRecord> = {};

	const app = createMcpExpressApp({
		host,
		allowedHosts: options.allowedHosts,
	});

	if (options.internalToken) {
		app.use((req, res, next) => {
			const header = req.headers.authorization;
			const token = header?.replace(/^Bearer\s+/i, '');
			if (token !== options.internalToken) {
				res.status(401).json({ error: 'Unauthorized' });
				return;
			}
			next();
		});
	}

	const handlePost = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;

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

			res.status(400).json({
				jsonrpc: '2.0',
				error: {
					code: -32000,
					message: 'Bad Request: No valid session ID provided',
				},
				id: null,
			});
		} catch (error) {
			console.error('[HTTP Transport] Error:', error);
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: '2.0',
					error: {
						code: -32603,
						message: error instanceof Error ? error.message : 'Internal server error',
					},
					id: null,
				});
			}
		}
	};

	const handleGet = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		if (!sessionId || !sessions[sessionId]) {
			res.status(400).send('Invalid or missing session ID');
			return;
		}
		await sessions[sessionId].transport.handleRequest(req as IncomingMessage, res as ServerResponse);
	};

	const handleDelete = async (req: Request, res: Response) => {
		const sessionIdHeader = req.headers['mcp-session-id'];
		const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
		if (!sessionId || !sessions[sessionId]) {
			res.status(400).send('Invalid or missing session ID');
			return;
		}
		await sessions[sessionId].transport.handleRequest(req as IncomingMessage, res as ServerResponse);
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
