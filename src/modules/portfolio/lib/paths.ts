import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONTENT_ROOT = path.resolve(process.env.PORTFOLIO_CONTENT_ROOT || path.join(__dirname, '../content'));

export function safeJoin(...parts: string[]): string {
	const joined = path.join(CONTENT_ROOT, ...parts);
	const normalized = path.normalize(joined);

	if (!normalized.startsWith(CONTENT_ROOT)) {
		throw new Error(`Path traversal detected: ${normalized}`);
	}

	return normalized;
}
