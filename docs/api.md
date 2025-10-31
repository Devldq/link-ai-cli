# API参考

## 命令行接口

### 全局选项

所有命令都支持以下全局选项：

```bash
--config <path>     # 指定配置文件路径
--verbose, -v       # 详细输出模式
--quiet, -q         # 静默模式
--help, -h          # 显示帮助信息
--version           # 显示版本信息
--format <format>   # 输出格式 (json|text|markdown|html)
--output <path>     # 输出文件路径
```

## 命令详细说明

### ai-cli continue

代码续写命令

```bash
ai-cli continue [options]
```

**选项：**
- `--file <path>` - 指定文件路径（支持glob模式）
- `--line <number>` - 指定续写起始行号
- `--length <number>` - 续写代码行数（默认：10）
- `--suggestions <number>` - 生成建议数量（默认：3）
- `--interactive, -i` - 交互式模式
- `--context <number>` - 上下文行数（默认：50）
- `--language <lang>` - 强制指定编程语言

**示例：**
```bash
ai-cli continue --file src/utils.js --line 42 --length 15
ai-cli continue --file "src/**/*.ts" --suggestions 5
ai-cli continue --interactive
```

### ai-cli review

代码审查命令

```bash
ai-cli review [options]
```

**选项：**
- `--file <path>` - 审查单个文件
- `--dir <path>` - 审查目录
- `--rules <rules>` - 指定审查规则（逗号分隔）
- `--severity <level>` - 问题严重级别过滤（error|warning|info）
- `--fix` - 自动修复问题
- `--staged` - 只审查Git暂存的文件
- `--exclude <pattern>` - 排除文件模式

**可用规则：**
- `security` - 安全问题检查
- `performance` - 性能问题检查
- `maintainability` - 可维护性检查
- `style` - 代码风格检查
- `bugs` - 潜在bug检查
- `complexity` - 复杂度检查

**示例：**
```bash
ai-cli review --file src/app.js --rules security,performance
ai-cli review --dir src/ --severity error --fix
ai-cli review --staged --format json
```

### ai-cli spec

规格文档生成命令

```bash
ai-cli spec [options]
```

**选项：**
- `--from-code <path>` - 从代码生成spec
- `--from-requirements <path>` - 从需求文档生成spec
- `--template <name>` - 使用指定模板
- `--sections <sections>` - 包含的章节（逗号分隔）
- `--api` - 生成API文档
- `--interactive, -i` - 交互式生成

**可用模板：**
- `default` - 默认模板
- `api` - API服务模板
- `library` - 库/SDK模板
- `webapp` - Web应用模板
- `mobile` - 移动应用模板

**可用章节：**
- `overview` - 项目概述
- `requirements` - 功能需求
- `architecture` - 技术架构
- `api` - API设计
- `database` - 数据库设计
- `testing` - 测试策略
- `deployment` - 部署方案
- `security` - 安全考虑

**示例：**
```bash
ai-cli spec --from-code src/ --template api
ai-cli spec --from-requirements docs/requirements.md --sections overview,api,testing
ai-cli spec --interactive
```

### ai-cli vibe

Vibe编程命令

```bash
ai-cli vibe <description> [options]
```

**选项：**
- `--lang <language>` - 目标编程语言
- `--framework <framework>` - 使用的框架
- `--style <style>` - 代码风格指南
- `--include-tests` - 包含测试代码
- `--include-docs` - 包含文档注释
- `--interactive, -i` - 交互式模式
- `--template <template>` - 使用代码模板

**支持的语言：**
- `javascript`, `typescript`, `python`, `java`, `go`, `rust`, `cpp`, `csharp`

**支持的框架：**
- **JavaScript/TypeScript**: `react`, `vue`, `angular`, `express`, `nestjs`, `nextjs`
- **Python**: `django`, `flask`, `fastapi`, `pandas`, `pytorch`
- **Java**: `spring`, `springboot`, `android`
- **Go**: `gin`, `echo`, `fiber`

