// 聊天管理器实现
import readline from 'readline';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { 
  ChatSession, 
  ChatMessage
} from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ConfigManager } from './ConfigManager';
import { Logger } from '../utils/Logger';
import { UIManager } from '../ui/UIManager';
import { FileEditService } from '../services/FileEditService';
import { DocumentService } from '../services/DocumentService';

export class ChatManager {
  private ollamaProvider: OllamaProvider;
  private configManager: ConfigManager;
  private logger: Logger;
  private currentSession: ChatSession | null = null;
  private rl: readline.Interface | null = null;
  private sessionsDir: string;
  // 添加等待响应状态标志
  private isWaitingForResponse: boolean = false;
  // 添加UI管理器
  private uiManager: UIManager;
  // 添加文件编辑服务
  private fileEditService: FileEditService;
  // 添加文档服务
  private documentService: DocumentService;

  constructor(
    ollamaProvider: OllamaProvider,
    configManager: ConfigManager,
    logger: Logger
  ) {
    this.ollamaProvider = ollamaProvider;
    this.configManager = configManager;
    this.logger = logger;
    
    // 初始化UI管理器
    this.uiManager = new UIManager(configManager);
    
    // 初始化文件编辑服务
    this.fileEditService = new FileEditService(configManager, logger);
    
    // 初始化文档服务
    this.documentService = new DocumentService(configManager, logger);
    
    // 设置会话存储目录
    this.sessionsDir = path.join(os.homedir(), '.ai-cli-chat', 'sessions');
    this.ensureSessionsDirectory();
  }

  // 启动聊天会话
  async startSession(_options: any): Promise<void> {
    try {
      // 显示界面
      this.uiManager.displayInterface();
      
      // 创建新会话
      this.currentSession = this.createNewSession();
      
      // 设置readline接口
      this.setupReadlineInterface();
      
      // 开始聊天循环
      await this.startChatLoop();
      
    } catch (error) {
      this.logger.error('Failed to start chat session:', error);
      throw error;
    }
  }

  // 创建新会话
  private createNewSession(): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
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
  private setupReadlineInterface(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('> ')
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
  private async startChatLoop(): Promise<void> {
    if (!this.rl || !this.currentSession) {
      throw new Error('Chat session not properly initialized');
    }

    this.uiManager.displayStartupMessage();
    this.rl.prompt();
  }

  // 处理用户输入
  private async handleUserInput(input: string): Promise<void> {
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
      const userMessage: ChatMessage = {
        id: uuidv4(),
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
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
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

    } catch (error) {
      this.logger.error('Error processing user input:', error);
      this.uiManager.displayError('Sorry, I encountered an error. Please try again.');
    } finally {
      // 重置等待响应状态
      this.isWaitingForResponse = false;
    }

    this.rl.prompt();
  }

  // 处理命令
  private async handleCommand(command: string): Promise<void> {
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
        console.log(chalk.green('✅ Session saved successfully'));
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
        console.log(chalk.yellow(`❓ Unknown command: ${cmd}. Type /help for available commands.`));
    }

    if (this.rl) {
      this.rl.prompt();
    }
  }

  // 显示帮助信息
  private showHelp(): void {
    this.uiManager.displayHelp();
  }

  // 显示可用模型
  private async showModels(): Promise<void> {
    try {
      const progress = this.logger.createProgress('Fetching available models...');
      progress.start();

      const models = await this.ollamaProvider.listModels();
      progress.succeed('Models fetched successfully');

      this.uiManager.displayModels(models, this.configManager.getConfig().ollama.model);
    } catch (error) {
      this.uiManager.displayError(`Failed to fetch models: ${error}`);
    }
  }

  // 显示配置
  private showConfig(): void {
    this.uiManager.displayConfig();
  }

