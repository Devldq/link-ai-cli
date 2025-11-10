# LinChat

[English](README.en.md) | 中文

一个智能的AI驱动命令行聊天助手，具备文档处理、代码审查和文件管理功能。

## 🚀 功能特性

- **智能AI对话**: 与Ollama无缝集成，提供强大的AI对话体验
- **智能意图分析**: 智能检测用户意图，提供多种操作选项
- **代码审查与修改**: 高级代码分析、审查和自动化改进
- **文档处理**: 支持Markdown、JSON、YAML和文本文件
- **文件管理**: 轻松读取、写入、搜索和转换文档
- **自动保存**: 自动保存AI生成的代码和内容
- **会话管理**: 持久化聊天历史和会话管理
- **多语言支持**: 支持各种编程语言和文件格式

## 📦 安装

```bash
npm install -g linchat
```

## 🔧 前置要求

1. **Node.js 16.0.0 或更高版本**
2. **Ollama** 必须已安装并运行
   - 下载地址: https://ollama.ai/
   - 拉取模型: `ollama pull llama2`

## 🎯 快速开始

安装完成后，您可以使用以下任一命令启动：

```bash
l
# 或者
linchat
```

这将启动交互式AI聊天助手。

## 🔧 安装问题排查

如果安装后无法识别 `l` 命令：

1. **检查包是否已全局安装:**
   ```bash
   npm list -g linchat
   ```

2. **检查npm全局bin目录:**
   ```bash
   npm config get prefix
   ```

3. **确保npm全局bin目录在您的PATH中:**
   ```bash
   echo $PATH
   ```

4. **如需要，将npm全局bin添加到PATH:**
   ```bash
   # 对于bash/zsh用户，添加到 ~/.bashrc 或 ~/.zshrc:
   export PATH="$(npm config get prefix)/bin:$PATH"
   ```

5. **重启终端或重新加载shell配置:**
   ```bash
   source ~/.bashrc  # 或 ~/.zshrc
   ```

6. **备选方案：使用完整命令名:**
   ```bash
   linchat
   ```

## 📋 命令

### 主要命令
- `l / linchat` - 启动交互式聊天（默认）
- `l config` - 管理配置
- `l models` - 管理Ollama模型  
- `l history` - 管理聊天历史
- `l --help` - 显示帮助信息

### 聊天命令（在聊天界面内）
- `/help` - 显示可用命令
- `/read <文件>` - 读取文件内容
- `/write <文件> <内容>` - 将内容写入文件
- `/edit <文件>` - 编辑文件
- `/delete <文件>` - 删除文件（带备份）
- `/doc read <文件>` - 读取结构化文档
- `/search <文件> <查询>` - 在文档中搜索
- `/convert <源> <目标> <格式>` - 转换文档格式
- `/sessions` - 列出聊天会话
- `/load <会话>` - 加载特定会话
- `/clear` - 清除当前会话
- `/exit` - 退出应用

## 🎨 使用示例

### 代码审查
```bash
# 启动聊天后输入:
cr example.js
# 系统将提供多种审查选项:
# 1. 深度代码审查 + 改进建议
# 2. 代码审查 + 重构方案
# 3. 安全性审查
# 4. 性能优化审查
```

### 文件修改
```bash
# 修改现有文件:
修改 example.js
# 选择操作方案:
# 1. 改进现有代码
# 2. 修复问题
# 3. 添加新功能
# 4. 现代化代码
```

### 文档处理
```bash
# 读取文档:
/doc read README.md

# 在文档中搜索:
/search config.json "database"

# 转换格式:
/convert data.json data.yaml yaml
```

### 代码创建
```bash
# 创建新代码:
创建一个React组件
# 可选方案:
# 1. 从零开始创建
# 2. 使用模板创建
# 3. 创建示例代码
# 4. 基于现有文件创建
```

## 🔧 配置

### 查看配置
```bash
l config --list
```

### 设置配置
```bash
l config --set model=llama2
l config --set temperature=0.7
```

### 重置配置
```bash
l config --reset
```

## 🤖 模型管理

### 列出可用模型
```bash
l models --list
```

### 拉取新模型
```bash
l models --pull codellama
```

### 删除模型
```bash
l models --remove oldmodel
```

## 📚 会话管理

### 列出会话
```bash
l history --list
```

### 显示特定会话
```bash
l history --show session-id
```

### 导出会话
```bash
l history --export session-id
```

### 清除所有历史
```bash
l history --clear
```

## 🎯 智能功能

### 意图分析
系统智能分析您的请求并提供具体选项：
- **代码审查**: 多种审查方法（安全性、性能、重构）
- **修改**: 不同的改进策略
- **创建**: 各种创建方式
- **帮助**: 针对性的协助选项

### 自动保存
- 自动检测何时保存AI响应
- 提取代码块并保存到适当文件
- 支持多种编程语言
- 创建带时间戳的备份

### 文档上下文
- 提及文件时自动读取相关文件
- 为AI提供文件内容作为上下文
- 支持智能文件路径检测
- 使用当前文件状态增强AI响应

## 🛠️ 支持的文件格式

- **代码**: JavaScript, TypeScript, Python, Java, C/C++, HTML, CSS
- **文档**: Markdown, JSON, YAML, TXT
- **配置**: 各种配置文件格式

## 🔒 安全功能

- **自动备份**: 修改前自动备份文件
- **用户确认**: 应用更改到现有文件前提示确认
- **错误处理**: 全面的错误处理和恢复
- **验证**: 输入验证和格式检查

## 🐛 故障排除

### Ollama未运行
```bash
# 启动Ollama服务
ollama serve

# 如果没有可用模型，拉取一个
ollama pull llama2
```

### 权限问题
```bash
# 在macOS/Linux上，您可能需要:
sudo npm install -g linchat
```

### Node.js版本
```bash
# 检查Node.js版本
node --version

# 应该是16.0.0或更高版本
```

## 📝 许可证

MIT许可证 - 详见LICENSE文件。

## 🤝 贡献

欢迎贡献！请随时提交问题和拉取请求。

## 📞 支持

如有问题和疑问：
- GitHub Issues: https://github.com/link/linchat/issues
- 文档: https://github.com/link/linchat#readme

## 🎉 致谢

- 使用 [Ollama](https://ollama.ai/) 提供AI功能
- 基于 [Node.js](https://nodejs.org/) 和 [TypeScript](https://www.typescriptlang.org/) 构建
- 使用 [Commander.js](https://github.com/tj/commander.js/) 构建CLI界面
- 使用 [Chalk](https://github.com/chalk/chalk) 进行样式设计