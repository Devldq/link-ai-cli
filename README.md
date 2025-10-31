# AI CLI Chat

一个基于 Ollama 的 AI 命令行聊天应用程序，支持代码生成、代码审查和安全执行。

## 功能特性

- 🤖 **AI 聊天**: 与 Ollama AI 模型进行交互式对话
- 💻 **代码生成**: 支持多种编程语言的代码生成
- 🔍 **代码审查**: 自动检测代码中的安全漏洞、性能问题和最佳实践
- 🛡️ **安全执行**: 在沙箱环境中安全执行代码
- 📝 **会话管理**: 保存和管理聊天历史
- ⚙️ **配置管理**: 灵活的配置系统

## 安装

### 前置要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Ollama (需要先安装并运行 Ollama 服务)

### 安装 Ollama

```bash
# macOS
brew install ollama

# 或者从官网下载: https://ollama.ai
```

### 安装 AI CLI Chat

```bash
# 克隆项目
git clone <repository-url>
cd ai-cli-chat

# 安装依赖
npm install

# 构建项目
npm run build

# 全局安装
npm link
```

## 使用方法

### 启动聊天

```bash
# 使用 link 命令启动
link

# 或者使用 l 别名
l
```

### 命令行选项

```bash
link --help                    # 显示帮助信息
link --verbose                 # 启用详细输出
link --config <path>           # 指定配置文件路径
link config --list             # 显示当前配置
link models --list             # 列出可用模型
link history --list            # 显示聊天历史
```

### 聊天命令

在聊天界面中，你可以使用以下命令：

- `/help` - 显示帮助信息
- `/exit` - 退出聊天
- `/clear` - 清除当前聊天历史
- `/save` - 保存当前会话
- `/models` - 列出可用的 AI 模型
- `/config` - 显示当前配置
- `/history` - 显示会话历史

## 配置

应用程序会在用户主目录下创建配置文件：`~/.ai-cli-chat/config.json`

### 默认配置

```json
{
  "ollama": {
    "endpoint": "http://localhost:11434",
    "model": "llama3.2:1b",
    "timeout": 30000,
    "maxTokens": 2048,
    "temperature": 0.7
  },
  "codeGeneration": {
    "defaultLanguage": "typescript",
    "defaultFramework": "node",
    "includeComments": true,
    "includeTests": false,
    "outputDirectory": "./generated"
  },
  "codeReview": {
    "enabledRules": ["security", "performance", "style", "maintainability"],
    "severity": ["error", "warning", "info"],
    "autoFix": false,
    "reportFormat": "markdown"
  },
  "execution": {
    "timeout": 10000,
    "sandboxEnabled": true,
    "allowNetworkAccess": false,
    "allowFileSystemAccess": false
  },
  "ui": {
    "theme": "auto",
    "showProgress": true,
    "verboseOutput": false
  },
  "security": {
    "enableSandbox": true,
    "allowedModules": ["fs", "path", "util", "crypto"],
    "restrictedPaths": ["/etc", "/usr", "/bin", "/sbin"],
    "maxExecutionTime": 10000
  }
}
```

### 修改配置

```bash
# 设置配置值
link config --set ollama.model=llama3.2:3b
link config --set codeGeneration.defaultLanguage=python

# 获取配置值
link config --get ollama.model

# 重置配置
link config --reset
```

## 使用示例

### 代码生成

```
💬 You: 生成一个 TypeScript 函数来计算斐波那契数列

🤖 AI: 我来为你生成一个计算斐波那契数列的 TypeScript 函数：

```typescript
/**
 * 计算斐波那契数列的第 n 项
 * @param n 要计算的项数（从 0 开始）
 * @returns 斐波那契数列的第 n 项
 */
function fibonacci(n: number): number {
  // 【AI 李大庆】: 处理边界情况
  if (n < 0) {
    throw new Error('输入必须是非负整数');
  }
  
  if (n <= 1) {
    return n;
  }
  
  // 【AI 李大庆】: 使用动态规划优化性能
  let prev = 0;
  let curr = 1;
  
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  
  return curr;
}

// 使用示例
console.log(fibonacci(10)); // 输出: 55
```
```

### 代码审查

```
💬 You: 请审查这段代码的安全性：
function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return database.query(query);
}

🤖 AI: 我发现了这段代码中的一个严重安全问题：

**安全漏洞：SQL 注入**
- 问题：直接将用户输入拼接到 SQL 查询中
- 风险：攻击者可以注入恶意 SQL 代码
- 建议：使用参数化查询

**修复后的安全代码：**
```javascript
function getUserData(userId) {
  // 【AI 李大庆】: 使用参数化查询防止 SQL 注入
  const query = "SELECT * FROM users WHERE id = ?";
  return database.query(query, [userId]);
}
```
```

## 开发

### 项目结构

```
src/
├── app/                 # 应用程序主类
├── core/               # 核心功能模块
├── providers/          # AI 提供商接口
├── services/           # 业务服务
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── index.ts            # 应用程序入口
```

### 开发命令

```bash
npm run dev             # 开发模式运行
npm run build           # 构建项目
npm run test            # 运行测试
npm run lint            # 代码检查
npm run format          # 代码格式化
```

## 故障排除

### Ollama 连接问题

1. 确保 Ollama 服务正在运行：
   ```bash
   ollama serve
   ```

2. 检查 Ollama 是否可访问：
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. 拉取所需的模型：
   ```bash
   ollama pull llama3.2:1b
   ```

### 权限问题

如果遇到权限问题，确保有足够的权限访问配置目录：
```bash
chmod 755 ~/.ai-cli-chat
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License