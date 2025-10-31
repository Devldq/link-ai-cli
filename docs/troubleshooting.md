# 故障排除

## 常见问题

### 安装问题

#### 问题：npm install -g ai-cli 失败

**症状：**
```bash
npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path /usr/local/lib/node_modules/ai-cli
npm ERR! errno -13
```

**解决方案：**
```bash
# 方案1：使用sudo（不推荐）
sudo npm install -g ai-cli

# 方案2：配置npm全局目录（推荐）
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g ai-cli

# 方案3：使用nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
npm install -g ai-cli
```

#### 问题：Node.js版本不兼容

**症状：**
```bash
ai-cli: command not found
或
SyntaxError: Unexpected token '?'
```

**解决方案：**
```bash
# 检查Node.js版本
node --version

# 如果版本低于16.0.0，需要升级
# 使用nvm升级
nvm install 18
nvm use 18

# 或使用官方安装包
# 访问 https://nodejs.org 下载最新版本
```

### 配置问题

#### 问题：API密钥配置错误

**症状：**
```bash
Error: Invalid API key
或
Error: Unauthorized (401)
```

**解决方案：**
```bash
# 检查当前配置
ai-cli config list

# 重新设置API密钥
ai-cli config set api.apiKey your-correct-api-key

# 验证配置
ai-cli config get api.apiKey

# 测试连接
ai-cli vibe "测试连接" --lang javascript
```

#### 问题：配置文件损坏

**症状：**
```bash
Error: Cannot parse config file
或
SyntaxError: Unexpected token in JSON
```

**解决方案：**
```bash
# 备份现有配置
cp ~/.ai-cli/config.json ~/.ai-cli/config.json.backup

# 重置配置
ai-cli config reset

# 重新初始化
ai-cli init

# 或手动修复JSON格式
vi ~/.ai-cli/config.json
```

### 网络问题

#### 问题：网络连接超时

**症状：**
```bash
Error: Request timeout
或
Error: ECONNRESET
```

**解决方案：**
```bash
# 设置代理（如果在防火墙后）
ai-cli config set proxy http://proxy.company.com:8080

# 增加超时时间
ai-cli config set timeout 60000

# 使用不同的API端点
ai-cli config set api.endpoint https://api.openai.com/v1

# 检查网络连接
curl -I https://api.openai.com/v1/models
```

#### 问题：SSL证书错误

**症状：**
```bash
Error: certificate verify failed
或
Error: CERT_UNTRUSTED
```

**解决方案：**
```bash
# 临时禁用SSL验证（不推荐用于生产）
export NODE_TLS_REJECT_UNAUTHORIZED=0

# 或配置自定义CA证书
ai-cli config set ssl.ca /path/to/ca-cert.pem

# 或使用系统证书
ai-cli config set ssl.rejectUnauthorized false
```

### 功能问题

#### 问题：代码续写不准确

**症状：**
- 生成的代码与上下文不符
- 语法错误
- 逻辑错误

**解决方案：**
```bash
# 增加上下文行数
ai-cli continue --file src/app.js --context 100

# 指定编程语言
ai-cli continue --file src/app.js --language javascript

# 使用更强的模型
ai-cli config set api.model gpt-4

# 调整温度参数
ai-cli config set api.temperature 0.3

# 提供更多上下文信息
ai-cli continue --file src/app.js --line 42 --context "这是一个用户认证模块"
```

#### 问题：代码审查误报

**症状：**
- 报告不存在的问题
- 忽略真实问题
- 建议不合理

**解决方案：**
```bash
# 调整审查规则
ai-cli review --file src/app.js --rules security,performance

# 排除特定文件类型
ai-cli review --dir src/ --exclude "*.test.js,*.spec.js"

# 使用不同的严重级别
ai-cli review --file src/app.js --severity warning

# 更新审查配置
ai-cli config set review.rules.style false
ai-cli config set review.includeFixSuggestions true
```

#### 问题：Vibe编程生成代码不符合要求

**症状：**
- 生成的代码风格不一致
- 缺少必要功能
- 框架使用错误

**解决方案：**
```bash
# 提供更详细的描述
ai-cli vibe "创建React函数组件UserCard，包含props类型定义、样式模块、点击事件处理" \
  --lang typescript --framework react

# 指定代码风格
ai-cli config set vibe.styleGuide airbnb

# 包含更多上下文
ai-cli vibe "基于现有的Button组件，创建IconButton组件" \
  --context-file src/components/Button.tsx

# 使用交互式模式获得更精确的结果
ai-cli vibe --interactive
```

