export function toolJson(data: unknown) {
	return {
		content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
	};
}

export function toolError(prefix: string, error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(prefix, error);
	return {
		content: [{ type: 'text' as const, text: `${prefix}: ${message}` }],
		isError: true as const,
	};
}
