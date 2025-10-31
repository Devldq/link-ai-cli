// 【AI 李大庆】start: 日志记录器实现
import chalk from 'chalk';
import { format } from 'date-fns';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private level: LogLevel;

  constructor(verbose: boolean = false, level: LogLevel = LogLevel.INFO) {
    this.level = verbose ? LogLevel.DEBUG : level;
  }

  // 【AI 李大庆】: 设置日志级别
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // 【AI 李大庆】: 设置详细模式
  setVerbose(verbose: boolean): void {
    if (verbose) {
      this.level = LogLevel.DEBUG;
    }
  }

  // 【AI 李大庆】: 错误日志
  error(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.ERROR) {
      const timestamp = this.getTimestamp();
      console.error(chalk.red(`[${timestamp}] ❌ ERROR: ${message}`), ...args);
    }
  }

  // 【AI 李大庆】: 警告日志
  warn(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.WARN) {
      const timestamp = this.getTimestamp();
      console.warn(chalk.yellow(`[${timestamp}] ⚠️  WARN: ${message}`), ...args);
    }
  }

  // 【AI 李大庆】: 信息日志
  info(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.INFO) {
      const timestamp = this.getTimestamp();
      console.log(chalk.blue(`[${timestamp}] ℹ️  INFO: ${message}`), ...args);
    }
  }

  // 【AI 李大庆】: 调试日志
  debug(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.DEBUG) {
      const timestamp = this.getTimestamp();
      console.log(chalk.gray(`[${timestamp}] 🐛 DEBUG: ${message}`), ...args);
    }
  }

  // 【AI 李大庆】: 成功日志
  success(message: string, ...args: any[]): void {
    const timestamp = this.getTimestamp();
    console.log(chalk.green(`[${timestamp}] ✅ SUCCESS: ${message}`), ...args);
  }

  // 【AI 李大庆】: 普通日志（不带级别标识）
  log(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  // 【AI 李大庆】: 获取时间戳
  private getTimestamp(): string {
    return format(new Date(), 'HH:mm:ss');
  }

  // 【AI 李大庆】: 创建进度指示器
  createProgress(message: string): ProgressIndicator {
    return new ProgressIndicator(message, this);
  }
}

// 【AI 李大庆】: 进度指示器类
export class ProgressIndicator {
  private message: string;
  private interval: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;

  constructor(message: string, _logger: Logger) {
    this.message = message;
  }

  // 【AI 李大庆】: 开始进度指示
  start(): void {
    if (this.interval) {
      return;
    }

    process.stdout.write(`${chalk.cyan(this.frames[0])} ${this.message}`);
    
    this.interval = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      process.stdout.write(`\r${chalk.cyan(this.frames[this.currentFrame])} ${this.message}`);
    }, 100);
  }

  // 【AI 李大庆】: 更新进度消息
  update(message: string): void {
    this.message = message;
    if (this.interval) {
      process.stdout.write(`\r${chalk.cyan(this.frames[this.currentFrame])} ${this.message}`);
    }
  }

  // 【AI 李大庆】: 停止进度指示（成功）
  succeed(message?: string): void {
    this.stop();
    const finalMessage = message || this.message;
    console.log(`\r${chalk.green('✅')} ${finalMessage}`);
  }

  // 【AI 李大庆】: 停止进度指示（失败）
  fail(message?: string): void {
    this.stop();
    const finalMessage = message || this.message;
    console.log(`\r${chalk.red('❌')} ${finalMessage}`);
  }

  // 【AI 李大庆】: 停止进度指示
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r');
    }
  }
}
// 【AI 李大庆】end: 日志记录器实现