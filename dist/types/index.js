"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityError = exports.ConfigurationError = exports.CodeExecutionError = exports.OllamaConnectionError = exports.AICliError = void 0;
// 错误类型
class AICliError extends Error {
}
exports.AICliError = AICliError;
class OllamaConnectionError extends AICliError {
    constructor() {
        super(...arguments);
        this.code = 'OLLAMA_CONNECTION_ERROR';
        this.category = 'network';
        this.severity = 'high';
    }
}
exports.OllamaConnectionError = OllamaConnectionError;
class CodeExecutionError extends AICliError {
    constructor() {
        super(...arguments);
        this.code = 'CODE_EXECUTION_ERROR';
        this.category = 'execution';
        this.severity = 'medium';
    }
}
exports.CodeExecutionError = CodeExecutionError;
class ConfigurationError extends AICliError {
    constructor() {
        super(...arguments);
        this.code = 'CONFIGURATION_ERROR';
        this.category = 'config';
        this.severity = 'medium';
    }
}
exports.ConfigurationError = ConfigurationError;
class SecurityError extends AICliError {
    constructor() {
        super(...arguments);
        this.code = 'SECURITY_ERROR';
        this.category = 'security';
        this.severity = 'high';
    }
}
exports.SecurityError = SecurityError;
//# sourceMappingURL=index.js.map