# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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