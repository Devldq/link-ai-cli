export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export declare class Logger {
    private level;
    constructor(verbose?: boolean, level?: LogLevel);
    setLevel(level: LogLevel): void;
    setVerbose(verbose: boolean): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    success(message: string, ...args: any[]): void;
    log(message: string, ...args: any[]): void;
    private getTimestamp;
    createProgress(message: string): ProgressIndicator;
}
export declare class ProgressIndicator {
    private message;
    private interval;
    private frames;
    private currentFrame;
    constructor(message: string, _logger: Logger);
    start(): void;
    update(message: string): void;
    succeed(message?: string): void;
    fail(message?: string): void;
    stop(): void;
}
//# sourceMappingURL=Logger.d.ts.map