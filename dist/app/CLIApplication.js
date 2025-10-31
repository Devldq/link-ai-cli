"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIApplication = void 0;
// CLI应用程序主类
const chalk_1 = __importDefault(require("chalk"));
const ChatManager_1 = require("../core/ChatManager");
const OllamaProvider_1 = require("../providers/OllamaProvider");
class CLIApplication {
    constructor(configManager, logger) {
        this.chatManager = null;
        this.ollamaProvider = null;
        this.configManager = configManager;
        this.logger = logger;
    }
    // 启动应用程序
    async start() {
        try {
            this.logger.info('Starting AI CLI Chat application...');
            // 初始化Ollama提供商
            await this.initializeOllamaProvider();
            // 初始化聊天管理器
            await this.initializeChatManager();
            this.logger.success('Application started successfully');
        }
        catch (error) {
            this.logger.error('Failed to start application:', error);
            throw error;
        }
    }
    // 处理命令
    async handleCommand(command, args) {
        this.logger.debug(`Handling command: ${command} with args:`, args);
        switch (command) {
            case 'chat':
            case 'l':
                await this.startChatSession({});
                break;
            default:
                this.logger.warn(`Unknown command: ${command}`);
        }
    }
    // 启动聊天会话
    async startChatSession(options) {
        try {
            if (!this.chatManager) {
                await this.initializeChatManager();
            }
            // 显示欢迎信息
            this.displayWelcomeMessage();
            // 启动聊天会话
            await this.chatManager.startSession(options);
        }
        catch (error) {
            this.logger.error('Failed to start chat session:', error);
            throw error;
        }
    }
    // 处理配置命令
    async handleConfigCommand(options) {
        try {
            if (options.list) {
                // 显示当前配置
                const config = this.configManager.getConfig();
                console.log(chalk_1.default.cyan('📋 Current Configuration:'));
                console.log(JSON.stringify(config, null, 2));
            }
            else if (options.set) {
                // 设置配置值
                const [key, value] = options.set.split('=');
                if (!key || value === undefined) {
                    throw new Error('Invalid format. Use: --set key=value');
                }
                // 尝试解析JSON值
                let parsedValue = value;
                try {
                    parsedValue = JSON.parse(value);
                }
                catch {
                    // 如果不是JSON，保持字符串
                }
                await this.configManager.setConfig(key, parsedValue);
                this.logger.success(`Configuration updated: ${key} = ${parsedValue}`);
            }
            else if (options.get) {
                // 获取配置值
                const value = this.configManager.getConfigValue(options.get);
                console.log(chalk_1.default.cyan(`${options.get}:`), value);
            }
            else if (options.reset) {
                // 重置配置
                await this.configManager.resetConfig();
                this.logger.success('Configuration reset to defaults');
            }
            else {
                console.log(chalk_1.default.yellow('Please specify an option: --list, --set, --get, or --reset'));
            }
        }
        catch (error) {
            this.logger.error('Failed to handle config command:', error);
            throw error;
        }
    }
    // 处理模型命令
    async handleModelsCommand(options) {
        try {
            if (!this.ollamaProvider) {
                await this.initializeOllamaProvider();
            }
            if (options.list) {
                // 列出可用模型
                const progress = this.logger.createProgress('Fetching available models...');
                progress.start();
                try {
                    const models = await this.ollamaProvider.listModels();
                    progress.succeed('Models fetched successfully');
                    console.log(chalk_1.default.cyan('\n🤖 Available Models:'));
                    models.forEach(model => {
                        console.log(`  • ${chalk_1.default.green(model.name)} (${model.size})`);
                    });
                }
                catch (error) {
                    progress.fail('Failed to fetch models');
                    throw error;
                }
            }
            else if (options.pull) {
                // 拉取模型
                console.log(chalk_1.default.cyan(`🔄 Pulling model: ${options.pull}`));
                console.log(chalk_1.default.yellow('Note: This operation should be done through Ollama CLI directly.'));
                console.log(chalk_1.default.gray(`Run: ollama pull ${options.pull}`));
            }
            else if (options.remove) {
                // 删除模型
                console.log(chalk_1.default.cyan(`🗑️  Removing model: ${options.remove}`));
                console.log(chalk_1.default.yellow('Note: This operation should be done through Ollama CLI directly.'));
                console.log(chalk_1.default.gray(`Run: ollama rm ${options.remove}`));
            }
            else {
                console.log(chalk_1.default.yellow('Please specify an option: --list, --pull, or --remove'));
            }
        }
        catch (error) {
            this.logger.error('Failed to handle models command:', error);
            throw error;
        }
    }
    // 处理历史命令
    async handleHistoryCommand(options) {
        try {
            if (!this.chatManager) {
                await this.initializeChatManager();
            }
            if (options.list) {
                // 列出聊天会话
                await this.chatManager.listSessions();
            }
            else if (options.show) {
                // 显示特定会话
                await this.chatManager.showSession(options.show);
            }
            else if (options.delete) {
                // 删除特定会话
                await this.chatManager.deleteSession(options.delete);
            }
            else if (options.clear) {
                // 清除所有历史
                await this.chatManager.clearAllSessions();
            }
            else if (options.export) {
                // 导出会话
                await this.chatManager.exportSession(options.export);
            }
            else {
                console.log(chalk_1.default.yellow('Please specify an option: --list, --show, --delete, --clear, or --export'));
            }
        }
        catch (error) {
            this.logger.error('Failed to handle history command:', error);
            throw error;
        }
    }
    // 关闭应用程序
    async shutdown() {
        try {
            this.logger.info('Shutting down application...');
            if (this.chatManager) {
                await this.chatManager.cleanup();
            }
            this.logger.success('Application shutdown complete');
        }
        catch (error) {
            this.logger.error('Error during shutdown:', error);
        }
    }
    // 初始化Ollama提供商
    async initializeOllamaProvider() {
        const config = this.configManager.getConfig();
        this.ollamaProvider = new OllamaProvider_1.OllamaProvider(config.ollama, this.logger);
        const progress = this.logger.createProgress('Connecting to Ollama...');
        progress.start();
        try {
            const isConnected = await this.ollamaProvider.connect();
            if (isConnected) {
                progress.succeed('Connected to Ollama successfully');
            }
            else {
                progress.fail('Failed to connect to Ollama');
                throw new Error('Ollama connection failed');
            }
        }
        catch (error) {
            progress.fail('Ollama connection error');
            throw error;
        }
    }
    // 初始化聊天管理器
    async initializeChatManager() {
        if (!this.ollamaProvider) {
            await this.initializeOllamaProvider();
        }
        this.chatManager = new ChatManager_1.ChatManager(this.ollamaProvider, this.configManager, this.logger);
    }
    // 显示欢迎信息
    displayWelcomeMessage() {
        console.log(chalk_1.default.cyan('\n🤖 Welcome to AI CLI Chat!'));
        console.log(chalk_1.default.gray('Type your message and press Enter to chat with AI.'));
        console.log(chalk_1.default.gray('Commands: /help, /exit, /clear, /save, /load'));
        console.log(chalk_1.default.gray('Press Ctrl+C to exit.\n'));
    }
}
exports.CLIApplication = CLIApplication;
//# sourceMappingURL=CLIApplication.js.map