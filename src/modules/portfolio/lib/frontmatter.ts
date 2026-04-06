interface ParseFrontMatterResult {
	data: Record<string, any>;
	body: string;
}

export function parseFrontmatter(content: string): ParseFrontMatterResult {
	const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
	const match = content.match(frontMatterRegex);

	if (!match) {
		return { data: {}, body: content };
	}

	const [, yamlContent, body] = match;
	const data: Record<string, any> = {};

	yamlContent.split('\n').forEach(line => {
		const colonIndex = line.indexOf(':');
		if (colonIndex > 0) {
			const key = line.substring(0, colonIndex).trim();
			const value = line.substring(colonIndex + 1).trim();
			data[key] = value.replace(/^["']|["']$/g, '');
		}
	});

	return { data, body: body.trim() };
}
