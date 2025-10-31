# 使用教程

## 基本命令

### 代码续写 (Continue)

智能补全和生成代码片段。

```bash
# 续写单个文件
ai-cli continue --file src/utils.js

# 续写多个文件
ai-cli continue --file "src/**/*.js"

# 指定续写位置（行号）
ai-cli continue --file src/main.js --line 42

# 交互式续写
ai-cli continue --interactive

# 指定续写长度
ai-cli continue --file src/api.js --length 20
```

**示例：**
```bash
$ ai-cli continue --file src/calculator.js --line 15
✨ 分析代码上下文...
📝 生成续写建议...

建议1: 添加除法函数
function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

建议2: 添加输入验证
function validateInput(value) {
  return typeof value === 'number' && !isNaN(value);
}

选择建议 (1-2) 或按 Enter 跳过: 1
✅ 代码已更新
```

### 代码审查 (Review)

自动化代码质量检查和改进建议。

```bash
# 审查单个文件
ai-cli review --file src/app.js

# 审查整个目录
ai-cli review --dir src/

# 指定审查规则
ai-cli review --file src/api.js --rules security,performance

# 生成审查报告
ai-cli review --dir src/ --output report.md

# 只显示错误级别问题
ai-cli review --file src/main.js --severity error
```

**示例输出：**
```markdown
# 代码审查报告

## 文件: src/api.js

### 🔴 错误 (2个)
1. **安全问题** (行 23): SQL注入风险
   - 问题: 直接拼接SQL查询字符串
   - 建议: 使用参数化查询或ORM

2. **性能问题** (行 45): 同步文件操作
   - 问题: 使用fs.readFileSync阻塞事件循环
   - 建议: 使用fs.promises.readFile

### 🟡 警告 (3个)
1. **代码风格** (行 12): 未使用的变量
2. **可维护性** (行 67): 函数过于复杂
3. **最佳实践** (行 89): 缺少错误处理

### 📊 统计
- 总行数: 156
- 问题总数: 5
- 代码质量评分: 7.2/10
```

### Spec生成 (Spec)

根据代码或需求生成技术规格文档。

```bash
# 从代码生成spec
ai-cli spec --from-code src/

# 从需求文档生成spec
ai-cli spec --from-requirements requirements.md

# 生成API文档
ai-cli spec --api --file src/routes/

# 指定模板
ai-cli spec --template api --output api-spec.md

# 交互式spec生成
ai-cli spec --interactive
```

**交互式示例：**
```bash
$ ai-cli spec --interactive
🎯 Spec生成向导

1. 项目类型:
   [1] Web应用
   [2] API服务
   [3] 库/SDK
   [4] 移动应用
   选择: 2

2. 技术栈:
   [1] Node.js + Express
   [2] Python + FastAPI
   [3] Java + Spring Boot
   [4] Go + Gin
   选择: 1

3. 包含的章节:
   ☑ 项目概述
   ☑ 功能需求
   ☑ 技术架构
   ☑ API设计
   ☑ 数据库设计
   ☑ 部署方案

📝 正在生成spec文档...
✅ 已生成: project-spec.md
```

### Vibe编程 (Vibe)

基于自然语言描述生成代码。

```bash
# 基础vibe编程
ai-cli vibe "创建一个用户登录组件"

# 指定语言和框架
ai-cli vibe "实现JWT认证中间件" --lang javascript --framework express

# 生成到指定文件
ai-cli vibe "创建数据库连接池" --output src/db.js

# 包含测试代码
ai-cli vibe "实现文件上传功能" --include-tests

# 交互式vibe编程
ai-cli vibe --interactive
```

**示例：**
```bash
$ ai-cli vibe "创建一个React用户卡片组件，包含头像、姓名、邮箱和操作按钮"

🎨 Vibe编程中...
📋 分析需求: React用户卡片组件
🔧 生成代码...

生成的文件:
- src/components/UserCard.jsx
- src/components/UserCard.module.css
- src/components/__tests__/UserCard.test.jsx

预览:
```jsx
import React from 'react';
import styles from './UserCard.module.css';

const UserCard = ({ user, onEdit, onDelete }) => {
  return (
    <div className={styles.userCard}>
      <img 
        src={user.avatar || '/default-avatar.png'} 
        alt={user.name}
        className={styles.avatar}
      />
      <div className={styles.info}>
        <h3 className={styles.name}>{user.name}</h3>
        <p className={styles.email}>{user.email}</p>
      </div>
      <div className={styles.actions}>
        <button onClick={() => onEdit(user.id)}>编辑</button>
        <button onClick={() => onDelete(user.id)}>删除</button>
      </div>
    </div>
  );
};

export default UserCard;
```

是否保存? (y/N): y
✅ 代码已生成并保存
```

## 高级用法

### 管道操作

```bash
# 审查后自动修复
ai-cli review --file src/app.js | ai-cli fix --auto

# 生成代码后进行审查
ai-cli vibe "创建API路由" | ai-cli review --stdin

# 批量处理
find src -name "*.js" | xargs -I {} ai-cli continue --file {}
```

### 配置文件使用

```bash
# 使用项目配置
ai-cli review --config ./ai-cli.config.json

# 使用自定义配置
ai-cli vibe "创建组件" --config custom-config.json
```

### 输出格式

```bash
# JSON格式输出
ai-cli review --file src/app.js --format json

# 纯文本输出
ai-cli spec --from-code src/ --format text

# HTML报告
ai-cli review --dir src/ --format html --output report.html
```

## 最佳实践

1. **版本控制集成**
   ```bash
   # Git hooks集成
   ai-cli review --staged  # 审查暂存的文件
   ```

2. **CI/CD集成**
   ```bash
   # 在CI中运行代码审查
   ai-cli review --dir src/ --format json --fail-on-error
   ```

3. **团队协作**
   ```bash
   # 共享配置文件
   ai-cli config export --output team-config.json
   ai-cli config import --file team-config.json
   ```