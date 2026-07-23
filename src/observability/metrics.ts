import { collectDefaultMetrics, Counter, Gauge, Histogram, register } from 'prom-client';

const metricsEnabled = () => process.env.METRICS_ENABLED !== 'false';

let initialized = false;

export type AuthFailureReason = 'missing_token' | 'invalid_token';

export type ProtocolErrorCode = 'missing_module' | 'unknown_module' | 'session_mismatch' | 'missing_initialize' | 'invalid_session' | 'internal';

const sessionsActive = new Gauge({
	name: 'mcp_sessions_active',
	help: 'Active MCP sessions',
	labelNames: ['module'] as const,
});

const sessionsOpened = new Counter({
	name: 'mcp_sessions_opened_total',
	help: 'MCP sessions opened',
	labelNames: ['module'] as const,
});

const sessionsClosed = new Counter({
	name: 'mcp_sessions_closed_total',
	help: 'MCP sessions closed',
	labelNames: ['module'] as const,
});

const httpRequests = new Counter({
	name: 'mcp_http_requests_total',
	help: 'HTTP requests to MCP transport',
	labelNames: ['method', 'status_class', 'module'] as const,
});

const authFailures = new Counter({
	name: 'mcp_auth_failures_total',
	help: 'Bearer auth failures',
	labelNames: ['reason'] as const,
});

const protocolErrors = new Counter({
	name: 'mcp_protocol_errors_total',
	help: 'Known MCP/HTTP protocol error paths',
	labelNames: ['module', 'code'] as const,
});

const toolInvocations = new Counter({
	name: 'mcp_tool_invocations_total',
	help: 'Tool invocations',
	labelNames: ['module', 'tool', 'result'] as const,
});

const toolDuration = new Histogram({
	name: 'mcp_tool_duration_seconds',
	help: 'Tool handler duration in seconds',
	labelNames: ['module', 'tool'] as const,
	buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const buildInfo = new Gauge({
	name: 'mcp_build_info',
	help: 'Build info',
	labelNames: ['version'] as const,
});

export function initMetrics(): void {
	if (!metricsEnabled() || initialized) return;
	collectDefaultMetrics({ register, prefix: 'mcp_' });
	buildInfo.set({ version: '1.0.0' }, 1);
	initialized = true;
}

export function isMetricsEnabled(): boolean {
	return metricsEnabled();
}

export async function renderMetrics(): Promise<string> {
	return register.metrics();
}

export function recordAuthFailure(reason: AuthFailureReason): void {
	if (!metricsEnabled()) return;
	authFailures.inc({ reason });
}

export function recordHttpRequest(args: { method: string; statusClass: string; module: string }): void {
	if (!metricsEnabled()) return;
	httpRequests.inc({
		method: args.method,
		status_class: args.statusClass,
		module: args.module,
	});
}

export function setSessionActive(moduleId: string, count: number): void {
	if (!metricsEnabled()) return;
	sessionsActive.set({ module: moduleId }, count);
}

export function sessionOpened(moduleId: string): void {
	if (!metricsEnabled()) return;
	sessionsOpened.inc({ module: moduleId });
}

export function sessionClosed(moduleId: string): void {
	if (!metricsEnabled()) return;
	sessionsClosed.inc({ module: moduleId });
}

export function recordProtocolError(args: { module: string; code: ProtocolErrorCode }): void {
	if (!metricsEnabled()) return;
	protocolErrors.inc({ module: args.module, code: args.code });
}

export function observeTool(args: { module: string; tool: string; result: 'ok' | 'error'; seconds: number }): void {
	if (!metricsEnabled()) return;
	toolInvocations.inc({
		module: args.module,
		tool: args.tool,
		result: args.result,
	});
	toolDuration.observe({ module: args.module, tool: args.tool }, args.seconds);
}

export function statusClassFromCode(status: number): string {
	if (status >= 500) return '5xx';
	if (status >= 400) return '4xx';
	if (status >= 300) return '3xx';
	if (status >= 200) return '2xx';
	return '1xx';
}
