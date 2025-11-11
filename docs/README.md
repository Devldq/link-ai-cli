# LinChat 设计文档

## 📁 文档目录

本目录包含 LinChat 项目的设计文档和架构说明。

### 📋 文档列表

- **[architecture-diagram.md](./architecture-diagram.md)** - 项目架构图和系统设计说明
- **[api-design.md](./api-design.md)** - API 设计文档（待添加）
- **[database-schema.md](./database-schema.md)** - 数据库设计（待添加）
- **[deployment-guide.md](./deployment-guide.md)** - 部署指南（待添加）

### 🏗️ 架构概览

LinChat 是一个智能的 AI 驱动命令行聊天助手，采用模块化架构设计：

```
🖥️ 用户交互层
    ↓
🚀 应用层
    ↓
⚡ 命令处理层
    ↓
🔧 核心服务层
    ↓
🤖 AI提供商层
    ↓
🛠️ 工具层
    ↓
💾 数据层
    ↓
🌐 外部服务
```

### 🎯 核心特性

- **智能意图分析**: 自动识别用户需求，提供个性化选项
- **多AI提供商**: 支持 Ollama、OpenAI、Claude、Gemini
- **代码审查**: 智能代码分析和改进建议
- **文件管理**: 完整的文件操作和备份机制
- **多语言支持**: 中英文文档和界面
- **模块化设计**: 易于扩展和维护

### 📖 快速导航

- 查看完整架构图: [architecture-diagram.md](./architecture-diagram.md)
- 了解项目概况: [../README.md](../README.md)
- 查看更新日志: [../CHANGELOG.md](../CHANGELOG.md)
- 许可证信息: [../LICENSE](../LICENSE)

### 🔄 文档更新

本文档会随着项目的发展持续更新。如有疑问或建议，请提交 Issue 或 Pull Request。

---

**最后更新**: 2024-01-15  
**版本**: v1.2.1