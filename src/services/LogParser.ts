import Papa from 'papaparse';
import type { LogEntry, LogFilter, LogStats } from '../types/LogTypes';

interface LogFormat {
    name: string;
    pattern: RegExp;
    extract: (match: RegExpExecArray) => Partial<LogEntry>;
}

export class LogParser {
    // Common log formats
    private static logFormats: LogFormat[] = [
        // Tomcat/Catalina format: 2023-05-29 10:15:30,123 INFO [http-nio-8080-exec-1] com.example.Class - Message
        {
            name: 'Tomcat/Catalina',
            pattern: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+(\w+)\s+\[([^\]]+)\]\s+([^\s-]+)\s+-\s+(.+)/,
            extract: (match) => ({
                timestamp: match[1],
                level: match[2],
                source: match[4],
                message: match[5],
                additionalInfo: { thread: match[3] }
            })
        },
        // ISO DateTime with Level: 2023-05-29T10:15:30.123Z [INFO] Message
        {
            name: 'ISO DateTime',
            pattern: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)\s*\[(\w+)\]\s+(.+)/,
            extract: (match) => ({
                timestamp: match[1],
                level: match[2],
                message: match[3]
            })
        },
        // Simple datetime level message: 2023-05-29 10:15:30 INFO Message
        {
            name: 'Simple DateTime',
            pattern: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)\s+(\w+)\s+(.+)/,
            extract: (match) => ({
                timestamp: match[1],
                level: match[2],
                message: match[3]
            })
        },
        // Simple pipe-separated format: timestamp|level|message
        {
            name: 'Pipe Separated',
            pattern: /^([^|]+)\|([^|]+)\|(.+)$/,
            extract: (match) => ({
                timestamp: match[1].trim(),
                level: match[2].trim(),
                message: match[3].trim()
            })
        },
        // Common Log Format: [timestamp] level: message
        {
            name: 'Common Format',
            pattern: /^\[([^\]]+)\]\s+(\w+):\s+(.+)$/,
            extract: (match) => ({
                timestamp: match[1],
                level: match[2],
                message: match[3]
            })
        },
        // Syslog-like format: May 29 10:15:30 host[123] level: message
        {
            name: 'Syslog-like',
            pattern: /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\[(\d+)\]\s+(\w+):\s+(.+)$/,
            extract: (match) => ({
                timestamp: match[1],
                source: match[2],
                level: match[4],
                message: match[5],
                additionalInfo: { pid: match[3] }
            })
        }
    ];

    static parseLogContent(content: string): LogEntry[] {
        const lines = content.split(/\r?\n/);
        const entries: LogEntry[] = [];
        const errors: string[] = [];

        let currentEntry: Partial<LogEntry> | null = null;
        let currentStackTrace: string[] = [];

        const finalizeCurrentEntry = () => {
            if (currentEntry) {
                if (currentStackTrace.length > 0) {
                    currentEntry.stackTrace = currentStackTrace.join('\n');
                    currentStackTrace = [];
                }
                entries.push({
                    timestamp: this.normalizeTimestamp(currentEntry.timestamp || new Date().toISOString()),
                    level: (currentEntry.level || 'UNKNOWN').toUpperCase(),
                    message: currentEntry.message || '',
                    source: currentEntry.source,
                    stackTrace: currentEntry.stackTrace,
                    additionalInfo: currentEntry.additionalInfo || {}
                });
                currentEntry = null;
            }
        };

        lines.forEach((line, index) => {
            if (!line.trim()) return;

            // Check if line looks like a stack trace
            if (line.trim().startsWith('at ') || line.trim().startsWith('Caused by: ') || line.match(/^\s+at\s+/)) {
                if (currentEntry) {
                    currentStackTrace.push(line);
                    return;
                }
            }

            // If we have a current entry, finalize it before starting a new one
            finalizeCurrentEntry();

            // Try to parse the line with each format
            let parsed = false;
            let attemptedFormats: string[] = [];

            for (const format of this.logFormats) {
                const match = format.pattern.exec(line);
                if (match) {
                    try {
                        currentEntry = format.extract(match);
                        parsed = true;
                        break;
                    } catch (err) {
                        const error = err as Error;
                        attemptedFormats.push(`${format.name}: ${error.message}`);
                    }
                } else {
                    attemptedFormats.push(format.name);
                }
            }

            if (!parsed) {
                // If no format matches, try to extract basic information
                const basicInfo = this.extractBasicInfo(line);
                if (basicInfo) {
                    currentEntry = basicInfo;
                } else {
                    // Store as unknown entry with details about the attempted formats
                    currentEntry = {
                        timestamp: new Date().toISOString(),
                        level: 'UNKNOWN',
                        message: line,
                        additionalInfo: {
                            parseNote: 'No matching format found',
                            attemptedFormats: attemptedFormats,
                            originalLine: line
                        }
                    };
                }
                errors.push(`Warning: No format match for line ${index + 1}`);
            }
        });

        // Don't forget to finalize the last entry
        finalizeCurrentEntry();

        if (errors.length > 0) {
            console.warn('Log parsing warnings:', errors);
        }

        return entries;
    }

    private static extractBasicInfo(line: string): Partial<LogEntry> | null {
        // Try to extract timestamp
        const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/);
        const levelMatch = line.match(/\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE)\b/i);

        if (timestampMatch || levelMatch) {
            return {
                timestamp: timestampMatch ? timestampMatch[0] : new Date().toISOString(),
                level: levelMatch ? levelMatch[0].toUpperCase() : 'UNKNOWN',
                message: line,
                additionalInfo: {
                    parseNote: 'Partial match using basic extraction'
                }
            };
        }
        return null;
    }

    private static normalizeTimestamp(timestamp: string): string {
        try {
            // Handle various date formats
            let date: Date;

            if (timestamp.includes(',')) {
                // Handle format: 2023-05-29 10:15:30,123
                date = new Date(timestamp.replace(',', '.'));
            } else {
                date = new Date(timestamp);
            }

            if (isNaN(date.getTime())) {
                throw new Error('Invalid date format');
            }

            return date.toISOString();
        } catch (err) {
            const error = err as Error;
            console.warn(`Error normalizing timestamp "${timestamp}":`, error);
            return new Date().toISOString();
        }
    }

    static filterLogs(logs: LogEntry[], filter: LogFilter): LogEntry[] {
        return logs.filter(log => {
            const timestampDate = new Date(log.timestamp);

            if (filter.startDate && timestampDate < filter.startDate) {
                return false;
            }

            if (filter.endDate && timestampDate > filter.endDate) {
                return false;
            }

            if (filter.level && log.level.toUpperCase() !== filter.level.toUpperCase()) {
                return false;
            }

            if (filter.source && log.source && !log.source.includes(filter.source)) {
                return false;
            }

            if (filter.searchTerm) {
                const searchLower = filter.searchTerm.toLowerCase();
                return (
                    log.message.toLowerCase().includes(searchLower) ||
                    (log.source && log.source.toLowerCase().includes(searchLower)) ||
                    (log.stackTrace && log.stackTrace.toLowerCase().includes(searchLower))
                );
            }

            return true;
        });
    }

    static calculateStats(logs: LogEntry[]): LogStats {
        const stats: LogStats = {
            totalEntries: logs.length,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            sourcesDistribution: {},
            timeDistribution: {}
        };

        logs.forEach(log => {
            // Count by level
            switch (log.level.toUpperCase()) {
                case 'ERROR':
                    stats.errorCount++;
                    break;
                case 'WARN':
                case 'WARNING':
                    stats.warningCount++;
                    break;
                case 'INFO':
                    stats.infoCount++;
                    break;
            }

            // Count by source
            if (log.source) {
                stats.sourcesDistribution[log.source] =
                    (stats.sourcesDistribution[log.source] || 0) + 1;
            }

            // Group by hour for time distribution
            const hour = new Date(log.timestamp)
                .toISOString()
                .split('T')[0] + 'T' +
                new Date(log.timestamp)
                    .getHours()
                    .toString()
                    .padStart(2, '0');

            stats.timeDistribution[hour] =
                (stats.timeDistribution[hour] || 0) + 1;
        });

        return stats;
    } static async parseFile(file: File): Promise<LogEntry[]> {
        // Try parsing as CSV first
        if (file.name.toLowerCase().endsWith('.csv')) {
            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        try {
                            const entries = results.data
                                .map((row: any): LogEntry | null => {
                                    try {
                                        return {
                                            timestamp: this.normalizeTimestamp(row.timestamp || row.time || row.date || new Date().toISOString()),
                                            level: (row.level || row.severity || row.type || 'UNKNOWN').toUpperCase(),
                                            message: row.message || row.msg || row.log || '',
                                            source: row.source || row.logger || row.class,
                                            stackTrace: row.stackTrace || row.stack || row.exception,
                                            additionalInfo: this.parseAdditionalInfo(row)
                                        };
                                    } catch (error) {
                                        console.warn('Error parsing CSV row:', error, row);
                                        return null;
                                    }
                                })
                                .filter((entry): entry is LogEntry => entry !== null);

                            resolve(entries);
                        } catch (err) {
                            const error = err as Error;
                            reject(new Error(`Failed to parse CSV: ${error.message}`));
                        }
                    },
                    error: (error) => reject(new Error(`CSV parsing error: ${error.message}`))
                });
            });
        }

        // For other file types, read as text and parse line by line
        try {
            const content = await file.text();
            return this.parseLogContent(content);
        } catch (err) {
            const error = err as Error;
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    private static parseAdditionalInfo(row: any): Record<string, any> {
        const additionalInfo: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
            if (!['timestamp', 'time', 'date', 'level', 'severity', 'type', 'message', 'msg', 'log', 'source', 'logger', 'class', 'stackTrace', 'stack', 'exception'].includes(key)) {
                additionalInfo[key] = value;
            }
        }
        return additionalInfo;
    }
}
