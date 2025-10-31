# 安装指南

## 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- 操作系统：Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)

## 安装方式

### 方式一：NPM全局安装（推荐）

```bash
npm install -g ai-cli
```

### 方式二：Yarn全局安装

```bash
yarn global add ai-cli
```

### 方式三：从源码安装

```bash
git clone https://github.com/your-org/ai-cli.git
cd ai-cli
npm install
npm run build
npm link
```

## 验证安装

```bash
ai-cli --version
ai-cli --help
```

## 配置API密钥

安装完成后，需要配置AI服务的API密钥：

```bash
ai-cli config set api-key YOUR_API_KEY
ai-cli config set model gpt-4
ai-cli config set endpoint https://api.openai.com/v1
```

## 支持的AI服务

- OpenAI GPT-3.5/GPT-4
- Anthropic Claude
- Google Gemini
- 本地模型（Ollama）
- Azure OpenAI

## 故障排除

### 权限问题

如果遇到权限错误，可能需要使用sudo（Linux/macOS）：

```bash
sudo npm install -g ai-cli
```

### 网络问题

如果在中国大陆使用，可能需要配置代理：

```bash
ai-cli config set proxy http://127.0.0.1:7890
```

### 版本冲突

如果存在旧版本，先卸载：

```bash
npm uninstall -g ai-cli
npm install -g ai-cli@latest
```