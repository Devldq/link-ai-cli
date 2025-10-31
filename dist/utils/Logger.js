"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressIndicator = exports.Logger = exports.LogLevel = void 0;
// 【AI 李大庆】start: 日志记录器实现
const chalk_1 = __importDefault(require("chalk"));
const date_fns_1 = require("date-fns");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(verbose = false, level = LogLevel.INFO) {
        this.level = verbose ? LogLevel.DEBUG : level;
    }
    // 【AI 李大庆】: 设置日志级别
    setLevel(level) {
        this.level = level;
    }
    // 【AI 李大庆】: 设置详细模式
    setVerbose(verbose) {
        if (verbose) {
            this.level = LogLevel.DEBUG;
        }
    }
    // 【AI 李大庆】: 错误日志
    error(message, ...args) {
        if (this.level >= LogLevel.ERROR) {
            const timestamp = this.getTimestamp();
            console.error(chalk_1.default.red(`[${timestamp}] ❌ ERROR: ${message}`), ...args);
        }
    }
    // 【AI 李大庆】: 警告日志
    warn(message, ...args) {
        if (this.level >= LogLevel.WARN) {
            const timestamp = this.getTimestamp();
            console.warn(chalk_1.default.yellow(`[${timestamp}] ⚠️  WARN: ${message}`), ...args);
        }
    }
    // 【AI 李大庆】: 信息日志
    info(message, ...args) {
        if (this.level >= LogLevel.INFO) {
            const timestamp = this.getTimestamp();
            console.log(chalk_1.default.blue(`[${timestamp}] ℹ️  INFO: ${message}`), ...args);
        }
    }
    // 【AI 李大庆】: 调试日志
    debug(message, ...args) {
        if (this.level >= LogLevel.DEBUG) {
            const timestamp = this.getTimestamp();
            console.log(chalk_1.default.gray(`[${timestamp}] 🐛 DEBUG: ${message}`), ...args);
        }
    }
    // 【AI 李大庆】: 成功日志
    success(message, ...args) {
        const timestamp = this.getTimestamp();
        console.log(chalk_1.default.green(`[${timestamp}] ✅ SUCCESS: ${message}`), ...args);
    }
    // 【AI 李大庆】: 普通日志（不带级别标识）
    log(message, ...args) {
        console.log(message, ...args);
    }
    // 【AI 李大庆】: 获取时间戳
    getTimestamp() {
        return (0, date_fns_1.format)(new Date(), 'HH:mm:ss');
    }
    // 【AI 李大庆】: 创建进度指示器
    createProgress(message) {
        return new ProgressIndicator(message, this);
    }
}
exports.Logger = Logger;
// 【AI 李大庆】: 进度指示器类
class ProgressIndicator {
    constructor(message, _logger) {
        this.interval = null;
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.currentFrame = 0;
        this.message = message;
    }
    // 【AI 李大庆】: 开始进度指示
    start() {
        if (this.interval) {
            return;
        }
        process.stdout.write(`${chalk_1.default.cyan(this.frames[0])} ${this.message}`);
        this.interval = setInterval(() => {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            process.stdout.write(`\r${chalk_1.default.cyan(this.frames[this.currentFrame])} ${this.message}`);
        }, 100);
    }
    // 【AI 李大庆】: 更新进度消息
    update(message) {
        this.message = message;
        if (this.interval) {
            process.stdout.write(`\r${chalk_1.default.cyan(this.frames[this.currentFrame])} ${this.message}`);
        }
    }
    // 【AI 李大庆】: 停止进度指示（成功）
    succeed(message) {
        this.stop();
        const finalMessage = message || this.message;
        console.log(`\r${chalk_1.default.green('✅')} ${finalMessage}`);
    }
    // 【AI 李大庆】: 停止进度指示（失败）
    fail(message) {
        this.stop();
        const finalMessage = message || this.message;
        console.log(`\r${chalk_1.default.red('❌')} ${finalMessage}`);
    }
    // 【AI 李大庆】: 停止进度指示
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            process.stdout.write('\r');
        }
    }
}
exports.ProgressIndicator = ProgressIndicator;
// 【AI 李大庆】end: 日志记录器实现
//# sourceMappingURL=Logger.js.map