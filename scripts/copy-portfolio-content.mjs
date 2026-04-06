import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src', 'modules', 'portfolio', 'content');
const dest = path.join(root, 'dist', 'src', 'modules', 'portfolio', 'content');

if (!fs.existsSync(src)) {
	console.error('[copy-portfolio-content] Source missing:', src);
	process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.error('[copy-portfolio-content] Copied', src, '->', dest);
