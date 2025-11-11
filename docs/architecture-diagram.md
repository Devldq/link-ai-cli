# LinChat 项目架构图

## 🏗️ 系统架构概览

```mermaid
graph TB
    %% 用户交互层
    subgraph "🖥️ 用户交互层"
        CLI[CLI Interface<br/>命令行界面]
        TERM[Terminal<br/>终端交互]
        USER[用户输入<br/>l/link/linchat]
    end

    %% 应用层
    subgraph "🚀 应用层"
        APP[CLIApplication<br/>CLI应用程序]
        CMD[Command Router<br/>命令路由器]
    end

    %% 命令层
    subgraph "⚡ 命令处理层"
        CHAT[ChatManager<br/>聊天管理器]
        INTENT[Intent Analysis<br/>意图分析系统]
        OPTIONS[Option Selection<br/>选项选择系统]
    end

    %% 核心服务层
    subgraph "🔧 核心服务层"
        CONFIG[ConfigManager<br/>配置管理器]
        DOC[DocumentService<br/>文档服务]
        FILE[FileEditService<br/>文件编辑服务]
        CODE[CodeGenerationService<br/>代码生成服务]
        REVIEW[CodeReviewService<br/>代码审查服务]
        EXEC[ExecutionService<br/>执行服务]
    end

    %% AI提供商层
    subgraph "🤖 AI提供商层"
        OLLAMA[OllamaProvider<br/>Ollama提供商]
        OPENAI[OpenAI Provider<br/>OpenAI提供商]
        CLAUDE[Claude Provider<br/>Claude提供商]
        GEMINI[Gemini Provider<br/>Gemini提供商]
    end

    %% 工具层
    subgraph "🛠️ 工具层"
        UI[UIManager<br/>UI管理器]
        LOG[Logger<br/>日志记录器]
        CACHE[Cache System<br/>缓存系统]
        VALID[Validator<br/>验证器]
    end

    %% 数据层
    subgraph "💾 数据层"
        FS[File System<br/>文件系统]
        SESSIONS[Chat Sessions<br/>聊天会话]
        CONFIGS[Configuration Files<br/>配置文件]
        BACKUPS[Backup Files<br/>备份文件]
    end

    %% 外部服务
    subgraph "🌐 外部服务"
        OLLAMA_API[Ollama API<br/>本地AI服务]
        OPENAI_API[OpenAI API<br/>GPT服务]
        CLAUDE_API[Anthropic API<br/>Claude服务]
        GEMINI_API[Google AI API<br/>Gemini服务]
    end

    %% 连接关系
    USER --> CLI
    CLI --> APP
    APP --> CMD
    CMD --> CHAT

    CHAT --> INTENT
    INTENT --> OPTIONS
    OPTIONS --> CHAT

    CHAT --> CONFIG
    CHAT --> DOC
    CHAT --> FILE
    CHAT --> CODE
    CHAT --> REVIEW
    CHAT --> EXEC

    CONFIG --> OLLAMA
    CODE --> OLLAMA
    REVIEW --> OLLAMA
    DOC --> OLLAMA

    OLLAMA --> OLLAMA_API
    OPENAI --> OPENAI_API
    CLAUDE --> CLAUDE_API
    GEMINI --> GEMINI_API

    CHAT --> UI
    CHAT --> LOG
    CONFIG --> CACHE
    FILE --> VALID

    CONFIG --> CONFIGS
    CHAT --> SESSIONS
    FILE --> FS
    FILE --> BACKUPS

    %% 样式定义
    classDef userLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef appLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef commandLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef serviceLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef providerLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef utilLayer fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef dataLayer fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef externalLayer fill:#fafafa,stroke:#424242,stroke-width:2px

    class USER,CLI,TERM userLayer
    class APP,CMD appLayer
    class CHAT,INTENT,OPTIONS commandLayer
    class CONFIG,DOC,FILE,CODE,REVIEW,EXEC serviceLayer
    class OLLAMA,OPENAI,CLAUDE,GEMINI providerLayer
    class UI,LOG,CACHE,VALID utilLayer
    class FS,SESSIONS,CONFIGS,BACKUPS dataLayer
    class OLLAMA_API,OPENAI_API,CLAUDE_API,GEMINI_API externalLayer
```

## 📋 架构层次说明

### 🖥️ **用户交互层**
- **CLI Interface**: 命令行界面，处理用户输入和输出显示
- **Terminal**: 终端交互，支持 `l`、`link`、`linchat` 三种启动命令
- **用户输入**: 接收用户的自然语言指令和文件操作请求

### 🚀 **应用层**
- **CLIApplication**: 主应用程序，负责应用初始化和生命周期管理
- **Command Router**: 命令路由器，将用户输入路由到相应的处理模块

### ⚡ **命令处理层**
- **ChatManager**: 聊天管理器，核心业务逻辑处理中心
- **Intent Analysis**: 智能意图分析系统，识别用户请求类型
- **Option Selection**: 选项选择系统，为复杂操作提供多种方案

### 🔧 **核心服务层**
- **ConfigManager**: 配置管理，处理应用配置和用户设置
- **DocumentService**: 文档服务，处理Markdown、JSON、YAML等文档
- **FileEditService**: 文件编辑服务，处理文件的读写和修改
- **CodeGenerationService**: 代码生成服务，AI驱动的代码创建
- **CodeReviewService**: 代码审查服务，智能代码分析和建议
- **ExecutionService**: 执行服务，处理命令执行和结果管理

