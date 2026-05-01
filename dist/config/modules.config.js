import path from 'path';
import { fileURLToPath } from 'url';
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPortfolioContentRoot = path.join(repoRoot, 'src', 'modules', 'portfolio', 'content');
export const modulesConfig = [
    {
        name: 'portfolio',
        enabled: process.env.ENABLE_MODULE_PORTFOLIO !== 'false',
        namespace: process.env.PORTFOLIO_NAMESPACE || 'portfolio',
        config: {
            contentRoot: process.env.PORTFOLIO_CONTENT_ROOT ? path.resolve(process.env.PORTFOLIO_CONTENT_ROOT) : defaultPortfolioContentRoot,
            corpusVersion: process.env.PORTFOLIO_CORPUS_VERSION || '1.0.0',
        },
    },
    {
        name: 'test-tools',
        enabled: process.env.ENABLE_MODULE_TEST_TOOLS !== 'false',
        namespace: process.env.TEST_TOOLS_NAMESPACE || 'test',
    },
];
export function getEnabledModuleByName(name) {
    const found = modulesConfig.find(m => m.name === name);
    if (!found || !found.enabled) {
        return undefined;
    }
    return found;
}
