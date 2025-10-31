"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
// 聊天管理器实现
const readline_1 = __importDefault(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const uuid_1 = require("uuid");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const UIManager_1 = require("../ui/UIManager");
const FileEditService_1 = require("../services/FileEditService");
class ChatManager {
    constructor(ollamaProvider, configManager, logger) {
        this.currentSession = null;
        this.rl = null;
        // 添加等待响应状态标志
        this.isWaitingForResponse = false;
        this.ollamaProvider = ollamaProvider;
        this.configManager = configManager;
        this.logger = logger;
        // 初始化UI管理器
        this.uiManager = new UIManager_1.UIManager(configManager);
        // 初始化文件编辑服务
        this.fileEditService = new FileEditService_1.FileEditService(configManager, logger);
        // 设置会话存储目录
        this.sessionsDir = path_1.default.join(os_1.default.homedir(), '.ai-cli-chat', 'sessions');
        this.ensureSessionsDirectory();
    }
    // 启动聊天会话
    async startSession(_options) {
        try {
            // 显示界面
            this.uiManager.displayInterface();
            // 创建新会话
            this.currentSession = this.createNewSession();
            // 设置readline接口
            this.setupReadlineInterface();
            // 开始聊天循环
            await this.startChatLoop();
        }
        catch (error) {
            this.logger.error('Failed to start chat session:', error);
            throw error;
        }
    }
    // 创建新会话
    createNewSession() {
        const session = {
            id: (0, uuid_1.v4)(),
            startTime: new Date(),
            messages: [],
            context: {
                workingDirectory: process.cwd(),
                preferences: {
                    language: this.configManager.getConfig().codeGeneration.defaultLanguage,
                    framework: this.configManager.getConfig().codeGeneration.defaultFramework || undefined,
                    autoExecute: false
                }
            },
            metadata: {
                totalMessages: 0,
                lastActivity: new Date()
            }
        };
        this.logger.debug(`Created new session: ${session.id}`);
        return session;
    }
    // 设置readline接口
    setupReadlineInterface() {
        this.rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk_1.default.cyan('> ')
        });
        // 处理Ctrl+C
        this.rl.on('SIGINT', () => {
            this.handleExit();
        });
        // 处理输入
        this.rl.on('line', async (input) => {
            // 如果正在等待响应，忽略输入
            if (this.isWaitingForResponse) {
                this.uiManager.displayWaitingMessage();
                return;
            }
            await this.handleUserInput(input.trim());
        });
    }
    // 开始聊天循环
    async startChatLoop() {
        if (!this.rl || !this.currentSession) {
            throw new Error('Chat session not properly initialized');
        }
        this.uiManager.displayStartupMessage();
        this.rl.prompt();
    }
    // 处理用户输入
    async handleUserInput(input) {
        if (!this.currentSession || !this.rl) {
            return;
        }
        // 处理空输入
        if (!input) {
            this.rl.prompt();
            return;
        }
        // 处理命令
        if (input.startsWith('/')) {
            await this.handleCommand(input);
            return;
        }
        try {
            // 设置等待响应状态
            this.isWaitingForResponse = true;
            // 添加用户消息到会话
            const userMessage = {
                id: (0, uuid_1.v4)(),
                role: 'user',
                content: input,
                timestamp: new Date()
            };
            this.currentSession.messages.push(userMessage);
            this.updateSessionMetadata();
            // 显示用户消息
            this.uiManager.displayUserMessage(input);
            // 显示AI响应开始
            this.uiManager.displayAIMessageStart();
            // 获取AI响应
            let assistantResponse = '';
            const chatStream = this.ollamaProvider.chat(this.currentSession.messages, {
                systemPrompt: this.getSystemPrompt()
            });
            for await (const chunk of chatStream) {
                if (chunk.message && chunk.message.content) {
                    this.uiManager.displayAIMessageChunk(chunk.message.content);
                    assistantResponse += chunk.message.content;
                }
            }
            // 显示AI响应结束
            this.uiManager.displayAIMessageEnd();
            // 添加AI响应到会话
            const assistantMessage = {
                id: (0, uuid_1.v4)(),
                role: 'assistant',
                content: assistantResponse,
                timestamp: new Date()
            };
            this.currentSession.messages.push(assistantMessage);
            this.updateSessionMetadata();
            // 自动保存会话
            await this.saveCurrentSession();
        }
        catch (error) {
            this.logger.error('Error processing user input:', error);
            this.uiManager.displayError('Sorry, I encountered an error. Please try again.');
        }
        finally {
            // 重置等待响应状态
            this.isWaitingForResponse = false;
        }
        this.rl.prompt();
    }
    // 处理命令
    async handleCommand(command) {
        const [cmd] = command.slice(1).split(' ');
        switch (cmd?.toLowerCase()) {
            case 'help':
                this.showHelp();
                break;
            case 'exit':
            case 'quit':
                this.handleExit();
                break;
            case 'clear':
                await this.clearSession();
                break;
            case 'save':
                await this.saveCurrentSession();
                console.log(chalk_1.default.green('✅ Session saved successfully'));
                break;
            case 'models':
                await this.showModels();
                break;
            case 'config':
                this.showConfig();
                break;
            case 'history':
                await this.showSessionHistory();
                break;
            case 'edit':
                await this.handleFileEdit(command);
                break;
            case 'read':
                await this.handleFileRead(command);
                break;
            case 'write':
                await this.handleFileWrite(command);
                break;
            case 'delete':
                await this.handleFileDelete(command);
                break;
            default:
                console.log(chalk_1.default.yellow(`❓ Unknown command: ${cmd}. Type /help for available commands.`));
        }
        if (this.rl) {
            this.rl.prompt();
        }
    }
    // 显示帮助信息
    showHelp() {
        this.uiManager.displayHelp();
    }
    // 显示可用模型
    async showModels() {
        try {
            const progress = this.logger.createProgress('Fetching available models...');
            progress.start();
            const models = await this.ollamaProvider.listModels();
            progress.succeed('Models fetched successfully');
            this.uiManager.displayModels(models, this.configManager.getConfig().ollama.model);
        }
        catch (error) {
            this.uiManager.displayError(`Failed to fetch models: ${error}`);
        }
    }
    // 显示配置
    showConfig() {
        this.uiManager.displayConfig();
    }
    // 清除会话
    async clearSession() {
        if (this.currentSession) {
            this.currentSession.messages = [];
            this.updateSessionMetadata();
            console.log(chalk_1.default.green('✅ Chat history cleared'));
        }
    }
    // 显示会话历史
    async showSessionHistory() {
        if (!this.currentSession) {
            this.uiManager.displaySessionHistory([]);
            return;
        }
        this.uiManager.displaySessionHistory(this.currentSession.messages);
    }
    // 处理退出
    handleExit() {
        this.uiManager.displayExitMessage();
        if (this.currentSession) {
            this.saveCurrentSession().then(() => {
                this.uiManager.displayGoodbyeMessage();
                process.exit(0);
            }).catch((error) => {
                this.logger.error('Failed to save session:', error);
                process.exit(1);
            });
        }
        else {
            this.uiManager.displayGoodbyeMessage();
            process.exit(0);
        }
    }
    // 获取系统提示
    getSystemPrompt() {
        return `You are an AI assistant specialized in helping developers with coding tasks. You can:
1. Generate code in various programming languages
2. Review and analyze code for issues
3. Explain code functionality
4. Suggest improvements and best practices
5. Help with debugging and troubleshooting

Be helpful, concise, and provide practical solutions. When generating code, include comments and follow best practices.`;
    }
    // 更新会话元数据
    updateSessionMetadata() {
        if (this.currentSession) {
            this.currentSession.metadata.totalMessages = this.currentSession.messages.length;
            this.currentSession.metadata.lastActivity = new Date();
        }
    }
    // 保存当前会话
    async saveCurrentSession() {
        if (!this.currentSession) {
            return;
        }
        try {
            const sessionFile = path_1.default.join(this.sessionsDir, `${this.currentSession.id}.json`);
            await fs_extra_1.default.writeFile(sessionFile, JSON.stringify(this.currentSession, null, 2));
            this.logger.debug(`Session saved: ${sessionFile}`);
        }
        catch (error) {
            this.logger.error('Failed to save session:', error);
        }
    }
    // 确保会话目录存在
    async ensureSessionsDirectory() {
        try {
            await fs_extra_1.default.ensureDir(this.sessionsDir);
        }
        catch (error) {
            this.logger.error('Failed to create sessions directory:', error);
        }
    }
    // 列出会话
    async listSessions() {
        try {
            const files = await fs_extra_1.default.readdir(this.sessionsDir);
            const sessionFiles = files.filter(file => file.endsWith('.json'));
            if (sessionFiles.length === 0) {
                console.log(chalk_1.default.yellow('📝 No saved sessions found'));
                return;
            }
            console.log(chalk_1.default.cyan('\n📚 Saved Sessions:'));
            for (const file of sessionFiles) {
                const sessionPath = path_1.default.join(this.sessionsDir, file);
                try {
                    const sessionData = await fs_extra_1.default.readFile(sessionPath, 'utf-8');
                    const session = JSON.parse(sessionData);
                    const messageCount = session.messages.length;
                    const startTime = new Date(session.startTime).toLocaleString();
                    console.log(chalk_1.default.gray(`  • ${session.id} (${messageCount} messages, ${startTime})`));
                }
                catch (error) {
                    this.logger.error(`Failed to read session ${file}:`, error);
                }
            }
            console.log();
        }
        catch (error) {
            this.logger.error('Failed to list sessions:', error);
        }
    }
    // 显示特定会话
    async showSession(sessionId) {
        try {
            const sessionPath = path_1.default.join(this.sessionsDir, `${sessionId}.json`);
            const sessionData = await fs_extra_1.default.readFile(sessionPath, 'utf-8');
            const session = JSON.parse(sessionData);
            console.log(chalk_1.default.cyan(`\n📖 Session: ${session.id}`));
            console.log(chalk_1.default.gray(`Started: ${new Date(session.startTime).toLocaleString()}`));
            console.log(chalk_1.default.gray(`Messages: ${session.messages.length}\n`));
            session.messages.forEach((message) => {
                const role = message.role === 'user' ? '👤 You' : '🤖 AI';
                const time = new Date(message.timestamp).toLocaleTimeString();
                console.log(chalk_1.default.blue(`[${time}] ${role}:`));
                console.log(message.content);
                console.log();
            });
        }
        catch (error) {
            console.log(chalk_1.default.red(`❌ Failed to load session ${sessionId}:`, error));
        }
    }
    // 删除会话
    async deleteSession(sessionId) {
        try {
            const sessionPath = path_1.default.join(this.sessionsDir, `${sessionId}.json`);
            await fs_extra_1.default.remove(sessionPath);
            console.log(chalk_1.default.green(`✅ Session ${sessionId} deleted successfully`));
        }
        catch (error) {
            console.log(chalk_1.default.red(`❌ Failed to delete session ${sessionId}:`, error));
        }
    }
    // 清除所有会话
    async clearAllSessions() {
        try {
            await fs_extra_1.default.emptyDir(this.sessionsDir);
            console.log(chalk_1.default.green('✅ All sessions cleared successfully'));
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Failed to clear sessions:', error));
        }
    }
    // 导出会话
    async exportSession(sessionId) {
        try {
            const sessionPath = path_1.default.join(this.sessionsDir, `${sessionId}.json`);
            const sessionData = await fs_extra_1.default.readFile(sessionPath, 'utf-8');
            const session = JSON.parse(sessionData);
            // 生成Markdown
            let markdown = `# Chat Session: ${session.id}\n\n`;
            markdown += `**Started:** ${new Date(session.startTime).toLocaleString()}\n`;
            markdown += `**Messages:** ${session.messages.length}\n\n`;
            session.messages.forEach((message) => {
                const role = message.role === 'user' ? 'User' : 'Assistant';
                const time = new Date(message.timestamp).toLocaleTimeString();
                markdown += `## ${role} (${time})\n\n`;
                markdown += `${message.content}\n\n`;
            });
            const exportPath = path_1.default.join(process.cwd(), `session-${sessionId}.md`);
            await fs_extra_1.default.writeFile(exportPath, markdown);
            console.log(chalk_1.default.green(`✅ Session exported to: ${exportPath}`));
        }
        catch (error) {
            console.log(chalk_1.default.red(`❌ Failed to export session ${sessionId}:`, error));
        }
    }
    // 处理文件编辑命令
    async handleFileEdit(command) {
        const parts = command.split(' ');
        if (parts.length < 2) {
            this.uiManager.displayError('Usage: /edit <filepath> [line_number] [new_content]');
            return;
        }
        const filePath = parts[1];
        if (!filePath) {
            this.uiManager.displayError('File path is required');
            return;
        }
        const lineNumber = parts[2] ? parseInt(parts[2]) : undefined;
        const newContent = parts.slice(3).join(' ');
        try {
            if (lineNumber && newContent) {
                // 替换指定行
                const result = await this.fileEditService.replaceLine(filePath, lineNumber, newContent);
                if (result.success) {
                    this.uiManager.displaySuccess(`Line ${lineNumber} updated in ${filePath}`);
                }
                else {
                    this.uiManager.displayError(result.error || 'Failed to edit file');
                }
            }
            else {
                // 显示文件信息
                const fileInfo = await this.fileEditService.getFileInfo(filePath);
                if (fileInfo.exists) {
                    console.log(chalk_1.default.cyan(`\n📄 File: ${filePath}`));
                    console.log(chalk_1.default.gray(`Size: ${fileInfo.size} bytes`));
                    console.log(chalk_1.default.gray(`Last modified: ${fileInfo.lastModified.toLocaleString()}`));
                    console.log(chalk_1.default.gray(`Readable: ${fileInfo.permissions.readable}`));
                    console.log(chalk_1.default.gray(`Writable: ${fileInfo.permissions.writable}`));
                }
                else {
                    this.uiManager.displayError(`File does not exist: ${filePath}`);
                }
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error editing file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 处理文件读取命令
    async handleFileRead(command) {
        const parts = command.split(' ');
        if (parts.length < 2) {
            this.uiManager.displayError('Usage: /read <filepath>');
            return;
        }
        const filePath = parts[1];
        if (!filePath) {
            this.uiManager.displayError('File path is required');
            return;
        }
        try {
            const content = await this.fileEditService.readFile(filePath);
            console.log(chalk_1.default.cyan(`\n📖 Content of ${filePath}:`));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(content);
            console.log(chalk_1.default.gray('─'.repeat(50)));
        }
        catch (error) {
            this.uiManager.displayError(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 处理文件写入命令
    async handleFileWrite(command) {
        const parts = command.split(' ');
        if (parts.length < 3) {
            this.uiManager.displayError('Usage: /write <filepath> <content>');
            return;
        }
        const filePath = parts[1];
        if (!filePath) {
            this.uiManager.displayError('File path is required');
            return;
        }
        const content = parts.slice(2).join(' ');
        try {
            const result = await this.fileEditService.writeFile(filePath, content);
            if (result.success) {
                this.uiManager.displaySuccess(result.message);
                if (result.backupPath) {
                    console.log(chalk_1.default.gray(`Backup created: ${result.backupPath}`));
                }
            }
            else {
                this.uiManager.displayError(result.error || 'Failed to write file');
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error writing file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 处理文件删除命令
    async handleFileDelete(command) {
        const parts = command.split(' ');
        if (parts.length < 2) {
            this.uiManager.displayError('Usage: /delete <filepath>');
            return;
        }
        const filePath = parts[1];
        if (!filePath) {
            this.uiManager.displayError('File path is required');
            return;
        }
        try {
            const result = await this.fileEditService.deleteFile(filePath);
            if (result.success) {
                this.uiManager.displaySuccess(result.message);
                if (result.backupPath) {
                    console.log(chalk_1.default.gray(`Backup created: ${result.backupPath}`));
                }
            }
            else {
                this.uiManager.displayError(result.error || 'Failed to delete file');
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error deleting file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 清理资源
    async cleanup() {
        if (this.rl) {
            this.rl.close();
        }
        if (this.currentSession) {
            await this.saveCurrentSession();
        }
    }
}
exports.ChatManager = ChatManager;
//# sourceMappingURL=ChatManager.js.map