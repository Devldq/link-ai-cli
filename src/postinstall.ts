#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log(chalk.green('🎉 Thank you for installing LinChat!'));
console.log(chalk.blue('\n📋 Installation completed successfully!'));

console.log(chalk.cyan('\n🚀 Quick Start:'));
console.log(chalk.gray('  Run "l" or "linchat" in your terminal to start the AI chat assistant'));

console.log(chalk.cyan('\n📚 Features:'));
console.log(chalk.gray('  • Interactive AI chat with Ollama integration'));
console.log(chalk.gray('  • Intelligent code review and modification'));
console.log(chalk.gray('  • Document processing (Markdown, JSON, YAML)'));
console.log(chalk.gray('  • File management and auto-save capabilities'));
console.log(chalk.gray('  • Smart intent analysis with option selection'));

console.log(chalk.cyan('\n⚙️  Prerequisites:'));
console.log(chalk.gray('  • Ollama must be installed and running'));
console.log(chalk.gray('  • Download from: https://ollama.ai/'));
console.log(chalk.gray('  • Pull a model: ollama pull llama2'));

console.log(chalk.cyan('\n🔧 Commands:'));
console.log(chalk.gray('  l / linchat    - Start interactive chat (default)'));
console.log(chalk.gray('  l config       - Manage configuration'));
console.log(chalk.gray('  l models       - Manage Ollama models'));
console.log(chalk.gray('  l history      - Manage chat history'));
console.log(chalk.gray('  l --help       - Show help information'));

console.log(chalk.cyan('\n🔧 Troubleshooting:'));
console.log(chalk.gray('  If "l" command not found:'));
console.log(chalk.gray('  1. Check: npm list -g linchat'));
console.log(chalk.gray('  2. Check PATH: echo $PATH'));
console.log(chalk.gray('  3. Use full name: linchat'));
console.log(chalk.gray('  4. Restart terminal'));

console.log(chalk.cyan('\n💡 Examples:'));
console.log(chalk.gray('  l                           # Start chat'));
console.log(chalk.gray('  cr filename.js              # Code review'));
console.log(chalk.gray('  修改 filename.js             # Modify file'));
console.log(chalk.gray('  创建一个React组件             # Create component'));

console.log(chalk.yellow('\n⚠️  Note: Make sure Ollama is running before using the chat features.'));
console.log(chalk.green('\n🎯 Ready to go! Type "l" or "linchat" to start your AI assistant.'));