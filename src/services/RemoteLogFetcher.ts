import type { LogEntry } from '../types/LogTypes';
import { LogParser } from './LogParser';

export interface RemoteLogConfig {
    url: string;
    username?: string;
    password?: string;
    logType: 'tomcat' | 'catalina' | 'custom';
    customPath?: string;
}

export class RemoteLogFetcher {
    static async fetchLogs(config: RemoteLogConfig): Promise<LogEntry[]> {
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (config.username && config.password) {
                const auth = btoa(`${config.username}:${config.password}`);
                headers['Authorization'] = `Basic ${auth}`;
            }

            const response = await fetch(config.url, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            return LogParser.parseLogContent(content);
        } catch (error) {
            console.error('Error fetching remote logs:', error);
            throw error;
        }
    }

    static getDefaultLogPath(logType: string): string {
        switch (logType) {
            case 'tomcat':
                return '/var/log/tomcat/catalina.out';
            case 'catalina':
                return '/var/log/tomcat/catalina.*.log';
            default:
                return '';
        }
    }
}
