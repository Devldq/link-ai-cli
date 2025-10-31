import { CodeGenerationService as ICodeGenerationService, CodeGenerationRequest, CodeGenerationResult, ValidationResult } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { Logger } from '../utils/Logger';
export declare class CodeGenerationService implements ICodeGenerationService {
    private ollamaProvider;
    private logger;
    constructor(ollamaProvider: OllamaProvider, logger: Logger);
    generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult>;
    validateCode(code: string, language: string): Promise<ValidationResult>;
    formatCode(code: string, language: string): Promise<string>;
    addComments(code: string, language: string): Promise<string>;
    saveCodeToFile(code: string, filePath: string): Promise<void>;
    private buildCodeGenerationPrompt;
    private extractCodeFromResponse;
    private extractExplanationFromResponse;
    private generateFilename;
    private getFileExtension;
    private generateSuggestions;
    private checkSyntax;
    private checkCodeStyle;
    private checkBestPractices;
    private checkJavaScriptSyntax;
    private checkPythonSyntax;
    private formatJavaScript;
    private formatPython;
    private formatJava;
    private formatGo;
    private formatGeneric;
    private getLineNumber;
    private getColumnNumber;
}
//# sourceMappingURL=CodeGenerationService.d.ts.map