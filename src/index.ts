#!/usr/bin/env node
// 应用程序主入口文件

import { Command } from 'commander';
import chalk from 'chalk';
import { CLIApplication } from './app/CLIApplication';
import { ConfigManager } from './core/ConfigManager';
import { Logger } from './utils/Logger';

const program = new Command();

async function main(): Promise<void> {
  try {
    // 初始化配置管理器
    const configManager = new ConfigManager();
    await configManager.loadConfig();

    // 初始化日志记录器
    const logger = new Logger(configManager.getConfig().ui.verboseOutput);

    // 创建CLI应用实例
    const app = new CLIApplication(configManager, logger);

    // 检查Node.js版本
    const nodeVersion = process.version;
    const versionParts = nodeVersion.slice(1).split('.');
    const majorVersion = parseInt(versionParts[0] || '0');
    
    if (majorVersion < 16) {
      console.error(chalk.red('❌ Error: Node.js 16.0.0 or higher is required'));
      console.error(chalk.yellow(`Current version: ${nodeVersion}`));
      console.error(chalk.blue('Please upgrade Node.js: https://nodejs.org/'));
      process.exit(1);
    }

    // 设置程序基本信息
    program
      .name('l')
      .description('An intelligent AI-powered command-line chat assistant with document processing, code review, and file management capabilities')
      .version('1.0.0')
      .option('-v, --verbose', 'enable verbose output')
      .option('-q, --quiet', 'enable quiet mode')
      .option('-c, --config <path>', 'specify config file path');

    // 注册主要命令 - 启动聊天界面
    program
      .command('chat', { isDefault: true })
      .description('Start interactive chat session with AI')
      .option('-m, --model <model>', 'specify AI model to use')
      .option('-t, --temperature <temp>', 'set AI temperature (0.0-1.0)')
      .option('--no-history', 'disable chat history')
      .action(async (options) => {
        await app.startChatSession(options);
      });

    // 注册配置命令
    program
      .command('config')
      .description('Manage application configuration')
      .option('-l, --list', 'list current configuration')
      .option('-s, --set <key=value>', 'set configuration value')
      .option('-g, --get <key>', 'get configuration value')
      .option('-r, --reset', 'reset to default configuration')
      .action(async (options) => {
        await app.handleConfigCommand(options);
      });

    // 注册模型管理命令
    program
      .command('models')
      .description('Manage Ollama models')
      .option('-l, --list', 'list available models')
      .option('-p, --pull <model>', 'pull a model from Ollama')
      .option('-r, --remove <model>', 'remove a model')
      .action(async (options) => {
        await app.handleModelsCommand(options);
      });

    // 注册历史管理命令
    program
      .command('history')
      .description('Manage chat history')
      .option('-l, --list', 'list chat sessions')
      .option('-s, --show <id>', 'show specific session')
      .option('-d, --delete <id>', 'delete specific session')
      .option('-c, --clear', 'clear all history')
      .option('-e, --export <id>', 'export session to file')
      .action(async (options) => {
        await app.handleHistoryCommand(options);
      });

    // 全局错误处理
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // 优雅退出处理
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n👋 Goodbye! Thanks for using AI CLI Chat.'));
      await app.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await app.shutdown();
      process.exit(0);
    });

    // 解析命令行参数并执行
    await program.parseAsync(process.argv);

  } catch (error) {
    console.error(chalk.red('❌ Failed to start application:'), error);
    process.exit(1);
  }
}

// 启动应用程序
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('❌ Application error:'), error);
    process.exit(1);
  });
}

export { main };
