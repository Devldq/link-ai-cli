// 【AI 李大庆】start: CLI应用程序主类
import chalk from 'chalk';
import { ConfigManager } from '../core/ConfigManager';
import { Logger } from '../utils/Logger';
import { ChatManager } from '../core/ChatManager';
import { OllamaProvider } from '../providers/OllamaProvider';
import { CLIApplication as ICLIApplication } from '../types';

export class CLIApplication implements ICLIApplication {
  private configManager: ConfigManager;
  private logger: Logger;
  private chatManager: ChatManager | null = null;
  private ollamaProvider: OllamaProvider | null = null;

  constructor(configManager: ConfigManager, logger: Logger) {
    this.configManager = configManager;
    this.logger = logger;
  }

  // 【AI 李大庆】: 启动应用程序
  async start(): Promise<void> {
    try {
      this.logger.info('Starting AI CLI Chat application...');
      
      // 【AI 李大庆】: 初始化Ollama提供商
      await this.initializeOllamaProvider();
      
      // 【AI 李大庆】: 初始化聊天管理器
      await this.initializeChatManager();
      
      this.logger.success('Application started successfully');
    } catch (error) {
      this.logger.error('Failed to start application:', error);
      throw error;
    }
  }

  // 【AI 李大庆】: 处理命令
  async handleCommand(command: string, args: string[]): Promise<void> {
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

  // 【AI 李大庆】: 启动聊天会话
  async startChatSession(options: any): Promise<void> {
    try {
      if (!this.chatManager) {
        await this.initializeChatManager();
      }

      // 【AI 李大庆】: 显示欢迎信息
      this.displayWelcomeMessage();

      // 【AI 李大庆】: 启动聊天会话
      await this.chatManager!.startSession(options);

    } catch (error) {
      this.logger.error('Failed to start chat session:', error);
      throw error;
    }
  }

  // 【AI 李大庆】: 处理配置命令
  async handleConfigCommand(options: any): Promise<void> {
    try {
      if (options.list) {
        // 【AI 李大庆】: 显示当前配置
        const config = this.configManager.getConfig();
        console.log(chalk.cyan('📋 Current Configuration:'));
        console.log(JSON.stringify(config, null, 2));
      } else if (options.set) {
        // 【AI 李大庆】: 设置配置值
        const [key, value] = options.set.split('=');
        if (!key || value === undefined) {
          throw new Error('Invalid format. Use: --set key=value');
        }
        
        // 【AI 李大庆】: 尝试解析JSON值
        let parsedValue: any = value;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // 【AI 李大庆】: 如果不是JSON，保持字符串
        }
        
        await this.configManager.setConfig(key, parsedValue);
        this.logger.success(`Configuration updated: ${key} = ${parsedValue}`);
      } else if (options.get) {
        // 【AI 李大庆】: 获取配置值
        const value = this.configManager.getConfigValue(options.get);
        console.log(chalk.cyan(`${options.get}:`), value);
      } else if (options.reset) {
        // 【AI 李大庆】: 重置配置
        await this.configManager.resetConfig();
        this.logger.success('Configuration reset to defaults');
      } else {
        console.log(chalk.yellow('Please specify an option: --list, --set, --get, or --reset'));
      }
    } catch (error) {
      this.logger.error('Failed to handle config command:', error);
      throw error;
    }
  }

  // 【AI 李大庆】: 处理模型命令
  async handleModelsCommand(options: any): Promise<void> {
    try {
      if (!this.ollamaProvider) {
        await this.initializeOllamaProvider();
      }

      if (options.list) {
        // 【AI 李大庆】: 列出可用模型
        const progress = this.logger.createProgress('Fetching available models...');
        progress.start();
        
        try {
          const models = await this.ollamaProvider!.listModels();
          progress.succeed('Models fetched successfully');
          
          console.log(chalk.cyan('\n🤖 Available Models:'));
          models.forEach(model => {
            console.log(`  • ${chalk.green(model.name)} (${model.size})`);
          });
        } catch (error) {
          progress.fail('Failed to fetch models');
          throw error;
        }
      } else if (options.pull) {
        // 【AI 李大庆】: 拉取模型
        console.log(chalk.cyan(`🔄 Pulling model: ${options.pull}`));
        console.log(chalk.yellow('Note: This operation should be done through Ollama CLI directly.'));
        console.log(chalk.gray(`Run: ollama pull ${options.pull}`));
      } else if (options.remove) {
        // 【AI 李大庆】: 删除模型
        console.log(chalk.cyan(`🗑️  Removing model: ${options.remove}`));
        console.log(chalk.yellow('Note: This operation should be done through Ollama CLI directly.'));
        console.log(chalk.gray(`Run: ollama rm ${options.remove}`));
      } else {
        console.log(chalk.yellow('Please specify an option: --list, --pull, or --remove'));
      }
    } catch (error) {
      this.logger.error('Failed to handle models command:', error);
      throw error;
    }
  }

  // 【AI 李大庆】: 处理历史命令
  async handleHistoryCommand(options: any): Promise<void> {
    try {
      if (!this.chatManager) {
        await this.initializeChatManager();
      }

      if (options.list) {
        // 【AI 李大庆】: 列出聊天会话
        await this.chatManager!.listSessions();
      } else if (options.show) {
        // 【AI 李大庆】: 显示特定会话
        await this.chatManager!.showSession(options.show);
      } else if (options.delete) {
        // 【AI 李大庆】: 删除特定会话
        await this.chatManager!.deleteSession(options.delete);
      } else if (options.clear) {
        // 【AI 李大庆】: 清除所有历史
        await this.chatManager!.clearAllSessions();
      } else if (options.export) {
        // 【AI 李大庆】: 导出会话
        await this.chatManager!.exportSession(options.export);
      } else {
        console.log(chalk.yellow('Please specify an option: --list, --show, --delete, --clear, or --export'));
      }
    } catch (error) {
      this.logger.error('Failed to handle history command:', error);
      throw error;
    }
  }

  // 【AI 李大庆】: 关闭应用程序
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down application...');
      
      if (this.chatManager) {
        await this.chatManager.cleanup();
      }
      
      this.logger.success('Application shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }

  // 【AI 李大庆】: 初始化Ollama提供商
  private async initializeOllamaProvider(): Promise<void> {
    const config = this.configManager.getConfig();
    this.ollamaProvider = new OllamaProvider(config.ollama, this.logger);
    
    const progress = this.logger.createProgress('Connecting to Ollama...');
    progress.start();
    
    try {
      const isConnected = await this.ollamaProvider.connect();
      if (isConnected) {
        progress.succeed('Connected to Ollama successfully');
      } else {
        progress.fail('Failed to connect to Ollama');
        throw new Error('Ollama connection failed');
      }
    } catch (error) {
      progress.fail('Ollama connection error');
      throw error;
    }
  }

  // 【AI 李大庆】: 初始化聊天管理器
  private async initializeChatManager(): Promise<void> {
    if (!this.ollamaProvider) {
      await this.initializeOllamaProvider();
    }
    
    this.chatManager = new ChatManager(
      this.ollamaProvider!,
      this.configManager,
      this.logger
    );
  }

  // 【AI 李大庆】: 显示欢迎信息
  private displayWelcomeMessage(): void {
    console.log(chalk.cyan('\n🤖 Welcome to AI CLI Chat!'));
    console.log(chalk.gray('Type your message and press Enter to chat with AI.'));
    console.log(chalk.gray('Commands: /help, /exit, /clear, /save, /load'));
    console.log(chalk.gray('Press Ctrl+C to exit.\n'));
  }
}
// 【AI 李大庆】end: CLI应用程序主类