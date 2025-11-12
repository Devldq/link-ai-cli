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
            // 首先分析用户意图并提供方案选择
            const intentAnalysis = await this.analyzeUserIntent(input);
            if (intentAnalysis.needsOptions) {
                // 显示方案选择
                const selectedOption = await this.presentOptionsToUser(intentAnalysis);
                if (!selectedOption) {
                    console.log(chalk_1.default.yellow('\n❌ 操作已取消'));
                    return;
                }
                // 根据选择的方案执行操作
                await this.executeSelectedOption(selectedOption, input);
            }
            else {
                // 直接处理普通对话
                await this.handleDirectConversation(input);
            }
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

When the user requests code review (CR), modification, or improvement of existing files:
- The system will automatically provide the current content of relevant files in the message context
- You should base your modifications on the provided file content
- Analyze the code thoroughly and provide specific improvement suggestions
- When providing modified code, include the complete updated file content in a code block
- Use clear indicators like "修改后的代码:" or "Updated code:" before code blocks
- Explain what changes were made and why they improve the code

When generating new code or content that should be saved to files:
- Use proper code blocks with language specification
- The system will automatically detect and save code blocks to appropriate files
- If the user specifies a filename, the content will be saved to that file
- Multiple code blocks will be saved as separate files with appropriate extensions

