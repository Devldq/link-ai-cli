# 贡献指南

感谢您对AI CLI项目的关注！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 报告bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 开发新功能
- 🧪 编写测试
- 🌐 翻译文档

## 开始之前

### 行为准则

参与本项目即表示您同意遵守我们的[行为准则](CODE_OF_CONDUCT.md)。请确保在所有互动中保持尊重和包容。

### 开发环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git
- 一个支持TypeScript的编辑器（推荐VS Code）

## 如何贡献

### 报告问题

在报告问题之前，请：

1. **搜索现有问题** - 检查是否已有相似问题
2. **使用最新版本** - 确保使用最新版本的AI CLI
3. **提供详细信息** - 使用问题模板提供完整信息

#### 问题报告模板

```markdown
**问题描述**
简洁清晰地描述问题。

**重现步骤**
1. 执行命令 '...'
2. 查看输出 '...'
3. 发现错误 '...'

**预期行为**
描述您期望发生的情况。

**实际行为**
描述实际发生的情况。

**环境信息**
- AI CLI版本: [例如 1.0.0]
- Node.js版本: [例如 18.17.0]
- 操作系统: [例如 macOS 13.4]
- AI提供商: [例如 OpenAI]

**附加信息**
- 错误日志
- 配置文件内容
- 相关截图
```

### 功能建议

提出新功能建议时，请：

1. **描述用例** - 解释为什么需要这个功能
2. **提供示例** - 展示功能的使用方式
3. **考虑影响** - 思考对现有功能的影响

#### 功能建议模板

```markdown
**功能描述**
简洁描述建议的功能。

**问题背景**
这个功能解决什么问题？

**解决方案**
详细描述您希望的解决方案。

**替代方案**
描述您考虑过的其他解决方案。

**使用示例**
```bash
# 展示功能的使用方式
ai-cli new-feature --option value
```

**附加信息**
任何其他相关信息或截图。
```

## 开发流程

### 1. Fork和克隆

```bash
# Fork项目到您的GitHub账户
# 然后克隆您的fork

git clone https://github.com/YOUR_USERNAME/ai-cli.git
cd ai-cli

# 添加上游仓库
git remote add upstream https://github.com/original-org/ai-cli.git
```

### 2. 设置开发环境

```bash
# 安装依赖
npm install

# 创建环境配置
cp .env.example .env.development

# 编辑配置文件，添加您的API密钥
vi .env.development
```

### 3. 创建功能分支

```bash
# 从main分支创建新分支
git checkout -b feature/your-feature-name

# 或者修复bug
git checkout -b fix/issue-number
```

### 4. 开发和测试

```bash
# 开发模式运行
npm run dev

# 运行测试
npm test

# 运行特定测试
npm test -- --testNamePattern="your test"

# 代码检查
npm run lint

# 格式化代码
npm run format
```

### 5. 提交变更

#### 提交消息规范

我们使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

**类型：**
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档变更
- `style`: 代码格式调整（不影响代码运行）
- `refactor`: 代码重构
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI配置文件和脚本的变动

**示例：**
```bash
git commit -m "feat(continue): 添加多行代码续写支持"
git commit -m "fix(review): 修复安全规则误报问题"
git commit -m "docs: 更新API文档示例"
```

### 6. 推送和创建Pull Request

```bash
# 推送到您的fork
git push origin feature/your-feature-name

# 在GitHub上创建Pull Request
```

## Pull Request指南

### PR标题和描述

- **标题**: 使用清晰简洁的标题描述变更
- **描述**: 详细说明变更内容、原因和影响

#### PR模板

```markdown
## 变更类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 变更描述
简洁描述这个PR的变更内容。

## 相关问题
关闭 #issue_number

## 测试
- [ ] 添加了新的测试
- [ ] 所有测试通过
- [ ] 手动测试通过

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 自我审查了代码变更
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 变更不会破坏现有功能

## 截图（如适用）
添加截图来说明变更。
```

### 代码审查

所有PR都需要经过代码审查：

1. **自动检查** - CI会运行测试和代码检查
2. **人工审查** - 维护者会审查代码质量和设计
3. **反馈处理** - 根据反馈修改代码
4. **合并** - 审查通过后合并到主分支

## 代码规范

### TypeScript规范

