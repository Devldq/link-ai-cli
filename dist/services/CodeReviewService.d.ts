import { CodeReviewService as ICodeReviewService, ReviewOptions, ReviewResult, ReviewRule, AutoFix, ReviewReport } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { Logger } from '../utils/Logger';
export declare class CodeReviewService implements ICodeReviewService {
    private ollamaProvider;
    private logger;
    private defaultRules;
    constructor(ollamaProvider: OllamaProvider, logger: Logger);
    reviewCode(code: string, options: ReviewOptions): Promise<ReviewResult>;
    applyFixes(code: string, fixes: AutoFix[]): Promise<string>;
    generateReport(results: ReviewResult[]): Promise<ReviewReport>;
    private initializeDefaultRules;
    private executeRule;
    private performAIAnalysis;
    private parseAIResponse;
    private checkSQLInjection;
    private checkXSS;
    private checkLoopPerformance;
    private checkNamingConvention;
    private checkFunctionLength;
    private checkComplexity;
    private calculateScore;
    private generateSummary;
    private generateRecommendations;
    getDefaultRules(): ReviewRule[];
    addCustomRule(rule: ReviewRule): void;
    removeRule(ruleId: string): void;
}
//# sourceMappingURL=CodeReviewService.d.ts.map