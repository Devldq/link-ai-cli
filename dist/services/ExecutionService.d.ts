import { ExecutionService as IExecutionService, ExecutionOptions, ExecutionResult, Sandbox, SandboxConfig, SecurityCheck } from '../types';
import { Logger } from '../utils/Logger';
export declare class ExecutionService implements IExecutionService {
    private logger;
    private tempDir;
    constructor(logger: Logger);
    executeCode(code: string, language: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    createSandbox(config: SandboxConfig): Promise<Sandbox>;
    validateExecution(code: string): Promise<SecurityCheck>;
    private executeInSandbox;
    private executeJavaScript;
    private executePython;
    private executeBash;
    private executeWithProcess;
    private createSecureContext;
    private generateSecurityRecommendations;
    private ensureTempDirectory;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=ExecutionService.d.ts.map