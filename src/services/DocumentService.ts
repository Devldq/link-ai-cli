// 文档服务实现
import fs from 'fs-extra';
import path from 'path';

import yaml from 'yaml';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../core/ConfigManager';

export interface DocumentOptions {
  format?: 'markdown' | 'json' | 'yaml' | 'txt' | 'auto';
  encoding?: BufferEncoding;
  createIfNotExists?: boolean;
  backup?: boolean;
  validateStructure?: boolean;
}

export interface DocumentResult {
  success: boolean;
  message: string;
  content?: any;
  metadata?: DocumentMetadata;
  error?: string;
}

export interface DocumentMetadata {
  format: string;
  size: number;
  lastModified: Date;
  encoding: string;
  structure?: any;
}

export interface MarkdownDocument {
  frontmatter?: Record<string, any>;
  content: string;
  headings: Array<{
    level: number;
    text: string;
    id: string;
  }>;
  links: Array<{
    text: string;
    url: string;
    title?: string;
  }>;
}

export interface JsonDocument {
  data: any;
  schema?: any;
  isValid: boolean;
}

export interface YamlDocument {
  data: any;
  isValid: boolean;
}

export class DocumentService {
  private logger: Logger;
  private readonly supportedFormats = ['md', 'markdown', 'json', 'yaml', 'yml', 'txt'];

  constructor(_configManager: ConfigManager, logger: Logger) {
    this.logger = logger;
  }

