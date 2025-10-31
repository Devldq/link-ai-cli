import { AIProvider, Model, GenerationOptions, ChatOptions, ChatResponse, ChatMessage, OllamaConfig } from '../types';
import { Logger } from '../utils/Logger';
export declare class OllamaProvider implements AIProvider {
    readonly name = "ollama";
    private client;
    private config;
    private logger;
    private isConnected;
    constructor(config: OllamaConfig, logger: Logger);
    connect(): Promise<boolean>;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<Model[]>;
    generateStream(prompt: string, options?: GenerationOptions): AsyncIterable<string>;
    chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatResponse>;
    getModelInfo(modelName: string): Promise<any>;
    hasModel(modelName: string): Promise<boolean>;
    getConfig(): OllamaConfig;
    updateConfig(newConfig: Partial<OllamaConfig>): void;
    private ensureConnected;
    private formatSize;
    testConnection(): Promise<{
        success: boolean;
        latency?: number;
        error?: string;
    }>;
    getVersion(): Promise<string>;
}
//# sourceMappingURL=OllamaProvider.d.ts.map