### 性能问题

#### 问题：响应速度慢

**症状：**
- 命令执行时间过长
- 频繁超时

**解决方案：**
```bash
# 使用更快的模型
ai-cli config set api.model gpt-3.5-turbo

# 减少生成长度
ai-cli continue --file src/app.js --length 10

# 启用缓存
ai-cli config set cache.enabled true
ai-cli config set cache.ttl 3600

# 并行处理
ai-cli review --dir src/ --parallel 4

# 使用本地模型（如果可用）
ai-cli config set api.provider ollama
ai-cli config set api.endpoint http://localhost:11434
```

#### 问题：内存使用过高

**症状：**
```bash
JavaScript heap out of memory
或
Process killed
```

**解决方案：**
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 分批处理大文件
ai-cli review --dir src/ --batch-size 10

# 排除大文件
ai-cli review --dir src/ --exclude "*.min.js,dist/**"

# 清理缓存
ai-cli config set cache.enabled false
rm -rf ~/.ai-cli/cache/
```

## 调试技巧

### 启用详细日志

```bash
# 设置调试级别
export AI_CLI_LOG_LEVEL=debug
export DEBUG=ai-cli:*

# 运行命令查看详细输出
ai-cli continue --file src/app.js --verbose

# 保存日志到文件
ai-cli review --dir src/ --verbose > debug.log 2>&1
```

### 检查配置

```bash
# 显示所有配置
ai-cli config list --verbose

# 检查特定配置项
ai-cli config get api
ai-cli config get review

# 验证配置文件
cat ~/.ai-cli/config.json | jq .

# 检查环境变量
env | grep AI_CLI
```

### 测试连接

```bash
# 测试API连接
ai-cli vibe "console.log('Hello World')" --lang javascript

# 检查模型可用性
curl -H "Authorization: Bearer $AI_CLI_API_KEY" \
  https://api.openai.com/v1/models

# 测试代理连接
curl --proxy $AI_CLI_PROXY -I https://api.openai.com
```

## 错误代码参考

### 退出代码

- `0` - 成功
- `1` - 一般错误
- `2` - 配置错误
- `3` - 网络错误
- `4` - API错误
- `5` - 文件系统错误
- `6` - 解析错误

### 常见错误消息

#### ENOENT: no such file or directory

**原因：** 指定的文件或目录不存在

**解决：**
```bash
# 检查文件路径
ls -la src/app.js

# 使用绝对路径
ai-cli continue --file /full/path/to/src/app.js

# 检查当前工作目录
pwd
```

#### Invalid JSON response

**原因：** API返回了非JSON格式的响应

**解决：**
```bash
# 检查API状态
curl -I https://api.openai.com/v1

# 更换API端点
ai-cli config set api.endpoint https://api.openai.com/v1

# 检查API密钥格式
ai-cli config get api.apiKey
```

#### Rate limit exceeded

**原因：** 超过了API调用频率限制

**解决：**
```bash
# 等待一段时间后重试
sleep 60 && ai-cli continue --file src/app.js

# 配置重试策略
ai-cli config set api.retries 3
ai-cli config set api.retryDelay 5000

# 使用不同的API密钥
ai-cli config set api.apiKey your-other-api-key
```

## 获取帮助

### 内置帮助

```bash
# 查看命令帮助
ai-cli --help
ai-cli continue --help
ai-cli review --help

# 查看配置选项
ai-cli config --help

# 查看版本信息
ai-cli --version
```

### 社区支持

- **GitHub Issues**: https://github.com/your-org/ai-cli/issues
- **讨论区**: https://github.com/your-org/ai-cli/discussions
- **文档**: https://ai-cli.dev/docs
- **示例**: https://github.com/your-org/ai-cli-examples

### 报告问题

提交问题时请包含：

1. **系统信息**
   ```bash
   ai-cli --version
   node --version
   npm --version
   uname -a
   ```

2. **配置信息**
   ```bash
   ai-cli config list --verbose
   ```

3. **错误日志**
   ```bash
   AI_CLI_LOG_LEVEL=debug ai-cli your-command 2>&1 | tee error.log
   ```

4. **重现步骤**
   - 详细的命令序列
   - 输入文件示例
   - 预期结果 vs 实际结果