### 🤖 **AI提供商层**
- **OllamaProvider**: 本地Ollama AI服务集成
- **OpenAI Provider**: OpenAI GPT服务集成
- **Claude Provider**: Anthropic Claude服务集成
- **Gemini Provider**: Google Gemini服务集成

### 🛠️ **工具层**
- **UIManager**: UI管理器，处理界面显示和用户交互
- **Logger**: 日志记录器，系统日志和调试信息
- **Cache System**: 缓存系统，提高性能和响应速度
- **Validator**: 验证器，输入验证和数据校验

### 💾 **数据层**
- **File System**: 文件系统操作
- **Chat Sessions**: 聊天会话持久化
- **Configuration Files**: 配置文件存储
- **Backup Files**: 自动备份文件管理

### 🌐 **外部服务**
- **Ollama API**: 本地AI模型服务
- **OpenAI API**: OpenAI云端服务
- **Anthropic API**: Claude AI服务
- **Google AI API**: Gemini AI服务

## 🔄 核心工作流程

### 智能意图分析流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant CLI as CLI界面
    participant Intent as 意图分析
    participant Options as 选项生成
    participant Service as 核心服务
    participant AI as AI提供商

    User->>CLI: 输入命令 (cr filename.js)
    CLI->>Intent: 分析用户意图
    Intent->>Intent: 检测复杂操作关键词
    Intent->>Options: 生成操作选项
    Options-->>CLI: 返回选项列表
    CLI-->>User: 显示选项供选择
    User->>CLI: 选择具体方案
    CLI->>Service: 执行选定操作
    Service->>AI: 调用AI服务
    AI-->>Service: 返回AI响应
    Service-->>CLI: 格式化结果
    CLI-->>User: 显示最终结果
```

### 代码审查工作流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Chat as ChatManager
    participant Intent as 意图分析
    participant File as 文件服务
    participant Review as 审查服务
    participant AI as AI提供商

    User->>Chat: cr example.js
    Chat->>Intent: 分析意图
    Intent-->>Chat: 识别为代码审查
    Chat->>File: 读取文件内容
    File-->>Chat: 返回文件内容
    Chat->>Review: 执行代码审查
    Review->>AI: 发送审查请求
    AI-->>Review: 返回审查结果
    Review-->>Chat: 格式化审查报告
    Chat-->>User: 显示审查结果
```

### 文件操作工作流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Chat as ChatManager
    participant File as 文件服务
    participant Backup as 备份服务
    participant AI as AI提供商

    User->>Chat: 修改 example.js
    Chat->>File: 检查文件存在
    File->>Backup: 创建备份
    Backup-->>File: 备份完成
    File-->>Chat: 文件准备就绪
    Chat->>AI: 请求代码修改
    AI-->>Chat: 返回修改建议
    Chat-->>User: 显示修改预览
    User->>Chat: 确认修改
    Chat->>File: 应用修改
    File-->>Chat: 修改完成
    Chat-->>User: 操作成功
```

## 🎯 架构特点

### **模块化设计**
- 清晰的层次结构，易于维护和扩展
- 每个模块职责单一，降低耦合度
- 支持插件化扩展新功能

### **智能意图分析**
- 自动识别用户需求类型
- 提供个性化操作选项
- 上下文感知的智能响应

### **多AI提供商支持**
- 灵活切换不同AI服务
- 统一的AI接口抽象
- 自动故障转移机制

### **完整的文件管理**
- 支持读写、备份、转换等操作
- 自动备份机制保护数据安全
- 智能文件路径检测

### **用户友好体验**
- 中英文文档支持
- 多种启动方式 (l/link/linchat)
- 详细的错误提示和帮助信息

### **高可扩展性**
- 插件化架构设计
- 配置驱动的功能开关
- 易于添加新的AI提供商和功能

## 🔧 技术实现亮点

### **TypeScript 类型安全**
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface IntentAnalysisResult {
  needsOptions: boolean;
  intent: string;
  options?: OperationOption[];
  context?: any;
}
```

### **配置管理系统**
```typescript
interface AppConfig {
  ollama: {
    endpoint: string;
    model: string;
    temperature: number;
  };
  ui: {
    language: 'zh' | 'en';
    theme: 'light' | 'dark';
  };
  features: {
    autoSave: boolean;
    backup: boolean;
    caching: boolean;
  };
}
```

### **错误处理机制**
```typescript
class LinChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'LinChatError';
  }
}
```

### **缓存优化策略**
```typescript
interface CacheConfig {
  ai: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  files: {
    enabled: boolean;
    maxFiles: number;
  };
}
```

## 📊 性能优化

### **并发处理**
- AI请求限流控制
- 文件并行处理
- 内存使用优化

### **缓存策略**
- AI响应缓存
- 文件内容缓存
- 配置缓存

### **资源管理**
- 自动垃圾回收
- 内存泄漏防护
- 连接池管理

这个架构图展示了LinChat项目的完整技术架构，体现了现代AI驱动的命令行工具的设计理念和最佳实践。通过模块化设计、智能意图分析和多AI提供商支持，为用户提供了强大而灵活的AI编程助手体验。