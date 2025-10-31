// 安全执行服务实现
import vm from 'vm';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { 
  ExecutionService as IExecutionService,
  ExecutionOptions,
  ExecutionResult,
  Sandbox,
  SandboxConfig,
  SecurityCheck,
  SecurityIssue,
  SecurityError 
} from '../types';
import { Logger } from '../utils/Logger';

export class ExecutionService implements IExecutionService {
  private logger: Logger;
  private tempDir: string;

  constructor(logger: Logger) {
    this.logger = logger;
    this.tempDir = path.join(os.tmpdir(), 'ai-cli-chat-sandbox');
    this.ensureTempDirectory();
  }

  // 执行代码
  async executeCode(code: string, language: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    try {
      this.logger.debug(`Executing ${language} code`);

      // 安全检查
      const securityCheck = await this.validateExecution(code);
      if (!securityCheck.passed) {
        throw new SecurityError(`Security validation failed: ${securityCheck.issues.map(i => i.message).join(', ')}`);
      }

      // 创建沙箱
      const sandboxConfig: SandboxConfig = {
        timeout: options.timeout || 10000,
        memoryLimit: 128 * 1024 * 1024, // 128MB
        allowedModules: ['fs', 'path', 'util', 'crypto'],
        restrictedPaths: ['/etc', '/usr', '/bin', '/sbin', '/root']
      };

      const sandbox = await this.createSandbox(sandboxConfig);

      try {
        // 根据语言执行代码
        const result = await this.executeInSandbox(code, language, sandbox, options);
        return result;
      } finally {
        // 清理沙箱
        await sandbox.cleanup();
      }

    } catch (error) {
      this.logger.error('Code execution failed:', error);
      throw error;
    }
  }

