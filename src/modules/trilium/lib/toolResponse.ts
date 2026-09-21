export function toolJson(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function toolOk(data: unknown) {
  return toolJson(data);
}

export function toolError(content: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `${content}: ${detail}` }],
    isError: true as const,
  };
}
