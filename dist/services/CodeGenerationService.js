"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerationService = void 0;
// 【AI 李大庆】start: 代码生成服务实现
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class CodeGenerationService {
    constructor(ollamaProvider, logger) {
        this.ollamaProvider = ollamaProvider;
        this.logger = logger;
    }
    // 【AI 李大庆】: 生成代码
    async generateCode(request) {
        try {
            this.logger.debug('Generating code for request:', request);
            // 【AI 李大庆】: 构建代码生成提示
            const prompt = this.buildCodeGenerationPrompt(request);
            // 【AI 李大庆】: 生成代码
            let generatedCode = '';
            const stream = this.ollamaProvider.generateStream(prompt, {
                temperature: 0.3, // 【AI 李大庆】: 较低的温度以获得更一致的代码
                maxTokens: 2048
            });
            for await (const chunk of stream) {
                generatedCode += chunk;
            }
            // 【AI 李大庆】: 提取代码块
            const extractedCode = this.extractCodeFromResponse(generatedCode, request.language);
            // 【AI 李大庆】: 格式化代码
            const formattedCode = await this.formatCode(extractedCode, request.language);
            // 【AI 李大庆】: 添加注释（如果需要）
            const finalCode = request.includeComments
                ? await this.addComments(formattedCode, request.language)
                : formattedCode;
            // 【AI 李大庆】: 生成文件名
            const filename = this.generateFilename(request);
            // 【AI 李大庆】: 生成解释
            const explanation = this.extractExplanationFromResponse(generatedCode);
            const result = {
                code: finalCode,
                language: request.language,
                filename,
                explanation,
                suggestions: this.generateSuggestions(request, finalCode)
            };
            this.logger.debug('Code generation completed successfully');
            return result;
        }
        catch (error) {
            this.logger.error('Failed to generate code:', error);
            throw error;
        }
    }
    // 【AI 李大庆】: 验证代码
    async validateCode(code, language) {
        try {
            this.logger.debug(`Validating ${language} code`);
            const errors = [];
            const warnings = [];
            // 【AI 李大庆】: 基本语法检查
            const syntaxErrors = await this.checkSyntax(code, language);
            errors.push(...syntaxErrors);
            // 【AI 李大庆】: 代码风格检查
            const styleWarnings = await this.checkCodeStyle(code, language);
            warnings.push(...styleWarnings);
            // 【AI 李大庆】: 最佳实践检查
            const practiceWarnings = await this.checkBestPractices(code, language);
            warnings.push(...practiceWarnings);
            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        }
        catch (error) {
            this.logger.error('Failed to validate code:', error);
            throw error;
        }
    }
    // 【AI 李大庆】: 格式化代码
    async formatCode(code, language) {
        try {
            // 【AI 李大庆】: 基本格式化逻辑
            let formattedCode = code;
            switch (language.toLowerCase()) {
                case 'javascript':
                case 'typescript':
                    formattedCode = this.formatJavaScript(code);
                    break;
                case 'python':
                    formattedCode = this.formatPython(code);
                    break;
                case 'java':
                    formattedCode = this.formatJava(code);
                    break;
                case 'go':
                    formattedCode = this.formatGo(code);
                    break;
                default:
                    // 【AI 李大庆】: 通用格式化
                    formattedCode = this.formatGeneric(code);
            }
            return formattedCode;
        }
        catch (error) {
            this.logger.warn('Failed to format code, returning original:', error);
            return code;
        }
    }
    // 【AI 李大庆】: 添加注释
    async addComments(code, language) {
        try {
            // 【AI 李大庆】: 使用AI生成注释
            const prompt = `Add helpful comments to the following ${language} code. 
Keep the original code intact and only add meaningful comments that explain the logic:

\`\`\`${language}
${code}
\`\`\`

Return only the commented code without any explanation.`;
            let commentedCode = '';
            const stream = this.ollamaProvider.generateStream(prompt, {
                temperature: 0.2,
                maxTokens: 1024
            });
            for await (const chunk of stream) {
                commentedCode += chunk;
            }
            // 【AI 李大庆】: 提取注释后的代码
            const extractedCode = this.extractCodeFromResponse(commentedCode, language);
            return extractedCode || code; // 【AI 李大庆】: 如果提取失败，返回原代码
        }
        catch (error) {
            this.logger.warn('Failed to add comments, returning original code:', error);
            return code;
        }
    }
    // 【AI 李大庆】: 保存代码到文件
    async saveCodeToFile(code, filePath) {
        try {
            // 【AI 李大庆】: 确保目录存在
            await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
            // 【AI 李大庆】: 写入文件
            await fs_extra_1.default.writeFile(filePath, code, 'utf-8');
            this.logger.success(`Code saved to: ${filePath}`);
        }
        catch (error) {
            this.logger.error('Failed to save code to file:', error);
            throw error;
        }
    }
    // 【AI 李大庆】: 构建代码生成提示
    buildCodeGenerationPrompt(request) {
        let prompt = `Generate ${request.language} code based on the following description:\n\n`;
        prompt += `Description: ${request.description}\n\n`;
        if (request.framework) {
            prompt += `Framework: ${request.framework}\n`;
        }
        if (request.style) {
            prompt += `Code Style:\n`;
            prompt += `- Indentation: ${request.style.indentation} (${request.style.indentSize})\n`;
            prompt += `- Quotes: ${request.style.quotes}\n`;
            prompt += `- Semicolons: ${request.style.semicolons ? 'required' : 'optional'}\n`;
        }
        prompt += `\nRequirements:\n`;
        prompt += `- Write clean, readable code\n`;
        prompt += `- Follow best practices for ${request.language}\n`;
        prompt += `- Include error handling where appropriate\n`;
        if (request.includeTests) {
            prompt += `- Include unit tests\n`;
        }
        if (request.includeComments) {
            prompt += `- Add helpful comments\n`;
        }
        prompt += `\nPlease provide:\n`;
        prompt += `1. The complete code implementation\n`;
        prompt += `2. A brief explanation of the code\n`;
        prompt += `3. Any important notes or considerations\n\n`;
        prompt += `Format your response with code blocks using \`\`\`${request.language}\n`;
        return prompt;
    }
    // 【AI 李大庆】: 从响应中提取代码
    extractCodeFromResponse(response, language) {
        // 【AI 李大庆】: 尝试提取代码块
        const codeBlockRegex = new RegExp(`\`\`\`${language}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
        const match = response.match(codeBlockRegex);
        if (match && match[1]) {
            return match[1].trim();
        }
        // 【AI 李大庆】: 尝试提取通用代码块
        const genericCodeBlockRegex = /```[\w]*\s*\n([\s\S]*?)\n```/;
        const genericMatch = response.match(genericCodeBlockRegex);
        if (genericMatch && genericMatch[1]) {
            return genericMatch[1].trim();
        }
        // 【AI 李大庆】: 如果没有代码块，返回整个响应
        return response.trim();
    }
    // 【AI 李大庆】: 从响应中提取解释
    extractExplanationFromResponse(response) {
        // 【AI 李大庆】: 移除代码块，保留解释文本
        const withoutCodeBlocks = response.replace(/```[\s\S]*?```/g, '');
        return withoutCodeBlocks.trim();
    }
    // 【AI 李大庆】: 生成文件名
    generateFilename(request) {
        if (request.outputPath) {
            return path_1.default.basename(request.outputPath);
        }
        // 【AI 李大庆】: 基于描述生成文件名
        const baseName = request.description
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
        const extension = this.getFileExtension(request.language);
        return `${baseName}${extension}`;
    }
    // 【AI 李大庆】: 获取文件扩展名
    getFileExtension(language) {
        const extensions = {
            javascript: '.js',
            typescript: '.ts',
            python: '.py',
            java: '.java',
            go: '.go',
            cpp: '.cpp',
            c: '.c',
            csharp: '.cs',
            php: '.php',
            ruby: '.rb',
            rust: '.rs',
            kotlin: '.kt',
            swift: '.swift'
        };
        return extensions[language.toLowerCase()] || '.txt';
    }
    // 【AI 李大庆】: 生成建议
    generateSuggestions(request, code) {
        const suggestions = [];
        if (!request.includeTests) {
            suggestions.push('Consider adding unit tests to ensure code reliability');
        }
        if (!request.includeComments) {
            suggestions.push('Add comments to improve code readability');
        }
        if (code.length > 1000) {
            suggestions.push('Consider breaking down large functions into smaller, more manageable pieces');
        }
        if (request.language === 'javascript' && !code.includes('use strict')) {
            suggestions.push('Consider using strict mode for better error handling');
        }
        return suggestions;
    }
    // 【AI 李大庆】: 检查语法
    async checkSyntax(code, language) {
        const errors = [];
        // 【AI 李大庆】: 基本语法检查（简化版）
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                errors.push(...this.checkJavaScriptSyntax(code));
                break;
            case 'python':
                errors.push(...this.checkPythonSyntax(code));
                break;
        }
        return errors;
    }
    // 【AI 李大庆】: 检查代码风格
    async checkCodeStyle(code, _language) {
        const warnings = [];
        // 【AI 李大庆】: 基本风格检查
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            // 【AI 李大庆】: 检查行长度
            if (line.length > 120) {
                warnings.push({
                    line: index + 1,
                    column: 120,
                    message: 'Line too long (>120 characters)',
                    severity: 'warning'
                });
            }
            // 【AI 李大庆】: 检查尾随空格
            if (line.endsWith(' ') || line.endsWith('\t')) {
                warnings.push({
                    line: index + 1,
                    column: line.length,
                    message: 'Trailing whitespace',
                    severity: 'info'
                });
            }
        });
        return warnings;
    }
    // 【AI 李大庆】: 检查最佳实践
    async checkBestPractices(code, language) {
        const warnings = [];
        // 【AI 李大庆】: 基本最佳实践检查
        if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
            if (code.includes('var ')) {
                warnings.push({
                    line: 1,
                    column: 1,
                    message: 'Consider using let or const instead of var',
                    severity: 'warning'
                });
            }
            if (code.includes('== ') || code.includes('!= ')) {
                warnings.push({
                    line: 1,
                    column: 1,
                    message: 'Consider using strict equality (=== or !==)',
                    severity: 'warning'
                });
            }
        }
        return warnings;
    }
    // 【AI 李大庆】: JavaScript语法检查
    checkJavaScriptSyntax(code) {
        const errors = [];
        // 【AI 李大庆】: 简单的括号匹配检查
        const brackets = { '(': ')', '[': ']', '{': '}' };
        const stack = [];
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            if (char && char in brackets) {
                stack.push(char);
            }
            else if (char && Object.values(brackets).includes(char)) {
                const last = stack.pop();
                if (!last || brackets[last] !== char) {
                    errors.push({
                        line: this.getLineNumber(code, i),
                        column: this.getColumnNumber(code, i),
                        message: 'Mismatched brackets',
                        severity: 'error'
                    });
                }
            }
        }
        return errors;
    }
    // 【AI 李大庆】: Python语法检查
    checkPythonSyntax(code) {
        const errors = [];
        // 【AI 李大庆】: 简单的缩进检查
        const lines = code.split('\n');
        let expectedIndent = 0;
        lines.forEach((line, index) => {
            if (line.trim()) {
                const actualIndent = line.length - line.trimStart().length;
                if (line.trimStart().endsWith(':')) {
                    expectedIndent += 4;
                }
                if (actualIndent % 4 !== 0) {
                    errors.push({
                        line: index + 1,
                        column: 1,
                        message: 'Indentation should be multiple of 4 spaces',
                        severity: 'error'
                    });
                }
            }
        });
        return errors;
    }
    // 【AI 李大庆】: 格式化JavaScript代码
    formatJavaScript(code) {
        // 【AI 李大庆】: 简单的格式化逻辑
        return code
            .replace(/\s*{\s*/g, ' {\n  ')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/;\s*/g, ';\n')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    }
    // 【AI 李大庆】: 格式化Python代码
    formatPython(code) {
        // 【AI 李大庆】: 简单的Python格式化
        return code
            .split('\n')
            .map(line => line.trimEnd())
            .join('\n');
    }
    // 【AI 李大庆】: 格式化Java代码
    formatJava(code) {
        return this.formatJavaScript(code); // 【AI 李大庆】: 使用类似的格式化逻辑
    }
    // 【AI 李大庆】: 格式化Go代码
    formatGo(code) {
        return this.formatJavaScript(code); // 【AI 李大庆】: 使用类似的格式化逻辑
    }
    // 【AI 李大庆】: 通用格式化
    formatGeneric(code) {
        return code.trim();
    }
    // 【AI 李大庆】: 获取行号
    getLineNumber(code, position) {
        return code.substring(0, position).split('\n').length;
    }
    // 【AI 李大庆】: 获取列号
    getColumnNumber(code, position) {
        const lines = code.substring(0, position).split('\n');
        const lastLine = lines[lines.length - 1];
        return lastLine ? lastLine.length + 1 : 1;
    }
}
exports.CodeGenerationService = CodeGenerationService;
// 【AI 李大庆】end: 代码生成服务实现
//# sourceMappingURL=CodeGenerationService.js.map