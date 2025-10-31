# 使用示例

## 实际场景示例

### 场景1：Web应用开发

#### 项目初始化

```bash
# 创建新项目
mkdir my-web-app
cd my-web-app

# 初始化AI CLI配置
ai-cli init --template webapp
```

#### 生成项目结构

```bash
# 使用vibe编程创建基础结构
ai-cli vibe "创建一个React + Express全栈应用的基础结构，包含前端组件、后端API路由、数据库模型" \
  --lang typescript \
  --framework react,express \
  --include-tests

# 生成的文件结构：
# ├── frontend/
# │   ├── src/
# │   │   ├── components/
# │   │   ├── pages/
# │   │   └── utils/
# │   └── package.json
# ├── backend/
# │   ├── src/
# │   │   ├── routes/
# │   │   ├── models/
# │   │   └── middleware/
# │   └── package.json
# └── shared/
#     └── types/
```

#### 开发用户认证功能

```bash
# 生成后端认证中间件
ai-cli vibe "创建JWT认证中间件，包含登录、注册、token验证功能" \
  --lang typescript \
  --framework express \
  --output backend/src/middleware/auth.ts \
  --include-tests

# 生成前端登录组件
ai-cli vibe "创建响应式登录表单组件，包含表单验证、错误处理、加载状态" \
  --lang typescript \
  --framework react \
  --output frontend/src/components/LoginForm.tsx \
  --include-tests
```

#### 代码审查和优化

```bash
# 审查整个项目
ai-cli review --dir . --rules security,performance,maintainability \
  --output review-report.md

# 自动修复发现的问题
ai-cli review --dir backend/src --fix --severity error

# 审查前端代码的可访问性
ai-cli review --dir frontend/src --rules accessibility --format json
```

### 场景2：API服务开发

#### 生成API规格文档

```bash
# 从现有代码生成API文档
ai-cli spec --from-code src/routes/ --template api --output api-spec.md

# 交互式生成完整的技术规格
ai-cli spec --interactive
```

交互式生成过程：
```
🎯 API服务规格生成

项目信息:
- 名称: 用户管理API
- 版本: v1.0.0
- 描述: 提供用户CRUD操作的RESTful API

技术栈:
- 语言: Node.js + TypeScript
- 框架: Express + Prisma
- 数据库: PostgreSQL
- 认证: JWT

生成章节:
✅ 项目概述
✅ API端点设计
✅ 数据模型
✅ 认证授权
✅ 错误处理
✅ 部署指南

📝 正在生成规格文档...
✅ 已生成: user-api-spec.md (3,200字)
```

#### 实现API端点

```bash
# 根据规格生成用户CRUD路由
ai-cli vibe "根据用户管理API规格，实现完整的用户CRUD路由，包含参数验证、错误处理、分页查询" \
  --lang typescript \
  --framework express \
  --output src/routes/users.ts

# 生成数据模型
ai-cli vibe "创建用户数据模型，包含Prisma schema定义和TypeScript类型" \
  --lang typescript \
  --framework prisma \
  --output src/models/user.ts
```

#### 添加API文档

```bash
# 续写OpenAPI文档
ai-cli continue --file docs/openapi.yaml --line 45 \
  --context "添加用户管理相关的API端点定义"
```

### 场景3：数据分析项目

#### 创建数据处理管道

```bash
# 生成数据清洗脚本
ai-cli vibe "创建数据清洗管道，处理CSV文件，包含缺失值处理、异常值检测、数据类型转换" \
  --lang python \
  --framework pandas \
  --output src/data_cleaning.py \
  --include-docs

# 生成数据可视化脚本
ai-cli vibe "创建数据可视化模块，生成销售数据的趋势图、分布图、相关性热力图" \
  --lang python \
  --framework matplotlib,seaborn \
  --output src/visualization.py
```

#### 机器学习模型开发

```bash
# 生成模型训练脚本
ai-cli vibe "实现客户流失预测模型，包含特征工程、模型训练、评估指标计算" \
  --lang python \
  --framework scikit-learn \
  --output src/churn_model.py \
  --include-tests

# 续写模型优化代码
ai-cli continue --file src/churn_model.py --line 89 \
  --length 20 \
  --context "添加超参数调优和交叉验证"
```

### 场景4：移动应用开发

#### React Native组件开发

```bash
# 生成用户界面组件
ai-cli vibe "创建移动端用户资料页面，包含头像上传、信息编辑、保存功能，适配iOS和Android" \
  --lang typescript \
  --framework react-native \
  --output src/screens/ProfileScreen.tsx

# 生成导航组件
ai-cli vibe "创建底部标签导航，包含首页、搜索、消息、个人中心四个标签" \
  --lang typescript \
  --framework react-navigation \
  --output src/navigation/TabNavigator.tsx
```