For code modifications:
- The system will ask for user confirmation before applying changes to existing files
- Backup files are automatically created before modifications
- A modification summary will be shown after successful changes

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
            // 检测是否是代码审查或修改请求
            const isCodeReviewOrModification = this.isCodeReviewOrModificationRequest(userInput);
            // 检测是否需要保存到文件
            const saveKeywords = [
                '保存', '写入', '创建', '生成', '输出', '修改', '更新', '改写', '实现', '开发',
                'save', 'write', 'create', 'generate', 'output', 'modify', 'update', 'rewrite', 'implement', 'develop',
                '文件', '文档', '代码', '脚本', 'file', 'document', 'code', 'script'
            ];
            const needsSaving = saveKeywords.some(keyword => userInput.toLowerCase().includes(keyword.toLowerCase())) || isCodeReviewOrModification || this.containsCodeBlocks(aiResponse) || this.isCodeGenerationRequest(userInput);
            if (!needsSaving) {
                return;
            }
            // 提取文件路径
            const filePaths = this.extractFilePaths(userInput);
            // 如果是代码审查或修改请求，且有文件路径，直接保存到原文件
            if (isCodeReviewOrModification && filePaths.length > 0) {
                await this.handleCodeModificationSaving(filePaths, aiResponse, userInput);
                return;
            }
            // 智能检测项目文件结构并自动保存
            await this.intelligentSaving(userInput, aiResponse, filePaths);
        }
        catch (error) {
            this.logger.error('处理AI响应保存时出错:', error);
        }
    }
    // 自动保存到项目
    async autoSaveToProject(userInput, aiResponse) {
        try {
            // 提取代码块
            const codeBlocks = this.extractCodeBlocks(aiResponse);
            if (codeBlocks.length === 0) {
                // 如果没有代码块，检查是否是配置文件或文档
                await this.saveNonCodeContent(userInput, aiResponse);
                return;
            }
            // 检测项目结构
            const projectStructure = await this.detectProjectStructure();
            // 为每个代码块智能选择保存位置
            for (let i = 0; i < codeBlocks.length; i++) {
                const block = codeBlocks[i];
                if (block) {
                    const targetPath = await this.determineTargetPath(block, userInput, projectStructure, i);
                    // 确保目录存在
                    await this.ensureDirectoryExists(targetPath);
                    const result = await this.fileEditService.writeFile(targetPath, block.content);
                    if (result.success) {
                        console.log(chalk_1.default.green(`\n✅ 代码已保存到: ${targetPath}`));
                        if (result.backupPath) {
                            console.log(chalk_1.default.gray(`📁 备份文件: ${result.backupPath}`));
                        }
                    }
                    else {
                        console.log(chalk_1.default.red(`❌ 保存失败: ${result.error}`));
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('自动保存到项目时出错:', error);
        }
    }
    // 检测项目结构
    async detectProjectStructure() {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const cwd = process.cwd();
            const structure = {
                hasPackageJson: false,
                hasSrcDir: false,
                hasLibDir: false,
                hasTestDir: false,
                hasDocsDir: false,
                hasConfigFiles: false,
                projectType: 'unknown'
            };
            // 检查常见文件和目录
            const files = await fs.readdir(cwd);
            structure.hasPackageJson = files.includes('package.json');
            structure.hasSrcDir = files.includes('src');
            structure.hasLibDir = files.includes('lib');
            structure.hasTestDir = files.includes('test') || files.includes('tests') || files.includes('__tests__');
            structure.hasDocsDir = files.includes('docs') || files.includes('documentation');
            structure.hasConfigFiles = files.some((file) => file.includes('config') || file.includes('.config') || file.endsWith('.json'));
            // 判断项目类型
            if (structure.hasPackageJson) {
                const packageJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf8'));
                if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
                    structure.projectType = 'react';
                }
                else if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
                    structure.projectType = 'vue';
                }
                else if (packageJson.dependencies?.express || packageJson.devDependencies?.express) {
                    structure.projectType = 'node';
                }
                else {
                    structure.projectType = 'javascript';
                }
            }
            return structure;
        }
        catch (error) {
            this.logger.warn('检测项目结构时出错:', error);
            return { projectType: 'unknown' };
        }
    }
    // 确定目标路径
    async determineTargetPath(block, userInput, projectStructure, index) {
        const path = require('path');
        // 智能检测文件类型
        const detectedLanguage = this.detectLanguageFromContent(block.content, userInput);
        const language = block.language || detectedLanguage;
        const baseName = this.extractFileNameFromInput(userInput) || this.generateBaseName(userInput, index);
        // 根据文件类型和项目结构确定目录
        let targetDir = process.cwd();
        if (projectStructure.hasSrcDir) {
            switch (language) {
                case 'javascript':
                case 'js':
                case 'typescript':
                case 'ts':
                case 'jsx':
                case 'tsx':
                    targetDir = path.join(process.cwd(), 'src');
                    // 进一步细分目录
                    if (userInput.includes('组件') || userInput.includes('component') ||
                        block.content.includes('export default') || block.content.includes('function Component')) {
                        targetDir = path.join(targetDir, 'components');
                    }
                    else if (userInput.includes('服务') || userInput.includes('service') ||
                        (block.content.includes('class') && block.content.includes('Service'))) {
                        targetDir = path.join(targetDir, 'services');
                    }
                    else if (userInput.includes('工具') || userInput.includes('util') || userInput.includes('helper')) {
                        targetDir = path.join(targetDir, 'utils');
                    }
                    break;
                case 'css':
                case 'scss':
                case 'less':
                    targetDir = path.join(process.cwd(), 'src', 'styles');
                    break;
                case 'html':
                    targetDir = path.join(process.cwd(), 'src', 'templates');
                    break;
            }
        }
        // 特殊文件类型处理
        if (language === 'json' && (baseName.includes('package') || baseName.includes('config'))) {
            targetDir = process.cwd();
        }
        if (language === 'md' || language === 'markdown') {
            if (projectStructure.hasDocsDir) {
                targetDir = path.join(process.cwd(), 'docs');
            }
        }
        // 测试文件
        if (baseName.includes('test') || baseName.includes('spec')) {
            if (projectStructure.hasTestDir) {
                targetDir = path.join(process.cwd(), 'test');
            }
        }
        const extension = this.getFileExtension(language);
        const fileName = baseName.endsWith(extension) ? baseName : `${baseName}${extension}`;
        return path.join(targetDir, fileName);
    }
    // 确保目录存在
    async ensureDirectoryExists(filePath) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
        }
        catch (error) {
            this.logger.warn('创建目录时出错:', error);
        }
    }
    // 从用户输入中提取文件名
    extractFileNameFromInput(userInput) {
        // 匹配常见的文件名模式
        const patterns = [
            /(?:创建|生成|写|保存).*?([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/,
            /(?:create|generate|write|save).*?([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/i,
            /([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/
        ];
        for (const pattern of patterns) {
            const match = userInput.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }
    // 生成基础文件名
    generateBaseName(userInput, index) {
        // 从用户输入中提取可能的文件名
        const fileNameMatch = userInput.match(/(?:创建|生成|写入|保存).*?([a-zA-Z0-9_-]+)(?:\.(\\w+))?/);
        let baseName = (fileNameMatch && fileNameMatch[1]) ? fileNameMatch[1] : 'ai-generated';
        // 根据内容类型调整文件名
        if (userInput.includes('组件') || userInput.includes('component')) {
            baseName = baseName.includes('component') ? baseName : `${baseName}-component`;
        }
        else if (userInput.includes('服务') || userInput.includes('service')) {
            baseName = baseName.includes('service') ? baseName : `${baseName}-service`;
        }
        else if (userInput.includes('工具') || userInput.includes('util')) {
            baseName = baseName.includes('util') ? baseName : `${baseName}-util`;
        }
        else if (userInput.includes('配置') || userInput.includes('config')) {
            baseName = baseName.includes('config') ? baseName : `${baseName}-config`;
        }
        // 如果有多个代码块，添加索引
        if (index > 0) {
            baseName += `-${index + 1}`;
        }
        return baseName;
    }
    // 智能检测内容语言类型
    detectLanguageFromContent(content, userInput) {
        // 检测代码特征
        const codePatterns = [
            { pattern: /import\s+.*from\s+['"]/, language: 'javascript' },
            { pattern: /export\s+(default\s+)?/, language: 'javascript' },
            { pattern: /function\s+\w+\s*\(/, language: 'javascript' },
            { pattern: /const\s+\w+\s*=/, language: 'javascript' },
            { pattern: /let\s+\w+\s*=/, language: 'javascript' },
            { pattern: /var\s+\w+\s*=/, language: 'javascript' },
            { pattern: /interface\s+\w+/, language: 'typescript' },
            { pattern: /type\s+\w+\s*=/, language: 'typescript' },
            { pattern: /class\s+\w+/, language: 'typescript' },
            { pattern: /<\w+.*>/, language: 'jsx' },
            { pattern: /React\./, language: 'jsx' },
            { pattern: /useState|useEffect|useContext/, language: 'jsx' },
            { pattern: /def\s+\w+\s*\(/, language: 'python' },
            { pattern: /import\s+\w+/, language: 'python' },
            { pattern: /from\s+\w+\s+import/, language: 'python' },
            { pattern: /public\s+class\s+\w+/, language: 'java' },
            { pattern: /package\s+\w+/, language: 'java' },
            { pattern: /#include\s*</, language: 'cpp' },
            { pattern: /int\s+main\s*\(/, language: 'cpp' },
            { pattern: /\.[\w-]+\s*\{/, language: 'css' },
            { pattern: /@media\s*\(/, language: 'css' },
            { pattern: /\$[\w-]+\s*:/, language: 'scss' },
            { pattern: /<html|<head|<body|<div/, language: 'html' },
            { pattern: /<!DOCTYPE\s+html/, language: 'html' },
            { pattern: /^\s*\{[\s\S]*\}\s*$/, language: 'json' },
            { pattern: /^\s*[\w-]+\s*:/, language: 'yaml' },
            { pattern: /^#\s+/, language: 'markdown' },
            { pattern: /\[.*\]\(.*\)/, language: 'markdown' },
            { pattern: /```/, language: 'markdown' },
            { pattern: /^#!/, language: 'bash' },
            { pattern: /echo\s+/, language: 'bash' }
        ];
        // 检查内容特征
        for (const { pattern, language } of codePatterns) {
            if (pattern.test(content)) {
                return language;
            }
        }
        // 检查用户输入中的语言提示
        const languageHints = [
            { keywords: ['react', 'jsx', '组件'], language: 'jsx' },
            { keywords: ['typescript', 'ts', 'interface', 'type'], language: 'typescript' },
            { keywords: ['javascript', 'js'], language: 'javascript' },
            { keywords: ['python', 'py'], language: 'python' },
            { keywords: ['java'], language: 'java' },
            { keywords: ['css', '样式'], language: 'css' },
            { keywords: ['scss', 'sass'], language: 'scss' },
            { keywords: ['html', '网页'], language: 'html' },
            { keywords: ['json', '配置'], language: 'json' },
            { keywords: ['yaml', 'yml'], language: 'yaml' },
            { keywords: ['markdown', 'md', '文档'], language: 'markdown' },
            { keywords: ['bash', 'shell', '脚本'], language: 'bash' }
        ];
        const lowerInput = userInput.toLowerCase();
        for (const { keywords, language } of languageHints) {
            if (keywords.some(keyword => lowerInput.includes(keyword))) {
                return language;
            }
        }
        // 默认返回文本
        return 'txt';
    }
    // 保存非代码内容
    async saveNonCodeContent(userInput, aiResponse) {
        try {
            const path = require('path');
            // 智能检测内容类型
            const detectedLanguage = this.detectLanguageFromContent(aiResponse, userInput);
            let fileName = this.extractFileNameFromInput(userInput) || `ai-response${this.getFileExtension(detectedLanguage)}`;
            let targetDir = process.cwd();
            // 根据检测到的语言类型选择目录
            if (detectedLanguage === 'markdown' || detectedLanguage === 'md') {
                const docsDir = path.join(process.cwd(), 'docs');
                if (await this.directoryExists(docsDir)) {
                    targetDir = docsDir;
                }
            }
            else if (detectedLanguage === 'json' &&
                (fileName.includes('package') || fileName.includes('config'))) {
                targetDir = process.cwd();
            }
            const targetPath = path.join(targetDir, fileName);
            // 确保目录存在
            await this.ensureDirectoryExists(targetPath);
            const result = await this.fileEditService.writeFile(targetPath, aiResponse);
            if (result.success) {
                console.log(chalk_1.default.green(`\n✅ 内容已保存到: ${targetPath}`));
                if (result.backupPath) {
                    console.log(chalk_1.default.gray(`📁 备份文件: ${result.backupPath}`));
                }
            }
            else {
                console.log(chalk_1.default.red(`❌ 保存失败: ${result.error}`));
            }
        }
        catch (error) {
            this.logger.error('保存非代码内容时出错:', error);
        }
    }
    // 检查目录是否存在
    async directoryExists(dirPath) {
        try {
            const fs = require('fs').promises;
            const stat = await fs.stat(dirPath);
            return stat.isDirectory();
        }
        catch {
            return false;
        }
    }
    // 检查是否包含代码块
    containsCodeBlocks(text) {
        return /```[\s\S]*?```/.test(text);
    }
    // 检查是否是代码生成请求
    isCodeGenerationRequest(userInput) {
        const codeKeywords = [
            '写代码', '编程', '实现', '开发', '创建函数', '创建类', '创建组件',
            'write code', 'programming', 'implement', 'develop', 'create function', 'create class', 'create component'
        ];
        return codeKeywords.some(keyword => userInput.toLowerCase().includes(keyword.toLowerCase()));
    }
    // 智能保存功能
    async intelligentSaving(userInput, aiResponse, filePaths) {
        try {
            // 如果有明确的文件路径，保存到指定文件
            if (filePaths.length > 0) {
                for (const filePath of filePaths) {
                    await this.saveToSpecificFile(filePath, aiResponse);
                }
                return;
            }
            // 智能检测项目结构并自动保存
            await this.autoSaveToProject(userInput, aiResponse);
        }
        catch (error) {
            this.logger.error('智能保存时出错:', error);
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
            let language = match[1] || '';
            const blockContent = match[2]?.trim();
            if (blockContent) {
                // 如果没有指定语言，尝试从内容中检测
                if (!language) {
                    language = this.detectLanguageFromContent(blockContent, '');
                }
                codeBlocks.push({
                    language,
                    content: blockContent
                });
            }
        }
        // 如果没有找到代码块，但内容看起来像代码，创建一个代码块
        if (codeBlocks.length === 0 && this.looksLikeCode(content)) {
            const detectedLanguage = this.detectLanguageFromContent(content, '');
            codeBlocks.push({ language: detectedLanguage, content: content.trim() });
        }
        return codeBlocks;
    }
    // 检查文本是否看起来像代码
    looksLikeCode(text) {
        const codeIndicators = [
            /function\s+\w+\s*\(/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /import\s+.*from/,
            /export\s+(default\s+)?/,
            /class\s+\w+/,
            /interface\s+\w+/,
            /type\s+\w+\s*=/,
            /def\s+\w+\s*\(/,
            /public\s+class/,
            /#include\s*</,
            /\.[\w-]+\s*\{/,
            /<\w+.*>/,
            /\{[\s\S]*\}/,
            /^\s*[\w-]+\s*:/m
        ];
        return codeIndicators.some(pattern => pattern.test(text));
    }
    // 获取文件扩展名
    getFileExtension(language) {
        const extensions = {
            'javascript': '.js',
            'js': '.js',
            'typescript': '.ts',
            'ts': '.ts',
            'jsx': '.jsx',
            'tsx': '.tsx',
            'python': '.py',
            'py': '.py',
            'java': '.java',
            'cpp': '.cpp',
            'c++': '.cpp',
            'c': '.c',
            'go': '.go',
            'rust': '.rs',
            'php': '.php',
            'ruby': '.rb',
            'swift': '.swift',
            'kotlin': '.kt',
            'scala': '.scala',
            'html': '.html',
            'css': '.css',
            'scss': '.scss',
            'sass': '.sass',
            'less': '.less',
            'json': '.json',
            'yaml': '.yaml',
            'yml': '.yml',
            'xml': '.xml',
            'markdown': '.md',
            'md': '.md',
            'txt': '.txt',
            'sh': '.sh',
            'bash': '.sh',
            'zsh': '.zsh',
            'fish': '.fish',
            'powershell': '.ps1',
            'sql': '.sql',
            'dockerfile': 'Dockerfile',
            'makefile': 'Makefile'
        };
        return extensions[language.toLowerCase()] || '.txt';
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
    // 检测是否是代码审查或修改请求
    isCodeReviewOrModificationRequest(userInput) {
        const codeReviewKeywords = [
            'cr', 'code review', '代码审查', '审查代码', '检查代码',
            '修改', '改进', '优化', '重构', '更新', '调整',
            'modify', 'improve', 'optimize', 'refactor', 'update', 'fix',
            '帮我', '帮忙', 'help me', 'please help',
            '问题', '错误', 'issue', 'error', 'bug'
        ];
        return codeReviewKeywords.some(keyword => userInput.toLowerCase().includes(keyword.toLowerCase()));
    }
    // 处理代码修改保存
    async handleCodeModificationSaving(filePaths, aiResponse, _userInput) {
        try {
            // 询问用户是否要应用修改
            const shouldApply = await this.askUserConfirmation(filePaths, aiResponse);
            if (!shouldApply) {
                console.log(chalk_1.default.yellow('\n📝 修改建议已显示，但未应用到文件。'));
                console.log(chalk_1.default.gray('如需应用修改，请明确说明"应用修改"或"保存修改"。'));
                return;
            }
            // 应用修改到文件
            for (const filePath of filePaths) {
                await this.applyModificationToFile(filePath, aiResponse);
            }
        }
        catch (error) {
            this.logger.error('处理代码修改保存时出错:', error);
        }
    }
    // 询问用户确认
    async askUserConfirmation(filePaths, aiResponse) {
        // 检查AI响应中是否包含完整的文件内容或明确的修改指令
        const hasCompleteCode = this.hasCompleteFileContent(aiResponse);
        const hasModificationInstructions = this.hasModificationInstructions(aiResponse);
        if (!hasCompleteCode && !hasModificationInstructions) {
            return false;
        }
        console.log(chalk_1.default.cyan('\n🤔 检测到代码修改建议，是否要应用到文件？'));
        console.log(chalk_1.default.gray(`文件: ${filePaths.join(', ')}`));
        console.log(chalk_1.default.yellow('输入 "yes" 或 "应用" 来应用修改，其他任何输入将跳过保存。'));
        return new Promise((resolve) => {
            this.rl?.question(chalk_1.default.blue('是否应用修改? '), (answer) => {
                const confirmKeywords = ['yes', 'y', '是', '应用', '确认', 'apply', 'confirm'];
                const shouldApply = confirmKeywords.some(keyword => answer.toLowerCase().trim().includes(keyword.toLowerCase()));
                resolve(shouldApply);
            });
        });
    }
    // 检查是否包含完整的文件内容
    hasCompleteFileContent(aiResponse) {
        // 检查是否有代码块
        const codeBlocks = this.extractCodeBlocks(aiResponse);
        if (codeBlocks.length === 0) {
            return false;
        }
        // 检查代码块是否足够长（可能是完整文件）
        return codeBlocks.some(block => block.content.split('\n').length > 10);
    }
    // 检查是否包含修改指令
    hasModificationInstructions(aiResponse) {
        const modificationIndicators = [
            '修改后的代码', '更新后的代码', '改进后的代码',
            'modified code', 'updated code', 'improved code',
            '完整代码', 'complete code', 'full code',
            '替换为', 'replace with', '改为', 'change to'
        ];
        return modificationIndicators.some(indicator => aiResponse.toLowerCase().includes(indicator.toLowerCase()));
    }
    // 应用修改到文件
    async applyModificationToFile(filePath, aiResponse) {
        try {
            // 提取代码块
            const codeBlocks = this.extractCodeBlocks(aiResponse);
            if (codeBlocks.length === 0) {
                console.log(chalk_1.default.yellow(`⚠️  未在响应中找到代码块，跳过文件 ${filePath}`));
                return;
            }
            // 选择最合适的代码块
            const targetBlock = codeBlocks.find(block => this.isLanguageMatch(block.language, filePath)) || codeBlocks[0];
            if (!targetBlock) {
                console.log(chalk_1.default.yellow(`⚠️  未找到合适的代码块，跳过文件 ${filePath}`));
                return;
            }
            // 保存到文件
            const result = await this.fileEditService.writeFile(filePath, targetBlock.content, {
                backup: true
            });
            if (result.success) {
                console.log(chalk_1.default.green(`\n✅ 修改已应用到: ${filePath}`));
                if (result.backupPath) {
                    console.log(chalk_1.default.gray(`📦 备份文件: ${result.backupPath}`));
                }
                // 显示修改摘要
                this.showModificationSummary(filePath, result.originalContent || '', targetBlock.content);
            }
            else {
                console.log(chalk_1.default.red(`❌ 应用修改失败: ${result.error}`));
            }
        }
        catch (error) {
            this.logger.error(`应用修改到文件 ${filePath} 时出错:`, error);
            console.log(chalk_1.default.red(`❌ 应用修改时出错: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 显示修改摘要
    showModificationSummary(filePath, originalContent, newContent) {
        const originalLines = originalContent.split('\n').length;
        const newLines = newContent.split('\n').length;
        const lineDiff = newLines - originalLines;
        console.log(chalk_1.default.cyan('\n📊 修改摘要:'));
        console.log(chalk_1.default.gray(`文件: ${filePath}`));
        console.log(chalk_1.default.gray(`原始行数: ${originalLines}`));
        console.log(chalk_1.default.gray(`修改后行数: ${newLines}`));
        if (lineDiff > 0) {
            console.log(chalk_1.default.green(`增加了 ${lineDiff} 行`));
        }
        else if (lineDiff < 0) {
            console.log(chalk_1.default.red(`减少了 ${Math.abs(lineDiff)} 行`));
        }
        else {
            console.log(chalk_1.default.blue('行数未变化'));
        }
    }
    // 分析用户意图
    async analyzeUserIntent(input) {
        try {
            // 检测复杂操作关键词
            const complexOperationKeywords = [
                'cr', 'code review', '代码审查', '审查代码', '检查代码',
                '修改', '改进', '优化', '重构', '更新', '调整',
                'modify', 'improve', 'optimize', 'refactor', 'update', 'fix',
                '帮我', '帮忙', 'help me', 'please help',
                '创建', '生成', '写', '开发', 'create', 'generate', 'write', 'develop'
            ];
            const hasComplexOperation = complexOperationKeywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()));
            if (!hasComplexOperation) {
                return { needsOptions: false, intent: 'conversation' };
            }
            // 提取文件路径
            const filePaths = this.extractFilePaths(input);
            // 分析具体意图
            if (input.toLowerCase().includes('cr') || input.toLowerCase().includes('代码审查') || input.toLowerCase().includes('code review')) {
                return this.generateCodeReviewOptions(input, filePaths);
            }
            if (input.toLowerCase().includes('修改') || input.toLowerCase().includes('改进') || input.toLowerCase().includes('modify') || input.toLowerCase().includes('improve')) {
                return this.generateModificationOptions(input, filePaths);
            }
            if (input.toLowerCase().includes('创建') || input.toLowerCase().includes('生成') || input.toLowerCase().includes('create') || input.toLowerCase().includes('generate')) {
                return this.generateCreationOptions(input, filePaths);
            }
            if (input.toLowerCase().includes('帮我') || input.toLowerCase().includes('帮忙') || input.toLowerCase().includes('help me')) {
                return this.generateHelpOptions(input, filePaths);
            }
            return { needsOptions: false, intent: 'conversation' };
        }
        catch (error) {
            this.logger.error('分析用户意图时出错:', error);
            return { needsOptions: false, intent: 'conversation' };
        }
    }
    // 生成代码审查选项
    generateCodeReviewOptions(input, filePaths) {
        const options = [];
        if (filePaths.length > 0) {
            options.push({
                id: 'review_with_suggestions',
                title: '深度代码审查 + 改进建议',
                description: '分析代码质量、性能、安全性，并提供具体改进建议',
                action: 'code_review_detailed'
            });
            options.push({
                id: 'review_withctor',
                title: '代码审查 + 重构方案',
                description: '审查代码并提供重构后的完整代码',
                action: 'code_review_refactor'
            });
            options.push({
                id: 'review_security',
                title: '安全性审查',
                description: '专注于安全漏洞和潜在风险分析',
                action: 'security_review'
            });
            options.push({
                id: 'review_performance',
                title: '性能优化审查',
                description: '分析性能瓶颈并提供优化建议',
                action: 'performance_review'
            });
        }
        else {
            options.push({
                id: 'general_review',
                title: '通用代码审查指导',
                description: '提供代码审查的一般性建议和最佳实践',
                action: 'general_guidance'
            });
        }
        return {
            needsOptions: true,
            intent: 'code_review',
            options,
            context: { filePaths, originalInput: input }
        };
    }
    // 生成修改选项
    generateModificationOptions(input, filePaths) {
        const options = [];
        if (filePaths.length > 0) {
            options.push({
                id: 'modify_improve',
                title: '改进现有代码',
                description: '基于最佳实践改进代码质量和可读性',
                action: 'improve_code'
            });
            options.push({
                id: 'modify_fix',
                title: '修复问题',
                description: '识别并修复代码中的bug和问题',
                action: 'fix_issues'
            });
            options.push({
                id: 'modify_feature',
                title: '添加新功能',
                description: '在现有代码基础上添加新的功能',
                action: 'add_features'
            });
            options.push({
                id: 'modify_modernize',
                title: '现代化代码',
                description: '使用最新语法和模式更新代码',
                action: 'modernize_code'
            });
        }
        else {
            options.push({
                id: 'modify_guidance',
                title: '代码修改指导',
                description: '提供代码修改的一般性建议',
                action: 'modification_guidance'
            });
        }
        return {
            needsOptions: true,
            intent: 'modification',
            options,
            context: { filePaths, originalInput: input }
        };
    }
    // 生成创建选项
    generateCreationOptions(input, filePaths) {
        const options = [
            {
                id: 'create_from_scratch',
                title: '从零开始创建',
                description: '根据需求创建全新的代码文件',
                action: 'create_new'
            },
            {
                id: 'create_template',
                title: '基于模板创建',
                description: '使用常见模板快速创建代码结构',
                action: 'create_template'
            },
            {
                id: 'create_example',
                title: '创建示例代码',
                description: '生成演示特定功能的示例代码',
                action: 'create_example'
            }
        ];
        if (filePaths.length > 0) {
            options.unshift({
                id: 'create_based_on',
                title: '基于现有文件创建',
                description: '参考现有文件的结构和模式创建新代码',
                action: 'create_based_on_existing'
            });
        }
        return {
            needsOptions: true,
            intent: 'creation',
            options,
            context: { filePaths, originalInput: input }
        };
    }
    // 生成帮助选项
    generateHelpOptions(input, filePaths) {
        const options = [
            {
                id: 'help_explain',
                title: '解释代码',
                description: '详细解释代码的功能和工作原理',
                action: 'explain_code'
            },
            {
                id: 'help_debug',
                title: '调试帮助',
                description: '帮助找出和解决代码问题',
                action: 'debug_help'
            },
            {
                id: 'help_optimize',
                title: '优化建议',
                description: '提供性能和代码质量优化建议',
                action: 'optimization_help'
            },
            {
                id: 'help_learn',
                title: '学习指导',
                description: '提供学习相关技术的建议和资源',
                action: 'learning_guidance'
            }
        ];
        return {
            needsOptions: true,
            intent: 'help',
            options,
            context: { filePaths, originalInput: input }
        };
    }
    // 向用户展示选项
    async presentOptionsToUser(intentAnalysis) {
        console.log(chalk_1.default.cyan('\n🤔 我理解您的需求，请选择具体的操作方案：\n'));
        intentAnalysis.options.forEach((option, index) => {
            console.log(chalk_1.default.yellow(`${index + 1}. ${option.title}`));
            console.log(chalk_1.default.gray(`   ${option.description}\n`));
        });
        console.log(chalk_1.default.gray('0. 取消操作\n'));
        return new Promise((resolve) => {
            this.rl?.question(chalk_1.default.blue('请选择方案 (输入数字): '), (answer) => {
                const choice = parseInt(answer.trim());
                if (choice === 0) {
                    resolve(null);
                    return;
                }
                if (choice >= 1 && choice <= intentAnalysis.options.length) {
                    const selectedOption = intentAnalysis.options[choice - 1];
                    resolve({
                        ...selectedOption,
                        context: intentAnalysis.context
                    });
                }
                else {
                    console.log(chalk_1.default.red('❌ 无效选择，操作已取消'));
                    resolve(null);
                }
            });
        });
    }
    // 执行选择的方案
    async executeSelectedOption(selectedOption, originalInput) {
        console.log(chalk_1.default.green(`\n✅ 已选择: ${selectedOption.title}`));
        console.log(chalk_1.default.gray(`正在执行: ${selectedOption.description}\n`));
        // 根据选择的操作构建增强的提示
        const enhancedPrompt = await this.buildEnhancedPrompt(selectedOption, originalInput);
        // 执行AI对话
        await this.executeAIConversation(enhancedPrompt, originalInput, selectedOption);
    }
    // 构建增强的提示
    async buildEnhancedPrompt(selectedOption, originalInput) {
        let enhancedPrompt = `用户请求: ${originalInput}\n\n`;
        enhancedPrompt += `选择的操作: ${selectedOption.title}\n`;
        enhancedPrompt += `操作描述: ${selectedOption.description}\n\n`;
        // 添加文档上下文
        if (selectedOption.context?.filePaths?.length > 0) {
            enhancedPrompt = await this.enhanceMessageWithDocumentContext(enhancedPrompt);
        }
        // 根据操作类型添加特定指令
        switch (selectedOption.action) {
            case 'code_review_detailed':
                enhancedPrompt += '\n请进行详细的代码审查，包括：\n1. 代码质量分析\n2. 性能问题识别\n3. 安全性检查\n4. 最佳实践建议\n5. 具体改进方案\n';
                break;
            case 'code_review_refactor':
                enhancedPrompt += '\n请提供代码审查和重构方案：\n1. 分析现有代码问题\n2. 提供重构后的完整代码\n3. 解释重构的原因和好处\n';
                break;
            case 'improve_code':
                enhancedPrompt += '\n请改进代码：\n1. 提高代码可读性\n2. 优化代码结构\n3. 应用最佳实践\n4. 提供完整的改进后代码\n';
                break;
            case 'fix_issues':
                enhancedPrompt += '\n请识别并修复代码问题：\n1. 找出潜在的bug\n2. 修复逻辑错误\n3. 改善错误处理\n4. 提供修复后的代码\n';
                break;
            case 'create_new':
                enhancedPrompt += '\n请创建新的代码：\n1. 根据需求设计代码结构\n2. 实现核心功能\n3. 添加适当的注释\n4. 遵循最佳实践\n';
                break;
        }
        return enhancedPrompt;
    }
    // 执行AI对话
    async executeAIConversation(enhancedPrompt, originalInput, selectedOption) {
        // 添加用户消息到会话
        const userMessage = {
            id: (0, uuid_1.v4)(),
            role: 'user',
            content: enhancedPrompt,
            timestamp: new Date()
        };
        this.currentSession.messages.push(userMessage);
        this.updateSessionMetadata();
        // 显示用户消息（显示原始输入）
        this.uiManager.displayUserMessage(originalInput);
        // 显示AI响应开始
        this.uiManager.displayAIMessageStart();
        // 获取AI响应
        let assistantResponse = '';
        const chatStream = this.ollamaProvider.chat(this.currentSession.messages, {
            systemPrompt: this.getEnhancedSystemPrompt(selectedOption)
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
        await this.handleAIResponseSaving(originalInput, assistantResponse);
        // 自动保存会话
        await this.saveCurrentSession();
    }
    // 处理直接对话
    async handleDirectConversation(input) {
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
    // 获取增强的系统提示
    getEnhancedSystemPrompt(selectedOption) {
        let basePrompt = this.getSystemPrompt();
        // 根据选择的操作添加特定指导
        switch (selectedOption.action) {
            case 'code_review_detailed':
                basePrompt += '\n\n特别注意：进行详细的代码审查时，请：\n- 分析代码的可读性、可维护性和性能\n- 识别潜在的安全问题\n- 提供具体的改进建议\n- 解释每个建议的原因';
                break;
            case 'code_review_refactor':
                basePrompt += '\n\n特别注意：提供重构方案时，请：\n- 保持原有功能不变\n- 改善代码结构和设计\n- 提供完整的重构后代码\n- 使用明确的标识如"重构后的代码:"';
                break;
            case 'improve_code':
                basePrompt += '\n\n特别注意：改进代码时，请：\n- 保持功能完整性\n- 提高代码质量和可读性\n- 应用最佳实践\n- 提供完整的改进后代码';
                break;
        }
        return basePrompt;
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