"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIManager = void 0;
// UI管理器实现
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
class UIManager {
    constructor(configManager) {
        this.configManager = configManager;
    }
    // 清屏并显示完整界面
    displayInterface() {
        this.clearScreen();
        this.displayHeader();
        this.displaySeparator();
    }
    // 清屏
    clearScreen() {
        process.stdout.write('\x1b[2J\x1b[0f');
    }
    // 显示头部信息
    displayHeader() {
        // 显示标题
        const title = figlet_1.default.textSync('LINK', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        });
        console.log(chalk_1.default.magenta.bold(title));
        // 显示版本信息
        const config = this.configManager.getConfig();
        console.log(chalk_1.default.gray(`LINK v1.0.0 - AI Chat Assistant`));
        console.log(chalk_1.default.gray(`Model: ${config.ollama.model}`));
        console.log();
        // 显示快捷命令提示
        console.log(chalk_1.default.cyan('Tips to getting started:'));
        console.log(chalk_1.default.gray('1. Input a message to chat with AI'));
        console.log(chalk_1.default.gray('2. /help for more commands'));
        console.log(chalk_1.default.gray('3. Say "cr filename.js" and choose from multiple review options'));
        console.log(chalk_1.default.gray('4. Use "帮我修改 filename.js" for guided modification options'));
        console.log(chalk_1.default.gray('5. Ctrl+C to exit'));
        console.log();
    }
    // 显示分隔线
    displaySeparator() {
        const width = process.stdout.columns || 80;
        console.log(chalk_1.default.gray('─'.repeat(width)));
        console.log();
    }
    // 显示用户消息
    displayUserMessage(message) {
        console.log(chalk_1.default.blue('user'));
        console.log(chalk_1.default.white(message));
        console.log();
    }
    // 显示AI消息开始
    displayAIMessageStart() {
        process.stdout.write(chalk_1.default.green('link\n'));
    }
    // 显示AI消息内容（流式）
    displayAIMessageChunk(chunk) {
        process.stdout.write(chalk_1.default.white(chunk));
    }
    // 显示AI消息结束
    displayAIMessageEnd() {
        console.log('\n');
    }
    // 显示输入提示符
    displayPrompt() {
        process.stdout.write(chalk_1.default.cyan('> '));
    }
    // 显示等待提示
    displayWaitingMessage() {
        console.log(chalk_1.default.yellow('⏳ Please wait for the AI response to complete...'));
    }
    // 显示错误消息
    displayError(message) {
        console.log(chalk_1.default.red(`❌ ${message}`));
    }
    // 显示成功消息
    displaySuccess(message) {
        console.log(chalk_1.default.green(`✅ ${message}`));
    }
    // 显示警告消息
    displayWarning(message) {
        console.log(chalk_1.default.yellow(`⚠️  ${message}`));
    }
    // 显示信息消息
    displayInfo(message) {
        console.log(chalk_1.default.cyan(`ℹ️  ${message}`));
    }
    // 显示帮助信息
    displayHelp() {
        console.log(chalk_1.default.cyan('\n📚 Available Commands:'));
        console.log(chalk_1.default.gray('  /help     - Show this help message'));
        console.log(chalk_1.default.gray('  /exit     - Exit the chat session'));
        console.log(chalk_1.default.gray('  /clear    - Clear current chat history'));
        console.log(chalk_1.default.gray('  /save     - Save current session'));
        console.log(chalk_1.default.gray('  /models   - List available AI models'));
        console.log(chalk_1.default.gray('  /config   - Show current configuration'));
        console.log(chalk_1.default.gray('  /history  - Show session history'));
        console.log(chalk_1.default.cyan('\n📁 File Operations:'));
        console.log(chalk_1.default.gray('  /read <file>              - Read file content'));
        console.log(chalk_1.default.gray('  /write <file> <content>   - Write content to file'));
        console.log(chalk_1.default.gray('  /edit <file> [line] [content] - Edit file or show info'));
        console.log(chalk_1.default.gray('  /delete <file>            - Delete file (with backup)'));
        console.log(chalk_1.default.cyan('\n📄 Document Operations:'));
        console.log(chalk_1.default.gray('  /doc read <file>          - Read structured document'));
        console.log(chalk_1.default.gray('  /doc write <file> <content> - Write structured document'));
        console.log(chalk_1.default.gray('  /search <file> <query>    - Search in document'));
        console.log(chalk_1.default.gray('  /convert <src> <dst> <fmt> - Convert document format'));
        console.log(chalk_1.default.cyan('\n💾 Auto-Save Features:'));
        console.log(chalk_1.default.gray('  - AI responses with code blocks are automatically saved'));
        console.log(chalk_1.default.gray('  - Use keywords like "保存", "创建", "生成" to trigger auto-save'));
        console.log(chalk_1.default.gray('  - Specify filenames in your request for targeted saving'));
        console.log(chalk_1.default.cyan('\n🔍 Code Review & Modification:'));
        console.log(chalk_1.default.gray('  - Use "cr", "代码审查", "修改" to review and improve code'));
        console.log(chalk_1.default.gray('  - System will read existing files and provide context'));
        console.log(chalk_1.default.gray('  - Intelligent intent analysis with multiple options'));
        console.log(chalk_1.default.gray('  - User confirmation required before applying changes'));
        console.log(chalk_1.default.gray('  - Automatic backup creation before file changes'));
        console.log(chalk_1.default.cyan('\n🎯 Smart Intent Analysis:'));
        console.log(chalk_1.default.gray('  - System analyzes your request and offers specific options'));
        console.log(chalk_1.default.gray('  - Choose from detailed code review, refactoring, or optimization'));
        console.log(chalk_1.default.gray('  - Tailored responses based on your selected approach'));
        console.log(chalk_1.default.cyan('\n💡 Tips:'));
        console.log(chalk_1.default.gray('  - Ask me to generate code, review code, or execute tasks'));
        console.log(chalk_1.default.gray('  - I can work with multiple programming languages'));
        console.log(chalk_1.default.gray('  - Use natural language to describe what you want\n'));
    }
    // 显示模型列表
    displayModels(models, currentModel) {
        console.log(chalk_1.default.cyan('\n🤖 Available Models:'));
        models.forEach(model => {
            const current = model.name === currentModel ? ' (current)' : '';
            console.log(`  • ${chalk_1.default.green(model.name)} (${model.size})${chalk_1.default.yellow(current)}`);
        });
        console.log();
    }
    // 显示配置信息
    displayConfig() {
        const config = this.configManager.getConfig();
        console.log(chalk_1.default.cyan('\n⚙️  Current Configuration:'));
        console.log(chalk_1.default.gray(`  Model: ${config.ollama.model}`));
        console.log(chalk_1.default.gray(`  Endpoint: ${config.ollama.endpoint}`));
        console.log(chalk_1.default.gray(`  Temperature: ${config.ollama.temperature}`));
        console.log(chalk_1.default.gray(`  Max Tokens: ${config.ollama.maxTokens}`));
        console.log(chalk_1.default.gray(`  Default Language: ${config.codeGeneration.defaultLanguage}`));
        console.log();
    }
    // 显示会话历史
    displaySessionHistory(messages) {
        if (messages.length === 0) {
            console.log(chalk_1.default.yellow('📝 No messages in current session'));
            return;
        }
        console.log(chalk_1.default.cyan('\n📜 Session History:'));
        messages.forEach((message) => {
            const role = message.role === 'user' ? '👤 You' : '🤖 AI';
            const time = message.timestamp.toLocaleTimeString();
            console.log(chalk_1.default.gray(`[${time}] ${role}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`));
        });
        console.log();
    }
    // 显示启动消息
    displayStartupMessage() {
        console.log(chalk_1.default.green('🚀 Chat session started! Type your message or use commands.\n'));
    }
    // 显示退出消息
    displayExitMessage() {
        console.log(chalk_1.default.yellow('\n👋 Saving session and exiting...'));
    }
    // 显示再见消息
    displayGoodbyeMessage() {
        console.log(chalk_1.default.green('✅ Session saved. Goodbye!'));
    }
}
exports.UIManager = UIManager;
//# sourceMappingURL=UIManager.js.map