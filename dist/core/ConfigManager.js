"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
// 【AI 李大庆】start: 配置管理器实现
const cosmiconfig_1 = require("cosmiconfig");
const joi_1 = __importDefault(require("joi"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const types_1 = require("../types");
class ConfigManager {
    constructor() {
        this.config = null;
        this.configPath = null;
        this.explorer = (0, cosmiconfig_1.cosmiconfig)('ai-cli-chat');
        // 【AI 李大庆】: 默认配置
        this.defaultConfig = {
            ollama: {
                endpoint: 'http://localhost:11434',
                model: 'gpt-oss:20b',
                timeout: 30000,
                maxTokens: 2048,
                temperature: 0.7
            },
            codeGeneration: {
                defaultLanguage: 'typescript',
                defaultFramework: 'node',
                includeComments: true,
                includeTests: false,
                outputDirectory: './generated'
            },
            codeReview: {
                enabledRules: ['security', 'performance', 'style', 'maintainability'],
                severity: ['error', 'warning', 'info'],
                autoFix: false,
                reportFormat: 'markdown'
            },
            execution: {
                timeout: 10000,
                sandboxEnabled: true,
                allowNetworkAccess: false,
                allowFileSystemAccess: false
            },
            ui: {
                theme: 'auto',
                showProgress: true,
                verboseOutput: false
            },
            security: {
                enableSandbox: true,
                allowedModules: ['fs', 'path', 'util', 'crypto'],
                restrictedPaths: ['/etc', '/usr', '/bin', '/sbin'],
                maxExecutionTime: 10000
            }
        };
        // 【AI 李大庆】: 配置验证模式
        this.configSchema = joi_1.default.object({
            ollama: joi_1.default.object({
                endpoint: joi_1.default.string().uri().required(),
                model: joi_1.default.string().required(),
                timeout: joi_1.default.number().positive().required(),
                maxTokens: joi_1.default.number().positive().required(),
                temperature: joi_1.default.number().min(0).max(1).required()
            }).required(),
            codeGeneration: joi_1.default.object({
                defaultLanguage: joi_1.default.string().required(),
                defaultFramework: joi_1.default.string().optional(),
                includeComments: joi_1.default.boolean().required(),
                includeTests: joi_1.default.boolean().required(),
                outputDirectory: joi_1.default.string().required()
            }).required(),
            codeReview: joi_1.default.object({
                enabledRules: joi_1.default.array().items(joi_1.default.string()).required(),
                severity: joi_1.default.array().items(joi_1.default.string().valid('error', 'warning', 'info')).required(),
                autoFix: joi_1.default.boolean().required(),
                reportFormat: joi_1.default.string().valid('json', 'markdown', 'html').required()
            }).required(),
            execution: joi_1.default.object({
                timeout: joi_1.default.number().positive().required(),
                sandboxEnabled: joi_1.default.boolean().required(),
                allowNetworkAccess: joi_1.default.boolean().required(),
                allowFileSystemAccess: joi_1.default.boolean().required()
            }).required(),
            ui: joi_1.default.object({
                theme: joi_1.default.string().valid('light', 'dark', 'auto').required(),
                showProgress: joi_1.default.boolean().required(),
                verboseOutput: joi_1.default.boolean().required()
            }).required(),
            security: joi_1.default.object({
                enableSandbox: joi_1.default.boolean().required(),
                allowedModules: joi_1.default.array().items(joi_1.default.string()).required(),
                restrictedPaths: joi_1.default.array().items(joi_1.default.string()).required(),
                maxExecutionTime: joi_1.default.number().positive().required()
            }).required()
        });
    }
    // 【AI 李大庆】: 加载配置
    async loadConfig(configPath) {
        try {
            let result;
            if (configPath) {
                // 【AI 李大庆】: 使用指定的配置文件路径
                const configContent = await fs_extra_1.default.readFile(configPath, 'utf-8');
                result = {
                    config: JSON.parse(configContent),
                    filepath: configPath
                };
            }
            else {
                // 【AI 李大庆】: 自动搜索配置文件
                result = await this.explorer.search();
            }
            if (result) {
                this.configPath = result.filepath;
                this.config = this.mergeWithDefaults(result.config);
            }
            else {
                // 【AI 李大庆】: 使用默认配置
                this.config = { ...this.defaultConfig };
                await this.createDefaultConfigFile();
            }
            // 【AI 李大庆】: 验证配置
            await this.validateConfig();
        }
        catch (error) {
            throw new types_1.ConfigurationError(`Failed to load configuration: ${error}`);
        }
    }
    // 【AI 李大庆】: 获取配置
    getConfig() {
        if (!this.config) {
            throw new types_1.ConfigurationError('Configuration not loaded. Call loadConfig() first.');
        }
        return this.config;
    }
    // 【AI 李大庆】: 设置配置值
    async setConfig(key, value) {
        if (!this.config) {
            throw new types_1.ConfigurationError('Configuration not loaded.');
        }
        // 【AI 李大庆】: 使用点号分隔的键路径设置值
        const keys = key.split('.');
        let current = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            const currentKey = keys[i];
            if (currentKey && !(currentKey in current)) {
                current[currentKey] = {};
            }
            if (currentKey) {
                current = current[currentKey];
            }
        }
        const lastKey = keys[keys.length - 1];
        if (lastKey) {
            current[lastKey] = value;
        }
        // 【AI 李大庆】: 验证更新后的配置
        await this.validateConfig();
        // 【AI 李大庆】: 保存配置
        await this.saveConfig();
    }
    // 【AI 李大庆】: 获取配置值
    getConfigValue(key) {
        if (!this.config) {
            throw new types_1.ConfigurationError('Configuration not loaded.');
        }
        const keys = key.split('.');
        let current = this.config;
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    // 【AI 李大庆】: 重置为默认配置
    async resetConfig() {
        this.config = { ...this.defaultConfig };
        await this.saveConfig();
    }
    // 【AI 李大庆】: 保存配置
    async saveConfig() {
        if (!this.config) {
            throw new types_1.ConfigurationError('No configuration to save.');
        }
        const configPath = this.configPath || this.getDefaultConfigPath();
        try {
            await fs_extra_1.default.ensureDir(path_1.default.dirname(configPath));
            await fs_extra_1.default.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
            this.configPath = configPath;
        }
        catch (error) {
            throw new types_1.ConfigurationError(`Failed to save configuration: ${error}`);
        }
    }
    // 【AI 李大庆】: 验证配置
    async validateConfig() {
        if (!this.config) {
            throw new types_1.ConfigurationError('No configuration to validate.');
        }
        const { error } = this.configSchema.validate(this.config);
        if (error) {
            throw new types_1.ConfigurationError(`Invalid configuration: ${error.message}`);
        }
    }
    // 【AI 李大庆】: 合并默认配置
    mergeWithDefaults(userConfig) {
        return {
            ollama: { ...this.defaultConfig.ollama, ...userConfig.ollama },
            codeGeneration: { ...this.defaultConfig.codeGeneration, ...userConfig.codeGeneration },
            codeReview: { ...this.defaultConfig.codeReview, ...userConfig.codeReview },
            execution: { ...this.defaultConfig.execution, ...userConfig.execution },
            ui: { ...this.defaultConfig.ui, ...userConfig.ui },
            security: { ...this.defaultConfig.security, ...userConfig.security }
        };
    }
    // 【AI 李大庆】: 创建默认配置文件
    async createDefaultConfigFile() {
        const configPath = this.getDefaultConfigPath();
        try {
            await fs_extra_1.default.ensureDir(path_1.default.dirname(configPath));
            await fs_extra_1.default.writeFile(configPath, JSON.stringify(this.defaultConfig, null, 2), 'utf-8');
            this.configPath = configPath;
        }
        catch (error) {
            // 【AI 李大庆】: 如果无法创建配置文件，继续使用内存中的默认配置
            console.warn(`Warning: Could not create default config file: ${error}`);
        }
    }
    // 【AI 李大庆】: 获取默认配置文件路径
    getDefaultConfigPath() {
        const homeDir = os_1.default.homedir();
        return path_1.default.join(homeDir, '.ai-cli-chat', 'config.json');
    }
    // 【AI 李大庆】: 获取配置文件路径
    getConfigPath() {
        return this.configPath;
    }
}
exports.ConfigManager = ConfigManager;
// 【AI 李大庆】end: 配置管理器实现
//# sourceMappingURL=ConfigManager.js.map