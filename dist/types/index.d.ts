export interface CLIApplication {
    start(): Promise<void>;
    handleCommand(command: string, args: string[]): Promise<void>;
    shutdown(): Promise<void>;
}
export interface CommandRouter {
    registerCommand(name: string, handler: CommandHandler): void;
    executeCommand(command: string, args: string[]): Promise<CommandResult>;
    getAvailableCommands(): CommandInfo[];
}
export interface CommandHandler {
    execute(args: string[], options: CommandOptions): Promise<CommandResult>;
    getHelp(): string;
}
export interface CommandResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: Error;
}
export interface CommandInfo {
    name: string;
    description: string;
    usage: string;
    aliases?: string[];
}
export interface CommandOptions {
    verbose?: boolean;
    quiet?: boolean;
    config?: string;
    [key: string]: any;
}
export interface ChatSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    messages: ChatMessage[];
    context: SessionContext;
    metadata: SessionMetadata;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: MessageMetadata;
}
export interface SessionContext {
    workingDirectory: string;
    currentProject?: string;
    preferences: UserPreferences;
}
export interface SessionMetadata {
    totalMessages: number;
    totalTokens?: number;
    lastActivity: Date;
}
export interface MessageMetadata {
    tokens?: number;
    processingTime?: number;
    model?: string;
}
export interface UserPreferences {
    language: string;
    framework?: string | undefined;
    codeStyle?: string;
    autoExecute?: boolean;
}
export interface AIProvider {
    name: string;
    connect(): Promise<boolean>;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<Model[]>;
    generateStream(prompt: string, options: GenerationOptions): AsyncIterable<string>;
    chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<ChatResponse>;
}
export interface Model {
    name: string;
    size: string;
    modified: Date;
    digest: string;
}
export interface GenerationOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    context?: string[];
}
export interface ChatOptions extends GenerationOptions {
    systemPrompt?: string;
    keepAlive?: boolean;
}
export interface ChatResponse {
    message: {
        role: string;
        content: string;
    };
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}
export interface CodeGenerationService {
    generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult>;
    validateCode(code: string, language: string): Promise<ValidationResult>;
    formatCode(code: string, language: string): Promise<string>;
    addComments(code: string, language: string): Promise<string>;
}
export interface CodeGenerationRequest {
    description: string;
    language: string;
    framework?: string;
    style?: CodeStyle;
    includeTests?: boolean;
    includeComments?: boolean;
    outputPath?: string;
}
export interface CodeGenerationResult {
    code: string;
    language: string;
    filename?: string;
    explanation?: string;
    suggestions?: string[];
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}
export interface ValidationWarning extends ValidationError {
}
export interface CodeStyle {
    indentation: 'spaces' | 'tabs';
    indentSize: number;
    quotes: 'single' | 'double';
    semicolons: boolean;
    trailingComma: boolean;
}
export interface CodeReviewService {
    reviewCode(code: string, options: ReviewOptions): Promise<ReviewResult>;
    applyFixes(code: string, fixes: AutoFix[]): Promise<string>;
    generateReport(results: ReviewResult[]): Promise<ReviewReport>;
}
export interface ReviewOptions {
    rules: ReviewRule[];
    language: string;
    severity: ('error' | 'warning' | 'info')[];
    autoFix?: boolean;
}
export interface ReviewRule {
    id: string;
    name: string;
    category: 'security' | 'performance' | 'style' | 'maintainability';
    severity: 'error' | 'warning' | 'info';
    enabled: boolean;
}
export interface ReviewResult {
    issues: ReviewIssue[];
    score: number;
    summary: ReviewSummary;
}
export interface ReviewIssue {
    id: string;
    rule: string;
    category: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column: number;
    suggestion?: string;
    autoFixable: boolean;
}
export interface ReviewSummary {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    score: number;
}
export interface AutoFix {
    issueId: string;
    line: number;
    column: number;
    oldText: string;
    newText: string;
}
export interface ReviewReport {
    timestamp: Date;
    results: ReviewResult[];
    overallScore: number;
    recommendations: string[];
}
export interface ExecutionService {
    executeCode(code: string, language: string, options: ExecutionOptions): Promise<ExecutionResult>;
    createSandbox(config: SandboxConfig): Promise<Sandbox>;
    validateExecution(code: string): Promise<SecurityCheck>;
}
export interface ExecutionOptions {
    timeout?: number;
    workingDirectory?: string;
    environment?: Record<string, string>;
    allowNetworkAccess?: boolean;
    allowFileSystem?: boolean;
}
export interface ExecutionResult {
    success: boolean;
    output: string[];
    errors: string[];
    exitCode: number;
    duration: number;
}
export interface Sandbox {
    execute(code: string): Promise<ExecutionResult>;
    getOutput(): string[];
    getErrors(): string[];
    cleanup(): Promise<void>;
}
export interface SandboxConfig {
    timeout: number;
    memoryLimit: number;
    allowedModules: string[];
    restrictedPaths: string[];
}
export interface SecurityCheck {
    passed: boolean;
    issues: SecurityIssue[];
    recommendations: string[];
}
export interface SecurityIssue {
    type: 'dangerous_function' | 'file_access' | 'network_access' | 'eval_usage';
    severity: 'high' | 'medium' | 'low';
    message: string;
    line?: number;
    suggestion?: string;
}
export interface AppConfig {
    ollama: OllamaConfig;
    codeGeneration: CodeGenerationConfig;
    codeReview: CodeReviewConfig;
    execution: ExecutionConfig;
    ui: UIConfig;
    security: SecurityConfig;
}
export interface OllamaConfig {
    endpoint: string;
    model: string;
    timeout: number;
    maxTokens: number;
    temperature: number;
}
export interface CodeGenerationConfig {
    defaultLanguage: string;
    defaultFramework?: string;
    includeComments: boolean;
    includeTests: boolean;
    outputDirectory: string;
}
export interface CodeReviewConfig {
    enabledRules: string[];
    severity: ('error' | 'warning' | 'info')[];
    autoFix: boolean;
    reportFormat: 'json' | 'markdown' | 'html';
}
export interface ExecutionConfig {
    timeout: number;
    sandboxEnabled: boolean;
    allowNetworkAccess: boolean;
    allowFileSystemAccess: boolean;
}
export interface UIConfig {
    theme: 'light' | 'dark' | 'auto';
    showProgress: boolean;
    verboseOutput: boolean;
}
export interface SecurityConfig {
    enableSandbox: boolean;
    allowedModules: string[];
    restrictedPaths: string[];
    maxExecutionTime: number;
}
export declare abstract class AICliError extends Error {
    abstract code: string;
    abstract category: string;
    abstract severity: 'high' | 'medium' | 'low';
}
export declare class OllamaConnectionError extends AICliError {
    code: string;
    category: string;
    severity: "high";
}
export declare class CodeExecutionError extends AICliError {
    code: string;
    category: string;
    severity: "medium";
}
export declare class ConfigurationError extends AICliError {
    code: string;
    category: string;
    severity: "medium";
}
export declare class SecurityError extends AICliError {
    code: string;
    category: string;
    severity: "high";
}
//# sourceMappingURL=index.d.ts.map