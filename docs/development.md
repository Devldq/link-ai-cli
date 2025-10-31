# 开发指南

## 项目架构

### 目录结构

```
ai-cli/
├── src/
│   ├── commands/           # 命令实现
│   │   ├── continue.js     # 代码续写
│   │   ├── review.js       # 代码审查
│   │   ├── spec.js         # Spec生成
│   │   ├── vibe.js         # Vibe编程
│   │   └── config.js       # 配置管理
│   ├── core/               # 核心模块
│   │   ├── ai-client.js    # AI服务客户端
│   │   ├── code-parser.js  # 代码解析器
│   │   ├── file-manager.js # 文件管理器
│   │   └── config-manager.js # 配置管理器
│   ├── utils/              # 工具函数
│   │   ├── logger.js       # 日志工具
│   │   ├── validator.js    # 输入验证
│   │   └── formatter.js    # 输出格式化
│   ├── templates/          # 模板文件
│   │   ├── spec/           # Spec模板
│   │   └── code/           # 代码模板
│   └── index.js            # 入口文件
├── tests/                  # 测试文件
├── docs/                   # 文档
├── package.json
└── README.md
```

### 核心组件

#### AI客户端 (AIClient)

负责与各种AI服务提供商的交互。

```javascript
class AIClient {
  constructor(config) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.endpoint = config.endpoint;
  }

  async complete(prompt, options = {}) {
    // 实现代码补全
  }

  async chat(messages, options = {}) {
    // 实现对话交互
  }

  async analyze(code, rules) {
    // 实现代码分析
  }
}
```

#### 代码解析器 (CodeParser)

解析和分析代码结构。

```javascript
class CodeParser {
  static detectLanguage(filePath) {
    // 检测编程语言
  }

  static parseAST(code, language) {
    // 解析抽象语法树
  }

  static extractContext(code, line, contextLines) {
    // 提取上下文
  }

  static findFunctions(ast) {
    // 查找函数定义
  }
}
```

#### 文件管理器 (FileManager)

处理文件操作和项目结构分析。

```javascript
class FileManager {
  static async readFile(filePath) {
    // 读取文件
  }

  static async writeFile(filePath, content) {
    // 写入文件
  }

  static async scanProject(rootPath, options = {}) {
    // 扫描项目结构
  }

  static async findFiles(pattern, options = {}) {
    // 查找文件
  }
}
```

## 开发环境设置

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### 克隆和安装

```bash
git clone https://github.com/your-org/ai-cli.git
cd ai-cli
npm install
```

### 开发脚本

```bash
# 开发模式运行
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 代码检查
npm run lint

# 格式化代码
npm run format

# 生成文档
npm run docs
```

### 环境变量

创建`.env.development`文件：

```bash
# AI服务配置
AI_CLI_API_KEY=your-development-api-key
AI_CLI_MODEL=gpt-3.5-turbo
AI_CLI_PROVIDER=openai

# 调试配置
DEBUG=ai-cli:*
LOG_LEVEL=debug

# 测试配置
TEST_TIMEOUT=30000
```

## 添加新功能

### 1. 创建新命令

在`src/commands/`目录下创建新的命令文件：

```javascript
// src/commands/new-feature.js
const { Command } = require('commander');
const { AIClient } = require('../core/ai-client');
const { logger } = require('../utils/logger');

class NewFeatureCommand {
  static create() {
    return new Command('new-feature')
      .description('新功能描述')
      .option('-f, --file <path>', '文件路径')
      .option('-o, --output <path>', '输出路径')
      .action(this.execute);
  }

  static async execute(options) {
    try {
      logger.info('执行新功能...');
      
      // 实现功能逻辑
      const result = await this.processFeature(options);
      
      logger.success('功能执行完成');
      return result;
    } catch (error) {
      logger.error('功能执行失败:', error.message);
      process.exit(1);
    }
  }

  static async processFeature(options) {
    // 具体实现
  }
}

module.exports = NewFeatureCommand;
```

