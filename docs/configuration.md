# 配置说明

## 配置文件位置

AI CLI使用以下配置文件：

- 全局配置：`~/.ai-cli/config.json`
- 项目配置：`./ai-cli.config.json`
- 环境变量：`.env`

## 基础配置

### API配置

```json
{
  "api": {
    "provider": "openai",
    "apiKey": "your-api-key",
    "endpoint": "https://api.openai.com/v1",
    "model": "gpt-4",
    "maxTokens": 2048,
    "temperature": 0.7
  }
}
```

### 支持的提供商

```json
{
  "providers": {
    "openai": {
      "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
      "endpoint": "https://api.openai.com/v1"
    },
    "anthropic": {
      "models": ["claude-3-sonnet", "claude-3-opus"],
      "endpoint": "https://api.anthropic.com"
    },
    "gemini": {
      "models": ["gemini-pro", "gemini-pro-vision"],
      "endpoint": "https://generativelanguage.googleapis.com"
    },
    "ollama": {
      "models": ["llama2", "codellama", "mistral"],
      "endpoint": "http://localhost:11434"
    }
  }
}
```

## 功能配置

### 代码续写配置

```json
{
  "continue": {
    "contextLines": 50,
    "maxSuggestions": 3,
    "languages": ["javascript", "typescript", "python", "java", "go"],
    "excludePatterns": ["node_modules/**", "*.min.js", "dist/**"]
  }
}
```

### 代码审查配置

```json
{
  "review": {
    "rules": {
      "security": true,
      "performance": true,
      "maintainability": true,
      "style": true
    },
    "severity": ["error", "warning", "info"],
    "outputFormat": "markdown",
    "includeFixSuggestions": true
  }
}
```

### Spec生成配置

```json
{
  "spec": {
    "template": "default",
    "sections": [
      "overview",
      "requirements",
      "architecture",
      "api",
      "testing",
      "deployment"
    ],
    "outputFormat": "markdown",
    "includeCodeExamples": true
  }
}
```

### Vibe编程配置

```json
{
  "vibe": {
    "defaultLanguage": "typescript",
    "framework": "react",
    "styleGuide": "airbnb",
    "includeTests": true,
    "includeComments": true
  }
}
```

## 命令行配置

使用CLI命令进行配置：

```bash
# 查看所有配置
ai-cli config list

# 设置配置项
ai-cli config set api.provider openai
ai-cli config set api.apiKey your-key
ai-cli config set api.model gpt-4

# 获取配置项
ai-cli config get api.provider

# 删除配置项
ai-cli config unset api.proxy

# 重置配置
ai-cli config reset
```

## 环境变量

```bash
# API配置
export AI_CLI_API_KEY=your-api-key
export AI_CLI_MODEL=gpt-4
export AI_CLI_PROVIDER=openai

# 代理配置
export AI_CLI_PROXY=http://127.0.0.1:7890
export AI_CLI_TIMEOUT=30000

# 调试模式
export AI_CLI_DEBUG=true
export AI_CLI_LOG_LEVEL=debug
```

## 项目级配置

在项目根目录创建`ai-cli.config.json`：

```json
{
  "extends": "~/.ai-cli/config.json",
  "vibe": {
    "defaultLanguage": "python",
    "framework": "fastapi",
    "includeDocstrings": true
  },
  "review": {
    "rules": {
      "pythonSpecific": true
    }
  }
}
```