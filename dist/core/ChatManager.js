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
const DocumentService_1 = require("../services/DocumentService");
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
        // 初始化文档服务
        this.documentService = new DocumentService_1.DocumentService(configManager, logger);
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
            // 检查是否需要文档上下文并增强消息
            const enhancedInput = await this.enhanceMessageWithDocumentContext(input);
            // 添加用户消息到会话
            const userMessage = {
                id: (0, uuid_1.v4)(),
                role: 'user',
                content: enhancedInput,
                timestamp: new Date()
            };
            this.currentSession.messages.push(userMessage);
            this.updateSessionMetadata();
            // 显示用户消息（显示原始输入）
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
            // 检查是否需要保存AI响应到文件
            await this.handleAIResponseSaving(input, assistantResponse);
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
            case 'doc':
                await this.handleDocumentCommand(command);
                break;
            case 'search':
                await this.handleDocumentSearch(command);
                break;
            case 'convert':
                await this.handleDocumentConvert(command);
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
6. Read and modify documents and files

When the user requests to modify, edit, update, or rewrite documents/files:
- The system will automatically provide the current content of relevant files in the message context
- You should base your modifications on the provided file content
- You cannot directly read or write files - you can only suggest changes based on the provided context
- When suggesting file modifications, provide clear, specific instructions or complete updated content
- Always acknowledge the current content when making suggestions

