import { ConfigManager } from '../core/ConfigManager';
export declare class UIManager {
    private configManager;
    constructor(configManager: ConfigManager);
    displayInterface(): void;
    private clearScreen;
    private displayHeader;
    private displaySeparator;
    displayUserMessage(message: string): void;
    displayAIMessageStart(): void;
    displayAIMessageChunk(chunk: string): void;
    displayAIMessageEnd(): void;
    displayPrompt(): void;
    displayWaitingMessage(): void;
    displayError(message: string): void;
    displaySuccess(message: string): void;
    displayWarning(message: string): void;
    displayInfo(message: string): void;
    displayHelp(): void;
    displayModels(models: Array<{
        name: string;
        size: string;
    }>, currentModel: string): void;
    displayConfig(): void;
    displaySessionHistory(messages: Array<{
        role: string;
        content: string;
        timestamp: Date;
    }>): void;
    displayStartupMessage(): void;
    displayExitMessage(): void;
    displayGoodbyeMessage(): void;
}
//# sourceMappingURL=UIManager.d.ts.map