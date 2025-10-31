import { Logger } from '../utils/Logger';
import { ConfigManager } from '../core/ConfigManager';
export interface FileEditOptions {
    backup?: boolean;
    encoding?: BufferEncoding;
    createIfNotExists?: boolean;
    validatePath?: boolean;
}
export interface EditResult {
    success: boolean;
    message: string;
    originalContent?: string;
    newContent?: string;
    backupPath?: string;
    error?: string;
}
export interface FileInfo {
    path: string;
    exists: boolean;
    size: number;
    lastModified: Date;
    isDirectory: boolean;
    permissions: {
        readable: boolean;
        writable: boolean;
        executable: boolean;
    };
}
export declare class FileEditService {
    private logger;
    private configManager;
    private readonly maxFileSize;
    constructor(configManager: ConfigManager, logger: Logger);
    readFile(filePath: string, options?: FileEditOptions): Promise<string>;
    writeFile(filePath: string, content: string, options?: FileEditOptions): Promise<EditResult>;
    appendToFile(filePath: string, content: string, options?: FileEditOptions): Promise<EditResult>;
    insertAtLine(filePath: string, lineNumber: number, content: string, options?: FileEditOptions): Promise<EditResult>;
    replaceLine(filePath: string, lineNumber: number, newContent: string, options?: FileEditOptions): Promise<EditResult>;
    deleteLine(filePath: string, lineNumber: number, options?: FileEditOptions): Promise<EditResult>;
    findAndReplace(filePath: string, searchText: string, replaceText: string, options?: FileEditOptions & {
        global?: boolean;
    }): Promise<EditResult>;
    getFileInfo(filePath: string): Promise<FileInfo>;
    private createBackup;
    private validateFilePath;
    private checkPermission;
    deleteFile(filePath: string, options?: FileEditOptions): Promise<EditResult>;
}
//# sourceMappingURL=FileEditService.d.ts.map