  // 清除会话
  private async clearSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.messages = [];
      this.updateSessionMetadata();
      console.log(chalk.green('✅ Chat history cleared'));
    }
  }

  // 显示会话历史
  private async showSessionHistory(): Promise<void> {
    if (!this.currentSession) {
      this.uiManager.displaySessionHistory([]);
      return;
    }
    this.uiManager.displaySessionHistory(this.currentSession.messages);
  }

  // 处理退出
  private handleExit(): void {
    this.uiManager.displayExitMessage();
    
    if (this.currentSession) {
      this.saveCurrentSession().then(() => {
        this.uiManager.displayGoodbyeMessage();
        process.exit(0);
      }).catch((error) => {
        this.logger.error('Failed to save session:', error);
        process.exit(1);
      });
    } else {
      this.uiManager.displayGoodbyeMessage();
      process.exit(0);
    }
  }

  // 获取系统提示
  private getSystemPrompt(): string {
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
  private updateSessionMetadata(): void {
    if (this.currentSession) {
      this.currentSession.metadata.totalMessages = this.currentSession.messages.length;
      this.currentSession.metadata.lastActivity = new Date();
    }
  }

  // 保存当前会话
  private async saveCurrentSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      const sessionFile = path.join(this.sessionsDir, `${this.currentSession.id}.json`);
      await fs.writeFile(sessionFile, JSON.stringify(this.currentSession, null, 2));
      this.logger.debug(`Session saved: ${sessionFile}`);
    } catch (error) {
      this.logger.error('Failed to save session:', error);
    }
  }

  // 确保会话目录存在
  private async ensureSessionsDirectory(): Promise<void> {
    try {
      await fs.ensureDir(this.sessionsDir);
    } catch (error) {
      this.logger.error('Failed to create sessions directory:', error);
    }
  }

  // 列出会话
  async listSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));

      if (sessionFiles.length === 0) {
        console.log(chalk.yellow('📝 No saved sessions found'));
        return;
      }

      console.log(chalk.cyan('\n📚 Saved Sessions:'));
      for (const file of sessionFiles) {
        const sessionPath = path.join(this.sessionsDir, file);
        try {
          const sessionData = await fs.readFile(sessionPath, 'utf-8');
          const session: ChatSession = JSON.parse(sessionData);
          const messageCount = session.messages.length;
          const startTime = new Date(session.startTime).toLocaleString();
          console.log(chalk.gray(`  • ${session.id} (${messageCount} messages, ${startTime})`));
        } catch (error) {
          this.logger.error(`Failed to read session ${file}:`, error);
        }
      }
      console.log();
    } catch (error) {
      this.logger.error('Failed to list sessions:', error);
    }
  }

  // 显示特定会话
  async showSession(sessionId: string): Promise<void> {
    try {
      const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
      const sessionData = await fs.readFile(sessionPath, 'utf-8');
      const session: ChatSession = JSON.parse(sessionData);

      console.log(chalk.cyan(`\n📖 Session: ${session.id}`));
      console.log(chalk.gray(`Started: ${new Date(session.startTime).toLocaleString()}`));
      console.log(chalk.gray(`Messages: ${session.messages.length}\n`));

      session.messages.forEach((message) => {
        const role = message.role === 'user' ? '👤 You' : '🤖 AI';
        const time = new Date(message.timestamp).toLocaleTimeString();
        console.log(chalk.blue(`[${time}] ${role}:`));
        console.log(message.content);
        console.log();
      });
    } catch (error) {
      console.log(chalk.red(`❌ Failed to load session ${sessionId}:`, error));
    }
  }

  // 删除会话
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
      await fs.remove(sessionPath);
      console.log(chalk.green(`✅ Session ${sessionId} deleted successfully`));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to delete session ${sessionId}:`, error));
    }
  }

  // 清除所有会话
  async clearAllSessions(): Promise<void> {
    try {
      await fs.emptyDir(this.sessionsDir);
      console.log(chalk.green('✅ All sessions cleared successfully'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to clear sessions:', error));
    }
  }

  // 导出会话
  async exportSession(sessionId: string): Promise<void> {
    try {
      const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
      const sessionData = await fs.readFile(sessionPath, 'utf-8');
      const session: ChatSession = JSON.parse(sessionData);

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

      const exportPath = path.join(process.cwd(), `session-${sessionId}.md`);
      await fs.writeFile(exportPath, markdown);
      console.log(chalk.green(`✅ Session exported to: ${exportPath}`));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to export session ${sessionId}:`, error));
    }
  }

  // 处理文件编辑命令
  private async handleFileEdit(command: string): Promise<void> {
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
        } else {
          this.uiManager.displayError(result.error || 'Failed to edit file');
        }
      } else {
        // 显示文件信息
        const fileInfo = await this.fileEditService.getFileInfo(filePath);
        if (fileInfo.exists) {
          console.log(chalk.cyan(`\n📄 File: ${filePath}`));
          console.log(chalk.gray(`Size: ${fileInfo.size} bytes`));
          console.log(chalk.gray(`Last modified: ${fileInfo.lastModified.toLocaleString()}`));
          console.log(chalk.gray(`Readable: ${fileInfo.permissions.readable}`));
          console.log(chalk.gray(`Writable: ${fileInfo.permissions.writable}`));
        } else {
          this.uiManager.displayError(`File does not exist: ${filePath}`);
        }
      }
    } catch (error) {
      this.uiManager.displayError(`Error editing file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文件读取命令
  private async handleFileRead(command: string): Promise<void> {
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
      console.log(chalk.cyan(`\n📖 Content of ${filePath}:`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(content);
      console.log(chalk.gray('─'.repeat(50)));
    } catch (error) {
      this.uiManager.displayError(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文件写入命令
  private async handleFileWrite(command: string): Promise<void> {
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
          console.log(chalk.gray(`Backup created: ${result.backupPath}`));
        }
      } else {
        this.uiManager.displayError(result.error || 'Failed to write file');
      }
    } catch (error) {
      this.uiManager.displayError(`Error writing file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文件删除命令
  private async handleFileDelete(command: string): Promise<void> {
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
          console.log(chalk.gray(`Backup created: ${result.backupPath}`));
        }
      } else {
        this.uiManager.displayError(result.error || 'Failed to delete file');
      }
    } catch (error) {
      this.uiManager.displayError(`Error deleting file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文档命令
  private async handleDocumentCommand(command: string): Promise<void> {
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
    } catch (error) {
      this.uiManager.displayError(`Error processing document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文档读取
  private async handleDocumentRead(filePath: string): Promise<void> {
    try {
      const result = await this.documentService.readDocument(filePath);
      
      if (result.success) {
        console.log(chalk.cyan(`\n📄 Document: ${filePath}`));
        console.log(chalk.gray(`Format: ${result.metadata?.format}`));
        console.log(chalk.gray(`Size: ${result.metadata?.size} bytes`));
        console.log(chalk.gray(`Last modified: ${result.metadata?.lastModified?.toLocaleString()}`));
        
        if (result.metadata?.structure) {
          console.log(chalk.gray(`Structure: ${JSON.stringify(result.metadata.structure, null, 2)}`));
        }
        
        console.log(chalk.gray('─'.repeat(50)));
        
        // 根据格式显示内容
        if (result.metadata?.format === 'markdown') {
          const mdContent = result.content;
          if (mdContent.frontmatter) {
            console.log(chalk.blue('Frontmatter:'));
            console.log(JSON.stringify(mdContent.frontmatter, null, 2));
            console.log();
          }
          console.log(chalk.white(mdContent.content));
          
          if (mdContent.headings.length > 0) {
            console.log(chalk.blue('\nHeadings:'));
            mdContent.headings.forEach((h: any) => {
              console.log(`${'  '.repeat(h.level - 1)}${h.level}. ${h.text}`);
            });
          }
        } else if (result.metadata?.format === 'json') {
          console.log(JSON.stringify(result.content.data, null, 2));
        } else if (result.metadata?.format === 'yaml') {
          console.log(JSON.stringify(result.content.data, null, 2));
        } else {
          console.log(result.content);
        }
        
        console.log(chalk.gray('─'.repeat(50)));
      } else {
        this.uiManager.displayError(result.error || 'Failed to read document');
      }
    } catch (error) {
      this.uiManager.displayError(`Error reading document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文档写入
  private async handleDocumentWrite(filePath: string, content: string): Promise<void> {
    try {
      // 尝试解析内容为JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = content;
      }

      const result = await this.documentService.writeDocument(filePath, parsedContent);
      
      if (result.success) {
        this.uiManager.displaySuccess(result.message);
        if (result.metadata) {
          console.log(chalk.gray(`Format: ${result.metadata.format}`));
          console.log(chalk.gray(`Size: ${result.metadata.size} bytes`));
        }
      } else {
        this.uiManager.displayError(result.error || 'Failed to write document');
      }
    } catch (error) {
      this.uiManager.displayError(`Error writing document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文档搜索
  private async handleDocumentSearch(command: string): Promise<void> {
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
        const matches = result.content as Array<{ line: number; text: string; index: number }>;
        
        console.log(chalk.cyan(`\n🔍 Search results for "${query}" in ${filePath}:`));
        console.log(chalk.gray(`Found ${matches.length} matches`));
        console.log(chalk.gray('─'.repeat(50)));
        
        matches.forEach((match, index) => {
          console.log(chalk.yellow(`${index + 1}. Line ${match.line}:`));
          console.log(`   ${match.text}`);
          console.log();
        });
        
        console.log(chalk.gray('─'.repeat(50)));
      } else {
        this.uiManager.displayError(result.error || 'Search failed');
      }
    } catch (error) {
      this.uiManager.displayError(`Error searching document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 处理文档转换
  private async handleDocumentConvert(command: string): Promise<void> {
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
          console.log(chalk.gray(`Target size: ${result.metadata.size} bytes`));
        }
      } else {
        this.uiManager.displayError(result.error || 'Conversion failed');
      }
    } catch (error) {
      this.uiManager.displayError(`Error converting document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 增强消息，添加文档上下文
  private async enhanceMessageWithDocumentContext(message: string): Promise<string> {
    try {
      // 检测消息中是否包含文档操作关键词
      const documentKeywords = [
        '修改', '编辑', '更新', '改写', '重写', '调整',
        'modify', 'edit', 'update', 'rewrite', 'change',
        '文档', '文件', 'document', 'file',
        '内容', 'content'
      ];

      const hasDocumentOperation = documentKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );

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
            } else if (docResult.metadata?.format === 'json') {
              enhancedMessage += JSON.stringify(docResult.content.data, null, 2);
            } else if (docResult.metadata?.format === 'yaml') {
              enhancedMessage += JSON.stringify(docResult.content.data, null, 2);
            } else {
              enhancedMessage += docResult.content;
            }
            
            enhancedMessage += '\n```\n';
          } else {
            // 如果文档服务失败，尝试文件编辑服务
            try {
              const fileContent = await this.fileEditService.readFile(filePath);
              enhancedMessage += `\n文件: ${filePath}\n`;
              enhancedMessage += '内容:\n```\n';
              enhancedMessage += fileContent;
              enhancedMessage += '\n```\n';
            } catch (fileError) {
              this.logger.warn(`无法读取文件 ${filePath}:`, fileError);
            }
          }
        } catch (error) {
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
    } catch (error) {
      this.logger.error('增强消息上下文时出错:', error);
      return message;
    }
  }

  // 从消息中提取文件路径
  private extractFilePaths(message: string): string[] {
    const filePaths: string[] = [];
    
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
  private async handleAIResponseSaving(userInput: string, aiResponse: string): Promise<void> {
    try {
      // 检测是否是代码审查或修改请求
      const isCodeReviewOrModification = this.isCodeReviewOrModificationRequest(userInput);
      
      // 检测是否需要保存到文件
      const saveKeywords = [
        '保存', '写入', '创建', '生成', '输出', '修改', '更新', '改写',
        'save', 'write', 'create', 'generate', 'output', 'modify', 'update', 'rewrite',
        '文件', '文档', 'file', 'document'
      ];

      const needsSaving = saveKeywords.some(keyword => 
        userInput.toLowerCase().includes(keyword.toLowerCase())
      ) || isCodeReviewOrModification;

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
      
      // 如果没有明确的文件路径，尝试从AI响应中提取代码块或内容
      if (filePaths.length === 0) {
        await this.saveAIResponseContent(userInput, aiResponse);
        return;
      }

      // 如果有明确的文件路径，保存到指定文件
      for (const filePath of filePaths) {
        await this.saveToSpecificFile(filePath, aiResponse);
      }

    } catch (error) {
      this.logger.error('处理AI响应保存时出错:', error);
    }
  }

  // 保存AI响应内容到文件
  private async saveAIResponseContent(userInput: string, aiResponse: string): Promise<void> {
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
            console.log(chalk.green(`\n✅ 代码已保存到: ${fileName}`));
            if (result.backupPath) {
              console.log(chalk.gray(`备份文件: ${result.backupPath}`));
            }
          } else {
              console.log(chalk.red(`❌ 保存失败: ${result.error}`));
            }
          }
        }
      } else {
        // 如果没有代码块，保存整个响应
        const fileName = this.generateFileName('txt', userInput, 0);
        const result = await this.fileEditService.writeFile(fileName, aiResponse);
        if (result.success) {
          console.log(chalk.green(`\n✅ 响应已保存到: ${fileName}`));
        }
      }
    } catch (error) {
      this.logger.error('保存AI响应内容时出错:', error);
    }
  }

  // 保存到指定文件
  private async saveToSpecificFile(filePath: string, aiResponse: string): Promise<void> {
    try {
      // 提取代码块或使用整个响应
      const codeBlocks = this.extractCodeBlocks(aiResponse);
      let contentToSave = aiResponse;

      if (codeBlocks.length > 0) {
        // 如果有代码块，优先使用第一个代码块
        const primaryBlock = codeBlocks.find(block => 
          this.isLanguageMatch(block.language, filePath)
        ) || codeBlocks[0];
        
        if (primaryBlock) {
          contentToSave = primaryBlock.content;
        }
      }

      const result = await this.fileEditService.writeFile(filePath, contentToSave);
      if (result.success) {
        console.log(chalk.green(`\n✅ 内容已保存到: ${filePath}`));
        if (result.backupPath) {
          console.log(chalk.gray(`备份文件: ${result.backupPath}`));
        }
      } else {
        console.log(chalk.red(`❌ 保存失败: ${result.error}`));
      }
    } catch (error) {
      this.logger.error(`保存到文件 ${filePath} 时出错:`, error);
    }
  }

  // 提取代码块
  private extractCodeBlocks(content: string): Array<{ language: string; content: string }> {
    const codeBlocks: Array<{ language: string; content: string }> = [];
    
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
  private generateFileName(language: string, userInput: string, index: number): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    
    // 从用户输入中提取可能的文件名
    const fileNameMatch = userInput.match(/(?:创建|生成|写入|保存).*?([a-zA-Z0-9_-]+)(?:\.(\w+))?/);
    let baseName = fileNameMatch ? fileNameMatch[1] : 'ai-generated';
    
    // 根据语言确定扩展名
    const extensions: Record<string, string> = {
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
  private isLanguageMatch(language: string, filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext) return false;

    const languageMap: Record<string, string[]> = {
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
  private isCodeReviewOrModificationRequest(userInput: string): boolean {
    const codeReviewKeywords = [
      'cr', 'code review', '代码审查', '审查代码', '检查代码',
      '修改', '改进', '优化', '重构', '更新', '调整',
      'modify', 'improve', 'optimize', 'refactor', 'update', 'fix',
      '帮我', '帮忙', 'help me', 'please help',
      '问题', '错误', 'issue', 'error', 'bug'
    ];

    return codeReviewKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // 处理代码修改保存
  private async handleCodeModificationSaving(filePaths: string[], aiResponse: string, _userInput: string): Promise<void> {
    try {
      // 询问用户是否要应用修改
      const shouldApply = await this.askUserConfirmation(filePaths, aiResponse);
      
      if (!shouldApply) {
        console.log(chalk.yellow('\n📝 修改建议已显示，但未应用到文件。'));
        console.log(chalk.gray('如需应用修改，请明确说明"应用修改"或"保存修改"。'));
        return;
      }

      // 应用修改到文件
      for (const filePath of filePaths) {
        await this.applyModificationToFile(filePath, aiResponse);
      }

    } catch (error) {
      this.logger.error('处理代码修改保存时出错:', error);
    }
  }

  // 询问用户确认
  private async askUserConfirmation(filePaths: string[], aiResponse: string): Promise<boolean> {
    // 检查AI响应中是否包含完整的文件内容或明确的修改指令
    const hasCompleteCode = this.hasCompleteFileContent(aiResponse);
    const hasModificationInstructions = this.hasModificationInstructions(aiResponse);

    if (!hasCompleteCode && !hasModificationInstructions) {
      return false;
    }

    console.log(chalk.cyan('\n🤔 检测到代码修改建议，是否要应用到文件？'));
    console.log(chalk.gray(`文件: ${filePaths.join(', ')}`));
    console.log(chalk.yellow('输入 "yes" 或 "应用" 来应用修改，其他任何输入将跳过保存。'));
    
    return new Promise((resolve) => {
      this.rl?.question(chalk.blue('是否应用修改? '), (answer) => {
        const confirmKeywords = ['yes', 'y', '是', '应用', '确认', 'apply', 'confirm'];
        const shouldApply = confirmKeywords.some(keyword => 
          answer.toLowerCase().trim().includes(keyword.toLowerCase())
        );
        resolve(shouldApply);
      });
    });
  }

  // 检查是否包含完整的文件内容
  private hasCompleteFileContent(aiResponse: string): boolean {
    // 检查是否有代码块
    const codeBlocks = this.extractCodeBlocks(aiResponse);
    if (codeBlocks.length === 0) {
      return false;
    }

    // 检查代码块是否足够长（可能是完整文件）
    return codeBlocks.some(block => block.content.split('\n').length > 10);
  }

  // 检查是否包含修改指令
  private hasModificationInstructions(aiResponse: string): boolean {
    const modificationIndicators = [
      '修改后的代码', '更新后的代码', '改进后的代码',
      'modified code', 'updated code', 'improved code',
      '完整代码', 'complete code', 'full code',
      '替换为', 'replace with', '改为', 'change to'
    ];

    return modificationIndicators.some(indicator => 
      aiResponse.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  // 应用修改到文件
  private async applyModificationToFile(filePath: string, aiResponse: string): Promise<void> {
    try {
      // 提取代码块
      const codeBlocks = this.extractCodeBlocks(aiResponse);
      
      if (codeBlocks.length === 0) {
        console.log(chalk.yellow(`⚠️  未在响应中找到代码块，跳过文件 ${filePath}`));
        return;
      }

      // 选择最合适的代码块
      const targetBlock = codeBlocks.find(block => 
        this.isLanguageMatch(block.language, filePath)
      ) || codeBlocks[0];

      if (!targetBlock) {
        console.log(chalk.yellow(`⚠️  未找到合适的代码块，跳过文件 ${filePath}`));
        return;
      }

      // 保存到文件
      const result = await this.fileEditService.writeFile(filePath, targetBlock.content, {
        backup: true
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ 修改已应用到: ${filePath}`));
        if (result.backupPath) {
          console.log(chalk.gray(`📦 备份文件: ${result.backupPath}`));
        }
        
        // 显示修改摘要
        this.showModificationSummary(filePath, result.originalContent || '', targetBlock.content);
      } else {
        console.log(chalk.red(`❌ 应用修改失败: ${result.error}`));
      }

    } catch (error) {
      this.logger.error(`应用修改到文件 ${filePath} 时出错:`, error);
      console.log(chalk.red(`❌ 应用修改时出错: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  // 显示修改摘要
  private showModificationSummary(filePath: string, originalContent: string, newContent: string): void {
    const originalLines = originalContent.split('\n').length;
    const newLines = newContent.split('\n').length;
    const lineDiff = newLines - originalLines;

    console.log(chalk.cyan('\n📊 修改摘要:'));
    console.log(chalk.gray(`文件: ${filePath}`));
    console.log(chalk.gray(`原始行数: ${originalLines}`));
    console.log(chalk.gray(`修改后行数: ${newLines}`));
    
    if (lineDiff > 0) {
      console.log(chalk.green(`增加了 ${lineDiff} 行`));
    } else if (lineDiff < 0) {
      console.log(chalk.red(`减少了 ${Math.abs(lineDiff)} 行`));
    } else {
      console.log(chalk.blue('行数未变化'));
    }
  }

  // 清理资源
  async cleanup(): Promise<void> {
    if (this.rl) {
      this.rl.close();
    }

    if (this.currentSession) {
      await this.saveCurrentSession();
    }
  }
}
