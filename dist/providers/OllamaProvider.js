"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
// Ollama AI 提供商实现
const ollama_1 = require("ollama");
const types_1 = require("../types");
class OllamaProvider {
    constructor(config, logger) {
        this.name = 'ollama';
        this.isConnected = false;
        this.config = config;
        this.logger = logger;
        // 初始化Ollama客户端
        this.client = new ollama_1.Ollama({
            host: config.endpoint
        });
    }
    // 连接到Ollama服务
    async connect() {
        try {
            this.logger.debug(`Connecting to Ollama at ${this.config.endpoint}`);
            // 测试连接
            await this.client.list();
            this.isConnected = true;
            this.logger.debug('Successfully connected to Ollama');
            return true;
        }
        catch (error) {
            this.logger.error('Failed to connect to Ollama:', error);
            this.isConnected = false;
            return false;
        }
    }
    // 检查服务是否可用
    async isAvailable() {
        try {
            await this.client.list();
            return true;
        }
        catch {
            return false;
        }
    }
    // 列出可用模型
    async listModels() {
        try {
            this.ensureConnected();
            const response = await this.client.list();
            return response.models.map(model => ({
                name: model.name,
                size: this.formatSize(model.size),
                modified: new Date(model.modified_at),
                digest: model.digest
            }));
        }
        catch (error) {
            this.logger.error('Failed to list models:', error);
            throw new types_1.OllamaConnectionError(`Failed to list models: ${error}`);
        }
    }
    // 生成流式响应
    async *generateStream(prompt, options = {}) {
        try {
            this.ensureConnected();
            const model = options.model || this.config.model;
            this.logger.debug(`Generating response with model: ${model}`);
            const stream = await this.client.generate({
                model,
                prompt,
                stream: true,
                options: {
                    temperature: options.temperature || this.config.temperature,
                    num_predict: options.maxTokens || this.config.maxTokens
                }
            });
            for await (const chunk of stream) {
                if (chunk.response) {
                    yield chunk.response;
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to generate stream:', error);
            throw new types_1.OllamaConnectionError(`Failed to generate response: ${error}`);
        }
    }
    // 聊天对话
    async *chat(messages, options = {}) {
        try {
            this.ensureConnected();
            const model = options.model || this.config.model;
            this.logger.debug(`Starting chat with model: ${model}`);
            // 转换消息格式
            const ollamaMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            // 添加系统提示
            if (options.systemPrompt) {
                ollamaMessages.unshift({
                    role: 'system',
                    content: options.systemPrompt
                });
            }
            const stream = await this.client.chat({
                model,
                messages: ollamaMessages,
                stream: true,
                options: {
                    temperature: options.temperature || this.config.temperature,
                    num_predict: options.maxTokens || this.config.maxTokens
                },
                keep_alive: options.keepAlive ? '5m' : '0'
            });
            for await (const chunk of stream) {
                yield {
                    message: chunk.message,
                    done: chunk.done || false,
                    total_duration: chunk.total_duration,
                    load_duration: chunk.load_duration,
                    prompt_eval_count: chunk.prompt_eval_count,
                    eval_count: chunk.eval_count
                };
            }
        }
        catch (error) {
            this.logger.error('Failed to chat:', error);
            throw new types_1.OllamaConnectionError(`Failed to chat: ${error}`);
        }
    }
    // 获取模型信息
    async getModelInfo(modelName) {
        try {
            this.ensureConnected();
            return await this.client.show({ model: modelName });
        }
        catch (error) {
            this.logger.error(`Failed to get model info for ${modelName}:`, error);
            throw new types_1.OllamaConnectionError(`Failed to get model info: ${error}`);
        }
    }
    // 检查模型是否存在
    async hasModel(modelName) {
        try {
            const models = await this.listModels();
            return models.some(model => model.name === modelName);
        }
        catch {
            return false;
        }
    }
    // 获取当前配置
    getConfig() {
        return { ...this.config };
    }
    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // 如果端点改变，重新创建客户端
        if (newConfig.endpoint) {
            this.client = new ollama_1.Ollama({
                host: newConfig.endpoint
            });
            this.isConnected = false;
        }
    }
    // 确保已连接
    ensureConnected() {
        if (!this.isConnected) {
            throw new types_1.OllamaConnectionError('Not connected to Ollama. Call connect() first.');
        }
    }
    // 格式化文件大小
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    // 测试连接
    async testConnection() {
        const startTime = Date.now();
        try {
            await this.client.list();
            const latency = Date.now() - startTime;
            return {
                success: true,
                latency
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    // 获取服务器版本
    async getVersion() {
        try {
            // Ollama API 可能不直接提供版本信息
            // 这里返回一个占位符，实际实现可能需要调用特定的API
            return 'Unknown';
        }
        catch (error) {
            this.logger.error('Failed to get Ollama version:', error);
            return 'Unknown';
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=OllamaProvider.js.map