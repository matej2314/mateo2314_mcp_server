export interface ModuleOptions {
    namespace?: string;
    config?: Record<string, any>;
}

export interface ModuleMetadata {
    name: string;
    version: string;
    description?: string;
}