**示例：**
```bash
ai-cli vibe "创建用户认证中间件" --lang javascript --framework express
ai-cli vibe "实现数据可视化图表" --lang python --framework matplotlib --include-tests
ai-cli vibe "创建响应式导航组件" --lang typescript --framework react --style airbnb
```

### ai-cli config

配置管理命令

```bash
ai-cli config <action> [options]
```

**操作：**
- `list` - 列出所有配置
- `get <key>` - 获取配置值
- `set <key> <value>` - 设置配置值
- `unset <key>` - 删除配置项
- `reset` - 重置所有配置
- `export --output <file>` - 导出配置
- `import --file <file>` - 导入配置

**示例：**
```bash
ai-cli config list
ai-cli config set api.provider openai
ai-cli config get api.model
ai-cli config export --output my-config.json
```

## 编程接口

### Node.js API

```javascript
const { AICli } = require('ai-cli');

const cli = new AICli({
  apiKey: 'your-api-key',
  provider: 'openai',
  model: 'gpt-4'
});

// 代码续写
const continueResult = await cli.continue({
  file: 'src/app.js',
  line: 42,
  length: 10
});

// 代码审查
const reviewResult = await cli.review({
  file: 'src/app.js',
  rules: ['security', 'performance']
});

// Spec生成
const specResult = await cli.generateSpec({
  fromCode: 'src/',
  template: 'api'
});

// Vibe编程
const vibeResult = await cli.vibe({
  description: '创建用户登录组件',
  language: 'typescript',
  framework: 'react'
});
```

### Python API

```python
from ai_cli import AICli

cli = AICli(
    api_key='your-api-key',
    provider='openai',
    model='gpt-4'
)

# 代码续写
result = cli.continue(
    file='src/app.py',
    line=42,
    length=10
)

# 代码审查
result = cli.review(
    file='src/app.py',
    rules=['security', 'performance']
)

# Spec生成
result = cli.generate_spec(
    from_code='src/',
    template='api'
)

# Vibe编程
result = cli.vibe(
    description='创建用户认证装饰器',
    language='python',
    framework='flask'
)
```

## 返回数据格式

### 代码续写返回格式

```json
{
  "success": true,
  "suggestions": [
    {
      "id": 1,
      "code": "function add(a, b) {\n  return a + b;\n}",
      "confidence": 0.95,
      "description": "添加数学运算函数"
    }
  ],
  "metadata": {
    "file": "src/utils.js",
    "line": 42,
    "language": "javascript",
    "contextLines": 50
  }
}
```

### 代码审查返回格式

```json
{
  "success": true,
  "issues": [
    {
      "file": "src/app.js",
      "line": 23,
      "column": 15,
      "severity": "error",
      "rule": "security",
      "message": "潜在的SQL注入风险",
      "suggestion": "使用参数化查询",
      "fixable": true
    }
  ],
  "summary": {
    "totalIssues": 5,
    "errors": 2,
    "warnings": 3,
    "infos": 0,
    "score": 7.2
  }
}
```

### Spec生成返回格式

```json
{
  "success": true,
  "spec": {
    "title": "用户管理API",
    "sections": {
      "overview": "项目概述内容...",
      "requirements": "功能需求内容...",
      "api": "API设计内容..."
    },
    "metadata": {
      "template": "api",
      "generatedAt": "2024-01-01T00:00:00Z",
      "wordCount": 2500
    }
  }
}
```

### Vibe编程返回格式

```json
{
  "success": true,
  "files": [
    {
      "path": "src/components/UserCard.jsx",
      "content": "import React from 'react'...",
      "language": "javascript",
      "type": "component"
    },
    {
      "path": "src/components/UserCard.test.jsx",
      "content": "import { render } from '@testing-library/react'...",
      "language": "javascript",
      "type": "test"
    }
  ],
  "metadata": {
    "description": "创建用户卡片组件",
    "language": "typescript",
    "framework": "react",
    "filesGenerated": 2
  }
}
```