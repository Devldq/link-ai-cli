"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressIndicator = exports.Logger = exports.LogLevel = void 0;
// 日志记录器实现
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
    // 设置日志级别
    setLevel(level) {
        this.level = level;
    }
    // 设置详细模式
    setVerbose(verbose) {
        if (verbose) {
            this.level = LogLevel.DEBUG;
        }
    }
    // 错误日志
    error(message, ...args) {
        if (this.level >= LogLevel.ERROR) {
            const timestamp = this.getTimestamp();
            console.error(chalk_1.default.red(`[${timestamp}] ❌ ERROR: ${message}`), ...args);
        }
    }
    // 警告日志
    warn(message, ...args) {
        if (this.level >= LogLevel.WARN) {
            const timestamp = this.getTimestamp();
            console.warn(chalk_1.default.yellow(`[${timestamp}] ⚠️  WARN: ${message}`), ...args);
        }
    }
    // 信息日志
    info(message, ...args) {
        if (this.level >= LogLevel.INFO) {
            const timestamp = this.getTimestamp();
            console.log(chalk_1.default.blue(`[${timestamp}] ℹ️  INFO: ${message}`), ...args);
        }
    }
    // 调试日志
    debug(message, ...args) {
        if (this.level >= LogLevel.DEBUG) {
            const timestamp = this.getTimestamp();
            console.log(chalk_1.default.gray(`[${timestamp}] 🐛 DEBUG: ${message}`), ...args);
        }
    }
    // 成功日志
    success(message, ...args) {
        const timestamp = this.getTimestamp();
        console.log(chalk_1.default.green(`[${timestamp}] ✅ SUCCESS: ${message}`), ...args);
    }
    // 普通日志（不带级别标识）
    log(message, ...args) {
        console.log(message, ...args);
    }
    // 获取时间戳
    getTimestamp() {
        return (0, date_fns_1.format)(new Date(), 'HH:mm:ss');
    }
    // 创建进度指示器
    createProgress(message) {
        return new ProgressIndicator(message, this);
    }
}
exports.Logger = Logger;
// 进度指示器类
class ProgressIndicator {
    constructor(message, _logger) {
        this.interval = null;
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.currentFrame = 0;
        this.message = message;
    }
    // 开始进度指示
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
    // 更新进度消息
    update(message) {
        this.message = message;
        if (this.interval) {
            process.stdout.write(`\r${chalk_1.default.cyan(this.frames[this.currentFrame])} ${this.message}`);
        }
    }
    // 停止进度指示（成功）
    succeed(message) {
        this.stop();
        const finalMessage = message || this.message;
        console.log(`\r${chalk_1.default.green('✅')} ${finalMessage}`);
    }
    // 停止进度指示（失败）
    fail(message) {
        this.stop();
        const finalMessage = message || this.message;
        console.log(`\r${chalk_1.default.red('❌')} ${finalMessage}`);
    }
    // 停止进度指示
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            process.stdout.write('\r');
        }
    }
}
exports.ProgressIndicator = ProgressIndicator;
//# sourceMappingURL=Logger.js.map