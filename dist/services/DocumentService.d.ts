import { Logger } from '../utils/Logger';
import { ConfigManager } from '../core/ConfigManager';
export interface DocumentOptions {
    format?: 'markdown' | 'json' | 'yaml' | 'txt' | 'auto';
    encoding?: BufferEncoding;
    createIfNotExists?: boolean;
    backup?: boolean;
    validateStructure?: boolean;
}
export interface DocumentResult {
    success: boolean;
    message: string;
    content?: any;
    metadata?: DocumentMetadata;
    error?: string;
}
export interface DocumentMetadata {
    format: string;
    size: number;
    lastModified: Date;
    encoding: string;
    structure?: any;
}
export interface MarkdownDocument {
    frontmatter?: Record<string, any>;
    content: string;
    headings: Array<{
        level: number;
        text: string;
        id: string;
    }>;
    links: Array<{
        text: string;
        url: string;
        title?: string;
    }>;
}
export interface JsonDocument {
    data: any;
    schema?: any;
    isValid: boolean;
}
export interface YamlDocument {
    data: any;
    isValid: boolean;
}
export declare class DocumentService {
    private logger;
    private readonly supportedFormats;
    constructor(_configManager: ConfigManager, logger: Logger);
    readDocument(filePath: string, options?: DocumentOptions): Promise<DocumentResult>;
    writeDocument(filePath: string, content: any, options?: DocumentOptions): Promise<DocumentResult>;
    parseMarkdown(content: string): Promise<MarkdownDocument>;
    parseJson(content: string): Promise<JsonDocument>;
    parseYaml(content: string): Promise<YamlDocument>;
    convertDocument(sourcePath: string, targetPath: string, targetFormat: string): Promise<DocumentResult>;
    searchInDocument(filePath: string, query: string, options?: {
        caseSensitive?: boolean;
    }): Promise<DocumentResult>;
    private detectFormat;
    private parseContent;
    private serializeContent;
    private analyzeStructure;
    private convertContent;
    private createBackup;
    getSupportedFormats(): string[];
    isFormatSupported(format: string): boolean;
}
//# sourceMappingURL=DocumentService.d.ts.map