// 【AI 李大庆】start: 文件编辑服务实现
import fs from 'fs-extra';
import path from 'path';
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

export class FileEditService {
  private logger: Logger;
  private configManager: ConfigManager;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 【AI 李大庆】: 10MB 限制

  constructor(configManager: ConfigManager, logger: Logger) {
    this.configManager = configManager;
    this.logger = logger;
  }

  // 【AI 李大庆】: 读取文件内容
  async readFile(filePath: string, options: FileEditOptions = {}): Promise<string> {
    try {
      const { encoding = 'utf8', validatePath = true } = options;

      if (validatePath) {
        await this.validateFilePath(filePath);
      }

      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`File size (${stats.size} bytes) exceeds maximum allowed size (${this.maxFileSize} bytes)`);
      }

      const content = await fs.readFile(filePath, encoding);
      this.logger.info('File read successfully', { filePath, size: stats.size });
      
      return content;
    } catch (error) {
      this.logger.error('Failed to read file', { filePath, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // 【AI 李大庆】: 写入文件内容
  async writeFile(filePath: string, content: string, options: FileEditOptions = {}): Promise<EditResult> {
    try {
      const { 
        backup = true, 
        encoding = 'utf8', 
        createIfNotExists = true,
        validatePath = true 
      } = options;

      if (validatePath) {
        await this.validateFilePath(filePath);
      }

      let originalContent = '';
      let backupPath: string | undefined;

      // 【AI 李大庆】: 检查文件是否存在
      const fileExists = await fs.pathExists(filePath);
      
      if (fileExists) {
        // 【AI 李大庆】: 读取原始内容用于备份
        originalContent = await this.readFile(filePath, { validatePath: false });
        
        // 【AI 李大庆】: 创建备份
        if (backup) {
          backupPath = await this.createBackup(filePath, originalContent);
        }
      } else if (!createIfNotExists) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // 【AI 李大庆】: 确保目录存在
      await fs.ensureDir(path.dirname(filePath));

      // 【AI 李大庆】: 写入新内容
      await fs.writeFile(filePath, content, encoding);

      const result: EditResult = {
        success: true,
        message: fileExists ? 'File updated successfully' : 'File created successfully',
        newContent: content
      };

      if (fileExists) {
        result.originalContent = originalContent;
      }
      
      if (backupPath) {
        result.backupPath = backupPath;
      }

      this.logger.info('File write operation completed', { 
        filePath, 
        operation: fileExists ? 'update' : 'create',
        contentLength: content.length,
        backupCreated: !!backupPath
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to write file', { filePath, error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to write file',
        error: errorMessage
      };
    }
  }

  // 【AI 李大庆】: 追加内容到文件
  async appendToFile(filePath: string, content: string, options: FileEditOptions = {}): Promise<EditResult> {
    try {
      const existingContent = await fs.pathExists(filePath) 
        ? await this.readFile(filePath, options)
        : '';
      
      const newContent = existingContent + content;
      return await this.writeFile(filePath, newContent, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to append to file', { filePath, error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to append to file',
        error: errorMessage
      };
    }
  }

  // 【AI 李大庆】: 在指定行插入内容
  async insertAtLine(filePath: string, lineNumber: number, content: string, options: FileEditOptions = {}): Promise<EditResult> {
    try {
      const originalContent = await this.readFile(filePath, options);
      const lines = originalContent.split('\n');
      
      // 【AI 李大庆】: 验证行号
      if (lineNumber < 1 || lineNumber > lines.length + 1) {
        throw new Error(`Invalid line number: ${lineNumber}. File has ${lines.length} lines.`);
      }

      // 【AI 李大庆】: 插入内容
      lines.splice(lineNumber - 1, 0, content);
      const newContent = lines.join('\n');

      return await this.writeFile(filePath, newContent, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to insert at line', { filePath, lineNumber, error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to insert content at line',
        error: errorMessage
      };
    }
  }

  // 【AI 李大庆】: 替换指定行的内容
  async replaceLine(filePath: string, lineNumber: number, newContent: string, options: FileEditOptions = {}): Promise<EditResult> {
    try {
      const originalContent = await this.readFile(filePath, options);
      const lines = originalContent.split('\n');
      
      // 【AI 李大庆】: 验证行号
      if (lineNumber < 1 || lineNumber > lines.length) {
        throw new Error(`Invalid line number: ${lineNumber}. File has ${lines.length} lines.`);
      }

      // 【AI 李大庆】: 替换内容
      lines[lineNumber - 1] = newContent;
      const updatedContent = lines.join('\n');

      return await this.writeFile(filePath, updatedContent, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to replace line', { filePath, lineNumber, error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to replace line content',
        error: errorMessage
      };
    }
  }

  // 【AI 李大庆】: 删除指定行
  async deleteLine(filePath: string, lineNumber: number, options: FileEditOptions = {}): Promise<EditResult> {
    try {
      const originalContent = await this.readFile(filePath, options);
      const lines = originalContent.split('\n');
      
      // 【AI 李大庆】: 验证行号
      if (lineNumber < 1 || lineNumber > lines.length) {
        throw new Error(`Invalid line number: ${lineNumber}. File has ${lines.length} lines.`);
      }

      // 【AI 李大庆】: 删除行
      lines.splice(lineNumber - 1, 1);
      const newContent = lines.join('\n');

      return await this.writeFile(filePath, newContent, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete line', { filePath, lineNumber, error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to delete line',
        error: errorMessage
      };
    }
  }

  // 【AI 李大庆】: 查找并替换文本
  async findAndReplace(filePath: string, searchText: string, replaceText: string, options: FileEditOptions & { global?: boolean } = {}): Promise<EditResult> {
    try {
      const { global = true } = options;
      const originalContent = await this.readFile(filePath, options);
      
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), global ? 'g' : '');
      const newContent = originalContent.replace(regex, replaceText);

      if (originalContent === newContent) {
        return {
          success: true,
          message: 'No matches found for replacement',
          originalContent,
          newContent
        };
      }

      return await this.writeFile(filePath, newContent, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to find and replace', { filePath, searchText, error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to find and replace text',
        error: errorMessage
      };
    }
  }

  // 【AI 李大庆】: 获取文件信息
  async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const exists = await fs.pathExists(filePath);
      
      if (!exists) {
        return {
          path: filePath,
          exists: false,
          size: 0,
          lastModified: new Date(0),
          isDirectory: false,
          permissions: {
            readable: false,
            writable: false,
            executable: false
          }
        };
      }

      const stats = await fs.stat(filePath);
      
      // 【AI 李大庆】: 检查权限
      const permissions = {
        readable: await this.checkPermission(filePath, fs.constants.R_OK),
        writable: await this.checkPermission(filePath, fs.constants.W_OK),
        executable: await this.checkPermission(filePath, fs.constants.X_OK)
      };

      return {
        path: filePath,
        exists: true,
        size: stats.size,
        lastModified: stats.mtime,
        isDirectory: stats.isDirectory(),
        permissions
      };
    } catch (error) {
      this.logger.error('Failed to get file info', { filePath, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // 【AI 李大庆】: 创建备份文件
  private async createBackup(filePath: string, content: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    
    await fs.writeFile(backupPath, content, 'utf8');
    this.logger.info('Backup created', { originalPath: filePath, backupPath });
    
    return backupPath;
  }

  // 【AI 李大庆】: 验证文件路径
  private async validateFilePath(filePath: string): Promise<void> {
    const config = this.configManager.getConfig();
    const restrictedPaths = config.security.restrictedPaths;
    
    const resolvedPath = path.resolve(filePath);
    
    // 【AI 李大庆】: 检查是否在受限路径中
    for (const restrictedPath of restrictedPaths) {
      if (resolvedPath.startsWith(path.resolve(restrictedPath))) {
        throw new Error(`Access denied: Path is restricted: ${restrictedPath}`);
      }
    }

    // 【AI 李大庆】: 检查路径遍历攻击
    if (filePath.includes('..') || filePath.includes('~')) {
      throw new Error('Invalid file path: Path traversal detected');
    }
  }

  // 【AI 李大庆】: 检查文件权限
  private async checkPermission(filePath: string, mode: number): Promise<boolean> {
    try {
      await fs.access(filePath, mode);
      return true;
    } catch {
      return false;
    }
  }

  // 【AI 李大庆】: 删除文件
  async deleteFile(filePath: string, options: FileEditOptions = {}): Promise<EditResult> {
    try {
      const { backup = true, validatePath = true } = options;

      if (validatePath) {
        await this.validateFilePath(filePath);
      }

      const fileExists = await fs.pathExists(filePath);
      if (!fileExists) {
        return {
          success: false,
          message: 'File does not exist',
          error: `File not found: ${filePath}`
        };
      }

      let backupPath: string | undefined;
      let originalContent: string | undefined;

      // 【AI 李大庆】: 创建备份
      if (backup) {
        originalContent = await this.readFile(filePath, { validatePath: false });
        backupPath = await this.createBackup(filePath, originalContent);
      }

      // 【AI 李大庆】: 删除文件
      await fs.remove(filePath);

      this.logger.info('File deleted successfully', { filePath, backupCreated: !!backupPath });

      const result: EditResult = {
        success: true,
        message: 'File deleted successfully'
      };

      if (originalContent) {
        result.originalContent = originalContent;
      }
      
      if (backupPath) {
        result.backupPath = backupPath;
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete file', { filePath, error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to delete file',
        error: errorMessage
      };
    }
  }
}
// 【AI 李大庆】end: 文件编辑服务实现