```typescript
// 使用明确的类型定义
interface UserConfig {
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

// 使用async/await而不是Promise链
async function processFile(filePath: string): Promise<ProcessResult> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return await processContent(content);
  } catch (error) {
    throw new ProcessError(`Failed to process file: ${error.message}`);
  }
}

// 使用适当的错误处理
class CustomError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'CustomError';
  }
}
```

### 命名规范

- **文件名**: kebab-case (`user-service.ts`)
- **类名**: PascalCase (`UserService`)
- **函数名**: camelCase (`getUserById`)
- **常量**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **接口**: PascalCase with I prefix (`IUserRepository`)

### 注释规范

```typescript
/**
 * 处理用户认证
 * @param credentials 用户凭据
 * @param options 认证选项
 * @returns 认证结果
 * @throws {AuthenticationError} 当凭据无效时
 */
async function authenticate(
  credentials: UserCredentials,
  options: AuthOptions = {}
): Promise<AuthResult> {
  // 实现逻辑
}
```

## 测试指南

### 测试类型

1. **单元测试** - 测试单个函数或类
2. **集成测试** - 测试组件间的交互
3. **端到端测试** - 测试完整的用户流程

### 测试示例

```typescript
// 单元测试
describe('CodeParser', () => {
  describe('detectLanguage', () => {
    it('should detect JavaScript from .js extension', () => {
      const language = CodeParser.detectLanguage('app.js');
      expect(language).toBe('javascript');
    });

    it('should detect TypeScript from .ts extension', () => {
      const language = CodeParser.detectLanguage('app.ts');
      expect(language).toBe('typescript');
    });
  });
});

// 集成测试
describe('ContinueCommand Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-cli-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should continue code in JavaScript file', async () => {
    const testFile = path.join(tempDir, 'test.js');
    await fs.writeFile(testFile, 'function add(a, b) {\n  // TODO\n}');

    const result = await ContinueCommand.execute({
      file: testFile,
      line: 2
    });

    expect(result.success).toBe(true);
    expect(result.suggestions).toHaveLength(3);
  });
});
```

### 测试覆盖率

- 目标覆盖率: 80%以上
- 核心功能: 90%以上
- 新功能必须包含测试

## 文档贡献

### 文档类型

- **用户文档** - 面向最终用户
- **API文档** - 面向开发者
- **贡献文档** - 面向贡献者

### 文档规范

- 使用清晰简洁的语言
- 提供实际的代码示例
- 包含常见问题解答
- 保持文档与代码同步

### 文档结构

```markdown
# 标题

简短的功能描述。

## 快速开始

基本使用示例。

## 详细说明

详细的功能说明。

## 示例

```bash
# 实际的使用示例
ai-cli command --option value
```

## 选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| --option | 选项描述 | default |

## 注意事项

重要的注意事项和限制。
```

## 发布流程

### 版本发布

只有维护者可以发布新版本：

1. **更新版本号** - 使用`npm version`
2. **更新CHANGELOG** - 记录所有变更
3. **创建发布标签** - 推送标签到GitHub
4. **发布到npm** - 自动CI发布
5. **创建GitHub Release** - 包含发布说明

### 发布类型

- **patch** (1.0.1) - bug修复
- **minor** (1.1.0) - 新功能，向下兼容
- **major** (2.0.0) - 破坏性变更

## 社区

### 沟通渠道

- **GitHub Issues** - 问题报告和功能建议
- **GitHub Discussions** - 一般讨论和问答
- **Discord** - 实时聊天和社区交流

### 获得帮助

如果您需要帮助：

1. 查看[文档](docs/)
2. 搜索[现有问题](https://github.com/your-org/ai-cli/issues)
3. 在[讨论区](https://github.com/your-org/ai-cli/discussions)提问
4. 加入我们的[Discord服务器](https://discord.gg/ai-cli)

### 成为维护者

活跃的贡献者可能被邀请成为维护者。维护者的职责包括：

- 审查和合并PR
- 管理问题和讨论
- 参与项目规划
- 指导新贡献者

## 致谢

感谢所有为AI CLI项目做出贡献的开发者！

- 查看[贡献者列表](https://github.com/your-org/ai-cli/graphs/contributors)
- 特别感谢核心维护者团队
- 感谢所有提供反馈和建议的用户

---

再次感谢您的贡献！每一个贡献都让AI CLI变得更好。🚀