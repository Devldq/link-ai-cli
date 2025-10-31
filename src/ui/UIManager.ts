// UI管理器实现
import chalk from 'chalk';
import figlet from 'figlet';
import { ConfigManager } from '../core/ConfigManager';

export class UIManager {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  // 清屏并显示完整界面
  public displayInterface(): void {
    this.clearScreen();
    this.displayHeader();
    this.displaySeparator();
  }

  // 清屏
  private clearScreen(): void {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  // 显示头部信息
  private displayHeader(): void {
    // 显示标题
    const title = figlet.textSync('LINK', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    });
    
    console.log(chalk.magenta.bold(title));
    
    // 显示版本信息
    const config = this.configManager.getConfig();
    console.log(chalk.gray(`LINK v1.0.0 - AI Chat Assistant`));
    console.log(chalk.gray(`Model: ${config.ollama.model}`));
    console.log();
    
    // 显示快捷命令提示
    console.log(chalk.cyan('Tips to getting started:'));
    console.log(chalk.gray('1. Input a message to chat with AI'));
    console.log(chalk.gray('2. /help for more commands'));
    console.log(chalk.gray('3. /read <file> to read files'));
    console.log(chalk.gray('4. /write <file> <content> to write files'));
    console.log(chalk.gray('5. Ctrl+C to exit'));
    console.log();
  }

  // 显示分隔线
  private displaySeparator(): void {
    const width = process.stdout.columns || 80;
    console.log(chalk.gray('─'.repeat(width)));
    console.log();
  }

  // 显示用户消息
  public displayUserMessage(message: string): void {
    console.log(chalk.blue('user'));
    console.log(chalk.white(message));
    console.log();
  }

  // 显示AI消息开始
  public displayAIMessageStart(): void {
    process.stdout.write(chalk.green('link\n'));
  }

  // 显示AI消息内容（流式）
  public displayAIMessageChunk(chunk: string): void {
    process.stdout.write(chalk.white(chunk));
  }

  // 显示AI消息结束
  public displayAIMessageEnd(): void {
    console.log('\n');
  }

  // 显示输入提示符
  public displayPrompt(): void {
    process.stdout.write(chalk.cyan('> '));
  }

  // 显示等待提示
  public displayWaitingMessage(): void {
    console.log(chalk.yellow('⏳ Please wait for the AI response to complete...'));
  }

  // 显示错误消息
  public displayError(message: string): void {
    console.log(chalk.red(`❌ ${message}`));
  }

  // 显示成功消息
  public displaySuccess(message: string): void {
    console.log(chalk.green(`✅ ${message}`));
  }

  // 显示警告消息
  public displayWarning(message: string): void {
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  // 显示信息消息
  public displayInfo(message: string): void {
    console.log(chalk.cyan(`ℹ️  ${message}`));
  }

  // 显示帮助信息
  public displayHelp(): void {
    console.log(chalk.cyan('\n📚 Available Commands:'));
    console.log(chalk.gray('  /help     - Show this help message'));
    console.log(chalk.gray('  /exit     - Exit the chat session'));
    console.log(chalk.gray('  /clear    - Clear current chat history'));
    console.log(chalk.gray('  /save     - Save current session'));
    console.log(chalk.gray('  /models   - List available AI models'));
    console.log(chalk.gray('  /config   - Show current configuration'));
    console.log(chalk.gray('  /history  - Show session history'));
    console.log(chalk.cyan('\n📁 File Operations:'));
    console.log(chalk.gray('  /read <file>              - Read file content'));
    console.log(chalk.gray('  /write <file> <content>   - Write content to file'));
    console.log(chalk.gray('  /edit <file> [line] [content] - Edit file or show info'));
    console.log(chalk.gray('  /delete <file>            - Delete file (with backup)'));
    console.log(chalk.cyan('\n💡 Tips:'));
    console.log(chalk.gray('  - Ask me to generate code, review code, or execute tasks'));
    console.log(chalk.gray('  - I can work with multiple programming languages'));
    console.log(chalk.gray('  - Use natural language to describe what you want\n'));
  }

  // 显示模型列表
  public displayModels(models: Array<{name: string, size: string}>, currentModel: string): void {
    console.log(chalk.cyan('\n🤖 Available Models:'));
    models.forEach(model => {
      const current = model.name === currentModel ? ' (current)' : '';
      console.log(`  • ${chalk.green(model.name)} (${model.size})${chalk.yellow(current)}`);
    });
    console.log();
  }

  // 显示配置信息
  public displayConfig(): void {
    const config = this.configManager.getConfig();
    console.log(chalk.cyan('\n⚙️  Current Configuration:'));
    console.log(chalk.gray(`  Model: ${config.ollama.model}`));
    console.log(chalk.gray(`  Endpoint: ${config.ollama.endpoint}`));
    console.log(chalk.gray(`  Temperature: ${config.ollama.temperature}`));
    console.log(chalk.gray(`  Max Tokens: ${config.ollama.maxTokens}`));
    console.log(chalk.gray(`  Default Language: ${config.codeGeneration.defaultLanguage}`));
    console.log();
  }

  // 显示会话历史
  public displaySessionHistory(messages: Array<{role: string, content: string, timestamp: Date}>): void {
    if (messages.length === 0) {
      console.log(chalk.yellow('📝 No messages in current session'));
      return;
    }

    console.log(chalk.cyan('\n📜 Session History:'));
    messages.forEach((message) => {
      const role = message.role === 'user' ? '👤 You' : '🤖 AI';
      const time = message.timestamp.toLocaleTimeString();
      console.log(chalk.gray(`[${time}] ${role}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`));
    });
    console.log();
  }

  // 显示启动消息
  public displayStartupMessage(): void {
    console.log(chalk.green('🚀 Chat session started! Type your message or use commands.\n'));
  }

  // 显示退出消息
  public displayExitMessage(): void {
    console.log(chalk.yellow('\n👋 Saving session and exiting...'));
  }

  // 显示再见消息
  public displayGoodbyeMessage(): void {
    console.log(chalk.green('✅ Session saved. Goodbye!'));
  }
}
