# LinChat

An intelligent AI-powered command-line chat assistant with document processing, code review, and file management capabilities.

## 🚀 Features

- **Interactive AI Chat**: Seamless integration with Ollama for powerful AI conversations
- **Smart Intent Analysis**: Intelligent detection of user intent with multiple operation options
- **Code Review & Modification**: Advanced code analysis, review, and automated improvements
- **Document Processing**: Support for Markdown, JSON, YAML, and text files
- **File Management**: Read, write, search, and convert documents with ease
- **Auto-Save**: Automatic saving of AI-generated code and content
- **Session Management**: Persistent chat history and session management
- **Multi-Language Support**: Support for various programming languages and file formats

## 📦 Installation

```bash
npm install -g linchat
```

## 🔧 Prerequisites

1. **Node.js 16.0.0 or higher**
2. **Ollama** must be installed and running
   - Download from: https://ollama.ai/
   - Pull a model: `ollama pull llama2`

## 🎯 Quick Start

After installation, you can use either command to start:

```bash
l
# or
linchat
```

This will start the interactive AI chat assistant.

## 🔧 Troubleshooting Installation

If the `l` command is not recognized after installation:

1. **Check if the package is installed globally:**
   ```bash
   npm list -g linchat
   ```

2. **Check npm global bin directory:**
   ```bash
   npm config get prefix
   ```

3. **Make sure the npm global bin directory is in your PATH:**
   ```bash
   echo $PATH
   ```

4. **If needed, add npm global bin to your PATH:**
   ```bash
   # For bash/zsh users, add to ~/.bashrc or ~/.zshrc:
   export PATH="$(npm config get prefix)/bin:$PATH"
   ```

5. **Restart your terminal or reload your shell configuration:**
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

6. **Alternative: Use the full command name:**
   ```bash
   linchat
   ```

## 📋 Commands

### Main Commands
- `l` - Start interactive chat (default)
- `l config` - Manage configuration
- `l models` - Manage Ollama models  
- `l history` - Manage chat history
- `l --help` - Show help information

### Chat Commands (within the chat interface)
- `/help` - Show available commands
- `/read <file>` - Read file content
- `/write <file> <content>` - Write content to file
- `/edit <file>` - Edit file
- `/delete <file>` - Delete file (with backup)
- `/doc read <file>` - Read structured document
- `/search <file> <query>` - Search in document
- `/convert <src> <dst> <format>` - Convert document format
- `/sessions` - List chat sessions
- `/load <session>` - Load specific session
- `/clear` - Clear current session
- `/exit` - Exit application

## 🎨 Usage Examples

### Code Review
```bash
# Start chat and then:
cr example.js
# System will offer multiple review options:
# 1. Deep code review + suggestions
# 2. Code review + refactoring
# 3. Security review
# 4. Performance optimization
```

### File Modification
```bash
# Modify existing files:
修改 example.js
# Choose from options:
# 1. Improve existing code
# 2. Fix issues
# 3. Add new features
# 4. Modernize code
```

### Document Processing
```bash
# Read documents:
/doc read README.md

# Search in documents:
/search config.json "database"

# Convert formats:
/convert data.json data.yaml yaml
```

### Code Creation
```bash
# Create new code:
创建一个React组件
# Options available:
# 1. Create from scratch
# 2. Use template
# 3. Create example
# 4. Based on existing file
```

## 🔧 Configuration

### View Configuration
```bash
l config --list
```

### Set Configuration
```bash
l config --set model=llama2
l config --set temperature=0.7
```

### Reset Configuration
```bash
l config --reset
```

## 🤖 Model Management

### List Available Models
```bash
l models --list
```

### Pull New Model
```bash
l models --pull codellama
```

### Remove Model
```bash
l models --remove oldmodel
```

## 📚 Session Management

### List Sessions
```bash
l history --list
```

### Show Specific Session
```bash
l history --show session-id
```

### Export Session
```bash
l history --export session-id
```

### Clear All History
```bash
l history --clear
```

## 🎯 Smart Features

### Intent Analysis
The system intelligently analyzes your requests and provides specific options:
- **Code Review**: Multiple review approaches (security, performance, refactoring)
- **Modification**: Different improvement strategies
- **Creation**: Various creation methods
- **Help**: Targeted assistance options

### Auto-Save
- Automatically detects when to save AI responses
- Extracts code blocks and saves to appropriate files
- Supports multiple programming languages
- Creates timestamped backups

### Document Context
- Automatically reads relevant files when mentioned
- Provides file content as context to AI
- Supports intelligent file path detection
- Enhances AI responses with current file state

## 🛠️ Supported File Formats

- **Code**: JavaScript, TypeScript, Python, Java, C/C++, HTML, CSS
- **Documents**: Markdown, JSON, YAML, TXT
- **Configuration**: Various config file formats

## 🔒 Safety Features

- **Automatic Backups**: Files are backed up before modifications
- **User Confirmation**: Prompts before applying changes to existing files
- **Error Handling**: Comprehensive error handling and recovery
- **Validation**: Input validation and format checking

## 🐛 Troubleshooting

### Ollama Not Running
```bash
# Start Ollama service
ollama serve

# Pull a model if none available
ollama pull llama2
```

### Permission Issues
```bash
# On macOS/Linux, you might need:
sudo npm install -g linchat
```

### Node.js Version
```bash
# Check Node.js version
node --version

# Should be 16.0.0 or higher
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/link/linchat/issues
- Documentation: https://github.com/link/linchat#readme

## 🎉 Acknowledgments

- Built with [Ollama](https://ollama.ai/) for AI capabilities
- Powered by [Node.js](https://nodejs.org/) and [TypeScript](https://www.typescriptlang.org/)
- CLI interface built with [Commander.js](https://github.com/tj/commander.js/)
- Styling with [Chalk](https://github.com/chalk/chalk)