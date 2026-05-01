import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface PortfolioModuleConfig {
	contentRoot: string;
	corpusVersion: string;
}

export type ModuleConfig =
	| {
			name: 'portfolio';
			enabled: boolean;
			namespace?: string;
			config: PortfolioModuleConfig;
	  }
	| {
			name: 'test-tools';
			enabled: boolean;
			namespace?: string;
			config?: undefined;
	  };

const defaultPortfolioContentRoot = path.join(repoRoot, 'src', 'modules', 'portfolio', 'content');

export const mmodulesConfig: ModuleConfig[] = [
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

export type ModuleId = ModuleConfig['name'];

export function getEnabledModuleByName(name: string): ModuleConfig | undefined {
	const found = mmodulesConfig.find(m => m.name === name);
	if (!found || !found.enabled) {
		return undefined;
	}
	return found;
}
