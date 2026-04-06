import manifest from '../content/manifest.json';
import { loadSectionDocuments } from './corpus.js';

export async function searchCorpus(
	query: string,
	section?: string
): Promise<Array<{ section: string; id: string; snippet: string; relevance: number }>> {
	const lowerQuery = query.toLowerCase();
	const names = manifest.sections.map((s) => s.name);
	const sections = section ? names.filter((n) => n === section) : names;

	if (section && sections.length === 0) {
		return [];
	}

	const results: Array<{ section: string; id: string; snippet: string; relevance: number }> = [];

	for (const name of sections) {
		const files = await loadSectionDocuments(name);

		for (const file of files) {
			const fullText = `${JSON.stringify(file.data)} ${file.body}`.toLowerCase();

			if (fullText.includes(lowerQuery)) {
				const index = fullText.indexOf(lowerQuery);
				const start = Math.max(0, index - 50);
				const end = Math.min(fullText.length, index + 150);
				const snippet = fullText.substring(start, end);

				results.push({
					section: name,
					id: file.id,
					snippet: `...${snippet}...`,
					relevance: 1,
				});
			}
		}
	}

	return results.sort((a, b) => b.relevance - a.relevance);
}
