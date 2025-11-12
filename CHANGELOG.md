# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2024-01-15

### Enhanced
- 智能内容类型检测功能
- 根据文件内容自动识别编程语言
- 改进代码块提取逻辑，支持无语言标记的代码
- 增强文件类型检测算法
- 优化目录结构智能分类

### Added
- 新增40+种编程语言和文件格式检测模式
- 支持React、TypeScript、Python、Java等主流语言
- 智能检测HTML、CSS、JSON、YAML等格式
- 自动识别组件、服务、工具类等代码类型
- 增强的文件保存路径智能选择

### Fixed
- 修复正则表达式语法错误
- 解决文件总是保存为txt格式的问题
- 优化代码内容检测准确性
- 改进文件扩展名匹配逻辑

## [1.3.0] - 2024-01-15

### Added
- 智能项目文件保存功能
- AI生成代码自动保存到项目合适位置
- 项目结构智能检测
- 基于文件类型的目录自动选择
- 增强的文件名生成策略
- 支持多种编程语言和文件格式

### Enhanced
- 改进AI响应处理逻辑
- 优化代码块提取和保存
- 增强文件路径智能识别
- 改进项目类型检测（React、Vue、Node.js等）
- 自动创建必要的目录结构

### Fixed
- 修复TypeScript类型错误
- 优化文件扩展名处理
- 改进错误处理机制

## [1.2.1] - 2024-01-15

### Fixed
- Updated configuration with new IP settings
- Improved connection stability
- Enhanced network configuration handling

### Changed
- Updated internal configuration parameters
- Optimized connection settings

## [1.2.0] - 2024-01-15

### Added
- Chinese documentation as default language
- English documentation with language switching
- Additional `link` command for better accessibility
- Enhanced installation troubleshooting guide
- Multi-language support in post-install instructions
- Comprehensive command options documentation

### Changed
- README.md now defaults to Chinese
- Enhanced user experience with multiple command options
- Improved installation guidance and error handling
- Updated all documentation with new command options

### Fixed
- Command registration issues on different systems
- PATH-related installation problems
- Missing command alternatives for better compatibility

## [1.1.1] - 2024-01-15

### Added
- Fixed binary command registration
- Enhanced documentation

## [1.1.0] - 2024-01-15

### Added
- Intelligent intent analysis with option selection
- Enhanced code review workflow
- User confirmation for file modifications

## [1.0.0] - 2024-01-15

### Added
- Initial release of LinChat
- Interactive AI chat with Ollama integration
- Smart intent analysis with multiple operation options
- Code review and modification capabilities
- Document processing (Markdown, JSON, YAML)
- File management operations (read, write, edit, delete)
- Auto-save functionality for AI-generated content
- Session management and chat history
- Multi-language support for code generation
- Automatic backup creation before file modifications
- User confirmation prompts for file changes
- Comprehensive error handling and recovery
- CLI commands for configuration and model management
- Global installation support with `l` command

### Features
- **Smart Intent Detection**: Automatically analyzes user requests and provides relevant options
- **Code Review Options**: Deep analysis, refactoring, security review, performance optimization
- **File Operations**: Read, write, search, convert documents with intelligent context
- **Auto-Save**: Detects save keywords and automatically saves code blocks to files
- **Session Persistence**: Maintains chat history across sessions
- **Document Context**: Automatically includes file content when processing modification requests
- **Multi-format Support**: JavaScript, TypeScript, Python, Java, C/C++, HTML, CSS, Markdown, JSON, YAML
- **Safety Features**: Backup creation, user confirmation, error recovery

### Technical
- Built with TypeScript for type safety
- Modular architecture with clear separation of concerns
- Comprehensive logging and debugging capabilities
- Cross-platform compatibility (Windows, macOS, Linux)
- Node.js 16+ requirement for modern JavaScript features
- Integration with Ollama for AI capabilities

### Commands
- `l` - Start interactive chat (default command)
- `l config` - Configuration management
- `l models` - Ollama model management
- `l history` - Chat session management
- Various in-chat commands for file operations

### Installation
- Available via npm: `npm install -g linchat`
- Global command: `l`
- Post-install guidance and setup instructions