  // 创建沙箱
  async createSandbox(config: SandboxConfig): Promise<Sandbox> {
    const sandboxId = `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sandboxDir = path.join(this.tempDir, sandboxId);

    await fs.ensureDir(sandboxDir);

    return new NodeSandbox(sandboxId, sandboxDir, config, this.logger);
  }

  // 验证执行安全性
  async validateExecution(code: string): Promise<SecurityCheck> {
    const issues: SecurityIssue[] = [];

    // 检查危险函数
    const dangerousFunctions = [
      'eval', 'Function', 'setTimeout', 'setInterval',
      'require', 'import', 'process.exit', 'process.kill',
      'child_process', 'fs.unlink', 'fs.rmdir', 'fs.rm'
    ];

    dangerousFunctions.forEach(func => {
      if (code.includes(func)) {
        issues.push({
          type: 'dangerous_function',
          severity: 'high',
          message: `Dangerous function detected: ${func}`,
          suggestion: `Avoid using ${func} or use safer alternatives`
        });
      }
    });

    // 检查文件系统访问
    const fileSystemPatterns = [
      /fs\.(readFile|writeFile|unlink|rmdir|rm)/g,
      /require\(['"]fs['"]\)/g,
      /import.*from ['"]fs['"]/g
    ];

    fileSystemPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push({
          type: 'file_access',
          severity: 'medium',
          message: 'File system access detected',
          suggestion: 'Ensure file operations are safe and necessary'
        });
      }
    });

    // 检查网络访问
    const networkPatterns = [
      /require\(['"]http['"]\)/g,
      /require\(['"]https['"]\)/g,
      /require\(['"]net['"]\)/g,
      /fetch\(/g,
      /axios\./g
    ];

    networkPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push({
          type: 'network_access',
          severity: 'medium',
          message: 'Network access detected',
          suggestion: 'Ensure network operations are safe and necessary'
        });
      }
    });

    // 检查eval使用
    if (code.includes('eval(')) {
      issues.push({
        type: 'eval_usage',
        severity: 'high',
        message: 'eval() usage detected',
        suggestion: 'Avoid using eval() as it can execute arbitrary code'
      });
    }

    const passed = !issues.some(issue => issue.severity === 'high');

    return {
      passed,
      issues,
      recommendations: this.generateSecurityRecommendations(issues)
    };
  }

  // 在沙箱中执行代码
  private async executeInSandbox(
    code: string, 
    language: string, 
    sandbox: Sandbox, 
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'node':
      case 'nodejs':
        return await this.executeJavaScript(code, sandbox, options);
      case 'python':
        return await this.executePython(code, sandbox, options);
      case 'bash':
      case 'shell':
        return await this.executeBash(code, sandbox, options);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  // 执行JavaScript代码
  private async executeJavaScript(code: string, _sandbox: Sandbox, options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 创建安全的执行上下文
      const context = this.createSecureContext(options);
      
      // 包装代码以捕获输出
      const wrappedCode = `
        const console = {
          log: (...args) => __output.push(args.join(' ')),
          error: (...args) => __errors.push(args.join(' ')),
          warn: (...args) => __output.push('WARN: ' + args.join(' ')),
          info: (...args) => __output.push('INFO: ' + args.join(' '))
        };
        
        try {
          ${code}
        } catch (error) {
          __errors.push(error.message);
          throw error;
        }
      `;

      // 执行代码
      vm.runInContext(wrappedCode, context, {
        timeout: options.timeout || 10000,
        displayErrors: true
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        output: context['__output'],
        errors: context['__errors'],
        exitCode: 0,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        output: [],
        errors: [error instanceof Error ? error.message : String(error)],
        exitCode: 1,
        duration
      };
    }
  }

  // 执行Python代码
  private async executePython(code: string, _sandbox: Sandbox, options: ExecutionOptions): Promise<ExecutionResult> {
    return await this.executeWithProcess('python3', ['-c', code], options);
  }

  // 执行Bash代码
  private async executeBash(code: string, _sandbox: Sandbox, options: ExecutionOptions): Promise<ExecutionResult> {
    return await this.executeWithProcess('bash', ['-c', code], options);
  }

  // 使用子进程执行
  private async executeWithProcess(command: string, args: string[], options: ExecutionOptions): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const output: string[] = [];
      const errors: string[] = [];

      const child = spawn(command, args, {
        cwd: options.workingDirectory || this.tempDir,
        env: { ...process.env, ...options.environment },
        timeout: options.timeout || 10000
      });

      child.stdout?.on('data', (data) => {
        output.push(data.toString());
      });

      child.stderr?.on('data', (data) => {
        errors.push(data.toString());
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          success: code === 0,
          output,
          errors,
          exitCode: code || 0,
          duration
        });
      });

      child.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          output,
          errors: [error.message],
          exitCode: 1,
          duration
        });
      });
    });
  }

  // 创建安全执行上下文
  private createSecureContext(_options: ExecutionOptions): vm.Context {
    const context = vm.createContext({
      __output: [],
      __errors: [],
      // 提供安全的全局对象
      Buffer,
      setTimeout: (fn: () => void, delay: number) => {
        if (delay > 5000) throw new Error('Timeout too long');
        return setTimeout(fn, delay);
      },
      setInterval: (fn: () => void, delay: number) => {
        if (delay < 100) throw new Error('Interval too short');
        return setInterval(fn, delay);
      },
      // 受限的require函数
      require: (module: string) => {
        const allowedModules = ['util', 'crypto', 'path'];
        if (!allowedModules.includes(module)) {
          throw new Error(`Module '${module}' is not allowed`);
        }
        return require(module);
      }
    });

    return context;
  }

  // 生成安全建议
  private generateSecurityRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'dangerous_function')) {
      recommendations.push('Avoid using dangerous functions that can compromise security');
    }

    if (issues.some(i => i.type === 'file_access')) {
      recommendations.push('Limit file system access to necessary operations only');
    }

    if (issues.some(i => i.type === 'network_access')) {
      recommendations.push('Ensure network operations are secure and validated');
    }

    if (issues.some(i => i.type === 'eval_usage')) {
      recommendations.push('Replace eval() with safer alternatives like JSON.parse()');
    }

    if (recommendations.length === 0) {
      recommendations.push('Code appears to be safe for execution');
    }

    return recommendations;
  }

  // 确保临时目录存在
  private async ensureTempDirectory(): Promise<void> {
    try {
      await fs.ensureDir(this.tempDir);
    } catch (error) {
      this.logger.error('Failed to create temp directory:', error);
    }
  }

  // 清理临时文件
  async cleanup(): Promise<void> {
    try {
      await fs.remove(this.tempDir);
      this.logger.debug('Execution service cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup execution service:', error);
    }
  }
}

// Node.js沙箱实现
class NodeSandbox implements Sandbox {
  private id: string;
  private directory: string;
  private config: SandboxConfig;
  private logger: Logger;
  private output: string[] = [];
  private errors: string[] = [];

  constructor(id: string, directory: string, config: SandboxConfig, logger: Logger) {
    this.id = id;
    this.directory = directory;
    this.config = config;
    this.logger = logger;
  }

  // 执行代码
  async execute(code: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 创建受限的执行环境
      const context = vm.createContext({
        console: {
          log: (...args: any[]) => this.output.push(args.join(' ')),
          error: (...args: any[]) => this.errors.push(args.join(' ')),
          warn: (...args: any[]) => this.output.push('WARN: ' + args.join(' ')),
          info: (...args: any[]) => this.output.push('INFO: ' + args.join(' '))
        },
        // 受限的全局对象
        Buffer,
        JSON,
        Math,
        Date,
        String,
        Number,
        Boolean,
        Array,
        Object,
        RegExp
      });

      // 执行代码
      vm.runInContext(code, context, {
        timeout: this.config.timeout,
        displayErrors: true,
        filename: `sandbox-${this.id}.js`
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        output: this.output,
        errors: this.errors,
        exitCode: 0,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.errors.push(error instanceof Error ? error.message : String(error));

      return {
        success: false,
        output: this.output,
        errors: this.errors,
        exitCode: 1,
        duration
      };
    }
  }

  // 获取输出
  getOutput(): string[] {
    return [...this.output];
  }

  // 获取错误
  getErrors(): string[] {
    return [...this.errors];
  }

  // 清理沙箱
  async cleanup(): Promise<void> {
    try {
      await fs.remove(this.directory);
      this.logger.debug(`Sandbox ${this.id} cleaned up`);
    } catch (error) {
      this.logger.error(`Failed to cleanup sandbox ${this.id}:`, error);
    }
  }
}
