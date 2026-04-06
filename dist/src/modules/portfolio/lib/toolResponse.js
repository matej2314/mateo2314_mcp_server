export function toolJson(data) {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
}
export function toolError(prefix, error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(prefix, error);
    return {
        content: [{ type: 'text', text: `${prefix}: ${message}` }],
        isError: true,
    };
}
