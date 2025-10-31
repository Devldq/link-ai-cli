// 代码生成服务实现
import fs from 'fs-extra';
import path from 'path';
import { 
  CodeGenerationService as ICodeGenerationService,
  CodeGenerationRequest,
  CodeGenerationResult,
  ValidationResult,
  ValidationError
} from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { Logger } from '../utils/Logger';

export class CodeGenerationService implements ICodeGenerationService {
  private ollamaProvider: OllamaProvider;
  private logger: Logger;

  constructor(ollamaProvider: OllamaProvider, logger: Logger) {
    this.ollamaProvider = ollamaProvider;
    this.logger = logger;
  }

  // 生成代码
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    try {
      this.logger.debug('Generating code for request:', request);

      // 构建代码生成提示
      const prompt = this.buildCodeGenerationPrompt(request);
      
      // 生成代码
      let generatedCode = '';
      const stream = this.ollamaProvider.generateStream(prompt, {
        temperature: 0.3, // 较低的温度以获得更一致的代码
        maxTokens: 2048
      });

      for await (const chunk of stream) {
        generatedCode += chunk;
      }

      // 提取代码块
      const extractedCode = this.extractCodeFromResponse(generatedCode, request.language);
      
      // 格式化代码
      const formattedCode = await this.formatCode(extractedCode, request.language);
      
      // 添加注释（如果需要）
      const finalCode = request.includeComments 
        ? await this.addComments(formattedCode, request.language)
        : formattedCode;

      // 生成文件名
      const filename = this.generateFilename(request);

      // 生成解释
      const explanation = this.extractExplanationFromResponse(generatedCode);

      const result: CodeGenerationResult = {
        code: finalCode,
        language: request.language,
        filename,
        explanation,
        suggestions: this.generateSuggestions(request, finalCode)
      };

      this.logger.debug('Code generation completed successfully');
      return result;

    } catch (error) {
      this.logger.error('Failed to generate code:', error);
      throw error;
    }
  }

  // 验证代码
  async validateCode(code: string, language: string): Promise<ValidationResult> {
    try {
      this.logger.debug(`Validating ${language} code`);

      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // 基本语法检查
      const syntaxErrors = await this.checkSyntax(code, language);
      errors.push(...syntaxErrors);

      // 代码风格检查
      const styleWarnings = await this.checkCodeStyle(code, language);
      warnings.push(...styleWarnings);

      // 最佳实践检查
      const practiceWarnings = await this.checkBestPractices(code, language);
      warnings.push(...practiceWarnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      this.logger.error('Failed to validate code:', error);
      throw error;
    }
  }

  // 格式化代码
  async formatCode(code: string, language: string): Promise<string> {
    try {
      // 基本格式化逻辑
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
          // 通用格式化
          formattedCode = this.formatGeneric(code);
      }

      return formattedCode;

    } catch (error) {
      this.logger.warn('Failed to format code, returning original:', error);
      return code;
    }
  }

  // 添加注释
  async addComments(code: string, language: string): Promise<string> {
    try {
      // 使用AI生成注释
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

      // 提取注释后的代码
      const extractedCode = this.extractCodeFromResponse(commentedCode, language);
      return extractedCode || code; // 如果提取失败，返回原代码

    } catch (error) {
      this.logger.warn('Failed to add comments, returning original code:', error);
      return code;
    }
  }

  // 保存代码到文件
  async saveCodeToFile(code: string, filePath: string): Promise<void> {
    try {
      // 确保目录存在
      await fs.ensureDir(path.dirname(filePath));
      
      // 写入文件
      await fs.writeFile(filePath, code, 'utf-8');
      
      this.logger.success(`Code saved to: ${filePath}`);
    } catch (error) {
      this.logger.error('Failed to save code to file:', error);
      throw error;
    }
  }

  // 构建代码生成提示
  private buildCodeGenerationPrompt(request: CodeGenerationRequest): string {
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

  // 从响应中提取代码
  private extractCodeFromResponse(response: string, language: string): string {
    // 尝试提取代码块
    const codeBlockRegex = new RegExp(`\`\`\`${language}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
    const match = response.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }

    // 尝试提取通用代码块
    const genericCodeBlockRegex = /```[\w]*\s*\n([\s\S]*?)\n```/;
    const genericMatch = response.match(genericCodeBlockRegex);
    
    if (genericMatch && genericMatch[1]) {
      return genericMatch[1].trim();
    }

    // 如果没有代码块，返回整个响应
    return response.trim();
  }

  // 从响应中提取解释
  private extractExplanationFromResponse(response: string): string {
    // 移除代码块，保留解释文本
    const withoutCodeBlocks = response.replace(/```[\s\S]*?```/g, '');
    return withoutCodeBlocks.trim();
  }

  // 生成文件名
  private generateFilename(request: CodeGenerationRequest): string {
    if (request.outputPath) {
      return path.basename(request.outputPath);
    }

    // 基于描述生成文件名
    const baseName = request.description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);

    const extension = this.getFileExtension(request.language);
    return `${baseName}${extension}`;
  }

  // 获取文件扩展名
  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
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

  // 生成建议
  private generateSuggestions(request: CodeGenerationRequest, code: string): string[] {
    const suggestions: string[] = [];

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

  // 检查语法
  private async checkSyntax(code: string, language: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // 基本语法检查（简化版）
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

  // 检查代码风格
  private async checkCodeStyle(code: string, _language: string): Promise<ValidationError[]> {
    const warnings: ValidationError[] = [];

    // 基本风格检查
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      // 检查行长度
      if (line.length > 120) {
        warnings.push({
          line: index + 1,
          column: 120,
          message: 'Line too long (>120 characters)',
          severity: 'warning'
        });
      }

      // 检查尾随空格
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

  // 检查最佳实践
  private async checkBestPractices(code: string, language: string): Promise<ValidationError[]> {
    const warnings: ValidationError[] = [];

    // 基本最佳实践检查
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

  // JavaScript语法检查
  private checkJavaScriptSyntax(code: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // 简单的括号匹配检查
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (char && char in brackets) {
        stack.push(char);
      } else if (char && Object.values(brackets).includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last as keyof typeof brackets] !== char) {
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

  // Python语法检查
  private checkPythonSyntax(code: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // 简单的缩进检查
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

  // 格式化JavaScript代码
  private formatJavaScript(code: string): string {
    // 简单的格式化逻辑
    return code
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/\s*}\s*/g, '\n}\n')
      .replace(/;\s*/g, ';\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  // 格式化Python代码
  private formatPython(code: string): string {
    // 简单的Python格式化
    return code
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');
  }

  // 格式化Java代码
  private formatJava(code: string): string {
    return this.formatJavaScript(code); // 使用类似的格式化逻辑
  }

  // 格式化Go代码
  private formatGo(code: string): string {
    return this.formatJavaScript(code); // 使用类似的格式化逻辑
  }

  // 通用格式化
  private formatGeneric(code: string): string {
    return code.trim();
  }

  // 获取行号
  private getLineNumber(code: string, position: number): number {
    return code.substring(0, position).split('\n').length;
  }

  // 获取列号
  private getColumnNumber(code: string, position: number): number {
    const lines = code.substring(0, position).split('\n');
    const lastLine = lines[lines.length - 1];
    return lastLine ? lastLine.length + 1 : 1;
  }
}
