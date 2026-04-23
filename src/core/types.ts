import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface ModuleOptions {
	namespace?: string;
	/** Konfiguracja modułu z `modules.config.ts` — kształt zależy od modułu (portfolio vs inne). */
	config?: unknown;
}

export interface ModuleMetadata {
	name: string;
	version: string;
	description?: string;
}

/** Kontrakt pliku `src/modules/<name>/index.ts` ładowanego przez ToolRegistry. */
export type McpModule = {
	register: (server: McpServer, options?: ModuleOptions) => Promise<void>;
};

export type LoadedModuleRecord = {
	name: string;
	module: McpModule;
};

export function isMcpModule(x: unknown): x is McpModule {
	return (
		typeof x === 'object' &&
		x !== null &&
		'register' in x &&
		typeof (x as McpModule).register === 'function'
	);
}