### 2. 注册命令

在`src/index.js`中注册新命令：

```javascript
const { program } = require('commander');
const NewFeatureCommand = require('./commands/new-feature');

program.addCommand(NewFeatureCommand.create());
```

### 3. 添加测试

在`tests/commands/`目录下创建测试文件：

```javascript
// tests/commands/new-feature.test.js
const { describe, it, expect } = require('@jest/globals');
const NewFeatureCommand = require('../../src/commands/new-feature');

describe('NewFeatureCommand', () => {
  it('should execute successfully', async () => {
    const options = { file: 'test.js' };
    const result = await NewFeatureCommand.execute(options);
    
    expect(result).toBeDefined();
  });
});
```

## AI提供商集成

### 添加新的AI提供商

1. 在`src/core/providers/`目录下创建提供商实现：

```javascript
// src/core/providers/custom-provider.js
class CustomProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
  }

  async complete(prompt, options = {}) {
    // 实现代码补全API调用
    const response = await fetch(`${this.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        ...options
      })
    });

    return response.json();
  }

  async chat(messages, options = {}) {
    // 实现对话API调用
  }
}

module.exports = CustomProvider;
```

2. 在`src/core/ai-client.js`中注册提供商：

```javascript
const CustomProvider = require('./providers/custom-provider');

class AIClient {
  static createProvider(config) {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'custom':
        return new CustomProvider(config);
      default:
        throw new Error(`不支持的提供商: ${config.provider}`);
    }
  }
}
```

## 测试

### 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- tests/commands/continue.test.js

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 集成测试

```bash
# 运行集成测试
npm run test:integration

# 运行端到端测试
npm run test:e2e
```

### 测试示例

```javascript
// tests/integration/continue.integration.test.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Continue Command Integration', () => {
  const testFile = path.join(__dirname, 'fixtures/test.js');
  
  beforeEach(() => {
    // 准备测试文件
    fs.writeFileSync(testFile, 'function add(a, b) {\n  // TODO: implement\n}');
  });

  afterEach(() => {
    // 清理测试文件
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it('should continue code successfully', () => {
    const result = execSync(`node src/index.js continue --file ${testFile}`, {
      encoding: 'utf8'
    });

    expect(result).toContain('代码续写完成');
  });
});
```

## 调试

### 启用调试模式

```bash
# 设置调试环境变量
export DEBUG=ai-cli:*
export AI_CLI_LOG_LEVEL=debug

# 运行命令
ai-cli continue --file test.js
```

### 使用调试器

```bash
# 使用Node.js调试器
node --inspect-brk src/index.js continue --file test.js

# 使用VS Code调试
# 在.vscode/launch.json中配置调试配置
```

### 日志记录

```javascript
const { logger } = require('../utils/logger');

// 不同级别的日志
logger.debug('调试信息');
logger.info('普通信息');
logger.warn('警告信息');
logger.error('错误信息');
logger.success('成功信息');
```

## 发布流程

### 版本管理

```bash
# 更新版本号
npm version patch  # 补丁版本
npm version minor  # 次要版本
npm version major  # 主要版本

# 推送标签
git push origin --tags
```

### 构建和发布

```bash
# 构建项目
npm run build

# 运行所有测试
npm test

# 发布到npm
npm publish

# 发布beta版本
npm publish --tag beta
```

### CI/CD配置

GitHub Actions配置示例：

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - run: npm ci
    - run: npm test
    - run: npm run lint

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
        registry-url: 'https://registry.npmjs.org'
    
    - run: npm ci
    - run: npm run build
    - run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 贡献指南

### 代码规范

- 使用ESLint和Prettier进行代码格式化
- 遵循JavaScript Standard Style
- 编写清晰的注释和文档
- 保持函数简洁，单一职责

### 提交规范

使用Conventional Commits格式：

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

### Pull Request流程

1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request
5. 代码审查
6. 合并到主分支