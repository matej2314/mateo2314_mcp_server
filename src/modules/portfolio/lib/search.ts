import fs from 'fs/promises';
import path from 'path';
import { getPortfolioContentRoot } from './paths.js';
import { loadSectionDocuments } from './corpus.js';

type SearchManifest = {
	sections: Array<{ name: string }>;
};

let manifestPromise: Promise<SearchManifest> | null = null;

function resolveManifestPath(): string {
	const override = process.env.PORTFOLIO_MANIFEST_PATH?.trim();
	if (override) {
		return path.resolve(override);
	}
	return path.join(getPortfolioContentRoot(), 'manifest.json');
}

function loadManifest(): Promise<SearchManifest> {
	if (!manifestPromise) {
		manifestPromise = (async () => {
			const filePath = resolveManifestPath();
			const raw = await fs.readFile(filePath, 'utf-8');
			return JSON.parse(raw) as SearchManifest;
		})().catch(err => {
			manifestPromise = null;
			throw err;
		});
	}
	return manifestPromise;
}

export async function searchCorpus(
	query: string,
	section?: string
): Promise<Array<{ section: string; id: string; snippet: string; relevance: number }>> {
	const manifest = await loadManifest();
	const lowerQuery = query.toLowerCase();
	const names = manifest.sections.map(s => s.name);
	const sections = section ? names.filter(n => n === section) : names;

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
