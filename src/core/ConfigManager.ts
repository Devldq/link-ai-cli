// 配置管理器实现
import { cosmiconfig } from 'cosmiconfig';
import Joi from 'joi';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { AppConfig, ConfigurationError } from '../types';

export class ConfigManager {
  private config: AppConfig | null = null;
  private configPath: string | null = null;
  private readonly explorer = cosmiconfig('ai-cli-chat');

  // 默认配置
  private readonly defaultConfig: AppConfig = {
    ollama: {
      endpoint: 'http://172.22.126.78:11434',
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

  // 配置验证模式
  private readonly configSchema = Joi.object({
    ollama: Joi.object({
      endpoint: Joi.string().uri().required(),
      model: Joi.string().required(),
      timeout: Joi.number().positive().required(),
      maxTokens: Joi.number().positive().required(),
      temperature: Joi.number().min(0).max(1).required()
    }).required(),
    codeGeneration: Joi.object({
      defaultLanguage: Joi.string().required(),
      defaultFramework: Joi.string().optional(),
      includeComments: Joi.boolean().required(),
      includeTests: Joi.boolean().required(),
      outputDirectory: Joi.string().required()
    }).required(),
    codeReview: Joi.object({
      enabledRules: Joi.array().items(Joi.string()).required(),
      severity: Joi.array().items(Joi.string().valid('error', 'warning', 'info')).required(),
      autoFix: Joi.boolean().required(),
      reportFormat: Joi.string().valid('json', 'markdown', 'html').required()
    }).required(),
    execution: Joi.object({
      timeout: Joi.number().positive().required(),
      sandboxEnabled: Joi.boolean().required(),
      allowNetworkAccess: Joi.boolean().required(),
      allowFileSystemAccess: Joi.boolean().required()
    }).required(),
    ui: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').required(),
      showProgress: Joi.boolean().required(),
      verboseOutput: Joi.boolean().required()
    }).required(),
    security: Joi.object({
      enableSandbox: Joi.boolean().required(),
      allowedModules: Joi.array().items(Joi.string()).required(),
      restrictedPaths: Joi.array().items(Joi.string()).required(),
      maxExecutionTime: Joi.number().positive().required()
    }).required()
  });

  // 加载配置
  async loadConfig(configPath?: string): Promise<void> {
    try {
      let result;
      
      if (configPath) {
        // 使用指定的配置文件路径
        const configContent = await fs.readFile(configPath, 'utf-8');
        result = {
          config: JSON.parse(configContent),
          filepath: configPath
        };
      } else {
        // 自动搜索配置文件
        result = await this.explorer.search();
      }

      if (result) {
        this.configPath = result.filepath;
        this.config = this.mergeWithDefaults(result.config);
      } else {
        // 使用默认配置
        this.config = { ...this.defaultConfig };
        await this.createDefaultConfigFile();
      }

      // 验证配置
      await this.validateConfig();

    } catch (error) {
      throw new ConfigurationError(`Failed to load configuration: ${error}`);
    }
  }

  // 获取配置
  getConfig(): AppConfig {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  // 设置配置值
  async setConfig(key: string, value: any): Promise<void> {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded.');
    }

    // 使用点号分隔的键路径设置值
    const keys = key.split('.');
    let current: any = this.config;
    
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

    // 验证更新后的配置
    await this.validateConfig();
    
    // 保存配置
    await this.saveConfig();
  }

  // 获取配置值
  getConfigValue(key: string): any {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded.');
    }

    const keys = key.split('.');
    let current: any = this.config;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  // 重置为默认配置
  async resetConfig(): Promise<void> {
    this.config = { ...this.defaultConfig };
    await this.saveConfig();
  }

  // 保存配置
  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new ConfigurationError('No configuration to save.');
    }

    const configPath = this.configPath || this.getDefaultConfigPath();
    
    try {
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      this.configPath = configPath;
    } catch (error) {
      throw new ConfigurationError(`Failed to save configuration: ${error}`);
    }
  }

  // 验证配置
  private async validateConfig(): Promise<void> {
    if (!this.config) {
      throw new ConfigurationError('No configuration to validate.');
    }

    const { error } = this.configSchema.validate(this.config);
    if (error) {
      throw new ConfigurationError(`Invalid configuration: ${error.message}`);
    }
  }

  // 合并默认配置
  private mergeWithDefaults(userConfig: Partial<AppConfig>): AppConfig {
    return {
      ollama: { ...this.defaultConfig.ollama, ...userConfig.ollama },
      codeGeneration: { ...this.defaultConfig.codeGeneration, ...userConfig.codeGeneration },
      codeReview: { ...this.defaultConfig.codeReview, ...userConfig.codeReview },
      execution: { ...this.defaultConfig.execution, ...userConfig.execution },
      ui: { ...this.defaultConfig.ui, ...userConfig.ui },
      security: { ...this.defaultConfig.security, ...userConfig.security }
    };
  }

  // 创建默认配置文件
  private async createDefaultConfigFile(): Promise<void> {
    const configPath = this.getDefaultConfigPath();
    
    try {
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeFile(configPath, JSON.stringify(this.defaultConfig, null, 2), 'utf-8');
      this.configPath = configPath;
    } catch (error) {
      // 如果无法创建配置文件，继续使用内存中的默认配置
      console.warn(`Warning: Could not create default config file: ${error}`);
    }
  }

  // 获取默认配置文件路径
  private getDefaultConfigPath(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, '.ai-cli-chat', 'config.json');
  }

  // 获取配置文件路径
  getConfigPath(): string | null {
    return this.configPath;
  }
}