When generating code or content that should be saved to files:
- Use proper code blocks with language specification
- The system will automatically detect and save code blocks to appropriate files
- If the user specifies a filename, the content will be saved to that file
- Multiple code blocks will be saved as separate files with appropriate extensions

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
    // 处理文档命令
    async handleDocumentCommand(command) {
        const parts = command.split(' ');
        if (parts.length < 3) {
            this.uiManager.displayError('Usage: /doc <read|write> <filepath> [content]');
            return;
        }
        const action = parts[1];
        const filePath = parts[2];
        if (!filePath) {
            this.uiManager.displayError('File path is required');
            return;
        }
        try {
            switch (action) {
                case 'read':
                    await this.handleDocumentRead(filePath);
                    break;
                case 'write':
                    const content = parts.slice(3).join(' ');
                    if (!content) {
                        this.uiManager.displayError('Content is required for write operation');
                        return;
                    }
                    await this.handleDocumentWrite(filePath, content);
                    break;
                default:
                    this.uiManager.displayError('Invalid action. Use "read" or "write"');
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error processing document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 处理文档读取
    async handleDocumentRead(filePath) {
        try {
            const result = await this.documentService.readDocument(filePath);
            if (result.success) {
                console.log(chalk_1.default.cyan(`\n📄 Document: ${filePath}`));
                console.log(chalk_1.default.gray(`Format: ${result.metadata?.format}`));
                console.log(chalk_1.default.gray(`Size: ${result.metadata?.size} bytes`));
                console.log(chalk_1.default.gray(`Last modified: ${result.metadata?.lastModified?.toLocaleString()}`));
                if (result.metadata?.structure) {
                    console.log(chalk_1.default.gray(`Structure: ${JSON.stringify(result.metadata.structure, null, 2)}`));
                }
                console.log(chalk_1.default.gray('─'.repeat(50)));
                // 根据格式显示内容
                if (result.metadata?.format === 'markdown') {
                    const mdContent = result.content;
                    if (mdContent.frontmatter) {
                        console.log(chalk_1.default.blue('Frontmatter:'));
                        console.log(JSON.stringify(mdContent.frontmatter, null, 2));
                        console.log();
                    }
                    console.log(chalk_1.default.white(mdContent.content));
                    if (mdContent.headings.length > 0) {
                        console.log(chalk_1.default.blue('\nHeadings:'));
                        mdContent.headings.forEach((h) => {
                            console.log(`${'  '.repeat(h.level - 1)}${h.level}. ${h.text}`);
                        });
                    }
                }
                else if (result.metadata?.format === 'json') {
                    console.log(JSON.stringify(result.content.data, null, 2));
                }
                else if (result.metadata?.format === 'yaml') {
                    console.log(JSON.stringify(result.content.data, null, 2));
                }
                else {
                    console.log(result.content);
                }
                console.log(chalk_1.default.gray('─'.repeat(50)));
            }
            else {
                this.uiManager.displayError(result.error || 'Failed to read document');
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error reading document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 处理文档写入
    async handleDocumentWrite(filePath, content) {
        try {
            // 尝试解析内容为JSON
            let parsedContent;
            try {
                parsedContent = JSON.parse(content);
            }
            catch {
                parsedContent = content;
            }
            const result = await this.documentService.writeDocument(filePath, parsedContent);
            if (result.success) {
                this.uiManager.displaySuccess(result.message);
                if (result.metadata) {
                    console.log(chalk_1.default.gray(`Format: ${result.metadata.format}`));
                    console.log(chalk_1.default.gray(`Size: ${result.metadata.size} bytes`));
                }
            }
            else {
                this.uiManager.displayError(result.error || 'Failed to write document');
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error writing document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 处理文档搜索
    async handleDocumentSearch(command) {
        const parts = command.split(' ');
        if (parts.length < 3) {
            this.uiManager.displayError('Usage: /search <filepath> <query> [--case-sensitive]');
            return;
        }
        const filePath = parts[1];
        const query = parts[2];
        const caseSensitive = parts.includes('--case-sensitive');
        if (!filePath || !query) {
            this.uiManager.displayError('File path and query are required');
            return;
        }
        try {
            const result = await this.documentService.searchInDocument(filePath, query, { caseSensitive });
            if (result.success) {
                const matches = result.content;
                console.log(chalk_1.default.cyan(`\n🔍 Search results for "${query}" in ${filePath}:`));
                console.log(chalk_1.default.gray(`Found ${matches.length} matches`));
                console.log(chalk_1.default.gray('─'.repeat(50)));
                matches.forEach((match, index) => {
                    console.log(chalk_1.default.yellow(`${index + 1}. Line ${match.line}:`));
                    console.log(`   ${match.text}`);
                    console.log();
                });
                console.log(chalk_1.default.gray('─'.repeat(50)));
            }
            else {
                this.uiManager.displayError(result.error || 'Search failed');
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error searching document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 处理文档转换
    async handleDocumentConvert(command) {
        const parts = command.split(' ');
        if (parts.length < 4) {
            this.uiManager.displayError('Usage: /convert <source> <target> <format>');
            return;
        }
        const sourcePath = parts[1];
        const targetPath = parts[2];
        const targetFormat = parts[3];
        if (!sourcePath || !targetPath || !targetFormat) {
            this.uiManager.displayError('Source path, target path, and format are required');
            return;
        }
        try {
            const result = await this.documentService.convertDocument(sourcePath, targetPath, targetFormat);
            if (result.success) {
                this.uiManager.displaySuccess(`Document converted successfully to ${targetFormat}`);
                if (result.metadata) {
                    console.log(chalk_1.default.gray(`Target size: ${result.metadata.size} bytes`));
                }
            }
            else {
                this.uiManager.displayError(result.error || 'Conversion failed');
            }
        }
        catch (error) {
            this.uiManager.displayError(`Error converting document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 增强消息，添加文档上下文
    async enhanceMessageWithDocumentContext(message) {
        try {
            // 检测消息中是否包含文档操作关键词
            const documentKeywords = [
                '修改', '编辑', '更新', '改写', '重写', '调整',
                'modify', 'edit', 'update', 'rewrite', 'change',
                '文档', '文件', 'document', 'file',
                '内容', 'content'
            ];
            const hasDocumentOperation = documentKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
            if (!hasDocumentOperation) {
                return message;
            }
            // 提取可能的文件路径
            const filePaths = this.extractFilePaths(message);
            if (filePaths.length === 0) {
                return message;
            }
            let enhancedMessage = message + '\n\n--- 文档上下文 ---\n';
            for (const filePath of filePaths) {
                try {
                    // 尝试读取文档
                    const docResult = await this.documentService.readDocument(filePath);
                    if (docResult.success) {
                        enhancedMessage += `\n文件: ${filePath}\n`;
                        enhancedMessage += `格式: ${docResult.metadata?.format}\n`;
                        enhancedMessage += `大小: ${docResult.metadata?.size} bytes\n`;
                        enhancedMessage += '内容:\n```\n';
                        // 根据格式处理内容
                        if (docResult.metadata?.format === 'markdown') {
                            const mdContent = docResult.content;
                            if (mdContent.frontmatter) {
                                enhancedMessage += '---\n';
                                enhancedMessage += JSON.stringify(mdContent.frontmatter, null, 2);
                                enhancedMessage += '\n---\n';
                            }
                            enhancedMessage += mdContent.content;
                        }
                        else if (docResult.metadata?.format === 'json') {
                            enhancedMessage += JSON.stringify(docResult.content.data, null, 2);
                        }
                        else if (docResult.metadata?.format === 'yaml') {
                            enhancedMessage += JSON.stringify(docResult.content.data, null, 2);
                        }
                        else {
                            enhancedMessage += docResult.content;
                        }
                        enhancedMessage += '\n```\n';
                    }
                    else {
                        // 如果文档服务失败，尝试文件编辑服务
                        try {
                            const fileContent = await this.fileEditService.readFile(filePath);
                            enhancedMessage += `\n文件: ${filePath}\n`;
                            enhancedMessage += '内容:\n```\n';
                            enhancedMessage += fileContent;
                            enhancedMessage += '\n```\n';
                        }
                        catch (fileError) {
                            this.logger.warn(`无法读取文件 ${filePath}:`, fileError);
                        }
                    }
                }
                catch (error) {
                    this.logger.warn(`处理文件 ${filePath} 时出错:`, error);
                }
            }
            enhancedMessage += '\n--- 请基于上述文档内容进行操作 ---\n';
            this.logger.info('消息已增强文档上下文', {
                originalLength: message.length,
                enhancedLength: enhancedMessage.length,
                filesIncluded: filePaths.length
            });
            return enhancedMessage;
        }
        catch (error) {
            this.logger.error('增强消息上下文时出错:', error);
            return message;
        }
    }
    // 从消息中提取文件路径
    extractFilePaths(message) {
        const filePaths = [];
        // 常见的文件路径模式
        const patterns = [
            // 相对路径和绝对路径
            /(?:^|\s)([./~]?[\w\-./]+\.(?:md|json|yaml|yml|txt|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|config|conf))\b/gi,
            // 引号包围的路径
            /["']([^"']+\.(?:md|json|yaml|yml|txt|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|config|conf))["']/gi,
            // 反引号包围的路径
            /`([^`]+\.(?:md|json|yaml|yml|txt|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|config|conf))`/gi
        ];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(message)) !== null) {
                if (match[1]) {
                    const filePath = match[1].trim();
                    if (!filePaths.includes(filePath)) {
                        filePaths.push(filePath);
                    }
                }
            }
        }
        // 检查当前目录下的常见文件
        const commonFiles = [
            'README.md', 'package.json', 'tsconfig.json', 'config.json',
            'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'
        ];
        for (const file of commonFiles) {
            if (message.toLowerCase().includes(file.toLowerCase()) && !filePaths.includes(file)) {
                filePaths.push(file);
            }
        }
        return filePaths;
    }
    // 处理AI响应保存
    async handleAIResponseSaving(userInput, aiResponse) {
        try {
            // 检测是否需要保存到文件
            const saveKeywords = [
                '保存', '写入', '创建', '生成', '输出',
                'save', 'write', 'create', 'generate', 'output',
                '文件', '文档', 'file', 'document'
            ];
            const needsSaving = saveKeywords.some(keyword => userInput.toLowerCase().includes(keyword.toLowerCase()));
            if (!needsSaving) {
                return;
            }
            // 提取文件路径
            const filePaths = this.extractFilePaths(userInput);
            // 如果没有明确的文件路径，尝试从AI响应中提取代码块或内容
            if (filePaths.length === 0) {
                await this.saveAIResponseContent(userInput, aiResponse);
                return;
            }
            // 如果有明确的文件路径，保存到指定文件
            for (const filePath of filePaths) {
                await this.saveToSpecificFile(filePath, aiResponse);
            }
        }
        catch (error) {
            this.logger.error('处理AI响应保存时出错:', error);
        }
    }
    // 保存AI响应内容到文件
    async saveAIResponseContent(userInput, aiResponse) {
        try {
            // 提取代码块
            const codeBlocks = this.extractCodeBlocks(aiResponse);
            if (codeBlocks.length > 0) {
                for (let i = 0; i < codeBlocks.length; i++) {
                    const block = codeBlocks[i];
                    if (block) {
                        const fileName = this.generateFileName(block.language, userInput, i);
                        const result = await this.fileEditService.writeFile(fileName, block.content);
                        if (result.success) {
                            console.log(chalk_1.default.green(`\n✅ 代码已保存到: ${fileName}`));
                            if (result.backupPath) {
                                console.log(chalk_1.default.gray(`备份文件: ${result.backupPath}`));
                            }
                        }
                        else {
                            console.log(chalk_1.default.red(`❌ 保存失败: ${result.error}`));
                        }
                    }
                }
            }
            else {
                // 如果没有代码块，保存整个响应
                const fileName = this.generateFileName('txt', userInput, 0);
                const result = await this.fileEditService.writeFile(fileName, aiResponse);
                if (result.success) {
                    console.log(chalk_1.default.green(`\n✅ 响应已保存到: ${fileName}`));
                }
            }
        }
        catch (error) {
            this.logger.error('保存AI响应内容时出错:', error);
        }
    }
    // 保存到指定文件
    async saveToSpecificFile(filePath, aiResponse) {
        try {
            // 提取代码块或使用整个响应
            const codeBlocks = this.extractCodeBlocks(aiResponse);
            let contentToSave = aiResponse;
            if (codeBlocks.length > 0) {
                // 如果有代码块，优先使用第一个代码块
                const primaryBlock = codeBlocks.find(block => this.isLanguageMatch(block.language, filePath)) || codeBlocks[0];
                if (primaryBlock) {
                    contentToSave = primaryBlock.content;
                }
            }
            const result = await this.fileEditService.writeFile(filePath, contentToSave);
            if (result.success) {
                console.log(chalk_1.default.green(`\n✅ 内容已保存到: ${filePath}`));
                if (result.backupPath) {
                    console.log(chalk_1.default.gray(`备份文件: ${result.backupPath}`));
                }
            }
            else {
                console.log(chalk_1.default.red(`❌ 保存失败: ${result.error}`));
            }
        }
        catch (error) {
            this.logger.error(`保存到文件 ${filePath} 时出错:`, error);
        }
    }
    // 提取代码块
    extractCodeBlocks(content) {
        const codeBlocks = [];
        // 匹配代码块 ```language\ncontent\n```
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockRegex.exec(content)) !== null) {
            const language = match[1] || 'text';
            const blockContent = match[2]?.trim();
            if (blockContent) {
                codeBlocks.push({
                    language,
                    content: blockContent
                });
            }
        }
        return codeBlocks;
    }
    // 生成文件名
    generateFileName(language, userInput, index) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        // 从用户输入中提取可能的文件名
        const fileNameMatch = userInput.match(/(?:创建|生成|写入|保存).*?([a-zA-Z0-9_-]+)(?:\.(\w+))?/);
        let baseName = fileNameMatch ? fileNameMatch[1] : 'ai-generated';
        // 根据语言确定扩展名
        const extensions = {
            'javascript': 'js',
            'typescript': 'ts',
            'python': 'py',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yml',
            'markdown': 'md',
            'md': 'md',
            'txt': 'txt',
            'text': 'txt'
        };
        const extension = extensions[language.toLowerCase()] || 'txt';
        const suffix = index > 0 ? `-${index}` : '';
        return `${baseName}${suffix}-${timestamp}.${extension}`;
    }
    // 检查语言是否匹配文件扩展名
    isLanguageMatch(language, filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        if (!ext)
            return false;
        const languageMap = {
            'javascript': ['js', 'jsx'],
            'typescript': ['ts', 'tsx'],
            'python': ['py'],
            'java': ['java'],
            'cpp': ['cpp', 'cc', 'cxx'],
            'c': ['c', 'h'],
            'html': ['html', 'htm'],
            'css': ['css'],
            'json': ['json'],
            'yaml': ['yaml', 'yml'],
            'markdown': ['md', 'markdown'],
            'text': ['txt']
        };
        const extensions = languageMap[language.toLowerCase()] || [];
        return extensions.includes(ext);
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