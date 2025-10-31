import { ConfigManager } from '../core/ConfigManager';
import { Logger } from '../utils/Logger';
import { CLIApplication as ICLIApplication } from '../types';
export declare class CLIApplication implements ICLIApplication {
    private configManager;
    private logger;
    private chatManager;
    private ollamaProvider;
    constructor(configManager: ConfigManager, logger: Logger);
    start(): Promise<void>;
    handleCommand(command: string, args: string[]): Promise<void>;
    startChatSession(options: any): Promise<void>;
    handleConfigCommand(options: any): Promise<void>;
    handleModelsCommand(options: any): Promise<void>;
    handleHistoryCommand(options: any): Promise<void>;
    shutdown(): Promise<void>;
    private initializeOllamaProvider;
    private initializeChatManager;
    private displayWelcomeMessage;
}
//# sourceMappingURL=CLIApplication.d.ts.map