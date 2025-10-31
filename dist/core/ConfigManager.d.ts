import { AppConfig } from '../types';
export declare class ConfigManager {
    private config;
    private configPath;
    private readonly explorer;
    private readonly defaultConfig;
    private readonly configSchema;
    loadConfig(configPath?: string): Promise<void>;
    getConfig(): AppConfig;
    setConfig(key: string, value: any): Promise<void>;
    getConfigValue(key: string): any;
    resetConfig(): Promise<void>;
    saveConfig(): Promise<void>;
    private validateConfig;
    private mergeWithDefaults;
    private createDefaultConfigFile;
    private getDefaultConfigPath;
    getConfigPath(): string | null;
}
//# sourceMappingURL=ConfigManager.d.ts.map