  // 读取文档
  async readDocument(filePath: string, options: DocumentOptions = {}): Promise<DocumentResult> {
    try {
      const { format = 'auto', encoding = 'utf8' } = options;

      // 检查文件是否存在
      if (!await fs.pathExists(filePath)) {
        return {
          success: false,
          message: 'Document not found',
          error: `File does not exist: ${filePath}`
        };
      }

      // 获取文件信息
      const stats = await fs.stat(filePath);
      const detectedFormat = format === 'auto' ? this.detectFormat(filePath) : format;

      // 读取原始内容
      const rawContent = await fs.readFile(filePath, encoding);

      // 解析内容
      const parsedContent = await this.parseContent(rawContent, detectedFormat);

      const metadata: DocumentMetadata = {
        format: detectedFormat,
        size: stats.size,
        lastModified: stats.mtime,
        encoding,
        structure: this.analyzeStructure(parsedContent, detectedFormat)
      };

      this.logger.info('Document read successfully', { 
        filePath, 
        format: detectedFormat, 
        size: stats.size 
      });

      return {
        success: true,
        message: 'Document read successfully',
        content: parsedContent,
        metadata
      };
    } catch (error) {
      this.logger.error('Failed to read document', { 
        filePath, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        success: false,
        message: 'Failed to read document',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 写入文档
  async writeDocument(filePath: string, content: any, options: DocumentOptions = {}): Promise<DocumentResult> {
    try {
      const { 
        format = 'auto', 
        encoding = 'utf8', 
        createIfNotExists = true,
        backup = true 
      } = options;

      const detectedFormat = format === 'auto' ? this.detectFormat(filePath) : format;
      
      // 检查文件是否存在
      const fileExists = await fs.pathExists(filePath);
      
      if (!fileExists && !createIfNotExists) {
        return {
          success: false,
          message: 'Document does not exist and createIfNotExists is false',
          error: `File not found: ${filePath}`
        };
      }

      // 创建备份
      let backupPath: string | undefined;
      if (fileExists && backup) {
        backupPath = await this.createBackup(filePath);
      }

      // 序列化内容
      const serializedContent = await this.serializeContent(content, detectedFormat);

      // 确保目录存在
      await fs.ensureDir(path.dirname(filePath));

      // 写入文件
      await fs.writeFile(filePath, serializedContent, encoding);

      // 获取新文件信息
      const stats = await fs.stat(filePath);
      const metadata: DocumentMetadata = {
        format: detectedFormat,
        size: stats.size,
        lastModified: stats.mtime,
        encoding
      };

      this.logger.info('Document written successfully', { 
        filePath, 
        format: detectedFormat, 
        size: stats.size,
        backupCreated: !!backupPath
      });

      return {
        success: true,
        message: fileExists ? 'Document updated successfully' : 'Document created successfully',
        metadata
      };
    } catch (error) {
      this.logger.error('Failed to write document', { 
        filePath, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        success: false,
        message: 'Failed to write document',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 解析Markdown文档
  async parseMarkdown(content: string): Promise<MarkdownDocument> {
    const result: MarkdownDocument = {
      content: '',
      headings: [],
      links: []
    };

    // 解析frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch && frontmatterMatch[1] && frontmatterMatch[2]) {
      try {
        result.frontmatter = yaml.parse(frontmatterMatch[1]);
        result.content = frontmatterMatch[2];
      } catch (error) {
        this.logger.warn('Failed to parse frontmatter', { error });
        result.content = content;
      }
    } else {
      result.content = content;
    }

    // 提取标题
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let headingMatch;
    while ((headingMatch = headingRegex.exec(result.content)) !== null) {
      if (headingMatch[1] && headingMatch[2]) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        
        result.headings.push({ level, text, id });
      }
    }

    // 提取链接
    const linkRegex = /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(result.content)) !== null) {
      if (linkMatch[1] && linkMatch[2]) {
        const linkObj: { text: string; url: string; title?: string } = {
          text: linkMatch[1],
          url: linkMatch[2]
        };
        if (linkMatch[3]) {
          linkObj.title = linkMatch[3];
        }
        result.links.push(linkObj);
      }
    }

    return result;
  }

  // 解析JSON文档
  async parseJson(content: string): Promise<JsonDocument> {
    try {
      const data = JSON.parse(content);
      return {
        data,
        isValid: true
      };
    } catch (error) {
      this.logger.warn('Invalid JSON content', { error });
      return {
        data: null,
        isValid: false
      };
    }
  }

  // 解析YAML文档
  async parseYaml(content: string): Promise<YamlDocument> {
    try {
      const data = yaml.parse(content);
      return {
        data,
        isValid: true
      };
    } catch (error) {
      this.logger.warn('Invalid YAML content', { error });
      return {
        data: null,
        isValid: false
      };
    }
  }

  // 转换文档格式
  async convertDocument(
    sourcePath: string, 
    targetPath: string, 
    targetFormat: string
  ): Promise<DocumentResult> {
    try {
      // 读取源文档
      const sourceResult = await this.readDocument(sourcePath);
      if (!sourceResult.success) {
        return sourceResult;
      }

      // 转换内容
      const convertedContent = await this.convertContent(
        sourceResult.content, 
        sourceResult.metadata!.format, 
        targetFormat
      );

      // 写入目标文档
      return await this.writeDocument(targetPath, convertedContent, { 
        format: targetFormat as 'markdown' | 'json' | 'yaml' | 'txt' | 'auto'
      });
    } catch (error) {
      this.logger.error('Failed to convert document', { 
        sourcePath, 
        targetPath, 
        targetFormat,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        success: false,
        message: 'Failed to convert document',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 搜索文档内容
  async searchInDocument(filePath: string, query: string, options: { caseSensitive?: boolean } = {}): Promise<DocumentResult> {
    try {
      const { caseSensitive = false } = options;
      
      const docResult = await this.readDocument(filePath);
      if (!docResult.success) {
        return docResult;
      }

      const content = typeof docResult.content === 'string' 
        ? docResult.content 
        : JSON.stringify(docResult.content, null, 2);

      const searchQuery = caseSensitive ? query : query.toLowerCase();

      const matches: Array<{ line: number; text: string; index: number }> = [];
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const searchLine = caseSensitive ? line : line.toLowerCase();
        const matchIndex = searchLine.indexOf(searchQuery);
        if (matchIndex !== -1) {
          matches.push({
            line: index + 1,
            text: line.trim(),
            index: matchIndex
          });
        }
      });

      return {
        success: true,
        message: `Found ${matches.length} matches`,
        content: matches
      };
    } catch (error) {
      this.logger.error('Failed to search document', { 
        filePath, 
        query,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        success: false,
        message: 'Failed to search document',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 私有方法：检测文档格式
  private detectFormat(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    
    if (ext === 'md' || ext === 'markdown') return 'markdown';
    if (ext === 'json') return 'json';
    if (ext === 'yaml' || ext === 'yml') return 'yaml';
    if (ext === 'txt') return 'txt';
    
    return 'txt'; // 默认格式
  }

  // 私有方法：解析内容
  private async parseContent(content: string, format: string): Promise<any> {
    switch (format) {
      case 'markdown':
        return await this.parseMarkdown(content);
      case 'json':
        return await this.parseJson(content);
      case 'yaml':
        return await this.parseYaml(content);
      case 'txt':
      default:
        return content;
    }
  }

  // 私有方法：序列化内容
  private async serializeContent(content: any, format: string): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(content, null, 2);
      case 'yaml':
        return yaml.stringify(content);
      case 'markdown':
        if (typeof content === 'object' && content.frontmatter && content.content) {
          const frontmatter = content.frontmatter ? `---\n${yaml.stringify(content.frontmatter)}---\n` : '';
          return frontmatter + content.content;
        }
        return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      case 'txt':
      default:
        return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    }
  }

  // 私有方法：分析文档结构
  private analyzeStructure(content: any, format: string): any {
    switch (format) {
      case 'markdown':
        return {
          hasFrontmatter: !!content.frontmatter,
          headingCount: content.headings?.length || 0,
          linkCount: content.links?.length || 0,
          maxHeadingLevel: content.headings?.reduce((max: number, h: any) => Math.max(max, h.level), 0) || 0
        };
      case 'json':
        return {
          isValid: content.isValid,
          type: Array.isArray(content.data) ? 'array' : typeof content.data,
          keys: typeof content.data === 'object' && content.data ? Object.keys(content.data).length : 0
        };
      case 'yaml':
        return {
          isValid: content.isValid,
          type: Array.isArray(content.data) ? 'array' : typeof content.data
        };
      default:
        return {
          lineCount: typeof content === 'string' ? content.split('\n').length : 0,
          charCount: typeof content === 'string' ? content.length : 0
        };
    }
  }

  // 私有方法：转换内容格式
  private async convertContent(content: any, sourceFormat: string, targetFormat: string): Promise<any> {
    if (sourceFormat === targetFormat) {
      return content;
    }

    // 简单的格式转换逻辑
    switch (`${sourceFormat}->${targetFormat}`) {
      case 'json->yaml':
        return content.data;
      case 'yaml->json':
        return content.data;
      case 'markdown->txt':
        return content.content;
      default:
        // 通用转换：转为字符串
        return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    }
  }

  // 私有方法：创建备份
  private async createBackup(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    
    await fs.copy(filePath, backupPath);
    this.logger.info('Backup created', { originalPath: filePath, backupPath });
    
    return backupPath;
  }

  // 获取支持的格式列表
  getSupportedFormats(): string[] {
    return [...this.supportedFormats];
  }

  // 验证文档格式
  isFormatSupported(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase());
  }
}