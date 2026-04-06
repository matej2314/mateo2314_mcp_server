export const modulesConfig = [
    {
        name: 'portfolio',
        enabled: process.env.ENABLE_MODULE_PORTFOLIO !== 'false',
        namespace: process.env.PORTFOLIO_NAMESPACE || 'portfolio',
        config: {
            contentRoot: process.env.PORTFOLIO_CONTENT_ROOT || './src/modules/portfolio/content',
            corpusVersion: process.env.PORTFOLIO_CORPUS_VERSION || '1.0.0',
        }
    },
    {
        name: 'test-tools',
        enabled: process.env.ENABLE_MODULE_TEST_TOOLS !== 'false',
        namespace: process.env.TEST_TOOLS_NAMESPACE || 'test',
    }
];
