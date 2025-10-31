"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeReviewService = void 0;
class CodeReviewService {
    constructor(ollamaProvider, logger) {
        this.ollamaProvider = ollamaProvider;
        this.logger = logger;
        this.defaultRules = this.initializeDefaultRules();
    }
    // 审查代码
    async reviewCode(code, options) {
        try {
            this.logger.debug('Starting code review');
            const issues = [];
            const enabledRules = options.rules.filter(rule => rule.enabled);
            // 执行各类检查
            for (const rule of enabledRules) {
                if (options.severity.includes(rule.severity)) {
                    const ruleIssues = await this.executeRule(code, rule, options.language);
                    issues.push(...ruleIssues);
                }
            }
            // 使用AI进行深度分析
            const aiIssues = await this.performAIAnalysis(code, options.language);
            issues.push(...aiIssues);
            // 计算评分
            const score = this.calculateScore(issues);
            // 生成摘要
            const summary = this.generateSummary(issues, score);
            const result = {
                issues,
                score,
                summary
            };
            this.logger.debug(`Code review completed with score: ${score}`);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to review code:', error);
            throw error;
        }
    }
    // 应用自动修复
    async applyFixes(code, fixes) {
        try {
            this.logger.debug(`Applying ${fixes.length} auto-fixes`);
            let fixedCode = code;
            const lines = fixedCode.split('\n');
            // 按行号倒序排序，避免修复时行号偏移
            const sortedFixes = fixes.sort((a, b) => b.line - a.line);
            for (const fix of sortedFixes) {
                if (fix.line > 0 && fix.line <= lines.length) {
                    const line = lines[fix.line - 1];
                    if (line) {
                        lines[fix.line - 1] = line.replace(fix.oldText, fix.newText);
                    }
                }
            }
            fixedCode = lines.join('\n');
            this.logger.debug('Auto-fixes applied successfully');
            return fixedCode;
        }
        catch (error) {
            this.logger.error('Failed to apply fixes:', error);
            throw error;
        }
    }
    // 生成审查报告
    async generateReport(results) {
        try {
            const overallScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
            const recommendations = await this.generateRecommendations(results);
            return {
                timestamp: new Date(),
                results,
                overallScore,
                recommendations
            };
        }
        catch (error) {
            this.logger.error('Failed to generate report:', error);
            throw error;
        }
    }
    // 初始化默认规则
    initializeDefaultRules() {
        return [
            {
                id: 'security-sql-injection',
                name: 'SQL Injection Detection',
                category: 'security',
                severity: 'error',
                enabled: true
            },
            {
                id: 'security-xss',
                name: 'XSS Vulnerability Detection',
                category: 'security',
                severity: 'error',
                enabled: true
            },
            {
                id: 'performance-loop-optimization',
                name: 'Loop Performance Optimization',
                category: 'performance',
                severity: 'warning',
                enabled: true
            },
            {
                id: 'style-naming-convention',
                name: 'Naming Convention',
                category: 'style',
                severity: 'info',
                enabled: true
            },
            {
                id: 'maintainability-function-length',
                name: 'Function Length',
                category: 'maintainability',
                severity: 'warning',
                enabled: true
            },
            {
                id: 'maintainability-complexity',
                name: 'Cyclomatic Complexity',
                category: 'maintainability',
                severity: 'warning',
                enabled: true
            }
        ];
    }
    // 执行规则检查
    async executeRule(code, rule, language) {
        const issues = [];
        switch (rule.id) {
            case 'security-sql-injection':
                issues.push(...this.checkSQLInjection(code, language));
                break;
            case 'security-xss':
                issues.push(...this.checkXSS(code, language));
                break;
            case 'performance-loop-optimization':
                issues.push(...this.checkLoopPerformance(code, language));
                break;
            case 'style-naming-convention':
                issues.push(...this.checkNamingConvention(code, language));
                break;
            case 'maintainability-function-length':
                issues.push(...this.checkFunctionLength(code, language));
                break;
            case 'maintainability-complexity':
                issues.push(...this.checkComplexity(code, language));
                break;
        }
        return issues;
    }
    // AI深度分析
    async performAIAnalysis(code, language) {
        try {
            const prompt = `Analyze the following ${language} code for potential issues:

1. Security vulnerabilities
2. Performance problems
3. Code quality issues
4. Best practice violations
5. Potential bugs

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide a detailed analysis in the following JSON format:
{
  "issues": [
    {
      "line": number,
      "column": number,
      "message": "description",
      "severity": "error|warning|info",
      "category": "security|performance|style|maintainability",
      "suggestion": "how to fix"
    }
  ]
}`;
            let response = '';
            const stream = this.ollamaProvider.generateStream(prompt, {
                temperature: 0.2,
                maxTokens: 1024
            });
            for await (const chunk of stream) {
                response += chunk;
            }
            // 解析AI响应
            const aiIssues = this.parseAIResponse(response);
            return aiIssues;
        }
        catch (error) {
            this.logger.warn('AI analysis failed:', error);
            return [];
        }
    }
    // 解析AI响应
    parseAIResponse(response) {
        try {
            // 尝试提取JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.issues && Array.isArray(parsed.issues)) {
                    return parsed.issues.map((issue, index) => ({
                        id: `ai-${index}`,
                        rule: 'ai-analysis',
                        category: issue.category || 'maintainability',
                        severity: issue.severity || 'info',
                        message: issue.message || 'AI detected potential issue',
                        line: issue.line || 1,
                        column: issue.column || 1,
                        suggestion: issue.suggestion,
                        autoFixable: false
                    }));
                }
            }
        }
        catch (error) {
            this.logger.warn('Failed to parse AI response:', error);
        }
        return [];
    }
    // 检查SQL注入
    checkSQLInjection(code, _language) {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            // 检查字符串拼接的SQL查询
            if (line.includes('SELECT') && (line.includes('+') || line.includes('${') || line.includes('%s'))) {
                issues.push({
                    id: `sql-injection-${index}`,
                    rule: 'security-sql-injection',
                    category: 'security',
                    severity: 'error',
                    message: 'Potential SQL injection vulnerability detected',
                    line: index + 1,
                    column: line.indexOf('SELECT') + 1,
                    suggestion: 'Use parameterized queries or prepared statements',
                    autoFixable: false
                });
            }
        });
        return issues;
    }
    // 检查XSS
    checkXSS(code, _language) {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            // 检查innerHTML的使用
            if (line.includes('innerHTML') && !line.includes('sanitize')) {
                issues.push({
                    id: `xss-${index}`,
                    rule: 'security-xss',
                    category: 'security',
                    severity: 'error',
                    message: 'Potential XSS vulnerability with innerHTML',
                    line: index + 1,
                    column: line.indexOf('innerHTML') + 1,
                    suggestion: 'Use textContent or sanitize the input',
                    autoFixable: false
                });
            }
        });
        return issues;
    }
    // 检查循环性能
    checkLoopPerformance(code, _language) {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            // 检查嵌套循环
            if (line.includes('for') && lines.slice(index + 1, index + 10).some(l => l.includes('for'))) {
                issues.push({
                    id: `nested-loop-${index}`,
                    rule: 'performance-loop-optimization',
                    category: 'performance',
                    severity: 'warning',
                    message: 'Nested loops detected, consider optimization',
                    line: index + 1,
                    column: line.indexOf('for') + 1,
                    suggestion: 'Consider using more efficient algorithms or data structures',
                    autoFixable: false
                });
            }
        });
        return issues;
    }
    // 检查命名约定
    checkNamingConvention(code, _language) {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            // 检查变量命名（简化版）
            const varMatches = line.match(/(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
            if (varMatches) {
                varMatches.forEach(match => {
                    const varName = match.split(/\s+/)[1];
                    if (varName && varName.length < 3 && !['i', 'j', 'k', 'id'].includes(varName)) {
                        issues.push({
                            id: `naming-${index}-${varName}`,
                            rule: 'style-naming-convention',
                            category: 'style',
                            severity: 'info',
                            message: `Variable name '${varName}' is too short`,
                            line: index + 1,
                            column: line.indexOf(varName) + 1,
                            suggestion: 'Use descriptive variable names',
                            autoFixable: false
                        });
                    }
                });
            }
        });
        return issues;
    }
    // 检查函数长度
    checkFunctionLength(code, _language) {
        const issues = [];
        const lines = code.split('\n');
        let functionStart = -1;
        let braceCount = 0;
        lines.forEach((line, index) => {
            if (line.includes('function') || line.match(/\w+\s*\(/)) {
                functionStart = index;
                braceCount = 0;
            }
            if (functionStart >= 0) {
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                if (braceCount === 0 && functionStart >= 0) {
                    const functionLength = index - functionStart + 1;
                    if (functionLength > 50) {
                        issues.push({
                            id: `function-length-${functionStart}`,
                            rule: 'maintainability-function-length',
                            category: 'maintainability',
                            severity: 'warning',
                            message: `Function is too long (${functionLength} lines)`,
                            line: functionStart + 1,
                            column: 1,
                            suggestion: 'Consider breaking down into smaller functions',
                            autoFixable: false
                        });
                    }
                    functionStart = -1;
                }
            }
        });
        return issues;
    }
    // 检查复杂度
    checkComplexity(code, _language) {
        const issues = [];
        const lines = code.split('\n');
        // 简化的圈复杂度计算
        let complexity = 1; // 基础复杂度
        let functionStart = -1;
        lines.forEach((line, index) => {
            if (line.includes('function') || line.match(/\w+\s*\(/)) {
                functionStart = index;
                complexity = 1;
            }
            // 增加复杂度的关键字
            const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'];
            complexityKeywords.forEach(keyword => {
                const matches = line.match(new RegExp(`\\b${keyword}\\b`, 'g'));
                if (matches) {
                    complexity += matches.length;
                }
            });
            if (line.includes('}') && functionStart >= 0) {
                if (complexity > 10) {
                    issues.push({
                        id: `complexity-${functionStart}`,
                        rule: 'maintainability-complexity',
                        category: 'maintainability',
                        severity: 'warning',
                        message: `High cyclomatic complexity (${complexity})`,
                        line: functionStart + 1,
                        column: 1,
                        suggestion: 'Consider refactoring to reduce complexity',
                        autoFixable: false
                    });
                }
                functionStart = -1;
            }
        });
        return issues;
    }
    // 计算评分
    calculateScore(issues) {
        let score = 100;
        issues.forEach(issue => {
            switch (issue.severity) {
                case 'error':
                    score -= 10;
                    break;
                case 'warning':
                    score -= 5;
                    break;
                case 'info':
                    score -= 1;
                    break;
            }
        });
        return Math.max(0, score);
    }
    // 生成摘要
    generateSummary(issues, score) {
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        const infoCount = issues.filter(i => i.severity === 'info').length;
        return {
            totalIssues: issues.length,
            errorCount,
            warningCount,
            infoCount,
            score
        };
    }
    // 生成建议
    async generateRecommendations(results) {
        const recommendations = [];
        const allIssues = results.flatMap(r => r.issues);
        const errorCount = allIssues.filter(i => i.severity === 'error').length;
        const warningCount = allIssues.filter(i => i.severity === 'warning').length;
        if (errorCount > 0) {
            recommendations.push(`Fix ${errorCount} critical error(s) before deployment`);
        }
        if (warningCount > 5) {
            recommendations.push('Consider addressing warnings to improve code quality');
        }
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        if (avgScore < 70) {
            recommendations.push('Overall code quality needs improvement');
        }
        // 按类别分组问题
        const securityIssues = allIssues.filter(i => i.category === 'security').length;
        const performanceIssues = allIssues.filter(i => i.category === 'performance').length;
        if (securityIssues > 0) {
            recommendations.push('Address security vulnerabilities immediately');
        }
        if (performanceIssues > 3) {
            recommendations.push('Consider performance optimizations');
        }
        return recommendations;
    }
    // 获取默认规则
    getDefaultRules() {
        return [...this.defaultRules];
    }
    // 添加自定义规则
    addCustomRule(rule) {
        this.defaultRules.push(rule);
    }
    // 移除规则
    removeRule(ruleId) {
        this.defaultRules = this.defaultRules.filter(rule => rule.id !== ruleId);
    }
}
exports.CodeReviewService = CodeReviewService;
//# sourceMappingURL=CodeReviewService.js.map