#### 状态管理

```bash
# 生成Redux store
ai-cli vibe "创建用户状态管理，包含登录状态、用户信息、异步操作处理" \
  --lang typescript \
  --framework redux-toolkit \
  --output src/store/userSlice.ts
```

### 场景5：开源库开发

#### 创建库的核心功能

```bash
# 生成工具库的主要功能
ai-cli vibe "创建JavaScript工具库，提供日期处理、字符串操作、数组工具等常用函数" \
  --lang typescript \
  --output src/index.ts \
  --include-tests \
  --include-docs

# 生成类型定义
ai-cli continue --file src/types.ts --line 1 \
  --context "为工具库添加完整的TypeScript类型定义"
```

#### 生成文档和示例

```bash
# 生成README文档
ai-cli spec --from-code src/ --template library --output README.md

# 生成使用示例
ai-cli vibe "创建工具库的使用示例，展示各个函数的用法和最佳实践" \
  --lang javascript \
  --output examples/usage.js
```

## 工作流集成示例

### Git Hooks集成

#### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔍 运行代码审查..."
ai-cli review --staged --severity error --format json > review-result.json

if [ $? -ne 0 ]; then
  echo "❌ 代码审查发现错误，请修复后再提交"
  cat review-result.json
  exit 1
fi

echo "✅ 代码审查通过"
rm review-result.json
```

#### Pre-push Hook

```bash
#!/bin/sh
# .git/hooks/pre-push

echo "📝 生成更新的API文档..."
ai-cli spec --from-code src/routes/ --template api --output docs/api.md

if git diff --quiet docs/api.md; then
  echo "📄 API文档已是最新"
else
  echo "📄 API文档已更新，请提交更改"
  git add docs/api.md
  git commit -m "docs: 更新API文档"
fi
```

### CI/CD集成

#### GitHub Actions

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    branches: [ main ]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install AI CLI
      run: npm install -g ai-cli
    
    - name: Configure AI CLI
      run: |
        ai-cli config set api.apiKey ${{ secrets.OPENAI_API_KEY }}
        ai-cli config set api.provider openai
    
    - name: Run Code Review
      run: |
        ai-cli review --dir src/ --format json --output review.json
        ai-cli review --dir src/ --format markdown --output review.md
    
    - name: Comment PR
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const review = fs.readFileSync('review.md', 'utf8');
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `## 🤖 AI代码审查报告\n\n${review}`
          });
```

### VS Code集成

#### 任务配置

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "AI Continue",
      "type": "shell",
      "command": "ai-cli",
      "args": ["continue", "--file", "${file}", "--line", "${lineNumber}"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "AI Review Current File",
      "type": "shell",
      "command": "ai-cli",
      "args": ["review", "--file", "${file}", "--format", "markdown"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

#### 快捷键配置

```json
// .vscode/keybindings.json
[
  {
    "key": "ctrl+alt+c",
    "command": "workbench.action.tasks.runTask",
    "args": "AI Continue"
  },
  {
    "key": "ctrl+alt+r",
    "command": "workbench.action.tasks.runTask",
    "args": "AI Review Current File"
  }
]
```

## 高级使用技巧

### 批量处理

```bash
# 批量续写多个文件
find src -name "*.js" -type f | xargs -I {} ai-cli continue --file {} --length 5

# 批量审查并生成报告
for dir in src tests docs; do
  ai-cli review --dir $dir --output "review-$dir.md"
done

# 批量生成组件
cat component-list.txt | while read component; do
  ai-cli vibe "创建React组件: $component" --lang typescript --output "src/components/$component.tsx"
done
```

### 管道操作

```bash
# 审查后自动修复
ai-cli review --file src/app.js --format json | \
  jq '.issues[] | select(.fixable == true)' | \
  ai-cli fix --stdin

# 生成代码后进行质量检查
ai-cli vibe "创建用户服务类" --lang typescript | \
  ai-cli review --stdin --rules security,performance
```

### 配置模板

```bash
# 为不同项目类型创建配置模板
ai-cli config export --template react-app --output configs/react-config.json
ai-cli config export --template api-service --output configs/api-config.json
ai-cli config export --template data-science --output configs/ds-config.json

# 在新项目中使用模板
ai-cli config import --file configs/react-config.json
```

这些示例展示了AI CLI在实际开发场景中的应用，帮助开发者提高效率和代码质量。