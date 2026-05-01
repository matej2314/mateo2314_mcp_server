import fs from 'fs/promises';
import path from 'path';
import { safeJoin } from './paths.js';
import { parseFrontmatter } from './frontmatter.js';
/**
 * Listowanie plików w podkatalogu (np. 'projects')
 */
export async function listFiles(subdir) {
    const dirPath = safeJoin(subdir);
    try {
        const files = await fs.readdir(dirPath);
        return files.filter(file => file.endsWith('.md'));
    }
    catch (error) {
        console.error('[Corpus] Error listing files in', dirPath, error);
        return [];
    }
}
/**
 * Odczytanie zawartości pliku z frontmatter
 */
export async function readFile(subdir, filename) {
    const filePath = safeJoin(subdir, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return parseFrontmatter(content);
}
/**
 * Odczyt wszystkich plików z podkatalogu (z metadanymi)
 */
export async function readAllFiles(subdir) {
    const files = await listFiles(subdir);
    const results = [];
    for (const file of files) {
        const id = path.basename(file, '.md');
        const { data, body } = await readFile(subdir, file);
        results.push({ id, data, body });
    }
    return results;
}
/**
 * Wszystkie dokumenty danej sekcji (wg manifestu): profile/about jako pojedyncze pliki, pozostałe — katalog `.md`.
 */
export async function loadSectionDocuments(sectionName) {
    if (sectionName === 'profile') {
        try {
            const { data, body } = await readFile('', 'profile.md');
            return [{ id: 'profile', data, body }];
        }
        catch {
            return [];
        }
    }
    if (sectionName === 'about') {
        try {
            const { data, body } = await readFile('about', 'body.md');
            return [{ id: 'about', data, body }];
        }
        catch {
            return [];
        }
    }
    return readAllFiles(sectionName);
}
