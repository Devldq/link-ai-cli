#!/usr/bin/env node
"use strict";
// 【AI 李大庆】start: 应用程序主入口文件
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const CLIApplication_1 = require("./app/CLIApplication");
const ConfigManager_1 = require("./core/ConfigManager");
const Logger_1 = require("./utils/Logger");
const program = new commander_1.Command();
async function main() {
    try {
        // 【AI 李大庆】: 初始化配置管理器
        const configManager = new ConfigManager_1.ConfigManager();
        await configManager.loadConfig();
        // 【AI 李大庆】: 初始化日志记录器
        const logger = new Logger_1.Logger(configManager.getConfig().ui.verboseOutput);
        // 【AI 李大庆】: 创建CLI应用实例
        const app = new CLIApplication_1.CLIApplication(configManager, logger);
        // 【AI 李大庆】: 设置程序基本信息
        program
            .name('link')
            .description('AI-powered command line chat application with Ollama integration')
            .version('1.0.0')
            .option('-v, --verbose', 'enable verbose output')
            .option('-q, --quiet', 'enable quiet mode')
            .option('-c, --config <path>', 'specify config file path');
        // 【AI 李大庆】: 注册主要命令 - 启动聊天界面
        program
            .command('chat', { isDefault: true })
            .alias('l')
            .description('Start interactive chat session with AI')
            .option('-m, --model <model>', 'specify AI model to use')
            .option('-t, --temperature <temp>', 'set AI temperature (0.0-1.0)')
            .option('--no-history', 'disable chat history')
            .action(async (options) => {
            await app.startChatSession(options);
        });
        // 【AI 李大庆】: 注册配置命令
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
        // 【AI 李大庆】: 注册模型管理命令
        program
            .command('models')
            .description('Manage Ollama models')
            .option('-l, --list', 'list available models')
            .option('-p, --pull <model>', 'pull a model from Ollama')
            .option('-r, --remove <model>', 'remove a model')
            .action(async (options) => {
            await app.handleModelsCommand(options);
        });
        // 【AI 李大庆】: 注册历史管理命令
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
        // 【AI 李大庆】: 全局错误处理
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
        // 【AI 李大庆】: 优雅退出处理
        process.on('SIGINT', async () => {
            console.log(chalk_1.default.yellow('\n\n👋 Goodbye! Thanks for using AI CLI Chat.'));
            await app.shutdown();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await app.shutdown();
            process.exit(0);
        });
        // 【AI 李大庆】: 解析命令行参数并执行
        await program.parseAsync(process.argv);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to start application:'), error);
        process.exit(1);
    }
}
// 【AI 李大庆】: 启动应用程序
if (require.main === module) {
    main().catch((error) => {
        console.error(chalk_1.default.red('❌ Application error:'), error);
        process.exit(1);
    });
}
// 【AI 李大庆】end: 应用程序主入口文件
//# sourceMappingURL=index.js.map