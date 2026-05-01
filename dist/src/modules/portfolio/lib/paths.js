import path from 'path';
let contentRoot = '';
export function setPortfolioContentRoot(resolvedRoot) {
    const normalized = path.resolve(resolvedRoot);
    contentRoot = normalized;
}
function getContentRoot() {
    if (!contentRoot)
        throw new Error('Content root not set');
    return contentRoot;
}
/** Bieżący katalog treści portfolio (po `setPortfolioContentRoot` z `register`). */
export function getPortfolioContentRoot() {
    return getContentRoot();
}
export function safeJoin(...parts) {
    const root = getContentRoot();
    const joined = path.join(root, ...parts);
    const normalized = path.normalize(joined);
    if (!normalized.startsWith(root)) {
        throw new Error(`Path traversal detected: ${normalized}`);
    }
    return normalized;
}
