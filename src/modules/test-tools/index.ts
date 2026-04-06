import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ModuleOptions } from '../../core/types.js';
import { getUserDataTool } from './tools/getUserData.js';
import { getProductsTool } from './tools/getProducts.js';

export async function register(server: McpServer, options: ModuleOptions = {}) {
    const namespace = options.namespace || 'test';

    // Rejestracja narzędzia getUserData
    server.tool(
        `${namespace}_get_user_data`,
        {
            userId: z.string().optional().describe('ID użytkownika (opcjonalne, domyślnie: "user123")'),
            includeDetails: z.boolean().optional().describe('Czy dołączyć szczegółowe informacje (domyślnie: true)'),
        },
        {
            title: 'Zwraca przykładowe dane użytkownika z różnymi informacjami',
        },
        getUserDataTool
    );

    // Rejestracja narzędzia getProducts
    server.tool(
        `${namespace}_get_products`,
        {
            category: z.string().optional().describe('Kategoria produktów: "electronics", "books", "clothing" (opcjonalne)'),
            limit: z.number().optional().describe('Maksymalna liczba produktów do zwrócenia (domyślnie: 5)'),
        },
        {
            title: 'Zwraca listę przykładowych produktów z cenami i opisami',
        },
        getProductsTool
    );

    console.error(`[test-tools] Registered tools with namespace: ${namespace}`);
}
